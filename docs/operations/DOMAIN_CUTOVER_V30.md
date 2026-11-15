# 新域名切换与验收 v30

准备日期：2026-11-15。负责人要求继续迁移，已明确确认旧站没有进行中的游戏。
本文件先保留切换前候选与计划，实际执行结果见下一节；不要把候选测试当作生产验收。
当前生产基线为 PR #27 合并后的 `abff2e8`，运行资源仍为 v29。


## 旧游戏入口退役（v31，2026-11-15 马来西亚时间）

负责人追加要求“全面迁移”，关闭旧游戏网址，统一推广 `playavalonnow.com`。
这条指令取代此前等待旧站永久跳转批准的安排。08:24 UTC（16:24 马来西亚时间）
已将同一条 Cloudflare 规则由 302 改为 **301 永久跳转**，名称改为
`Avalon old host to playavalonnow - permanent`；精确 host、路径与 query 保留不变。
实际 TLS 请求已返回 301，并指向新域名的对应路径/query。

GitHub 仓库 About 官网字段已保存为 `https://playavalonnow.com/`，简介中的
seven languages 已改为 nine languages。站内、README、分享资料和 sitemap
此前已统一新域名，不再将旧网址作为游戏/推广入口。

后台已保存并复核：Firebase Auth domains 移除旧 host；Browser key referrers
移除 `https://avalon.lorrainewong.dev/*`；现有 reCAPTCHA key domains 移除旧 host。
新主域名和既有 GitHub 来源均保留，Firebase 默认 Auth host/localhost 未改，
API 三项限制、域名验证、App Check enforcement、阈值、规则与 Spark 不变。
没有删除用户或房间，没有撤销全部用户凭据。已签发 token 的存续不能等同于
新授权清单立即撤销所有旧会话；旧离线 PWA 也不会被远程卸载。

v31 前端精确主机清单不再允许旧 host，测试将旧 host 列入拒绝项；资源 query
和 worker cache 同步升至 v31。它只收紧旧来源并更新缓存，不修改玩法或新站授权。
新站仍由 GitHub Pages 承载；旧 DNS/免费边缘证书只保留承接老链接，不承载游戏。
直接删除旧 DNS 会让老链接失效，因此保留永久跳转。

下列 v30 五人/真机检查是迁移时的历史证据；本次版本/退役配置的检查记录在对应 PR。
后续推广和全部对外官网链接一律采用新主域名；未由此发送社交帖子、购买广告或开通付费服务。

## 实际执行结果（2026-11-15 UTC）

负责人在查看 PR #28、变更范围、验收和回滚方案后明确回复“批准”。
随后确认“手机可以正常创建并退出房间”。旧站无进行中游戏的确认在切换前取得。

