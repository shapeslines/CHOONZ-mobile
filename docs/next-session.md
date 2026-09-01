# CHOONZ-mobile â€” next session

## State @ draft-reconciliation candidate Â· 2026-08-13

P1, P2 profile/account polish, the developer-only P3 mechanics lab, and the
catalog/fight accessibility announcement slices are on `main`. The 17 retained
drafts #8â€“#25 have been reconciled in one preservation union: already-landed or
superseded rolling changes are retained through ancestry; dated evidence remains
available as historical records; and the four still-live source/test fixes from
#22â€“#25 are applied to current main.

## Verification

- locked clean install: PASS
- Vitest: 59/59
- rendered Jest/RNTL: 33/33
- lint, typecheck, Expo config, Expo Doctor: PASS
- static web export: PASS, eight routes
- every original draft head #8â€“#25: ancestor of the reconciliation candidate

## Active boundaries

- Production EAS build/store submission, Supabase provider changes, and branch
  protection remain owner-only.
- Web export remains validation-only until the documented CSP review and an
  owner-approved report-only rollout are repeated against the intended release.
- The accepted npm audit exception is due for review on **2026-09-10**. Any
  package, lockfile, or CI change requires a fresh dependency review.
- The mechanics lab remains non-production, API-only, and exact-flag gated.

## 2026-08-14 â€” SDK 57 (owner-authorized E2)

Expo 56 â†’ 57.0.13 / RN 0.86.2. Gates green (vitest 59, jest 33, doctor 20/20,
web export 8 routes). `image-size` highs remain: no patched release exists
(`<=2.0.2`, latest 2.0.2). See `docs/security/npm-audit-exception.md`.

## Next

1. Obtain exact-head hosted CI for the reconciliation union and merge it without
   squashing away the preserved draft ancestry.
2. Confirm exact-main CI after landing; all 17 original drafts should then be
   recognized as merged through ancestry.
3. Keep production build, provider, hosting, and store actions closed unless the
   owner opens a specific gate.

## 2026-08-16 — Skins + store-readiness design (merged #32)

Target-state design docs landed on main:

- `docs/skins.md` — render-only rule, token architecture on `src/ui/tokens.ts` (skin = complete resolved token set over the gel base), SkinRegistry, loadout selection, render-boundary inventory, picker UX, fixture mode, M-S1..M-S5 phasing.
- `docs/store-readiness.md` — `app.json`/`eas.json` identity (recommended `com.shapeslines.choonz`), Supabase Apple+Google OAuth with `expo-apple-authentication` (Sign in with Apple designed in), account-deletion flow (`DELETE /me`, typed confirm, per-status handling), RevenueCat IAP pattern + restore/refund, privacy + Nutrition Labels/Data Safety answers, rating posture, metadata/reviewer notes, TestFlight + Play closed testing, owner decisions M1-M6.

Backend companions: CHOONZ `docs/skins.md` + `docs/store-readiness.md` (PR #85) and register D11-D18 (#86). No package, config, credential, provider, EAS, or store changes — design prose only.

## Next

1. Owner sign-off on decisions M1-M6 / D11-D18 before any implementation slice (identity config, provider enablement, IAP timing, privacy hosting).
2. When gated: `app.json`/`eas.json` identity + icons (M1), Supabase Apple/Google enablement (M2/M3), account-deletion UI (C1), then M-S1 gel `ui_theme` skins.

---
## ⚑ Fleet audit flag — 2026-08-18 (tier-0 pass; uncommitted rider)
Full report: `GITHUB-ROOT/_SCRATCH/fleet-audit-2026-08-18/REPORT.md`
- PUBLIC repo: .gitignore covers .env/.env.local/.env.*.local but NOT plain .env.* (e.g. .env.production would be committable) — one-file fix. README status line lags (SDK 56 vs 57).
- Behind 4 docs-only commits — pull.
- Grades A/B/B/B/A/B → B+ · Triage: UNBLOCK-OWNER (M1–M6/D11–D18 sign-offs).
