import { createContext, useContext, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { mySkinsQueryKey, protectedQueryScope } from '@/lib/protected-queries';
import { resolveLoadoutTheme, type ResolvedThemeTokens } from '@/lib/skins';
import type { MySkins, SkinCatalog, SkinSelectionUpdateInput } from '@/lib/types';
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
}

const SkinContext = createContext<SkinContextValue>({
  catalog: undefined,
  mySkins: undefined,
  theme: tokens,
  selectSkin: () => undefined,
  selecting: false,
  selectError: null,
});

/**
 * M-S2: loads the skin catalog + the user's loadout, exposes the resolved
 * render theme, and applies selection mutations optimistically with
 * rollback. The backend stays the authority; the theme is render-only.
 */
export function SkinProvider({ children }: { children: React.ReactNode }) {
  const api = useChoonzApi();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const scope = protectedQueryScope(auth.status, auth.user?.id);
  const enabled = scope !== null;

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
    }),
    [catalogQuery.data, mySkinsQuery.data, theme, select],
  );

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
}

export function useSkins(): SkinContextValue {
  return useContext(SkinContext);
}
