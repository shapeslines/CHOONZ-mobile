# Lockfile re-lock — 2026-09-04

Owner-authorized regeneration of `package-lock.json` under a fresh dependency review, discharging
[`WORK-FRONTLOG.md`](../WORK-FRONTLOG.md) rank 1 and the lockfile limb of
[`security/npm-audit-exception.md`](npm-audit-exception.md) §"Review record — 2026-09-03".

**`package.json` is unchanged.** No `overrides` block was added; no dependency range was edited.
Its bytes are identical to the reviewed manifest — 1,873 bytes, SHA-256
`c9ef9b7ba9398f464d6bdf67111551ddcea9c5a2f0462800e3c8a5942171e319`, blob
`80721e0284e7d7abca6d8a86ab1b6b746876a0ac`. Only `package-lock.json` changes.

This lane grants no deployment, EAS, store, or production-web authority, and does not sign the
exception's pending owner decision row.

## 1. Why — and a correction to the recorded cause

The 2026-09-03 review recorded that `npm ci` cannot reify the committed lockfile, and inferred from
that a red hosted CI. Re-running the same check **inside the checkout** contradicts the first limb:

| Check | Result |
| --- | --- |
| `npm ci --ignore-scripts` in the worktree, committed lock | **succeeds** — "added 1112 packages, and audited 1113 packages" |
| Same `package.json` + `package-lock.json` copied to a bare directory **without `.npmrc`** | **fails** — `EUSAGE`, `Invalid: lock file's @react-native/jest-preset@0.86.2 does not satisfy @react-native/jest-preset@0.86.3` |

The committed `.npmrc` is a tracked file containing exactly `legacy-peer-deps=true`. The earlier
review ran its install proof in an isolated temporary copy of the two manifest files, which did not
carry `.npmrc`; npm then resolved peers strictly, demanded the React Native 0.87 / Metro 0.87 line,
and reported the drift. **The reported reify failure is a method artifact, not a property of the
committed lockfile.** Everything the review recorded about advisories, totals, and the `image-size`
retirement stands; only the "deployment precondition is unprovable" conclusion and its `image-size`
regression warning are corrected here.

CI (`.github/workflows/ci.yml`) runs `npm ci` inside the checkout, so it picks `.npmrc` up too. The
red runs on `main` are not lockfile failures: run `33917592855` (push, `main`) completed in **two
seconds** with an empty runner name and **zero recorded steps**, the shape of a job that never
started. That matches the estate's known billing-blocked hosted CI (owner item O3), not step 1.

What *was* real is the version skew the error line names. The committed lock pinned
`@react-native/jest-preset` and `@react-native/js-polyfills` at `0.86.2` under a `react-native`
`0.86.3` root, papered over by a nested `react-native/node_modules/@react-native/js-polyfills@0.86.3`.
This re-lock removes that skew.

## 2. Exact commands

```
node -v                       # v24.14.1
npm -v                        # 11.11.0

# baseline, committed lock
npm audit --json              # 13 moderate / 0 high / 0 critical
npm ci --ignore-scripts       # succeeds (see §1)

# fresh resolution: package.json + .npmrc only, no prior lock, temp directory
npm install --package-lock-only --ignore-scripts

# adopt, reify, gate
npm ci --ignore-scripts
npm run typecheck
npm run lint
npx vitest run
npm run test:screen
npm run expo:check
npm audit --json
npm ls image-size
```

Run in the checkout with the lock in place, `npm install --package-lock-only --ignore-scripts`
reports "up to date" and writes nothing — the committed lock is already a valid resolution of
`package.json`. The delta below therefore comes from a **from-scratch** resolution (`package.json`
plus `.npmrc`, no lock), which is what floats the `~`/`^` ranges to their current heads.

## 3. Top-level dependency deltas

Seven direct dependencies move; every move is a patch inside the range already declared in
`package.json`. No range was edited, so no dependency was added, removed, or bumped across a
major or minor line.

| Dependency | Declared range | Before | After |
| --- | --- | --- | --- |
| `expo` | `~57.0.18` | 57.0.18 | 57.0.20 |
| `expo-constants` | `~57.0.16` | 57.0.16 | 57.0.17 |
| `expo-font` | `~57.0.2` | 57.0.2 | 57.0.3 |
| `expo-linking` | `~57.0.8` | 57.0.8 | 57.0.9 |
| `expo-router` | `~57.0.17` | 57.0.17 | 57.0.19 |
| `expo-secure-store` | `~57.0.2` | 57.0.2 | 57.0.3 |
| `@react-native/jest-preset` (dev) | `^0.86.2` | 0.86.2 | **0.86.3** |

The last row, together with the transitive `@react-native/js-polyfills` `0.86.2 → 0.86.3`, is the
skew §1 describes. `react`, `react-dom`, `react-native`, Reanimated, Worklets, the gesture/screens/
safe-area set, `@supabase/supabase-js`, `@tanstack/react-query`, `typescript`, `eslint`, `jest`,
`jest-expo`, `vitest`, and `@testing-library/react-native` are all **unchanged**.

## 4. Transitive delta

