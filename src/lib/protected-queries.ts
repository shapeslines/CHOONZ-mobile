import type { QueryClient } from '@tanstack/react-query';

export const PROTECTED_QUERY_PREFIX = ['protected'] as const;

export function protectedQueryScope(
  status: 'authenticated' | 'fixture' | 'loading' | 'unauthenticated' | 'configuration',
  userId: string | null | undefined,
): string | null {
  if (status === 'fixture') {
    return 'fixture';
  }
  return status === 'authenticated' && userId ? `user.${userId}` : null;
}

export function protectedQueryKey(scope: string, ...resource: string[]): readonly string[] {
  return [...PROTECTED_QUERY_PREFIX, scope, ...resource];
}

export function accountQueryKey(
  scope: string,
  resource: 'me' | 'connections',
): readonly string[] {
  return protectedQueryKey(scope, resource);
}

export function fightQueryKey(scope: string, ...resource: string[]): readonly string[] {
  return protectedQueryKey(scope, 'fight', ...resource);
}

/** Cancel first, but always remove protected data even if cancellation races or fails. */
export async function clearProtectedQueries(
  queryClient: Pick<QueryClient, 'cancelQueries' | 'removeQueries'>,
): Promise<void> {
  try {
    await queryClient.cancelQueries({ queryKey: PROTECTED_QUERY_PREFIX });
  } finally {
    queryClient.removeQueries({ queryKey: PROTECTED_QUERY_PREFIX });
  }
}
