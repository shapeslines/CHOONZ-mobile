import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/lib/errors';
import { accountQueryKey, protectedQueryScope } from '@/lib/protected-queries';
import type { ChoonzConnection } from '@/lib/types';
import { useChoonzApi } from '@/providers/api-provider';
import { useAuth } from '@/providers/auth-provider';
import { AppScreen, BodyText, Panel, PanelTitle } from '@/ui/app-screen';
import { tokens } from '@/ui/tokens';

export interface ConnectionsContentProps {
  fixture: boolean;
  data: ChoonzConnection[] | undefined;
  pending: boolean;
  queryError: string | null;
  confirmingClientId: string | null;
  revoking: boolean;
  revokeError: string | null;
  onRequestRevoke: (clientId: string) => void;
  onCancelRevoke: () => void;
  onConfirmRevoke: (clientId: string) => void;
}

export function ConnectionsContent({
  fixture,
  data,
  pending,
  queryError,
  confirmingClientId,
  revoking,
  revokeError,
  onRequestRevoke,
  onCancelRevoke,
  onConfirmRevoke,
}: ConnectionsContentProps) {
  return (
    <>
      <Panel>
        <PanelTitle>CONNECTED CLIENTS</PanelTitle>
        <BodyText>Review first-party consent records attached to this CHOONZ account.</BodyText>
        {fixture ? (
          <BodyText>
            Fixture connections are local deterministic data and reset with the fixture session.
          </BodyText>
        ) : null}
        {pending ? <BodyText>Loading confirmed connections…</BodyText> : null}
        {queryError ? <Text style={styles.error}>{queryError}</Text> : null}
        {revokeError ? <Text style={styles.error}>{revokeError}</Text> : null}
      </Panel>

      {data?.length === 0 ? (
        <Panel>
          <PanelTitle>NO CONNECTIONS</PanelTitle>
          <BodyText>No clients are connected to this account.</BodyText>
        </Panel>
      ) : null}

      {data?.map((connection) => {
        const confirming = confirmingClientId === connection.client_id;
        return (
          <Panel key={connection.client_id}>
            <PanelTitle>{connection.client_name}</PanelTitle>
            <BodyText>ID / {connection.client_id}</BodyText>
            <BodyText>SCOPES / {connection.scopes.join(', ') || 'none'}</BodyText>
            <BodyText>CONNECTED / {connection.created_at.slice(0, 10)}</BodyText>
            {confirming ? (
              <>
                <Text style={styles.warning}>Revoke this connection?</Text>
                <View style={styles.row}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`cancel-revoke-${connection.client_id}`}
                    accessibilityState={{ disabled: revoking }}
                    disabled={revoking}
                    onPress={onCancelRevoke}
                    style={[styles.secondaryButton, revoking && styles.disabledButton]}
                  >
                    <Text style={styles.secondaryButtonText}>CANCEL</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`confirm-revoke-${connection.client_id}`}
                    accessibilityState={{ disabled: revoking }}
                    disabled={revoking}
                    onPress={() => onConfirmRevoke(connection.client_id)}
                    style={[styles.dangerButton, revoking && styles.disabledButton]}
                  >
                    <Text style={styles.buttonText}>{revoking ? 'REVOKING…' : 'CONFIRM'}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`request-revoke-${connection.client_id}`}
                accessibilityState={{ disabled: revoking }}
                disabled={revoking}
                onPress={() => onRequestRevoke(connection.client_id)}
                style={[styles.secondaryButton, revoking && styles.disabledButton]}
              >
                <Text style={styles.secondaryButtonText}>REVOKE</Text>
              </Pressable>
            )}
          </Panel>
        );
      })}
    </>
  );
}

export default function ConnectionsScreen() {
  const api = useChoonzApi();
  const auth = useAuth();
  const [confirmingClientId, setConfirmingClientId] = useState<string | null>(null);
  const queryScope = protectedQueryScope(auth.status, auth.user?.id);
  const connections = useQuery({
    queryKey: accountQueryKey(queryScope ?? 'inactive', 'connections'),
    queryFn: () => api.getConnections(),
    enabled: queryScope !== null,
  });
  const revoke = useMutation({
    mutationFn: (clientId: string) => api.revokeConnection(clientId),
    onSuccess: async () => {
      setConfirmingClientId(null);
      await connections.refetch();
    },
  });
  const accessEnabled = auth.status === 'fixture' || auth.status === 'authenticated';

  return (
    <AppScreen title="PROFILE / CONNECTIONS">
      <Link href="/profile" asChild>
        <Pressable accessibilityRole="button" style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>BACK TO PROFILE</Text>
        </Pressable>
      </Link>
      {accessEnabled ? (
        <ConnectionsContent
          fixture={auth.status === 'fixture'}
          data={connections.data}
          pending={connections.isPending}
          queryError={connections.isError ? errorMessage(connections.error) : null}
          confirmingClientId={confirmingClientId}
          revoking={revoke.isPending}
          revokeError={revoke.isError ? errorMessage(revoke.error) : null}
          onRequestRevoke={setConfirmingClientId}
          onCancelRevoke={() => setConfirmingClientId(null)}
          onConfirmRevoke={(clientId) => revoke.mutate(clientId)}
        />
      ) : (
        <Panel>
          <PanelTitle>SESSION REQUIRED</PanelTitle>
          <BodyText>Connections require fixture mode or an authenticated API session.</BodyText>
        </Panel>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.55,
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
  dangerButton: {
    alignItems: 'center',
    backgroundColor: tokens.danger,
    borderColor: tokens.black,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    flex: 1,
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
