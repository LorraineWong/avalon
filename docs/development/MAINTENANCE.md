# Source organisation and publication

## Repository layout

| Directory                                                               | Responsibility                                                                                                         |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `site/language/`                                                        | All seven guide languages, base game dictionaries, supplemental locale data, project copy and shared privacy additions |
| `site/pages/`                                                           | Privacy, unofficial notice and support page source                                                                     |
| `site/assets/js/`, `site/assets/css/`                                   | First-party runtime behavior and ordered styles                                                                        |
| `site/assets/roles/`, other image files                                 | Illustrations and brand assets, excluded from MIT                                                                      |
| `site/vendor/`                                                          | Unmodified upstream Firebase and QRCode libraries                                                                      |
| `site/config/`                                                          | Public browser configuration, including the App Check site key; never credentials or debug tokens                      |
| `site/pwa/`                                                             | Service worker and web manifest                                                                                        |
| `site/meta/`                                                            | Sitemap, robots and confirmed domain metadata                                                                          |
| `scripts/`                                                              | Dependency-free static publication mapping and packaging                                                               |
| `config/`                                                               | Deployment/tool configuration; Cloudflare's assets path points to generated `dist/`                                    |
| `docs/development/`, `docs/game/`, `docs/operations/`, `docs/policies/` | Maintainer documentation grouped by purpose                                                                            |
| `firebase/`                                                             | Normal and standby emergency database rules                                                                            |
| `tests/`, `dev/`                                                        | Offline regressions and fake-backend UI preview                                                                        |
| `.github/`                                                              | CI, Pages publication, issue/PR templates, sponsorship and private security reporting                                  |

Root README, CONTRIBUTING, AGENTS, CLAUDE, LICENSE, NOTICE and editor/Git control
files stay at their conventional locations so GitHub and development tools can
find them. There are no individual language directories or runtime assets left
in the repository root. Generated `dist/` is ignored and never edited by hand.

## Source paths are different from public URLs

Run `node scripts/prepare-site.mjs`. It copies the classified sources into
`dist/`, without a framework, compiler, network request or package installation.
Serve that directory, for example:

```sh
python3 -m http.server 4173 --directory dist
```

`scripts/site-layout.mjs` is the publication map. For example:

| Source                           | Public URL path         |
| -------------------------------- | ----------------------- |
| `site/language/en/index.html`    | `/en/`                  |
| `site/language/zh-cn/index.html` | `/zh-cn/`               |
| `site/language/locales.js`       | `/assets/js/locales.js` |
| `site/pages/support/index.html`  | `/support/`             |
| `site/pwa/service-worker.js`     | `/service-worker.js`    |
| `docs/operations/RELEASE.md`     | `/docs/RELEASE.md`      |

This preserves existing bookmarks while keeping the source tree compact.
HTML references use the public layout, so open the packaged site, not a source
HTML file directly. README/documentation links resolve to real repository
sources; packaging remaps published Markdown links. Links to developer-only
files that are not deployed point to their GitHub source instead.

Do not copy tests, Firebase rules, Git history, local credentials or arbitrary
repository files into the website. The packaging allowlist rejects unexpected
hidden inputs and symlinks, protects unrelated output directories and detects
duplicate destinations. Tests check source links, published links, precache
entries and deterministic output separately.

## Sources of truth

- Game rules, host engine, encryption and networking: `site/assets/js/app.js`.
- English/Simplified Chinese base messages and role text:
  `site/language/game-base.js`. The classic-script declarations are loaded
  before `app.js`; extracting text does not change the game lookups.
- Seven language IDs/routes and supplemental dictionaries:
  `site/language/locales.js`.
- Project story translations: `site/language/project-copy.js`; approved external
  contact/support URLs and rendering: `site/assets/js/project.js`.
- Shared anti-abuse/payment privacy additions: `site/language/policy-copy.js`.
- Shared navigation/theme: `site/assets/js/site-shell.js` and its styles.
- Styling order remains base, shared shell, then theme overrides. Do not merge
  repeated selectors without checking responsive states.
- Current cloud configuration must be observed separately; source files alone
  are not proof that a provider is registered, enforced or receiving traffic.

Code/docs remain MIT. Image exclusions in
[the image licence](../../site/assets/LICENSE.md), [NOTICE](../../NOTICE) and
[third-party notices](../policies/THIRD_PARTY_NOTICES.md) are unchanged.

## Next internal maintenance

Continue replacing brittle source-spelling assertions with behavior checks
before formatting game/CSS files. Pure-rule extraction and CSS consolidation
remain separate changes with multiplayer and layout regression coverage;
this organisation pass does not introduce a framework or rewrite game rules.

## Named content URLs (v27)

Content pages now use `/how-to-play/<language>/`, `/privacy-policy/<language>/`,
`/terms/<language>/` and `/about/<language>/`, where language is one of `en`,
`zh-cn`, `zh-tw`, `ru`, `es`, `pt` or `vi`. `scripts/content-pages.mjs` generates
all 28 static documents from the existing sources and bundled translations,
including localized navigation, canonical URLs and reciprocal hreflang links.
Each page has readable content without JavaScript. Do not edit generated pages.

The original `/en/`, `/zh-cn/`, other guide routes, `/privacy/`,
`/unofficial-notice/` and `/support/` remain published. The public renderer
forwards legacy visits to the matching named page, preserving the fragment.
These are browser redirects, not HTTP 301 responses. The game remains at `/`;
`?lang=` selects its language without moving origin, identity or room hash.

`site/language/policy-pages.js` is the shared source for policy/terms page copy;
`policy-copy.js` adds the App Check and external-support disclosures. Both static
publication and the public renderer use these sources. Policy changes require
owner review before release; do not infer a legal compliance certification.
