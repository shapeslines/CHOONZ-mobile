# Draft reconciliation — 2026-08-13

This record explains how the retained CHOONZ-mobile draft backlog was preserved
against current main. It is a source-history reconciliation, not a production
build, deployment, provider change, or store authorization.

| PR | Disposition | Reason |
| --- | --- | --- |
| #8 | history preserved | Typed profile/connection client landed in stronger form through #15. |
| #9 | history preserved | Auth recovery guidance landed in stronger form through #15. |
| #10 | history preserved | Its P1 rolling-status edits are superseded by current P1/P2/P3 truth. |
| #11 | content retained | Dated main-green verification remains useful historical evidence. |
| #12 | content retained | CSP inventory remains deployment preparation and explicitly requires release-time recomputation. |
| #13 | history preserved | Its rolling next-wave status is superseded by the landed P2/P3 state. |
| #14 | history preserved | Its rolling post-P1 status is superseded by the landed P2/P3 state. |
| #16 | content retained | Dated P2 review-topology evidence. |
| #17 | content retained | Dated P2 contract matrix. |
| #18 | content retained | Dated full-battery replay evidence. |
| #19 | content retained | Dated clean-install replay evidence. |
| #20 | content retained | Dated terminal-review qualification. |
| #21 | content retained | Dated landed-main closure evidence. |
| #22 | content applied | Prevents concurrent connection revoke controls and exposes disabled accessibility state. |
| #23 | content applied | Gives primary navigation links explicit accessible names. |
| #24 | content applied | Aligns the home Fight link's accessible name with its visible action. |
| #25 | partially applied | Aligns fixture transition ordering; its automatic predictable share token is omitted because current backend sharing requires a separate explicit-consent action outside this mobile/fixture scope. |

The union uses merge ancestry for every original head. Superseded rolling files
were deliberately not overlaid onto current main; preservation does not require
reintroducing false current-state claims.
