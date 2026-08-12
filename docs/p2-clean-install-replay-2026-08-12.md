# P2 clean-install replay receipt — 2026-08-12

## Verdict

`PASS` for clean-install reproducibility and the post-install local battery.
P2 custody and remote-CI acceptance remain owner-controlled; this receipt does
not merge or release any carrier.

## Exact input

- Repository: `shapeslines/CHOONZ-mobile`
- Review input: PR #15, head `327a11577124bbfa3e028031610b06c8a33f9a77`
- Input base: `origin/main@9a9388244ff09b4376c5c2b3148d1a4114dc105b`
- Verification worktree: `C:\Users\doton\Desktop\GITHUB\CHOONZ-mobile\.worktrees\choonzm-p2-clean-install-input`
- Input worktree mode: detached, exact PR #15 head; no tracked changes after replay
- `package-lock.json` blob: `cc0d71d7f96d872ffbb3e5ab4de255a8135793e6`

PR #15 remained open, ready for review, mergeable, and unmerged during the
replay. PR #18's receipt explicitly left `npm ci` as an unrerun qualification;
this slice closes only that reproducibility gap and leaves PRs #15 and #18
untouched.

## Clean install and post-install battery

- `npm ci`: **PASS**, 1,119 packages added and 1,120 packages audited.
- `npm test`: **47 passed** across 9 Vitest files.
- `npm run test:screen`: **17 passed** across 3 rendered Jest suites.
- `npm run lint`: **PASS**.
- `npm run typecheck`: **PASS**.
- `npm run expo:check`: **PASS**, Expo SDK 56 configuration.
- `npm run expo:doctor`: **21/21 checks passed**.
- `npm run build`: **PASS**, seven static routes including `/connections`.
- `npm audit --json`: **22 total = 15 high + 7 moderate + 0 critical**;
  the command's exit `1` is the already documented bounded advisory baseline,
  not a new dependency or finding.
- `git diff --check` and post-run status: **PASS**, no tracked changes.

## Fence

This receipt is the only path on `colony2/choonzm-p2-clean-install-replay`,
based on mobile `origin/main`. The clean install and commands ran only in the
detached exact-head verification worktree. The slice branch changes no mobile
source, tests, dependencies, lockfile, CI, security policy, provider/OAuth,
EAS/store, deployment, migration, carrier worktree, or production state.

No credentials, provider configuration, merge, force-push, deployment, or
production effect occurred.