- [PR #28](https://github.com/LorraineWong/avalon/pull/28) 已 squash 合并，运行版本 v30；
  main `d75c9bc55c6fe4fa338ea2ae9f0cdb2891dc8bad`。
  [Pages 发布](https://github.com/LorraineWong/avalon/actions/runs/43692205472)、
  [main 离线检查](https://github.com/LorraineWong/avalon/actions/runs/43692205561)
  和独立 Workers Build 均成功。140 个非隐藏发布文件与当时本地产物逐一一致。
- GitHub 已验证 `playavalonnow.com` 所有权；实际 TXT 留在 Cloudflare。
  Auth domains、Browser key HTTPS referrer、现有 reCAPTCHA key domain list
  精确增加新主机，保存后复核；保留旧值。API 仍仅 App Check、Identity Toolkit、
  Token Service；domain verification 开启，Spark、规则、enforcement、TTL/阈值不变。
- Pages 正式入口为 `https://playavalonnow.com/`。四条 A、四条 AAAA 和
  `www CNAME lorrainewong.github.io` 均 DNS-only。GitHub 证书覆盖 apex/www，
  approved，到期日 2027-02-13；Enforce HTTPS 已开启。普通 TLS 校验的 apex 返回 200，
  www 返回 301 到 apex。约 07:56 UTC 开始切换，08:02 UTC HTTPS 正常，未触发回滚。
- 旧 `avalon` CNAME 目标和 TTL 保持不变，仅此主机改为代理。免费重定向规则
  `4a0ca5395d0a4d0d9fddd1faf7aa207a` 已启用：
  `(http.host eq "avalon.lorrainewong.dev")`，动态目标
  `concat("https://playavalonnow.com", http.request.uri.path)`，保留 query，302。
  `.dev` apex 与两条原 TXT 未改。当时先启用 302，随后按上方追加指令改为永久 301。
- 执行机器上的五个独立普通桌面浏览器资料均取得真实 token（交换状态五次 200），
  匿名身份建房/加入、加密私密角色发放、房主重连、原子移交、组队投票、三次任务、
  刺杀至终局/公开结果、玩家重连及五人返回重开大厅通过，共 13 项记录。
  同一合法身份的数据库请求：无 App Check 401、有 token 200。
  临时房间删除已核验，五个临时账号已删除；其他尝试未创建游戏房间，
  自动化创建的账号也执行了清理。正常 Chrome 单人验收房间已退出关闭。
- 浏览器验证四种入口（旧 HTTPS、旧 HTTP、www、GitHub `/avalon/`）的原路径、
  query、hash；四种实际 legacy 页面 `/ja/index.html`、`/privacy/index.html`、
  `/support/index.html`、`/unofficial-notice/index.html` 到对应命名页通过。
  legacy 页面会将 `lang` 转入语言路径，hash 仍保留；没有跳转循环。
- 新 origin v30 worker 实际控制页面、42 项 shell 缓存，英/日/韩 About 正文离线通过。
  原有隔离 v29 profile 离线仍可读旧页；恢复网络后旧 worker 导航能跟随迁移并保留
  query/hash；同一 profile 在新 origin 取得独立 v30 controller/cache。
- 负责人用真实手机确认可创建并退出房间。未报告手机型号、浏览器、网络地区，
  因而不把这项当作指定大陆/海外网络或真机多人扫码联机的证据。

### 尚未完成与测试限制

自动化临时/部分独立资料收到 App Check 403 `App attestation failed`，SDK 随后
对该资料显示 24 小时退避。未降低阈值、关闭 enforcement、注册 debug token、
修改浏览器指纹或扩大预览授权。普通资料曾有五次成功，手机也通过；
失败与成功的差异不能据此确定为配置传播、字体阻断或具体风险分数原因。
[Firebase 文档](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
说明自动化/CI 等环境可能不被生产 provider 判为有效。本轮仍按实际结果登记，
不把 403 直接归因于真实玩家或声称已经解释其全部原因。

五人流程第二局已启动且至少一个客户端收到新私密角色，但第二局翻牌自动点击
等待可见/稳定超时，未证明五个客户端都完成第二局翻牌。之后补查因新自动化资料
在 token 阶段被拒而未能补齐。独立 14 项实时安全脚本也在取得 token 前被拒，
未执行其断言；不要将它标为通过。上面的同身份有/无 token 对照与既有规则未修改
是单独的实际证据，不能替代全部权限攻击场景。

待补：第二局五客户端完整 UI、手机多人邀请/真实扫码、指定网络/弱网覆盖和实际
安装 PWA 的启动体验。推广入口已按负责人追加指令统一新域名；不得把未完成测试
改写为通过，也不声称已测并发容量。旧站永久跳转执行状态见上方追加记录。
监控、分析与站长工具仍按后续批次推进，未为迁移新建收费服务。
GitHub 控制台在签发证书时曾保留 DNS 检查失败提示；后续 UI 刷新未能取得结果，
因此不声称该面板已变绿。已独立核对公开 A/AAAA/CNAME、apex/www 证书、强制 HTTPS、
正常 TLS 的发布文件及真实联机；这是分别记录的证据。

## 切换前候选档案（以下保留当时状态）

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
