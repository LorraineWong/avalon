<p align="center"><img src="assets/brand-mark.svg" width="80" height="80" alt="Avalon Online"></p>
<h1 align="center">Avalon Online</h1>
<p align="center"><strong><a href="https://lorrainewong.github.io/avalon/">Play Now</a></strong> · <a href="https://lorrainewong.github.io/avalon/en/">How to Play</a> · <a href="docs/README.md">Documentation</a> · <a href="README.zh-CN.md">简体中文</a></p>
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

## Local development

Plain HTML, CSS and JavaScript. No build step or package installation.

```sh
git clone https://github.com/LorraineWong/avalon.git
cd avalon
python3 -m http.server 4173
```

Open the [offline UI preview](http://localhost:4173/dev/ui-preview.html?state=home&lang=en) to work with simulated players. The regular home page uses the configured live Firebase backend.

Run the automated checks with Node.js:

```sh
node tests/run-all.mjs
```

For Firebase configuration, deployment and multiplayer testing, see the [development guide](docs/DEVELOPMENT.md).

## Documentation and contributions

[Documentation index](docs/README.md) · [Supported rules](docs/BIG_BOX_RULES.md) · [Security policy](.github/SECURITY.md) · [Privacy](https://lorrainewong.github.io/avalon/privacy/)

Focused pull requests and reproducible bug reports are welcome. For UI issues, include the device, viewport and theme. For game-flow changes, test with isolated player sessions.

## Project notice

An unofficial fan project, unaffiliated with the creators or publishers of *The Resistance: Avalon*. Game names and concepts belong to their respective rights holders. Please support the official board game.

Roles are encrypted between browsers, but the host browser remains trusted. See the [security policy](.github/SECURITY.md) for the threat model and private vulnerability reporting.

<!-- Project-site /avalon/robots.txt is not a host-root robots file. Submit sitemap.xml through Search Console. 项目路径 robots.txt 不是站点根规则；通过 Search Console 提交 sitemap。 -->

Licensing: no project-wide open-source licence has been selected. Third-party notices and game rights remain separate.

## Creation credits

Avalon Online is maintained by Lorraine, with development primarily using Claude Code and OpenAI Codex. Site images were generated with GPT. AI assistance does not imply endorsement by Anthropic, OpenAI or the original game publishers. No official board-game card artwork is used.
