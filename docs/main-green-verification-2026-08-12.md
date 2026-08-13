---
type: record
title: "Receipt - CHOONZ-mobile main-green verification"
kind: verification-receipt
status: pass
project: choonz-mobile
branch: colony2/choonzm-n3-main-green
base: origin/main@9a9388244ff09b4376c5c2b3148d1a4114dc105b
verified_at: 2026-08-12T12:40:55-04:00
---

# CHOONZ-mobile main-green receipt

This is the N3/S4 local main-green verification from the post-P1 slate. It ran
in a fresh dedicated worktree at `origin/main@9a9388244ff09b4376c5c2b3148d1a4114dc105b`.
No package, lockfile, CI, provider, deployment, or production surface changed.

## Results

| Gate | Result |
| --- | --- |
| `npm ci` | PASS - lockfile-pinned install completed |
| `npm test` | PASS - 9 files, 38 tests |
| `npm run test:screen` | PASS - 1 suite, 8 tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS - zero warnings |
| `npm run expo:check` | PASS - public Expo config resolved |
| `npm run expo:doctor` | PASS - 21/21 checks |
| `npm run build` | PASS - static web export completed (6 routes) |

`expo-doctor` needs Expo's public schema/package metadata service. Its first
sandboxed attempt could not reach that service; the same command then passed
with approved public-network access. This receipt records the successful run,
not a deployment or a remote configuration change.

## Scope boundary

This closes the agent-owned N3/S4 verification slice only. P2 profile/account
work, provider configuration, EAS/store work, package or CI changes, and any
deployment remain outside this receipt's scope.
