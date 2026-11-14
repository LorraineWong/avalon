# Tests

Run from the repository root with Node.js 24:

```sh
node tests/run-all.mjs
```

The runner discovers `*-test.mjs` files in this directory. It skips the explicitly
live security smoke test unless `--live` is supplied. A new test must stay offline
by default; keep production-writing tests out of that automatic set.

| Group                             | Files                                                                                            | What they verify                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Game rules and privacy invariants | `big-box-rules`, `assassination-result`, `abuse-prevention`, `private-notes`, `table-experience` | Supported rules, remote input checks, secret information boundaries and selected UI contracts      |
| Multiplayer simulation            | `multiplayer-flow`                                                                               | Multiple isolated VM clients using an in-memory Firebase stand-in, including Quest 4 and reconnect |
| Interface and copy contracts      | `compact-ui`, `party-experience`, `public-experience`, `theme-preference`                        | UI/source contracts, PWA metadata, theme persistence and system preference changes                 |
| Static site consistency           | `guide-reference`, `localization`, `release-version`, `repository-integrity`                     | Guide/rule parity, seven-language completeness, cache versions and local resource/document links   |
| Live Firebase permissions         | `security-smoke`                                                                                 | Temporary-user/room allowed and denied writes; not part of ordinary CI                             |

Names in the table omit the `-test.mjs` suffix. A green offline suite does not
prove browser layout, production quota capacity or live network behaviour. See
[the coverage record](../docs/PLAYTEST.md) for the strongest recorded method and
remaining gaps.

## Live check

```sh
node tests/run-all.mjs --live
```

This creates and removes temporary anonymous users and a test room in the
configured production Firebase project. Use it only when authorised, check the
target and never touch real players' rooms. CI must not run it for untrusted PRs.

## Maintaining tests

- Assert observable rules/behaviour rather than exact spaces, quote choices or
  minified tag layout. Existing compact source assertions are technical debt;
  migrate them gradually while retaining their intended invariants.
- `run-all.mjs` also checks every first-party runtime JS file for syntax.
- Repository integrity checks local HTML/CSS resources and Markdown links; it
  honours the offline preview's HTML base path. External URLs and fragment-only/dynamic anchors are not validated.
- Browser checks remain separate and optional; do not hard-code the maintainer's
  Playwright installation path or introduce a mandatory runtime dependency.
