# CHOONZ-mobile — next session

## State @ 2026-09-04 · lane choonzm-lab-revision
Base = the trunk after the series-engine contract merged. The backend flipped its mechanics-lab
default to engine revision two, and the client had been following it silently with no way back to
the revision-one goldens. Owner decision this lane: **a selector, defaulting to the server**. The lab
now carries a `LAB / ENGINE REVISION` control — `SERVER` (sends no pin at all), `1`, `2` — threaded
through the scenario list, the scenario detail and the replay body, with the pin in the query key so
switching refetches. No manifest, lockfile, or CI change. Depth: standard.

## Shipped
- rev-2 decoders, the fight-v2 UI, and the series engine contract [all merged]
- mechanics-lab revision selector — pin forwarded on all three lab calls [PR open; do not merge]

## Companion packet
- changelog: [WORK-FRONTLOG.md](WORK-FRONTLOG.md) · summary: [groundwork.md](groundwork.md) · logging: inline/none · pickup: [plans/lab-revision.md](plans/lab-revision.md)
- nuances: the header still prints the revision the **server declared**, never the one that was
  asked for, so a pin the backend does not honour is visible instead of assumed. `SERVER` is the
  absence of a parameter, not a third value on the wire.

## Signals
- **state/flags:** local gates green — Vitest one hundred and five → one hundred and eight, Jest
  sixty → sixty-four, typecheck, lint (zero warnings), `expo:check`; lockfile untouched.
- **worth knowing:** an unsupported revision returns the same indistinguishable four-oh-four as a
  missing scenario or a disabled lab, by backend design, so the client renders the existing
  not-found state and leaves the pin switchable rather than guessing the cause.
- **raised for custodian:** the lockfile drift and the vault note's projection fields →
  [custodian-queue.md](custodian-queue.md) · **communicated:** mailbox on `choonz-mobile`.
  **FOR /brain:** "follow the server" is best modelled as an absent request field, not an enum
  member — the wire stays byte-identical to the pre-selector default. **DEFERRED:** persisting the
  selection; a scenario-detail screen (the pin is threaded for its first caller).

## Next — FIRST action
1. **No open non-owner mobile row remains** — every claimable frontlog row is done or gated. Owner:
   merge the pending lockfile PR (rank one), then reapprove the npm-audit exception against the new
   lock hash (rank two, decision row still unsigned).
2. Then re-baseline: `npm ci` must reify again before hosted CI on `main` can go green.

## Queue
- Bot four-oh-nine `detail` decoding — backend mutate gate. Store identity, EAS profiles, auth providers, IAP — owner decisions.
