# P2 full-battery replay receipt — 2026-08-12

## Verdict

`PASS` for the local, read-only replay. The broader P2 custody decision remains
owner-controlled and `CONDITIONAL`: this receipt does not merge, release custody,
or replace CI, reviewer acceptance, or the existing security exception.

## Exact inputs

| Repository | Review head | Base | Live state |
| --- | --- | --- | --- |
| `shapeslines/CHOONZ` | PR #45 `fd445b75c1c77ce26271aed093abde0117e1d782` | `origin/main` `36b1019352d34c96b771adacf9b41a36b4ebeb64` | open, ready for review, mergeable, unmerged |
| `shapeslines/CHOONZ-mobile` | PR #15 `327a11577124bbfa3e028031610b06c8a33f9a77` | `origin/main` `9a9388244ff09b4376c5c2b3148d1a4114dc105b` | open, ready for review, mergeable, unmerged |

The live PR metadata and changed-file lists were read immediately before this
receipt. The carrier PRs #42/#8/#9 remain open, unmerged, and untouched.

## Backend replay

Replay worktree: `<local-backend-worktree>`.

- `python -m pytest -q`: **232 passed**, one existing Starlette/httpx deprecation warning.
- `ruff check .`: **PASS**.
- `mypy app --no-incremental`: **PASS**, 56 source files.
- `alembic heads`: one head, `0016`.
- `node tools/visual-maintainer/check.mjs --base origin/main --head HEAD`:
  **PASS**, `projections=6 changed=3 impacts=1`.
- `git diff --check`: **PASS**.
- Exact changed paths remain the three PR #45 files: `docs/architecture-visuals.md`,
  `docs/mobile-integration.md`, and `tests/test_mobile_api_contract.py`.

## Mobile replay

Replay worktree: `<local-mobile-worktree>`.

- `npm test`: **47 passed** across 9 Vitest files.
- `npm run test:screen`: **17 passed** across 3 rendered Jest suites.
- `npm run lint`: **PASS**.
- `npm run typecheck`: **PASS**.
- `npm run expo:check`: **PASS**.
- `npm run expo:doctor`: **21/21 checks passed**.
- `npm run build`: **PASS**, seven static routes including `/connections`.
- `npm audit --json`: the expected bounded baseline, **22 total = 15 high + 7 moderate + 0 critical**.
  The command exits `1` because those documented advisories remain; no new finding or
  dependency change was introduced.
- Exact changed paths remain the thirteen PR #15 files; `package-lock.json`, workflows,
  provider configuration, and API configuration remain outside the diff.

## Fence and qualification

This receipt is the only path on branch `colony2/choonzm-p2-full-replay`, based on
mobile `origin/main`. The replay itself was read-only against the exact PR #15/#45
heads; the new branch changes no application source, tests, dependencies, lockfile,
CI, security policy, provider/OAuth, EAS/store, deployment, migration, or carrier
worktree. The local replay did not rerun `npm ci` or remote CI, so those claims remain
with their original PRs and owner review.

No deployment, provider, credential, migration, merge, force-push, or production
effect occurred.
