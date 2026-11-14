# Launch readiness — 15 November 2026

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

GitHub Pages deployed v26 from main `34c382f` in run
[43614129519](https://github.com/LorraineWong/avalon/actions/runs/43614129519).
DNS verification succeeded, the certificate was approved and Enforce HTTPS is
on. A normal TLS-validated request returns 200; HTTP redirects to HTTPS, and
old GitHub guide links redirect to their matching new-domain paths. Twenty-six
critical published files byte-match the packaged release, including all seven
guides, support/privacy, runtime, App Check configuration and PWA metadata.

The separate Workers main build `2b848165` also succeeded with version
`fe934ec2-1ad6-47d6-b62f-794ec145f3c9`. Branch packaging succeeds, but branch
uploads fail at Cloudflare's Worker tag identity guard, also on retry. This
matches [the open upstream report](https://github.com/cloudflare/workers-sdk/issues/15682).
The guard remains enabled; no environment-variable workaround bypasses it.
Workers previews are not accepted as working staging.

The v26 client initializes App Check before accessing Firebase services.
Realtime Database App Check is now **Enforced**, confirmed in the console on
15 November 2026. A production REST check with the same authenticated test
identity returns 401 without an App Check token and 200 with a valid token.
No score threshold, domain check or identity guard was lowered or bypassed.
Authentication remains in monitoring; no Identity Platform or billing upgrade
was performed.

Five independent Chrome clients, including one mobile viewport, obtained real
Enterprise tokens (HTTP 200 exchanges). After enforcement they created/joined
a room, received encrypted roles without a public role map, reconnected the
original host with its identity/master state, transferred host ownership,
proposed/approved a team and resolved a successful quest. The temporary room
and all five anonymous accounts were deleted and cleanup verified. The same
flow also passed before enforcement. These are desktop Chrome and mobile
emulation results, not physical Android/iOS or load tests. Font requests and
animations were disabled for stable automation on a heavily loaded machine.

The published support link points to the supplied Ko-fi account. The live
profile shows the saved project/maintenance biography, approved LinkedIn and
a tip button. No real payment was submitted or receipt identity verified.

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
