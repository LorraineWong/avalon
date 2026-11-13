# Security policy

## Report privately

Use [GitHub private vulnerability reporting](https://github.com/LorraineWong/avalon/security/advisories/new). Include reproduction steps, affected version, browser and impact. Do not publish secrets or other players’ room data. Contact email: `CONTACT_EMAIL_TODO` (not active yet).

## Trust boundary

Firebase Anonymous Authentication identifies clients. Database rules restrict host writes and player-owned seats. Browser ECDH P-256 and AES-GCM encrypt roles and actions. The host browser remains trusted; compromised hosts, modified clients and malicious hosting-origin code are outside this protection. Host handoff requires explicit re-encryption; unexpected takeover is unsupported.

## Configuration

The Firebase web API key is a public client identifier, not an authorization secret. Authentication and database rules enforce access. Restrict keys to required Firebase APIs and deployment origins. Review App Check before enforcement. Cloud Console restrictions and production configuration must be verified by the maintainer; repository text is not evidence of current deployed settings.

## Checks

`node tests/run-all.mjs` runs offline checks. `node tests/run-all.mjs --live` also creates temporary Firebase test users and a room, verifies allowed/denied operations and cleans them up. Run live checks only against an authorized project.

---

# 安全政策

## 私密报告

请使用 [GitHub 私密漏洞报告](https://github.com/LorraineWong/avalon/security/advisories/new)，提供复现步骤、版本、浏览器与影响。不要公开密钥或其他玩家的房间资料。联系邮箱：`CONTACT_EMAIL_TODO`（尚未启用）。

## 信任边界

Firebase 匿名认证识别客户端，数据库规则限制房主写入及玩家自己的座位。浏览器使用 ECDH P-256 与 AES-GCM 加密身份和行动。房主浏览器仍受信任；被入侵的房主、主动修改的客户端和托管源恶意代码不在保护范围内。转移房主需要明确重新加密，不支持意外自动接管。

## 配置

Firebase 网页 API Key 是公开项目标识，不是授权秘密。权限由认证与数据库规则控制。应限制 Key 的 API 与部署来源，并在强制启用前评估 App Check。云控制台限制与生产配置需维护者实际核验，仓库文字不证明当前线上设置。

## 检查

`node tests/run-all.mjs` 仅运行离线检查。加上 `--live` 会创建临时 Firebase 测试用户和房间、验证访问规则并清理数据。仅在获授权的项目运行线上测试。
