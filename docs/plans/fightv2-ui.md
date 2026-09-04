# Plan — `fightv2-ui` (fight-v2 engine selector + revision-2 state on the fight screen)

**Status:** done on lane `lane/choonzm-fightv2-ui/20260904` (2026-09-04); the backend M5 addendum is
merged on CHOONZ `main`.
**Rank:** 5 (successor to `rev2-decoders`). **Size:** S. **Branch:** `lane/choonzm-fightv2-ui/<yyyymmdd>`.

## Goal

`rev2-decoders` taught the client the revision-2 vocabulary but rendered none of it: there is no way
to ask for `fight-v2`, no way to see which engine a confirmed match runs, and a full state read under
`fight-v2` throws away every additive key on its way to the screen. This lane makes the engine a
first-class, **server-confirmed** thing the player can choose and read — a two-value setup selector,
the engine stated on the match card from `Match.engine`, and a per-side `state` label plus an `over`
display signal on the HUD — without the client ever inferring an engine, a phase, or a result.

## Spec sources (restated, not re-derived)

- **CHOONZ `docs/mobile-integration.md` §"Engine revision 2 (M5)" (merged on `main`).**
  - `POST /matches` takes an optional `engine`, a closed enum of `"ah-scripted"` (default) and
    `"fight-v2"`; anything else is a `422` from validation. The id is **frozen at creation** and a
    rematch **inherits** it.
  - `MatchRead.engine` echoes the frozen id on create/get/list/start/complete/rematch. A match
    created before M5 reads back as `"ah-scripted"`.
  - `MatchStateRead.engine` is always present. `winner` and `over` are populated **only** under
    `engine="fight-v2"` with `detail=full`, and are **`null` otherwise**.
  - Per-side (`detail=full`, `fight-v2` only, `null` under revision 1): `state`, `legal_actions`,
    `move_costs`, `boxes`.
  - The revision-1 HUD keys are unchanged in name, shape and meaning under both engines.
