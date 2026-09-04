import { describe, expect, it } from 'vitest';

import {
  beginCommand,
  confirmMatch,
  createFightWorkflow,
  IllegalFightCommandError,
  legalCommands,
  phaseOf,
  returnToSetup,
  selectLoadout,
  selectMatchOptions,
  selectToon,
  settleFailure,
} from '../src/lib/fight-machine';
import type { Loadout, Match, Toon } from '../src/lib/types';

const toon: Toon = {
  id: 4,
  name: 'Pilot Toon',
  description: null,
  sprite_url: null,
  tags: [],
  attributes: {},
};

const loadout: Loadout = {
  id: 9,
  toon_id: toon.id,
  name: 'Pilot loadout',
  gel: 'sodium',
  fighter_id: 'AXEL',
  user_kit_id: null,
  is_default: true,
};

function match(status: Match['status']): Match {
  return {
    id: 12,
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
    result_step: status === 'completed' ? 9 : null,
    result_p1_hp: status === 'completed' ? 91 : null,
    result_p2_hp: status === 'completed' ? 60 : null,
    last_step: 9,
    loop: 128,
    share_token: null,
    telemetry: null,
    allowed_transitions: [],
  };
}

describe('fight workflow machine', () => {
  it('declares the exact legal P1 control matrix', () => {
    expect(legalCommands('setup')).toEqual([
      'selectToon',
      'createToon',
      'selectLoadout',
      'createLoadout',
      'createMatch',
    ]);
    expect(legalCommands('ready')).toEqual(['start', 'cancel']);
    expect(legalCommands('active')).toEqual([
      'light',
      'heavy',
      'special',
      'block',
      'tick',
      'pause',
      'complete',
      'cancel',
    ]);
    expect(legalCommands('paused')).toEqual(['resume', 'complete', 'cancel']);
    expect(legalCommands('completed')).toEqual(['rematch', 'returnToSetup']);
    expect(legalCommands('cancelled')).toEqual(['returnToSetup']);
  });

  it('keeps setup selection local and derives every confirmed phase from a Match snapshot', () => {
    const selectedToon = selectToon(createFightWorkflow(), toon);
    const selectedLoadout = selectLoadout(selectedToon, loadout, toon);
    const configured = selectMatchOptions(selectedLoadout, {
      gel: 'uv',
      fighterId: 'NYX',
      stageId: 'neon_alley',
      engine: 'fight-v2',
    });

    expect(configured.selection).toMatchObject({
      toon,
      loadout,
      gel: 'uv',
      fighterId: 'NYX',
      engine: 'fight-v2',
    });
    expect(phaseOf(configured)).toBe('setup');
    expect(phaseOf(confirmMatch(configured, match('ready')))).toBe('ready');
    expect(phaseOf(confirmMatch(configured, match('active')))).toBe('active');
    expect(phaseOf(confirmMatch(configured, match('paused')))).toBe('paused');
    expect(phaseOf(confirmMatch(configured, match('completed')))).toBe('completed');
    expect(phaseOf(confirmMatch(configured, match('cancelled')))).toBe('cancelled');
  });

  it('rejects illegal and conflicting commands while a command is pending', () => {
    const pending = beginCommand(createFightWorkflow(), 'createMatch');
    expect(() => beginCommand(pending, 'createMatch')).toThrow(IllegalFightCommandError);
    expect(() => selectToon(pending, toon)).toThrow(IllegalFightCommandError);
    expect(() => selectLoadout(pending, loadout, toon)).toThrow(IllegalFightCommandError);
    expect(() => selectMatchOptions(pending, {
        gel: 'acid',
        fighterId: 'KAI',
        stageId: 'club_floor',
        engine: 'ah-scripted',
      })).toThrow(
      IllegalFightCommandError,
    );
    expect(() => beginCommand(createFightWorkflow(), 'start')).toThrow(IllegalFightCommandError);
  });

  it('preserves confirmed snapshots and setup inputs when settlement fails', () => {
    const confirmed = confirmMatch(
      selectToon(createFightWorkflow(), toon),
      match('active'),
    );
    const pending = beginCommand(confirmed, 'heavy');
    const failed = settleFailure(pending, {
      kind: 'response',
      status: 422,
      message: 'Action request was rejected.',
    });

    expect(failed.match).toEqual(match('active'));
    expect(failed.selection.toon).toEqual(toon);
    expect(failed.pendingCommand).toBeNull();
    expect(failed.error).toMatchObject({ status: 422 });
  });

  it('only returns to setup after a terminal backend-confirmed match', () => {
    const active = confirmMatch(createFightWorkflow(), match('active'));
    expect(() => returnToSetup(active)).toThrow(IllegalFightCommandError);

    const completed = confirmMatch(createFightWorkflow(), match('completed'));
    expect(returnToSetup(completed)).toMatchObject({ match: null, pendingCommand: null, error: null });
    const cancelled = confirmMatch(createFightWorkflow(), match('cancelled'));
    expect(returnToSetup(cancelled).match).toBeNull();
  });
});
