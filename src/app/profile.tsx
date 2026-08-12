import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { errorMessage } from '@/lib/errors';
import { accountQueryKey, protectedQueryScope } from '@/lib/protected-queries';
import type { ChoonzUser } from '@/lib/types';
import { useChoonzApi } from '@/providers/api-provider';
import { useAuth } from '@/providers/auth-provider';
import { AppScreen, BodyText, Panel, PanelTitle } from '@/ui/app-screen';
import { tokens } from '@/ui/tokens';

export function AuthRecoveryGuidance() {
  return (
    <Panel>
      <PanelTitle>RECOVERY</PanelTitle>
      <BodyText>
        Account recovery is unavailable in this screen and build. No recovery action or provider
        flow is configured here; a user-reachable recovery path requires separate verification.
      </BodyText>
    </Panel>
  );
}

export interface ProfileContentProps {
  modeLabel: string;
  fixture: boolean;
  data: ChoonzUser | undefined;
  pending: boolean;
  queryError: string | null;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  onSave: () => void;
  saveDisabled: boolean;
  saving: boolean;
  saveError: string | null;
  canSignOut: boolean;
  signOutConfirming: boolean;
  signingOut: boolean;
  signOutError: string | null;
  onRequestSignOut: () => void;
  onCancelSignOut: () => void;
  onConfirmSignOut: () => void;
}

