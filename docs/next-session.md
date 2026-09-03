# CHOONZ-mobile — next session

## State @ 2026-09-03 · lane choonzm-npm-audit-review (branch dated 2026-09-03)
Base = the trunk after the PM-baseline (#48) and M-S3 (#50) merges. Docs-only lane: the rank-2
npm-audit exception review, discharged ahead of its 2026-09-10 date. No `package.json`,
`package-lock.json`, `node_modules`, or CI change. Depth: standard.

## Shipped
- lane choonzm-pm-baseline — docs-only [#48, merged]
- lane choonzm-m-s3 — earnable unlock UI + object-valued error `detail` [#50, merged]
- lane choonzm-npm-audit-review — audit re-run, exception re-scoped, decision row left unsigned
  [PR open; do not merge until the owner rules]

## Companion packet
- changelog: [WORK-FRONTLOG.md](WORK-FRONTLOG.md) "Done (recent)" · summary: [groundwork.md](groundwork.md)
- nuances: audit is now 13 moderate / 0 high / 0 critical; both `image-size` highs retired (gone
  from tree and lock); new leaf `decode-uri-component` GHSA-vcc3-ghjq-m6fr via `expo-router ->
  query-string`; `uuid` GHSA-w5hq-g745-h8pq carried; every offered fix is a semver-major downgrade.
- logging: inline/none · pickup: [plans/npm-audit-review-2026-09.md](plans/npm-audit-review-2026-09.md)

## Signals
- **state/flags:** local gates green (lint clean). **Hosted CI is red on `main`** — its first step
  is `npm ci` and the committed lockfile no longer reifies (EUSAGE: lock's
  `@react-native/js-polyfills@0.86.2` vs the `0.86.3` `react-native@0.86.3` requires). A fresh
  resolution pulls RN 0.87 / Metro 0.87 and **re-introduces `image-size@1.2.1`** — own repair lane.
- **communicated:** mailbox posture / start / wrap on `choonz-mobile` + owner `request` frame;
  **/custodian:** existing markers → [custodian-queue.md](custodian-queue.md)
- **FOR /brain:** exception reviews are evidence lanes — they never sign their own decision row.
- **DEFERRED:** owner signature on the re-scoped exception; the lockfile-reify repair lane;
  Dependabot alerts #2/#3 should close as fixed (owner-only surface); M1–M6 owner decisions.

## Next — FIRST action
1. Rank 3: close C1 — verify the `DELETE /me` deletion UI on `main` in `src/app/profile.tsx`
   against `docs/store-readiness.md` §3, record it in `docs/groundwork.md` (a concurrent seat may
   hold those paths — check first). If C1 is closed, take the M1 store-identity owner decision.

## Queue
- Owner: sign or reject the re-scoped npm-audit exception; rule on the lockfile-reify repair.
- Rank 4/5 (blocked): bot 409 decoding after `G-P2-MUTATE`; fight-v2 HUD fields after engine M5.
- Keep `docs-surface-lint.py --repo .` green on wrap; patch the shared vault note's projections.
