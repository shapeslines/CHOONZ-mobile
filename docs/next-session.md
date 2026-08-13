# CHOONZ-mobile — next session

## State @ draft-reconciliation candidate · 2026-08-13

P1, P2 profile/account polish, the developer-only P3 mechanics lab, and the
catalog/fight accessibility announcement slices are on `main`. The 17 retained
drafts #8–#25 have been reconciled in one preservation union: already-landed or
superseded rolling changes are retained through ancestry; dated evidence remains
available as historical records; and the four still-live source/test fixes from
#22–#25 are applied to current main.

## Verification

- locked clean install: PASS
- Vitest: 59/59
- rendered Jest/RNTL: 33/33
- lint, typecheck, Expo config, Expo Doctor: PASS
- static web export: PASS, eight routes
- every original draft head #8–#25: ancestor of the reconciliation candidate

## Active boundaries

- Production EAS build/store submission, Supabase provider changes, and branch
  protection remain owner-only.
- Web export remains validation-only until the documented CSP review and an
  owner-approved report-only rollout are repeated against the intended release.
- The accepted npm audit exception is due for review on **2026-09-10**. Any
  package, lockfile, or CI change requires a fresh dependency review.
- The mechanics lab remains non-production, API-only, and exact-flag gated.

## Next

1. Obtain exact-head hosted CI for the reconciliation union and merge it without
   squashing away the preserved draft ancestry.
2. Confirm exact-main CI after landing; all 17 original drafts should then be
   recognized as merged through ancestry.
3. Keep production build, provider, hosting, and store actions closed unless the
   owner opens a specific gate.
