# CHOONZ-mobile — groundwork

Longer-lived build status. The resume pin is `docs/next-session.md`. Tickets live in `docs/WORK-FRONTLOG.md`. Sequence lives in `docs/ROADMAP.md`. Fleet work-state index is GromCodebase `docs/fleet/GAP-REGISTER.md` (point; do not fork).

## Build status

- **Now:** `main` (PR #46, 2026-08-29) is a green Expo SDK 57 / RN 0.86 / React 19 review
  candidate: Vitest 59, rendered Jest 33, lint, typecheck, Expo check/doctor, static web export
  (8 routes). Shipped slices: P1 practice-match loop (Toon/loadout, lifecycle, rendered HUD,
  rematch), P2 profile/account polish + connections (#15), P3 gated developer mechanics lab,
  catalog/fight accessibility, skins **M-S1** registry + gel `ui_theme` (#34) and **M-S2** loadout
  queries + themed shell + Skins screen (#35), SDK-57 patch-sync (#46). Fixtures mode serves the
  same decoded contract offline. Backend contracts consumed strictly through runtime decoders.
- **Not yet:** **M-S3** earnable unlock UI (backend `POST /me/skins/{id}/unlock` shipped 2026-09-02,
  CHOONZ #125); object-valued error `detail` decoding (the client discards non-2xx bodies today);
  C1 account-deletion UI status unverified against main; store identity M1 (`clubheavy.choonz`,
  backend D13), providers M2/M3, IAP M4, privacy URL M5 — all owner-gated; no EAS build, store
  submission, or production web rollout. npm-audit exception (`image-size` highs) review due
  **2026-09-10**.

## Up next

- **Rank 1 `m-s3-earnable-ui`** — object-valued `detail` on `ChoonzClientError`, strict unlock
  decoders, non-optimistic `unlockSkin`, Unlock / progress UI in `SkinRow`, stateful fixture
  ownership. Plan: [plans/m-s3-earnable-ui.md](plans/m-s3-earnable-ui.md).
- **Rank 2** — npm-audit exception review (due 2026-09-10): re-run `npm audit`, confirm
  `image-size` status, renew or retire the exception; any lockfile change needs the review first.
- **Rank 3** — verify the C1 deletion UI state on main and record it (archive item says
  "then account-deletion UI (C1)"; backend `DELETE /me` shipped 2026-08-16).

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
