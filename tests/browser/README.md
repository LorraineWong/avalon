# Optional browser checks

First run `node scripts/prepare-site.mjs`, then serve `dist/` on localhost:4173.
These checks use Chrome and Playwright as optional development tools. They are
not runtime dependencies and are not installed by the offline test runner.
If Playwright is installed outside this checkout, pass its module path:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/browser/layout.cjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/browser/forms.cjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/browser/multiplayer.cjs
```

With a normal local Playwright installation, omit `PLAYWRIGHT_MODULE`.

- `layout.cjs`: nine languages, both themes, four home viewports and three
  guide viewports (126 cases), keyboard validation and disclosures, no-JS rules,
  static fallback routing and the existing render-stability page.
- `forms.cjs`: clipboard denial/manual selection in six short viewports and
  themes, 44px close targets, Escape, rename acknowledgement and focus stability.
- `multiplayer.cjs`: five isolated browser contexts with independent identities
  and storage, linked through an in-process shared Firebase stand-in. It covers
  creation, joining, dealing, host tab recovery, quests, assassination, rematch,
  invitations, switched Lancelots, host transfer and successor recovery.

The multiplayer fixture blocks service workers and external requests and
replaces Firebase before the game boots. It never reads or writes production
rooms. Animations/filters are disabled in that fixture to keep five simultaneous
headless renderers responsive. Overlays are dismissed by the fixture; decisions
use rendered controls. The fake backend does not enforce Firebase rules, real
network timing or server transaction retries. These results are browser behavior
coverage, not proof of production multiplayer or browser/device coverage.

These tests do not emulate a real iOS/Android software keyboard or the operating
system share sheet. Use physical devices for final native keyboard/share review.
