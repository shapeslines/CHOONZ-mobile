# CHOONZ-mobile — next session

## State @ 2026-09-04 · lane choonzm-series-engine
Base = the trunk after the fight-v2 UI lane merged. This lane closes the last blocked bridge row:
the backend froze **one engine per series**, so the client now carries the series contract —
`Series` / `SeriesCreateInput` types, `decodeSeries` defaulting an absent `engine` to the scripted
port, `createSeries` forwarding the choice, and a fixture series whose first bout carries the engine
the series reads back from. No manifest, lockfile, or CI change. Depth: standard.

## Shipped
- C1 deletion close, and the npm-audit review whose decision row is still unsigned [both merged]
- rev-2 decoders, then the fight-v2 UI — selector, ready-card engine, HUD state/over [merged]
- series engine contract — decode, forward, fixture [PR open; do not merge]

## Companion packet
- changelog: [WORK-FRONTLOG.md](WORK-FRONTLOG.md) · summary: [groundwork.md](groundwork.md) · logging: inline/none · pickup: [plans/fightv2-ui.md](plans/fightv2-ui.md) §"Series follow-up"
- nuances: the fixture derives the series `engine` **off its first bout**, not off the request, so it
  agrees with the server about who is the authority. A present-but-unknown value still fails closed.

## Signals
- **state/flags:** local gates green — Vitest one hundred → one hundred and five, Jest sixty
  unchanged, typecheck, lint (zero warnings), `expo:check`; lockfile untouched (junctioned modules).
- **scope correction worth knowing:** this app has **no series surface at all** — no screen, route,
  card, or provider, and `series_id` is the only series word in `src/`. The brief asked for an
  `ENGINE <id>` line on a series card and an engine passed from a series setup screen; neither
  exists, so the lane landed the contract only. The first series screen renders it the way the ready
  card renders the match engine.
- **raised for custodian:** the lockfile drift and the vault note's projection fields →
  [custodian-queue.md](custodian-queue.md) · **communicated:** mailbox on `choonz-mobile`.
  **FOR /brain:** a contract can land ahead of its surface — decode first, render when a screen
  earns it. **DEFERRED:** the series screen; engine affordances; the npm-audit owner signature.

## Next — FIRST action
1. **Mechanics-lab revision pin** (frontlog rank eight, gate met): the backend flipped its lab default
   to revision two and the lab silently follows. Decide pin / selector / follow, and state it in the header.
2. **Owner blocker (rank one):** the lockfile drift — `npm ci` does not reify, so hosted CI stays red;
   fix under a fresh dependency review, then reapprove the re-scoped npm-audit exception.

## Queue
- Bot four-oh-nine `detail` decoding — backend mutate gate. Store identity, EAS profiles, auth providers, IAP — owner decisions.
