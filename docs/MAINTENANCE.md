# Repository organisation and maintenance

## Where files belong

| Location                                                        | Responsibility                                                      | Keep out                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Root `index.html`, manifest, service worker, robots and sitemap | Published runtime and browser entry points                          | Build outputs, local credentials and personal notes                    |
| Root README, CONTRIBUTING, AGENTS, CLAUDE, LICENSE and NOTICE   | Project entry points, contributor/AI instructions and licence scope | Detailed historical test logs                                          |
| `en/`, `zh-cn/`, `zh-tw/`, `ru/`, `es/`, `pt/`, `vi/`           | Stable public language guide URLs                                   | Developer-only documentation                                           |
| `privacy/`, `unofficial-notice/`, `support/`                    | Published notices                                                   | Private incident data                                                  |
| `assets/js/`, `assets/css/`                                     | First-party runtime scripts and styles (MIT)                        | Vendored libraries and generated build output                          |
| `assets/`                                                       | First-party images, SVGs and their separate licence notice          | Original generation prompts, unneeded large source exports             |
| `vendor/`                                                       | Bundled third-party runtime libraries                               | Locally edited or reformatted upstream bundles                         |
| `firebase/`                                                     | Normal and standby database rule files                              | Service-account keys, login exports or implicit deployment defaults    |
| `dev/`                                                          | Offline preview tools                                               | Production-only access or paid service assumptions                     |
| `tests/`                                                        | Offline regressions and explicitly live smoke checks                | Unlabelled production writes or machine-specific browser paths         |
| `docs/`                                                         | Architecture, development, design, rules and operations references  | Temporary screenshots, personal handoff files or credentials           |
| `docs/licenses/`, `docs/screenshots/`                           | Upstream licence copies and intentional reference screenshots       | Automatic browser reports or arbitrary new image redistribution rights |
| `.github/`                                                      | CI, PR/issue templates and the security policy                      | Runtime feature code                                                   |

Runtime scripts live in `assets/js/` and styles in `assets/css/`. The root keeps
browser entry points, PWA files and standard contributor/licence entry points.
Public guide and notice directories retain their URLs. `vendor/` remains separate
and unmodified so upstream provenance and licences stay clear.

The v25 migration updates page, offline-preview, test and precache references
together; the avatar sprite URL is relative to the new stylesheet location.
`service-worker.js` stays at the root to retain its scope. Game rules, browser
storage keys, Firebase configuration and image paths are unchanged. Internal
script/style URLs have changed; they are implementation assets, not guide URLs.
Future moves must include the same reference, cache and existing-session checks.

## Sources of truth

- Rules and role behaviour: `assets/js/app.js`; the static guides must agree with it.
- Language IDs, routes, supplemental copy and five added dictionaries:
  `assets/js/locales.js`. English/Simplified Chinese game dictionaries remain in `assets/js/app.js`.
- Header, mobile menu, theme and language controls: `assets/js/site-shell.js` and its
  styles. Public page mounting and policy localisation: `assets/js/public-ui.js`.
- Styling order matters: the base styles are followed by `assets/css/theme.css` overrides.
  Do not merge/delete repeated selectors without checking responsive states.
- Privacy is represented in `docs/PRIVACY.md`, public HTML and translated policy
  dictionaries. Keep them aligned; changing only one does not update the others.
- Actual deployed Firebase/cloud settings must be inspected separately. Checked-in
  docs/rules are not proof of current production state.
- Licence scope: root `LICENSE` plus `NOTICE`; image exclusions in
  `assets/LICENSE.md`; upstream notices in `docs/THIRD_PARTY_NOTICES.md`.
- Coverage claims: `docs/PLAYTEST.md`. Keep dates, methods and untested boundaries
  explicit. Test execution details: [tests/README.md](../tests/README.md).

## Next maintenance work

| Priority | Work                                                                                | Reason and validation boundary                                                                                                                                             |
| -------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First    | Replace source-spelling assertions with behavioural checks, a section at a time     | Several tests inspect exact compact JS/CSS spelling; whole-file formatting would create unrelated failures. Preserve the same game/privacy invariants.                     |
| Next     | Extract pure rules and role data from `assets/js/app.js` behind explicit interfaces | The 140 KB client mixes translations, crypto, transport, host engine and rendering. First retain real multi-client regression coverage; do not split everything in one PR. |
| Next     | Consolidate policy/guide authoring and shared locale content                        | Current static pages and dictionaries can drift. A development-only authoring/check tool may help; published output must still work without a build.                       |
| Then     | Reorganise CSS by components after documenting the cascade                          | Repeated theme and mobile overrides are ordered dependencies. Format and consolidate independently from visual redesign.                                                   |
| Ongoing  | Update vendored SDKs with provenance and complete licence copies                    | Automatic package alerts do not cover every manually bundled file. Check auth, presence, reconnect and host transfer before an SDK release.                                |

The v25 pass groups runtime files and adds the seven-language `support/` page.
The service worker retains other projects’ caches, tracks cache-write lifetime
and redirects uncached nested offline routes to the correct home base.
`assets/js/project.js` owns its story, contact links and optional payment URL.
A missing payment URL renders a clear pending message. Rules, cloud settings
and licence terms remain unchanged. See [launch readiness](LAUNCH_READINESS.md)
for domain, payment and abuse-protection work that requires external setup.