- **`docs/plans/rev2-decoders.md` (merged as #53).** `Match.engine` with the `ah-scripted` default,
  `MatchCreateInput.engine?`, the additive `MatchState`/`FighterHud` keys, `boxes` deliberately
  undecoded.
- **House rule (`AGENTS.md` §1, §3).** The client is never the authority: it must not invent a
  status, HUD, result, or engine, and `src/lib/fight-machine.ts` stays the client **workflow** FSM —
  never a combat or engine authority.

## Design

- **The selector is setup-local; the reading is server-confirmed.** `FightSelection` gains
  `engine: MatchEngine` (default `'ah-scripted'`) and `selectMatchOptions` accepts it alongside
  `gel` / `fighterId` / `stageId`. **No transition, command, or legality rule in `fight-machine.ts`
  changes** — the engine is a setup value on the same footing as the stage. `createMatch` puts
  `engine: selection.engine` in the body; the client then forgets it. The `READY` card reads
  `match.engine`, never the selection, so a server that ignores or overrides the request is believed.
- **`createMatch` needed no API change.** `ChoonzApiClient.createMatch` already sends the whole
  `MatchCreateInput` as the JSON body, so `engine` rides through untouched; the existing #53 test
  pins that. The fixture path mirrors the live one: `FixtureMatchService.createMatch` stores
  `input.engine ?? 'ah-scripted'`, and `rematch` clones the record, so the fixture inherits the
  engine exactly as the contract says the server does.
- **Two selector values, contract tokens as ids.** `select-engine-ah-scripted` / `select-engine-fight-v2`
  are the accessibility labels (the token, so a test pins the wire value); `SCRIPTED` / `FIGHT-V2`
  are the presentation labels. The list is a module constant, so a third engine is one row.
- **The HUD renders two revision-2 reads, both gated on `state.engine === 'fight-v2'`.** A per-side
  `STATE <name>` line (`engine-state-p1` / `engine-state-p2`) and an `ENGINE REPORTS ROUND OVER`
  line (`fightv2-over`) when `over === true`. `over` is a **display signal only** — the phase still
  comes from `phaseOf(workflow)` and the completion path is untouched, so a `true` `over` on an
  active match neither hides the controls nor completes anything.
- **`ann` was already rendered** (live region, `role="status"`) and is left exactly as it was.
- **`legal_actions`, `move_costs` and `boxes` are not rendered.** They are engine affordances and
  debug geometry; rendering them would make the client look like it owns the move legality it does
  not. They stay decoded-and-unused.
- **Decoder correction — `absentOrNull`.** M5's contract says the additive keys are **`null`** under
  `ah-scripted`, not absent. #53's `optional()` only forgives `undefined`, so an `ah-scripted`
  `detail=full` read against the merged M5 server would have thrown `ResponseDecodeError` on
  `over: null` and on each per-side `null`. `absentOrNull()` reads absent **and** `null` as "the
  engine said nothing"; any other present value still goes through the strict decoder, so a
  wrongly-typed key still fails closed. `winner` already used `nullableMatchResult` and is unchanged.

## Write fence

`src/lib/decoder.ts`, `src/lib/fight-machine.ts`, `src/lib/fixture-match-service.ts`,
`src/providers/fight-provider.tsx`, `src/app/fight.tsx`, `tests/fight-api.test.ts`,
`tests/fight-machine.test.ts`, `tests/fight-screen.test.tsx`,
`tests/fixture-match-service.test.ts`, `docs/WORK-FRONTLOG.md`, `docs/plans/README.md`,
`docs/next-session.md`, this plan.

## Out of scope

`package.json` / `package-lock.json` (owner lockfile-drift row, rank 1); series `engine` — CHOONZ
`app/schemas/series.py` on `origin/main` carries **no** `engine` field, so `SeriesCreate` /
`SeriesRead` have nothing to mirror and the series surface is untouched; `legal_actions`,
`move_costs`, `boxes` rendering; a mechanics-lab revision selector (M5 flips the lab default to
`"2"` — a request parameter, not this lane); the bot-orchestration 409 shape (rank 4, gated on
`G-P2-MUTATE`); any `fight-machine.ts` transition, command, or legality change.

## Slice ledger

- [x] S0 Baseline in a fresh worktree (`node_modules` junctioned, lockfile untouched): Vitest 97,
      Jest 54, typecheck, lint (0 warnings) green.
- [x] S1 Fixture `createMatch` echoes `input.engine`; rematch inherits it by clone.
- [x] S2 `FightSelection.engine` + `selectMatchOptions`; provider `setMatchOptions({ engine })` and
      `createMatch` body field.
- [x] S3 `SETUP / ENGINE` selector panel; `ENGINE <id>` on the `READY` card from `Match.engine`.
- [x] S4 HUD: per-side `STATE`, the `over` signal, both gated on `state.engine === 'fight-v2'`.
- [x] S5 `absentOrNull` decoder helper for the M5 `null`-under-revision-1 shape.
- [x] S6 Tests: selector renders/selects/sends; ready card states both engines; fight-v2 shows
      `state` + `over` + `ann` and still shows the active controls; `ah-scripted` and an absent
      `engine` render neither signal; fixture echo + rematch inheritance; the `null` key read.
- [x] S7 Docs: this plan, bridge row, frontlog rank 5, `docs/next-session.md`.

## Acceptance

```powershell
npm run typecheck ; npm run lint ; npx vitest run ; npm run test:screen ; npm run expo:check
```
Plus `git status --porcelain -- package.json package-lock.json` empty.

Result: Vitest 97 → 100, Jest 54 → 60, typecheck, lint (0 warnings), `expo:check` green; lockfile
untouched (the worktree junctioned `node_modules` from the main checkout).

## Held questions

- **Series was not built — the backend field does not exist.** `git show origin/main:app/schemas/series.py`
  on CHOONZ has no `engine`; the M5 addendum documents `MatchRead.engine` and `SpectateRead.match.engine`
  and says nothing about a series. Mirroring the pattern speculatively would have the client
  declaring a contract the server has not made. **Open:** does a series freeze one engine for all its
  matches, or does each match choose? That is a backend decision; the client follows it.
- **`over` is a signal, not a transition.** The client shows it and changes nothing else. If a
  future lane wants `over` to drive the round-end ceremony, that is a `fight-machine.ts` change with
  its own gate — the confirmed `Match.status` stays the phase authority either way.
- **The engine cannot be changed after creation, and the UI does not pretend otherwise.** The
  selector only exists in the `setup` phase; the `READY` card is a read.
- **A `null` additive key and an absent one are the same thing to this client.** Both become
  `undefined`. Distinguishing "the server declined to say" from "this server is older" has no
  consumer, and conflating them keeps one render branch.
- **`SpectateRead.match.engine` is untouched** because this client has no spectate surface at all —
  no decoder, no route, no screen. When one lands it will need the same `Match.engine` read.

## Branch / PR

`lane/choonzm-fightv2-ui/<yyyymmdd>`; PR title
`feat(fight): fight-v2 engine selector + revision-2 state on the fight screen`.
