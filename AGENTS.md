# CHOONZ-mobile - agent access (AGENTS.md)

Read first. Mobile client for CHOONZ.

## What this is

Expo Router + React Native client for the CHOONZ fighting-game backend
(`shapeslines/CHOONZ`). The first shipped slice is intentionally read-only:
service status, authenticated identity, and the static combat catalog.

## Stack

TypeScript / Expo SDK 56 / React Native 0.85 / React 19 / Expo Router /
Supabase Auth / TanStack Query. Node 22+ is required. Routes live in `src/app`.
Use only `expo-router` imports for app navigation; do not add direct
`@react-navigation/*` app imports or dependencies.

## Repository rules

- **Branch+PR only** off `origin/main`; no direct commits to main.
- **Worktree discipline**: `git worktree add .worktrees/<claim-id> origin/main -b colony2/choonzm-<slug>`. Never commit into the shared main checkout.
- **CI**: workflows under `.github/workflows/`. PR turns green before merge.
- **Colony branch prefix**: `colony2/choonzm-<slug>`.
- **Backend dependency**: changes to CHOONZ backend API contract require a paired PR here.

## Owner-gated (never auto-apply)

- Production EAS Build / Store submission
- Auth provider swap (Supabase project config)
- Branch-protection rule changes
- Force-push to any branch

## Related lanes

- Catalogue ingress material: `C:\Users\Carson\Desktop\grokprod2\ingress\02-choonz-fighting-game\`
- Backend repo: `shapeslines/CHOONZ`
- Architecture reference: CHOONZ/ARCHITECTURE.md (cross-repo)
- World-instantiation plan: `C:\Users\Carson\Desktop\PROCESSING\2026-08-09-world-instantiation-plan.md`

## Public environment contract

- `EXPO_PUBLIC_CHOONZ_MODE=fixtures|api`; development defaults to `fixtures`.
  A production build with a missing or invalid mode, or API mode without a valid
  API base URL, fails closed at the client boundary.
- `EXPO_PUBLIC_CHOONZ_API_BASE_URL` is required only for `api` mode.
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configure
  Supabase Auth. `EXPO_PUBLIC_SUPABASE_ANON_KEY` is a legacy fallback only.
- `EXPO_PUBLIC_*` values are visible in a shipped app. Never add a service-role,
  secret key, database URL/password, or any private value to this project.

## Verification

- Install: `npm ci`
- Tests: `npm test` (Vitest)
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Expo config: `npm run expo:check`
- Web build: `npm run build`

## Conventions

Follow `shapeslines/Clubheavy-Mobile` and `shapeslines/Shapeslines-Mobile` for
directory layout, hook patterns, and adapter shape.

This repository does not own match mutations, OAuth/provider deep-link flows,
EAS linking, or store submission in the current slice.
