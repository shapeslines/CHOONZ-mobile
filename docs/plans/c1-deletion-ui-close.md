# Plan — `c1-deletion-ui-close` (per-status account-deletion handling)

**Status:** done on lane `lane/choonzm-c1-deletion-close/20260903` (2026-09-03); no gate (backend
`DELETE /me` shipped 2026-08-16).
**Rank:** 3. **Size:** S. **Branch:** `lane/choonzm-c1-deletion-close/<yyyymmdd>`.

## Goal

The C1 in-app account-deletion flow already exists on `main` (typed-confirm panel plus
`api.deleteAccount()`), but every failure collapses into one generic string: a 404 that means "the
account is already gone" reads as an error, a 422 hides the server's reason, and a dropped
connection leaves the player with no way to try again. This lane closes C1 by giving the profile
screen the per-status contract `docs/store-readiness.md` §3 already promises, and by correcting that
section where it disagrees with the shipped backend and client.

## Spec sources (restated, not re-derived)

- Backend contract (CHOONZ `app/api/routes/me.py`, `AccountDeleteRequest`): `DELETE /me` with body
  **exactly `{confirm: true}`** → `204`. The request never names a subject; the bearer token is the
  only subject. `docs/store-readiness.md` §3's `{confirm: true, subject}` was wrong and is fixed by
  this lane.
- Per-status contract (`docs/store-readiness.md` §3, restated): 401 → session finalize; 403 → scope
  denial; 404 → treat as already deleted, clear local state; 422 → show the missing-confirm reason;
  5xx → preserve state, offer retry.
- Client code: `src/lib/api.ts` `deleteAccount()` (`fromMode('/me', null, …, 'DELETE',
  {confirm: true}, 204)`; fixture mode fails closed with a 403); `request()` attaches
  `ChoonzClientError.detail = {code, message, extra}` on every non-2xx body (M-S3, PR #50) and
  handles 401 itself through `onUnauthorized`; `src/lib/errors.ts` `ChoonzClientError {kind, status,
  detail}`; `src/app/profile.tsx` typed-confirm panel + `deleteAccount` handler.
- The confirm phrase shipped in code is **`DELETE MY ACCOUNT`** and is canonical; §3's
  `DELETE YOUR ACCOUNT` was wrong and is fixed by this lane.

## Design

- **`classifyDeleteFailure(reason)` (pure, exported from `src/app/profile.tsx`)** maps a rejection to
  `{outcome:'already-deleted'}` or `{outcome:'failed', message, retryable}`:

  | Condition | Outcome |
  | --- | --- |
  | `status === 404` | `already-deleted` — finalize exactly like success |
  | `status === 422` | `failed`, `detail.message` (fallback `DELETE_INVALID_COPY`), not retryable |
  | `status === 403` | `failed`, `DELETE_DENIED_COPY`, not retryable |
  | `kind === 'network'` or `status >= 500` | `failed`, `DELETE_UNAVAILABLE_COPY`, **retryable** |
  | anything else | `failed`, `errorMessage(reason)`, not retryable |

  401 is absent by design: `request()` already routes it to `onUnauthorized` and the auth provider
  finalizes the session.
- **`useAccountDeletion({deleteAccount, signOut, clearQueries})` (exported hook)** owns the confirm
  state machine. Success and `already-deleted` both run the same `finalize()` — `signOut()` (best
  effort; the server account is gone either way) then `clearQueries()` then reset the panel. A
  retryable failure **keeps** `confirming` and the typed phrase so the same tap target can re-invoke
  the delete; a non-retryable failure resets the panel and leaves the message on screen.
- **UI:** `ProfileContent` gains `deleteRetryable` / `onRetryDelete` and renders one extra
  `accessibilityLabel="retry-delete-account"` button inside the confirming branch. Every existing
  label (`request-delete-account`, `delete-account-confirm`, `cancel-delete-account`,
  `confirm-delete-account`) and the typed-confirm gate are unchanged; the phrase moves to the
  exported `DELETE_CONFIRM_PHRASE` constant so screen and copy cannot drift.
- No new dependencies; the existing static `tokens` styles carry the retry button.

## Write fence

`src/app/profile.tsx`, `tests/profile-screen.test.tsx`, `tests/api.test.ts`,
`docs/store-readiness.md`, `docs/WORK-FRONTLOG.md`, `docs/groundwork.md`, `docs/plans/README.md`,
this plan.

## Out of scope

`package.json` / lockfile (npm-audit exception, review due 2026-09-10); `src/lib/api.ts` and the
`DELETE /me` body (already correct); the pre-confirm **explainer step** and `src/app/privacy.tsx`
(M5, owner-gated); providers, EAS, store records; `docs/next-session.md` (owned by another seat this
session).

## Slice ledger

- [x] S0 Baseline on `main`: Vitest 89, Jest 45, typecheck, lint green.
- [x] S1 `classifyDeleteFailure` + `useAccountDeletion` + retry affordance in `src/app/profile.tsx`.
- [x] S2 Screen tests: per-status cases over the hook, retry affordance on `ProfileContent`.
- [x] S3 Client test: `deleteAccount()` rejects with `detail` decoded from a 422 body.
- [x] S4 `docs/store-readiness.md` §3 correction + shipped mark; frontlog rank 3; groundwork.

## Acceptance

```powershell
npm run typecheck ; npm run lint ; npx vitest run ; npm run test:screen ; npm run expo:check
```
Plus `git status --porcelain -- package.json package-lock.json` empty.

Result: Vitest 89 → 90, Jest 45 → 53, typecheck, lint (0 warnings), expo:check green; lockfile
untouched.

## Held questions

- **403 copy is fixed, not `detail.message`.** A denial is a scope/first-party fact, not a field
  error, so the client states it in its own words. If the backend later ships a machine-readable
  denial code the row can start reading `detail`.
- **Retry is manual, never automatic.** Deletion is destructive; the client never re-fires it on the
  player's behalf.
- **The explainer step stays unbuilt.** §3 designs a pre-confirm explainer screen and a
  `src/app/privacy.tsx` link; both are M5 owner-gated (hosted privacy URL) and out of this fence.

## Branch / PR

`lane/choonzm-c1-deletion-close/<yyyymmdd>`; PR title
`feat(profile): C1 per-status account-deletion handling`.
