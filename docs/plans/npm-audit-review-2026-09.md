# Plan — `npm-audit-review-2026-09` (npm audit exception review, due 2026-09-10)

**Status:** done on lane `lane/choonzm-npm-audit-review/20260903` (2026-09-03) — awaiting owner
reapproval. **Rank:** 2. **Size:** S (docs-only). **Branch:**
`lane/choonzm-npm-audit-review/20260903`.

## Goal

Discharge the time gate on `docs/security/npm-audit-exception.md` before its 2026-09-10 review-by
date: re-run the audit against the exact committed dependency graph, record what the finding set
actually is now (it changed materially), retire the advisories that no longer exist in the tree,
add the one that appeared, and put a single unsigned **Owner decision** row in front of the owner
that re-scopes the exception to the current `package.json` / `package-lock.json` bytes. The lane
writes evidence only. It changes no dependency, so it does not itself trip the reapproval clause;
the *new leaf advisory* it found does, which is exactly why the owner row exists.

## Spec sources (restated, not re-derived)

- `docs/security/npm-audit-exception.md` — "Review by 2026-09-10 or the next compatible Expo/RNTL
  fix, whichever is first"; "Removal condition: a patched `image-size` (`>2.0.2`) **or** an
  Expo/Metro line that does not depend on the vulnerable parser"; compensating control "Any future
  deployment must first prove a clean `npm ci --omit=dev --omit=optional --ignore-scripts`
  succeeds"; reapproval clause "Reapproval is mandatory for any package or lockfile change; Node,
  npm, Expo, React Native, RNTL, Jest, or CI change; **new leaf advisory or title**; …".
- `AGENTS.md` §1 invariant — "No package, lockfile, or CI change without a fresh dependency review
  while the npm-audit exception (review due 2026-09-10) stands"; §2 verification matrix.
- `docs/WORK-FRONTLOG.md` rank 2; `docs/plans/README.md` "What a plan file contains" + claim
  protocol; `docs/README.md` docs map row for the exception.

## Write fence

- `docs/plans/npm-audit-review-2026-09.md` (this file)
- `docs/security/npm-audit-exception.md`
- `docs/WORK-FRONTLOG.md`
- `docs/groundwork.md`
- `docs/next-session.md`

## Out of scope

- `package.json`, `package-lock.json`, `node_modules/`, `.npmrc`, `.github/workflows/**` — the
  exception forbids a dependency move without a fresh owner decision, and every fix npm currently
  offers is a semver-major **downgrade** (`expo@46.0.21`, `expo-router@5.1.11`). No `npm audit
  fix`, no `--force`, no `npm install` in the checkout.
- `src/app/profile.tsx`, `src/lib/api.ts`, `tests/profile-screen.test.tsx`, `tests/api.test.ts`,
  `docs/store-readiness.md` — held by a concurrent seat on another branch.
- Regenerating the lockfile to repair the `npm ci` drift found in slice 2. That is a package change
  and belongs to its own owner-gated lane; this lane only records the evidence.
- Dependabot alert re-triage on the default branch (owner-only surface); the mapping table is
  updated as a record, not acted on.

## Slice ledger

