# ⚔️ Avalon Online · 阿瓦隆在线版

A free, no-sign-up online version of the social deduction board game *The Resistance: Avalon*, for 5–10 players on phone or desktop. Chinese / English UI.

免费、无需注册的在线《抵抗组织：阿瓦隆》，5–10 人，手机电脑都能玩，中英双语。

**Play / 开玩:** https://lorrainewong.github.io/avalon/

## Features / 功能
- Round-table UI with animated role reveal, vote reveal and quest-card flips
- Roles: Merlin, Percival, Loyal Servant, Assassin, Morgana, Mordred, Oberon, Minion; optional Lady of the Lake (7+)
- Correct rules: strict-majority votes, 5 rejected proposals = Evil wins, Quest 4 needs 2 fails with 7+ players, Good can never play Fail
- Roles and actions are end-to-end encrypted (ECDH P-256 + AES-GCM): nobody can read other players' roles from the network
- Refresh / reconnect safe: state lives in Firebase Realtime Database; the host can reopen the link and the game resumes
- Invite link (`…/avalon/#ROOM`), online indicators, game history

## How it works / 技术说明
Static site (GitHub Pages) + Firebase Realtime Database (Singapore region) with anonymous sign-in.
Security rules (`database.rules.json`): only the host can write the game state and secrets; each player can only write their own seat.
The host's browser runs the game engine; each player's key pair lives in their own browser's localStorage.

## Files
- `index.html`, `style.css`, `app.js` — the app
- `database.rules.json` — Realtime Database security rules (deployed in the Firebase console)
- `vendor/firebase-*-compat.js` — Firebase JS SDK v10 (Apache-2.0)

Unofficial fan project. *The Resistance: Avalon* is a trademark of its respective owners.
