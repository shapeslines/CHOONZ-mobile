import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { FightContent, type FightContentProps } from '../src/app/fight';
import { confirmMatch, createFightWorkflow } from '../src/lib/fight-machine';
import type { Loadout, Match, MatchEngine, MatchState, Toon } from '../src/lib/types';

const toon: Toon = {
  id: 4,
  name: 'Pilot Toon',
  description: null,
  sprite_url: null,
  tags: [],
  attributes: {},
};

const loadout: Loadout = {
  id: 8,
  toon_id: toon.id,
  name: 'Pilot loadout',
  gel: 'sodium',
  fighter_id: 'AXEL',
  user_kit_id: null,
  is_default: true,
};

function match(status: Match['status'], engine: MatchEngine = 'ah-scripted'): Match {
  return {
    id: 19,
    series_id: null,
    p1_toon_id: toon.id,
    p2_toon_id: null,
    p1_gel: 'sodium',
    p2_gel: 'red',
    p1_fighter_id: 'AXEL',
    p2_fighter_id: 'VEX',
    stage_id: 'rooftop',
    seed: 677,
    status,
    result: status === 'completed' ? 'p1' : null,
    result_step: status === 'completed' ? 4 : null,
    result_p1_hp: status === 'completed' ? 92 : null,
    result_p2_hp: status === 'completed' ? 76 : null,
    last_step: 4,
    loop: 128,
    share_token: null,
    telemetry: null,
    allowed_transitions: [],
    engine,
  };
}

const hud: MatchState = {
  match_id: 19,
  status: 'active',
  step: 4,
  last_step: 4,
  bar: 1,
  ceremony: 'round_call',
  p1: { hp: 92, meter: 0.32, rounds: 0, pose: 'heavy', frame: 4, x: 96, lift: 0 },
  p2: { hp: 76, meter: 0.16, rounds: 0, pose: null, frame: 4, x: 224, lift: 0 },
  timer: 124,
  combo: 2,
  p1_gel: 'sodium',
  p2_gel: 'red',
  p1_fighter_id: 'AXEL',
  p2_fighter_id: 'VEX',
  stage_id: 'rooftop',
  seed: 677,
  loop: 128,
  leading: 'p1',
  ann: 'ROUND CALL',
  sound_hooks: ['heavy'],
  extra: { fixture: true },
};

function callbacks() {
  return {
    selectToonById: jest.fn(),
    selectLoadoutById: jest.fn(),
    setMatchOptions: jest.fn(),
    createToon: jest.fn(async () => undefined),
    createLoadout: jest.fn(async () => undefined),
    createMatch: jest.fn(async () => undefined),
    start: jest.fn(async () => undefined),
    pause: jest.fn(async () => undefined),
    resume: jest.fn(async () => undefined),
    complete: jest.fn(async () => undefined),
    cancel: jest.fn(async () => undefined),
    tick: jest.fn(async () => undefined),
    act: jest.fn(async () => undefined),
    rematch: jest.fn(async () => undefined),
    setup: jest.fn(),
  };
}

function propsFor(status: Match['status'] | 'setup', overrides: Partial<FightContentProps> = {}) {
  const initial = createFightWorkflow();
  const workflow =
    status === 'setup'
      ? { ...initial, selection: { ...initial.selection, toon } }
      : confirmMatch({ ...initial, selection: { ...initial.selection, toon } }, match(status));
  return {
    accessEnabled: true,
    workflow,
    toons: [toon],
    loadouts: [loadout],
    gels: ['sodium', 'uv'],
    fighters: ['AXEL', 'NYX'],
    stages: ['rooftop', 'neon_alley'],
    state: status === 'cancelled' ? null : hud,
    loading: false,
    queryError: null,
    ...callbacks(),
    ...overrides,
  } satisfies FightContentProps;
}

