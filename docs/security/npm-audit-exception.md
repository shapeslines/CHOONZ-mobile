# npm audit exception — Expo SDK 57 build and rendered-test chain

Status: `ACCEPTED FOR REVIEW-ONLY` (time-bounded) — this is not deployment
approval and grants no EAS, store, native-build, or production-web authority.

## Review record — 2026-09-03

Discharges the standing "review by 2026-09-10" clause. **Evidence only — no dependency, lockfile,
`node_modules`, or CI change was made by this review.** Lane
`lane/choonzm-npm-audit-review/20260903`; plan
[`docs/plans/npm-audit-review-2026-09.md`](../plans/npm-audit-review-2026-09.md). The finding set
changed materially, so the re-scoped exception below is **pending owner reapproval** and is not in
force until that row is signed.

### Scope of this review

| Field | Record |
| --- | --- |
| Reviewed commit | `main` @ `da8d690f66ab100c51eafe57a1db3e08b6b96f19` (PR #50) |
| Audit tool | Node.js `24.14.1`; npm `11.11.0`; `npm audit --json` |
| Audit JSON | 7,495 bytes; SHA-256 `74c1926b333bc8a7a24f5be1eb4fb66da2cb7a03da6062fde3a5146e3dad13bf` |
| Reviewed `package.json` | 1,873 bytes; SHA-256 `c9ef9b7ba9398f464d6bdf67111551ddcea9c5a2f0462800e3c8a5942171e319`; blob `80721e0284e7d7abca6d8a86ab1b6b746876a0ac` |
| Reviewed `package-lock.json` | 608,971 bytes; SHA-256 `2bb911d7bdcf5a11ac7874a35242e30e4c4b0a9470f92917ddce61712a6c508c`; blob `259443ab9b167dd017fdf543f4015e20c355861f` |
| Installed toolchain | Expo `57.0.18` (the 2026-08-14 section's `57.0.13` is superseded), `expo-router` `57.0.17`, React Native `0.86.3`, `@expo/metro` `56.0.2`, Metro `0.84.5`, `@expo/config-plugins` `57.0.9` |

### `npm audit --json` totals

`metadata.vulnerabilities`: **0 info · 0 low · 13 moderate · 0 high · 0 critical — total 13**
(was 22: 15 high, 7 moderate, 0 critical). `metadata.dependencies`: 601 prod, 551 dev, 53 optional,
0 peer — 1,162 total.

Eleven of the thirteen rows are aggregate roots and pass-through parents with no advisory of their
own (`@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/inline-modules`,
`@expo/local-build-cache-provider`, `@expo/metro-config`, `@expo/prebuild-config`, `expo`,
`expo-router`, `query-string`, `xcode`). Exactly **two leaf advisories** carry a GHSA:

| Package | GHSA | Severity | Installed | Path | Vulnerable range | `fixAvailable` |
| --- | --- | --- | --- | --- | --- | --- |
| `decode-uri-component` | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) — denial of service via exponential decoding of malformed percent-encoded input (CWE-400/405/407/1176; CVSS score 0, no vector) | moderate | `0.2.2` | `expo-router@57.0.17 -> query-string@7.1.3 -> decode-uri-component@0.2.2` | `<=0.4.2` | `{"name":"expo-router","version":"5.1.11","isSemVerMajor":true}` |
| `uuid` | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) — missing buffer bounds check in v3/v5/v6 when `buf` is provided (CWE-787/1285; CVSS 7.5 `AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N`) | moderate | `7.0.3` | `expo@57.0.18 -> @expo/config-plugins@57.0.9 -> xcode@3.0.1 -> uuid@7.0.3` | `<11.1.1` (the earlier record's `< 11.1.1` phrasing is unchanged in substance; npm now reports the range as `<11.1.1`) | `{"name":"expo","version":"46.0.21","isSemVerMajor":true}` |

**New leaf advisory.** GHSA-vcc3-ghjq-m6fr was not in the accepted set. Per the reapproval clause
("new leaf advisory or title"), this is a **mandatory owner-reapproval trigger** — hence the Owner
decision row below.

**Every offered fix is a semver-major downgrade the exception already forbids:** `expo@46.0.21`
(from 57.0.18) and `expo-router@5.1.11` (from 57.0.17). No `npm audit fix --force`, no downgrade,
no `legacy-peer-deps` was run. `@expo/prebuild-config` reports a bare `fixAvailable: true` only
because it is reachable through a parent the same downgrades would move; it carries no advisory of
its own.

### Retired — the two `image-size` highs

`npm ls image-size` →

```
choonz-mobile@0.1.0 C:\Users\doton\Desktop\GITHUB-ROOT\CHOONZ\CHOONZ-mobile
`-- (empty)
```

`package-lock.json` contains **zero** `node_modules/image-size` entries. Metro moved from `0.84.4`
to `0.84.5` under `@expo/metro@56.0.2`, and that line no longer depends on the vulnerable parser.

| Advisory | Old path | Disposition |
| --- | --- | --- |
| [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) / CVE-2025-71330 | `expo -> @expo/metro -> metro@0.84.4 -> image-size@1.2.1` | **RETIRED 2026-09-03** — package absent from the installed tree and the lockfile |
| [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq) / CVE-2025-71329 | `expo -> @expo/metro -> metro@0.84.4 -> image-size@1.2.1` | **RETIRED 2026-09-03** — same evidence |

This satisfies the removal condition's second limb ("an Expo/Metro line that does not depend on the
vulnerable parser") for `image-size` **only**. It is a removal by dependency change, not by an
upstream patch: `image-size` is still unpatched at `2.0.2`. Dependabot alerts **#3** and **#2**
should be closed as fixed rather than left dismissed as `tolerable_risk`; alert **#1** (`uuid`)
stands and is re-scoped by the row below. Acting on the alert surface is owner-only, so this review
records the delta and does not touch it.

### `npm ci --omit=dev --omit=optional --ignore-scripts` — FAILS (lockfile out of sync)

The exception's deployment precondition requires proving this install clean. It was run in an
**isolated temporary copy** of `package.json` + `package-lock.json` (never in the checkout, so
`node_modules/` was not modified); `git status --porcelain -- package.json package-lock.json`
stayed empty throughout. Result:

```
npm error code EUSAGE
npm error `npm ci` can only install packages when your package.json and package-lock.json
npm error or npm-shrinkwrap.json are in sync.
npm error Invalid: lock file's @react-native/jest-preset@0.86.2 does not satisfy @react-native/jest-preset@0.86.3
npm error Invalid: lock file's @react-native/js-polyfills@0.86.2 does not satisfy @react-native/js-polyfills@0.86.3
npm error Missing: metro@0.87.0 from lock file
npm error Missing: image-size@1.2.1 from lock file
... (44 further Missing: lines on the RN 0.87 / Metro 0.87 line)
```

Plain `npm ci --dry-run` fails identically, so this is not an artifact of the omit flags. Three
consequences, recorded not repaired (repairing the lockfile is a package change this review has no
authority to make):

1. **The deployment precondition is currently unprovable.** No deployment, EAS build, store
   submission, or production web rollout may proceed until a lockfile that reifies is in place and
   re-audited.
2. **Hosted CI is red on `main`.** `.github/workflows/ci.yml` step 1 is `npm ci`; CI run
   `33748253602` on `da8d690` concluded `failure`. The job log was no longer retrievable, so the
   causal link is inferred from the local reproduction against the identical committed files, not
   quoted from CI.
3. **A fresh resolution re-introduces `image-size@1.2.1`** (see the `Missing:` line above). The
   `image-size` retirement above is a property of the *committed lockfile's* pinned tree, not of
   the dependency ranges. Any lockfile regeneration must be re-audited before it lands.

### Proposed review-by date

**2026-10-10**, or the next Expo SDK line that removes the remaining leaf advisories (an
`expo-router` release off `query-string@7`, or an `@expo/config-plugins` release off `xcode@3` /
`uuid@7`), whichever is first. Unsigned until the owner rules.

### Owner decision — UNSIGNED, pending

> **Reapprove the re-scoped npm-audit exception for CHOONZ-mobile**, bound to exactly
> `package.json` SHA-256 `c9ef9b7ba9398f464d6bdf67111551ddcea9c5a2f0462800e3c8a5942171e319`
> (1,873 bytes) and `package-lock.json` SHA-256
> `2bb911d7bdcf5a11ac7874a35242e30e4c4b0a9470f92917ddce61712a6c508c` (608,971 bytes) at `main`
> `da8d690`. The re-scoped exception tolerates **13 moderate / 0 high / 0 critical** findings with
> exactly two leaf advisories — GHSA-vcc3-ghjq-m6fr (`decode-uri-component@0.2.2`, new, via
> `expo-router -> query-string`) and GHSA-w5hq-g745-h8pq (`uuid@7.0.3`, via
> `@expo/config-plugins -> xcode`) — both build/routing-chain, both fixable only by a semver-major
> Expo or expo-router downgrade this record refuses. GHSA-w3rx-r6r6-pgpr and GHSA-5p2g-fcmc-qvqq
> are retired: `image-size` is absent from the tree and the lockfile. Review by **2026-10-10** or
> the next Expo SDK line, whichever is first. All compensating controls and the review-only
> boundary below remain in force, and this reapproval grants no deployment, EAS, store, or
> production-web authority. It is separately noted — and **not** approved here — that the committed
> lockfile does not reify under `npm ci`, so the deployment precondition cannot currently be met.

| Field | Record |
| --- | --- |
| Decision owner | CHOONZ project owner |
| Status | **UNSIGNED — awaiting owner response** (posted as a mailbox `request` on stream `choonz-mobile`, 2026-09-03) |
| Reapproval trigger consumed | new leaf advisory GHSA-vcc3-ghjq-m6fr; retirement of GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq; the 2026-09-10 time gate |
| Bound to | `package.json` SHA-256 `c9ef9b7b…71e319`; `package-lock.json` SHA-256 `2bb911d7…12a6c508c`; commit `da8d690` |
| Signature | _(none — the reviewing lane does not self-approve)_ |

Until this row is signed, the record in force remains the previously accepted exception, whose
`image-size` rows are now factually stale; the boundary and compensating controls are unaffected
either way.

## 2026-08-14 SDK 57 refresh (owner-authorized E2)

> **Superseded in part by the 2026-09-03 review record above:** the two `image-size` highs are
> retired (package absent), the installed Expo version is `57.0.18`, and the audit totals are now
> 13 moderate / 0 high / 0 critical. The paragraph below is retained as the dated record of what
> was true on 2026-08-14.


Owner authorized the Expo toolchain bump. Landed: Expo `57.0.13`, React Native
`0.86.2`, `expo-router ~57.0.13`, Reanimated `4.5.1`, Worklets `0.10.1`,
`jest-expo ~57.0.4`, plus `@react-native/jest-preset@0.86.2` (required by
jest-expo 57). Gates: typecheck, lint, vitest 59/59, jest screens 33/33,
`expo-doctor` 20/20, web export 8 routes.

**What this did not clear:** the two `image-size` highs
(GHSA-w3rx-r6r6-pgpr, GHSA-5p2g-fcmc-qvqq). Advisory range is `<=2.0.2` and
latest published is `2.0.2` — there is **no patched release**. Metro 0.84.4
(still pulled via `@expo/metro@56.0.0` under SDK 57) depends on `image-size@^1`.
`npm audit fix --force` still proposes Expo **53.0.27**, a downgrade we refuse.
The `uuid` moderate (GHSA-w5hq-g745-h8pq) remains on `xcode` → `uuid@7`.
Post-upgrade audit: 13 high / 7 moderate / 0 critical (was 15 high / 7 moderate).

Removal condition is now: a patched `image-size` (`>2.0.2`) **or** an Expo/Metro
line that does not depend on the vulnerable parser.

## Attribution

| Field | Record |
| --- | --- |
| Decision owner | CHOONZ project owner |
| Accepted | 2026-08-10; ARC677 P1 addendum approved 2026-08-11 |
| Approval provenance | Owner ruling in the active CHOONZ task approved the three-path addendum. After the final UI candidate triggered reapproval, the owner responded exactly `approved`; no timestamp is asserted for that response. Coordinator task `019feea2-f315-7dd3-ab34-3c3cafd02960` granted the one-path final-candidate amendment. |
| Acceptance basis | ARC674 review-only SDK 56 candidate plus ARC677 P1 rendered-test candidate; no deployment |
| Candidate lineage | Mobile core `5cb0f57bdf6d7b50360880a9454d0467364e3f36`; dependency exception `69038f9adb351064c21d40bd5a077f5d4d54559c`; final reviewed UI candidate `6177b528ba3113751f7945ab503dce26b40eab60` |
| Candidate `package.json` | 1,776 bytes; SHA-256 `69d30f281a52b8897794a99a899f1d5c5f1abc736c8711016b96100bd9ee6930` |
| Candidate `package-lock.json` | 615,708 bytes; SHA-256 `fe86d80b10d5a78361c5080582df51a6616e5098d9c34b6fd8e5bbffafd5b805` |
| Audit tool | Node.js `24.14.1`; npm `11.11.0`; `npm audit --json` |
| Audit receipt | 2026-08-11T06:27:00.0576742Z–2026-08-11T06:27:02.3855169Z; JSON SHA-256 `f71317e57aa2f6ff0e92953debba6ea0d3d648e36782960e8baaa39156589d6f` |
| Review by | 2026-09-10 or the next compatible Expo/RNTL fix, whichever is first |
| Removal condition | Compatible upstream fixes are available and the Expo SDK 57 dependency set can be updated and re-audited. |

## Final-candidate reapproval

The owner's exact response `approved` consumes the package/Jest/CI reapproval
trigger only for candidate
`6177b528ba3113751f7945ab503dce26b40eab60`. Relative to the dependency
exception commit, `package.json` changes only the `test:screen` script, inline
Jest configuration, and the accepted Node engine contract. The CI change only
invokes `test:screen` immediately after `npm test`.

The five exact dependency pins and installed graph are unchanged. The lockfile
remains SHA-256
`fe86d80b10d5a78361c5080582df51a6616e5098d9c34b6fd8e5bbffafd5b805`.
The audit remains exactly 22 findings (15 high, 7 moderate, 0 critical) with
only the same three leaf advisories listed below. The final-candidate changes
have zero runtime, bundle, authentication, secret, production, or deployment
effect.

This reapproval does not waive the boundary below. Every future package,
lockfile, Jest, or CI change triggers reapproval again, as do all other listed
conditions.

## ARC677 P2 midpoint reapproval

The owner responded exactly `Approved for midpoint candidate fb7fa32 and
package SHA 09ba337c…8ac3.` No timestamp is asserted for that response. This
consumes the package/Jest reapproval trigger only for product candidate
`fb7fa32d0878a1da6fd614c54444e212a2319a05` (tree
`aff32b7e61cff273ced610111e961a879e78153d`) and the proposed 1,796-byte
`package.json` with SHA-256
`09ba337c3ca65d94d56677f5c9d2eb28092c2041f442d828ec89afb087b38ac3`.

Relative to the accepted P1 package, the sole package change broadens
`test:screen` from the Fight rendered test to all committed
`tests/*.test.tsx` files. The exact reviewed set is
`connections-screen.test.tsx`, `fight-screen.test.tsx`, and
`profile-screen.test.tsx`; all 17 rendered assertions pass. Dependencies,
development dependencies, Node engine requirements, lifecycle behavior, and
the installed graph are unchanged. `package-lock.json` remains SHA-256
`fe86d80b10d5a78361c5080582df51a6616e5098d9c34b6fd8e5bbffafd5b805`,
and application source contains no rendered-test harness import.

The fresh owner-bound audit remains exactly 22 findings (15 high, 7 moderate,
0 critical) with only GHSA-w3rx-r6r6-pgpr, GHSA-5p2g-fcmc-qvqq, and
GHSA-w5hq-g745-h8pq as leaf advisories. The script and test additions have no
runtime, bundle, authentication, secret, provider, production, or deployment
effect. The original 2026-09-10-or-next-compatible-fix expiry and every
compensating control below remain active. This approval is exhausted by the
exact P2 candidate and package bytes above; every later package, lockfile,
Jest, CI, audit, lifecycle, reachability, or deployment change triggers fresh
reapproval.

## Locked rendered-test dependencies

The candidate pins these packages exactly in `devDependencies` and the lockfile:

| Package | Exact version |
| --- | --- |
| `@testing-library/react-native` | `14.0.1` |
| `@types/jest` | `29.5.14` |
| `jest` | `29.7.0` |
| `jest-expo` | `56.0.5` |
| `test-renderer` | `1.2.0` |

## Audit attribution

The ARC674 baseline reports 21 findings (14 high, 7 moderate, 0 critical).
The ARC677 candidate reports 22 findings (15 high, 7 moderate, 0 critical).
The added high row is the aggregate root
`@testing-library/react-native@14.0.1 -> react-native@0.85.3`; npm provides no
new leaf advisory or title for that row.

The unchanged leaf advisories remain:

| Advisory | Locked path | Scope |
| --- | --- | --- |
| [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq) | `expo@56.0.19 -> @expo/metro@56.0.0 -> metro@0.84.4 -> image-size@1.2.1` | Metro image-parser denial-of-service advisories in the build chain. |
| [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | `expo@56.0.19 -> @expo/config-plugins@56.0.14 -> xcode@3.0.1 -> uuid@7.0.3` | Expo config-plugin/Xcode build-chain advisory. |

Npm suggests `@testing-library/react-native@13.3.3` and React Native
`0.72.17`. Those changes are rejected for this candidate because they break the
accepted Expo 56, React Native 0.85, React 19.2, RNTL 14, and `test-renderer`
1.x compatibility contract without removing a new leaf advisory.

## Installed exposure and bundle evidence

These packages are declared as development dependencies, but they are not
absent from a normal production install tree. Expo Router 56.2.18 declares
`@testing-library/react-native >=13.2.0` as an optional peer. The lockfile marks
RNTL, Jest, and `test-renderer` as `devOptional`, and a clean
`npm ci --omit=dev --ignore-scripts` retains those three packages. `jest-expo`
and `@types/jest` remain development-only.

The candidate lock adds 255 package nodes: 71 `dev`, 184 `devOptional`, one
optional, and no node with an install script. The added installed package roots
contain 7,477 files totaling 29,940,198 bytes in the reviewed full install.

Runtime reachability is not evidenced. Application source has no RNTL, Jest, or
`test-renderer` import. A clean Expo web export produced a source map with 892
module sources and zero RNTL, Jest, or `test-renderer` sources. Expo Router's
RNTL dependency is reached through its testing-only subpath, not its normal app
entry.

Npm 11 documents `--omit=dev --omit=optional` as the supported isolation for
`devOptional` packages. A dry-run of that install excludes RNTL, Jest,
`test-renderer`, `jest-expo`, and `@types/jest`. A real clean install and native
and web export verification remain mandatory before any deployment authority.

## Compensating controls and boundary

- Exact-pin all five rendered-test packages and retain lockfile integrity
  metadata; no `npm audit fix --force`, lockfile-marker edit,
  `legacy-peer-deps`, React Native downgrade, or Expo downgrade.
- Tests use only trusted committed text and fixtures. Dependency installation
  from integrity-locked registry artifacts is the only allowed network use;
  test execution receives no secrets, deployment credentials, external
  downloads, untrusted binary assets, artifact publication, or production
  access.
- CI remains review-only and least-privileged. It cannot deploy, publish, run an
  EAS/store build, or receive live credentials.
- Any future deployment must first prove a clean
  `npm ci --omit=dev --omit=optional --ignore-scripts` succeeds and that native
  and web bundle/module manifests contain no RNTL, Jest, or `test-renderer`
  code. If Expo validation or export fails under that isolation, move the
  rendered-test harness to a separately fenced package and lockfile.
- Production web remains blocked pending the existing CSP and
  third-party-script review because browser sessions use `localStorage`.
- Reapproval is mandatory for any package or lockfile change; Node, npm, Expo,
  React Native, RNTL, Jest, or CI change; new leaf advisory or title; critical
  finding; lifecycle-script execution; runtime or bundle reachability;
  untrusted-input exposure; artifact publication; or deployment scope.
- This record grants no production deployment, EAS build, store submission,
  live credentials, or merge authority.

## Dependabot alert mapping — 2026-08-11

GitHub Dependabot independently re-detected the same three leaf advisories
accepted above as open alerts on the default branch. No new exposure: all
three are build-chain packages (Metro image parsing; Expo config-plugin Xcode
tooling) with no runtime reachability evidence, and the accepted boundary is
unchanged. Alerts were dismissed with reason `tolerable_risk` referencing this
record; dismissals auto-reopen if the dependency versions change.

| Dependabot alert | GHSA / CVE | Package | First patched | Disposition |
| --- | --- | --- | --- | --- |
| #3 | GHSA-w3rx-r6r6-pgpr / CVE-2025-71330 | `image-size` (Metro build chain, `<= 2.0.2`) | none exists | tolerated; no fix available |
| #2 | GHSA-5p2g-fcmc-qvqq / CVE-2025-71329 | `image-size` (Metro build chain, `<= 2.0.2`) | none exists | tolerated; no fix available |
| #1 | GHSA-w5hq-g745-h8pq / CVE-2026-41907 | `uuid` (`xcode@3.0.1` chain, `< 11.1.1`) | 11.1.1 (unreachable without breaking Expo-pinned `uuid ^7`) | tolerated; fix requires upstream Expo release |

Standing review was the 2026-09-10 review-by date above. It was discharged on
**2026-09-03** — see "Review record — 2026-09-03" at the top of this file:
alerts #3 and #2 (`image-size`) are fixed by removal and should be closed
rather than left dismissed; alert #1 (`uuid`) stands and is re-scoped by the
unsigned Owner decision row there, whose proposed next review is 2026-10-10 or
the next Expo SDK line. Any package, lockfile, or CI change still triggers
mandatory reapproval.
