# Mechanics lab transfer

Status: reconciled and transferred; prepared for draft PR review.

## Scope

Transfer the uncommitted lab from the bootstrap checkout onto current main in
`lane/choonzm-lab-transfer/20260905`. Target: authenticated, non-production API mode.
Preserve the hidden route, server-only replay and API eligibility guard.

## Reconciliation

Main already incorporates the original lab, PR #53 revision-2/fight-v2 decoder
contract, PR #54 absent-or-null handling, and PR #57 revision selector. Keep those
implementations instead of replaying obsolete additions over them. Carry forward
the local receipt identity display and API regression tests. Port local screen
assertions into the existing native screen suite. Keep dependency files untouched.
The original lab files and binary patch are preserved in the sibling
`mechanics-lab-transfer-backup` directory with SHA-256 hashes.

## Fence and verification

- `src/app/lab.tsx`
- `tests/mechanics-api.test.ts`, `tests/lab-screen.test.tsx`
- `tests/fight-api.test.ts`, `tests/protected-queries.test.ts`
- This plan

Run npm ci, npm test, npm run test:screen, npm run typecheck, npm run lint,
npm run expo:check, npm run expo:doctor, npm run build, and docs-surface lint.
Record actual outcomes below; no manifest or lockfile repair in this slice.

## Receipt

- Base: `f565fbf` (current origin/main at transfer); includes PRs #53, #54, #55, #57.
- Kept main implementations for README, route registration, API, config, decoder,
  types, and protected-query infrastructure; their lab behavior supersedes the
  old bootstrap additions. Retained explicit authenticated query eligibility.
- Carried local replay receipt schema/corpus/engine/hash UI into the current lab.
- Ported local API tests and cache coverage; native screen coverage replaces the
  old bootstrap React DOM mocks. Added revision identity and both-side null tests.
- `npm ci`: PASS with committed dependencies; npm reports 13 moderate advisories.
- `npm test`: PASS, 124 tests. Guard hardening follow-up: 13 mechanics tests PASS.
- `npm run test:screen`: PASS, 65 tests in 8 suites. Updated the old single-identity
  assertion to expect the preserved list and receipt identities separately.
- `npm run typecheck`, `npm run lint`, `npm run expo:check`: PASS.
- `npm run build`: PASS, 9 static routes; validation export only.
- Docs-surface lint and `git diff --check`: PASS.
- `npm run expo:doctor`: FAIL, 19/20 checks. Existing locked patch versions differ
  from Expo's expected versions: expo 57.0.18 vs ~57.0.20; expo-constants 57.0.16
  vs ~57.0.17; expo-font 57.0.2 vs ~57.0.3; expo-linking 57.0.8 vs ~57.0.9;
  expo-router 57.0.17 vs ~57.0.19; expo-secure-store 57.0.2 vs ~57.0.3.
- Manifest and lockfile are byte-identical to the transfer base. No merge,
  deployment, credential change, or dependency repair performed. The owner
  subsequently requested draft PR publication.
- Source lab changes removed only after SHA-256 verification against the durable
  backup; its two unrelated security drafts remain untouched.

Next pickup: review this worktree. Resolving Expo Doctor requires the separately
scoped dependency review; do not claim all mobile gates are green.
