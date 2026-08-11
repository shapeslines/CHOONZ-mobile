import { createContext, useContext } from 'react';

import { appConfig, type RuntimeConfig } from '@/lib/config';

const RuntimeConfigContext = createContext<RuntimeConfig>(appConfig);

export function RuntimeConfigProvider({
  config = appConfig,
  children,
}: {
  config?: RuntimeConfig;
  children: React.ReactNode;
}) {
  return <RuntimeConfigContext.Provider value={config}>{children}</RuntimeConfigContext.Provider>;
}

export function useRuntimeConfig(): RuntimeConfig {
  return useContext(RuntimeConfigContext);
}
