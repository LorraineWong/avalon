# Emergency database shutdown / 紧急关闭数据库

**Project / 项目：`lw-avalon` · Database / 数据库：`lw-avalon-default-rtdb`**

Save `firebase/emergency-deny-all.rules.json` and this guide to your phone before an incident. The shutdown file is a standby file: do not publish it during normal operation.

请提前把 `firebase/emergency-deny-all.rules.json` 与本说明保存到手机。关闭规则仅供紧急备用，平时不要发布。

## Stop an incident / 紧急停止

1. Open [Firebase database rules](https://console.firebase.google.com/project/lw-avalon/database/lw-avalon-default-rtdb/rules).
2. Replace the **entire** rules editor with the JSON below and choose **Publish**. This blocks database reads and writes for all clients, including hosts, without deleting stored room data. Existing games will stop syncing.
3. Confirm publication, then check database usage and Authentication activity. Do not upgrade billing to work around attack-induced quota exhaustion.

打开上述规则页面，将编辑器**全部内容**替换成以下 JSON，再点 **Publish／发布**。它会拒绝所有客户端（包括房主）的数据库读写，不会删除已存房间资料，但正在进行的游戏会停止同步。确认发布成功后检查用量与匿名认证活动，不要为了攻击导致的配额耗尽升级计费。

```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

Database rules do not turn off Firebase Authentication or prevent every network request. If anonymous sign-up is being abused too, disable the Anonymous sign-in provider in Authentication → Sign-in method until the incident is resolved. This also prevents legitimate new players from signing in.

数据库规则不会关闭 Firebase Authentication，也不能阻止所有网络请求。如果匿名注册也遭到滥用，可在 Authentication → Sign-in method 暂停 Anonymous 登录；这也会阻止正常新玩家登录。

## Restore / 恢复

After resolving the incident, restore the reviewed `firebase/database.rules.json` from the current `main` branch in the same editor. Never restore public `.read: true` / `.write: true` rules. Test with a fresh host and guest before announcing recovery.

处理完成后，将当前 `main` 分支内审核过的 `firebase/database.rules.json` 恢复到同一编辑器。不要恢复成全公开读写规则。先用新的房主和访客验证，再宣布恢复。

## Deployment configuration / 部署配置

- Keep Firebase on **Spark**. No Blaze upgrade is part of this work.
- The production API key permits the GitHub Pages origin `https://lorrainewong.github.io/*`. Modern browsers commonly send only the origin on cross-origin requests, so restricting it to `/avalon/*` can break sign-in.
- Only Firebase App Check API, Identity Toolkit API and Token Service API are allowed for this key. Origin restrictions are an additional filter, not a replacement for database rules: a non-browser client can spoof a Referer.
- Add the exact new domain after it is purchased, then test anonymous sign-in and token refresh there. Do not add guessed domains or a global wildcard.
- Use the offline preview for localhost development. A separate restricted development key can be configured later if real Firebase development access is needed.

保持 **Spark**，不升级 Blaze。生产 Key 仅允许 GitHub Pages 来源；跨域请求常只发送源地址，所以不应把白名单限定为 `/avalon/*` 而导致登录失效。保留上述三项必要 API。来源限制只是额外过滤，不能替代数据库权限，非浏览器客户端可以伪造 Referer。新域名购入后再加入确切来源并测试。localhost 使用离线预览；需要真实开发后端时再单独配置受限开发 Key。

References / 参考：[Firebase API keys](https://firebase.google.com/docs/projects/api-keys), [Google Cloud referrer restrictions](https://cloud.google.com/docs/authentication/api-keys).
