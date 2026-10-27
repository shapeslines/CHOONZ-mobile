# CHOONZ-mobile — groundwork

Longer-lived build status. The resume pin is `docs/next-session.md`. Tickets live in `docs/WORK-FRONTLOG.md`. Sequence lives in `docs/ROADMAP.md`. Fleet work-state index is GromCodebase `docs/fleet/GAP-REGISTER.md` (point; do not fork).

## Build status

- **Now:** `main` is at `1ca99d2` — the PM baseline (#48), **M-S3** earnable unlock UI +
  object-valued error `detail` (#50), and the npm-audit review record (#52) all merged 2026-09-03,
  with the C1 deletion-close lane (#51) merging on top, on the Expo SDK 57 / RN 0.86 /
  React 19 review candidate (#46: Vitest 59, rendered Jest 33, lint, typecheck, Expo
  check/doctor, static web export, 8 routes). Local gates stay green against the installed tree,
  but **hosted CI is red on `main`** because its first step is `npm ci` and the committed lockfile
  no longer reifies (see Not yet). Shipped slices: P1 practice-match loop (Toon/loadout, lifecycle, rendered HUD,
  rematch), P2 profile/account polish + connections (#15), P3 gated developer mechanics lab,
  catalog/fight accessibility, skins **M-S1** registry + gel `ui_theme` (#34) and **M-S2** loadout
  queries + themed shell + Skins screen (#35), SDK-57 patch-sync (#46). Fixtures mode serves the
  same decoded contract offline. Backend contracts consumed strictly through runtime decoders.
- **C1 account deletion — shipped with gaps (2026-09-03):** the typed-confirm panel
  (`DELETE MY ACCOUNT`) and `DELETE /me` `{confirm: true}` call were already on `main`; lane
  `c1-deletion-ui-close` added the per-status contract (404 → already deleted, 422 →
  `detail.message`, 403 → first-party denial, network/5xx → keep state + manual retry) and corrected
  `docs/store-readiness.md` §3, which had the wrong body and confirm phrase. **Gaps:** the
  pre-confirm explainer step and `src/app/privacy.tsx` stay unbuilt — both ride on the hosted
  privacy URL, which is owner-gated M5.
- **Not yet:** store identity M1 (`clubheavy.choonz`,
  backend D13), providers M2/M3, IAP M4, privacy URL M5 — all owner-gated; no EAS build, store
  submission, or production web rollout. The npm-audit exception review was **discharged
  2026-09-03**, ahead of its 2026-09-10 date: the audit is now **13 moderate / 0 high / 0
  critical**, both `image-size` highs are retired (the package is absent from the tree and the
  lockfile — Metro moved to `0.84.5`), and one new leaf advisory appeared,
  `decode-uri-component` GHSA-vcc3-ghjq-m6fr via `expo-router -> query-string`. Every fix npm
  offers is a semver-major downgrade (`expo@46.0.21`, `expo-router@5.1.11`) the exception refuses,
  so the re-scoped exception is **unsigned, awaiting owner reapproval** —
  [security/npm-audit-exception.md](security/npm-audit-exception.md) §"Review record — 2026-09-03";
  plan [plans/npm-audit-review-2026-09.md](plans/npm-audit-review-2026-09.md). The same review
  found the committed `package-lock.json` **does not reify under `npm ci`** (EUSAGE: lock's
  `@react-native/js-polyfills@0.86.2` vs the `0.86.3` required by `react-native@0.86.3`), so hosted
  CI is red on `main` and the exception's deployment precondition (a clean `npm ci --omit=dev
  --omit=optional --ignore-scripts`) is currently unprovable. Repairing the lockfile is a package
  change needing its own owner-gated lane — a fresh resolution re-introduces `image-size@1.2.1`.

## Up next

- **Rank 1 — owner** — repair the mobile lockfile drift: the committed lock pins `@react-native/*`
  at 0.86.2 against the `react-native@0.86.3` the manifest requires, so `npm ci` fails, hosted CI on
  `main` is red, and the exception's clean-`npm ci` deployment precondition is unprovable. A fresh
  resolution re-introduces `image-size`, so the re-lock must happen under a fresh dependency review,
  not as an incidental fix.
- **Rank 2 — owner** — sign or reject the re-scoped npm-audit exception (unsigned decision row,
  merged as #52). Once signed, the next review is 2026-10-10 or the next Expo SDK line; any lockfile
  change still needs the review first.
- **Rank 3 — closed** by [plans/c1-deletion-ui-close.md](plans/c1-deletion-ui-close.md) (lane
  `lane/choonzm-c1-deletion-close/20260903`, PR #51). What remains of C1 is owner-gated: the
  explainer step and `src/app/privacy.tsx` wait on the M5 hosted privacy URL.
- **Agent pickup, after the owner rows clear** — the rev-2 mechanics-lab decoder bump when CHOONZ
  engine M4 lands, or M1 identity once the owner decides.

## Conventions settled 2026-09-03

- Entry chain `CLAUDE.md → AGENTS.md → docs/README.md → docs/next-session.md` (ADR-0001, mirrors CHOONZ).
- Plan before code: every claimable slice has a `docs/plans/<id>.md`; branch `lane/choonzm-<id>/<yyyymmdd>`.
- Vault project note is the backend's `20 Projects/tinytoonz/tinytoonz.md` (`Y:\GromBrain`); mailbox stream `choonz-mobile`.
- Error bodies: `detail` may be a string or `{code, message, …}` — decoders must accept both (backend P-S3 403, proposed ARC686 409).

## Pointers

- Resume pin: [docs/next-session.md](next-session.md)
- Sequence: [docs/ROADMAP.md](ROADMAP.md) · Theory→repo bridge: [docs/plans/README.md](plans/README.md)
- Tickets: [docs/WORK-FRONTLOG.md](WORK-FRONTLOG.md) · Docs map: [docs/README.md](README.md)
- ADRs: [docs/decisions/README.md](decisions/README.md) · Skins: [docs/skins.md](skins.md) · Store: [docs/store-readiness.md](store-readiness.md)
- Discovery: [FLEET-INDEX.md](https://github.com/shapeslines/GromCodebase/blob/main/docs/fleet/FLEET-INDEX.md)
