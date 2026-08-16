import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState } from 'react';

import { appConfig } from '@/lib/config';
import { ApiProvider } from '@/providers/api-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { FightProvider } from '@/providers/fight-provider';
import { RuntimeConfigProvider } from '@/providers/runtime-config-provider';
import { SkinProvider } from '@/providers/skin-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <SafeAreaProvider>
      <RuntimeConfigProvider config={appConfig}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider config={appConfig}>
            <ApiProvider>
              <SkinProvider>
                <FightProvider>{children}</FightProvider>
              </SkinProvider>
            </ApiProvider>
          </AuthProvider>
        </QueryClientProvider>
      </RuntimeConfigProvider>
    </SafeAreaProvider>
  );
}
