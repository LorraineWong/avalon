# Launch readiness — 14 November 2026

This is a dated operations record, not a claim that the game resists all
attacks. Repository checks cannot prove current Firebase or Cloudflare settings.

## Verified in this maintenance pass

- The starting checkout and fetched `origin/main` both matched PR #20,
  `14d63749fc5fe0b1da64c7a20c164e28c9873138`; the working tree was clean.
- GitHub API: main requires a pull request, current `Offline tests`, resolved
  review conversations, and applies protection to admins. Force pushes and
  branch deletion are disabled; merged branches are deleted automatically.
- GitHub API: secret scanning and push protection are enabled. Pages publishes
  main from `/`, HTTPS is enforced, and no custom domain is configured at this
  pre-cutover observation.
- Cloudflare's registrar UI showed `lorrainewong.dev` Active. DNS, DNSSEC,
  registrar lock, renewal payment method and account 2FA were not verified.
- The v25 page policy disallows embedded objects, off-origin base URLs and form
  submissions. The referrer policy sends only the origin across origins. This
  deliberately limited meta CSP is not a complete script/XSS policy and cannot
  set `frame-ancestors` or HTTP response headers on GitHub Pages.
- The support page loads no payment embed, tracker or payment SDK. Its external
  links use HTTPS and `noopener noreferrer`. It publishes only the approved
  GitHub and LinkedIn profiles; no personal email or donor list is added.

## Remaining before broader promotion

| Priority | Work                                                                                | Current boundary                                                                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | Firebase App Check provider integration, observe metrics, then evaluate enforcement | Last console review found no provider registered; this pass does not claim a new console verification or enable enforcement. Test real phones, privacy modes and reconnect first.               |
| High     | Domain ownership verification, exact backend origin configuration, DNS and HTTPS    | Purchased, not connected. Follow [domain setup](DOMAIN_SETUP.md); avoid redirecting active rooms across origins.                                                                                |
| High     | Review current Firebase connection/download usage during invitations                | Spark remains required. Quota exhaustion can interrupt games; no load test or DDoS guarantee.                                                                                                   |
| Medium   | Complete a provider account and review actual receipts before enabling payments     | Owner has not chosen a provider/account URL. Keep the page's pending state.                                                                                                                     |
| Medium   | Stronger response CSP and other security headers if hosting evolves                 | Test Firebase WebSocket and long-poll transport, fonts, PWA and inline developer preview before tightening script/connect policies. Do not claim a static `_headers` file is enforced by Pages. |
| Medium   | Expired-room maintainer cleanup with dry run                                        | Reconnecting hosts currently remove their expired rooms; there is no scheduled server deletion.                                                                                                 |
| Medium   | Native-language review and broader real-device playtesting                          | Automated translations and previews do not replace this.                                                                                                                                        |
| Medium   | Resolve the separate Workers branch-preview configuration                           | Existing branch preview failure is documented; no Workers configuration changed here.                                                                                                           |
| Ongoing  | Account 2FA/passkeys, renewal/recovery and operational monitoring                   | The owner must retain account/recovery access. No external uptime monitoring or guaranteed response time is configured.                                                                         |

## Threat model

Rooms are identified by invite codes. Authentication and ownership rules are
access controls; referrers, nickname validation and disabled UI buttons are not
server-side anti-bot limits. A malicious client can create anonymous accounts
and attempt room/seat spam within allowed rules and quotas. App Check reduces
some unauthorized-client abuse but does not make a trusted browser or room host
honest and is not complete rate limiting.

Do not expose service accounts, log tokens, upgrade Spark to Blaze, expand
origins broadly, or deploy standby deny-all rules as routine hardening. If abuse
is observed, assess impact and use [the incident guide](EMERGENCY.md). A shutdown
interrupts legitimate players too and requires a deliberate incident decision.

## Validation record

- Six runtime JavaScript syntax checks and 16 offline suites passed locally
  (Node.js 25.6.1); CI uses the documented Node.js 24.
- Live permission smoke test: 14/14, including denied room enumeration. The
  random temporary room was confirmed unused before writes; cleanup verified
  room removal and successful deletion of the two temporary anonymous users.
- Isolated Chrome: 140 page combinations across seven languages, two themes,
  320px/1440px, home/lobby/vote, public support and localized guides; no page,
  local-resource or CSP errors, and no horizontal overflow. Mobile menu Escape
  and room-link new-tab behavior, support-page language switching and approved
  profile links were checked.
- Six before/after geometry comparisons for home/lobby/vote at phone/desktop
  sizes matched with animations disabled for the comparison. This is a core
  control-layout comparison, not an assertion that every pixel is identical.
- Existing-origin v24→v25 upgrade retained a browser-storage probe and removed
  the old cache. The support page loaded offline; an uncached nested navigation
  redirected home with game assets loading at the correct base.
- The service-worker VM test additionally verifies other projects' caches are
  retained, unsuccessful responses are not cached and cache writes extend the
  event lifetime. The browser check did not play a live multiplayer game.
- Google Fonts requests were blocked for deterministic browser layout checks;
  this is not a new complete font-loading review or real-phone certification.
- Formatter checks and `git diff --check` passed. PR and post-merge deployment
  statuses must still be inspected for the final commit.

Do not infer a production capacity measurement or full abuse resistance from
these checks. External browser reports/screenshots stay outside the repository.
