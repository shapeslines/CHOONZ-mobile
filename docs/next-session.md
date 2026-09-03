# CHOONZ-mobile — next session

## State @ 2026-09-03 · lane choonzm-m-s3 (stacked on the PM-baseline lane, PR #48)
Base = main after PR #46. Two lanes open: PM baseline (PR #48, docs-only) and this M-S3 lane:
object-valued error `detail` on `ChoonzClientError`, unlock decoders, `unlockSkin`, `SkinRow`
unlock/progress UI, stateful fixture ownership. Depth: standard.

## Shipped
- Expo SDK 57 patch-version sync [#46, merged]
- lane choonzm-pm-baseline — docs-only [#48, owner merge]
- lane choonzm-m-s3 — M-S3 earnable unlock UI + detail decoder [PR pending, merge after #48]

## Companion packet
- changelog: [WORK-FRONTLOG.md](WORK-FRONTLOG.md) "Done (recent)"
- summary: [groundwork.md](groundwork.md)
- nuances: `request()` now decodes non-2xx bodies into `ChoonzClientError.detail` (`{code, message, extra}`); feature decoders read `extra` (unlock → `condition`; bot 409 → `receipt` later)
- logging: inline/none
- suggestions / pickup: [plans/README.md](plans/README.md)

## Signals
- **state/flags:** main green (Vitest 59, Jest 33). Backend contracts owed: M-S3 unlock UI (#125), object `detail`. npm-audit exception review due 2026-09-10.
- **communicated:** mailbox posture/start/wrap on `choonz-mobile`.
- **raised for /custodian:** 3 markers → [custodian-queue.md](custodian-queue.md)
- **FOR /brain:** CHOONZ-mobile shares the backend's vault note; branch prefix is now `lane/choonzm-…`.
- **DEFERRED / unresolved:** owner merge of #48 then the M-S3 PR; M1–M6 owner decisions; C1 deletion UI status.

## Next — FIRST action
1. Rank 2: npm-audit exception review before 2026-09-10 — run `npm audit`, confirm `image-size` status, renew or retire [security/npm-audit-exception.md](security/npm-audit-exception.md). Then rank 3: verify the C1 deletion UI on main.

## Queue
- Rank 4/5 (blocked): bot 409 decoding after `G-P2-MUTATE`; fight-v2 additive HUD fields after CHOONZ engine M5.
- Keep `docs-surface-lint.py --repo .` green on wrap; patch the shared vault note's projection fields.
