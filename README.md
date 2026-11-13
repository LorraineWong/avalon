<img src="assets/brand-mark.svg" width="64" height="64" alt="Avalon Online logo">

# Avalon Online

A free browser game of hidden roles, deduction and betrayal for **5–10 friends**. Create a private room and share the link. No sign-up or download required.

**[Play now](https://lorrainewong.github.io/avalon/)** · [How to play](https://lorrainewong.github.io/avalon/en/) · [简体中文](README.zh-CN.md)

## Play with friends

1. Enter a nickname and create a room.
2. Share the invite link, room code or QR code.
3. Choose a role preset and start when at least five players have joined.

Use a voice call for remote games, or talk around the same table. Each player needs a private browser screen.

## Features

- Full game flow: team proposals, voting, secret Quest cards, assassination and rematches.
- 17 character types, role presets and optional modules, including Lady of the Lake and Excalibur.
- Mobile and desktop layouts, light and dark themes, English and Simplified Chinese.
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
