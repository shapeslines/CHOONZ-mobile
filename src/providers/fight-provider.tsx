import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { ChoonzClientError, errorMessage } from '@/lib/errors';
import {
  beginCommand,
  confirmCommand,
  confirmMatch,
  createFightWorkflow,
  type FightCommand,
  type FightFailure,
  type FightWorkflowState,
  returnToSetup,
  selectLoadout,
  selectMatchOptions,
  selectToon,
  settleFailure,
} from '@/lib/fight-machine';
import { fightQueryKey, protectedQueryScope } from '@/lib/protected-queries';
import type {
  FightAction,
  Loadout,
  LoadoutCreateInput,
  Match,
  MatchCreateInput,
  MatchEngine,
  MatchState,
  Toon,
  ToonCreateInput,
} from '@/lib/types';
import { useChoonzApi } from '@/providers/api-provider';
import { useAuth } from '@/providers/auth-provider';

interface FightContextValue {
  accessEnabled: boolean;
  workflow: FightWorkflowState;
  toons: Toon[];
  loadouts: Loadout[];
  gels: string[];
  fighters: string[];
  stages: string[];
  state: MatchState | null;
  loading: boolean;
  queryError: string | null;
  selectToonById: (toonId: number | null) => void;
  selectLoadoutById: (loadoutId: number | null) => void;
  setMatchOptions: (options: {
    gel?: string;
    fighterId?: string;
    stageId?: string;
    engine?: MatchEngine;
  }) => void;
  createToon: (input: ToonCreateInput) => Promise<void>;
  createLoadout: (input: LoadoutCreateInput) => Promise<void>;
  createMatch: () => Promise<void>;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  complete: () => Promise<void>;
  cancel: () => Promise<void>;
  tick: () => Promise<void>;
  act: (action: FightAction) => Promise<void>;
  rematch: () => Promise<void>;
  setup: () => void;
}

const unavailable = async (): Promise<void> => undefined;
const unavailableSet = (): void => undefined;

const FightContext = createContext<FightContextValue>({
  accessEnabled: false,
  workflow: createFightWorkflow(),
  toons: [],
  loadouts: [],
  gels: [],
  fighters: [],
  stages: [],
  state: null,
  loading: false,
  queryError: null,
  selectToonById: unavailableSet,
  selectLoadoutById: unavailableSet,
  setMatchOptions: unavailableSet,
  createToon: unavailable,
  createLoadout: unavailable,
  createMatch: unavailable,
  start: unavailable,
  pause: unavailable,
  resume: unavailable,
  complete: unavailable,
  cancel: unavailable,
  tick: unavailable,
  act: unavailable,
  rematch: unavailable,
  setup: unavailableSet,
});

function failureFrom(reason: unknown): FightFailure {
  if (reason instanceof ChoonzClientError) {
    return { kind: reason.kind, message: reason.message, status: reason.status };
  }
  return { kind: 'response', message: errorMessage(reason) };
}

function queryRetry(reason: unknown): boolean {
  return !(reason instanceof ChoonzClientError && (reason.status === 401 || reason.status === 403));
}

export function FightProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const scope = protectedQueryScope(auth.status, auth.user?.id);

  // A scope change remounts the session owner so a prior user's local setup
  // selection cannot survive centralized protected-cache cleanup.
  return (
    <FightSessionProvider key={scope ?? 'inactive'} scope={scope}>
      {children}
    </FightSessionProvider>
  );
}

