import { gels, tokens } from '@/ui/tokens';
import type { MySkins, SkinCatalog, SkinKind, SkinSelection, SkinSummary } from '@/lib/types';

/**
 * M-S1 skin registry (docs/skins.md).
 *
 * The backend owns the skin catalog; this module resolves a selected skin id
 * to the concrete token values the render boundary consumes. The gel palette
 * colors come from the same static vocabulary as the backend catalog
 * (tokens.ts gels === backend GEL_PALETTES). The default skin resolves to the
 * current static tokens, so a fresh install never flashes a different look.
 */

export interface ResolvedThemeTokens {
  background: string;
  panel: string;
  panelStrong: string;
  border: string;
  accent: string;
  accentAlt: string;
  danger: string;
  text: string;
  muted: string;
  black: string;
  borderWidth: number;
  radius: number;
  space: number;
}

export function skinById(catalog: SkinCatalog, skinId: string): SkinSummary | undefined {
  return catalog.skins.find((skin) => skin.id === skinId);
}

export function defaultSkinId(catalog: SkinCatalog, kind: SkinKind): string | undefined {
  return catalog.skins.find((skin) => skin.kind === kind && skin.default)?.id;
}

/** Token role mapping for a gel palette: deep = surfaces, mid = panels, hot = accents. */
export function gelPaletteTokens(palette: {
  hot: string;
  mid: string;
  deep: string;
}): ResolvedThemeTokens {
  return {
    ...tokens,
    background: palette.deep,
    panel: palette.deep,
    panelStrong: palette.mid,
    border: palette.hot,
    accent: palette.hot,
    accentAlt: palette.mid,
    danger: palette.hot,
  };
}

/**
 * Resolve the active ui_theme token set for a skin id.
 * Unknown ids, non-ui_theme skins, and unknown gels fail closed to the
 * current static tokens.
 */
export function resolveThemeTokens(
  catalog: SkinCatalog,
  skinId: string | undefined,
): ResolvedThemeTokens {
  if (!skinId) {
    return tokens;
  }
  const skin = skinById(catalog, skinId);
  if (!skin || skin.kind !== 'ui_theme') {
    return tokens;
  }
  const palette = gels[skin.base_gel as keyof typeof gels];
  if (!palette) {
    return tokens;
  }
  if (skin.default) {
    return tokens;
  }
  return gelPaletteTokens(palette);
}

/** Resolve the theme from a user's loadout (M-S2). */
export function resolveLoadoutTheme(
  catalog: SkinCatalog,
  selection: SkinSelection | undefined,
): ResolvedThemeTokens {
  return resolveThemeTokens(catalog, selection?.ui_theme);
}

/** True when the skin is selectable: free, or present in the owned grants. */
export function isOwned(skin: SkinSummary, mySkins: MySkins | undefined): boolean {
  if (skin.entitlement === 'free') {
    return true;
  }
  return (mySkins?.owned ?? []).some((grant) => grant.skin_id === skin.id);
}

/** Skins of one kind, grouped in catalog order. */
export function skinsByKind(catalog: SkinCatalog, kind: SkinKind): SkinSummary[] {
  return catalog.skins.filter((skin) => skin.kind === kind);
}
