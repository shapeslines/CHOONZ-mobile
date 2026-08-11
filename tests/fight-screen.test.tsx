import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { FightContent, type FightContentProps } from '../src/app/fight';
import { confirmMatch, createFightWorkflow } from '../src/lib/fight-machine';
import type { Loadout, Match, MatchState, Toon } from '../src/lib/types';

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

function match(status: Match['status']): Match {
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
    expect(view.getByText('TIMER 124 · COMBO 2 · ROUND CALL')).toBeTruthy();
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
});
