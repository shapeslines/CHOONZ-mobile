# CHOONZ-mobile - agent access (AGENTS.md)

Read first. Mobile client for CHOONZ.

## What this is

Fresh greenfield Expo Router + React Native client for the CHOONZ fighting-game
backend (`shapeslines/CHOONZ`). Scaffolded empty 2026-08-09; first claiming
session runs `npx create-expo-app . --template blank-typescript` and replaces
this seed with the working scaffold.

## Stack

TypeScript / Expo SDK 51+ / React Native / Expo Router / Supabase Auth /
TanStack Query / EAS Build. See `README.md` for the full stack table.

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

## Verification

- Tests: `npm test` (Vitest) once dependencies are installed
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Build: `npx expo prebuild` (native) / `npx expo export` (web)

## Conventions

Follow `shapeslines/Clubheavy-Mobile` and `shapeslines/Shapeslines-Mobile` for
directory layout, hook patterns, and adapter shape.