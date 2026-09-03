# CHOONZ-mobile — groundwork

Longer-lived build status. The resume pin is `docs/next-session.md`. Tickets live in `docs/WORK-FRONTLOG.md`. Sequence lives in `docs/ROADMAP.md`. Fleet work-state index is GromCodebase `docs/fleet/GAP-REGISTER.md` (point; do not fork).

## Build status

- **Now:** `main` (PR #46, 2026-08-29) is a green Expo SDK 57 / RN 0.86 / React 19 review
  candidate: Vitest 59, rendered Jest 33, lint, typecheck, Expo check/doctor, static web export
  (8 routes). **M-S3** earnable unlock UI + object-valued error `detail` built 2026-09-03 (lane, PR pending). Shipped slices: P1 practice-match loop (Toon/loadout, lifecycle, rendered HUD,
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
  submission, or production web rollout. npm-audit exception (`image-size` highs) review due
  **2026-09-10**.

## Up next

- **Owner merge** of the PM-baseline PR and the M-S3 PR; then the npm-audit review is the top
  open row. Plan record: [plans/m-s3-earnable-ui.md](plans/m-s3-earnable-ui.md).
- **Rank 2** — npm-audit exception review (due 2026-09-10): re-run `npm audit`, confirm
  `image-size` status, renew or retire the exception; any lockfile change needs the review first.
- **Rank 3 — closed** by [plans/c1-deletion-ui-close.md](plans/c1-deletion-ui-close.md) (lane
  `lane/choonzm-c1-deletion-close/20260903`, PR pending). What remains of C1 is owner-gated: the
  explainer step and `src/app/privacy.tsx` wait on the M5 hosted privacy URL.

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
