# AGENTS.md — CHOONZ-mobile

`CLAUDE.md` is a shim to this file. Read `README.md` first; the docs map is `docs/README.md`.

## 1. System Affinity & Boundaries
- **Role:** Mobile client for the CHOONZ fighting-game platform (Expo Router + React Native + TypeScript).
- **Owns:** Client combat UX, practice match state transitions, profile/connections UI, offline fixtures mode, scenario lab preview, skins picker and (M-S3) earnable unlock UX.
- **Delegates:** Backend match authority, simulation, entitlement verification, and the skins catalog to `shapeslines/CHOONZ`; shared design patterns to `Clubheavy-Mobile` and `Shapeslines-Mobile`.
- **Is not:** the fighting engine (that is CHOONZ `app/engine/`, ADR-0003 there), the MoBA (`CHOONZ-MoBA` is a separate C++/Vulkan repo), or a renderer authority (Club Antics owns assets).
- **Invariants:** Use only `expo-router` imports for app navigation; never add direct `@react-navigation/*` dependencies. Client is never the authority: it must not invent a match status, cursor, HUD, result, entitlement, or unlock. Honest-unavailable rule (§4). No package, lockfile, or CI change without a fresh dependency review while the npm-audit exception (review due 2026-09-10) stands.
- **Branches:** `lane/choonzm-<id>/<yyyymmdd>` (the earlier `colony2/choonzm-<slug>` prefix is historical); PR-only merge; production build, providers, stores, and branch protection are owner-only.

## 2. Deterministic Verification Matrix
- `npm ci` — install dependencies
- `npm test` — Vitest (`tests/**/*.test.ts`, node env)
- `npm run test:screen` — Jest + jest-expo + RNTL rendered screens (`tests/*.test.tsx`)
- `npm run typecheck` — TypeScript type checking
- `npm run lint` — ESLint, zero warnings
- `npm run expo:check` · `npm run expo:doctor` — Expo configuration / environment
- `npm run build` — static web export (validation only)
- Docs shape: `python <GromCodebase>/tools/docs-surface-lint.py --repo . --require-presence --allowlist <GromCodebase>/docs/fleet/docs-surface-allowlist.json`
- Gate Rule: all of the above green before merge (hosted CI runs the same matrix on `main`).

## 3. Inference Allocation Matrix
- **Deep Inference Focus (Spend Tokens Here):**
  - Combat frame simulation UX, touch hit-box responsiveness, and combat animation choreography.
  - State machine error recovery (network drops during practice matches, token expiration during fight).
  - Fixture vs API mode boundary transitions and fallback caching.
  - Fail-closed decoding of every backend shape (including object-valued error `detail`).
- **Reflex / Low Inference (Deterministic Output):**
  - Standard React Native component layouts, styling wrappers, and screen route declarations.
  - TanStack Query hooks boilerplate and standard TypeScript interfaces.
  - Supabase client auth state wiring.

## 4. Public Environment & Invariant Contracts
- `EXPO_PUBLIC_CHOONZ_MODE=fixtures|api` (defaults to `fixtures`).
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configure public auth.
- Never add service-role keys, private database URLs, or secret credentials to client-accessible bundles.
- Honest-unavailable rule: When disconnected or backend unreachable, show explicit connection status badges rather than blank combat frames or zeroed damage stats.

## 5. Objects map (what the nouns are and where they live)

| Object | Lives in | Contract |
| --- | --- | --- |
| `ChoonzApiClient` + `fromMode` / `fromFightMode` / `fromMechanicsMode`, `request()` | `src/lib/api.ts` | CHOONZ `docs/mobile-integration.md`; `README.md` "API boundary" |
| `ChoonzClientError {kind, status, detail?}`, `ResponseDecodeError`, `errorMessage` | `src/lib/errors.ts` | `ClientFailureKind = configuration \| authentication \| network \| response` |
| Runtime decoders (strict, fail-closed) and the consumed types | `src/lib/decoder.ts`, `src/lib/types.ts` | one decoder per backend shape; unknown shape → `ResponseDecodeError` |
| Fight workflow FSM (`FightPhase`, `FightCommand`, `legalCommands`) — **not** combat | `src/lib/fight-machine.ts` | backend `Match.status` is the authority |
| Skins registry (`isOwned`, `resolveThemeTokens`, `skinsByKind`), `SkinProvider` (catalog, loadout, `selectSkin`, M-S3 `unlockSkin`) | `src/lib/skins.ts`, `src/providers/skin-provider.tsx` | `docs/skins.md` |
| Protected query keys / scope (`protectedQueryKey`, `mySkinsQueryKey`, `clearProtectedQueries`) | `src/lib/protected-queries.ts` | TanStack Query v5 |
| Fixtures (catalog, loadout, profile, matches) + `FixtureMatchService` | `src/lib/fixtures.ts`, `src/lib/fixture-match-service.ts` | same decoded contract as API mode |
| Screens (`fight`, `skins`, `profile`, `connections`, `catalog`, `lab`, `home`) | `src/app/*.tsx` | expo-router file routes |
| Shell + themed primitives (`AppScreen`, `Panel`, `PanelTitle`, `BodyText`), tokens | `src/ui/app-screen.tsx`, `src/ui/tokens.ts` | `docs/skins.md` §2 token architecture |
| Providers (auth, query client, skins) | `src/providers/*.tsx` | mounted by `app-providers.tsx` |

## 6. Session protocol
- **START:** vault project note frontmatter (`Y:\GromBrain\20 Projects\tinytoonz\tinytoonz.md` — shared with the backend) → `docs/next-session.md` (trust its FIRST action only if `python <GromCodebase>/tools/next-session-audit.py --checkout .` says CURRENT; otherwise `git log`) → `docs/groundwork.md` Now / Up next → claim one row of `docs/WORK-FRONTLOG.md` and its plan under `docs/plans/`. Mailbox: inbox → status → posture → start (stream `choonz-mobile`).
- **DURING:** one slice = one `docs/plans/<id>.md` (fence, gate, slice ledger) on `lane/choonzm-<id>/<yyyymmdd>`; specify target mode (`fixtures` vs `api`) and the verification command in every delegation.
- **END:** `/wrap`. Replace (never append) `docs/next-session.md` in the ADR-0025 shape, ≤40 lines, no shas or 8-digit dates in its top 20 lines; run the docs lint; raise propagation markers in `docs/custodian-queue.md`; patch the vault note's projection fields; post the mailbox wrap with commit + PR + next pickup.

## Related Lanes & Canonical References
- Docs map: `docs/README.md` · Resume pin: `docs/next-session.md` · Build status: `docs/groundwork.md`
- Tickets: `docs/WORK-FRONTLOG.md` · Sequence: `docs/ROADMAP.md` · Theory→repo bridge: `docs/plans/README.md`
- ADRs: `docs/decisions/README.md` · Skins: `docs/skins.md` · Store: `docs/store-readiness.md`
- Backend repo: `shapeslines/CHOONZ` (contract: `docs/mobile-integration.md`; engine: `docs/engine-seam.md`)
- Architecture reference: `CHOONZ/ARCHITECTURE.md`
- Fleet standard: `GromCodebase/docs/fleet/per-repo-onboarding-envelope-standard-2026-08-17.md`; discovery `docs/fleet/FLEET-INDEX.md` — never fork GAP-REGISTER or FLEET-INDEX here.
