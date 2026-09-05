import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { errorMessage } from '@/lib/errors';
import { mechanicsQueryKey, protectedQueryScope } from '@/lib/protected-queries';
import type {
  MechanicsEngineRevision,
  MechanicsReplayOverrides,
  MechanicsReplayReceipt,
  MechanicsScenarioList,
} from '@/lib/types';
import { useChoonzApi } from '@/providers/api-provider';
import { useAuth } from '@/providers/auth-provider';
import { useRuntimeConfig } from '@/providers/runtime-config-provider';
import { AppScreen, BodyText, Panel, PanelTitle } from '@/ui/app-screen';
import { tokens } from '@/ui/tokens';

export type LabAccess =
  | 'disabled'
  | 'fixture-required'
  | 'auth-required'
  | 'loading'
  | 'eligible';

/**
 * What the operator asked for, which is not what the server answered.
 * `server` sends no `engine_revision` at all and follows whatever the backend
 * defaults to (revision `2` since CHOONZ M5); `1` and `2` pin the request. The
 * header still prints the revision the server *declared*, so a pin that the
 * server does not honour is visible rather than assumed.
 */
export type LabRevisionSelection = 'server' | MechanicsEngineRevision;

export const LAB_REVISION_CHOICES: readonly LabRevisionSelection[] = ['server', '1', '2'];

export interface LabContentProps {
  access: LabAccess;
  revision: LabRevisionSelection;
  onSelectRevision: (revision: LabRevisionSelection) => void;
  scenarios: MechanicsScenarioList | null;
  scenariosPending: boolean;
  scenariosError: string | null;
  selectedScenarioId: string | null;
  onSelectScenario: (id: string) => void;
  receipt: MechanicsReplayReceipt | null;
  replayPending: boolean;
  replayError: string | null;
  onRunGolden: () => void;
  onRunOverride: (overrides: MechanicsReplayOverrides) => void;
}

