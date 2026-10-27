# ADR-0001 — Docs-surface standard and plan-before-slate convention

**Status:** accepted · **Date:** 2026-09-03 · **Adopts:** GromCodebase ADR-0025 (docs-surface standard) · **Mirrors:** CHOONZ ADR-0001 (2026-09-02)

## Context

Until 2026-09-03 this repo's ADR-0025 surfaces (`docs/ROADMAP.md`, `docs/WORK-FRONTLOG.md`,
`docs/groundwork.md`) were empty templates, `docs/decisions/` held no records, there was no
`CLAUDE.md`, `AGENTS.md` had no objects map or session protocol, and the resume pin's first action
read "unverified". Real work-state lived only in the session archive and the backend repo. A cold
agent had no in-repo path from "what is this" to "what do I do first". The backend solved the same
problem on 2026-09-02 (CHOONZ ADR-0001, PR #124); this ADR adopts the identical shape so both
CHOONZ repos onboard the same way.

## Decision

1. **Entry chain is fixed:** `CLAUDE.md` (shim) → `AGENTS.md` (boundaries, objects map, session
   protocol) → `docs/README.md` (which file answers which question) → `docs/next-session.md`
   (FIRST action) → `docs/groundwork.md` → one row of `docs/WORK-FRONTLOG.md` and its plan.
2. **Plan before code.** Every claimable slice has a `docs/plans/<id>.md` (goal, spec sources,
   write fence, out of scope, slice ledger, acceptance commands, held questions, branch) *before*
   any code lands. `docs/plans/README.md` bridges backend contracts and vault decisions to slices.
3. **Pin discipline.** `docs/next-session.md` is replaced, never appended, at every wrap; ≤40
   lines; ADR-0025 shape; no shas or 8-digit dates in its top 20 lines (the freshness audit reads
   them as a claimed commit); `docs-surface-lint.py --repo .` must pass locally.
4. **Work-state lives in one place.** Fleet-flagged work stays in GromCodebase `GAP-REGISTER.md`
   (FLEET-INDEX rule 3). This frontlog ranks *repo* tickets only.
5. **Branches:** `lane/choonzm-<id>/<yyyymmdd>` (the `colony2/choonzm-<slug>` prefix is
   historical); PR-only merge; production build, providers, stores, and branch protection are
   owner gates.
6. **ADRs are immutable;** supersede with a new number, do not edit.

## Consequences

- The vault project note is shared with the backend (`20 Projects/tinytoonz/tinytoonz.md`); its
  projection fields are patched at wrap by whichever repo lands.
- Backend contract changes (P-S3 unlock, object-valued `detail`, engine revision 2 fields) enter
  this repo only through a plan row in `docs/WORK-FRONTLOG.md`.
