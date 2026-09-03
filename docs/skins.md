# CHOONZ-mobile Skins — Design

> **Status: M-S1/M-S2 IMPLEMENTED.** M-S1 landed in mobile PR [#34](https://github.com/shapeslines/CHOONZ-mobile/pull/34) and M-S2 in [#35](https://github.com/shapeslines/CHOONZ-mobile/pull/35); current main includes the gel resolver, loadout provider, picker screen, and themed shell. M-S3 (earnable unlock UI) remains queued; M-S4 (RevenueCat/store/restore) and M-S5 (asset-backed character/scene skins) remain separately gated. This document keeps the target-state design for those future phases.

The backend owns the skin catalog and entitlement ledger; the mobile client
decodes, applies, and lets users pick skins — always render-only, never truth.

## 1. The render-only rule

The client **applies** skins; it never computes, grants, or infers them.

- Skin truth lives in the backend catalog (`GET /catalog/skins`, hash-pinned)
  and in the user's loadout (`GET /me/skins`).
- The client decodes the catalog and loadout with the strict field/enum
  checks in `src/lib/decoder.ts`. Current M-S1 resolution fails closed to the
  default tokens for an unknown skin id, a non-`ui_theme` selection, or an
  unknown gel; catalog-hash pinning and full asset-detail validation remain
  target-state work.
- The fight engine is untouched: HUD numbers, damage, meter, outcomes come
  from the server; skins only change colors, tokens, and sprites at the
  render boundary.

## 2. Token architecture (M-S1 implemented; target-state extensions remain)

`src/ui/tokens.ts` remains the static fallback. The M-S1 resolver in
`src/lib/skins.ts` maps a catalog `ui_theme` to `ResolvedThemeTokens`: a gel
palette's deep/mid/hot colors become surface/panel/accent roles, while the
default or an unknown skin resolves to the current static tokens. The
complete-token registry below remains the target contract for future
non-gel skins:

- **Target-state contract: a skin is a named token set.** `ui_theme` skins resolve to a complete
  `ThemeTokens` shape: the existing token keys (background, panel,
  panelStrong, border, accent, accentAlt, danger, text, muted) plus spacing
  and radius variants. Every skin **must** decode to a complete set — the
  decoder fills any missing key from the gel base, never leaves a hole.
- **Target-state resolution order:** `skin.base_gel` palette → optional
  `palette_overrides` → token defaults → selected `ui_theme` skin.
  `scene_vibe` skins resolve a stage presentation layer; `character` skins
  resolve a sprite set id (Club Antics `asset_ref`).
- **Target-state typed registry:** a `SkinRegistry` (module) maps decoded skin ids to
  concrete render values once per catalog version; the fight screen and app
  shell consume the registry, never raw catalog JSON.

```ts
type SkinKind = 'ui_theme' | 'scene_vibe' | 'character';
interface DecodedSkin {
  id: string;
  kind: SkinKind;
  tokens: ThemeTokens;          // resolved, complete
  assetRefs: readonly string[]; // Club Antics contract ids
}
```

## 3. Selection state (M-S2 implemented)

- `SkinProvider` exposes `useSkins()`, which loads the catalog and loadout via
  `GET /catalog/skins` and `GET /me/skins`, then updates selection through
  `PATCH /me/skins`. The current selection shape is
  `{ ui_theme, scene_vibe, character }`.
- Server selection is authoritative; the provider uses the existing
  protected-query scope, optimistic cache update, rollback on error, and
  settled invalidation discipline.
- `resolveLoadoutTheme()` keeps the current static tokens as the fallback, so
  an absent loadout, default skin, unknown id, or unknown gel does not flash an
  unthemed shell.
- Mid-match changes remain an engine-neutral target-state rule (per the backend
  design's determinism law); the current picker is selection-only.

## 4. Where skins apply (render boundary inventory)

| Surface | Skin kind | Application |
| --- | --- | --- |
| App shell (nav, background, panels) | `ui_theme` | Current M-S2 shell reads the resolved theme from `SkinProvider` |
| Fight HUD (bars, meter, timer, combo) | `ui_theme` | Current fight screen reads the same render-only theme |
| Stage/scene render | `scene_vibe` | Target-state background layer + dressing; assets remain future work |
| Character sprites (idle/attack frames) | `character` | Target-state sprite component resolves `asset_ref` → bundled/asset-pack image source |

`src/providers/app-providers.tsx` mounts `SkinProvider`; `src/ui/app-screen.tsx`
and the fight screen consume its resolved theme, while `/skins` exposes the
M-S2 selection surface. Scene and character rendering remain future seams.

## 5. Picker UX (M-S2 shipped; M-S3/M-S4 target state)

- **Current Skins screen** (route `src/app/skins.tsx`, tabbed by kind): lists
  catalog entries, marks the active selection, and allows owned/free entries
  to be selected. Planned entries show `COMING SOON`; unowned earnable and IAP
  entries currently show `UNLOCK` or `STORE` copy only.
- **Current selection** writes `PATCH /me/skins` and updates the cached
  loadout optimistically with rollback on error.
- **M-S3 (shipped):** unowned earnable entries render an **UNLOCK** button that
  calls `POST /me/skins/{id}/unlock`. A 200 re-fetches the loadout and the row becomes
  selectable; a 403 `condition_not_met` shows the server's report as `observed/required`
  (button reads **CHECK PROGRESS**); `revoked` shows REVOKED with no button. The catalog
  carries no condition — the unlock response is the only source of progress, and the
  server remains the only verifier.
- **M-S4 target:** IAP restore will ask RevenueCat for restored entitlements;
  grants remain backend-side (webhook recorded).

## 6. Fixture mode

`fixtures` mode serves the same decoded contract from bundled fixtures: the
12-entry catalog includes five gel `ui_theme` skins plus scene and character
entries, and the fixture loadout starts on the sodium/rooftop/AXEL defaults.
The M-S2 selection callback applies locally to the fixture response; no live
account or network is required.

## 7. Tests (M-S1/M-S2 coverage; future coverage remains)

Current coverage in `tests/skins.test.ts` and `tests/skins-screen.test.tsx`
checks strict catalog/loadout decoding, gel resolution and fail-closed
fallbacks, ownership/grouping, active selection, tab switching, selection
callbacks, loading, and mutation-error copy. Preview swatches, earnable
unlock requests, IAP restore, and asset-backed renderers remain future tests
for M-S3–M-S5.

## 8. Phasing (mirrors backend P-S1..P-S5)

1. **M-S1 — landed in PR #34:** registry helpers, decoder support, and gel skins as `ui_theme` (no new screens).
2. **M-S2 — landed in PR #35:** loadout queries, themed shell/HUD, and Skins screen (selection only).
3. **M-S3 — landed 2026-09-03:** earnable unlock UI + progress display; generic object-valued error `detail` on `ChoonzClientError`; fixture unlock after 5 completed practice matches.
4. **M-S4 — owner-gated:** RevenueCat integration + store CTA + restore.
5. **M-S5 — dependency-gated:** character/scene skins once Club Antics assets exist.

## 9. Open decisions (owner)

See the backend skins doc (S1–S5) — this document's decisions follow the
backend's; the only client-side addition is which surfaces ship in the first
drop (recommend: app shell + fight HUD for the gel skins).

## Revision history

- 2026-08-16 · authored · opencode/deepseek-v4-flash · target-state design.
- 2026-08-27 · implementation-status freshness update · reconciled to mobile main `ec0466f592c34651a366909ca2146e509f228992` and landed PRs #34/#35.
