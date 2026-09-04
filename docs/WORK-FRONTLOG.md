# CHOONZ-mobile — WORK-FRONTLOG

Granular tickets for this repo. Immediate handoff is `docs/next-session.md`. Fleet flagged work lives in GromCodebase `docs/fleet/GAP-REGISTER.md` — **point there**, never fork a second register.

Claim protocol: pick the highest-ranked `open` row whose gate is met, write your seat + branch in the
State cell, create the branch named in the plan, post the mailbox `start` frame (stream
`choonz-mobile`) with every fenced path. Rows sharing `src/lib/api.ts` / `decoder.ts` / `types.ts`
are serial. Owner-blocked rows are never claimed by an agent.

| Rank | Work | Evidence / fence | State |
|---:|---|---|---|
| 1 | **Mobile lockfile drift** — `npm ci` fails (`react-native` 0.86.3 vs `@react-native/*` 0.86.2 in the committed lock); hosted CI on `main` is red; a fresh resolution re-introduces `image-size`; owner must re-lock under a fresh dependency review | [security/npm-audit-exception.md](security/npm-audit-exception.md) §"Review record — 2026-09-03"; fence `package.json`, `package-lock.json` | **blocked — owner** |
| 2 | npm-audit exception review (was due 2026-09-10) — re-audited 2026-09-03: **13 moderate / 0 high / 0 critical**; both `image-size` highs retired (package absent from tree and lock); new leaf `decode-uri-component` GHSA-vcc3-ghjq-m6fr | [plans/npm-audit-review-2026-09.md](plans/npm-audit-review-2026-09.md); [security/npm-audit-exception.md](security/npm-audit-exception.md) §"Review record — 2026-09-03"; docs-only fence, no manifest change | **done (merged, PR #52) — awaiting owner reapproval** |
| 3 | **`c1-deletion-ui-close`** — per-status `DELETE /me` handling (404 already-deleted, 422 `detail.message`, 403 denial, network/5xx retry), §3 body + confirm-phrase correction | [plans/c1-deletion-ui-close.md](plans/c1-deletion-ui-close.md); fence `src/app/profile.tsx`, `tests/profile-screen.test.tsx`, `tests/api.test.ts`, `docs/store-readiness.md` | **done** on lane `lane/choonzm-c1-deletion-close/20260903` (PR #51; explainer + `privacy.tsx` remain owner-gated M5) |
| 4 | Decode bot-orchestration 409 `{detail:{code, message, receipt?}}` | `src/lib/decoder.ts`, fight screens | blocked — CHOONZ `G-P2-MUTATE` |
| 5 | **`rev2-decoders`** — mechanics `engine_revision` `1`/`2` list gate, additive `Match.engine`, additive fight-v2 `read_state_full` keys (`winner`, `over`, `engine`, per-side `state`/`legal_actions`/`move_costs`); `boxes` and HUD rendering deliberately deferred | [plans/rev2-decoders.md](plans/rev2-decoders.md); fence `src/lib/{decoder,types}.ts`, `tests/{api,fight-api}.test.ts`, `tests/lab-screen.test.tsx` | **done** on lane `lane/choonzm-rev2-decoders/20260903` (backend M4 merged as CHOONZ #135; fight-v2 HUD rendering still gated on engine M5) |
| 6 | **`fightv2-ui`** — engine selector on match setup (`ah-scripted` / `fight-v2`), `engine` forwarded in `createMatch` and echoed by the fixture, `Match.engine` on the ready card, per-side `state` + `over` on the HUD under fight-v2 only; `absentOrNull` decoder fix for M5's `null`-under-revision-1 keys | [plans/fightv2-ui.md](plans/fightv2-ui.md); fence `src/lib/{decoder,fight-machine,fixture-match-service}.ts`, `src/providers/fight-provider.tsx`, `src/app/fight.tsx`, `tests/{fight-api,fight-machine,fight-screen,fixture-match-service}` | **done** on lane `lane/choonzm-fightv2-ui/20260904` (backend M5 merged; series `engine` does not exist on CHOONZ `main`, so series is untouched) |
| 7 | **Mechanics-lab revision pin** — CHOONZ M5 flipped `ENGINE_REVISION` to `"2"`, so the lab routes now default to the `scenarios.v2.json` corpus; the client sends no `engine_revision` and silently follows. Decide whether the lab pins `"1"`, offers a selector, or keeps following the server default, and state the revision in the header either way | CHOONZ `docs/mobile-integration.md` §"Engine revision 2 (M5)"; fence `src/lib/{api,types}.ts`, `src/app/lab.tsx`, `tests/lab-screen.test.tsx` | **open** — gate met (M5 merged) |
| 8 | M1 identity (`clubheavy.choonz`), EAS profiles, icons | `app.json`, `eas.json` | **blocked — owner M1** |
| 9 | M2/M3 Apple + Google providers, sign-in scope | Supabase console + `src/providers/auth-*` | **blocked — owner M2/M3** |
| 10 | M-S4 IAP (RevenueCat) | `docs/store-readiness.md` §4 | **blocked — owner M4 / backend P-S4** |

## Done (recent)

| Work | Evidence |
|---|---|
| fight-v2 engine selector + revision-2 HUD reads | lane `lane/choonzm-fightv2-ui/20260904` |
| Engine revision 2 + fight-v2 additive decoders | PR #53, lane `lane/choonzm-rev2-decoders/20260903` |
| C1 per-status account-deletion handling + §3 contract correction | PR #51, lane `lane/choonzm-c1-deletion-close/20260903` |
| npm-audit exception review 2026-09-03 (evidence + re-scoped unsigned owner decision) | PR #52 (`1ca99d2`) |
| M-S3 earnable unlock UI + object-valued error `detail` | PR #50 (`da8d690`) |
| PM baseline: `CLAUDE.md` shim, `AGENTS.md` objects map + protocol, docs map, ADR-0001, plans bridge, M-S3 plan | lane `lane/choonzm-pm-baseline/20260903` |
| Expo SDK 57 patch-version sync | PR #46 (2026-08-29) |
| Docs-surface scaffold + session-archive extraction | PRs #44/#45 (2026-08-29) |
| Skins M-S1 (#34), M-S2 (#35); skins/store design (#32); world-sync reconcile (#41/#43) | 2026-08-16 … 2026-08-28 |

## Pointers

- Groundwork: [docs/groundwork.md](groundwork.md)
- Sequence: [docs/ROADMAP.md](ROADMAP.md) · Bridge: [docs/plans/README.md](plans/README.md)
- Fleet work-state index: [GAP-REGISTER.md](https://github.com/shapeslines/GromCodebase/blob/main/docs/fleet/GAP-REGISTER.md)
