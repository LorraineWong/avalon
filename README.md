<p align="center"><img src="site/assets/brand-mark.svg" width="80" height="80" alt="Avalon Online"></p>
<h1 align="center">Avalon Online</h1>
<p align="center"><strong><a href="https://avalon.lorrainewong.dev/">Play Now</a></strong> · <a href="https://avalon.lorrainewong.dev/en/">How to Play</a> · <a href="docs/README.md">Documentation</a> · <a href="README.zh-CN.md">简体中文</a></p>
<p align="center">A free browser game of hidden roles, deduction and betrayal for <strong>5–10 friends</strong>. No sign-up or download required.</p>

## Play with friends

1. Enter a nickname and create a room.
2. Share the invite link, room code or QR code.
3. Choose a role preset and start when at least five players have joined.

Use a voice call for remote games, or talk around the same table. Each player needs a private browser screen.

## Features

- Full game flow: team proposals, voting, secret Quest cards, assassination and rematches.
- 17 character types, role presets and optional modules, including Lady of the Lake and Excalibur.
- Mobile and desktop layouts, light and dark themes, seven languages: English, 简体中文, 繁體中文, Русский, Español, Português and Tiếng Việt.
- Encrypted roles and actions, local deduction notes, reconnect support and host handoff.

## Why I made it

I wanted to play Avalon with colleagues and friends at gatherings, but we did
not always have the cards. The online versions I tried had interfaces I found
awkward, required registration, or ran into bugs during play. I decided to try
building my own with AI: open a room and play, without a player account.

[About & support](https://avalon.lorrainewong.dev/support/) ·
[GitHub](https://github.com/LorraineWong) ·
[LinkedIn](https://www.linkedin.com/in/lorrainewongyiting/)

Voluntary support is available on [Ko-fi](https://ko-fi.com/lorrainewong).
Sharing the game, reporting bugs and suggesting improvements are also welcome.
Playing stays free; support gives no gameplay advantages.

## Repository map

```text
site/                      Website source only
  language/                Seven guide languages and all translation dictionaries
  pages/                   Privacy, notices and project support
  assets/                  Scripts, styles and separately licensed images
  config/                  Public App Check settings
  pwa/, meta/              PWA, sitemap, robots and domain metadata
scripts/                   Static publication mapping and packaging
config/                    Deployment/tool configuration
docs/                      Development, game, operations and policies
tests/, dev/               Offline regressions and fake-backend UI preview
firebase/                  Normal and emergency database rules
```

## Local development

Plain HTML, CSS and JavaScript. No framework or runtime package installation.
A dependency-free Node.js script copies the classified sources into the static
publication directory while keeping existing guide and notice URLs stable.

```sh
git clone https://github.com/LorraineWong/avalon.git
cd avalon
node scripts/prepare-site.mjs
python3 -m http.server 4173 --directory dist
```

Open the [offline UI preview](http://localhost:4173/dev/ui-preview.html?state=home&lang=en) to work with simulated players. The regular home page uses the configured live Firebase backend.

Run the automated checks with Node.js:

```sh
node tests/run-all.mjs
```

For Firebase configuration, deployment and multiplayer testing, see the [development guide](docs/development/DEVELOPMENT.md).

## Documentation and contributions

[Documentation index](docs/README.md) · [Contributing](CONTRIBUTING.md) · [Supported rules](docs/game/BIG_BOX_RULES.md) · [Security policy](.github/SECURITY.md) · [Privacy](https://avalon.lorrainewong.dev/privacy/)

Focused pull requests and reproducible bug reports are welcome. For UI issues, include the device, viewport and theme. For game-flow changes, test with isolated player sessions.

## Project notice

An unofficial fan project, unaffiliated with the creators or publishers of _The Resistance: Avalon_. Game names and concepts belong to their respective rights holders. Please support the official board game.

Roles are encrypted between browsers, but the host browser remains trusted. See the [security policy](.github/SECURITY.md) for the threat model and private vulnerability reporting.

<!-- Project-site /avalon/robots.txt is not a host-root robots file. Submit sitemap.xml through Search Console. 项目路径 robots.txt 不是站点根规则；通过 Search Console 提交 sitemap。 -->

Licensing: source code and documentation are under the [MIT License](LICENSE). Images are [not included in that licence](site/assets/LICENSE.md); see [NOTICE](NOTICE) for the full scope. Third-party notices and game rights remain separate.

## Creation credits

Avalon Online is maintained by Lorraine, with development primarily using Claude Code and OpenAI Codex. Site images were generated with GPT. AI assistance does not imply endorsement by Anthropic, OpenAI or the original game publishers. No official board-game card artwork is used.