- [x] **S1 — Branch + baseline.** `lane/choonzm-npm-audit-review/20260903` from `main` @ `da8d690`
  (the M-S3 merge, PR #50). Node `24.14.1`, npm `11.11.0`. `npm run lint` → `ESLint: No issues
  found`. `git status --porcelain` empty.
- [x] **S2 — Re-audit.** `npm audit --json` → 13 findings, all **moderate** (0 critical / 0 high /
  0 low / 0 info) over 1,162 dependencies. Only two leaf advisories: `decode-uri-component`
  GHSA-vcc3-ghjq-m6fr (new) and `uuid` GHSA-w5hq-g745-h8pq (carried). `npm ls image-size` → empty;
  `image-size` has zero nodes in `package-lock.json`. Both `image-size` highs are therefore retired
  by removal, not by a patch. Attempted `npm ci --omit=dev --omit=optional --ignore-scripts` in an
  isolated temp copy of the two manifest files → **EUSAGE, lock out of sync** (see the review
  record). The checkout's `node_modules` was never touched; `git status --porcelain -- package.json
  package-lock.json` stayed empty.
- [x] **S3 — Amend the exception record.** Added "Review record — 2026-09-03" with the totals, the
  per-advisory rows, the `npm ls image-size` result, the `npm ci` isolation result, the retirement
  of GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq, the new `decode-uri-component` row, the corrected
  installed Expo version (`57.0.18`, the doc said `57.0.13`), the proposed review-by date, and one
  unsigned **Owner decision** row bound to the current manifest SHA-256s. Existing structure and
  compensating controls left intact.
- [x] **S4 — Propagate.** `docs/WORK-FRONTLOG.md` rank 2 → "done on lane — awaiting owner
  reapproval"; `docs/groundwork.md` Not-yet bullet rewritten off the real finding set;
  `docs/next-session.md` replaced in the ADR-0025 shape with the C1 deletion-UI close as FIRST
  action.
- [x] **S5 — Gates + land.** docs-surface lint PASS, next-session audit CURRENT, `npm run lint`
  unchanged, manifests clean. Commit, push, PR against `main`, mailbox `request` to the owner.

## Acceptance

- `npm audit --json` re-run and quoted verbatim in the review record (totals + per-advisory rows).
- `npm ls image-size` empty, and no `image-size` node in `package-lock.json`.
- `npm run lint` → `ESLint: No issues found` (unchanged from baseline).
- `git status --porcelain -- package.json package-lock.json` → empty at commit time.
- `py -3.12 <GromCodebase>/tools/docs-surface-lint.py --repo . --require-presence --allowlist
  <GromCodebase>/docs/fleet/docs-surface-allowlist.json` → PASS.
- `py -3.12 <GromCodebase>/tools/next-session-audit.py --checkout .` → CURRENT.
- The Owner decision row is present and **unsigned** — the lane does not self-approve.

Fixtures-mode proof is not applicable: this lane ships no runtime code.

## Held questions

1. **Review-by date.** Proposed **2026-10-10**, or the next Expo SDK line (SDK 58 / the first
   `expo-router` 57.x that drops `query-string@7`), whichever is first. Default assumption: the
   owner takes 2026-10-10. The lane proceeds under the current date until the owner rules.
2. **`npm ci` drift.** The committed lockfile no longer reifies (`@react-native/js-polyfills@0.86.2`
   in lock vs `0.86.3` required by `react-native@0.86.3`; a fresh resolution pulls the RN 0.87 /
   Metro 0.87 line — **which re-introduces `image-size@1.2.1`**). Default assumption: this is a
   separate owner-gated dependency lane, not this review's business, and the exception's
   deployment precondition ("prove a clean `npm ci --omit=dev --omit=optional --ignore-scripts`
   succeeds") is therefore currently **unprovable**. Recorded as such rather than repaired here.
3. **Dependabot alerts #2/#3.** Dismissed as `tolerable_risk` against advisories that no longer
   have a package in the tree. Default assumption: they should be closed as fixed and #1 re-scoped,
   but the alert surface is owner-only, so the lane records the delta and does not act.
4. **Severity floor.** With 0 high remaining, is the exception still needed at all, or does it
   collapse to a plain moderate-tolerance note? Default assumption: still needed — the reapproval
   clause and the review-only boundary are what the record actually buys, not the severity count.

## Branch / PR

- Branch: `lane/choonzm-npm-audit-review/20260903` (from `main` @ `da8d690`).
- PR: docs-only, against `main`; do not merge — owner reapproval of the decision row is the gate.
- Mailbox: stream `choonz-mobile`; `posture` → `start` (five fenced doc paths) → `wrap`; the owner
  ask goes out as a `request` frame carrying one `wid-…` ref.
