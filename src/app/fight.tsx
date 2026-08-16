import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { phaseOf, type FightWorkflowState } from '@/lib/fight-machine';
import type { FightAction, Loadout, MatchResult, MatchState, Toon } from '@/lib/types';
import { useFight } from '@/providers/fight-provider';
import { useSkins } from '@/providers/skin-provider';
import { AppScreen, BodyText, Panel, PanelTitle } from '@/ui/app-screen';
import { fonts, gels, tokens, typeScale } from '@/ui/tokens';

export interface FightContentProps {
  accessEnabled: boolean;
  workflow: FightWorkflowState;
  toons: Toon[];
  loadouts: Loadout[];
  gels: string[];
  fighters: string[];
  stages: string[];
  state: MatchState | null;
  loading: boolean;
  queryError: string | null;
  selectToonById: (toonId: number | null) => void;
  selectLoadoutById: (loadoutId: number | null) => void;
  setMatchOptions: (options: { gel?: string; fighterId?: string; stageId?: string }) => void;
  createToon: (input: { name: string }) => Promise<void>;
  createLoadout: (input: {
    toon_id: number;
    name?: string | null;
    gel?: string;
    fighter_id?: string;
    is_default?: boolean;
  }) => Promise<void>;
  createMatch: () => Promise<void>;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  complete: () => Promise<void>;
  cancel: () => Promise<void>;
  tick: () => Promise<void>;
  act: (action: FightAction) => Promise<void>;
  rematch: () => Promise<void>;
  setup: () => void;
}

export default function FightScreen() {
  const fight = useFight();

  return (
    <AppScreen title="FIGHT / PRACTICE LOOP">
      <FightContent {...fight} />
    </AppScreen>
  );
}

/** Presentational status surface kept separate for deterministic rendered tests. */
export function FightContent({
  accessEnabled,
  workflow,
  toons,
  loadouts,
  gels,
  fighters,
  stages,
  state,
  loading,
  queryError,
  selectToonById,
  selectLoadoutById,
  setMatchOptions,
  createToon,
  createLoadout,
  createMatch,
  start,
  pause,
  resume,
  complete,
  cancel,
  tick,
  act,
  rematch,
  setup,
}: FightContentProps) {
  const [toonName, setToonName] = useState('');
  const phase = phaseOf(workflow);
  const pending = workflow.pendingCommand !== null;
  const selected = workflow.selection;

  const createNamedToon = () => {
    const name = toonName.trim();
    if (!name) {
      return;
    }
    void createToon({ name });
  };

  const createSelectedLoadout = () => {
    if (!selected.toon) {
      return;
    }
    void createLoadout({
      toon_id: selected.toon.id,
      name: `${selected.toon.name} loadout`,
      gel: selected.gel,
      fighter_id: selected.fighterId,
      is_default: loadouts.length === 0,
    });
  };

  if (!accessEnabled) {
    return (
      <Panel>
        <PanelTitle>FIGHT ACCESS REQUIRED</PanelTitle>
        <BodyText>Sign in on Profile to use the live practice loop.</BodyText>
      </Panel>
    );
  }

  return (
    <View style={styles.content}>
      <Panel>
        <PanelTitle>MATCH STATUS / {phase.toUpperCase()}</PanelTitle>
        <BodyText>
          Confirmed match snapshots own status and result. Local controls never predict a fight outcome.
        </BodyText>
        {loading ? <BodyText>Loading confirmed fight data…</BodyText> : null}
        {pending ? <Text style={styles.pending}>SUBMITTING / {workflow.pendingCommand?.toUpperCase()}</Text> : null}
        {workflow.error ? <Failure message={workflow.error.message} /> : null}
        {queryError ? <Failure message={queryError} /> : null}
      </Panel>

      {phase === 'setup' ? (
        <SetupPanel
          disabled={pending}
          toonName={toonName}
          toons={toons}
          loadouts={loadouts}
          gels={gels}
          fighters={fighters}
          stages={stages}
          selection={selected}
          onToonNameChange={setToonName}
          onCreateToon={createNamedToon}
          onCreateLoadout={createSelectedLoadout}
          onCreateMatch={() => void createMatch()}
          onSelectToon={selectToonById}
          onSelectLoadout={selectLoadoutById}
          onSetOptions={setMatchOptions}
        />
      ) : null}

      {phase === 'ready' ? (
        <ReadyPanel match={workflow.match} disabled={pending} onStart={() => void start()} onCancel={() => void cancel()} />
      ) : null}

      {phase === 'active' ? (
        <ActivePanel
          state={state}
          disabled={pending}
          onAction={(action) => void act(action)}
          onTick={() => void tick()}
          onPause={() => void pause()}
          onComplete={() => void complete()}
          onCancel={() => void cancel()}
        />
      ) : null}

      {phase === 'paused' ? (
        <PausedPanel
          state={state}
          disabled={pending}
          onResume={() => void resume()}
          onComplete={() => void complete()}
          onCancel={() => void cancel()}
        />
      ) : null}

      {phase === 'completed' ? (
        <CompletedPanel
          state={state}
          result={workflow.match?.result ?? null}
          disabled={pending}
          onRematch={() => void rematch()}
          onSetup={setup}
        />
      ) : null}

      {phase === 'cancelled' ? <CancelledPanel disabled={pending} onSetup={setup} /> : null}
    </View>
  );
}

