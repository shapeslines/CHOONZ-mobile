# Plan — `m-s3-earnable-ui` (earnable unlock UI + object-valued error `detail`)

**Status:** open, gate met (CHOONZ #125 shipped `POST /me/skins/{id}/unlock`, 2026-09-02).
**Rank:** 1. **Size:** M. **Branch:** `lane/choonzm-m-s3/<yyyymmdd>`.

## Goal

A player can unlock an earnable skin from the Skins screen: tapping **UNLOCK** calls the backend,
a 200 grants and the row becomes selectable, a 403 shows real progress (`observed/required`) from
the server's condition report, a revoked grant shows as revoked. The client never infers an unlock
locally. Along the way the API client learns to carry object-valued error `detail` generically, so
the proposed ARC686 409 `{detail:{code, message, receipt?}}` decodes with no further change.

## Spec sources (restated, not re-derived)

- Backend contract (CHOONZ `docs/mobile-integration.md`, P-S3 addendum; `app/api/routes/my_skins.py`):
  `POST /me/skins/{skin_id}/unlock` (first-party bearer) → `200 {skin_id, source:"earnable",
  granted_at, condition:{id:"complete_n_matches", required, observed}}` (idempotent);
  `403 {detail:{code:"condition_not_met"|"revoked", message, condition?}, error_id}`; `404`
  unknown; `422` not earnable. Catalog summaries carry **no** condition (hash contract unchanged);
  the unlock response is the only source of `required/observed`. Earnable id today:
  `gel:sodium-ember` (N = 5 completed matches).
- `docs/skins.md` §5 (M-S3 target), §6 fixture mode, §7 future tests, §8 phasing.
- Client code: `src/lib/api.ts` `request()` (never reads a non-2xx body today); `src/lib/errors.ts`
  (`ChoonzClientError(kind, message, status?)`); `src/lib/decoder.ts` primitives + `decodeMySkins`
  (inline grant decode); `src/lib/types.ts` skin types; `src/providers/skin-provider.tsx`
  (optimistic select mutation, global `selecting`/`selectError`); `src/app/skins.tsx` `SkinRow`
  (inert `UNLOCK` text); `src/lib/fixtures.ts` (all-free catalog, `owned: []`);
  `src/lib/fixture-match-service.ts` (`matches` map with status).

## Design

- **Error carrier (generic, additive, no new `ClientFailureKind`):** `ApiErrorDetail { code:
  string; message: string; extra: Record<string, unknown> }`; `ChoonzClientError` gains a 4th ctor
  arg / `readonly detail?`. `request()` reads the non-2xx body best-effort (`try { await
  response.json() } catch {}`) and attaches `decodeApiErrorDetail(payload)`: object →
  `{code, message, extra: rest}`; string detail → `{code:'unknown', message, extra:{}}`; empty →
  `undefined`. Existing empty-body `it.each([403,404,422])` tests stay green.
- **Types/decoders:** `SkinUnlockCondition {id, required, observed}`, `SkinUnlockReceipt extends
  SkinGrant {condition}`, `SkinUnlockOutcome = granted | condition_not_met | revoked`;
  `decodeApiErrorDetail`, `decodeSkinGrant` (hoisted out of `decodeMySkins`),
  `decodeSkinUnlockCondition`, `decodeSkinUnlockReceipt` — strict, fail-closed.
- **Client:** `unlockSkin(skinId): Promise<SkinUnlockOutcome>`; POST via `fromMode` to
  `/me/skins/${encodeURIComponent(id)}/unlock`; 403 `condition_not_met` / `revoked` → outcome;
  404/422/other → rethrow.
- **Fixture mode:** per-client mutable `fixtureLoadout` (pattern of `fixtureProfile`) so grants
  persist across `getMySkins`/`updateMySkins`; `FixtureMatchService.completedMatchCount()` gates
  fixture unlock at `FIXTURE_UNLOCK_REQUIRED = 5`; `fixtureSkinCatalog` gains `gel:sodium-ember`
  (earnable), `count` 13.
- **Provider:** non-optimistic `useMutation`; `onSettled` invalidate `mySkinsQueryKey(scope)`;
  `unlockReports: Record<skinId, SkinUnlockOutcome>`, `unlocking: string | null`,
  `unlockError: string | null`; expose `unlockSkin`.
- **UI `SkinRow`:** earnable + unowned → `Pressable accessibilityLabel="unlock-skin-<id>"`, label
  `UNLOCK` / `CHECK PROGRESS` (once a report exists) / `UNLOCKING…` (disabled); meta appends
  ` · 3/5 MATCHES` or ` · REVOKED`; iap stays inert `STORE`; `unlockError` beside `selectError`.
- **Decisions on held questions:** progress is learned by the tap (no auto-probe on mount — a
  probe silently grants when met); a 200 does not auto-select; condition copy = generic
  `observed/required` plus a small id→label map with raw-id fallback; fixture N = 5 mirrors backend.

## Write fence

`src/lib/errors.ts`, `src/lib/api.ts`, `src/lib/decoder.ts`, `src/lib/types.ts`,
`src/lib/fixtures.ts`, `src/lib/fixture-match-service.ts`, `src/providers/skin-provider.tsx`,
`src/app/skins.tsx`, `tests/api.test.ts`, `tests/skins.test.ts`, `tests/skins-screen.test.tsx`,
`docs/skins.md`, this plan, frontlog, pin.

## Out of scope

`package.json` / lockfile (npm-audit exception); providers, EAS, store; IAP (M-S4); catalog
condition fields (backend hash contract); auto-select after unlock; fight screens.

## Slice ledger

- [ ] S0 Baseline: `npm test`, `npm run test:screen`, `npm run typecheck`, `npm run lint` green on main.
- [ ] S1 `ApiErrorDetail` + `request()` body decode + `decodeApiErrorDetail`; api tests (object /
      string / empty detail).
- [ ] S2 Unlock types + decoders (`decodeSkinGrant` hoisted); decoder tests.
- [ ] S3 `unlockSkin` client method (API + fixture); `completedMatchCount`; fixture catalog entry;
      api tests (200, 403 report, 404/422 rethrow, fixture gating + persistence); count 12 → 13.
- [ ] S4 Provider mutation + report state.
- [ ] S5 `SkinRow` UI; screen tests (unlock callback, progress copy, revoked, iap inert).
- [ ] S6 `docs/skins.md` M-S3 shipped; frontlog; pin.

## Acceptance

```powershell
npm run lint ; npm run typecheck ; npm test ; npm run test:screen ; npm run expo:check ; npm run build
```
No new dependencies; lockfile untouched.

## Branch / PR

`lane/choonzm-m-s3/<yyyymmdd>`; PR title `feat(skins): M-S3 earnable unlock UI + object-valued error detail`.
