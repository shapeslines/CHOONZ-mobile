import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { RuntimeConfig } from '@/lib/config';
import { ChoonzClientError } from '@/lib/errors';
import { fixtureUser } from '@/lib/fixtures';
import {
  createChoonzSupabaseClient,
  resolvePublicSupabaseCredentials,
  type PublicSupabaseCredentials,
} from '@/lib/supabase';

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'fixture'
  | 'configuration';

export interface AuthIdentity {
  id: string;
  email: string | null;
}

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: AuthIdentity | null;
  configurationIssue: string | null;
  getAccessToken: () => Promise<string | null>;
  invalidateSession: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const unavailable = async (): Promise<void> => {
  throw new ChoonzClientError('configuration', 'Supabase sign-in is not configured.');
};

const AuthContext = createContext<AuthContextValue>({
  status: 'configuration',
  session: null,
  user: null,
  configurationIssue: 'Auth provider is unavailable.',
  getAccessToken: async () => null,
  invalidateSession: async () => undefined,
  signInWithPassword: unavailable,
  signOut: async () => undefined,
});

function identityFromSession(session: Session | null): AuthIdentity | null {
  return session
    ? { id: session.user.id, email: session.user.email ?? null }
    : null;
}

function lifecycleRefresh(client: SupabaseClient): () => void {
  const updateAutoRefresh = (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      client.auth.startAutoRefresh();
      return;
    }
    client.auth.stopAutoRefresh();
  };
  updateAutoRefresh(AppState.currentState);
  const subscription = AppState.addEventListener('change', updateAutoRefresh);
  return () => {
    subscription.remove();
    client.auth.stopAutoRefresh();
  };
}

const fixtureValue: AuthContextValue = {
  status: 'fixture',
  session: null,
  user: { id: String(fixtureUser.id), email: fixtureUser.email },
  configurationIssue: null,
  getAccessToken: async () => null,
  invalidateSession: async () => undefined,
  signInWithPassword: unavailable,
  signOut: async () => undefined,
};

export function AuthProvider({
  config,
  children,
}: {
  config: RuntimeConfig;
  children: React.ReactNode;
}) {
  const credentials = useMemo(() => resolvePublicSupabaseCredentials(config), [config]);

  if (config.mode === 'fixtures') {
    return <AuthContext.Provider value={fixtureValue}>{children}</AuthContext.Provider>;
  }
  if (config.mode === 'invalid' || !credentials) {
    const value: AuthContextValue = {
      ...fixtureValue,
      status: 'configuration',
      user: null,
      configurationIssue:
        config.configurationIssue ??
        'Supabase URL and a public publishable key are required for sign-in.',
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  return <LiveAuthProvider credentials={credentials}>{children}</LiveAuthProvider>;
}

function LiveAuthProvider({
  credentials,
  children,
}: {
  credentials: PublicSupabaseCredentials;
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createChoonzSupabaseClient(credentials), [credentials]);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) {
        return;
      }
      setSession(error ? null : data.session);
      setStatus(error || !data.session ? 'unauthenticated' : 'authenticated');
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!alive) {
        return;
      }
      setSession(nextSession);
      setStatus(nextSession ? 'authenticated' : 'unauthenticated');
    });
    const stopLifecycleRefresh = lifecycleRefresh(supabase);
    return () => {
      alive = false;
      data.subscription.unsubscribe();
      stopLifecycleRefresh();
    };
  }, [supabase]);

  const getAccessToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    return error ? null : data.session?.access_token ?? null;
  }, [supabase]);

  const invalidateSession = useCallback(async () => {
    setSession(null);
    setStatus('unauthenticated');
    await supabase.auth.signOut({ scope: 'local' });
  }, [supabase]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new ChoonzClientError('authentication', error.message);
      }
    },
    [supabase],
  );

  const user = useMemo(() => identityFromSession(session), [session]);
  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user,
      configurationIssue: null,
      getAccessToken,
      invalidateSession,
      signInWithPassword,
      signOut: invalidateSession,
    }),
    [getAccessToken, invalidateSession, session, signInWithPassword, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
