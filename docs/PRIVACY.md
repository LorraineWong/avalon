# Privacy Notice

Last updated: 14 November 2026

Avalon Online is a free, unofficial fan project. It does not require an email address or a registered player account.

## Data used to run a game

The site uses Firebase Anonymous Authentication and Realtime Database. It processes:

- a randomly generated anonymous Firebase user ID;
- the nickname a player chooses;
- room membership, connection presence, and public game state;
- encrypted role and action payloads needed for multiplayer play.

The browser stores the player's role-decryption private key, nickname, language preference, last room code, and private deduction notes in `localStorage`. Private notes are not uploaded to Firebase or shared with the host or other players. Anyone with access to the same device and browser may still see them. Players can clear notes for the current game from the notes panel or remove the site's browser data. Do not put sensitive information in notes or use it as a nickname.

Rooms created by current versions carry a 72-hour expiry marker. Completed games use a 24-hour marker. When the host reconnects to an expired room, the host client removes the room data. Old data may also be deleted during maintenance; expiry is not a guaranteed archival or deletion service.

The site does not contain advertising trackers and does not sell player data. Firebase and the web-font provider may process necessary network information, such as IP addresses, under their own privacy policies.

## Security and contact

Role and action payloads are encrypted in the browser, but the host browser remains trusted to run the game. Do not use the service for sensitive information.

Report privacy or security issues privately through the repository's **Security → Report a vulnerability** feature. Do not include another player's room data in a public issue.

## Services, storage and policy updates

Realtime Database is hosted in Asia Southeast (asia-southeast1). Fonts are served by Google Fonts (fonts.googleapis.com and fonts.gstatic.com). These providers may process IP addresses and necessary service data under their own policies.

The application code contains no analytics or advertising trackers and does not itself set cookies. Site preferences and notes use localStorage; Firebase may additionally use browser storage for authentication. This statement does not guarantee that hosting or third-party services never use cookies.

This policy may be updated; the last-updated date reflects changes. For private security reports use GitHub Security.

---

# 隐私说明

最后更新：2026 年 11 月 14 日

Avalon Online 是免费的非官方粉丝作品，不要求邮箱或正式注册账号。

网站使用 Firebase 匿名登录与 Realtime Database 来处理随机生成的匿名账号 ID、玩家昵称、房间成员与在线状态、公开游戏状态，以及多人游戏所需的加密身份和行动资料。

浏览器会在 `localStorage` 中保存身份解密私钥、昵称、语言偏好、上次房间号和私人推理笔记。私人笔记不会上传 Firebase，也不会分享给房主或其他玩家；但能使用同一设备和浏览器的人仍可能看到它们。玩家可以在笔记面板清空本局笔记，或清除网站的浏览器资料。请不要在昵称或笔记中填写敏感资料。

当前版本创建的房间带有 72 小时有效期标记；已结束的游戏使用 24 小时标记。房主再次连接到过期房间时，房主客户端会删除房间资料。维护期间也可能删除旧资料；有效期不构成保证归档或准时删除的服务。

网站不包含广告追踪器，也不会出售玩家资料。Firebase 与网页字体服务可能根据各自政策处理 IP 地址等必要网络资料。

如需报告隐私或安全问题，请使用 GitHub 仓库 **Security → Report a vulnerability** 的私密报告功能，不要在公开 Issue 中附上其他玩家的房间资料。

## 服务、存储与政策更新

Realtime Database 位于亚洲东南区（asia-southeast1）。字体由 Google Fonts（fonts.googleapis.com 与 fonts.gstatic.com）提供；服务商可能按其政策处理 IP 地址等必要服务资料。

应用代码不含分析统计或广告追踪，也不自行设置 Cookie。偏好和笔记使用 localStorage；Firebase 还可能使用浏览器存储保存登录状态。这不代表托管平台或第三方服务绝不使用 Cookie。

政策可能更新，变更以最后更新日期为准。私密安全报告请使用 GitHub Security。