| Measure | Count |
| --- | --- |
| Lock nodes before / after | 1,162 / 1,162 |
| Nodes added | 3 |
| Nodes removed | 3 |
| Nodes version-changed | 73 |

Added: `@jest/react-is-18@18.3.1`, `@jest/react-is-19@19.2.8`,
`@rolldown/binding-android-arm-eabi@1.2.7`.
Removed: `react-is-18@18.3.1`, `react-is-19@19.2.8` (the same two packages under their new scoped
names — a rename inside the Jest 30 chain), and the nested
`react-native/node_modules/@react-native/js-polyfills@0.86.3`, which is no longer needed once the
hoisted copy is `0.86.3`.

The 73 version changes are patch or minor moves in the Expo, `@typescript-eslint`, Jest 30,
Rolldown/Vite, Babel-browserslist, and Terser lines — for example `@expo/cli` 57.0.20 → 57.0.22,
`@typescript-eslint/*` 8.67.0 → 8.69.0, `pretty-format` 30.4.1 → 30.5.1, `rolldown` 1.2.4 → 1.2.7,
`vite` 8.2.1 → 8.2.2, `zod` 4.4.3 → 4.5.4. No new package carries an install script; the full
before/after node inventory is reproducible from the two commands in §2.

## 5. Audit before / after

| Field | Before (committed lock) | After (re-locked) |
| --- | --- | --- |
| `metadata.vulnerabilities` | 0 info · 0 low · **13 moderate** · 0 high · 0 critical — 13 | 0 info · 0 low · **13 moderate** · 0 high · 0 critical — 13 |
| `metadata.dependencies` | 601 prod · 551 dev · 53 optional · 0 peer — 1,162 | 601 prod · 551 dev · **54** optional · 0 peer — 1,162 |
| Advisory rows | the same 13 names | the same 13 names |
| Leaf advisories | GHSA-vcc3-ghjq-m6fr (`decode-uri-component@0.2.2`, `<=0.4.2`), GHSA-w5hq-g745-h8pq (`uuid@7.0.3`, `<11.1.1`) | identical |
| `npm ls image-size` | `(empty)` | `(empty)` |
| `image-size` nodes in lock | 0 | 0 |
| Audit JSON | 7,495 bytes; SHA-256 `74c1926b…d13bf` | 7,495 bytes; SHA-256 `2eb3f7cf…59778` |

**No new advisory id.** Nothing was added to the accepted set, nothing high or critical appeared,
and the eleven aggregate/pass-through rows (`@expo/cli`, `@expo/config`, `@expo/config-plugins`,
`@expo/inline-modules`, `@expo/local-build-cache-provider`, `@expo/metro-config`,
`@expo/prebuild-config`, `expo`, `expo-router`, `query-string`, `xcode`) still carry no advisory of
their own. The only metadata movement is one optional package.

**`image-size` did not return.** The 2026-09-03 warning that a fresh resolution re-introduces
`image-size@1.2.1` was tied to the same `.npmrc`-less method: strict peer resolution pulls the RN
0.87 / Metro 0.87 line, and that line still depends on the vulnerable parser. With `.npmrc` present
the resolution stays on Metro 0.84.5 and `image-size` is absent from both the tree and the lock. No
`overrides` pin was needed.

## 6. Gates

Run in the worktree against the re-locked tree, all green:

| Gate | Result |
| --- | --- |
| `npm ci --ignore-scripts` | exit 0 — reifies |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 — "ESLint: No issues found" |
| `npx vitest run` | exit 0 — 105 pass, 0 fail |
| `npm run test:screen` | exit 0 — 8 suites, 60 tests pass |
| `npm run expo:check` | exit 0 |
| `npm audit --json` | 13 moderate / 0 high / 0 critical (§5) |

`npm run expo:doctor` and `npm run build` are CI-only steps and were not run in this lane.

## 7. Bound artifacts

| Field | Record |
| --- | --- |
| Base commit | `main` @ `36c23ec5b6a697701c206886c4a1b8e838310da8` |
| Audit tool | Node.js `24.14.1`; npm `11.11.0`; `npm audit --json` |
| `package.json` (unchanged) | 1,873 bytes; SHA-256 `c9ef9b7b…71e319`; blob `80721e0284e7d7abca6d8a86ab1b6b746876a0ac` |
| `package-lock.json` before | 608,971 bytes; SHA-256 `2bb911d7bdcf5a11ac7874a35242e30e4c4b0a9470f92917ddce61712a6c508c` |
| `package-lock.json` after | 609,280 bytes; SHA-256 `0929e0127794f11c61043561a0e7e210e93e97bbebc4d780b9c29da80f1622a8`; blob `1ec6e00dd252c25b9779bd0a79d97cbf386ae5fb` |
| Lockfile version | 3 (unchanged) |

## 8. What this does not do

- It does not sign the exception's pending owner decision row. That row is bound to the **old**
  lockfile hash; a lockfile change is itself a mandatory reapproval trigger, so the owner's
  reapproval should now be taken against the after-hash in §7.
- It does not merge. The owner merges this PR.
- It does not touch Dependabot alert state, EAS, or any deployment surface.
