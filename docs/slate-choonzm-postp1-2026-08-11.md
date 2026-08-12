---
type: record
title: "SLATE — CHOONZ-mobile post-P1 refresh"
kind: slate
status: active
project: choonz-mobile
axis: post-P1 residuals — handoff, freshness, contract alignment, evidence
opened: 2026-08-11
updated: 2026-08-12
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

- **Tip / head:** main `9a93882` (`docs: wrap session — refresh rolling handoff to bc8625b (#7)`); P1 remains landed at mobile PRs #3/#4 and backend PRs #36/#37.
- **Published review fences:** S2 is PR #10 (N1 freshness), S4 is PR #11 (N3 main-green), and the successor slate has N7 as PR #12; all are open drafts, unmerged, and independently verified.
- **P2 carrier fences:** mobile PR #8 remains the typed-client carrier and PR #9 remains the recovery-guidance carrier; backend PRs #42/#43 are separate open draft inputs. None is released custody.
- **Coordination fence:** PR #13 reconciles `slate-choonzm-next-2026-08-11.md`; this post-P1 slate remains a separate historical planning record.
- **CI / merge gate:** CI green at merge. Package/lockfile/CI changes trigger npm-audit-exception reapproval (`docs/security/npm-audit-exception.md`) — hard fence.
- **Vault PM state:** the current ARC 677 handoff records P1 closed and P2 entered; exact-head custody release, board projection, and owner review gates remain separate.
- **Handoff basis:** ARC 677 P1-close/P2-entry handoff plus `CHOONZ_Current_State.md`; the original pre-P1 queue below is reconciled only where a published receipt exists.

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
| S1 | Rolling handoff — author `docs/next-session.md` (tip, shipped P1 capability, verification commands, DEFERRED, this slate pointer) | Agent | file exists on branch; next-session resume protocol reads it cold | landed — PR #7 |
| S2 | Freshness pass — README status note + AGENTS.md "What this is" reflect shipped fixture match loop + api mode | Agent | README/AGENTS describe match-loop capability; `npm run typecheck` + `npm run lint` green | published — PR #10 (draft) |
| S3 | Match-contract alignment verification — compare `src/lib/api.ts` + match client/fixtures against backend `#37` locked contract (`tests/test_mobile_api_contract.py`), fix client drift only | Agent | diff read of `#37`; client alignment confirmed or fixes landed; tests green | held — P2 client custody |
| S4 | Local main-green verification — fresh worktree clone of main: `npm ci`, `npm test`, `typecheck`, `lint`, `expo:check`, `expo:doctor`, `build` | Agent | all gates pass; receipt recorded in `docs/` | published — PR #11 (draft) |
| S5 | P1 landing record — master-ledger event (project `tinytoonz`, both repos landed), board `next_action` advance, ARC 677 P1 close | Owner | ledger row + board regenerated; ARC 677 P1 marked closed | blocked |
| S6 | npm-audit-exception standing review — track review-by 2026-09-10; no package/lock/CI change without owner reapproval | Owner | reminder/flag raised; reapproval path documented | blocked |
| S7 | P2 profile/account polish — compile only after S5 closes (G-P2-ENTRY) | Owner | G-P2-ENTRY opened; P2 slate seeded | transitioned — ARC 677 P2 entry; custody still gated |

## Concurrency map

- **Landed/published:** S1 is landed in PR #7; S2 and S4 are separate open draft PRs #10 and #11.
- **Held:** S3 must wait for exact P2 client custody because its `src/lib/**` surfaces overlap the typed-client carrier and profile/account worktrees.
- **Owner-gated (await):** S5, S6, and S7 remain owner-controlled; ARC 677 P2 entry is recorded, but carrier custody and review gates are not released.
- **Ordering rule:** do not create a second writer for S1/S2/S4 paths; owner decides S5/S6 timing; P2 implementation follows exact-head custody.

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

**Next safe action:** review PRs #10 and #11 while preserving their separate fences. Keep S3 held until the P2 client carrier receives exact-head custody; S5/S6/S7 remain owner-gated.

## Non-goals / residual after close

- EAS linking, store builds, production web deploy, Supabase provider swap, prod credentials — owner-gated, out of scope
- Match mutations, live spectating, rankings/seasons, combat physics — deferred scope (per CHOONZ_Current_State)
- Backend `shapeslines/CHOONZ` changes — authority is the backend repo; paired PR discipline applies
- Web-deploy CSP + third-party-script review — validation-only posture stands
- Residual that seeds the next slate: S5–S7 gates and, after P1 close, the P2 profile/account slate

## Revisions

- 2026-08-11 · authored · opencode session (deepseek-v4-flash), after full sync of both P1 repos