function SetupPanel({
  disabled,
  toonName,
  toons,
  loadouts,
  gels,
  fighters,
  stages,
  selection,
  onToonNameChange,
  onCreateToon,
  onCreateLoadout,
  onCreateMatch,
  onSelectToon,
  onSelectLoadout,
  onSetOptions,
}: {
  disabled: boolean;
  toonName: string;
  toons: Toon[];
  loadouts: Loadout[];
  gels: string[];
  fighters: string[];
  stages: string[];
  selection: FightWorkflowState['selection'];
  onToonNameChange: (value: string) => void;
  onCreateToon: () => void;
  onCreateLoadout: () => void;
  onCreateMatch: () => void;
  onSelectToon: (id: number | null) => void;
  onSelectLoadout: (id: number | null) => void;
  onSetOptions: (options: { gel?: string; fighterId?: string; stageId?: string }) => void;
}) {
  const canCreateMatch = selection.toon !== null || selection.loadout !== null;
  return (
    <>
      <Panel>
        <PanelTitle>SETUP / TOON</PanelTitle>
        <ChoiceGrid>
          {toons.map((toon) => (
            <Control
              key={toon.id}
              label={`select-toon-${toon.id}`}
              selected={selection.toon?.id === toon.id}
              disabled={disabled}
              onPress={() => onSelectToon(toon.id)}
            >
              {toon.name.toUpperCase()}
            </Control>
          ))}
        </ChoiceGrid>
        <TextInput
          accessibilityLabel="toon-name"
          editable={!disabled}
          maxLength={80}
          onChangeText={onToonNameChange}
          placeholder="New Toon name"
          placeholderTextColor={tokens.muted}
          style={styles.input}
          value={toonName}
        />
        <Control label="create-toon" disabled={disabled || !toonName.trim()} onPress={onCreateToon}>
          CREATE TOON
        </Control>
      </Panel>

      <Panel>
        <PanelTitle>SETUP / LOADOUT</PanelTitle>
        <ChoiceGrid>
          {loadouts.map((loadout) => (
            <Control
              key={loadout.id}
              label={`select-loadout-${loadout.id}`}
              selected={selection.loadout?.id === loadout.id}
              disabled={disabled}
              onPress={() => onSelectLoadout(loadout.id)}
            >
              {(loadout.name ?? `LOADOUT ${loadout.id}`).toUpperCase()}
            </Control>
          ))}
        </ChoiceGrid>
        <Control label="create-loadout" disabled={disabled || !selection.toon} onPress={onCreateLoadout}>
          CREATE SELECTED LOADOUT
        </Control>
      </Panel>

      <Panel>
        <PanelTitle>SETUP / FIGHTER</PanelTitle>
        <ChoiceGrid>
          {fighters.map((fighterId) => (
            <Control
              key={fighterId}
              label={`select-fighter-${fighterId}`}
              selected={selection.fighterId === fighterId}
              disabled={disabled}
              onPress={() => onSetOptions({ fighterId })}
            >
              {fighterId}
            </Control>
          ))}
        </ChoiceGrid>
      </Panel>

      <Panel>
        <PanelTitle>SETUP / GEL</PanelTitle>
        <ChoiceGrid>
          {gels.map((gel) => (
            <Control
              key={gel}
              label={`select-gel-${gel}`}
              selected={selection.gel === gel}
              disabled={disabled}
              onPress={() => onSetOptions({ gel })}
            >
              {gel.toUpperCase()}
            </Control>
          ))}
        </ChoiceGrid>
      </Panel>

      <Panel>
        <PanelTitle>SETUP / STAGE</PanelTitle>
        <ChoiceGrid>
          {stages.map((stageId) => (
            <Control
              key={stageId}
              label={`select-stage-${stageId}`}
              selected={selection.stageId === stageId}
              disabled={disabled}
              onPress={() => onSetOptions({ stageId })}
            >
              {stageId.replace(/_/g, ' ').toUpperCase()}
            </Control>
          ))}
        </ChoiceGrid>
      </Panel>

      <Panel>
        <PanelTitle>READY THE LOOP</PanelTitle>
        <BodyText>
          {selection.toon?.name ?? 'Select a Toon'} · {selection.loadout?.name ?? 'custom setup'} ·{' '}
          {selection.fighterId} · {selection.gel.toUpperCase()} · {selection.stageId.toUpperCase()}
        </BodyText>
        <Control label="create-match" disabled={disabled || !canCreateMatch} onPress={onCreateMatch}>
          CREATE MATCH
        </Control>
      </Panel>
    </>
  );
}

