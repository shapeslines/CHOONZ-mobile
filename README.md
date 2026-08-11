# CHOONZ-mobile

[![CI](https://github.com/shapeslines/CHOONZ-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/shapeslines/CHOONZ-mobile/actions/workflows/ci.yml)

Mobile client for **CHOONZ** — the fighting-game engine. This review-only Expo
Router slice includes service status, Supabase email/password sign-in, profile,
the static roster catalog, and one constrained P1 practice-match loop. It
consumes the **CHOONZ headless backend** over its bearer-token API.

> **Status:** Expo SDK 56 review candidate. The Fight route supports only the
> frozen P1 Toon/loadout and match lifecycle controls; OAuth/deep-link provider
> flows, EAS linking, store submission, and P2/P3 work are excluded.

## Stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Language       | TypeScript 6.x                                      |
| Runtime        | Expo SDK 56 / React Native 0.85 / React 19          |
| Navigation     | Expo Router file routes in `src/app`                |
| Auth           | Supabase Auth, SecureStore-backed PKCE sessions     |
| Data           | CHOONZ bearer-token API + TanStack Query cache      |
| Validation     | Runtime decoders for every consumed backend shape   |
| Tests          | Vitest + isolated Jest/RNTL rendered Fight states   |

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
`Authorization: Bearer <token>` to `/me`, `/catalog*`, and the scoped P1 fight
routes. Fixture mode never reads a token, contacts a live URL, or claims engine
mechanics parity.

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

The typed runtime client decodes these bootstrap reads:

- Public: `GET /health`
- Authenticated: `GET /me`, `GET /catalog`, `GET /catalog/engine`,
  `GET /catalog/gels`, `GET /catalog/fighters`, `GET /catalog/stages`, and
  `GET /catalog/kits`

It distinguishes configuration, authentication, network, and malformed/HTTP
response failures. A `401` invalidates the local session and clears cached data.

The review-only Fight route additionally uses the frozen P1 contract: list/create
Toons and loadouts, create/read a match, start/pause/resume/complete/cancel,
active-only P1 light/heavy/special/block/tick, HUD state reads, and completed
rematch. Query cache snapshots remain authoritative: the local workflow stores
only selection, a pending command, and a recoverable error. It never predicts
status, result, cursor, HP, meter, or HUD data.

## Security and release posture

The web export is validation-only in this slice; production web deployment is
deferred. Browser sessions use `localStorage`, so any web deployment requires a
CSP and review proving that no unreviewed third-party scripts can access the
origin. Native protected-query data is cancelled and removed on sign-out, 401,
and other auth-state loss.

Current npm audit findings are treated as a review-only build-chain risk. The
time-bounded record covers the existing Metro/image-size and Expo
config-plugin/uuid advisories plus the dev-test RNTL-to-React-Native aggregate.
CI must not accept untrusted binary assets until compatible upstream fixes land.
Keep the SDK 56 dependency set; do not force a downgrade merely to silence the
audit. The exact advisory paths, compensating controls, owner, and expiry are
recorded in [`docs/security/npm-audit-exception.md`](docs/security/npm-audit-exception.md).

## Verify

```powershell
npm test
npm run test:screen
npm run lint
npm run typecheck
npm run expo:check
npm run expo:doctor
npm run build
```

CI uses Node 22 and runs `npm ci`, Vitest, the isolated rendered-screen Jest
suite, and every command above on every push and PR.

## Related

- Backend: [`shapeslines/CHOONZ`](https://github.com/shapeslines/CHOONZ) - Python FastAPI headless resource server
- Reference (archived): `shapeslines/TINYTOONZ-Mobile`
- Sibling patterns: `shapeslines/Clubheavy-Mobile`, `shapeslines/Shapeslines-Mobile`
- Colony lane 02 source material: `C:\Users\Carson\Desktop\grokprod2\ingress\02-choonz-fighting-game\`
- Architecture deep-dive: `../System-Architecture/projects/tinytoonz-headless.md` (legacy path; will retitle when CHOONZ rename propagates)