export function LabContent({
  access,
  revision,
  onSelectRevision,
  scenarios,
  scenariosPending,
  scenariosError,
  selectedScenarioId,
  onSelectScenario,
  receipt,
  replayPending,
  replayError,
  onRunGolden,
  onRunOverride,
}: LabContentProps) {
  const [overrideSeed, setOverrideSeed] = useState('');

  if (access === 'disabled') {
    return (
      <AppScreen title="MECHANICS LAB">
        <Panel>
          <PanelTitle>MECHANICS LAB UNAVAILABLE</PanelTitle>
          <BodyText>
            The developer-only mechanics lab is disabled in this build. It requires an
            explicit non-production API configuration.
          </BodyText>
        </Panel>
      </AppScreen>
    );
  }

  if (access === 'fixture-required') {
    return (
      <AppScreen title="MECHANICS LAB">
        <Panel>
          <PanelTitle>API MODE REQUIRED</PanelTitle>
          <BodyText>
            API mode required. Fixture mode never replays or simulates mechanics and
            never reads a token, URL, or fetcher.
          </BodyText>
        </Panel>
      </AppScreen>
    );
  }

  if (access === 'auth-required') {
    return (
      <AppScreen title="MECHANICS LAB">
        <Panel>
          <PanelTitle>AUTHENTICATION REQUIRED</PanelTitle>
          <BodyText>Sign in on Profile to open the developer mechanics lab.</BodyText>
        </Panel>
      </AppScreen>
    );
  }

  if (access === 'loading') {
    return (
      <AppScreen title="MECHANICS LAB">
        <BodyText>Loading session…</BodyText>
      </AppScreen>
    );
  }

  const selectedSummary = selectedScenarioId
    ? scenarios?.scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null
    : null;
  const overrideSeedText = overrideSeed.trim();

  return (
    <AppScreen title="MECHANICS LAB">
      <Panel>
        <PanelTitle>DEVELOPER-ONLY SCENARIO CORPUS</PanelTitle>
        <BodyText>
          Replay reviewed golden scenarios through the backend engine. Only the server
          receipt is authoritative: this screen never recomputes a golden, reorders
          diffs, or predicts a verdict.
        </BodyText>
        {scenarios ? (
          <BodyText>
            schema {scenarios.schema_version} · corpus {scenarios.corpus_version} · engine{' '}
            {scenarios.engine_revision}
          </BodyText>
        ) : null}
        {scenarios ? <BodyText>corpus hash {scenarios.corpus_hash}</BodyText> : null}
      </Panel>

      <Panel>
        <PanelTitle>LAB / ENGINE REVISION</PanelTitle>
        <View style={styles.revisionRow}>
          {LAB_REVISION_CHOICES.map((choice) => {
            const selected = choice === revision;
            return (
              <Pressable
                key={choice}
                accessibilityRole="button"
                accessibilityLabel={`select-lab-revision-${choice}`}
                accessibilityState={{ selected }}
                onPress={() => onSelectRevision(choice)}
                style={[styles.revisionChoice, selected ? styles.revisionChoiceSelected : null]}
                testID={`select-lab-revision-${choice}`}
              >
                <Text style={styles.actionText}>
                  {choice === 'server' ? 'SERVER' : choice}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <BodyText>
          SERVER sends no revision and follows the backend default. Pinning 1 or 2 requests
          that corpus on every list, detail, and replay call; the header above still states
          the revision the server declared.
        </BodyText>
      </Panel>

      {scenariosPending ? <BodyText>Loading scenarios…</BodyText> : null}
      {scenariosError ? <Text style={styles.failure}>{scenariosError}</Text> : null}

      {scenarios ? (
        <Panel>
          <PanelTitle>SCENARIOS</PanelTitle>
          {scenarios.scenarios.map((scenario) => {
            const selected = scenario.id === selectedScenarioId;
            return (
              <Pressable
                key={scenario.id}
                accessibilityRole="button"
                accessibilityLabel={`lab-select-${scenario.id}`}
                accessibilityState={{ selected }}
                onPress={() => onSelectScenario(scenario.id)}
                style={[styles.entry, selected ? styles.entrySelected : null]}
              >
                <Text style={styles.entryName}>{scenario.title}</Text>
                <Text style={styles.entryDetail}>
                  {scenario.seed} seed · {scenario.fighters.p1} vs {scenario.fighters.p2} ·{' '}
                  {scenario.checkpoint_count} checkpoints
                </Text>
              </Pressable>
            );
          })}
        </Panel>
      ) : null}

      {selectedSummary ? (
        <Panel>
          <PanelTitle>REPLAY — {selectedSummary.id}</PanelTitle>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="lab-run-golden"
            accessibilityState={{ disabled: replayPending }}
            disabled={replayPending}
            onPress={onRunGolden}
            style={styles.action}
          >
            <Text style={styles.actionText}>RUN UNCHANGED GOLDEN</Text>
          </Pressable>
          <View style={styles.overrideRow}>
            <TextInput
              accessibilityLabel="lab-override-seed"
              keyboardType="number-pad"
              onChangeText={setOverrideSeed}
              placeholder="seed override (optional)"
              placeholderTextColor={tokens.muted}
              style={styles.overrideInput}
              value={overrideSeed}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="lab-run-override"
              accessibilityState={{ disabled: replayPending || !overrideSeedText }}
              disabled={replayPending || !overrideSeedText}
              onPress={() => {
                const parsed = Number(overrideSeedText);
                if (Number.isInteger(parsed) && parsed >= 0) {
                  onRunOverride({ seed: parsed });
                }
              }}
              style={styles.action}
            >
              <Text style={styles.actionText}>REPLAY OVERRIDE</Text>
            </Pressable>
          </View>
          <BodyText>
            Any override — even one identical to the canonical value — returns NOT
            APPLICABLE instead of a golden comparison.
          </BodyText>
        </Panel>
      ) : null}

      {replayPending ? <BodyText>Replaying through the backend engine…</BodyText> : null}
      {replayError ? <Text style={styles.failure}>{replayError}</Text> : null}

      {receipt ? (
        <Panel>
          <PanelTitle>SERVER RECEIPT</PanelTitle>
          <Text style={[styles.verdict, receipt.overridden ? styles.verdictOverride : null]}>
            {`${receipt.verdict.toUpperCase()}${receipt.overridden ? ' · OVERRIDDEN' : ''}`}
          </Text>
          <BodyText>
            scenario {receipt.scenario_id} · checkpoints{' '}
            {receipt.normalized_inputs.checkpoints.join(', ')}
          </BodyText>
          <BodyText>
            seed {receipt.normalized_inputs.seed} · {receipt.normalized_inputs.p1_fighter_id} vs{' '}
            {receipt.normalized_inputs.p2_fighter_id} · stage {receipt.normalized_inputs.stage_id}
          </BodyText>
          <BodyText>
            gels {receipt.normalized_inputs.p1_gel}/{receipt.normalized_inputs.p2_gel} · tape{' '}
            {receipt.normalized_inputs.input_tape.length === 0
              ? 'empty'
              : receipt.normalized_inputs.input_tape
                  .map((event) => `${event.side}:${event.action}@${event.step}`)
                  .join(', ')}
          </BodyText>
          <View style={styles.diffs}>
            {receipt.normalized_inputs.checkpoints.map((step) => {
              const key = String(step);
              return (
                <Text key={key} style={styles.diffLine}>
                  step {key}: actual {JSON.stringify(receipt.actual_checkpoints[key] ?? null)} ·{' '}
                  expected {JSON.stringify(receipt.expected_checkpoints[key] ?? null)}
                </Text>
              );
            })}
          </View>
          {receipt.diffs.length > 0 ? (
            <View style={styles.diffs}>
              {receipt.diffs.map((diff) => (
                <Text key={diff.path} style={styles.diffLine}>
                  {diff.path}: expected {JSON.stringify(diff.expected)} → actual{' '}
                  {JSON.stringify(diff.actual)}
                </Text>
              ))}
            </View>
          ) : null}
        </Panel>
      ) : null}
    </AppScreen>
  );
}

export default function LabScreen() {
  const config = useRuntimeConfig();
  const auth = useAuth();
  const api = useChoonzApi();
  const eligible = config.mechanicsLabEnabled && config.mode === 'api' && !config.isProduction;
  const queryScope = protectedQueryScope(auth.status, auth.user?.id);
  const queriesEnabled = eligible && queryScope !== null;
  const scope = queryScope ?? 'inactive';
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [revision, setRevision] = useState<LabRevisionSelection>('server');
  // `undefined` is the whole "follow the server" contract: no query param, no body field.
  const pin: MechanicsEngineRevision | undefined = revision === 'server' ? undefined : revision;

  const scenarios = useQuery({
    // The pin is part of the cache identity: switching it refetches rather than
    // re-rendering another corpus' scenarios.
    queryKey: mechanicsQueryKey(scope, 'scenarios', revision),
    queryFn: () => api.getMechanicsScenarios(pin),
    enabled: queriesEnabled,
  });

  const replayMutation = useMutation({
    mutationFn: (overrides?: MechanicsReplayOverrides) =>
      api.replayMechanics(selectedScenarioId ?? '', overrides, pin),
  });

  const access: LabAccess = eligible
    ? auth.status === 'authenticated'
      ? 'eligible'
      : auth.status === 'loading'
        ? 'loading'
        : 'auth-required'
    : config.mode === 'fixtures'
      ? 'fixture-required'
      : 'disabled';

  return (
    <LabContent
      access={access}
      revision={revision}
      onSelectRevision={(next) => {
        setRevision(next);
        // A receipt belongs to the corpus it was replayed against; drop it rather
        // than let it read as this corpus' verdict.
        replayMutation.reset();
        setSelectedScenarioId(null);
      }}
      scenarios={scenarios.data ?? null}
      scenariosPending={scenarios.isPending}
      scenariosError={scenarios.isError ? errorMessage(scenarios.error) : null}
      selectedScenarioId={selectedScenarioId}
      onSelectScenario={setSelectedScenarioId}
      receipt={replayMutation.data ?? null}
      replayPending={replayMutation.isPending}
      replayError={replayMutation.isError ? errorMessage(replayMutation.error) : null}
      onRunGolden={() => replayMutation.mutate(undefined)}
      onRunOverride={(overrides) => replayMutation.mutate(overrides)}
    />
  );
}

const styles = StyleSheet.create({
  failure: {
    color: tokens.danger,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21,
  },
  entry: {
    borderColor: tokens.border,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    gap: 3,
    padding: 8,
  },
  entrySelected: {
    borderColor: tokens.accent,
  },
  entryName: {
    color: tokens.text,
    fontSize: 15,
    fontWeight: '900',
  },
  entryDetail: {
    color: tokens.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  action: {
    backgroundColor: tokens.panelStrong,
    borderColor: tokens.border,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionText: {
    color: tokens.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  overrideRow: {
    gap: 8,
  },
  revisionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  revisionChoice: {
    backgroundColor: tokens.panelStrong,
    borderColor: tokens.border,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  revisionChoiceSelected: {
    borderColor: tokens.accent,
  },
  overrideInput: {
    backgroundColor: tokens.black,
    borderColor: tokens.border,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    color: tokens.text,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  verdict: {
    color: tokens.accentAlt,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  verdictOverride: {
    color: tokens.accent,
  },
  diffs: {
    borderTopColor: tokens.border,
    borderTopWidth: tokens.borderWidth,
    gap: 4,
    paddingTop: 8,
  },
  diffLine: {
    color: tokens.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
