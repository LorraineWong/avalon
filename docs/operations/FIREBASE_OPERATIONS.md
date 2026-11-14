# Firebase operations priorities

Keep the project on Spark. Do not deploy the standby emergency rules, add
wildcard origins or change billing as part of routine maintenance.

## Earlier baseline on 14 November 2026

The Firebase console showed Spark at no cost, the database in Singapore, and
the normal room-existence/ownership rules. `avalon-web` was **not registered**
with an App Check attestation provider. No Firebase settings were changed in
the mobile-menu release. The GitHub Pages origin restriction remains the
documented deployed API-key policy from the earlier security review.

## Priorities before broader promotion

1. **Capacity:** Spark Realtime Database allows 100 simultaneous connections,
   1 GB stored and 10 GB downloaded per month. Connections include browser
   tabs, not just unique players. Watch the console's Connections, Downloads,
   Storage and Load metrics; a small playtest is not a capacity test. Keep a
   margin below the connection limit rather than promising ten full rooms.
2. **App Check:** v26 registers and deploys the Enterprise provider; real token
   exchange succeeds. Track enforcement separately in
   [launch readiness](LAUNCH_READINESS.md), and monitor valid/unverified requests. Test Android/iOS browsers, browser privacy modes,
   reconnect, existing sessions and all intended domains before enforcement.
   Check the chosen provider's pricing/quotas first. App Check complements rules
   and authentication; it is not complete abuse protection or server rate limiting.
3. **Retention:** room expiry currently depends on a reconnecting host. If old
   data accumulates, design an explicit maintainer-run cleanup with a dry run,
   expiry checks and protection for active rooms. Do not make all browsers list
   or delete other rooms. Anonymous Auth account retention is separate; do not
   upgrade Identity Platform or delete returning players' identities implicitly.
4. **Domain:** only the exact confirmed production origin has been added.
   Check API-key referrers, relevant Auth domains and any App Check provider
   domains together. Keep the working old address until the replacement passes
   real room creation, join and reconnect tests.
5. **Recovery:** keep normal and emergency rules available offline. For rule
   changes, use the temporary-user security smoke test and isolated test rooms.
   Do not rely on referrer checks to protect privileged server credentials;
   admin/service-account keys must never be shipped in browser code.

References: [Firebase limits](https://firebase.google.com/docs/database/usage/limits),
[pricing](https://firebase.google.com/pricing), and
[web App Check rollout](https://firebase.google.com/docs/app-check/web/recaptcha-provider).

## v26 registration and rollout

On 14 November 2026, after the owner accepted the Cloud terms, the Enterprise
API and a production Web key were created. Firebase shows `avalon-web`
Registered (Enterprise provider, TTL one hour, app risk 0.5). Only
`lorrainewong.github.io` and `avalon.lorrainewong.dev` are attestation hosts;
domain validation is on and no localhost/debug/test key is used.
The exact new API-key referrer and Auth authorized domain were added while
retaining the old referrer. Spark/no-cost remains unchanged. The browser-key
API list remains the same three APIs.

`site/config/app-check.js` holds only the public site key and allowed hosts.
The vendored SDK matches the existing Firebase 10.14.1 release. Activation
occurs between Firebase initialization and service access. Default offline
checks never request real attestation or create production users.

On 15 November 2026, after valid-token and five-client reconnect/gameplay
checks, Realtime Database enforcement was enabled and the console showed
Enforced. The same authenticated identity receives HTTP 401 without App Check
and 200 with a valid token. The five-client flow passed again under enforcement,
with verified temporary-room/account cleanup. Authentication remains in
monitoring; its enforcement, Identity Platform and billing were not changed.
See [launch readiness](LAUNCH_READINESS.md) for the precise browser coverage.

Provider registration, token validity and enforcement are separate operations. The live smoke test accepts
`AVALON_APPCHECK_TOKEN` only from an authorized local test process when required;
do not print, store or commit that token or introduce a production debug bypass.
