import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { errorMessage } from '@/lib/errors';
import { protectedQueryKey, protectedQueryScope } from '@/lib/protected-queries';
import type { ChoonzUser } from '@/lib/types';
import { useChoonzApi } from '@/providers/api-provider';
import { useAuth } from '@/providers/auth-provider';
import { AppScreen, BodyText, Panel, PanelTitle } from '@/ui/app-screen';
import { tokens } from '@/ui/tokens';

export default function ProfileScreen() {
  const api = useChoonzApi();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const queryScope = protectedQueryScope(auth.status, auth.user?.id);
  const me = useQuery({
    queryKey: protectedQueryKey(queryScope ?? 'inactive', 'me'),
    queryFn: () => api.getMe(),
    enabled: queryScope !== null,
  });

  const signIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await auth.signInWithPassword(email.trim(), password);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen title="PROFILE / SIGN-IN">
      {auth.status === 'fixture' ? (
        <Panel>
          <PanelTitle>FIXTURE PROFILE</PanelTitle>
          <BodyText>{auth.user?.email ?? 'fixture@choonz.local'}</BodyText>
          <BodyText>Fixture mode never attempts Supabase sign-in or a live bearer request.</BodyText>
          <MeReadout
            data={me.data}
            pending={me.isPending}
            error={me.isError ? errorMessage(me.error) : null}
          />
        </Panel>
      ) : null}

      {auth.status === 'loading' ? (
        <Panel>
          <PanelTitle>SESSION</PanelTitle>
          <BodyText>Restoring your SecureStore session…</BodyText>
        </Panel>
      ) : null}

      {auth.status === 'configuration' ? (
        <Panel>
          <PanelTitle>AUTH CONFIGURATION REQUIRED</PanelTitle>
          <Text style={styles.error}>{auth.configurationIssue}</Text>
        </Panel>
      ) : null}

      {auth.status === 'authenticated' ? (
        <Panel>
          <PanelTitle>SIGNED IN</PanelTitle>
          <BodyText>{auth.user?.email ?? auth.user?.id ?? 'CHOONZ user'}</BodyText>
          <MeReadout
            data={me.data}
            pending={me.isPending}
            error={me.isError ? errorMessage(me.error) : null}
          />
          <Pressable onPress={() => void auth.signOut()} style={styles.button}>
            <Text style={styles.buttonText}>SIGN OUT</Text>
          </Pressable>
        </Panel>
      ) : null}

      {auth.status === 'unauthenticated' ? (
        <Panel>
          <PanelTitle>EMAIL + PASSWORD</PanelTitle>
          <BodyText>Use the shared CHOONZ Supabase account. OAuth flows are not in this slice.</BodyText>
          <TextInput
            accessibilityLabel="email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={tokens.muted}
            style={styles.input}
            value={email}
          />
          <TextInput
            accessibilityLabel="password"
            autoCapitalize="none"
            autoComplete="current-password"
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={tokens.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable disabled={submitting} onPress={() => void signIn()} style={styles.button}>
            <Text style={styles.buttonText}>{submitting ? 'SIGNING IN…' : 'SIGN IN'}</Text>
          </Pressable>
        </Panel>
      ) : null}
    </AppScreen>
  );
}

function MeReadout({
  data,
  pending,
  error,
}: {
  data: ChoonzUser | undefined;
  pending: boolean;
  error: string | null;
}) {
  if (pending) {
    return <BodyText>Loading CHOONZ profile record…</BodyText>;
  }
  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }
  if (!data) {
    return null;
  }
  return (
    <BodyText>
      CHOONZ record #{data.id} · {data.display_name ?? data.email ?? 'unnamed fighter'}
    </BodyText>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: tokens.background,
    borderColor: tokens.border,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    color: tokens.text,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  button: {
    alignItems: 'center',
    backgroundColor: tokens.accent,
    borderColor: tokens.black,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    paddingVertical: 12,
  },
  buttonText: {
    color: tokens.black,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  error: {
    color: tokens.danger,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21,
  },
});
