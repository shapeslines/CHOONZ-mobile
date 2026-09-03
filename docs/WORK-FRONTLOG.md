# CHOONZ-mobile — WORK-FRONTLOG

Granular tickets for this repo. Immediate handoff is `docs/next-session.md`. Fleet flagged work lives in GromCodebase `docs/fleet/GAP-REGISTER.md` — **point there**, never fork a second register.

Claim protocol: pick the highest-ranked `open` row whose gate is met, write your seat + branch in the
State cell, create the branch named in the plan, post the mailbox `start` frame (stream
`choonz-mobile`) with every fenced path. Rows sharing `src/lib/api.ts` / `decoder.ts` / `types.ts`
are serial. Owner-blocked rows are never claimed by an agent.

| Rank | Work | Evidence / fence | State |
|---:|---|---|---|
| 1 | **`m-s3-earnable-ui`** — `ApiErrorDetail` on `ChoonzClientError`, unlock decoders, `unlockSkin` mutation, `SkinRow` unlock/progress UI, stateful fixture ownership | [plans/m-s3-earnable-ui.md](plans/m-s3-earnable-ui.md); fence `src/lib/{errors,api,decoder,types,fixtures,fixture-match-service}.ts`, `src/providers/skin-provider.tsx`, `src/app/skins.tsx`, `tests/{api,skins}.test.ts`, `tests/skins-screen.test.tsx`, `docs/skins.md` | **landed** — merged to `main` as `da8d690` (PR #50) |
| 2 | npm-audit exception review (was due 2026-09-10) — re-audited 2026-09-03: **13 moderate / 0 high / 0 critical**; both `image-size` highs retired (package absent from tree and lock); new leaf `decode-uri-component` GHSA-vcc3-ghjq-m6fr | [plans/npm-audit-review-2026-09.md](plans/npm-audit-review-2026-09.md); [security/npm-audit-exception.md](security/npm-audit-exception.md) §"Review record — 2026-09-03"; docs-only fence, no manifest change | **done on lane — awaiting owner reapproval** `lane/choonzm-npm-audit-review/20260903` |
| 3 | C1 deletion UI status check against main; record in groundwork | `src/app/profile.tsx`, `docs/store-readiness.md` §3 | open — verify first |
| 4 | Decode bot-orchestration 409 `{detail:{code, message, receipt?}}` | `src/lib/decoder.ts`, fight screens | blocked — CHOONZ `G-P2-MUTATE` |
| 5 | Fight-v2 additive `read_state_full` fields | `src/lib/decoder.ts`, `src/lib/types.ts`, fight HUD | blocked — CHOONZ engine M5 |
| 6 | M1 identity (`clubheavy.choonz`), EAS profiles, icons | `app.json`, `eas.json` | **blocked — owner M1** |
| 7 | M2/M3 Apple + Google providers, sign-in scope | Supabase console + `src/providers/auth-*` | **blocked — owner M2/M3** |
| 8 | M-S4 IAP (RevenueCat) | `docs/store-readiness.md` §4 | **blocked — owner M4 / backend P-S4** |

## Done (recent)

| Work | Evidence |
|---|---|
| npm-audit exception review 2026-09-03 (evidence + re-scoped unsigned owner decision) | lane `lane/choonzm-npm-audit-review/20260903` |
| M-S3 earnable unlock UI + object-valued error `detail` | PR #50 (`da8d690`) |
| PM baseline: `CLAUDE.md` shim, `AGENTS.md` objects map + protocol, docs map, ADR-0001, plans bridge, M-S3 plan | lane `lane/choonzm-pm-baseline/20260903` |
| Expo SDK 57 patch-version sync | PR #46 (2026-08-29) |
| Docs-surface scaffold + session-archive extraction | PRs #44/#45 (2026-08-29) |
| Skins M-S1 (#34), M-S2 (#35); skins/store design (#32); world-sync reconcile (#41/#43) | 2026-08-16 … 2026-08-28 |

## Pointers

- Groundwork: [docs/groundwork.md](groundwork.md)
- Sequence: [docs/ROADMAP.md](ROADMAP.md) · Bridge: [docs/plans/README.md](plans/README.md)
- Fleet work-state index: [GAP-REGISTER.md](https://github.com/shapeslines/GromCodebase/blob/main/docs/fleet/GAP-REGISTER.md)
