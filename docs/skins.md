# CHOONZ-mobile Skins — Design

> **Status: TARGET-STATE DESIGN.** Companion to the backend design
> (`CHOONZ/docs/skins.md`). The backend owns the skin catalog and the
> entitlement ledger; this document designs how the mobile client decodes,
> applies, and lets users pick skins — always render-only, never truth.
> Nothing here is implemented.

## 1. The render-only rule

The client **applies** skins; it never computes, grants, or infers them.

- Skin truth lives in the backend catalog (`GET /catalog/skins`, hash-pinned)
  and in the user's loadout (`GET /me/skins`).
- The client decodes the catalog strictly (the existing decoder pattern in
  `src/lib/decoder.ts`): unknown skin ids, an unknown catalog hash, or a
  malformed skin **fail closed to the default skin** — never to an unowned
  one and never to a crash.
- The fight engine is untouched: HUD numbers, damage, meter, outcomes come
  from the server; skins only change colors, tokens, and sprites at the
  render boundary.

## 2. Token architecture (extending `src/ui/tokens.ts`)

Today `tokens.ts` exports a static `tokens` object plus the five `gels`
palettes (hot/mid/deep). The skin system generalizes it:

- **A skin is a named token set.** `ui_theme` skins resolve to a complete
  `ThemeTokens` shape: the existing token keys (background, panel,
  panelStrong, border, accent, accentAlt, danger, text, muted) plus spacing
  and radius variants. Every skin **must** decode to a complete set — the
  decoder fills any missing key from the gel base, never leaves a hole.
- **Resolution order:** `skin.base_gel` palette → optional
  `palette_overrides` → token defaults → selected `ui_theme` skin.
  `scene_vibe` skins resolve a stage presentation layer; `character` skins
  resolve a sprite set id (Club Antics `asset_ref`).
- **Typed registry:** a `SkinRegistry` (module) maps decoded skin ids to
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

## 3. Selection state

- `useSkins()` (a query/mutation pair over `GET /me/skins` /
  `PATCH /me/skins`) holds the loadout: `{ ui_theme, scene_vibe, character_p1, character_p2 }`.
- Server selection is authoritative; local state is a cache with the
  existing `protected-queries` invalidation discipline.
- Defaults: with no rows, the server returns the free defaults — a fresh
  install renders the current static tokens until the first loadout fetch
  completes (no flash of unthemed UI: the default skin *is* the current
  tokens).
- Mid-match changes are allowed and engine-neutral (per the backend design's
  determinism law); the client just re-renders.

## 4. Where skins apply (render boundary inventory)

| Surface | Skin kind | Application |
| --- | --- | --- |
| App shell (nav, background, panels) | `ui_theme` | Token set at the root provider |
| Fight HUD (bars, meter, timer, combo) | `ui_theme` | HUD components read the registry |
| Stage/scene render | `scene_vibe` | Background layer + dressing |
| Character sprites (idle/attack frames) | `character` | Sprite component resolves `asset_ref` → bundled/asset-pack image source |

`src/ui/app-screen.tsx` and the fight screen are the two integration seams;
everything else consumes the same registry.

## 5. Picker UX (design)

- **Skins screen** (route `src/app/skins.tsx`, tabbed by kind): cards list
  owned skins with preview swatches; unowned `earnable` skins show their
  unlock condition; unowned `iap` skins show a store CTA (P-S4 only).
- **Selection** writes `PATCH /me/skins` and updates the registry
  optimistically with rollback on error (the established mutation pattern).
- **Earnable unlocks** surface the condition ("Win 3 series with REX") and
  trigger `POST /me/skins/{id}/unlock`; the server is the only verifier.
- **Restore purchases** (IAP only): a button that asks RevenueCat for
  restored entitlements; grants are backend-side (webhook already recorded).

## 6. Fixture mode

`fixtures` mode serves the same decoded contract from bundled fixtures (the
existing pattern): the 5 gel skins + defaults decode and render without a
server. Fixture data carries a `fixture` marker; no network, no tokens.

## 7. Tests (design)

- Decoder: strict rejection of unknown hash/ids; every skin decodes to a
  complete token set; fail-closed to default.
- Registry: resolution order (gel → overrides → defaults); snapshot of the
  default skin equals today's static tokens.
- Renderer: HUD and shell render with a non-default skin; snapshot test.
- Selection: optimistic update + rollback on 4xx; persistence round-trip via
  mocked `PATCH`.
- Fixture: skins screen renders the bundled catalog in fixtures mode.

## 8. Phasing (mirrors backend P-S1..P-S5)

1. **M-S1:** registry + decoder + gel skins as `ui_theme` (no new screens).
2. **M-S2:** loadout queries + Skins screen (selection only).
3. **M-S3:** earnable unlock UI + conditions display.
4. **M-S4:** RevenueCat integration + store CTA + restore (owner-gated).
5. **M-S5:** character/scene skins once Club Antics assets exist.

## 9. Open decisions (owner)

See the backend skins doc (S1–S5) — this document's decisions follow the
backend's; the only client-side addition is which surfaces ship in the first
drop (recommend: app shell + fight HUD for the gel skins).

## Revision history

- 2026-08-16 · authored · opencode/deepseek-v4-flash · target-state design.
