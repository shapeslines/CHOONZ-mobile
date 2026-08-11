# npm audit exception — Expo SDK 56 build chain

Status: `ACCEPTED FOR REVIEW-ONLY` (time-bounded) — this is not deployment
approval and grants no EAS, store, or production-web authority.

## Attribution

| Field | Record |
| --- | --- |
| Decision owner | CHOONZ project owner |
| Accepted | 2026-08-10 |
| Acceptance basis | ARC 674 review-only SDK 56 candidate, no deployment |
| Review by | 2026-09-10 or the next supported Expo update, whichever is first |
| Removal condition | Upstream compatible fixes are available and the SDK 56 dependency set can be updated and re-audited. |

## Locked dependency paths and advisories

The 2026-08-10 `npm audit` snapshot reports 21 findings (14 high, 7 moderate,
0 critical). They collapse to the following build-chain roots in the committed
lockfile:

| Advisory | Locked path | Scope |
| --- | --- | --- |
| [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq) | `expo@56.0.19` → `@expo/metro@56.0.0` → `metro@0.84.4` → `image-size@1.2.1` | Metro image-parser denial-of-service advisories in the build chain. |
| [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | `expo@56.0.19` → `@expo/config-plugins@56.0.14` → `xcode@3.0.1` → `uuid@7.0.3` | Expo config-plugin/Xcode build-chain advisory. |

## Compensating controls and boundary

- CI must not accept untrusted binary assets while this exception is active.
- Keep the SDK 56 dependency set; do not force a downgrade merely to reduce the
  audit count.
- Production web remains blocked pending a separate CSP and third-party-script
  review because browser sessions use `localStorage`.
- No production deployment, EAS build, store submission, or live credentials are
  authorized by this record.