function FightSessionProvider({
  children,
  scope,
}: {
  children: React.ReactNode;
  scope: string | null;
}) {
  const api = useChoonzApi();
  const queryClient = useQueryClient();
  const accessEnabled = scope !== null;
  const queryScope = scope ?? 'inactive';
  const [workflow, setWorkflow] = useState(createFightWorkflow);
  const workflowRef = useRef(workflow);
  const inFlight = useRef(false);

  const replaceWorkflow = useCallback((next: FightWorkflowState) => {
    workflowRef.current = next;
    setWorkflow(next);
  }, []);

  const toonsQuery = useQuery({
    queryKey: fightQueryKey(queryScope, 'toons'),
    queryFn: () => api.getToons(),
    enabled: accessEnabled,
    retry: queryRetry,
  });
  const loadoutsQuery = useQuery({
    queryKey: fightQueryKey(queryScope, 'loadouts'),
    queryFn: () => api.getLoadouts(),
    enabled: accessEnabled,
    retry: queryRetry,
  });
  const gelsQuery = useQuery({
    queryKey: fightQueryKey(queryScope, 'gels'),
    queryFn: () => api.getGels(),
    enabled: accessEnabled,
    retry: queryRetry,
  });
  const fightersQuery = useQuery({
    queryKey: fightQueryKey(queryScope, 'fighters'),
    queryFn: () => api.getFighters(),
    enabled: accessEnabled,
    retry: queryRetry,
  });
  const stagesQuery = useQuery({
    queryKey: fightQueryKey(queryScope, 'stages'),
    queryFn: () => api.getStages(),
    enabled: accessEnabled,
    retry: queryRetry,
  });
  const matchId = workflow.match?.id ?? null;
  const matchQuery = useQuery({
    queryKey: fightQueryKey(queryScope, 'match', String(matchId ?? 'inactive')),
    queryFn: () => api.getMatch(matchId!),
    enabled: accessEnabled && matchId !== null,
    retry: queryRetry,
  });
  const stateQuery = useQuery({
    queryKey: fightQueryKey(queryScope, 'state', String(matchId ?? 'inactive')),
    queryFn: () => api.getMatchState(matchId!),
    enabled: accessEnabled && matchId !== null && workflow.match?.status !== 'cancelled',
    retry: queryRetry,
  });

  useEffect(() => {
    if (
      matchQuery.data &&
      workflowRef.current.pendingCommand === null &&
      workflowRef.current.match?.id === matchQuery.data.id
    ) {
      replaceWorkflow(confirmMatch(workflowRef.current, matchQuery.data));
    }
  }, [matchQuery.data, replaceWorkflow]);

  const invalidateMatch = useCallback(
    async (id: number) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: fightQueryKey(queryScope, 'match', String(id)) }),
        queryClient.invalidateQueries({ queryKey: fightQueryKey(queryScope, 'state', String(id)) }),
      ]);
    },
    [queryClient, queryScope],
  );

  const settleApiFailure = useCallback(
    async (reason: unknown) => {
      const failure = failureFrom(reason);
      const current = workflowRef.current;
      if (failure.status === 404) {
        const missingMatchId = current.match?.id;
        const selection = { ...current.selection };
        if (current.pendingCommand === 'createToon' || current.pendingCommand === 'selectToon') {
          selection.toon = null;
          selection.loadout = null;
        }
        if (current.pendingCommand === 'createLoadout' || current.pendingCommand === 'selectLoadout') {
          selection.loadout = null;
        }
        replaceWorkflow(settleFailure({ ...current, selection, match: null }, failure));
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: fightQueryKey(queryScope, 'toons') }),
          queryClient.invalidateQueries({ queryKey: fightQueryKey(queryScope, 'loadouts') }),
          ...(missingMatchId === undefined ? [] : [invalidateMatch(missingMatchId)]),
        ]);
        return;
      }
      if (failure.status === 409 && current.match) {
        replaceWorkflow(settleFailure(current, failure));
        await invalidateMatch(current.match.id);
        return;
      }
      // A 401 has already invoked the centralized auth finalizer in the API client.
      // A 403 never retries and all other failures preserve confirmed snapshots.
      replaceWorkflow(settleFailure(current, failure));
    },
    [invalidateMatch, queryClient, queryScope, replaceWorkflow],
  );

  const run = useCallback(
    async <T,>(
      command: FightCommand,
      operation: () => Promise<T>,
      onSuccess: (value: T) => Promise<void> | void,
    ): Promise<void> => {
      if (inFlight.current) {
        return;
      }
      try {
        replaceWorkflow(beginCommand(workflowRef.current, command));
      } catch (reason) {
        replaceWorkflow(settleFailure(workflowRef.current, failureFrom(reason)));
        return;
      }
      inFlight.current = true;
      try {
        const value = await operation();
        await onSuccess(value);
      } catch (reason) {
        await settleApiFailure(reason);
      } finally {
        inFlight.current = false;
      }
    },
    [replaceWorkflow, settleApiFailure],
  );

  const selectToonById = useCallback(
    (toonId: number | null) => {
      const toon = toonsQuery.data?.find((candidate) => candidate.id === toonId) ?? null;
      try {
        replaceWorkflow(selectToon(workflowRef.current, toon));
      } catch (reason) {
        replaceWorkflow(settleFailure(workflowRef.current, failureFrom(reason)));
      }
    },
    [replaceWorkflow, toonsQuery.data],
  );

  const selectLoadoutById = useCallback(
    (loadoutId: number | null) => {
      const loadout = loadoutsQuery.data?.find((candidate) => candidate.id === loadoutId) ?? null;
      try {
        const toon = loadout
          ? toonsQuery.data?.find((candidate) => candidate.id === loadout.toon_id) ?? null
          : workflowRef.current.selection.toon;
        replaceWorkflow(selectLoadout(workflowRef.current, loadout, toon));
      } catch (reason) {
        replaceWorkflow(settleFailure(workflowRef.current, failureFrom(reason)));
      }
    },
    [loadoutsQuery.data, replaceWorkflow, toonsQuery.data],
  );

  const setMatchOptions = useCallback(
    (options: { gel?: string; fighterId?: string; stageId?: string; engine?: MatchEngine }) => {
      const current = workflowRef.current;
      try {
        replaceWorkflow(
          selectMatchOptions(current, {
            gel: options.gel ?? current.selection.gel,
            fighterId: options.fighterId ?? current.selection.fighterId,
            stageId: options.stageId ?? current.selection.stageId,
            engine: options.engine ?? current.selection.engine,
          }),
        );
      } catch (reason) {
        replaceWorkflow(settleFailure(current, failureFrom(reason)));
      }
    },
    [replaceWorkflow],
  );

  const createToon = useCallback(
    (input: ToonCreateInput) =>
      run('createToon', () => api.createToon(input), async (toon) => {
        queryClient.setQueryData<Toon[]>(fightQueryKey(queryScope, 'toons'), (previous = []) => [
          ...previous,
          toon,
        ]);
        replaceWorkflow(selectToon(confirmCommand(workflowRef.current), toon));
      }),
    [api, queryClient, queryScope, replaceWorkflow, run],
  );

  const createLoadout = useCallback(
    (input: LoadoutCreateInput) =>
      run('createLoadout', () => api.createLoadout(input), async (loadout) => {
        queryClient.setQueryData<Loadout[]>(fightQueryKey(queryScope, 'loadouts'), (previous = []) => [
          ...previous,
          loadout,
        ]);
        replaceWorkflow(
          selectLoadout(
            confirmCommand(workflowRef.current),
            loadout,
            workflowRef.current.selection.toon,
          ),
        );
      }),
    [api, queryClient, queryScope, replaceWorkflow, run],
  );

  const createMatch = useCallback(() => {
    const selection = workflowRef.current.selection;
    const input: MatchCreateInput = {
      p1_toon_id: selection.toon?.id ?? null,
      p1_loadout_id: selection.loadout?.id ?? null,
      p1_gel: selection.gel,
      p1_fighter_id: selection.fighterId,
      stage_id: selection.stageId,
      seed: 0,
      // Setup-local request only. The engine the match actually runs is read
      // back from the confirmed `Match.engine`, never from this selection.
      engine: selection.engine,
    };
    return run('createMatch', () => api.createMatch(input), async (match) => {
      queryClient.setQueryData(fightQueryKey(queryScope, 'match', String(match.id)), match);
      replaceWorkflow(confirmMatch(workflowRef.current, match));
      await queryClient.invalidateQueries({ queryKey: fightQueryKey(queryScope, 'state', String(match.id)) });
    });
  }, [api, queryClient, queryScope, replaceWorkflow, run]);

  const withMatch = useCallback(
    (
      command: FightCommand,
      operation: (id: number) => Promise<Match>,
    ): Promise<void> => {
      const id = workflowRef.current.match?.id;
      if (id === undefined) {
        return run(command, async () => {
          throw new ChoonzClientError('response', 'Create a match before sending fight controls.', 409);
        }, async () => undefined);
      }
      return run(command, () => operation(id), async (match) => {
        queryClient.setQueryData(fightQueryKey(queryScope, 'match', String(match.id)), match);
        replaceWorkflow(confirmMatch(workflowRef.current, match));
        await invalidateMatch(match.id);
      });
    },
    [invalidateMatch, queryClient, queryScope, replaceWorkflow, run],
  );

  const start = useCallback(() => withMatch('start', (id) => api.startMatch(id)), [api, withMatch]);
  const pause = useCallback(() => withMatch('pause', (id) => api.pauseMatch(id)), [api, withMatch]);
  const resume = useCallback(() => withMatch('resume', (id) => api.resumeMatch(id)), [api, withMatch]);
  const complete = useCallback(
    () => withMatch('complete', (id) => api.completeMatch(id)),
    [api, withMatch],
  );
  const cancel = useCallback(
    () => withMatch('cancel', (id) => api.cancelMatch(id)),
    [api, withMatch],
  );
  const rematch = useCallback(
    () => withMatch('rematch', (id) => api.rematch(id)),
    [api, withMatch],
  );

  const withState = useCallback(
    (
      command: FightCommand,
      operation: (id: number) => Promise<MatchState>,
    ): Promise<void> => {
      const id = workflowRef.current.match?.id;
      if (id === undefined) {
        return run(command, async () => {
          throw new ChoonzClientError('response', 'Create a match before sending fight controls.', 409);
        }, async () => undefined);
      }
      return run(command, () => operation(id), async (state) => {
        queryClient.setQueryData(fightQueryKey(queryScope, 'state', String(id)), state);
        replaceWorkflow(confirmCommand(workflowRef.current));
        await queryClient.invalidateQueries({ queryKey: fightQueryKey(queryScope, 'match', String(id)) });
      });
    },
    [queryClient, queryScope, replaceWorkflow, run],
  );

  const tick = useCallback(() => withState('tick', (id) => api.tickMatch(id, { delta: 1 })), [api, withState]);
  const act = useCallback(
    (action: FightAction) => withState(action, (id) => api.actMatch(id, { action, side: 'p1', advance: true })),
    [api, withState],
  );

  const setup = useCallback(() => {
    try {
      replaceWorkflow(returnToSetup(workflowRef.current));
    } catch (reason) {
      replaceWorkflow(settleFailure(workflowRef.current, failureFrom(reason)));
    }
  }, [replaceWorkflow]);

  const queryResults = [
    toonsQuery,
    loadoutsQuery,
    gelsQuery,
    fightersQuery,
    stagesQuery,
    matchQuery,
    stateQuery,
  ];
  const loading = accessEnabled && queryResults.some((query) => query.isPending);
  const firstQueryError = accessEnabled ? queryResults.find((query) => query.isError)?.error : null;
  const queryError = firstQueryError ? errorMessage(firstQueryError) : null;
  const value: FightContextValue = {
      accessEnabled,
      workflow,
      toons: toonsQuery.data ?? [],
      loadouts: loadoutsQuery.data ?? [],
      gels: (gelsQuery.data ?? []).map((gel) => gel.id),
      fighters: (fightersQuery.data ?? []).map((fighter) => fighter.id),
      stages: (stagesQuery.data ?? []).map((stage) => stage.id),
      state: stateQuery.data ?? null,
      loading,
      queryError,
      selectToonById,
      selectLoadoutById,
      setMatchOptions,
      createToon,
      createLoadout,
      createMatch,
      start,
      pause,
      resume,
      complete,
      cancel,
      tick,
      act,
      rematch,
      setup,
  };

  return <FightContext.Provider value={value}>{children}</FightContext.Provider>;
}

export function useFight(): FightContextValue {
  return useContext(FightContext);
}
