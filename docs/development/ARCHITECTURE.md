# Architecture

Avalon Online is a static site. There is no application server: one player's browser (the host) runs the game engine, and Firebase Realtime Database relays state between browsers.

```text
Player browsers
  ├─ static UI + host-side game engine (site/assets/js/app.js)
  ├─ Firebase Anonymous Authentication
  ├─ per-player ECDH key pair in localStorage
  └─ encrypted role and action payloads
              │
              ▼
Firebase Realtime Database
  ├─ public game state
  ├─ player seats and presence
  └─ encrypted private payloads
```

## Files

| File                                                             | Used by                                                                                                           | Purpose                                                                                                                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `site/index.html`                                                | game                                                                                                              | Document shell and metadata.                                                                                                                   |
| `site/assets/js/app.js`                                          | game                                                                                                              | Everything at runtime: i18n, rules, crypto, networking, host engine, rendering, events.                                                        |
| `site/language/locales.js`                                       | every page                                                                                                        | Static translations for the seven supported languages (`window.AvalonLocales`). See [LOCALIZATION.md](LOCALIZATION.md).                        |
| `site/assets/css/style.css`                                      | game                                                                                                              | Layout and components for the game.                                                                                                            |
| `site/assets/css/theme.css`                                      | every page                                                                                                        | Light and dark semantic colour tokens and theme overrides.                                                                                     |
| `site/assets/js/site-shell.js`, `site/assets/css/site-shell.css` | every page                                                                                                        | Shared header, footer, language and theme controls (`window.AvalonShell`).                                                                     |
| `site/assets/js/project.js`                                      | every page                                                                                                        | Seven-language project story, contact links and optional external support URL; no payment SDK or donor storage.                                |
| `site/assets/css/landing.css`, `site/assets/js/public-ui.js`     | guide pages (`en/`, `zh-cn/`, `zh-tw/`, `ru/`, `es/`, `pt/`, `vi/`), `privacy/`, `unofficial-notice/`, `support/` | Styles, navigation, and language preference for the static content pages.                                                                      |
| `site/pwa/service-worker.js`                                     | game                                                                                                              | Offline shell cache for the installable web app.                                                                                               |
| `firebase/database.rules.json`                                   | Firebase                                                                                                          | Realtime Database security rules. `emergency-deny-all.rules.json` is the standby file described in [EMERGENCY.md](../operations/EMERGENCY.md). |
| `site/vendor/`                                                   | game                                                                                                              | Firebase compat SDK and QRCode.js.                                                                                                             |

`site/language/game-base.js` supplies the unchanged English/Chinese message and role dictionaries before the game loads. `site/assets/js/app.js` is organised in banner-commented sections, in this order: i18n, Rules, Utils, Crypto, Identity, Network, App state, Boot, Room actions, Host engine, Rendering, Overlays, Events.

## Database layout

Everything for a room lives under `rooms/<CODE>`. Each document is stored as a JSON string in a `j` field so arrays and nulls round-trip exactly.

| Path                  | Writer                        | Content                                                                                                      |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `game` → `{host, j}`  | host                          | Public game state. `host` is duplicated outside `j` so security rules can read it.                           |
| `seats/<uid>` → `{j}` | that player (host may remove) | `pid`, `nick`, `pub` (ECDH public key), `joined`, `act` (encrypted action), plus `reaction` and `draftTeam`. |
| `sec/<uid>` → `{j}`   | host                          | That player's role data, encrypted to their public key.                                                      |
| `sec/master` → `{j}`  | host                          | The full role and allegiance map, encrypted to the host's own public key.                                    |
| `sec/<other>` → `{j}` | host                          | Private results such as loyalty checks, encrypted to the viewer.                                             |
| `online/<uid>`        | that player                   | Server timestamp, removed by `onDisconnect`.                                                                 |

The rules accept writes to `seats`, `sec`, and `online` only while the room's `game` record exists, so a client cannot leave orphan data under an unused room code. Old-record cleanup remains possible without `game` for a player’s own seat/presence. Host-authorised seat/secret operations still depend on the host identity stored in `game`; there is no blanket permission for a host to delete every other player’s presence.

### Public game state

Fields in `game.j` that matter most:

- `status` — `lobby`, `play`, or `end`.
- `gid` — random id for the current game; a rematch gets a new one.
- `phase` and `step` — current phase and a unique string for the current decision (for example `<gid>:propose:0:1`).
- `order`, `pubs`, `nicks`, `n` — seating, public keys, and names frozen at game start.
- `q`, `att`, `leader`, `team`, `quests`, `rounds` — quest index, proposal attempt, and history.
- `settings`, `lady`, `lancelot`, `excaliburHolder`, `revealed`, `events` — optional modules and public events.
- `expires` — expiry marker: 72 hours for a room, 24 hours after a game ends.
- `roles`, `winner`, `reason` — filled in only when the game ends.

### Phases

```text
lobby ──start──▶ [loyalty] ─▶ propose ─▶ vote ─▶ quest ─▶ [excalibur] ─▶ [lady] ─┐
                                 ▲          │ rejected                            │
                                 └──────────┴─────────────────────────────────────┘
                         three successes ─▶ [recruit] ─▶ assassin ─▶ end
```

Phases in brackets occur only when the matching role or module is enabled. Three failed quests or five consecutive rejections go straight to `end`.

## How a turn works

1. A player decides (vote, quest card, pick). The client encrypts `{v}` to `game.hostPub` and writes it to its own seat as `act: {k: step, box}`.
2. The host's client sees the seat change, and `hostTick()` runs `computeNext()`. When every required action for the current `step` has arrived, the host decrypts them and publishes the next `game` document.
3. Every client re-renders from the new state. Stale actions are ignored because their `k` no longer matches `step`.

## Encryption

- Each browser generates an ECDH P-256 key pair bound to its anonymous Firebase uid. The private key stays in `localStorage`.
- To encrypt, the sender creates an ephemeral ECDH key pair, derives an AES-GCM 256 key against the recipient's public key, and stores `{e, iv, ct}`.
- At game start the host deals roles, writes one encrypted `sec/<uid>` per player, and writes `sec/master` encrypted to itself so it can recover the role map after a refresh.

### Host handoff

The host re-encrypts the master role map to the successor's public key and commits `sec/master` together with the new `game.host` in one multi-path `update`, so a dropped connection cannot leave half a transfer. If the host disappears without handing off, nobody else holds the key; the original host must reopen the room link. In the lobby, a departing host simply passes `host` to the next player because no secrets exist yet.

## Browser storage

All keys are prefixed `lwav.`: the identity key pair, nickname, language, theme, last room, and per-game private state such as notes. Notes never leave the browser.

## Room expiry

Expiry is enforced by the host client, not the database: when the host reconnects to a room whose `expires` has passed, it deletes the room. Nothing deletes a room whose host never returns; see the retention note in [RELEASE.md](../operations/RELEASE.md).

## Publication and attestation

Source layout is described in [maintenance](MAINTENANCE.md).
`scripts/prepare-site.mjs` copies an explicit source-to-URL map into `dist/`;
GitHub Pages and Workers deploy that directory. There is no runtime build.

After Firebase initialization and before accessing Authentication or Realtime
Database, `site/assets/js/app-check.js` activates the Enterprise provider using
the public settings in `site/config/app-check.js`. Local fake-backend previews
do not request production attestation. No debug tokens are published.
Provider registration, client token validity and backend enforcement are
separate operational states; report each accurately.
