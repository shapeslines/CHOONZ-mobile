---
type: record
title: "Draft - CHOONZ-mobile web CSP and script inventory"
kind: security-analysis
status: draft
project: choonz-mobile
slice: N7
base: origin/main@9a9388244ff09b4376c5c2b3148d1a4114dc105b
reviewed_at: 2026-08-12
---

# Web CSP preparation and third-party-script inventory

This is a deployment-preparation analysis only. It does not add a header, alter
the Expo export, configure a host, or authorize a production web deployment.
The web export remains validation-only until an owner approves the deployment
and the report-only rollout below.

## Evidence reviewed

The review used the committed source at the stated base plus an `npm run build`
static export from that exact revision.

| Surface | Evidence | Result |
| --- | --- | --- |
| JavaScript | Export has one same-origin hashed bundle under `/_expo/static/js/web/` and one inline Expo Router hydration module | No third-party runtime script URL is emitted |
| Styles | Export has two inline `<style>` blocks and eight inline `style` attributes on the home page | An enforced policy must account for Expo's generated inline styles |
| Frames | No `<iframe>` is emitted; no source iframe or WebView embedding was found | No frame source is needed |
| API | `src/lib/api.ts` calls only the configured `EXPO_PUBLIC_CHOONZ_API_BASE_URL` in `api` mode | Allow only that exact HTTPS origin when it is configured for a deployment |
| Auth | `@supabase/supabase-js` uses the configured `EXPO_PUBLIC_SUPABASE_URL` | Allow only that exact HTTPS origin; no committed realtime/WebSocket use was found |
| Assets/fonts | No remote runtime image, font, or media origin was found; generated CSS contains a `data:` SVG | Keep `data:` only for images, not scripts |
| Documentation | The README CI badge is a GitHub documentation image/link, not a shipped web dependency | It does not belong in the runtime CSP |

The inline hydration source in this export is
`globalThis.__EXPO_ROUTER_HYDRATE__=true;`. Its SHA-256 source expression is
`sha256-67fhrP0+BkBqmgGGXTtgiVO/9EQs3QruYNU/7fnRkI8=`. Recompute it from the
fresh export before every policy rollout; do not assume an Expo upgrade or
export change preserves the hash.

## Draft production policy

At the hosting layer, substitute the two placeholders with the exact origins
resolved for that release. Do not use an origin wildcard, a path, a secret, or
an unreviewed new third party.

```text
default-src 'self';
base-uri 'none';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
script-src 'self' 'sha256-67fhrP0+BkBqmgGGXTtgiVO/9EQs3QruYNU/7fnRkI8=';
script-src-attr 'none';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
media-src 'self';
worker-src 'self';
manifest-src 'self';
connect-src 'self' https://<configured-choonz-api-origin> https://<configured-supabase-origin>;
upgrade-insecure-requests;
```

`style-src 'unsafe-inline'` is deliberately narrow but not ideal: Expo's static
output currently needs both generated inline style blocks and style attributes.
It must not be copied to `script-src`, and `unsafe-eval` is not allowed. A later
hardening slice can remove the style exception only after the export pipeline
can nonce or otherwise safely externalize those generated styles.

No `wss:` source is included because the committed client has no realtime
WebSocket use. Add an exact `wss://` origin only with a reviewed realtime
feature and a matching browser validation result.

## Required rollout protocol

1. Build the intended API-mode release with its fixed, public API and Supabase
   origins; verify both are HTTPS and derive their origins, not their full URLs.
2. Reinspect the emitted HTML and regenerate every required inline-script hash.
3. Configure this as an HTTP `Content-Security-Policy-Report-Only` header at
   the chosen host. A meta tag is insufficient for a complete policy, including
   `frame-ancestors`.
4. Exercise fixtures, sign-in/sign-out, protected reads, the practice loop,
   and all static routes in a browser while reviewing the CSP reports.
5. Only after the report-only result is clean may the owner authorize an
   enforced header and a production deployment.

## Scope boundary

This analysis neither changes the public environment contract nor weakens its
HTTPS validation. It does not permit EAS/store work, a Supabase provider change,
package or lockfile changes, web hosting, or deployment.
