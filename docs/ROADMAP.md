# CHOONZ-mobile — roadmap

Longer-lived sequence for this client. Immediate handoff is `docs/next-session.md`. Tickets are `docs/WORK-FRONTLOG.md`. This page is not the fleet work-state index. Each bullet names the contract or decision it follows; the plan that makes it claimable is in `docs/plans/`.

## Now

- **M-S3 earnable unlock UI + object-valued `detail` decoder** — against CHOONZ #125 (`POST /me/skins/{id}/unlock`); condition/progress shown from the 403 report; server remains the only verifier (`skins.md` §5/§8). Plan: `plans/m-s3-earnable-ui.md`.
- **npm-audit exception review (due 2026-09-10)** — `security/npm-audit-exception.md`.
- **C1 deletion UI status check** — reconcile the archive's "then account-deletion UI (C1)" with main; backend `DELETE /me` shipped (`store-readiness.md` §3).

## Next

- **M1 identity + EAS profiles** — `app.json` / `eas.json` with the owner-confirmed `clubheavy.choonz` (backend D13 supersedes the `com.shapeslines.choonz` recommendation here); icons/splash (`store-readiness.md` §1, owner M1).
- **M2/M3 providers** — Supabase Apple + Google enablement and sign-in screen scope (owner-run console changes).
- **Bot 409 decoding** — decode `{detail:{code, message, receipt?}}` once ARC686 P2 lands (`G-P2-MUTATE`); the M-S3 `ApiErrorDetail.extra` carrier is designed for it.
- **Fight-v2 HUD additive fields** — when CHOONZ engine revision 2 (ADR-0003) exposes extra `read_state_full` fields, decode them additively; HUD keys are unchanged by contract.

## Later

- **M-S4 IAP** (RevenueCat, restore, store CTA) and **M-S5** character/scene skins (Club Antics assets) — owner/dependency-gated.
- **Store beta** (TestFlight / Play closed testing, D18) and privacy URL (M5); web rollout only after the CSP review.
- **Adaptive/training/tutorial** UX — excluded until separate ARC grants.

## Pointers

- Groundwork: [docs/groundwork.md](groundwork.md)
- Tickets: [docs/WORK-FRONTLOG.md](WORK-FRONTLOG.md) · Bridge: [docs/plans/README.md](plans/README.md)
- Discovery: [FLEET-INDEX.md](https://github.com/shapeslines/GromCodebase/blob/main/docs/fleet/FLEET-INDEX.md)
