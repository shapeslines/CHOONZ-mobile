# docs/ — map

Which file answers which question. Start at the top; stop when the question is answered.

| Question | File | Shape / owner |
|---|---|---|
| What do I do first this session? | [next-session.md](next-session.md) | ADR-0025 wrap pin, ≤40 lines, replaced every wrap |
| What is actually built, and what is next? | [groundwork.md](groundwork.md) | Now / Not yet / Up next |
| Which tickets are open, ranked, with fences? | [WORK-FRONTLOG.md](WORK-FRONTLOG.md) | one row per claimable slice |
| How do the backend contracts / vault ARCs map to mobile work? | [plans/README.md](plans/README.md) | bridge table + claim protocol |
| What exactly do I build for slice X? | [plans/](plans/) | one plan per slice: fence, gate, slice ledger |
| What is the long sequence? | [ROADMAP.md](ROADMAP.md) | Now / Next / Later |
| Why was a decision made? | [decisions/](decisions/README.md) | ADRs are immutable; supersede, do not edit |
| Skins on the client (tokens, picker, M-S1..M-S5)? | [skins.md](skins.md) | mirrors backend P-S1..P-S5 |
| Store identity, providers, deletion UI, IAP, privacy (M1–M6)? | [store-readiness.md](store-readiness.md) | owner decisions M1–M6 |
| Why is the npm audit exception in place and when is it reviewed? | [security/npm-audit-exception.md](security/npm-audit-exception.md) | reviewed 2026-09-03; re-scoped record unsigned, next review 2026-10-10 |
| Web CSP posture before any web rollout? | [security/web-csp-prep-2026-08-12.md](security/web-csp-prep-2026-08-12.md) | validation-only |
| What must propagate elsewhere after a landing? | [custodian-queue.md](custodian-queue.md) | markers for `/custodian` |
| Where did the fat pins go? | [session-archive/](session-archive/) | extracted pins, dated |
| Historic P2 review packets and slates (2026-08-11/13)? | `p2-*.md`, `slate-choonzm-*.md`, `draft-reconciliation-2026-08-13.md`, `main-green-verification-2026-08-12.md` | closed; reference only |

Backend contract authority is CHOONZ `docs/mobile-integration.md`; the engine seam is CHOONZ
`docs/engine-seam.md`. Fleet-level discovery is GromCodebase
[FLEET-INDEX.md](https://github.com/shapeslines/GromCodebase/blob/main/docs/fleet/FLEET-INDEX.md);
flagged work is its `docs/fleet/GAP-REGISTER.md`. Never fork either here.
