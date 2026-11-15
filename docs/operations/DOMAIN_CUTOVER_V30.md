# 新域名切换候选 v30

准备日期：2026-11-15。负责人要求继续迁移，已明确确认旧站没有进行中的游戏。
本文件记录可审阅的候选改动和执行顺序，**不是新域名已上线的证明**。
当前生产基线为 PR #27 合并后的 `abff2e8`，运行资源仍为 v29。

## 当前候选改动

- `playavalonnow.com` 为唯一正式主域名，www 只跳转；公开路径保持不变。
- 同步首页、九语言源页面、36 个命名页、37 条 sitemap、robots、CNAME、
  README、canonical、hreflang、OG/Twitter 分享地址及 VideoGame 数据。
- 命名页分享标题/摘要采用对应语言，补齐分享 URL，避免 About/政策页沿用
  其他语言或页面的分享地址。未改可见正文结构与游戏布局。
- 首页 seven languages 改为 nine languages，VideoGame 的 inLanguage 补全日/韩。
- 前端 App Check 精确主机增加新域名，保留旧自定义域名与 GitHub；
  不许可 www、任意子域名、Cloudflare 预览、localhost 或调试 provider。
- 资源 query 与 Service Worker cache 一起更新到 v30。Firebase 的 authDomain、
  数据库 URL、项目、规则、provider/key/TTL/阈值与计费均保持原值。

源码许可新 host 不代表已完成后台授权。PR 在后台配置、维护窗口和发布获明确
批准前保持未合并；预览不使用生产后端创建房间。

## 准备状态

工作分支从干净的 `abff2e8` 开始，未新建 worktree。GitHub 已申请新 `.com` 的
ownership challenge，尚未写 TXT 或点击验证。具体实际记录保留在本次工作输出
中，不编造值。旧正式入口仍为 `avalon.lorrainewong.dev`，尚未修改生产配置。
离线和浏览器候选检查的最终结果记录在 PR，模拟与真实生产验收分开。

本地候选检查：21 个离线套件和首方脚本语法检查通过；九语言、明暗主题、
320/1440px 的首页/模拟大厅及四类公开页共 216 项浏览器检查通过，无页面错误或
横向溢出；36 组模拟大厅的复制邀请与二维码 payload 一致。
外部字体被拦截，使用系统字体回退；没有生产 Firebase 请求，不是实网或真机联机验证。

## 待批准的具体后台差异

| 设置 | 当前值 | 计划变化 |
| --- | --- | --- |
| GitHub ownership | `.dev` Verified，`.com` pending TXT | 添加实际 challenge 的精确 TXT 后验证，保留原 TXT |
| Firebase Auth domains | localhost、两个 Firebase 默认 host、旧自定义域名 | 仅新增 `playavalonnow.com`，保留原值 |
| Browser key referrers | 两个旧精确主机的 HTTPS 路径 | 仅新增 `https://playavalonnow.com/*`，三项 API 限制不变 |
| reCAPTCHA Web key domains | 旧自定义域名、GitHub 主机 | 仅新增 `playavalonnow.com`，域名验证仍开启，不切测试模式 |
| Pages Custom Domain | `avalon.lorrainewong.dev` | 准备授权及候选检查通过后改为 `playavalonnow.com` |
| `.com` apex A | 无 | GitHub 四个官方 IPv4 地址，DNS-only |
| `.com` apex AAAA | 无 | GitHub 四个官方 IPv6 地址，DNS-only，配合 A |
| www CNAME | 无 | `lorrainewong.github.io`，DNS-only，检查自动跳转与证书 |
| 旧 `avalon` CNAME | GitHub、DNS-only、TTL 自动 | 仅此主机改为代理，用免费边缘规则承接旧 HTTPS 跳转 |
| 旧站 Redirect Rule | 0/10 | 精确 host，新域名+原 path，保留 query；先 302，验收后再决定 301 |

GitHub 地址值和完整回滚见 [迁移计划](DOMAIN_MIGRATION_PLAN.md)。
不修改个人站 apex、既有 TXT、DNSSEC、账单、enforcement、阈值、令牌权限或数据库规则。

## 执行与验收顺序

1. 获得上述配置差异、候选 PR 发布和维护窗口的明确批准。
2. 先验证域名所有权并新增后端精确授权，逐步核对保存结果，保留旧值。
3. 执行前再确认 main 无新变动、候选检查通过、无需要保留的旧站游戏。
4. 合并候选、协调 Pages Custom Domain 与新 DNS，等待正常 TLS，开启 HTTPS。
   Pages 单站只有一个自定义域名，可能短时中断，不承诺无缝。
5. 测试新域名真实 token、匿名身份、权限及五个独立客户端完整游戏流程，清理临时数据。
   真机/指定网络未完成时单列待办，不用桌面模拟冒充真机。
6. 新站可用后启用旧站 302，核对首页/命名页/legacy 路径、query/hash、邀请与原 PWA profile。
   GitHub 项目旧路径也需实测，curl 不能单独证明 hash 正确。
7. 稳定且完成验收后，再确认旧站永久跳转，避免错误 301 难以立即撤回。

建议最多 15 分钟的初始切换尝试；超时仍不能正常 TLS 或核心身份/数据库失败时
停止推进并恢复旧站。游戏测试与稳定观察可能更久，15 分钟不是完整迁移时长承诺。

## 回滚包与限制

执行前保存 Pages API、旧/新 DNS、代理状态/跳转规则及三处后端域名授权前值。
只保存必要非秘密配置，不导出玩家、角色或私钥。

出错先关旧→新跳转，再恢复 Pages 旧域名及旧 DNS/代理值，核验证书；
代码已发布则用 revert PR 恢复旧 URL，并发全新 cache/asset 版本。
不复用 v29/v30 cache 冒充更新，不产生双向跳转。
新域名解除 Pages 绑定后不能留下无人承接的悬空网站记录。

跨域身份、房主密钥、笔记和旧安装 PWA 不会自动搬迁。旧安装离线时不能取得
服务器跳转，迁移不能恢复旧房间密钥；负责人已确认旧站无进行中游戏。

**真实新域名的 HTTPS、联机、旧链接与缓存验收尚未执行；候选离线通过不能代替这些结果。**