describe('FightContent rendered states', () => {
  it('renders accessible setup controls and sends selection/create callbacks', async () => {
    const props = propsFor('setup');
    const view = await render(<FightContent {...props} />);

    expect(view.getByRole('button', { name: 'select-toon-4' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'create-match' }).props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(view.getByRole('button', { name: 'select-fighter-NYX' }));
    await fireEvent.press(view.getByRole('button', { name: 'create-match' }));
    expect(props.setMatchOptions).toHaveBeenCalledWith({ fighterId: 'NYX' });
    expect(props.createMatch).toHaveBeenCalledTimes(1);
  });

  it('renders ready controls and excludes active-only controls', async () => {
    const props = propsFor('ready');
    const view = await render(<FightContent {...props} />);

    await fireEvent.press(view.getByRole('button', { name: 'fight-start' }));
    expect(props.start).toHaveBeenCalledTimes(1);
    expect(view.getByRole('button', { name: 'fight-cancel' })).toBeTruthy();
    expect(view.queryByRole('button', { name: 'fight-light' })).toBeNull();
  });

  it('renders the confirmed active HUD and legal P1 controls', async () => {
    const props = propsFor('active');
    const view = await render(<FightContent {...props} />);

    expect(view.getByLabelText('hud-p1')).toBeTruthy();
    expect(view.getByText('TIMER 124 · COMBO 2 · ROUND CALL · LEAD P1')).toBeTruthy();
    expect(view.getByLabelText('scene-rooftop')).toBeTruthy();
    expect(view.getByText('BAR 1/7')).toBeTruthy();
    expect(view.getByText('POSE HEAVY / F4')).toBeTruthy();
    const announcement = view.getByText('ROUND CALL');
    expect(announcement.props.role).toBe('status');
    expect(announcement.props.accessibilityLiveRegion).toBe('polite');
    await fireEvent.press(view.getByRole('button', { name: 'fight-heavy' }));
    await fireEvent.press(view.getByRole('button', { name: 'fight-tick' }));
    expect(props.act).toHaveBeenCalledWith('heavy');
    expect(props.tick).toHaveBeenCalledTimes(1);
    expect(view.getByRole('button', { name: 'fight-pause' })).toBeTruthy();
  });

  it('renders only paused-state legal controls', async () => {
    const props = propsFor('paused');
    const view = await render(<FightContent {...props} />);

    await fireEvent.press(view.getByRole('button', { name: 'fight-resume' }));
    expect(props.resume).toHaveBeenCalledTimes(1);
    expect(view.getByRole('button', { name: 'fight-complete' })).toBeTruthy();
    expect(view.queryByRole('button', { name: 'fight-heavy' })).toBeNull();
  });

  it('renders completed result and rematch/setup controls', async () => {
    const props = propsFor('completed');
    const view = await render(<FightContent {...props} />);

    expect(view.getByText('COMPLETE / P1 RESULT')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'fight-rematch' }));
    await fireEvent.press(view.getByRole('button', { name: 'fight-setup' }));
    expect(props.rematch).toHaveBeenCalledTimes(1);
    expect(props.setup).toHaveBeenCalledTimes(1);
  });

  it('renders cancelled state with setup only', async () => {
    const props = propsFor('cancelled');
    const view = await render(<FightContent {...props} />);

    expect(view.getByText('CANCELLED')).toBeTruthy();
    expect(view.getByRole('button', { name: 'fight-setup' })).toBeTruthy();
    expect(view.queryByRole('button', { name: 'fight-rematch' })).toBeNull();
  });

  it('visibly disables controls while a command is pending', async () => {
    const pendingWorkflow = { ...propsFor('active').workflow, pendingCommand: 'heavy' as const };
    const view = await render(<FightContent {...propsFor('active', { workflow: pendingWorkflow })} />);

    expect(view.getByText('SUBMITTING / HEAVY')).toBeTruthy();
    expect(view.getByRole('button', { name: 'fight-heavy' }).props.accessibilityState.disabled).toBe(true);
  });

  it('renders recoverable workflow and query errors without losing the confirmed state', async () => {
    const erroredWorkflow = {
      ...propsFor('ready').workflow,
      error: { kind: 'response' as const, status: 422, message: 'Choose a valid Toon.' },
    };
    const view = await render(
      <FightContent
        {...propsFor('ready', {
          workflow: erroredWorkflow,
          queryError: 'Live catalog is temporarily unavailable.',
        })}
      />,
    );

    expect(view.getByRole('alert', { name: 'Choose a valid Toon.' })).toBeTruthy();
    expect(view.getByText('Live catalog is temporarily unavailable.')).toBeTruthy();
    expect(view.getByRole('button', { name: 'fight-start' })).toBeTruthy();
  });

  it('offers both engines in setup and sends the chosen engine as a create option', async () => {
    const props = propsFor('setup');
    const view = await render(<FightContent {...props} />);

    expect(view.getByRole('button', { name: 'select-engine-ah-scripted' }).props.accessibilityState.selected).toBe(
      true,
    );
    const fightV2 = view.getByRole('button', { name: 'select-engine-fight-v2' });
    expect(fightV2.props.accessibilityState.selected).toBe(false);
    await fireEvent.press(fightV2);
    expect(props.setMatchOptions).toHaveBeenCalledWith({ engine: 'fight-v2' });
  });

  it('marks the selected engine from the setup selection, not from a confirmed match', async () => {
    const base = propsFor('setup');
    const workflow = { ...base.workflow, selection: { ...base.workflow.selection, engine: 'fight-v2' as const } };
    const view = await render(<FightContent {...propsFor('setup', { workflow })} />);

    expect(view.getByRole('button', { name: 'select-engine-fight-v2' }).props.accessibilityState.selected).toBe(true);
  });

  it('states the confirmed match engine on the ready card', async () => {
    const scripted = await render(<FightContent {...propsFor('ready')} />);
    expect(scripted.getByText('ENGINE AH-SCRIPTED')).toBeTruthy();

    const workflow = confirmMatch(createFightWorkflow(), match('ready', 'fight-v2'));
    const v2 = await render(<FightContent {...propsFor('ready', { workflow })} />);
    expect(v2.getByText('ENGINE FIGHT-V2')).toBeTruthy();
  });

  it('renders no fight-v2 HUD reads while the state says ah-scripted', async () => {
    const view = await render(
      <FightContent
        {...propsFor('active', {
          state: { ...hud, engine: 'ah-scripted', over: true, p1: { ...hud.p1, state: 'recover' } },
        })}
      />,
    );

    expect(view.queryByLabelText('engine-state-p1')).toBeNull();
    expect(view.queryByLabelText('fightv2-over')).toBeNull();
  });

  it('renders the per-side engine state and the over signal under fight-v2', async () => {
    const view = await render(
      <FightContent
        {...propsFor('active', {
          state: {
            ...hud,
            engine: 'fight-v2',
            over: true,
            ann: 'K.O.',
            p1: { ...hud.p1, state: 'recover' },
            p2: { ...hud.p2, state: 'blockstun' },
          },
        })}
      />,
    );

    expect(view.getByLabelText('engine-state-p1').props.children.join('')).toBe('STATE RECOVER');
    expect(view.getByLabelText('engine-state-p2').props.children.join('')).toBe('STATE BLOCKSTUN');
    expect(view.getByLabelText('fightv2-over')).toBeTruthy();
    expect(view.getByText('K.O.')).toBeTruthy();
    // The client never renders raw engine affordances.
    expect(view.queryByLabelText('legal-actions-p1')).toBeNull();
    // `over` is a display signal only — the phase still comes from the match.
    expect(view.getByRole('button', { name: 'fight-heavy' })).toBeTruthy();
  });

  it('leaves the fight-v2 signals out when the engine key is absent', async () => {
    const view = await render(
      <FightContent {...propsFor('active', { state: { ...hud, over: true, p1: { ...hud.p1, state: 'idle' } } })} />,
    );

    expect(view.queryByLabelText('engine-state-p1')).toBeNull();
    expect(view.queryByLabelText('fightv2-over')).toBeNull();
  });
});
