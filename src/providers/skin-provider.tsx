import { createContext, useContext, useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { errorMessage } from '@/lib/errors';
import { mySkinsQueryKey, protectedQueryScope } from '@/lib/protected-queries';
import { resolveLoadoutTheme, type ResolvedThemeTokens } from '@/lib/skins';
import type { MySkins, SkinCatalog, SkinSelectionUpdateInput, SkinUnlockOutcome } from '@/lib/types';
import { tokens } from '@/ui/tokens';
import { useChoonzApi } from '@/providers/api-provider';
import { useAuth } from '@/providers/auth-provider';

interface SkinContextValue {
  catalog: SkinCatalog | undefined;
  mySkins: MySkins | undefined;
  theme: ResolvedThemeTokens;
  selectSkin: (input: SkinSelectionUpdateInput) => void;
  selecting: boolean;
  selectError: string | null;
  /** M-S3: ask the backend to unlock an earnable skin; the server is the only verifier. */
  unlockSkin: (skinId: string) => void;
  /** Skin id currently being unlocked, or null. */
  unlocking: string | null;
  /** Last server report per skin id (granted / condition_not_met / revoked). */
  unlockReports: Record<string, SkinUnlockOutcome>;
  unlockError: string | null;
}

const SkinContext = createContext<SkinContextValue>({
  catalog: undefined,
  mySkins: undefined,
  theme: tokens,
  selectSkin: () => undefined,
  selecting: false,
  selectError: null,
  unlockSkin: () => undefined,
  unlocking: null,
  unlockReports: {},
  unlockError: null,
});

/**
 * M-S2: loads the skin catalog + the user's loadout, exposes the resolved
 * render theme, and applies selection mutations optimistically with
 * rollback. M-S3: earnable unlocks are never optimistic — the report comes
 * back from the server and the loadout is re-fetched. The backend stays the
 * authority; the theme is render-only.
 */
export function SkinProvider({ children }: { children: React.ReactNode }) {
  const api = useChoonzApi();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const scope = protectedQueryScope(auth.status, auth.user?.id);
  const enabled = scope !== null;
  const [unlockReports, setUnlockReports] = useState<Record<string, SkinUnlockOutcome>>({});

  const catalogQuery = useQuery({
    queryKey: ['skins', 'catalog'],
    queryFn: () => api.getSkins(),
    enabled,
    staleTime: 5 * 60_000,
  });

  const mySkinsKey = mySkinsQueryKey(scope ?? 'inactive');
  const mySkinsQuery = useQuery({
    queryKey: mySkinsKey,
    queryFn: () => api.getMySkins(),
    enabled,
  });

  const select = useMutation({
    mutationFn: (input: SkinSelectionUpdateInput) => api.updateMySkins(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: mySkinsKey });
      const previous = queryClient.getQueryData<MySkins>(mySkinsKey);
      if (previous) {
        queryClient.setQueryData<MySkins>(mySkinsKey, {
          ...previous,
          selection: { ...previous.selection, [input.kind]: input.skin_id },
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(mySkinsKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: mySkinsKey });
    },
  });

  const unlock = useMutation({
    mutationFn: (skinId: string) => api.unlockSkin(skinId),
    onSuccess: (outcome, skinId) => {
      setUnlockReports((previous) => ({ ...previous, [skinId]: outcome }));
      if (outcome.status === 'granted') {
        void queryClient.invalidateQueries({ queryKey: mySkinsKey });
      }
    },
  });

  const theme = useMemo(
    () => resolveLoadoutTheme(catalogQuery.data ?? { schema_version: '', catalog_hash: '', count: 0, skins: [] }, mySkinsQuery.data?.selection),
    [catalogQuery.data, mySkinsQuery.data],
  );

  const value = useMemo(
    () => ({
      catalog: catalogQuery.data,
      mySkins: mySkinsQuery.data,
      theme,
      selectSkin: (input: SkinSelectionUpdateInput) => select.mutate(input),
      selecting: select.isPending,
      selectError: select.isError ? 'Could not update the skin selection.' : null,
      unlockSkin: (skinId: string) => unlock.mutate(skinId),
      unlocking: unlock.isPending ? (unlock.variables ?? null) : null,
      unlockReports,
      unlockError: unlock.isError ? `Could not unlock the skin: ${errorMessage(unlock.error)}` : null,
    }),
    [catalogQuery.data, mySkinsQuery.data, theme, select, unlock, unlockReports],
  );

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
}

export function useSkins(): SkinContextValue {
  return useContext(SkinContext);
}
