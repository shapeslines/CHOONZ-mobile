# CHOONZ-mobile — groundwork

Longer-lived build status. The resume pin is `docs/next-session.md`. Tickets live in `docs/WORK-FRONTLOG.md`. Sequence lives in `docs/ROADMAP.md`. Fleet work-state index is GromCodebase `docs/fleet/GAP-REGISTER.md` (point; do not fork).

## Build status

- **Now:** `main` is at `da8d690` — the PM baseline (#48) and **M-S3** earnable unlock UI +
  object-valued error `detail` (#50) both merged 2026-09-03 on top of the Expo SDK 57 / RN 0.86 /
  React 19 review candidate (#46: Vitest 59, rendered Jest 33, lint, typecheck, Expo
  check/doctor, static web export, 8 routes). Local gates stay green against the installed tree,
  but **hosted CI is red on `main`** because its first step is `npm ci` and the committed lockfile
  no longer reifies (see Not yet). Shipped slices: P1 practice-match loop (Toon/loadout, lifecycle, rendered HUD,
  rematch), P2 profile/account polish + connections (#15), P3 gated developer mechanics lab,
  catalog/fight accessibility, skins **M-S1** registry + gel `ui_theme` (#34) and **M-S2** loadout
  queries + themed shell + Skins screen (#35), SDK-57 patch-sync (#46). Fixtures mode serves the
  same decoded contract offline. Backend contracts consumed strictly through runtime decoders.
- **Not yet:** C1 account-deletion UI status unverified against main; store identity M1 (`clubheavy.choonz`,
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

- **Rank 3** — verify the C1 deletion UI state on main and record it (archive item says
  "then account-deletion UI (C1)"; backend `DELETE /me` shipped 2026-08-16). This is the top open
  build row now that M-S3 (#50) and the PM baseline (#48) are merged.
- **Owner** — sign or reject the re-scoped npm-audit exception (rank 2, unsigned decision row), and
  rule on the lockfile-reify repair lane that CI redness depends on.
- **Rank 2 follow-on** — once signed, the next review is 2026-10-10 or the next Expo SDK line;
  any lockfile change still needs the review first.

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
