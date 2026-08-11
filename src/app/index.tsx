import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/lib/errors';
import { useChoonzApi } from '@/providers/api-provider';
import { useAuth } from '@/providers/auth-provider';
import { useRuntimeConfig } from '@/providers/runtime-config-provider';
import { AppScreen, BodyText, Panel, PanelTitle } from '@/ui/app-screen';
import { tokens } from '@/ui/tokens';

export default function StatusScreen() {
  const api = useChoonzApi();
  const auth = useAuth();
  const config = useRuntimeConfig();
  const health = useQuery({ queryKey: ['health'], queryFn: () => api.getHealth() });

  return (
    <AppScreen title="STATUS / HOME">
      <Panel>
        <PanelTitle>SERVICE LINK</PanelTitle>
        {health.isPending ? <BodyText>Checking CHOONZ service…</BodyText> : null}
        {health.isError ? <Failure detail={errorMessage(health.error)} /> : null}
        {health.data ? (
          <View style={styles.grid}>
            <Readout label="STATUS" value={health.data.status.toUpperCase()} />
            <Readout label="SOURCE" value={health.data.env.toUpperCase()} />
            <Readout label="LOOP" value={String(health.data.engine_loop)} />
            <Readout label="VERSION" value={health.data.version} />
          </View>
        ) : null}
      </Panel>

      <Panel>
        <PanelTitle>ACCESS</PanelTitle>
        <BodyText>
          {auth.status === 'fixture'
            ? 'Fixture mode is local and intentionally has no live bearer session.'
            : auth.status === 'authenticated'
              ? `Signed in as ${auth.user?.email ?? auth.user?.id ?? 'CHOONZ user'}.`
              : auth.status === 'loading'
                ? 'Restoring a secure session…'
                : 'Sign in on Profile to read the live catalog.'}
        </BodyText>
        {config.configurationIssue ? <Failure detail={config.configurationIssue} /> : null}
      </Panel>

      <Panel>
        <PanelTitle>PRACTICE LOOP</PanelTitle>
        <BodyText>
          Select a Toon and loadout, then run the review-only P1 practice loop with confirmed CHOONZ snapshots.
        </BodyText>
        <Link href="/fight" asChild>
          <Pressable accessibilityLabel="open-fight" accessibilityRole="button" style={styles.fightButton}>
            <Text style={styles.fightButtonText}>OPEN FIGHT</Text>
          </Pressable>
        </Link>
      </Panel>
    </AppScreen>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readout}>
      <Text style={styles.readoutLabel}>{label}</Text>
      <Text style={styles.readoutValue}>{value}</Text>
    </View>
  );
}

function Failure({ detail }: { detail: string }) {
  return <Text style={styles.failure}>{detail}</Text>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  readout: {
    backgroundColor: tokens.background,
    borderColor: tokens.border,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    flexGrow: 1,
    minWidth: '45%',
    padding: 8,
  },
  readoutLabel: {
    color: tokens.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  readoutValue: {
    color: tokens.text,
    fontSize: 14,
    fontWeight: '800',
  },
  failure: {
    color: tokens.danger,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21,
  },
  fightButton: {
    alignItems: 'center',
    backgroundColor: tokens.accent,
    borderColor: tokens.black,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    paddingVertical: 12,
  },
  fightButtonText: {
    color: tokens.black,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
