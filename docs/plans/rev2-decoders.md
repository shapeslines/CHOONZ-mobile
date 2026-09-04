# Plan — `rev2-decoders` (engine revision 2 + fight-v2 additive reads)

**Status:** done on lane `lane/choonzm-rev2-decoders/20260903` (2026-09-03); the backend contract
merged as CHOONZ #135 (M4) and M5 lands in parallel.
**Rank:** 5. **Size:** S. **Branch:** `lane/choonzm-rev2-decoders/<yyyymmdd>`.

## Goal

The client refuses every mechanics-lab response that is not engine revision `1`, and it has no word
for which engine owns a match. When CHOONZ M5 flips the default to revision `2`, that hard gate
turns the lab into a dead screen and every fight-v2 read into an undifferentiated `ah-scripted` one.
This lane teaches the decoders the revision-2 vocabulary — a revision **list** instead of a single
constant, an additive `Match.engine`, and the additive fight-v2 keys on a full state read — without
the client ever inferring an engine, a winner, or a legal action it was not told.

## Spec sources (restated, not re-derived)

- **Mechanics lab (CHOONZ #135 M4):** responses carry `engine_revision` `"1"` or `"2"`; the routes
  accept `?engine_revision=` / a body field, and M5 makes `"2"` the default. `schema_version` and
  `corpus_version` are unchanged, so their single-value gates stay exactly as they are.
- **`MatchRead` (additive):** gains `engine: "ah-scripted" | "fight-v2"`, default `"ah-scripted"`.
  Older servers omit the key entirely.
- **`MatchState` full read under fight-v2 (additive):** top-level `ann` (already decoded), `winner`,
  `over`, `engine`; per side `state`, `legal_actions`, `move_costs`, `boxes`. Every HUD key the
  client already reads is unchanged.
- **House rule (`AGENTS.md` §1, §3):** the client is never the authority — it must not invent a
  status, HUD, result, or engine. Fail-closed decoding of every backend shape.

## Design

- **`SUPPORTED_MECHANICS_ENGINE_REVISIONS = ['1', '2'] as const`** replaces the
  `MECHANICS_ENGINE_REVISION` constant in `src/lib/decoder.ts` and is exported, so a test and a
  future revision bump have one place to read. The identity decoder rejects anything outside the
  list, which keeps a revision `3` corpus fail-closed rather than drawn with revision-2 assumptions.
  The lab header already prints `schema · corpus · engine` from the decoded identity, so the screen
  states the revision the server declared with no new plumbing.
- **`optional(value, label, decode)`** is the one new decoder helper: `undefined` — an absent key —
  stays absent, and any present value goes through the strict decoder. `null` is therefore *not* a
  free pass; a wrongly-typed additive key still throws `ResponseDecodeError`.
- **`Match.engine`** is the one non-optional read: absence means `ah-scripted` by contract, so
  `decodeMatch` substitutes that default explicitly and never derives it from another field.
  `MatchCreateInput.engine?` rides the existing generic JSON body — `createMatch` is unchanged.
- **`MatchState` / `FighterHud` additive keys** are decoded when present and left absent otherwise:
  `winner` (nullable match result), `over` (boolean), `engine`; per side `state` (string),
  `legal_actions` (`string[]`, deliberately not the `FightAction` union so a new engine action is
  not a decode failure), `move_costs` (`Record<string, number>`, floats allowed).
- **`boxes` is deliberately not decoded.** It is a render-geometry payload with no consumer on this
  lane, and `decodeMatchState` already ignores unknown keys, so it costs nothing to leave out and
  would cost a wrong shape to guess. The fight screen renders exactly as before.

## Write fence

`src/lib/decoder.ts`, `src/lib/types.ts`, `tests/api.test.ts`, `tests/fight-api.test.ts`,
`tests/lab-screen.test.tsx`, `docs/WORK-FRONTLOG.md`, `docs/plans/README.md`,
`docs/next-session.md`, this plan.

## Out of scope

`package.json` / `package-lock.json` (owner lockfile-drift row, rank 1); fight-screen rendering
beyond compiling — no HUD reads `state`, `legal_actions`, `move_costs`, `over`, or `winner` yet;
`boxes`; the bot-orchestration 409 shape (rank 4, gated on `G-P2-MUTATE`); mechanics fixtures — the
lab is API-only and `src/lib/fixtures.ts` holds no mechanics corpus, so revision 2 needs no fixture
variant.

## Slice ledger

- [x] S0 Baseline in a fresh worktree: Vitest 90, Jest 53, typecheck, lint (0 warnings) green.
- [x] S1 `SUPPORTED_MECHANICS_ENGINE_REVISIONS` list gate + exported.
- [x] S2 `MatchEngine`, `Match.engine` with the `ah-scripted` default, `MatchCreateInput.engine?`.
- [x] S3 `optional()` helper; additive `MatchState` and per-side `FighterHud` keys.
- [x] S4 Tests: revision `1`/`2` accepted and `3`/`''`/`'2.0'` rejected across all three mechanics
      decoders; `Match` with, without, and with a bad `engine`; `MatchState` with and without the
      fight-v2 keys plus a wrong-type case per key; lab header states the revision.
- [x] S5 Docs: this plan, bridge row, frontlog rank 5, `docs/next-session.md`.

## Acceptance

```powershell
npm run typecheck ; npm run lint ; npx vitest run ; npm run test:screen ; npm run expo:check
```
Plus `git status --porcelain -- package.json package-lock.json` empty.

Result: Vitest 90 → 97, Jest 53 → 54, typecheck, lint (0 warnings), `expo:check` green; lockfile
untouched (the worktree installed from the committed lock with `npm ci`).

## Held questions

- **Revision 2 is accepted, not preferred.** The client sends no `?engine_revision=`; it renders
  whatever the server declares. When M5 flips the default the lab header simply reads `engine 2`.
  If the lab ever needs to pin a revision, that is a request parameter, not a decoder change.
- **`legal_actions` is `string[]`, not `FightAction[]`.** An additive field that fails closed on an
  unrecognised *value* would make a new engine action break the whole state read; the type is still
  strict, so a non-string still throws.
- **Nothing renders the fight-v2 keys yet.** Decoding first is deliberate: the HUD work needs the
  M5 server to look at, and this lane keeps the fight screen byte-identical.

## Branch / PR

`lane/choonzm-rev2-decoders/<yyyymmdd>`; PR title
`feat(decoder): accept engine revision 2 and fight-v2 additive reads`.
