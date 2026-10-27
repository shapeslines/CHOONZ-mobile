---
type: repo-noticeboard
id: noticeboard-choonz-mobile
status: active-draft
owner_seat: unassigned
effect_authority: none
repo: shapeslines/CHOONZ-mobile
fleet_status: ALIVE
related:
  - GromCodebase docs/fleet/FLEET-MAP.md row CHOONZ-mobile
  - docs/next-session.md
---

# Noticeboard — CHOONZ-mobile

> Derived routing surface for agents and owners. **Does not** mint OGIP rows, rewrite receipts, grant gates,
> or queue work — execution authority remains this repo's `AGENTS.md`, its lane owners, and the estate queues.

## Quick info

| | |
| --- | --- |
| Role | Mobile client for the CHOONZ fighting-game platform (Expo Router + React Native + TypeScript) — combat UX, practice-match state transitions, profile/connections UI, offline fixtures mode, gated scenario-lab preview. |
| Canonical checkout | CHOONZ/CHOONZ-mobile |
| FLEET-MAP status | ALIVE (plain row, no note) |
| Current front | `docs/next-session.md` — lab revision selector landed on main @ `f565fbf` (2026-09-04); claimable frontlog rows done or gated; owner merge of lockfile reify (rank 1) before hosted `expo:doctor` / CI green |
| Key surfaces | `src/app` (Expo Router file routes) · `docs/skins.md` · `docs/store-readiness.md` · `docs/security/npm-audit-exception.md` |

## Route here when

- Work targets the CHOONZ mobile client: combat/practice-match UX, profile and connection flows, fixtures-vs-API mode boundary, client Supabase auth wiring, the gated mechanics lab, or the skins token architecture.

## Route NOT here when

- Backend match authority, simulation, or API contracts — route to `shapeslines/CHOONZ`; shared mobile design patterns — `Clubheavy-Mobile` / `Shapeslines-Mobile`.
- Production EAS build/store submission, Supabase provider changes, branch protection, or web-deployment rollout — owner-only per `docs/next-session.md`; OGIP gates — EstateBoard `_registry`.

## Capabilities (what extends from here)

- The review-only Expo client for the CHOONZ platform — service status, Supabase sign-in, profile, roster catalog, frozen P1 practice-match loop, server-receipts-only mechanics-lab replay — consuming the CHOONZ headless bearer-token API; `docs/skins.md` and `docs/store-readiness.md` are the client-side reference for upcoming skin/store slices.

## Current state pointers

- `docs/next-session.md` — main @ `f565fbf` (2026-09-04): rev-2 decoders, fight-v2 UI, series engine, and mechanics-lab revision selector shipped; lockfile/npm-audit owner rows gate hosted CI. Lane branches use `lane/choonzm-<id>/<yyyymmdd>` per `AGENTS.md`.

## Stop signs

- OGIP citations: none recorded for this repo.
- Production EAS build/store submission, Supabase provider changes, and branch protection are owner-only; web export stays validation-only until the documented CSP review and an owner-approved report-only rollout (`docs/next-session.md`).
- npm audit exception due for review 2026-09-10 — any package, lockfile, or CI change requires a fresh dependency review (`docs/security/npm-audit-exception.md`).
- Mechanics lab is non-production, API-only, and exact-flag gated; never enable its flag in a production build.

## Quicklinks

- [README](../README.md) · [AGENTS.md](../AGENTS.md) · [docs/next-session.md](next-session.md) · backend [`shapeslines/CHOONZ`](https://github.com/shapeslines/CHOONZ)

## Changelog

- 2026-10-27 — refresh current-state pointers to main @ `f565fbf` (CI-fill pass; no lockfile change).
- 2026-09-07 — board seeded (estate repo-board rollout, EstateBoard tracker).
