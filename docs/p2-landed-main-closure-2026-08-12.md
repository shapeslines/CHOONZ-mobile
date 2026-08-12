# P2 landed-main closure receipt - 2026-08-12

## Verdict

`CONDITIONAL`: the paired landed-main evidence is green and contract-compatible,
but this receipt does not declare ARC 677 P2 closed or compile P3. The canonical
ARC, project-home, current-state, and handoff records still describe the
pre-landing state and require a separate reconciliation/owner closure gate.

## Exact landed heads

| Repository | Landed PR | Merge commit | Candidate head | Current main |
| --- | --- | --- | --- | --- |
| `shapeslines/CHOONZ` | #45 | `0d703820639343ecec0bc6a5fc509b1eb4f17d4b` | `fd445b75c1c77ce26271aed093abde0117e1d782` | `0d703820639343ecec0bc6a5fc509b1eb4f17d4b` |
| `shapeslines/CHOONZ-mobile` | #15 | `837412eac11e4e38a7560dc43362a0fb8861592f` | `327a11577124bbfa3e028031610b06c8a33f9a77` | `837412eac11e4e38a7560dc43362a0fb8861592f` |

Both merged candidates remain exact-head inputs for this receipt. Backend #45
landed three contract documentation/regression paths. Mobile #15 landed its
thirteen-path profile/account implementation and audit record. No carrier,
receipt, or canonical project record was modified by this slice.

## Fresh landed-main evidence

### Backend

- Full `pytest -q`: `232 passed`, one existing Starlette/httpx deprecation
  warning.
- Focused `tests/test_mobile_api_contract.py`: `58 passed`, same warning.
- Ruff: `All checks passed!`
- mypy `app --no-incremental`: `Success: no issues found in 56 source files`.
- Static Alembic graph: one head `0016`, `16` revisions; no database connection
  or migration execution used.
- Visual Maintainer baseline: `PASS projections=6 changed=0 impacts=0`.
- Detached verification worktree:
  `C:\Users\doton\Desktop\GITHUB\CHOONZ\.worktrees\p2-landed-main-input`
  at exact `0d703820639343ecec0bc6a5fc509b1eb4f17d4b`, clean.

### Mobile

- Clean `npm ci`: `1,119` packages added and `1,120` audited.
- Full Vitest: `47 passed` across `9` files.
- Rendered Jest: `17 passed` across Fight, Profile, and Connections suites.
- Focused API/decoder Vitest: `12 passed`.
- Lint and typecheck: pass.
- Expo config: pass; Expo Doctor: `21/21`.
- Static web export: pass with `7` routes, including `/connections`.
- Audit baseline: `22` findings = `15 high`, `7 moderate`, `0 critical`, with
  the expected nonzero audit exit and no dependency changes.
- Lockfile SHA-256:
  `fe86d80b10d5a78361c5080582df51a6616e5098d9c34b6fd8e5bbffafd5b805`.
- Detached verification worktree:
  `C:\Users\doton\Desktop\GITHUB\CHOONZ-mobile\.worktrees\p2-landed-main-closure`
  at exact `837412eac11e4e38a7560dc43362a0fb8861592f`, clean.

## Cross-repository contract

The focused landed-main suites preserve the exact existing boundary:

- `PATCH /me` returns `200 UserRead` with display-name clearing and the
  documented length/error behavior.
- `GET /me/connections` returns `200 ConnectionRead[]`.
- `DELETE /me/connections/{client_id}` returns an empty `204` response.
- Mobile decoding, URL encoding, first-party boundary checks, fixture
  isolation, session/cache settlement, and confirmed-state preservation remain
  aligned with backend truth.

No provider/OAuth, credential, deployment, EAS/store, migration execution,
production, destructive-account, P3, or live-data effect occurred in this
verification slice.

## Reconciliation gate

The canonical sources still need a single owner-authorized landed-main update:

1. ARC 677 P2 summary/plan/manifest disposition.
2. `CHOONZ_Current_State.md`, `tinytoonz.md`, and the project home.
3. The 2026-08-12 P2 handoff, including the historical status of receipt PRs
   #16-#20 and the remaining draft carriers #42/#8/#9.
4. A fresh decision on whether P2 is closed and whether P3 may be compiled.

Until that reconciliation, treat this receipt as evidence of the landed heads,
not as canonical phase closure or P3 authorization.

## Independent verification qualification

The fresh independent verifier returned `CONDITIONAL`. It confirmed the
staged one-file fence, exact merged heads, fresh batteries, and no-effect
boundary. It also recorded two qualifications that remain open rather than
being silently normalized:

- The specifically named vault path `677 CODEX SOL ARC - CHOONZ PLAYABLE MATCH
  LOOP P2 SUMMARY.md` does not exist; the existing live ARC summary has a
  different filename and is the source used by this receipt.
- The detached Windows run here returned mypy success for 56 source files, but
  the verifier observed an internal failure in another local unpinned mypy
  invocation. The preserved PR #45 CI result on the identical landed tree is
  the corroborating 56-source-file acceptance evidence; no dependency or
  environment change is made by this slice.

## Fence

This branch is `colony2/choonzm-p2-landed-main-closure`, based on mobile
`origin/main@837412eac11e4e38a7560dc43362a0fb8861592f`. Its only allowed path is
`docs/p2-landed-main-closure-2026-08-12.md`. Source, tests, package files,
lockfiles, workflows, security records, provider/OAuth, EAS/store, deployment,
migrations, credentials, existing PR/worktree paths, canonical vault records,
merge, and force-push are denied.

This is a review-only evidence receipt. It does not modify either landed head,
the remaining carriers, or the canonical ARC/project state.
