---
type: record
title: "SLATE — CHOONZ-mobile post-P1 refresh"
kind: slate
status: active
project: choonz-mobile
axis: post-P1 residuals — handoff, freshness, contract alignment, evidence
opened: 2026-08-11
updated: 2026-08-11
closed:
worktree: .worktrees/choonzm-slate-postp1
branch: colony2/choonzm-slate-postp1
tags: [slate, orthogonal, planning, choonz-mobile]
related: []
---

# Slate choonz-postp1 — CHOONZ-mobile post-P1 refresh

> One orthogonal slate = a ranked set of **fence-disjoint** slices for one period/axis.
> Procedure → [[orthogonal-slate-workflow]] · altitude: charter ⊇ **slate** ⊇ slice ⊇ TaskSpec.
> One writer per fence; owner gates named, never skipped.

**Opened:** 2026-08-11 · **Status:** active
**Axis:** post-P1 residuals — handoff, freshness, contract alignment, evidence
**Orthogonal to:** ARC 677 P1 close (owner), P2 profile/account polish (G-P2-ENTRY, owner), backend `shapeslines/CHOONZ` authority (read-only here), npm-audit-exception reapproval surface (owner)

## State at refresh

- **Tip / head:** main `6456d45` — both P1 mobile PRs merged (`#3` auth+catalog bootstrap, `#4` playable match loop). Backend fully landed: `#36` coherence, `#37` match-contract lock (OpenAPI models + `tests/test_mobile_api_contract.py`, 47 tests, non-breaking).
- **Open PRs:** none — both repos (verified 2026-08-11).
- **In-flight fences:** none active. Two colony worktrees (`auth-catalog-bootstrap`, `playable-match-loop`) merged, clean, in sync with origin. Claim worktree `.worktrees/choonzm-slate-postp1` on `colony2/choonzm-slate-postp1`.
- **CI / merge gate:** CI green at merge. Package/lockfile/CI changes trigger npm-audit-exception reapproval (`docs/security/npm-audit-exception.md`) — hard fence.
- **Vault PM state:** board row stale — `next_action` still "Review PR #37 and PR #4"; both merged 2026-08-11. P1 landing not yet recorded on master-ledger; ARC 677 P1 close pending (owner).
- **Handoff basis:** ARC 674 handoff (`2026-08-10-handoff-arc674-choonz-coherence.md`) + `CHOONZ_Current_State.md` (vault-staging) — both superseded at the "next" step: review/merge of #36/#3 (done).

## Why

P1 landed on both repositories on 2026-08-11, but the mobile repo has never carried the rolling handoff (`docs/next-session.md`) that every other house repo uses as the resume entry point, its README/AGENTS still describe a read-only greenfield slice, the backend `#37` now locks the match contract the client consumes, and no local verification pass has been recorded against the merged main. This slate closes those residuals with fence-disjoint slices and records the P1 landing on the ledger so PM state advances.

## Fence

| May touch | Must not |
|-----------|----------|
| `docs/**` (slate, next-session, receipts) | `package.json` / `package-lock.json` / `.github/workflows/**` (npm-audit-exception reapproval trigger) |
| `README.md`, `AGENTS.md` (freshness prose only) | `src/lib/supabase*`, auth provider config (owner) |
| `src/lib/api.ts`, `src/lib/fight-*`, `src/lib/fixtures*`, `src/providers/fight-provider*`, `src/app/fight*` (contract-alignment fixes only) | `shapeslines/CHOONZ` backend — read-only compare, no edits |
| `tests/**` (non-package test additions) | main-branch direct commits · EAS · store · production web · Supabase project config |

## Ranked slices

| ID | Slice | Gate | Done-when | Status |
|----|--------|------|-----------|--------|
| S1 | Rolling handoff — author `docs/next-session.md` (tip, shipped P1 capability, verification commands, DEFERRED, this slate pointer) | Agent | file exists on branch; next-session resume protocol reads it cold | queued |
| S2 | Freshness pass — README status note + AGENTS.md "What this is" reflect shipped fixture match loop + api mode | Agent | README/AGENTS describe match-loop capability; `npm run typecheck` + `npm run lint` green | queued |
| S3 | Match-contract alignment verification — compare `src/lib/api.ts` + match client/fixtures against backend `#37` locked contract (`tests/test_mobile_api_contract.py`), fix client drift only | Agent | diff read of `#37`; client alignment confirmed or fixes landed; tests green | queued |
| S4 | Local main-green verification — fresh worktree clone of main: `npm ci`, `npm test`, `typecheck`, `lint`, `expo:check`, `expo:doctor`, `build` | Agent | all gates pass; receipt recorded in `docs/` | queued |
| S5 | P1 landing record — master-ledger event (project `tinytoonz`, both repos landed), board `next_action` advance, ARC 677 P1 close | Owner | ledger row + board regenerated; ARC 677 P1 marked closed | blocked |
| S6 | npm-audit-exception standing review — track review-by 2026-09-10; no package/lock/CI change without owner reapproval | Owner | reminder/flag raised; reapproval path documented | blocked |
| S7 | P2 profile/account polish — compile only after S5 closes (G-P2-ENTRY) | Owner | G-P2-ENTRY opened; P2 slate seeded | blocked |

## Concurrency map

- **Immediately, in parallel:** S1, S2, S3, S4 — disjoint fences (S1/S2 docs files differ; S3 is read-only against backend + bounded client fix; S4 runs in a throwaway worktree clone).
- **Sequenced:** S5 → S7 (P2 entry requires ARC 677 P1 close).
- **Owner-gated (await):** S5, S6, S7 — and any package/lockfile/CI mutation (reapproval).
- **Ordering rule:** fire all four agent slices in parallel; S5 as soon as the owner approves; S7 only after S5.

## Owner gates

| Item | OWNER |
|------|-------|
| P1 landing record + ARC 677 P1 close (S5) | Carson / owner |
| npm-audit-exception reapproval + review-by tracking (S6) | Carson / owner |
| P2 entry + profile/account polish (S7) | Carson / owner |
| Any package.json / lockfile / CI change | Carson / owner (reapproval trigger) |
| EAS, store submission, prod credentials, Supabase config, web deploy | Carson / owner (never auto-apply) |

## Merge gate

PR + CI green (tests, lint, typecheck, expo:check, expo:doctor, web build) before merge; `package.json`/lockfile/CI untouched; branch+PR only off `origin/main` per repo rules.

## Recommended next

**Rank-1 (ungated):** S1 — the repo has no `docs/next-session.md`, so the resume loop cannot cold-start here; it is zero-risk, establishes the dialect every later slice and session lands against, and carries the P1 landing facts forward.

## Non-goals / residual after close

- EAS linking, store builds, production web deploy, Supabase provider swap, prod credentials — owner-gated, out of scope
- Match mutations, live spectating, rankings/seasons, combat physics — deferred scope (per CHOONZ_Current_State)
- Backend `shapeslines/CHOONZ` changes — authority is the backend repo; paired PR discipline applies
- Web-deploy CSP + third-party-script review — validation-only posture stands
- Residual that seeds the next slate: S5–S7 gates and, after P1 close, the P2 profile/account slate

## Revisions

- 2026-08-11 · authored · opencode session (deepseek-v4-flash), after full sync of both P1 repos
