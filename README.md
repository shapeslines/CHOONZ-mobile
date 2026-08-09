# CHOONZ-mobile

[![CI](https://github.com/shapeslines/CHOONZ-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/shapeslines/CHOONZ-mobile/actions/workflows/ci.yml)

Mobile client for **CHOONZ** - the fighting-game engine. Built with **Expo Router + React Native**, consuming the **CHOONZ headless backend** (`shapeslines/CHOONZ`, Python FastAPI + Mangum + Neon Postgres + Serverless) over its bearer-token API.

> **Status:** fresh greenfield, scaffolded 2026-08-09. Archived `shapeslines/TINYTOONZ-Mobile` is reference-only - NOT the base. First claiming session runs `npx create-expo-app . --template blank-typescript` to materialize the Expo structure on top of this seed.

## Stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Language       | TypeScript 5.x                                      |
| Runtime        | Expo SDK 51+ / React Native 0.74+                   |
| Navigation     | Expo Router (file-based)                            |
| Auth           | Supabase Auth (managed OIDC bearer; matches CHOONZ) |
| Data           | CHOONZ bearer-token API + TanStack Query cache      |
| State          | URL + server cache first; Zustand only if needed    |
| Deploy         | EAS Build + Expo Updates                            |

## House patterns (target)

- **bff-boundary** - CHOONZ is the resource server half; this repo is the BFF client. No short-lived tokens in async storage; session via SecureStore.
- **supabase-house-standard** - share the CHOONZ Supabase project's Auth (DATA-1 / AUTH-1 aligned).
- **custody-visibility-audit** - all data is owner-scoped via the CHOONZ bearer; this client never owns truth.

## Related

- Backend: [`shapeslines/CHOONZ`](https://github.com/shapeslines/CHOONZ) - Python FastAPI headless resource server
- Reference (archived): `shapeslines/TINYTOONZ-Mobile`
- Sibling patterns: `shapeslines/Clubheavy-Mobile`, `shapeslines/Shapeslines-Mobile`
- Colony lane 02 source material: `C:\Users\Carson\Desktop\grokprod2\ingress\02-choonz-fighting-game\`
- Architecture deep-dive: `../System-Architecture/projects/tinytoonz-headless.md` (legacy path; will retitle when CHOONZ rename propagates)