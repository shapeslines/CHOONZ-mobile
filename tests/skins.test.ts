import { describe, expect, it } from 'vitest';

import { decodeSkinCatalog, decodeSkin, decodeSkinSummary } from '../src/lib/decoder';
import { fixtureSkinCatalog } from '../src/lib/fixtures';
import {
  defaultSkinId,
  gelPaletteTokens,
  resolveThemeTokens,
  skinById,
} from '../src/lib/skins';
import { gels, tokens } from '../src/ui/tokens';

describe('skin catalog decoder', () => {
  it('decodes the fixture catalog shape strictly', () => {
    const decoded = decodeSkinCatalog(fixtureSkinCatalog);
    expect(decoded.schema_version).toBe('1.0');
    expect(decoded.count).toBe(12);
    expect(decoded.skins).toHaveLength(12);
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
