import { describe, expect, it } from 'vitest';

import {
  decodeApiErrorDetail,
  decodeMySkins,
  decodeSkinCatalog,
  decodeSkin,
  decodeSkinGrant,
  decodeSkinSummary,
  decodeSkinUnlockCondition,
  decodeSkinUnlockReceipt,
} from '../src/lib/decoder';
import { fixtureMySkins, fixtureSkinCatalog } from '../src/lib/fixtures';
import type { SkinSummary } from '../src/lib/types';
import {
  defaultSkinId,
  gelPaletteTokens,
  isOwned,
  resolveLoadoutTheme,
  resolveThemeTokens,
  skinsByKind,
  skinById,
} from '../src/lib/skins';
import { gels, tokens } from '../src/ui/tokens';

describe('skin catalog decoder', () => {
  it('decodes the fixture catalog shape strictly', () => {
    const decoded = decodeSkinCatalog(fixtureSkinCatalog);
    expect(decoded.schema_version).toBe('1.0');
    expect(decoded.count).toBe(13);
    expect(decoded.skins).toHaveLength(13);
    const sodium = decoded.skins.find((skin) => skin.id === 'gel:sodium');
    expect(sodium?.default).toBe(true);
    expect(sodium?.entitlement).toBe('free');
  });

  it('rejects a malformed catalog fail-closed', () => {
    expect(() => decodeSkinCatalog({ ...fixtureSkinCatalog, count: 'many' })).toThrow();
    expect(() =>
      decodeSkinCatalog({
        ...fixtureSkinCatalog,
        skins: [{ ...fixtureSkinCatalog.skins[0], kind: 'mystery' }],
      }),
    ).toThrow();
    expect(() =>
      decodeSkinCatalog({ ...fixtureSkinCatalog, skins: 'nope' }),
    ).toThrow();
  });

  it('decodes a full skin detail with palette and asset refs', () => {
    const decoded = decodeSkin({
      ...fixtureSkinCatalog.skins[0],
      palette: { hot: '#63A014', mid: '#1E3A0E', deep: '#050E06' },
      asset_refs: ['club-antics:acid-pack'],
    });
    expect(decoded.palette.hot).toBe('#63A014');
    expect(decoded.asset_refs).toEqual(['club-antics:acid-pack']);
  });

  it('rejects unknown summary fields of the wrong type', () => {
    const bad = { ...fixtureSkinCatalog.skins[0], default: 'yes' };
    expect(() => decodeSkinSummary(bad)).toThrow();
  });
});

describe('skin registry', () => {
  it('finds skins by id and per-kind defaults', () => {
    expect(skinById(fixtureSkinCatalog, 'gel:red')?.kind).toBe('ui_theme');
    expect(skinById(fixtureSkinCatalog, 'nope')).toBeUndefined();
    expect(defaultSkinId(fixtureSkinCatalog, 'ui_theme')).toBe('gel:sodium');
    expect(defaultSkinId(fixtureSkinCatalog, 'scene_vibe')).toBe('vibe:rooftop');
  });

  it('resolves the default skin to the current static tokens (no visual drift)', () => {
    const resolved = resolveThemeTokens(fixtureSkinCatalog, 'gel:sodium');
    expect(resolved).toEqual(tokens);
  });

  it('resolves a non-default gel skin to that gel palette', () => {
    const resolved = resolveThemeTokens(fixtureSkinCatalog, 'gel:red');
    expect(resolved.background).toBe(gels.red.deep);
    expect(resolved.panel).toBe(gels.red.deep);
    expect(resolved.panelStrong).toBe(gels.red.mid);
    expect(resolved.accent).toBe(gels.red.hot);
    expect(resolved.danger).toBe(gels.red.hot);
  });

  it('fails closed to static tokens for unknown ids and non-theme kinds', () => {
    expect(resolveThemeTokens(fixtureSkinCatalog, undefined)).toEqual(tokens);
    expect(resolveThemeTokens(fixtureSkinCatalog, 'nope')).toEqual(tokens);
    expect(resolveThemeTokens(fixtureSkinCatalog, 'char:axel-stock')).toEqual(tokens);
  });

  it('gelPaletteTokens maps deep/mid/hot to surface/panel/accent roles', () => {
    const mapped = gelPaletteTokens({ hot: '#HOT', mid: '#MID', deep: '#DEEP' });
    expect(mapped.background).toBe('#DEEP');
    expect(mapped.panel).toBe('#DEEP');
    expect(mapped.panelStrong).toBe('#MID');
    expect(mapped.accent).toBe('#HOT');
    expect(mapped.accentAlt).toBe('#MID');
  });
});

