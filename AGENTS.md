# AGENTS.md — CHOONZ-mobile

## 1. System Affinity & Boundaries
- **Role:** Mobile client for the CHOONZ fighting-game platform (Expo Router + React Native + TypeScript).
- **Owns:** Client combat UX, practice match state transitions, profile/connections UI, offline fixtures mode, scenario lab preview.
- **Delegates:** Backend match authority and simulation to `shapeslines/CHOONZ`; shared design patterns to `Clubheavy-Mobile` and `Shapeslines-Mobile`.
- **Invariants:** Use only `expo-router` imports for app navigation; never add direct `@react-navigation/*` dependencies. Worktree prefix `colony2/choonzm-<slug>`.

## 2. Deterministic Verification Matrix
- `npm ci` — install dependencies
- `npm test` — run Vitest test suite
- `npm run typecheck` — TypeScript type checking
- `npm run lint` — ESLint
- `npm run expo:check` — Expo configuration check
- `npm run expo:doctor` — Expo environment doctor
- `npm run build` — Web validation export build
- Gate Rule: All tests + typecheck + lint must pass before merge.

## 3. Inference Allocation Matrix
- **Deep Inference Focus (Spend Tokens Here):**
  - Combat frame simulation UX, touch hit-box responsiveness, and combat animation choreography.
  - State machine error recovery (network drops during practice matches, token expiration during fight).
  - Fixture vs API mode boundary transitions and fallback caching.
- **Reflex / Low Inference (Deterministic Output):**
  - Standard React Native component layouts, styling wrappers, and screen route declarations.
  - TanStack Query hooks boilerplate and standard TypeScript interfaces.
  - Supabase client auth state wiring.

## 4. Public Environment & Invariant Contracts
- `EXPO_PUBLIC_CHOONZ_MODE=fixtures|api` (defaults to `fixtures`).
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configure public auth.
- Never add service-role keys, private database URLs, or secret credentials to client-accessible bundles.
- Honest-unavailable rule: When disconnected or backend unreachable, show explicit connection status badges rather than blank combat frames or zeroed damage stats.

## 5. Self-Contained Invocation Harness
When delegating tasks on this repo:
1. Specify target slice (e.g. P1 match mutations vs P2 profile/connection flows).
2. Explicit verification command (`npm test` / `npm run typecheck`).
3. Include target mode (`fixtures` vs `api`).

## Related Lanes & Canonical References
- Backend repo: `shapeslines/CHOONZ`
- Architecture reference: `CHOONZ/ARCHITECTURE.md`
- Fleet standard: `GromCodebase/docs/fleet/per-repo-onboarding-envelope-standard-2026-08-17.md`
