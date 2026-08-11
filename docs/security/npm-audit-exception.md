# npm audit exception — Expo SDK 56 build and rendered-test chain

Status: `ACCEPTED FOR REVIEW-ONLY` (time-bounded) — this is not deployment
approval and grants no EAS, store, native-build, or production-web authority.

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
| Removal condition | Compatible upstream fixes are available and the Expo SDK 56 dependency set can be updated and re-audited. |

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
