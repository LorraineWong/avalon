# Repository organisation and maintenance

## Where files belong

| Location                                                                | Responsibility                                                      | Keep out                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Root `index.html`, JS/CSS, manifest, service worker, robots and sitemap | Published runtime and browser entry points                          | Build outputs, local credentials and personal notes                    |
| Root README, CONTRIBUTING, AGENTS, CLAUDE, LICENSE and NOTICE           | Project entry points, contributor/AI instructions and licence scope | Detailed historical test logs                                          |
| `en/`, `zh-cn/`, `zh-tw/`, `ru/`, `es/`, `pt/`, `vi/`                   | Stable public language guide URLs                                   | Developer-only documentation                                           |
| `privacy/`, `unofficial-notice/`                                        | Published notices                                                   | Private incident data                                                  |
| `assets/`                                                               | First-party images, SVGs and their separate licence notice          | Original generation prompts, unneeded large source exports             |
| `vendor/`                                                               | Bundled third-party runtime libraries                               | Locally edited or reformatted upstream bundles                         |
| `firebase/`                                                             | Normal and standby database rule files                              | Service-account keys, login exports or implicit deployment defaults    |
| `dev/`                                                                  | Offline preview tools                                               | Production-only access or paid service assumptions                     |
| `tests/`                                                                | Offline regressions and explicitly live smoke checks                | Unlabelled production writes or machine-specific browser paths         |
| `docs/`                                                                 | Architecture, development, design, rules and operations references  | Temporary screenshots, personal handoff files or credentials           |
| `docs/licenses/`, `docs/screenshots/`                                   | Upstream licence copies and intentional reference screenshots       | Automatic browser reports or arbitrary new image redistribution rights |
| `.github/`                                                              | CI, PR/issue templates and the security policy                      | Runtime feature code                                                   |

The flat runtime root is intentional for direct static deployment. Moving JS,
CSS or guide folders would change script URLs, relative links, service-worker
entries and test fixtures. Do that only for a concrete maintenance benefit with
a migration plan. Group the documentation index by purpose before adding nested
folders just for appearances. Current public and emergency-document links stay
stable in this cleanup.

## Sources of truth

- Rules and role behaviour: `app.js`; the static guides must agree with it.
- Language IDs, routes, supplemental copy and five added dictionaries:
  `locales.js`. English/Simplified Chinese game dictionaries remain in `app.js`.
- Header, mobile menu, theme and language controls: `site-shell.js` and its
  styles. Public page mounting and policy localisation: `public-ui.js`.
- Styling order matters: the base styles are followed by `theme.css` overrides.
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

| Priority | Work                                                                            | Reason and validation boundary                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First    | Replace source-spelling assertions with behavioural checks, a section at a time | Several tests inspect exact compact JS/CSS spelling; whole-file formatting would create unrelated failures. Preserve the same game/privacy invariants.                     |
| Next     | Extract pure rules and role data from `app.js` behind explicit interfaces       | The 140 KB client mixes translations, crypto, transport, host engine and rendering. First retain real multi-client regression coverage; do not split everything in one PR. |
| Next     | Consolidate policy/guide authoring and shared locale content                    | Current static pages and dictionaries can drift. A development-only authoring/check tool may help; published output must still work without a build.                       |
| Then     | Reorganise CSS by components after documenting the cascade                      | Repeated theme and mobile overrides are ordered dependencies. Format and consolidate independently from visual redesign.                                                   |
| Ongoing  | Update vendored SDKs with provenance and complete licence copies                | Automatic package alerts do not cover every manually bundled file. Check auth, presence, reconnect and host transfer before an SDK release.                                |

The current pass improves HTML/doc readability, contributor/AI entry points and
resource checks. It does not change game logic, cloud settings, licence terms,
payment setup, published routes or the runtime cache version.
