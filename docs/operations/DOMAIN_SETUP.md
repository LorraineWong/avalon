# Personal domain and Avalon subdomain

The owner confirmed on 14 November 2026 that `lorrainewong.dev` was purchased
through Cloudflare. The registrar screen showed Active, expiring 14 November 2027. This is a registration observation, not proof of DNS, TLS or deployment.

Intended layout:

- `lorrainewong.dev`: personal portfolio, to be built/configured separately.
- `avalon.lorrainewong.dev`: this game, hosted by GitHub Pages.
- Previous production: <https://lorrainewong.github.io/avalon/>; Pages redirects
  it when the custom domain is configured. Check actual TLS/redirects at cutover.

Buying the domain does not require moving the application to Workers. Keep the
Cloudflare Workers deployment unchanged until its purpose is decided separately.
Do not create a wildcard DNS record or point the apex at this game implicitly.

## Safe cutover order

1. Verify ownership of `lorrainewong.dev` in the GitHub account's Pages settings.
   GitHub provides a unique TXT record under
   `_github-pages-challenge-LorraineWong.lorrainewong.dev`; copy the actual value
   from GitHub, never invent it. Keep this TXT record after verification.
2. Before exposing the new site, allow the exact intended origin in the
   browser API-key referrers (`https://avalon.lorrainewong.dev/*`), the relevant
   Firebase Auth authorized-domain list, and any future App Check provider.
   Preserve the working old origin; never substitute `*.lorrainewong.dev`.
3. Coordinate a quiet cutover with no active games. Changing the Pages custom
   domain redirects the old Pages address: retaining its API referrer alone
   does not guarantee old invite links, old sessions or reconnect will work.
   Test actual path/hash redirects rather than assuming their behavior.
4. Set the repository's Pages custom domain to `avalon.lorrainewong.dev`.
   With the current branch publishing mode, retain the resulting root `CNAME`
   in version control. Do not commit it before the backend/domain prerequisites.
5. In Cloudflare DNS, create only this record:

   | Type  | Name     | Target                   | Initial proxy mode |
   | ----- | -------- | ------------------------ | ------------------ |
   | CNAME | `avalon` | `lorrainewong.github.io` | DNS only           |

   The target has no scheme, repository name or `/avalon` path. Adding the
   Pages custom domain before the DNS alias helps avoid subdomain takeover.

6. Wait for DNS checks and GitHub's valid certificate, then confirm Enforce
   HTTPS. `.dev` is HTTPS-only through HSTS; an invalid certificate cannot be
   treated as an acceptable temporary launch. Never bypass a TLS warning.
7. Change canonical, social, structured-data, sitemap and README production
   URLs together; update metadata assertions in `tests/localization-test.mjs`
   and the live smoke test's default Referer. Relative runtime paths already
   work at `/avalon/` and at the custom domain root. Recheck robots/sitemap.
8. Verify fresh mobile/desktop clients, all public pages, PWA install, cache
   upgrade, five-player room creation/join/role delivery/vote/quest, host
   reconnect and explicit host transfer using temporary rooms only.
9. Verify old links and QR invites. Publish the new address after the above
   passes. Keep rollback instructions and remove abandoned DNS aliases if the
   custom domain is disabled; do not leave a dangling CNAME.

## Session boundary

Browser storage, Firebase anonymous identity, encryption keys, notes and PWA
caches are bound to an origin. Moving from `lorrainewong.github.io` to
`avalon.lorrainewong.dev` does not copy them. Do not ask players to move a live
room, promise automatic recovery, or transfer private keys in URL parameters.
Finish games on the old origin before cutover and start new rooms on the new
one. Downgrading the deployment cannot reconstruct a lost host key.

## Cloudflare security boundary

Use account 2FA/passkeys, registrar lock where available, auto-renew and DNSSEC
as appropriate after inspecting the account. WHOIS contact redaction does not
remove the need for an actual registrar contact address. Keep that private;
do not publish it on the website. Do not alter billing or payment information.

DNS-only mode does not proxy requests through Cloudflare's WAF. Even if the
static site is proxied later, Firebase calls go directly to Google's endpoints;
Cloudflare's zone protection will not rate-limit those database/auth requests.
App Check, database rules, quotas and monitoring remain separate controls.

## Sources checked 14 November 2026

- [GitHub: custom domain and subdomain setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub: domain ownership verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [Google Registry: .dev requires HTTPS](https://get.dev/)

## v26 configured state

GitHub confirmed ownership verification. Cloudflare retains the TXT challenge
and a DNS-only `avalon` CNAME to `lorrainewong.github.io`. The exact API-key
referrer and Auth authorized domain were added; the attestation key covers the
old/new production hosts. No wildcard, apex route or paid plan was added.

Pages uses Actions publication, so the custom domain is configured in Pages
settings/API. `site/meta/CNAME` is retained in the generated artifact for
explicit metadata and rollback clarity; a CNAME file alone does not configure
an Actions-published custom domain. The source-to-public map keeps all guide
and notice URLs stable at the new domain root.

DNS propagation, certificate issuance, Enforce HTTPS and live browser/gameplay
checks are verified after deployment. Until then this is configured, not an
accepted TLS cutover. Never bypass certificate warnings during verification.
