import type { ClientFailureKind } from '@/lib/errors';
import type { Loadout, Match, MatchStatus, Toon } from '@/lib/types';

export type FightPhase = 'setup' | MatchStatus;
export type FightCommand =
  | 'selectToon'
  | 'createToon'
  | 'selectLoadout'
  | 'createLoadout'
  | 'createMatch'
  | 'start'
  | 'light'
  | 'heavy'
  | 'special'
  | 'block'
  | 'tick'
  | 'pause'
  | 'resume'
  | 'complete'
  | 'cancel'
  | 'rematch'
  | 'returnToSetup';

export interface FightSelection {
  toon: Toon | null;
  loadout: Loadout | null;
  gel: string;
  fighterId: string;
  stageId: string;
}

export interface FightFailure {
  message: string;
  kind: ClientFailureKind | 'workflow';
  status?: number;
}

export interface FightWorkflowState {
  selection: FightSelection;
  match: Match | null;
  pendingCommand: FightCommand | null;
  error: FightFailure | null;
}

export class IllegalFightCommandError extends Error {
  constructor(command: FightCommand, phase: FightPhase) {
    super(`${command} is not legal while the fight is ${phase}.`);
    this.name = 'IllegalFightCommandError';
  }
}

export function createFightWorkflow(): FightWorkflowState {
  return {
    selection: {
      toon: null,
      loadout: null,
      gel: 'sodium',
      fighterId: 'AXEL',
      stageId: 'rooftop',
    },
    match: null,
    pendingCommand: null,
    error: null,
  };
}

export function phaseOf(state: FightWorkflowState): FightPhase {
  return state.match?.status ?? 'setup';
}

export function legalCommands(phase: FightPhase): readonly FightCommand[] {
  switch (phase) {
    case 'setup':
      return ['selectToon', 'createToon', 'selectLoadout', 'createLoadout', 'createMatch'];
    case 'ready':
      return ['start', 'cancel'];
    case 'active':
      return ['light', 'heavy', 'special', 'block', 'tick', 'pause', 'complete', 'cancel'];
    case 'paused':
      return ['resume', 'complete', 'cancel'];
    case 'completed':
      return ['rematch', 'returnToSetup'];
    case 'cancelled':
      return ['returnToSetup'];
  }
}

export function isLegalCommand(state: FightWorkflowState, command: FightCommand): boolean {
  return state.pendingCommand === null && legalCommands(phaseOf(state)).includes(command);
}

export function beginCommand(
  state: FightWorkflowState,
  command: FightCommand,
): FightWorkflowState {
  const phase = phaseOf(state);
  if (!isLegalCommand(state, command)) {
    throw new IllegalFightCommandError(command, phase);
  }
  return { ...state, pendingCommand: command, error: null };
}

export function selectToon(state: FightWorkflowState, toon: Toon | null): FightWorkflowState {
  if (!isLegalCommand(state, 'selectToon')) {
    throw new IllegalFightCommandError('selectToon', phaseOf(state));
  }
  return {
    ...state,
    selection: { ...state.selection, toon, loadout: null },
    error: null,
  };
}

export function selectLoadout(
  state: FightWorkflowState,
  loadout: Loadout | null,
  toon: Toon | null = state.selection.toon,
): FightWorkflowState {
  if (!isLegalCommand(state, 'selectLoadout')) {
    throw new IllegalFightCommandError('selectLoadout', phaseOf(state));
  }
  return {
    ...state,
    selection: {
      ...state.selection,
      loadout,
      toon: loadout ? toon : state.selection.toon,
      gel: loadout?.gel ?? state.selection.gel,
      fighterId: loadout?.fighter_id ?? state.selection.fighterId,
    },
    error: null,
  };
}

export function selectMatchOptions(
  state: FightWorkflowState,
  options: Pick<FightSelection, 'gel' | 'fighterId' | 'stageId'>,
): FightWorkflowState {
  if (!isLegalCommand(state, 'selectToon')) {
    throw new IllegalFightCommandError('selectToon', phaseOf(state));
  }
  return { ...state, selection: { ...state.selection, ...options }, error: null };
}

export function confirmMatch(state: FightWorkflowState, match: Match): FightWorkflowState {
  return {
    ...state,
    match,
    pendingCommand: null,
    error: null,
  };
}

export function settleFailure(
  state: FightWorkflowState,
  failure: FightFailure,
): FightWorkflowState {
  return { ...state, pendingCommand: null, error: failure };
}

export function confirmCommand(state: FightWorkflowState): FightWorkflowState {
  return { ...state, pendingCommand: null, error: null };
}

export function returnToSetup(state: FightWorkflowState): FightWorkflowState {
  const phase = phaseOf(state);
  if (!isLegalCommand(state, 'returnToSetup')) {
    throw new IllegalFightCommandError('returnToSetup', phase);
  }
  return {
    ...state,
    match: null,
    pendingCommand: null,
    error: null,
  };
}