function ReadyPanel({
  match,
  disabled,
  onStart,
  onCancel,
}: {
  match: FightWorkflowState['match'];
  disabled: boolean;
  onStart: () => void;
  onCancel: () => void;
}) {
  return (
    <Panel>
      <PanelTitle>READY / MATCH {match?.id ?? '—'}</PanelTitle>
      <BodyText>
        {match?.p1_fighter_id ?? 'P1'} vs {match?.p2_fighter_id ?? 'P2'} · {match?.stage_id ?? 'stage'} · seed{' '}
        {match?.seed ?? '—'}
      </BodyText>
      <Control label="fight-start" disabled={disabled} onPress={onStart}>
        START
      </Control>
      <Control label="fight-cancel" tone="danger" disabled={disabled} onPress={onCancel}>
        CANCEL MATCH
      </Control>
    </Panel>
  );
}

function ActivePanel({
  state,
  disabled,
  onAction,
  onTick,
  onPause,
  onComplete,
  onCancel,
}: {
  state: MatchState | null;
  disabled: boolean;
  onAction: (action: FightAction) => void;
  onTick: () => void;
  onPause: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <Hud state={state} />
      <Panel>
        <PanelTitle>ACTIVE / P1 CONTROLS</PanelTitle>
        <ChoiceGrid>
          {(['light', 'heavy', 'special', 'block'] as const).map((action) => (
            <Control
              key={action}
              label={`fight-${action}`}
              disabled={disabled}
              onPress={() => onAction(action)}
            >
              {action.toUpperCase()}
            </Control>
          ))}
        </ChoiceGrid>
        <Control label="fight-tick" disabled={disabled} onPress={onTick}>
          TICK +1
        </Control>
        <Control label="fight-pause" disabled={disabled} onPress={onPause}>
          PAUSE
        </Control>
        <Control label="fight-complete" disabled={disabled} onPress={onComplete}>
          COMPLETE
        </Control>
        <Control label="fight-cancel" tone="danger" disabled={disabled} onPress={onCancel}>
          CANCEL MATCH
        </Control>
      </Panel>
    </>
  );
}

function PausedPanel({
  state,
  disabled,
  onResume,
  onComplete,
  onCancel,
}: {
  state: MatchState | null;
  disabled: boolean;
  onResume: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <Hud state={state} />
      <Panel>
        <PanelTitle>PAUSED / CONFIRMED SNAPSHOT</PanelTitle>
        <Control label="fight-resume" disabled={disabled} onPress={onResume}>
          RESUME
        </Control>
        <Control label="fight-complete" disabled={disabled} onPress={onComplete}>
          COMPLETE
        </Control>
        <Control label="fight-cancel" tone="danger" disabled={disabled} onPress={onCancel}>
          CANCEL MATCH
        </Control>
      </Panel>
    </>
  );
}

