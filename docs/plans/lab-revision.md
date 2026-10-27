# Plan — `lab-revision` (mechanics-lab engine revision selector)

**Status:** done on lane `lane/choonzm-lab-revision/20260904` (2026-09-04); the backend behaviour
change merged with CHOONZ M5.
**Rank:** 8. **Size:** S. **Branch:** `lane/choonzm-lab-revision/<yyyymmdd>`.

## Goal

CHOONZ M5 flipped `ENGINE_REVISION` to `"2"`, so the lab routes now default to the `scenarios.v2.json`
corpus. The client sends no `engine_revision` on any of the three lab calls, so it silently followed
the flip — a developer looking at the lab could no longer choose which corpus to replay, and had no
way back to the revision-1 goldens. Owner decision (2026-09-04): **offer a selector, defaulting to
following the server.** This lane adds a `LAB / ENGINE REVISION` control with `SERVER` (default),
`1` and `2`, threads the choice through the list, detail and replay calls, and keeps the header
printing the revision the *server* declared rather than the one that was asked for.

## Spec sources (restated, not re-derived)

- **CHOONZ `docs/mobile-integration.md` §"Engine revision 2 (M5)" → "Mechanics-lab revision
  selector":** `engine_revision` is accepted as a query parameter on `GET /mechanics/scenarios` and
  `GET /mechanics/scenarios/{id}`, and as a body field on `POST /mechanics/replay`. It now defaults
  to `"2"`. **A client that wants the revision-1 corpus must send `engine_revision="1"` explicitly.**
  Revision 1 remains fully served and byte-identical.
- **Unsupported revision → `404`,** the same indistinguishable status as a disabled lab or a missing
  scenario — never a `422` that would leak which corpora are bundled. So the client must not special-
  case the pinned-revision failure; the existing not-found rendering is the correct one.
- **`SUPPORTED_MECHANICS_ENGINE_REVISIONS = ['1', '2']`** (`src/lib/decoder.ts`, landed by
  [rev2-decoders.md](rev2-decoders.md)) is the decode gate and is unchanged by this lane.
- **House rule (`AGENTS.md` §1, §3):** the client is never the authority. A pin is a *request*, not a
  fact about the response.

## Design

- **`MechanicsEngineRevision = '1' | '2'`** (`src/lib/types.ts`) is what may be *sent*. It has no
  `server` member on purpose: "follow the server" is the absence of a pin, not a third value on the
  wire. `LabRevisionSelection = 'server' | MechanicsEngineRevision` (`src/app/lab.tsx`) is the
  screen-level choice, and the screen collapses `server` to `undefined` at the API boundary.
- **`pinRevision(path, engineRevision?)`** in `src/lib/api.ts` appends `?engine_revision=<n>` or —
  when the pin is absent — returns the path untouched, so the default request is byte-identical to
  the pre-selector one. `replayMechanics` adds `engine_revision` to the body under the same
  condition. All three methods take the pin as a trailing optional argument, so every existing call
  site compiles unchanged.
- **The header is unchanged and deliberately so.** It keeps printing
  `schema · corpus · engine` off the decoded `MechanicsCorpusIdentity`, i.e. what the server
  declared. A pin the server does not honour is therefore *visible* rather than assumed, which is
  the whole reason the selection is not allowed to render itself as the revision.
- **The pin is part of the TanStack query key** (`mechanicsQueryKey(scope, 'scenarios', revision)`),
  so switching the selector refetches instead of re-rendering another corpus' scenarios from cache,
  and both corpora stay cached side by side under the same authenticated scope.
- **Switching the pin clears the selection and the receipt.** A receipt belongs to the corpus it was
  replayed against; carrying it across a switch would let it read as this corpus' verdict.
- **No fixture path.** The lab is API-only — `fromMechanicsMode` has no fixture branch and
  `src/lib/fixtures.ts` holds no mechanics corpus — so there is nothing to teach the pin to.

## Write fence

`src/lib/{api,types}.ts`, `src/app/lab.tsx`, `tests/api.test.ts`, `tests/lab-screen.test.tsx`,
`docs/WORK-FRONTLOG.md`, `docs/plans/README.md`, `docs/next-session.md`, this plan.

## Out of scope

`package.json` / `package-lock.json` (owner lockfile-drift row, rank 1 — PR #56 pending); the decode
gate in `src/lib/decoder.ts` (already accepts both revisions); mechanics fixtures (none exist); a
per-scenario detail screen (the lab never calls `getMechanicsScenario`, but the pin is threaded
through it so the first caller inherits it); the bot-orchestration 409 shape (rank 4).

## Slice ledger

- [x] S0 Baseline in the reused worktree off `origin/main`: Vitest 105, Jest 60, typecheck, lint
      (0 warnings) green; lockfile untouched.
- [x] S1 `MechanicsEngineRevision` type; `pinRevision` helper; the optional pin on
      `getMechanicsScenarios`, `getMechanicsScenario`, `replayMechanics` (interface and class).
- [x] S2 `LabRevisionSelection`, `LAB_REVISION_CHOICES`, the `LAB / ENGINE REVISION` panel with
      testIDs `select-lab-revision-server|1|2`; container state, query-key pin, receipt reset.
- [x] S3 Tests: default sends no param and no body field; `1` and `2` pinned on all three calls; a
      pinned `404` preserved as `response`/404; selector default, forwarding, ineligible-build
      absence, and the header stating the declared revision under a contradicting pin.
- [x] S4 Docs: this plan, bridge row, frontlog rank 8 → done, `docs/next-session.md`.

## Acceptance

```powershell
npm run typecheck ; npm run lint ; npx vitest run ; npm run test:screen ; npm run expo:check
```
Plus `git status --porcelain -- package.json package-lock.json` empty.

Result: Vitest 105 → 108, Jest 60 → 64, typecheck, lint (0 warnings), `expo:check` green; lockfile
untouched.

## Held questions

- **Why a selector and not a pin.** Pinning `"1"` would freeze the lab on the corpus the estate is
  moving off; following silently was the status quo the frontlog row objected to. The selector keeps
  the server default authoritative while making the revision-1 goldens reachable again.
- **A pinned revision that 404s is not distinguished.** The backend deliberately returns the same
  `404` for an unknown revision, an unknown scenario, and a disabled lab, so the client renders the
  existing not-found state and leaves the pin switchable rather than guessing which cause it was.
- **The selector is not persisted.** It resets to `SERVER` on remount. A developer-only screen with
  no stated persistence requirement should not invent one.

## Branch / PR

`lane/choonzm-lab-revision/<yyyymmdd>`; PR title
`feat(lab): engine revision selector (server / 1 / 2)`.
