# Release and launch checklist

## Release path

1. Open a pull request into `main`. `Offline tests` must pass before merging.
   This checks syntax and offline regressions, not production Firebase or layout.
2. For UI changes, check all seven languages, both themes and phone/desktop
   layouts with `dev/ui-preview.html`. Keep asset versions and service-worker
   cache versions aligned. Test an existing browser session after an update.
3. For networking, authentication or database-rule changes, run the authorized
   live security test locally and test real isolated browser clients. Never run
   production tests automatically for untrusted pull requests.
4. Squash merge, then verify the Pages deployment succeeded for the merged SHA.
   Check the public home page, guides, privacy page and required assets.
5. For gameplay changes, verify room creation, invite/join, role delivery,
   voting, quest resolution and reconnect using temporary test rooms only.
   Clean up those rooms and clients when finished.

## Repository controls

- Keep `main` protected: pull requests, the `Offline tests` status check and
  resolved review conversations are required; force pushes and deletion are off.
- A second review is not required for this single-maintainer project. Apply the
  protection to administrators too; change a rule deliberately if emergency
  maintenance requires an exception.
- Keep secret scanning, push protection and private vulnerability reporting on.
- Keep Actions permissions read-only by default, with PR approval disabled.
  Allow GitHub-owned actions only and pin workflow actions to reviewed commits.
- Pages publishes `main` at `/`; only `main` should be allowed to deploy to the
  `github-pages` environment. Delete merged work branches automatically.
- Source code and documentation are under the MIT License; images are excluded
  (see `LICENSE`, `NOTICE` and `assets/LICENSE.md`). Do not silently change the licence,
  its scope or repository visibility.

## Rollback

If a release breaks room creation, joining, role delivery or game progression,
stop further releases and revert the offending change through a pull request.
The revert must pass `Offline tests` and be followed by a successful Pages
deployment. For UI or script rollbacks, ship a fresh cache/asset version rather
than assuming existing browsers have discarded the broken release. Verify both
a fresh browser and an existing session; a revert cannot repair a damaged room
or necessarily restore compatibility with an in-progress game.

A suspected data exposure is a separate incident. Follow
[EMERGENCY.md](EMERGENCY.md). The emergency deny-all rules are a standby file,
not the normal production configuration.

## Before broader promotion

- **Hosting:** GitHub Pages is the current documented production address. A
  connected Cloudflare Workers build also exists. On 14 November 2026 its
  `main` build succeeded, but branch preview builds failed because
  `npx wrangler preview` requires a missing `previews` configuration block.
  Decide the intended hosting path before configuring this extra deployment;
  do not treat its preview as a working staging environment or bypass the
  Firebase origin restrictions to make it work.
- **Domain:** the owner has purchased `lorrainewong.dev` through Cloudflare and
  intends to use `avalon.lorrainewong.dev` for the game. It is not connected yet;
  follow [the cutover guide](DOMAIN_SETUP.md). Then configure DNS,
  Pages domain verification and HTTPS, API-key allowed referrers, Firebase auth
  domains where needed, canonical/social URLs, sitemap and redirect behavior.
  Verify the final site and old-link redirects before announcing the new address.
  Browser identities/keys do not migrate across origins; coordinate a quiet cutover.
- **Capacity:** the Firebase project stays on Spark. Review Authentication and
  Realtime Database usage in the Firebase console before inviting a large group.
  This project has no measured concurrent-player capacity or production load
  test; passing multiplayer tests does not establish one. Quota exhaustion may
  interrupt games. Do not enable Blaze or introduce paid monitoring implicitly.
- **Abuse:** referrer restrictions are not server rate limits or complete
  authentication. On 14 November 2026 the console showed `avalon-web` as not
  registered with App Check. Integrate a provider and monitor real requests
  before considering enforcement; see [Firebase operations](FIREBASE_OPERATIONS.md). A private Git
  repository would not hide the deployed browser code or protect the backend.
- **Retention:** room expiry is cleaned up by a reconnecting host, not a
  guaranteed scheduled server deletion. Anonymous Auth account retention is
  also a separate Firebase setting, not covered by the room cleanup. Do not
  promise automatic deletion on a deadline.
- **Rights:** the maintainer confirms site images were generated with GPT and
  development primarily uses Claude Code and OpenAI Codex. Code and
  documentation are MIT-licensed; images are not licensed for reuse. Do not
  describe the whole project as open source. Review
  [third-party notices](THIRD_PARTY_NOTICES.md) when updating bundled libraries.
- **Playtesting:** Quest 4 and host reconnect have automated coverage; the
  [playtest record](PLAYTEST.md) still identifies gaps in real-browser coverage.
  New translations also need native-speaker review. These are not claims of
  completed manual tests.
- **Account security:** verify GitHub two-factor authentication/passkeys and
  recovery methods in the owner's account settings. Repository API access did
  not reveal the current 2FA state; do not mark it verified.
- **Operations:** there is no configured external uptime/error monitoring or
  guaranteed response time. Watch Pages deployments and Firebase usage during
  initial invitations; keep an offline copy of the emergency guide and rules.
  The private vulnerability report is the supported security contact channel.

See [launch readiness](LAUNCH_READINESS.md) for the dated checks and remaining
external setup. The purchased domain is not evidence that DNS/TLS or Firebase
origin configuration is complete.