function CompletedPanel({
  state,
  result,
  disabled,
  onRematch,
  onSetup,
}: {
  state: MatchState | null;
  result: MatchResult | null;
  disabled: boolean;
  onRematch: () => void;
  onSetup: () => void;
}) {
  return (
    <>
      <Hud state={state} />
      <Panel>
        <PanelTitle>COMPLETE / {result ? `${String(result).toUpperCase()} RESULT` : 'RESULT CONFIRMED'}</PanelTitle>
        <BodyText>Only the confirmed match result is shown here.</BodyText>
        <Control label="fight-rematch" disabled={disabled} onPress={onRematch}>
          REMATCH
        </Control>
        <Control label="fight-setup" disabled={disabled} onPress={onSetup}>
          RETURN TO SETUP
        </Control>
      </Panel>
    </>
  );
}

function CancelledPanel({ disabled, onSetup }: { disabled: boolean; onSetup: () => void }) {
  return (
    <Panel>
      <PanelTitle>CANCELLED</PanelTitle>
      <BodyText>No local result was inferred. Return to setup to begin another confirmed match.</BodyText>
      <Control label="fight-setup" disabled={disabled} onPress={onSetup}>
        RETURN TO SETUP
      </Control>
    </Panel>
  );
}

function Hud({ state }: { state: MatchState | null }) {
  const { theme } = useSkins();
  if (!state) {
    return (
      <Panel>
        <PanelTitle>AUTHORITATIVE HUD</PanelTitle>
        <BodyText>Awaiting a confirmed backend HUD snapshot…</BodyText>
      </Panel>
    );
  }
  return (
    <Panel>
      <PanelTitle>AUTHORITATIVE HUD / STEP {state.last_step}</PanelTitle>
      <SceneBand stageId={state.stage_id} />
      <View style={styles.hudGrid}>
        <HudFighter
          label="P1"
          hp={state.p1.hp}
          meter={state.p1.meter}
          rounds={state.p1.rounds}
          pose={state.p1.pose}
          frame={state.p1.frame}
          gel={state.p1_gel}
        />
        <HudFighter
          label="P2"
          hp={state.p2.hp}
          meter={state.p2.meter}
          rounds={state.p2.rounds}
          pose={state.p2.pose}
          frame={state.p2.frame}
          gel={state.p2_gel}
        />
      </View>
      <BarReadout bar={state.bar} />
      <Text style={[styles.hudMeta, { color: theme.text }]}>
        TIMER {state.timer} · COMBO {state.combo} ·{' '}
        {state.ceremony.replace(/_/g, ' ').toUpperCase()}
        {state.leading ? ` · LEAD ${state.leading.toUpperCase()}` : ''}
      </Text>
      {state.ann ? (
        <Text
          accessibilityLiveRegion="polite"
          role="status"
          style={[styles.announcement, { color: theme.accent }]}
        >
          {state.ann}
        </Text>
      ) : null}
    </Panel>
  );
}

/** The stage presentation layer — a vibe band tinted by the active scene_vibe skin. */
function SceneBand({ stageId }: { stageId: string }) {
  const { theme, catalog, mySkins } = useSkins();
  const vibeId = mySkins?.selection.scene_vibe;
  const vibe = catalog?.skins.find((skin) => skin.id === vibeId);
  const gel = vibe?.base_gel;
  const palette = gel ? (gels as Record<string, { deep: string; hot: string }>)[gel] : undefined;
  return (
    <View
      accessibilityLabel={`scene-${stageId}`}
      style={[styles.sceneBand, { backgroundColor: palette?.deep ?? theme.background }]}
    >
      <Text style={[styles.sceneLabel, { color: palette?.hot ?? theme.accent }]}>
        {stageId.replace(/_/g, ' ').toUpperCase()}
        {vibe ? ` · ${vibe.display_name.toUpperCase()}` : ''}
      </Text>
    </View>
  );
}

/** Ceremony progress as eight segments (state.bar, 0..7). */
function BarReadout({ bar }: { bar: number }) {
  const { theme } = useSkins();
  return (
    <View style={styles.barRow}>
      {Array.from({ length: 8 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.barSegment,
            {
              backgroundColor: index < bar ? theme.accent : theme.panelStrong,
              borderColor: theme.border,
            },
          ]}
        />
      ))}
      <Text style={[styles.hudMeta, { color: theme.muted }]}>BAR {bar}/7</Text>
    </View>
  );
}

