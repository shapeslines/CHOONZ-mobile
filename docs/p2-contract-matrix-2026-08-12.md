---
title: "P2 cross-repository contract matrix receipt"
project_id: tinytoonz
arc_id: E15-ARC-677
phase: p2
date: 2026-08-12
status: review-only
verdict: CONDITIONAL
scope: cross-repository-acceptance
base: origin/main@9a9388244ff09b4376c5c2b3148d1a4114dc105b
---

# CHOONZ P2 cross-repository contract matrix

This receipt records a focused, read-only comparison between the exact P2
backend and mobile review heads. It binds the mobile methods and decoders to
the backend route, response, status, and field contract named by ARC 677. It
does not release carrier custody, approve a merge, or claim production JWT
classification.

## Exact review heads

| Surface | Head | Live review state | Evidence source |
| --- | --- | --- | --- |
| Backend contract | [CHOONZ PR #45](https://github.com/shapeslines/CHOONZ/pull/45) `fd445b75c1c77ce26271aed093abde0117e1d782` | Open, ready for review, unmerged | `tests/test_mobile_api_contract.py`, `docs/mobile-integration.md` |
| Mobile P2 implementation | [CHOONZ-mobile PR #15](https://github.com/shapeslines/CHOONZ-mobile/pull/15) `327a11577124bbfa3e028031610b06c8a33f9a77` | Open, ready for review, unmerged | `src/lib/api.ts`, `src/lib/decoder.ts`, `src/lib/types.ts`, `tests/api.test.ts` |

The mobile receipt itself is based on `origin/main@9a9388244ff09b4376c5c2b3148d1a4114dc105b` and owns only
`docs/p2-contract-matrix-2026-08-12.md`.

## Contract matrix

| Operation | Backend route and response | Mobile method and decoder | Focused evidence |
| --- | --- | --- | --- |
| Update profile | `PATCH /me` → `200 UserRead`; body `{display_name: string \| null}`; `null` clears; maximum 120 characters; overlength is `422` | `updateMe({ display_name })` → `decodeUser`; `ChoonzUser.display_name` is nullable; fixture mutation is local | Backend contract test covers the 120-character boundary, null clear, and `422`; mobile API tests cover request body, decoded response, and fixture-local update |
| List connections | `GET /me/connections` → `200 ConnectionRead[]`; fields are `client_id`, `client_name`, `scopes`, and `created_at` | `getConnections()` → `decodeConnections`/`decodeConnection` | Backend field-set assertions and mobile response-decoding/fixture tests pass |
| Revoke connection | `DELETE /me/connections/{client_id}` → exact `204` with no body; missing owner-scoped record is `404`; client ID is URL-encoded | `revokeConnection(clientId)` → `Promise<void>`; exact `204` settlement; no body decoder | Backend revoke-isolation and missing-record tests plus mobile URL-encoding, `204`, and `404` tests pass |
| First-party boundary | First-party operations are allowed; synthesized third-party principals receive `403`; production issuer/JWT classification is not claimed | Mobile validates API configuration before bearer access and preserves exact status errors | Backend boundary tests and mobile URL-before-bearer/status tests provide focused evidence; production issuer behavior remains outside this receipt |

## Focused verification

- Backend `pytest -q tests/test_mobile_api_contract.py`: **58 passed**, one
  existing Starlette/httpx deprecation warning.
- Mobile `npm.cmd test -- --run tests/api.test.ts`: **12 passed**.
- Source/path audit: the backend head changes exactly
  `docs/architecture-visuals.md`, `docs/mobile-integration.md`, and
  `tests/test_mobile_api_contract.py`; the mobile head changes the thirteen
  paths documented by PR #15. This receipt changes none of them.
- `git diff --check`: required to pass on this receipt before publication.

## Conditions and gaps

- This is focused acceptance evidence, not a claim that the full backend or
  mobile batteries were rerun in this receipt. PR #15 and PR #45 retain their
  own broader validation claims for owner review.
- PR #42, mobile PR #8, and mobile PR #9 remain separate protected inputs;
  this matrix does not depend on or mutate those carrier branches.
- Exact-head custody, merge, provider configuration, deployment, credentials,
  migrations, and production release remain outside scope.

## Verification contract

- Only this receipt path may differ from the mobile base.
- The live PR heads and changed-path lists must continue to match the exact
  values above at publication time.
- A fresh read-only check must confirm the receipt's clean worktree, exact
  commit, draft PR state, and ledger reconciliation.
