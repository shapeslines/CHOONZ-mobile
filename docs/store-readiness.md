# CHOONZ-mobile Store Readiness — Design

> **Status: TARGET-STATE DESIGN.** Companion to `CHOONZ/docs/store-readiness.md`
> (policy map C1–C11, backend account-deletion and IAP-verification design).
> This document designs the mobile-side configuration, auth, flows, and
> submission artifacts for the Apple App Store and Google Play. Store
> accounts, EAS credentials, provider console changes, and any production
> build remain owner-gated.

## 1. Identity and build config

`app.json` today has no `ios`/`android` blocks. Design:

```jsonc
{
  "expo": {
    "name": "CHOONZ",
    "slug": "choonz-mobile",
    "version": "0.1.0",
    "ios": {
      "bundleIdentifier": "com.shapeslines.choonz",   // owner confirms (R4)
      "supportsTablet": false,
      "infoPlist": { /* see §6 privacy */ }
    },
    "android": {
      "package": "com.shapeslines.choonz",            // owner confirms (R4)
      "adaptiveIcon": { /* foreground/background */ }
    },
    "icon": "./assets/icon.png",
    "splash": { /* image + background color */ }
  }
}
```

- `eas.json` with `development` / `preview` / `production` profiles
  (development = dev client, preview = TestFlight/closed track, production =
  store builds). Owner runs the first `eas build` — credentials are
  owner-only.
- App icon: 1024px master → adaptive icon for Android; splash uses the
  default skin's background color.
- **Versioning discipline:** `version` (semver) + `ios.buildNumber` /
  `android.versionCode` bumped per release; store review links each
  submission to a changelog.

## 2. Auth expansion (Supabase + Apple + Google)

Current: Supabase **email+password only** (`signInWithPassword`).

- **Sign in with Apple is designed in from the start** (Apple 4.8: required
  the moment any third-party login is offered). Design:
  - Supabase console: enable **Apple** and **Google** providers (owner-gated;
    Apple needs the Services ID + key from the Apple Developer account).
  - `expo-apple-authentication` for the native Apple flow; Supabase
    `signInWithIdToken` with the Apple identity token.
  - Google: `expo-auth-session`/`expo-web-browser` OAuth or Supabase's
    PKCE flow per SDK-57 best practice.
  - Provider session UX stays the existing `AuthProvider`; only the sign-in
    methods array grows (email / apple / google buttons on the sign-in
    screen, `fixtures` mode keeps its stub).
- **Account linking:** if the same person has email + Apple accounts, Supabase
  identity linking is the rail (design note; exact linking UX owner-decided).

## 3. Account deletion flow (C1)

- **Profile screen** has a "DELETE ACCOUNT" entry (red, destructive,
  first-party only) — **shipped**, `src/app/profile.tsx`.
- **Flow (shipped):** typed confirmation (**`DELETE MY ACCOUNT`** — the exact
  phrase in code, exported as `DELETE_CONFIRM_PHRASE`) → `DELETE /me` with a
  body of **exactly `{confirm: true}`** (the backend's `AccountDeleteRequest`
  takes no subject; the bearer token is the subject) → 204 → sign out (clears
  the SecureStore session) + `queryClient.clear()` → signed-out state.
  The pre-confirm **explainer step** is still unbuilt: it belongs with the
  in-app privacy copy (`src/app/privacy.tsx`, §5), which is **owner-gated on
  M5** (hosted privacy URL).
- **Error handling — shipped** (`classifyDeleteFailure` / `useAccountDeletion`
  in `src/app/profile.tsx`, covered by `tests/profile-screen.test.tsx`):
  401 → session finalize (handled upstream by the API client's
  `onUnauthorized`, never reaches the screen); 403 → first-party/scope denial
  copy; 404 → treat as already deleted → sign out + clear caches exactly like
  success; 422 → show `detail.message` from the server (generic fallback when
  the body carries no detail); network / 5xx → keep the confirm state and show
  a `retry-delete-account` affordance that re-invokes the delete. Deletion is
  never retried automatically.
- **Reviewer discoverability:** the flow must be reachable without a
  purchase and without special steps (both stores check this).
- **Provider side:** backend triggers Supabase user deletion (owner rail
  decision R2 in the backend doc); the client logs out locally regardless of
  provider timing.

## 4. IAP integration (P-S4, owner-gated) — RevenueCat

Estate precedent (Club Heavy): RevenueCat as the store-rail wrapper.

- **Dependencies (when gated):** `react-native-purchases` (Expo config
  plugin), configured per platform with the Apple IAP products and Play
  products the owner registers.
- **Pattern:** purchases flow through RevenueCat; the backend receives
  webhook events and updates `skin_grants` (system of record); the client's
  owned-skins UI reads `GET /me/skins`, never the local RevenueCat state
  alone.
- **Restore:** a "Restore purchases" button calls RevenueCat's restore;
  grants are already backend-recorded (idempotent).
- **Refunds:** Apple/Play refunds arrive as RevenueCat events → backend
  revokes the grant → next `GET /me/skins` hides the skin (no client-side
  revocation logic).

## 5. Privacy (C5)

- **Privacy policy page** in-app (`src/app/privacy.tsx`) rendering static
  copy + a hosted URL (owner hosts on the web property — R3) used in both
  store records.
- **Apple Privacy Nutrition Labels** and **Google Play Data Safety** answers
  come from the backend data inventory (`CHOONZ/docs/store-readiness.md`
  §4): account data (email, display name), game data, no ads, no tracking
  SDKs, no data sold, in-app deletion available. Exact questionnaire answers
  are filled at submission from that inventory.
- **ATT:** not required — no ad SDKs, no attribution, no tracking (C7 N/A;
  documented in the store record notes).

## 6. Metadata, rating, and review (C4/C6/C8)

- **Content rating:** Apple questionnaire (posture 9+ cartoon/fantasy
  violence) and Google IARC (posture 3+); final answers owner-confirmed at
  submission.
- **Store metadata:** name "CHOONZ", subtitle/keywords (e.g., "Fight,
  rematch, customize" / "fighting, pixel, 1v1, tournament"), description
  with the deterministic-replay pitch, screenshots per store (iPhone +
  Android sizes), feature graphic for Play.
- **Reviewer notes:** demo account credentials (email/password), where
  account deletion lives, no-purchase path, no IAP test needed (C3 pending
  P-S4), no user-generated content (C9 N/A).
- **Beta path:** TestFlight (internal → external group) + Play closed
  testing track; both fed by `eas build --profile preview`.

## 7. What this design does NOT do

- No EAS build, credentials, store accounts, App Store Connect / Play
  Console records, RevenueCat project, or provider-console enablement
  (owner-gated).
- No ads/tracking SDKs, no ATT prompt, no NFTs/crypto, no external payment
  links for digital goods.

## 8. Open decisions (owner)

| # | Decision | Recommendation |
| --- | --- | --- |
| M1 | Bundle id / package | `com.shapeslines.choonz` both platforms (backend R4) |
| M2 | Provider enablement order | Apple first (mandate), then Google; owner runs console changes |
| M3 | Sign-in screen scope | Email + Apple + Google in the first store build |
| M4 | IAP timing | Store launch without IAP (skins P-S4 gated later) — recommended |
| M5 | Privacy policy URL | Hosted on the web property; owner publishes |
| M6 | First release scope | No purchases, no character/scene skins; gel `ui_theme` skins only |

## Revision history

- 2026-08-16 · authored · opencode/deepseek-v4-flash · target-state design.