function HudFighter({
  label,
  hp,
  meter,
  rounds,
  pose,
  frame,
  gel,
}: {
  label: string;
  hp: number;
  meter: number;
  rounds: number;
  pose: string | null;
  frame: number | null;
  gel: string;
}) {
  const { theme } = useSkins();
  const palette = (gels as Record<string, { hot: string; mid: string }>)[gel] ?? {
    hot: theme.accent,
    mid: theme.panelStrong,
  };
  const critical = hp < 25;
  return (
    <View accessibilityLabel={`hud-${label.toLowerCase()}`} style={styles.hudFighter}>
      <Text style={[styles.hudLabel, { color: theme.text }]}>
        {label} / HP {Math.round(hp)} / R{rounds}
      </Text>
      <Meter value={hp / 100} color={critical ? theme.danger : palette.hot} />
      <Text style={[styles.hudLabel, { color: theme.text }]}>METER {Math.round(meter * 100)}%</Text>
      <Meter value={meter} color={palette.mid} />
      {pose ? (
        <Text style={[styles.hudMeta, { color: theme.muted }]}>
          POSE {pose.toUpperCase()}
          {frame !== null ? ` / F${frame}` : ''}
        </Text>
      ) : null}
    </View>
  );
}

function Meter({ value, color }: { value: number; color: string }) {
  const { theme } = useSkins();
  const width = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` as `${number}%`;
  return (
    <View style={[styles.meterTrack, { backgroundColor: theme.panelStrong }]}>
      <View style={[styles.meterFill, { backgroundColor: color, width }]} />
    </View>
  );
}

function ChoiceGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.choiceGrid}>{children}</View>;
}

function Control({
  label,
  disabled,
  selected = false,
  tone = 'primary',
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  selected?: boolean;
  tone?: 'primary' | 'danger';
  onPress: () => void;
  children: React.ReactNode;
}) {
  const { theme } = useSkins();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          backgroundColor: theme.panelStrong,
          borderColor: theme.border,
          borderRadius: theme.radius,
          borderWidth: theme.borderWidth,
          flexGrow: 1,
          justifyContent: 'center',
          minHeight: 42,
          paddingHorizontal: 10,
          paddingVertical: 9,
        },
        tone === 'danger'
          ? { backgroundColor: theme.danger, borderColor: theme.black }
          : null,
        selected ? { backgroundColor: theme.accentAlt, borderColor: theme.accent } : null,
        disabled ? { backgroundColor: theme.background, borderColor: theme.muted } : null,
        pressed && !disabled ? { borderColor: theme.text } : null,
      ]}
    >
      <Text
        style={[
          {
            color: theme.text,
            fontSize: 12,
            fontWeight: '900',
            letterSpacing: 0.8,
            textAlign: 'center',
          },
          tone === 'danger' ? { color: theme.black } : null,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

function Failure({ message }: { message: string }) {
  return <Text accessibilityRole="alert" style={styles.failure}>{message}</Text>;
}

const styles = StyleSheet.create({
  content: {
    gap: tokens.space,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
  control: {
    alignItems: 'center',
    backgroundColor: tokens.panelStrong,
    borderColor: tokens.border,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  selectedControl: {
    backgroundColor: tokens.accentAlt,
    borderColor: tokens.accent,
  },
  dangerControl: {
    backgroundColor: tokens.danger,
    borderColor: tokens.black,
  },
  disabledControl: {
    backgroundColor: tokens.background,
    borderColor: tokens.muted,
  },
  pressedControl: {
    borderColor: tokens.text,
  },
  controlText: {
    color: tokens.text,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  dangerControlText: {
    color: tokens.black,
  },
  pending: {
    color: tokens.accent,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  failure: {
    color: tokens.danger,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21,
  },
  hudGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  hudFighter: {
    backgroundColor: tokens.background,
    borderColor: tokens.border,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    flex: 1,
    gap: 5,
    padding: 8,
  },
  hudLabel: {
    ...typeScale.meta,
  },
  hudMeta: {
    ...typeScale.meta,
  },
  meterTrack: {
    backgroundColor: tokens.black,
    borderColor: tokens.border,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    height: 12,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
  },
  announcement: {
    fontFamily: fonts.monoBold,
    fontSize: 14,
    letterSpacing: 1.5,
    lineHeight: 20,
  },
  sceneBand: {
    alignItems: 'center',
    borderColor: tokens.border,
    borderWidth: tokens.borderWidth,
    paddingHorizontal: tokens.space,
    paddingVertical: 7,
  },
  sceneLabel: {
    ...typeScale.meta,
  },
  barRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  barSegment: {
    borderWidth: tokens.borderWidth,
    flex: 1,
    height: 8,
  },
});
