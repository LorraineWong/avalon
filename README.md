# Avalon Online

[English](README.md) · [简体中文](README.zh-CN.md)

An immersive, browser-based implementation of the social-deduction game *The Resistance: Avalon*. Create a room, share one link, and play with 5–10 people on phones or desktops—no account required.

**[Play Avalon Online](https://lorrainewong.github.io/avalon/)**

![Avalon Online desktop interface](docs/screenshots/home-desktop.png)

## Start here

- [Play / home](https://lorrainewong.github.io/avalon/) — create or join a room.
- [Rules and roles](https://lorrainewong.github.io/avalon/en/) — a beginner guide and player counts.
- [Privacy Policy](https://lorrainewong.github.io/avalon/privacy/) · [Terms & Notices](https://lorrainewong.github.io/avalon/unofficial-notice/)
- Developers: [Run locally](#run-locally) · [Verification](#verification) · [Documentation](docs/README.md)

## Gameplay

- **Complete 5–10 player game loop** — team proposals, public votes, secret quest cards, assassination, and rematches.
- **Seventeen supported character types** — the classic cast plus both Lancelots, Lunatic, Brute, Revealer, Cleric, Trickster, Troublemaker, and Untrustworthy Servant.
- **Optional Lady of the Lake** — available for games with seven or more players.
- **Big Box modules** — Excalibur and the Lancelot Allegiance variant are fully integrated into the encrypted multiplayer flow.
### Privacy and reliability

- **Private role delivery** — roles and player actions are encrypted in the browser with ECDH P-256 and AES-GCM.
- **Reconnect support** — room state is stored in Firebase Realtime Database, so a refreshed browser can resume the game.
- **Responsive Camelot interface** — optimized for desktop and portrait mobile play.
- **Light and dark themes** — use the sun/moon button in any header. Starts with your system preference and remembers your choice across pages.
- **English and Simplified Chinese** — language can be switched at any time.
- **No build step** — the application is plain HTML, CSS, and JavaScript and can be hosted as a static site.
- **Temporary rooms** — new rooms carry a 72-hour expiry marker; completed games expire after 24 hours and are removed when the host reconnects.
### Around the table

- **No-account table reactions** — players can send brief emoji reactions around the table without creating a persistent chat history.
- **Installable web app** — a lightweight PWA shell keeps the home screen and rules available offline; multiplayer still requires a network connection.
- **In-game role guide** — review your own ability and the exact role lineup for the current game at any time.
- **Private deduction notebook** — mark suspected alignments or roles and keep per-player notes locally in your own browser.
- **Faster room setup** — apply beginner, classic, or expanded role presets, then fine-tune individual modules.
- **Table-ready sharing and privacy** — invite players with an on-screen QR code and cover all private information with one tap before passing a device.
- **Safer quest cards** — Success and Fail use clear blue/red treatments and require an explicit confirmation before submission.
- **Secure host handoff** — the current host can transfer an active game to another online player without revealing the role map.

## How to Play

1. Open the [live game](https://lorrainewong.github.io/avalon/), enter a name, and create a room.
2. Share the invite link, five-character room code, or on-screen QR code.
3. Wait for 5–10 players, choose a recommended role preset or configure roles manually, and start the game.
4. Keep the revealed role private. Discuss, propose teams, vote, and complete quests.
5. Good wins by completing three quests—unless the Assassin identifies Merlin. Evil wins by failing three quests or rejecting five consecutive proposals.

The **How to play** page contains the four-step flow, all 17 roles, optional modules, and player counts. During a game, the rules panel also shows the exact lineup for that room. The private notebook is stored only in the current browser and is never shared with the room.

## Architecture

```text
Player browsers
  ├─ Static UI and host-side game engine
  ├─ Anonymous Firebase Authentication
  ├─ Per-player ECDH key pair in localStorage
  └─ Encrypted role/action payloads
              │
              ▼
Firebase Realtime Database (Asia Southeast)
  ├─ public room and game state
  ├─ player seats and online presence
  └─ encrypted private payloads
```

The room host's browser advances the game state. Firebase synchronizes the room, seats, encrypted actions, and online presence between clients. The host may securely hand an active game to another online player: the master role map is re-encrypted for the successor and committed atomically with the host change. If the host disconnects unexpectedly before transferring, that host must reopen the room link; automatic takeover would not have the encryption key needed to continue safely.

## Security Model

- Firebase uses anonymous authentication; players do not create application accounts.
- Each client generates an ECDH P-256 key pair. The private key remains in that browser's `localStorage`.
- The host encrypts each role separately with an ephemeral ECDH key and AES-GCM.
- Player actions are encrypted to the host before being written to Firebase.
- `firebase/database.rules.json` restricts game-state and secret writes to the host and seat writes to the corresponding player.
- The Firebase Web API key is a public project identifier by design. Authorization depends on Authentication and Security Rules, not on hiding that key; production keys must remain restricted to required Firebase APIs.

This design protects hidden roles from other normal clients and casual database inspection. It does not attempt to defend against a compromised host browser or a user modifying their own client.

## Run Locally

Requirements: a current browser and any static HTTP server.

```bash
git clone https://github.com/LorraineWong/avalon.git
cd avalon
python3 -m http.server 4173
```

Open <http://localhost:4173>. The checked-in configuration connects to the production Firebase project, so use clearly marked test names when developing against it.

To use a different Firebase project, define `window.AVALON_FIREBASE` before `app.js` loads and deploy the included `firebase/database.rules.json` to that project. Anonymous Authentication and Realtime Database must be enabled.

## Deploy

The production site is deployed from `main` with GitHub Pages. Because the app has no build step, any static host can serve the repository root.

For GitHub Pages:

1. Open **Settings → Pages** in the repository.
2. Select **Deploy from a branch**.
3. Choose `main` and `/ (root)`.

### Optional support link

The footer can show a voluntary support button without processing payments on this site. Define the URL before `app.js` loads:

```html
<script>window.AVALON_SUPPORT_URL = 'https://ko-fi.com/yourname';</script>
```

Leave it unset to hide the button. Keep the game free and use a hosted payment provider rather than collecting card details on GitHub Pages.

The public footer also links to bilingual privacy and unofficial-project notices. The full privacy notice is in [docs/PRIVACY.md](docs/PRIVACY.md).

## Project Structure

```text
.
├── index.html                 # document shell and metadata
├── app.js                     # UI, encryption, networking, and game engine
├── style.css                  # responsive Camelot design system
├── landing.css                # shared styles for search-friendly content pages
├── service-worker.js          # offline shell for the installable web app
├── manifest.webmanifest       # web app manifest
├── robots.txt, sitemap.xml    # search engine hints
├── assets/                    # role portraits, player avatars, app icon
├── vendor/                    # Firebase and QR-code libraries
├── firebase/                  # Realtime Database security rules
├── tests/                     # automated checks (node tests/run-all.mjs)
├── dev/                       # offline UI preview for development
├── docs/                      # design notes, rules coverage, playtests, privacy, third-party notices
├── en/, zh-cn/                # localized rules, roles, player-count and FAQ landing pages
├── privacy/                   # public privacy notice
├── unofficial-notice/         # public fan-project and rights notice
├── .github/                   # security policy, issue and pull request templates
├── README.md                  # English documentation
└── README.zh-CN.md            # Simplified Chinese documentation
```

## Verification

The current release was browser-tested on 13 November 2026 with five isolated clients, including four 390 px mobile viewports. The automated playthrough covered:

- three successful quests followed by a successful assassination of Merlin;
- five consecutive rejected proposals;
- three sabotaged quests;
- rematches in the same room;
- English and Chinese clients, encrypted role delivery, and responsive-width checks.

Result: **3 complete games, 42 state checks, 0 browser console errors, and no horizontal overflow.**

See the [full multiplayer playtest report](docs/PLAYTEST.md) for covered and deferred scenarios.

The new character behavior and the boundary of the current Big Box implementation are documented in [Big Box rules coverage](docs/BIG_BOX_RULES.md). Pure rule tests currently cover 16 character and module invariants.

Project documentation is indexed in [docs/README.md](docs/README.md). Run `node tests/run-all.mjs` before publishing gameplay changes.

For the trust model, disclosure process, and production security smoke test, see [SECURITY.md](.github/SECURITY.md).

## Contributing

Bug reports and focused pull requests are welcome. When changing game flow, test with at least five isolated clients; a single browser cannot validate hidden information or multiplayer synchronization.

## Legal Notice

This is an unofficial, non-commercial fan project. *The Resistance: Avalon* and its game concepts belong to their respective rights holders. The character illustrations in this repository are original assets created for this interface and do not reuse official card artwork.
