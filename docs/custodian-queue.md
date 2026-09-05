# CHOONZ-mobile — custodian queue

Propagation markers raised by wraps for `/custodian` to drain (downstream docs, vault notes, or fleet
registers that must change because of a landing here). One row per marker; drain by deleting the row
and citing the receipt.

| Raised | Marker | Target surface | State |
|---|---|---|---|
| 2026-09-03 | This repo now points at the shared vault project note `20 Projects/tinytoonz/tinytoonz.md`; the note's body should name CHOONZ-mobile's pin and frontlog as mobile surfaces | `Y:\GromBrain\20 Projects\tinytoonz\tinytoonz.md` | open |
| 2026-09-03 | `docs/store-readiness.md` §8 M1 still recommends `com.shapeslines.choonz`; backend D13 (owner-confirmed 2026-08-16) is `clubheavy.choonz` — reconcile when M1 is claimed | `docs/store-readiness.md` §1/§8 | open |
| 2026-09-04 | `package-lock.json` was re-locked, so the unsigned npm-audit decision row is bound to a stale lockfile hash (`2bb911d7…`); reapproval must be re-scoped to `0929e012…` — see [security/lockfile-relock-2026-09.md](security/lockfile-relock-2026-09.md) | `docs/security/npm-audit-exception.md` owner decision row; Dependabot alerts #1–#3 | open |
| 2026-09-04 | The 2026-09-03 review's "`npm ci` cannot reify" and "a fresh resolution re-introduces `image-size`" findings are corrected — both were artifacts of a proof run in a copy that dropped the tracked `.npmrc`. Any fleet register or vault note repeating the drift as fact needs the correction | `Y:\GromBrain\20 Projects\tinytoonz\tinytoonz.md`; GromCodebase `docs/fleet/GAP-REGISTER.md` if it carries the row | open |
| 2026-09-03 | Branch prefix convention changed from `colony2/choonzm-<slug>` to `lane/choonzm-<id>/<yyyymmdd>` (ADR-0001) | GromCodebase `layout.toml` / fleet registry rows for choonz-mobile, if they encode the prefix | open |
