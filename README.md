# CHOONZ-mobile

[![CI](https://github.com/shapeslines/CHOONZ-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/shapeslines/CHOONZ-mobile/actions/workflows/ci.yml)

Mobile client for **CHOONZ** — the fighting-game engine. This first slice is a
read-only Expo Router app for service status, Supabase email/password sign-in,
profile, and the static roster catalog. It consumes the **CHOONZ headless
backend** over its bearer-token API.

> **Status:** Expo SDK 56 bootstrap. No match mutations, OAuth/deep-link provider
> flows, EAS linking, or store submission are included.

## Stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Language       | TypeScript 6.x                                      |
| Runtime        | Expo SDK 56 / React Native 0.85 / React 19          |
| Navigation     | Expo Router file routes in `src/app`                |
| Auth           | Supabase Auth, SecureStore-backed PKCE sessions     |
| Data           | CHOONZ bearer-token API + TanStack Query cache      |
| Validation     | Runtime decoders for every consumed backend shape   |
| Tests          | Vitest; Expo config and web-export checks in CI     |

## Run locally

Node 22+ is required.

```powershell
npm ci
Copy-Item .env.example .env
npm start
```

The committed example starts in `fixtures` mode, so it never calls a live API.
Fixture screens permanently display `FIXTURE DATA — LOCAL`.

To read the live API, set `EXPO_PUBLIC_CHOONZ_MODE=api`, a valid public
`EXPO_PUBLIC_CHOONZ_API_BASE_URL`, and the public Supabase URL/key values below.
Sign in with email/password, then the client sends the Supabase access token as
`Authorization: Bearer <token>` to `/me` and `/catalog*`.

## Public environment contract

Expo inlines every `EXPO_PUBLIC_*` variable into the app bundle. Treat these as
public configuration, not secrets.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_CHOONZ_MODE` | `fixtures` or `api`; dev defaults to `fixtures`. Production missing/invalid modes fail closed. |
| `EXPO_PUBLIC_CHOONZ_API_BASE_URL` | Required for `api` mode; HTTPS in production, or HTTP only on explicit development loopback (`localhost`, `127.0.0.1`, `[::1]`). |
| `EXPO_PUBLIC_SUPABASE_URL` | Shared CHOONZ Supabase URL; follows the same HTTPS/loopback rule. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Preferred public Supabase key; must begin `sb_publishable_`. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Optional legacy fallback only: a decodable JWT whose payload role is exactly `anon`. An invalid primary key never falls back. |

Never put `service_role`, `sb_secret_` keys, database credentials, or other
private values in this app or any `EXPO_PUBLIC_*` variable.

Native sessions use a SecureStore-compatible chunking adapter so large auth
payloads stay within the native storage boundary. Web uses `localStorage` when
available. The Supabase client uses `flowType: 'pkce'`, persistent sessions,
automatic refresh, and `detectSessionInUrl: false`; there is no OAuth or
deep-link provider flow in this slice.

## API boundary

The typed runtime client consumes only these read routes:

- Public: `GET /health`
- Authenticated: `GET /me`, `GET /catalog`, `GET /catalog/engine`,
  `GET /catalog/gels`, `GET /catalog/fighters`, `GET /catalog/stages`, and
  `GET /catalog/kits`

It distinguishes configuration, authentication, network, and malformed/HTTP
response failures. A `401` invalidates the local session and clears cached data.

## Security and release posture

The web export is validation-only in this slice; production web deployment is
deferred. Browser sessions use `localStorage`, so any web deployment requires a
CSP and review proving that no unreviewed third-party scripts can access the
origin. Native protected-query data is cancelled and removed on sign-out, 401,
and other auth-state loss.

Current npm audit findings are treated as a conditional build-chain risk that
collapses to Metro/image-size and Expo config-plugin/uuid advisories. CI must
not accept untrusted binary assets until supported upstream fixes land. Keep the
SDK 56 dependency set; do not force a downgrade merely to silence the audit.
The attributable exception, advisory paths, owner, and expiry are recorded in
[`docs/security/npm-audit-exception.md`](docs/security/npm-audit-exception.md).

## Verify

```powershell
npm test
npm run lint
npm run typecheck
npm run expo:check
npm run expo:doctor
npm run build
```

CI uses Node 22 and runs `npm ci` and every command above on every push and PR.

## Related

- Backend: [`shapeslines/CHOONZ`](https://github.com/shapeslines/CHOONZ) - Python FastAPI headless resource server
- Reference (archived): `shapeslines/TINYTOONZ-Mobile`
- Sibling patterns: `shapeslines/Clubheavy-Mobile`, `shapeslines/Shapeslines-Mobile`
- Colony lane 02 source material: `C:\Users\Carson\Desktop\grokprod2\ingress\02-choonz-fighting-game\`
- Architecture deep-dive: `../System-Architecture/projects/tinytoonz-headless.md` (legacy path; will retitle when CHOONZ rename propagates)
