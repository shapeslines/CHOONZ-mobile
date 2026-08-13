import { describe, expect, it } from 'vitest';

import { FixtureMatchService } from '../src/lib/fixture-match-service';

describe('deterministic fixture match service', () => {
  it('starts from a fixed Toon/loadout and produces repeatable ordered action tape HUDs', async () => {
    const first = new FixtureMatchService();
    const second = new FixtureMatchService();
    const [firstToons, secondToons] = await Promise.all([first.getToons(), second.getToons()]);
    expect(firstToons).toEqual(secondToons);
    expect(await first.getLoadouts()).toEqual(await second.getLoadouts());

    const create = { p1_toon_id: firstToons[0]!.id, p1_gel: 'sodium', stage_id: 'rooftop', seed: 677 };
    const [a, b] = await Promise.all([first.createMatch(create), second.createMatch(create)]);
    await Promise.all([first.startMatch(a.id), second.startMatch(b.id)]);
    await Promise.all([
      first.actMatch(a.id, { action: 'light', side: 'p1', advance: true }),
      second.actMatch(b.id, { action: 'light', side: 'p1', advance: true }),
    ]);
    await Promise.all([
      first.actMatch(a.id, { action: 'heavy', side: 'p1', advance: true }),
      second.actMatch(b.id, { action: 'heavy', side: 'p1', advance: true }),
    ]);

    const [firstState, secondState] = await Promise.all([first.getMatchState(a.id), second.getMatchState(b.id)]);
    expect(firstState).toEqual(secondState);
    expect(firstState.combo).toBe(2);
    expect(firstState.p2.hp).toBeLessThan(100);
    expect(firstState.sound_hooks).toEqual(['heavy']);
  });

  it('enforces lifecycle and creates a deterministic ready rematch after completion', async () => {
    const service = new FixtureMatchService();
    const toon = (await service.getToons())[0]!;
    const ready = await service.createMatch({ p1_toon_id: toon.id });

    await expect(service.actMatch(ready.id, { action: 'light' })).rejects.toMatchObject({ status: 409 });
    const active = await service.startMatch(ready.id);
    expect(active).toMatchObject({
      status: 'active',
      allowed_transitions: ['cancelled', 'completed', 'paused'],
    });
    await service.tickMatch(active.id, { delta: 3 });
    const paused = await service.pauseMatch(active.id);
    expect(paused.status).toBe('paused');
    await expect(service.tickMatch(paused.id)).rejects.toMatchObject({ status: 409 });
    await service.resumeMatch(active.id);
    const completed = await service.completeMatch(active.id);
    expect(completed).toMatchObject({
      status: 'completed',
      result_step: 3,
      share_token: null,
      telemetry: { input_count: 0 },
    });

    const rematch = await service.rematch(completed.id);
    expect(rematch).toMatchObject({
      status: 'ready',
      seed: completed.seed + 1,
      last_step: 0,
      share_token: null,
    });
    const unstarted = await service.createMatch({ p1_toon_id: toon.id });
    await expect(service.rematch(unstarted.id)).rejects.toMatchObject({ status: 409 });
  });

  it('uses status-bearing validation errors and never exposes a live transport path', async () => {
    const service = new FixtureMatchService();
    await expect(service.createToon({ name: ' ' })).rejects.toMatchObject({ status: 422 });
    await expect(service.getMatch(999)).rejects.toMatchObject({ status: 404 });
    const toon = await service.createToon({ name: 'Local Toon' });
    const loadout = await service.createLoadout({ toon_id: toon.id, gel: 'uv', fighter_id: 'NYX' });
    expect(loadout).toMatchObject({ toon_id: toon.id, gel: 'uv', fighter_id: 'NYX' });
  });
});