describe('skin loadout (M-S2)', () => {
  it('decodes MySkins strictly', () => {
    const decoded = decodeMySkins({
      owned: [{ skin_id: 'gel:gold', source: 'earnable', granted_at: '2026-08-16T00:00:00Z' }],
      selection: { ui_theme: 'gel:red', scene_vibe: 'vibe:rooftop', character: 'char:axel-stock' },
    });
    expect(decoded.owned[0]?.skin_id).toBe('gel:gold');
    expect(decoded.selection.ui_theme).toBe('gel:red');
  });

  it('rejects malformed loadouts fail-closed', () => {
    expect(() =>
      decodeMySkins({ owned: 'nope', selection: { ui_theme: 'x', scene_vibe: 'y', character: 'z' } }),
    ).toThrow();
    expect(() =>
      decodeMySkins({
        owned: [],
        selection: { ui_theme: 'x', scene_vibe: 'y', character: 'z', extra: 1 },
      }),
    ).not.toThrow(); // extra fields are ignored, missing/typed fields are not
    expect(() =>
      decodeMySkins({ owned: [], selection: { ui_theme: 1, scene_vibe: 'y', character: 'z' } }),
    ).toThrow();
  });

  it('resolves the theme from the loadout', () => {
    const resolved = resolveLoadoutTheme(fixtureSkinCatalog, {
      ui_theme: 'gel:red',
      scene_vibe: 'vibe:rooftop',
      character: 'char:axel-stock',
    });
    expect(resolved.background).toBe(gels.red.deep);
    const defaults = resolveLoadoutTheme(fixtureSkinCatalog, {
      ui_theme: 'gel:sodium',
      scene_vibe: 'vibe:rooftop',
      character: 'char:axel-stock',
    });
    expect(defaults).toEqual(tokens);
    expect(resolveLoadoutTheme(fixtureSkinCatalog, undefined)).toEqual(tokens);
  });

  it('isOwned: free always, earnable/iap only with a grant', () => {
    const free = fixtureSkinCatalog.skins.find((skin) => skin.id === 'gel:red');
    expect(free && isOwned(free, undefined)).toBe(true);
    const earnable: SkinSummary = {
      id: 'gel:gold', kind: 'ui_theme', display_name: 'Gold', description: 'Earnable variant',
      entitlement: 'earnable', base_gel: 'sodium', default: false, status: 'built',
    };
    expect(isOwned(earnable, undefined)).toBe(false);
    expect(isOwned(earnable, { owned: [{ skin_id: 'gel:gold', source: 'earnable', granted_at: '' }], selection: fixtureMySkins.selection })).toBe(true);
  });

  it('groups skins by kind', () => {
    expect(skinsByKind(fixtureSkinCatalog, 'ui_theme')).toHaveLength(6);
    expect(skinsByKind(fixtureSkinCatalog, 'character')).toHaveLength(5);
    expect(skinsByKind(fixtureSkinCatalog, 'scene_vibe')).toHaveLength(2);
  });
});

describe('skin unlock decoders (M-S3)', () => {
  const receipt = {
    skin_id: 'gel:sodium-ember',
    source: 'earnable',
    granted_at: '2026-09-03T00:00:00Z',
    condition: { id: 'complete_n_matches', required: 5, observed: 5 },
  };

  it('decodes an unlock receipt strictly', () => {
    const decoded = decodeSkinUnlockReceipt(receipt);
    expect(decoded.source).toBe('earnable');
    expect(decoded.condition).toEqual({ id: 'complete_n_matches', required: 5, observed: 5 });
  });

  it('rejects a receipt whose source is not earnable or whose condition is malformed', () => {
    expect(() => decodeSkinUnlockReceipt({ ...receipt, source: 'free' })).toThrow();
    expect(() =>
      decodeSkinUnlockReceipt({ ...receipt, condition: { id: 'x', required: 5, observed: 2.5 } }),
    ).toThrow();
    expect(() => decodeSkinUnlockCondition({ id: 'x', required: -1, observed: 0 })).toThrow();
  });

  it('decodeSkinGrant rejects unknown sources', () => {
    expect(() => decodeSkinGrant({ skin_id: 'a', source: 'gift', granted_at: 'now' })).toThrow();
  });

  it('decodeApiErrorDetail accepts string and object detail and rejects the rest', () => {
    expect(decodeApiErrorDetail({ detail: 'nope' })).toEqual({ code: 'unknown', message: 'nope', extra: {} });
    expect(
      decodeApiErrorDetail({ detail: { code: 'x', message: 'm', receipt: { r: 1 } }, error_id: 'abc' }),
    ).toEqual({ code: 'x', message: 'm', extra: { receipt: { r: 1 } } });
    expect(decodeApiErrorDetail({ detail: { message: 'no code' } })).toBeUndefined();
    expect(decodeApiErrorDetail('garbage')).toBeUndefined();
    expect(decodeApiErrorDetail(null)).toBeUndefined();
  });
});
