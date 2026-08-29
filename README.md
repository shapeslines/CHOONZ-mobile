> **FLEET STATUS · ALIVE** (2026-08-17) — fighting-game mobile client (Expo) — PUBLIC. Authority: [FLEET-MAP](https://github.com/shapeslines/GromCodebase/blob/main/docs/fleet/FLEET-MAP.md) · decision: vault 2026-08-17 provenance ratification.

# CHOONZ-mobile

[![CI](https://github.com/shapeslines/CHOONZ-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/shapeslines/CHOONZ-mobile/actions/workflows/ci.yml)

Mobile client for **CHOONZ** — the fighting-game engine. This review-only Expo
Router slice includes service status, Supabase email/password sign-in, profile,
the static roster catalog, and one constrained P1 practice-match loop. It
consumes the **CHOONZ headless backend** over its bearer-token API.

> **Status:** Expo SDK 57 review candidate. The Fight route supports the frozen
> P1 Toon/loadout and match lifecycle controls; P2 adds bounded profile and
> connection management; and P3 adds only the gated developer mechanics lab.
> OAuth/deep-link provider flows, EAS linking, store submission, bots, training,
> tutorials, and production web deployment remain excluded.

## Stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Language       | TypeScript 6.x                                      |
| Runtime        | Expo SDK 57 / React Native 0.86 / React 19          |
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
| `EXPO_PUBLIC_CHOONZ_ENABLE_MECHANICS_LAB` | Developer-only mechanics lab gate; see below. |

Never put `service_role`, `sb_secret_` keys, database credentials, or other
private values in this app or any `EXPO_PUBLIC_*` variable.

## Mechanics lab (developer-only)

The hidden `/lab` route replays the backend's immutable versioned scenario
corpus. It is a developer proving surface, never a player feature: no bots,
training, or tutorials are included, and it never persists anything.

Eligibility resolves true only when **all** of these hold:

| Condition | Required value |
| --- | --- |
| Public flag | `EXPO_PUBLIC_CHOONZ_ENABLE_MECHANICS_LAB` exactly `true` (case-insensitive) |
| Runtime | Non-production (`NODE_ENV`/`__DEV__` development build) |
| Mode | Valid `api` (`fixtures`/`invalid` never become eligible) |

Truth table:

| Flag | Runtime | Mode | `mechanicsLabEnabled` | Lab behavior |
| --- | --- | --- | --- | --- |
| `true` | dev | `api` | `true` | Authenticated replay UI |
| `true` | dev | `fixtures` | `false` | Visible `API mode required`; zero token/URL/fetch/replay observation |
| `true` | production | `api` | `false` | Fail-closed message; no controls |
| anything else | any | any | `false` | Fail-closed message; no controls |

The lab is API-only: there is no fixture corpus and no simulated replay.
Unsupported corpus schema or engine revisions are rejected by the strict
decoders before any control renders. The UI renders only server receipts —
normalized inputs, actual/expected checkpoints, returned sorted diffs, and the
server verdict (`pass` / `fail` / `not_applicable`) — without recomputing a
golden, reordering diffs, or inferring a verdict. Any override, even one
identical to the canonical value, is visibly `not_applicable`.

Production web deployment of this slice remains deferred; the lab flag must
never be enabled in a production build.

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

The authenticated account slice additionally supports `PATCH /me`,
`GET /me/connections`, and URL-safe `DELETE /me/connections/{client_id}`.
Fixture-mode profile changes and connection revocations stay local and never
read a bearer token or contact a live URL.

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
Keep the SDK 57 dependency set; do not force a downgrade merely to silence the
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

Discovery map: [FLEET-INDEX.md](https://github.com/shapeslines/GromCodebase/blob/main/docs/fleet/FLEET-INDEX.md) (question → surface → one move). Do not fork GAP-REGISTER or FLEET-INDEX in this repo.
