import { createContext, useContext, useMemo } from 'react';

import { ChoonzApiClient, type ChoonzApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useRuntimeConfig } from '@/providers/runtime-config-provider';

const ApiContext = createContext<ChoonzApi | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const config = useRuntimeConfig();
  const { getAccessToken, invalidateSession } = useAuth();
  const client = useMemo(
    () =>
      new ChoonzApiClient({
        config,
        getAccessToken,
        onUnauthorized: invalidateSession,
      }),
    [config, getAccessToken, invalidateSession],
  );

  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useChoonzApi(): ChoonzApi {
  const client = useContext(ApiContext);
  if (!client) {
    throw new Error('useChoonzApi must be used inside ApiProvider.');
  }
  return client;
}