export function ProfileContent({
  modeLabel,
  fixture,
  data,
  pending,
  queryError,
  displayName,
  onDisplayNameChange,
  onSave,
  saveDisabled,
  saving,
  saveError,
  canSignOut,
  signOutConfirming,
  signingOut,
  signOutError,
  onRequestSignOut,
  onCancelSignOut,
  onConfirmSignOut,
}: ProfileContentProps) {
  const tooLong = displayName.trim().length > 120;
  return (
    <>
      <Panel>
        <PanelTitle>SESSION</PanelTitle>
        <BodyText>{modeLabel}</BodyText>
        {fixture ? (
          <BodyText>
            Fixture account changes stay on this device and reset with the fixture session.
          </BodyText>
        ) : null}
      </Panel>

      <Panel>
        <PanelTitle>CHOONZ PROFILE</PanelTitle>
        {pending ? <BodyText>Loading confirmed profile…</BodyText> : null}
        {queryError ? <Text style={styles.error}>{queryError}</Text> : null}
        {data ? (
          <>
            <BodyText>Record #{data.id}</BodyText>
            <BodyText>{data.email ?? 'No email returned by the identity provider.'}</BodyText>
            <TextInput
              accessibilityLabel="display-name"
              autoCapitalize="words"
              onChangeText={onDisplayNameChange}
              placeholder="Display name"
              placeholderTextColor={tokens.muted}
              style={styles.input}
              value={displayName}
            />
            <BodyText>{displayName.trim().length}/120 characters</BodyText>
            {tooLong ? <Text style={styles.error}>Display name must be 120 characters or fewer.</Text> : null}
            {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="save-display-name"
              disabled={saveDisabled}
              onPress={onSave}
              style={[styles.button, saveDisabled ? styles.buttonDisabled : null]}
            >
              <Text style={styles.buttonText}>{saving ? 'SAVING…' : 'SAVE DISPLAY NAME'}</Text>
            </Pressable>
            <Link href="/connections" asChild>
              <Pressable accessibilityRole="button" style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>VIEW CONNECTIONS</Text>
              </Pressable>
            </Link>
          </>
        ) : null}
      </Panel>

      {canSignOut ? (
        <Panel>
          <PanelTitle>LOCAL SESSION</PanelTitle>
          <BodyText>Sign-out affects only the current device and local session.</BodyText>
          {signOutConfirming ? (
            <>
              <Text style={styles.warning}>Confirm sign-out on this device?</Text>
              <View style={styles.row}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="cancel-sign-out"
                  disabled={signingOut}
                  onPress={onCancelSignOut}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>CANCEL</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="confirm-sign-out"
                  disabled={signingOut}
                  onPress={onConfirmSignOut}
                  style={styles.dangerButton}
                >
                  <Text style={styles.buttonText}>{signingOut ? 'SIGNING OUT…' : 'CONFIRM'}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="request-sign-out"
              onPress={onRequestSignOut}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>SIGN OUT THIS DEVICE</Text>
            </Pressable>
          )}
          {signOutError ? <Text style={styles.error}>{signOutError}</Text> : null}
        </Panel>
      ) : null}
    </>
  );
}

export default function ProfileScreen() {
  const api = useChoonzApi();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState<string | null>(null);
  const [signOutConfirming, setSignOutConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const queryScope = protectedQueryScope(auth.status, auth.user?.id);
  const meKey = accountQueryKey(queryScope ?? 'inactive', 'me');
  const me = useQuery({
    queryKey: meKey,
    queryFn: () => api.getMe(),
    enabled: queryScope !== null,
  });
  const update = useMutation({
    mutationFn: (next: string | null) => api.updateMe({ display_name: next }),
    onSuccess: (confirmed) => {
      queryClient.setQueryData(meKey, confirmed);
      setDisplayNameDraft(null);
    },
  });

  const displayName = displayNameDraft ?? me.data?.display_name ?? '';
  const normalizedName = displayName.trim() || null;
  const saveDisabled =
    !me.data ||
    update.isPending ||
    displayName.trim().length > 120 ||
    normalizedName === me.data.display_name;

  const signIn = async () => {
    setSignInError(null);
    setSigningIn(true);
    try {
      await auth.signInWithPassword(email.trim(), password);
    } catch (reason) {
      setSignInError(errorMessage(reason));
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    setSignOutError(null);
    setSigningOut(true);
    try {
      await auth.signOut();
    } catch (reason) {
      setSignOutError(errorMessage(reason));
    } finally {
      setSigningOut(false);
      setSignOutConfirming(false);
    }
  };

  const accessEnabled = auth.status === 'fixture' || auth.status === 'authenticated';
  const modeLabel =
    auth.status === 'fixture'
      ? `FIXTURE / LOCAL ACCOUNT / ${auth.user?.email ?? 'fixture@choonz.local'}`
      : `API / AUTHENTICATED / ${auth.user?.email ?? auth.user?.id ?? 'CHOONZ user'}`;

  return (
    <AppScreen title="PROFILE / ACCOUNT">
      {accessEnabled ? (
        <ProfileContent
          modeLabel={modeLabel}
          fixture={auth.status === 'fixture'}
          data={me.data}
          pending={me.isPending}
          queryError={me.isError ? errorMessage(me.error) : null}
          displayName={displayName}
          onDisplayNameChange={setDisplayNameDraft}
          onSave={() => update.mutate(normalizedName)}
          saveDisabled={saveDisabled}
          saving={update.isPending}
          saveError={update.isError ? errorMessage(update.error) : null}
          canSignOut={auth.status === 'authenticated'}
          signOutConfirming={signOutConfirming}
          signingOut={signingOut}
          signOutError={signOutError}
          onRequestSignOut={() => setSignOutConfirming(true)}
          onCancelSignOut={() => setSignOutConfirming(false)}
          onConfirmSignOut={() => void signOut()}
        />
      ) : null}

      {auth.status === 'loading' ? (
        <Panel>
          <PanelTitle>SESSION</PanelTitle>
          <BodyText>Restoring the local session…</BodyText>
        </Panel>
      ) : null}

      {auth.status === 'configuration' ? (
        <Panel>
          <PanelTitle>AUTH CONFIGURATION REQUIRED</PanelTitle>
          <Text style={styles.error}>{auth.configurationIssue}</Text>
        </Panel>
      ) : null}

      {auth.status === 'unauthenticated' ? (
        <>
          <Panel>
            <PanelTitle>API / NO ACTIVE SESSION</PanelTitle>
            <BodyText>Sign in with the CHOONZ account configured for this build.</BodyText>
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
            {signInError ? <Text style={styles.error}>{signInError}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={signingIn}
              onPress={() => void signIn()}
              style={[styles.button, signingIn ? styles.buttonDisabled : null]}
            >
              <Text style={styles.buttonText}>{signingIn ? 'SIGNING IN…' : 'SIGN IN'}</Text>
            </Pressable>
          </Panel>
          <AuthRecoveryGuidance />
        </>
      ) : null}
    </AppScreen>
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
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    alignItems: 'center',
    backgroundColor: tokens.accent,
    borderColor: tokens.black,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  buttonDisabled: {
    backgroundColor: tokens.muted,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: tokens.danger,
    borderColor: tokens.black,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    flex: 1,
    paddingVertical: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: tokens.panelStrong,
    borderColor: tokens.border,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  buttonText: {
    color: tokens.black,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButtonText: {
    color: tokens.text,
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
  warning: {
    color: tokens.accent,
    fontSize: 14,
    fontWeight: '900',
  },
});
