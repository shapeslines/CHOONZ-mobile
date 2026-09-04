# CHOONZ-mobile — next session

## State @ 2026-09-04 · lane choonzm-fightv2-ui
Base = the trunk after the rev-2 decoder lane merged. This lane closes frontlog rank six: a two-value
**Engine** selector (`ah-scripted` / `fight-v2`) on match setup, `createMatch` forwarding the choice,
the ready card stating the engine the **server** froze, and a per-side engine `state` line plus an
`over` signal on the HUD — rendered only when the confirmed state says `fight-v2`. No manifest,
lockfile, or CI change. Depth: standard.

## Shipped
- C1 deletion close, and the npm-audit review whose decision row is still unsigned [both merged]
- rev-2 decoders — revision list gate + fight-v2 additive reads [merged]
- fight-v2 UI — engine selector, ready-card engine, HUD state/over [PR open; do not merge]

## Companion packet
- changelog: [WORK-FRONTLOG.md](WORK-FRONTLOG.md) · summary: [groundwork.md](groundwork.md) · logging: inline/none · pickup: [plans/fightv2-ui.md](plans/fightv2-ui.md)
- nuances: `over` is a **display signal only** — the workflow FSM, its transitions and the completion
  path are untouched, `Match.status` stays the phase authority, and `legal_actions` / `move_costs` /
  `boxes` stay decoded-but-unrendered on purpose.

## Signals
- **state/flags:** local gates green — Vitest ninety-seven → one hundred, Jest fifty-four → sixty,
  typecheck, lint (zero warnings), `expo:check`; lockfile untouched (`node_modules` junctioned).
- **decoder correction landed here:** the backend sends the additive keys as an explicit `null` under
  `ah-scripted`, not absent, so the prior lane's optional-only helper would have thrown on every full
  read. `absentOrNull` reads absent and `null` alike; a bad type still fails closed. **Series is
  untouched:** CHOONZ `app/schemas/series.py` on `main` has no `engine` field to mirror.
- **raised for custodian:** the lockfile drift and the vault note's projection fields →
  [custodian-queue.md](custodian-queue.md) · **communicated:** mailbox on `choonz-mobile`.
  **FOR /brain:** decode, then render, then correct — the render lane proved the null shape.
  **DEFERRED:** engine affordance rendering; owner signature on the npm-audit exception.

## Next — FIRST action
1. **Mechanics-lab revision pin** (frontlog rank seven, gate met): the backend flipped its lab default
   to revision two and the lab silently follows. Decide pin / selector / follow, and state it in the header.
2. **Owner blocker (rank one):** the lockfile drift — `npm ci` does not reify, so hosted CI stays red;
   fix under a fresh dependency review, then reapprove the re-scoped npm-audit exception.

## Queue
- Bot four-oh-nine `detail` decoding — backend mutate gate. Store identity, EAS profiles, auth providers, IAP — owner decisions.
