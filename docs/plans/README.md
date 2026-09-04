# docs/plans — the contract → repo bridge

CHOONZ-mobile's roadmap is derived, not authored: it follows backend contracts (CHOONZ
`docs/mobile-integration.md`, `docs/skins.md` P-S1..P-S5, `docs/store-readiness.md` R1–R7,
`docs/headless-architecture.md` D1–D19), the vault ARC corpus for the mobile rows of ARC 674/677
(`Y:\GromBrain\20 Projects\_arcs\`), and this repo's own `docs/skins.md` (M-S1..M-S5) and
`docs/store-readiness.md` (M1–M6). `docs/ROADMAP.md` holds the Now/Next/Later sequence. This
folder is where each of those becomes one **claimable, fenced plan**.

## The bridge

| Theory / contract source | ROADMAP item | Repo plan | Write fence | Gate | Status |
|---|---|---|---|---|---|
| ARC 677 P1 playable match loop (mobile half) | (landed) | — | fight screens, `fight-machine.ts` | G-P1-MERGE | ✅ PR #4 |
| ARC 677 P2 profile/account polish S1–S5 (mobile) | (landed) | — | profile, connections, `api.ts` | G-P2-ENTRY | ✅ PR #15 |
| ARC 677 P3 mechanics lab preview | (landed) | — | `src/app/lab.tsx` | flag-gated | ✅ |
| Backend P-S1 catalog → **M-S1** | (landed) | — | `src/lib/skins.ts`, decoders | — | ✅ #34 |
| Backend P-S2 selection → **M-S2** | (landed) | — | `SkinProvider`, `src/app/skins.tsx` | — | ✅ #35 |
| **Backend P-S3 unlock (CHOONZ #125) → M-S3 + object `detail`** | Now | [m-s3-earnable-ui.md](m-s3-earnable-ui.md) | `src/lib/{errors,api,decoder,types,fixtures,fixture-match-service}.ts`, `skin-provider.tsx`, `skins.tsx`, tests | none | ✅ #50 |
| Lockfile reify failure found by the 2026-09 audit review | Now | (owner; fresh dependency review) | `package.json`, `package-lock.json` | owner | **blocked — rank 1** |
| `security/npm-audit-exception.md` review clause | Now | [npm-audit-review-2026-09.md](npm-audit-review-2026-09.md) | docs-only (no manifest change) | time (was 2026-09-10) | **done (#52) — awaiting owner reapproval**, rank 2 |
| Backend C1 `DELETE /me` → per-status deletion UI | Now | [c1-deletion-ui-close.md](c1-deletion-ui-close.md) | `src/app/profile.tsx`, `tests/{profile-screen.test.tsx,api.test.ts}`, `docs/store-readiness.md` | none | **done (#51)** — rank 3 (explainer + `privacy.tsx` owner-gated M5) |
| Backend ARC686 P2 409 shape (D-P2-3) | Next | (after `G-P2-MUTATE`) | decoders, fight screens | backend gate | blocked |
| **Backend ADR-0003 engine revision 2 (CHOONZ #135 M4) → decoders** | Now | [rev2-decoders.md](rev2-decoders.md) | `src/lib/{decoder,types}.ts`, `tests/{api,fight-api}.test.ts`, `tests/lab-screen.test.tsx` | none (M4 merged) | **done — rank 5** |
| Engine revision 2 fight-v2 **HUD rendering** (`state`, `legal_actions`, `move_costs`, `boxes`) | Next | (after CHOONZ M5) | fight screens | backend gate | blocked |
| D13 / M1 store identity `clubheavy.choonz`, EAS profiles | Next | (owner) | `app.json`, `eas.json` | owner M1 | blocked |
| D14 / M2–M3 providers | Next | (owner) | Supabase console, auth providers | owner | blocked |
| P-S4 / M-S4 IAP; P-S5 / M-S5 assets | Later | — | RevenueCat, asset renderers | owner / Club Antics | blocked |
| D18 beta, M5 privacy URL, CSP web rollout | Later | — | EAS, web export | owner | blocked |

## What a plan file contains

1. **Goal** — one paragraph, observable.
2. **Spec sources** — the exact backend contract sections, ADRs, and design docs it implements. The
   plan restates the contract; it never re-derives it.
3. **Write fence** — exact repo paths this lane may create or edit.
4. **Out of scope** — what the lane must not touch even if convenient (lockfile, providers, EAS).
5. **Slice ledger** — ordered checkboxes; each slice ends green and committed.
6. **Acceptance** — the exact npm scripts that must pass, plus the fixtures-mode proof.
7. **Held questions** — open design values with the default assumption the lane proceeds under.
8. **Branch / PR** — names, so two seats cannot collide.

## Claim protocol

1. Pick the highest-ranked open row in `../WORK-FRONTLOG.md` whose gate is met.
2. Write your seat and branch in that row's State cell; post the mailbox `start` frame on
   `choonz-mobile` with every fenced path as `--ref repo:choonz-mobile/<path>`.
3. Branch `lane/choonzm-<id>/<yyyymmdd>` from green `main`.
4. Record baseline evidence (`npm test`, `npm run test:screen`, typecheck, lint) before the first edit.
5. Build slice by slice; PR against `main`; the plan's ledger carries the evidence; the ROADMAP and
   frontlog flip on merge; the shared vault note's projection fields are patched at wrap.
