# CHOONZ-mobile — next session

## State @ 2026-09-03 · lane choonzm-c1-deletion-close (branch dated 2026-09-03)
Base = the trunk after the npm-audit review merge (#52), with this lane merged up from it. This
lane closes rank 3: per-status `DELETE /me` handling in `src/app/profile.tsx` plus the
`docs/store-readiness.md` §3 body/confirm-phrase correction. No manifest, lockfile, or CI change.
Depth: standard.

## Shipped
- PM baseline — docs-only [#48, merged]
- M-S3 earnable unlock UI + object-valued error `detail` [#50, merged]
- npm-audit review — exception re-scoped, decision row left unsigned [#52, merged]
- C1 deletion close — per-status handling + §3 correction [#51, open; do not merge]

## Companion packet
- changelog: [WORK-FRONTLOG.md](WORK-FRONTLOG.md) "Done (recent)" · summary: [groundwork.md](groundwork.md)
- nuances: 404 → already deleted, 422 → `detail.message`, 403 → first-party denial, network/5xx →
  keep state + retry. Explainer + `src/app/privacy.tsx` unbuilt — owner-gated M5 privacy URL.
- logging: inline/none · pickup: [plans/c1-deletion-ui-close.md](plans/c1-deletion-ui-close.md)

## Signals
- **state/flags:** local gates green. **Hosted CI is red on `main`** — its first step is `npm ci`
  and the committed lockfile no longer reifies (lock pins `@react-native/*` 0.86.2 against the
  `react-native` 0.86.3 the manifest requires). A fresh resolution re-introduces `image-size`, so
  the re-lock needs a fresh dependency review, not an incidental fix.
- **raised for custodian:** the lockfile drift, and the shared vault note — its projection fields
  need patching for both this lane and the audit review → [custodian-queue.md](custodian-queue.md)
- **communicated:** mailbox posture / start / wrap on `choonz-mobile` + owner `request` frame.
- **FOR /brain:** exception reviews are evidence lanes — they never sign their own decision row.
- **DEFERRED:** owner signature on the re-scoped exception; M1–M6 owner decisions.

## Next — FIRST action
1. **Owner:** fix the lockfile drift under a fresh dependency review so `npm ci` reifies and hosted
   CI goes green, then reapprove the re-scoped npm-audit exception.

## Queue
- Agent pickup after the owner rows clear: rev-2 mechanics-lab decoder bump when CHOONZ engine M4
  lands, or M1 store identity once the owner decides.
- Blocked: bot 409 decoding after `G-P2-MUTATE`; fight-v2 HUD fields after engine M5.
- Keep `docs-surface-lint.py --repo .` green on wrap; patch the shared vault note's projections.
