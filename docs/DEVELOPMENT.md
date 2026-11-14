# Development

## Run and preview

Serve the repository with any static HTTP server:

```sh
python3 -m http.server 4173
```

`dev/ui-preview.html` uses an in-memory Firebase substitute and simulated players. It never joins a live room. Query parameters select a screen, player count, language and role:

```text
dev/ui-preview.html?state=quest&n=10&lang=en&role=assassin
dev/ui-preview.html?state=propose&n=7&lang=zh&tool=react
```

Available states: `home`, `lobby`, `night`, `propose`, `wait`, `vote`, `quest`, `assassin`, `end`. Use `tool=history|notes|host|react`, `peek=1` or `long=1` for additional UI checks.

The regular home page connects to the configured Firebase project. Use a separate project for development that needs a real backend.

## Firebase configuration

Enable Anonymous Authentication and Realtime Database. Define `window.AVALON_FIREBASE` before loading `app.js` to override the checked-in Firebase configuration. Deploy `firebase/database.rules.json` to that project.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the database layout, game phases and turn flow. The host browser runs the game engine; Firebase synchronizes public state, online presence and encrypted private payloads. Players generate ECDH P-256 keys in their browsers; AES-GCM protects roles and actions. An explicit host handoff re-encrypts the master role map for the successor. An unexpected host disconnect requires the original host to reconnect.

The Firebase Web API key is a public project identifier. Access control depends on authentication and database rules. See the [security policy](../.github/SECURITY.md).

## Verification

```sh
node tests/run-all.mjs
```

The default runner includes only offline rule, multiplayer-simulation and UI checks. `node tests/run-all.mjs --live` additionally runs the security smoke test against the configured live Firebase backend using temporary test rooms; review that test before using a different project. See [playtest coverage](PLAYTEST.md) for test boundaries.

GitHub Actions runs the offline checks on pull requests targeting `main` and on
pushes to `main`, using Node.js 24 and commit-pinned GitHub actions. The required
check is named `Offline tests`. CI never runs the live Firebase test and needs
no Firebase credentials or repository secrets.

For UI changes, check both themes and languages at desktop and mobile widths, including 320px, and all player counts from 5 to 10. For game-flow changes, use at least five isolated browser sessions; the offline preview alone does not validate real multiplayer behavior.

## Deploy

GitHub Pages publishes the repository root from `main`. No build step is required. Versioned shell assets and the service-worker cache identifier must change together when shipping UI updates.

Submit changes through a pull request, wait for `Offline tests`, then squash
merge. See the [release checklist](RELEASE.md) for deployment verification,
rollback and the remaining launch limitations. Documentation-only and CI-only
changes do not require a shell asset version bump.

## Key files

| Location | Purpose |
| --- | --- |
| `app.js` | Game engine, networking, encryption and UI |
| `theme.css`, `style.css` | Theme tokens, components and responsive layouts |
| `site-shell.js`, `site-shell.css` | Shared navigation, theme and language controls |
| `assets/` | Brand, character illustrations and player portraits |
| `en/`, `zh-cn/`, `zh-tw/`, `ru/`, `es/`, `pt/`, `vi/` | Public game guides |
| `firebase/` | Realtime Database access rules |
| `tests/`, `dev/` | Automated checks and offline preview |
