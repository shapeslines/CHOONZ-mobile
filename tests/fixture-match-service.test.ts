import { describe, expect, it } from 'vitest';

import { FixtureMatchService } from '../src/lib/fixture-match-service';

describe('deterministic fixture match service', () => {
  it('echoes the requested engine on a fixture match and defaults to ah-scripted', async () => {
    const service = new FixtureMatchService();
    const toons = await service.getToons();
    const base = { p1_toon_id: toons[0]!.id, p1_gel: 'sodium', stage_id: 'rooftop', seed: 677 };

    expect((await service.createMatch(base)).engine).toBe('ah-scripted');
    expect((await service.createMatch({ ...base, engine: 'fight-v2' })).engine).toBe('fight-v2');
    expect((await service.createMatch({ ...base, engine: 'ah-scripted' })).engine).toBe('ah-scripted');
  });

  it('stamps a fixture series engine on its first bout and reads it back from there', async () => {
    const service = new FixtureMatchService();
    const toons = await service.getToons();
    const base = { p1_toon_id: toons[0]!.id, p1_gel: 'sodium', stage_id: 'rooftop' };

    const scripted = await service.createSeries(base);
    expect(scripted.engine).toBe('ah-scripted');
    expect((await service.getMatch(scripted.match_ids[0]!)).engine).toBe('ah-scripted');

    const v2 = await service.createSeries({ ...base, engine: 'fight-v2' });
    expect(v2.engine).toBe('fight-v2');
    expect(v2.open_match_id).toBe(v2.match_ids[0]);
    const bout = await service.getMatch(v2.open_match_id!);
    expect(bout.engine).toBe('fight-v2');
    expect(bout.series_id).toBe(v2.id);
    expect(v2.best_of).toBe(3);
    expect(v2.wins_needed).toBe(2);
  });

  it('carries the engine of the original match into a fixture rematch', async () => {
    const service = new FixtureMatchService();
    const toons = await service.getToons();
    const created = await service.createMatch({
      p1_toon_id: toons[0]!.id,
      p1_gel: 'sodium',
      stage_id: 'rooftop',
      seed: 677,
      engine: 'fight-v2',
    });
    await service.startMatch(created.id);
    await service.completeMatch(created.id);

    expect((await service.rematch(created.id)).engine).toBe('fight-v2');
  });

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
