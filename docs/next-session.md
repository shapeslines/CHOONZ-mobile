# CHOONZ-mobile — next session

## State @ 2026-09-03 · lane choonzm-rev2-decoders
Base = the trunk after the C1 deletion lane merged. This lane closes frontlog rank 5: the
mechanics-lab identity decoder accepts engine revision `1` **or** `2` from a supported-revision list
instead of a hard single-value gate; `Match` carries the additive `engine` (absent means
`ah-scripted`, by contract, never inferred); a full `MatchState` read decodes the fight-v2 additive
keys, which nothing renders yet. No manifest, lockfile, or CI change. Depth: standard.

## Shipped
- M-S3 earnable unlock UI + object-valued error `detail` [#50, merged]
- C1 deletion close — per-status handling + §3 correction [#51, merged]
- npm-audit review — exception re-scoped, decision row left unsigned [#52, merged]
- rev-2 decoders — revision list gate + fight-v2 additive reads [PR open; do not merge]

## Companion packet
- changelog: [WORK-FRONTLOG.md](WORK-FRONTLOG.md) · summary: [groundwork.md](groundwork.md) · logging: inline/none · pickup: [plans/rev2-decoders.md](plans/rev2-decoders.md)
- nuances: `boxes` is deliberately **not** decoded (no consumer, unknown keys already ignored);
  `legal_actions` is `string[]`, not the `FightAction` union; a present key fails closed on a bad type.

## Signals
- **state/flags:** local gates green — Vitest 90 → 97, Jest 53 → 54, typecheck, lint (0 warnings),
  `expo:check`; lockfile untouched. **Hosted CI stays red on `main`**: its first step is `npm ci`
  and the committed lockfile no longer reifies (it pins `@react-native/*` 0.86.2 against the
  `react-native` 0.86.3 the manifest requires) — this lane installed from that committed lock.
- **raised for custodian:** the lockfile drift, and the vault note's projection fields →
  [custodian-queue.md](custodian-queue.md) · **communicated:** mailbox on `choonz-mobile`.
- **FOR /brain:** decode and HUD are separate gates — an additive field is decoded before it renders.
- **DEFERRED:** `boxes` (engine M5); owner signature on the npm-audit exception; M1–M6 decisions.

## Next — FIRST action
1. **fight-v2 UI lane** (`lane/choonzm-fightv2-ui/<date>`): engine selector on match setup, forward
   `engine` in `createMatch`, and render `ann` / `state` / `over` on the fight screen — start once
   CHOONZ M5 is merged.
2. **Owner blocker (rank 1):** the lockfile drift — fix under a fresh dependency review so `npm ci`
   reifies and hosted CI goes green, then reapprove the re-scoped npm-audit exception.

## Queue
- M1 store identity (`clubheavy.choonz`) + EAS profiles — owner decision, then the agent row.
- Bot 409 `detail` decoding — blocked on CHOONZ `G-P2-MUTATE`.
