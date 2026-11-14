# Launch readiness — 14 November 2026

This is a dated operations record. A registered App Check provider, a valid
client token and enforced backend protection are three different states.

## Completed before the v26 rollout

- `lorrainewong.dev` was verified in the owner's GitHub Pages account using the
  actual Cloudflare TXT challenge. The exact game subdomain is
  `avalon.lorrainewong.dev`; the apex remains reserved for a future portfolio.
- The browser API key now permits the exact new HTTPS referrer in addition to
  the existing GitHub origin. The selected APIs remain App Check, Identity
  Toolkit and Token Service; no wildcard domain or extra API was added.
- Firebase Auth's authorized domains include the exact game subdomain.
- The owner explicitly accepted the Google Cloud terms for the Enterprise API.
  The API and production Web key were created with only the old/new production
  hosts, domain verification on, no checkbox/test/WAF mode, and no localhost.
  Firebase shows `avalon-web` Registered with the Enterprise provider, default
  one-hour TTL and 0.5 risk threshold. No debug token is shipped.
- Spark remains the no-cost Firebase plan. No billing account was linked, no
  paid plan was enabled, and no emergency deny-all rules were deployed.
- Ko-fi now has the approved public account, bilingual profile and source links;
  Malaysia was confirmed, the one-time-tip platform fee was changed to 0%, and
  the public supporter leaderboard was disabled. No actual payment was made.
- Website source is grouped in `site/`, language sources in `site/language/`,
  and documentation by purpose. The static publication map preserves old guide,
  notice, asset and maintenance-document paths. Only explicitly listed static
  files are packaged; tests, database rules and local credentials are excluded.
- GitHub Pages now uses an Actions artifact; Workers production/branch commands
  prepare the same `dist/` directory with pinned Wrangler 4.162.0. Version upload
  replaces the previously failing preview command; it does not provide an
  isolated Firebase backend or expand its permitted origins.

## Cutover and protection verification

GitHub's custom domain and the DNS-only CNAME have been configured. Certificate
issuance and Enforce HTTPS are checked after DNS propagation and deployment;
do not mark the cutover accepted until actual TLS, redirects and gameplay pass.

The v26 client initializes App Check before accessing Firebase services. Backend
enforcement stays off during the initial deployment/valid-token checks. Observe
real attestation results, mobile/desktop and reconnect before enabling the
Realtime Database enforcement switch. Do not silently lower the score threshold,
ship debug tokens, or call registration alone completed abuse protection.

## Validation before publication

- 18 offline suites and first-party syntax checks pass, including deterministic
  packaging, source/published links, App Check lifecycle and no debug bypass.
- Live permission smoke test with the new referrer: 14/14, random unused test
  room only, two anonymous users, verified room/account cleanup. This is a rule
  test without enforced App Check, not a capacity or abuse-resistance claim.
- 168 isolated Chrome combinations: seven languages, light/dark, 320/1440px,
  home/lobby/vote, support, privacy and localized guides. No page/resource errors
  or horizontal overflow; payment link, one privacy-addition section, language
  switching, menu Escape and room new-tab behavior were checked.
- Six core-control geometry comparisons match v25 with animations disabled.
  v25→v26 retained browser storage and another project's cache, loaded the
  extracted dictionaries and served support offline with correct nested fallback.
- Google Fonts were blocked for deterministic layouts. These are not real-phone,
  full-font, live multiplayer or production-capacity results.
- Wrangler's dry run accepted the packaged static site without bindings.

## Ongoing limits

App Check complements ownership rules and authentication; it is not complete
rate limiting or DDoS protection. A trusted room host can still modify its own
client. Cloudflare DNS-only does not proxy the static site through its WAF, and
Firebase traffic goes directly to Google's endpoints regardless.

Watch Spark connection/download/storage quotas during invitations. Room expiry
still relies on reconnecting hosts rather than scheduled server deletion.
Account 2FA/recovery, domain renewal payment methods, native-language review and
real-device playtesting remain maintainer responsibilities. No paid monitoring
or guaranteed response time is introduced.
