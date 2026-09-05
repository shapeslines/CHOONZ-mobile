# CHOONZ-mobile — next session

## State @ 2026-09-04 · lane choonzm-lockfile
Base = the trunk after the series-engine lane. Owner authorized regenerating `package-lock.json`
under a fresh dependency review, so this lane re-locked it: `package.json` is untouched, seven
direct dependencies move by patch inside ranges they already declared, and the `@react-native/*`
skew under React Native is closed. Audit is flat — thirteen moderate, no high, no critical, same
two leaf advisories, `image-size` absent.

## Shipped
- series engine contract, fight-v2 UI, rev-2 decoders, C1 deletion close [merged]
- lockfile re-lock plus its security record [PR open; **owner merges, not the lane**]

## Companion packet
- changelog: [WORK-FRONTLOG.md](WORK-FRONTLOG.md) · summary: [groundwork.md](groundwork.md) ·
  logging: inline/none · pickup: [security/lockfile-relock-2026-09.md](security/lockfile-relock-2026-09.md)
- nuances: the tracked `.npmrc` carries `legacy-peer-deps=true` and the whole resolution rests on
  it. Copy it alongside any install proof, or npm resolves peers strictly, demands the newer React
  Native line, and drags the vulnerable image parser back.

## Signals
- **state/flags:** six gates green on the re-locked tree — `npm ci`, typecheck, lint, Vitest one
  hundred and five, Jest sixty, `expo:check`. Audit identical before and after. Depth: standard.
- **two corrections:** "`npm ci` cannot reify" is a method artifact — it reifies inside the
  checkout; the earlier proof ran in a bare copy without `.npmrc`. And red hosted CI on `main` is
  a runner/billing failure (job ends in two seconds, no steps recorded), so re-locking does **not**
  turn CI green.
- **raised for custodian:** the unsigned npm-audit decision row is bound to a stale lockfile hash
  and must be reapproved against the new one → [custodian-queue.md](custodian-queue.md).
  **FOR /brain:** prove an install in the checkout, not a copy — dropping a dotfile invents drift.
  **DEFERRED:** the owner signature; Dependabot alert state; `expo:doctor` and the web export.

## Next — FIRST action
1. **Mechanics-lab revision pin** (frontlog rank eight, gate met): the backend flipped its lab
   default to revision two and the client silently follows. Decide pin / selector / follow and
   state the revision in the lab header either way.
2. **Awaiting owner merge:** the lockfile PR, and with it the reapproval of the re-scoped npm-audit exception against the new lockfile hash.

## Queue
- Bot four-oh-nine `detail` decoding — backend mutate gate. Store identity, EAS, auth providers, IAP — owner.
