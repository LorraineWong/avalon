# Source organisation and publication

## Repository layout

| Directory                                                               | Responsibility                                                                                                         |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `site/language/`                                                        | All nine guide languages, base game dictionaries, supplemental locale data, project copy and shared privacy additions |
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
- Nine language IDs/routes and supplemental dictionaries:
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

## Public-page typography

The public reading scale at the end of `site/assets/css/theme.css` is scoped to
`main.wrap`, outside the game panels. Guides, policies, terms and About share
`--content-title` (28–38px), `--content-heading` (22–26px), `--content-body`
(15px) and `--content-small` (13px). Keep new document content on this scale
instead of adding page-specific font sizes. Branding and game controls have
separate sizing. About copy remains in `site/language/project-copy.js`; update
all nine languages together and preserve the payment and rights disclosures.

Game dialogs use `--dialog-title` (20px) and rule subsections use
`--dialog-subtitle` (16px), both in the shared UI font. The compact QR title
retains its separately reviewed 15px phone / 16px desktop scale. Public Russian
and Vietnamese titles select the UI font to avoid falling through the Latin
display font to a different serif family.


## Shared width and room updates

`--av-content-width` sets the shared 1208px content boundary. Public documents,
home panels and room layouts use the same 16px side gutters; paragraphs have a
separate readable line length without narrowing their page container.
Room text uses 16px headings, 15px main explanations, 14px names and 13px
secondary copy. Table markers remain container-sized so ten seats fit a phone.
Mobile text-entry controls use 16px to avoid browser focus zoom.

`updateView` in `site/assets/js/app.js` skips unchanged output and reconciles
changed DOM nodes. Do not restore whole-app `innerHTML` replacement on sync:
it restarts sheet animations and interrupts input state. Keep live form values
in sync as well as attributes, and focus confirmation actions only on changes.
After renderer edits, open `/dev/render-stability.html` on the packaged local
preview. It uses the fake backend and checks a timer tick, changed remote
records, note selection/scroll, native form values, confirmation focus, a phase
change and a vote submission. It must report PASS. This is a browser regression,
not a production multiplayer or capacity test.

## Shared quick-start guide

The public guide and room reference share concise module/player copy in
`window.AvalonLocales.guide` (`site/language/locales.js`) and render it with
`site/assets/js/guide.js`. The game loads that helper before `app.js`; its
versioned URL is included in the service-worker shell.

Guide source HTML keeps the role catalog, four steps and numeric table, with
three `guide:` comment slots for shared modules, player summary and the note
below the table.
`content-pages.mjs` expands these slots for both legacy and named static guides.
Do not replace the slots with a second independent copy of the instructions.
The public guide keeps roles, optional modules and the count table expanded, with
no disclosure controls. The in-room guide has three tabs: this game's roles, a
quick guide (objective, four steps, player-count table and the Quest 4 note) and
all roles (both factions plus optional modules). Keep the quick guide to about
one and a half phone screens; role detail belongs in the roles tabs. Modules reuse the same role-card layout
as their surrounding Good/Evil cards. The in-room current-lineup tab shows only enabled modules
(and the Lake only at seven or more players). Keep the explanations brief without hiding cards or tables, rather than
adding long step-by-step references.


## v28 language and navigation additions

Nine locales now include Japanese (`ja`) and Korean (`ko`), with matching public
route segments. See LOCALIZATION.md for the current registry and review scope.
The global header uses its side menu at widths up to 1200px; CSS and the menu's
resize/focus handling must keep that breakpoint aligned. It must not wrap the
navigation into a second row at intermediate widths.
