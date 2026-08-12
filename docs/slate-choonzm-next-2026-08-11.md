---
type: record
title: "SLATE — CHOONZ-mobile next wave (P1-closed era)"
kind: slate
status: draft
project: choonz-mobile
axis: post-P1 residuals + P2-era preparation
opened: 2026-08-11
updated: 2026-08-11
closed:
worktree: .worktrees/choonzm-s1-handoff
branch: colony2/choonzm-s1-handoff
tags: [slate, orthogonal, planning, choonz-mobile]
related:
  - "[[slate-choonzm-postp1-2026-08-11]]"
  - "[[next-session]]"
---

# Slate choonz-next — CHOONZ-mobile next wave

> One orthogonal slate = a ranked set of **fence-disjoint** slices for one period/axis.
> Procedure → [[orthogonal-slate-workflow]] · altitude: charter ⊇ **slate** ⊇ slice ⊇ TaskSpec.
> One writer per fence; owner gates named, never skipped.

**Opened:** 2026-08-11 · **Status:** draft
**Axis:** post-P1 residuals + P2-era preparation
**Orthogonal to:** active slate `choonzm-postp1` (S1 in flight, S2–S4 queued, S5–S7 owner) · ARC 677 P1 close · backend `shapeslines/CHOONZ` authority (read-only here) · npm-audit-exception reapproval surface

## State at refresh

- **Tip / head:** main `6456d45`; PR #5 (post-P1 slate + dependabot addendum) open, CI pending; S1 rolling handoff (`docs/next-session.md`) in flight on `colony2/choonzm-s1-handoff`.
- **Open PRs:** #5 only; backend zero.
- **In-flight fences:** `.worktrees/choonzm-slate-postp1`, `.worktrees/choonzm-s1-handoff` — docs-only, disjoint.
- **CI / merge gate:** standard battery green before merge; package/lock/CI = owner reapproval (npm-audit-exception review-by 2026-09-10).
- **Vault PM state:** ledger seq 1610 records P1 landing + slate; board `next_action` still needs advance (S5, owner); ARC 677 P1 close pending (owner); G-P2-ENTRY closed.

## Why

The active slate's agent queue is docs-shaped and small; this successor keeps the chain alive: carry the unexecuted slices forward by their original IDs (no renumbering forks), add the P2-era preparation axes (CSP review, upstream-fix upgrade at the exception review date), and surface the owner gates that must close for P2 entry.

## Fence

| May touch | Must not |
|-----------|----------|
| `docs/**`, `README.md`, `AGENTS.md` (freshness prose) | `package.json` / `package-lock.json` / `.github/workflows/**` (reapproval trigger) |
| `src/lib/api.ts`, `src/lib/fight-*`, `src/lib/fixtures*`, `src/providers/fight-provider*`, `src/app/fight*` (S3 client-alignment only) | backend repo edits · Supabase config · auth provider swap |
| `tests/**` (non-package additions) | main-branch direct commits · EAS · store · production web · CSP apply |
| CSP analysis draft (`docs/security/`) | any deploy or production surface |

## Ranked slices

| ID | Slice | Gate | Done-when | Status |
|----|--------|------|-----------|--------|
| N1 | S2 carryover — freshness pass: README status + AGENTS "What this is" reflect shipped match loop + api mode | Agent | prose accurate; `npm run typecheck` + `npm run lint` green | queued |
| N2 | S3 carryover — match-contract alignment: `src/lib/api.ts` + match client/fixtures vs backend #37 locked contract; client fixes only | Agent | `#37` diff read; alignment confirmed or fixed; tests green | queued |
| N3 | S4 carryover — local main-green verification: fresh clone, full battery (`npm ci`, `test`, `typecheck`, `lint`, `expo:check`, `expo:doctor`, `build`), receipt in `docs/` | Agent | all gates pass; receipt recorded | queued |
| N4 | S5 carryover — P1 landing record: master-ledger event, board `next_action` advance (`gen-board.mjs`), ARC 677 P1 close | Owner | ledger + board current; ARC 677 P1 closed | blocked |
| N5 | S6 carryover — npm-audit-exception review-by tracking (2026-09-10); reapproval path ready | Owner | review scheduled; reapproval checklist documented | blocked |
| N6 | S7 carryover — P2 profile/account polish; compile only after N4 (G-P2-ENTRY) | Owner | G-P2-ENTRY opened; P2 slate seeded | blocked |
| N7 | Web-deploy CSP prep — draft CSP + third-party-script audit for the web target (analysis only) | Agent | CSP draft + script inventory in `docs/security/`; apply/deploy untouched | queued |
| N8 | Upstream-fix upgrade — if compatible Expo/`metro`/`@expo/config-plugins` releases land by review date, run approved upgrade + re-audit + full battery | Owner | audit findings reduced or accepted again; reapproval recorded | blocked |

## Concurrency map

- **Immediately, in parallel:** N1, N2, N3, N7 — disjoint fences (docs prose · client contract · throwaway clone · security analysis).
- **Sequenced:** N4 → N6 (P2 entry requires ARC 677 P1 close); N8 only at/after 2026-09-10 review.
- **Owner-gated (await):** N4, N5, N6, N8 — plus any package/lock/CI mutation.
- **Ordering rule:** fire the four agent slices in parallel once S1 lands; owner decides N4 timing; N6/N8 follow.

## Owner gates

| Item | OWNER |
|------|-------|
| N4 board advance + ARC 677 P1 close | Carson / owner |
| N5 review scheduling + reapproval checklist | Carson / owner |
| N6 P2 entry (G-P2-ENTRY) | Carson / owner |
| N8 upgrade + re-audit | Carson / owner (mandatory reapproval) |
| Any package.json / lockfile / CI change · EAS · store · prod web · Supabase config | Carson / owner |

## Merge gate

PR + CI green before merge; `package.json`/lockfile/CI untouched by agent slices; branch+PR only off `origin/main`.

## Recommended next

**Rank-1 (ungated):** N1 (S2) — README/AGENTS still describe a read-only greenfield slice; two prose edits, zero risk, closes the last freshness debt the moment S1 lands.

## Non-goals / residual after close

- EAS linking, store builds, production web deploy, Supabase provider swap, prod credentials — owner-gated, out of scope
- Match mutations, live spectating, rankings/seasons, combat physics — deferred scope (CHOONZ_Current_State)
- Backend changes — authority is the backend repo; paired-PR discipline applies
- Residual that seeds the next slate: P2 profile/account work after N4/N6; deploy-era hardening after N7/N8

## Revisions

- 2026-08-11 · authored · opencode session, successor to `slate-choonzm-postp1-2026-08-11`
