# Phase 1：域名迁移审计与执行计划

> Current status (15 November 2026): the only game URL is https://playavalonnow.com/. The old game host serves a permanent 301 only; its backend permissions have been retired. Earlier sections below are dated history, not current setup instructions. See [the cutover record](DOMAIN_CUTOVER_V30.md) and [owner handbook](OWNER_HANDBOOK_ZH.md).

审计日期：2026-11-15（马来西亚时间）。目标域名为
`https://playavalonnow.com/`。负责人已确认：该地址是唯一正式入口，
`www.playavalonnow.com` 只跳转到它，旧域名在迁移验收后保留跳转。
这项方案确认不等于批准修改 DNS、安全设置、合并 PR 或切换生产。

**当前关卡：Batch 0 的仓库、公开网络及关键后台审计和迁移计划已完成，待负责人验收；
尚未批准进入配置变更或生产切换。新域名未上线。账户安全自查保留待办。**

本文件区分本轮实测、历史记录和未验证项。后续分批状态见
[Phase 1 追踪表](PHASE1_TRACKER.md)，中文日常操作见
[负责人手册](OWNER_HANDBOOK_ZH.md)。

## 1. 当前真实状态

| 项目 | 本轮证据与结论 |
| --- | --- |
| Git 基线 | `main` 为 `70ce8fd4c6b33ba3fc2fc27a9269c511909cd657`，v29，PR #26；审计前工作区干净，已快进同步，在独立分支准备本批交付 |
| 正式托管 | GitHub Pages API 返回 `build_type=workflow`、`status=built`，正式域名仍是 `avalon.lorrainewong.dev` |
| Pages 发布 | [43676595586](https://github.com/LorraineWong/avalon/actions/runs/43676595586) 成功，对应上述 SHA |
| 自动检查 | [43676595578](https://github.com/LorraineWong/avalon/actions/runs/43676595578) 成功；本机 Node 24 的 20 个离线套件及 16 项语法检查通过；未运行 `--live` |
| Workers | 同 SHA 检查成功，构建 `d4307197-fe64-4ad4-a267-2169b762a816`；后台为 v29、100% 就绪，只有 workers.dev 地址，无自定义域名/路由、无绑定；不是正式站托管已切换的证据 |
| 发布内容 | 旧正式域名的 134 个非隐藏发布文件与 v29 本地产物逐字节一致；比对未包含 `.nojekyll` 标记 |
| 旧站 HTTPS | 正常校验证书的 HTTPS GET 为 200；HTTP 为 301 到 HTTPS；Pages API 为 `https_enforced=true`，证书 approved，记录到期日 2027-02-12 |
| 旧站 DNS | 后台和公开解析均确认 `avalon.lorrainewong.dev` CNAME → `lorrainewong.github.io`，DNS-only、TTL 自动；旧 zone 共 3 条记录，另外两条为现有验证 TXT，均保留；apex 无网站地址记录 |
| GitHub 原入口 | `/avalon/how-to-play/ja/?lang=ja` 实际返回 301 到旧正式域名的对应路径，并保留查询字符串；此请求不验证浏览器 hash |
| 新域名 DNS | Cloudflare 为 Active / Free，DNS 列表 0/200；权威服务器为 `vera.ns.cloudflare.com` / `trevor.ns.cloudflare.com`；权威查询 apex A/AAAA 无记录，www A 为 NXDOMAIN；本机无法解析为可访问的网站 |
| 旧站跳转条件 | 旧 zone 单一跳转规则为 0/10；Universal SSL 对 `*.lorrainewong.dev` / apex 有效，显示到期 2027-02-12。边缘证书覆盖旧 host，但当前 DNS-only 不经该边缘；启用后仍须正常 TLS 实测 |
| GitHub 所有权 | 账户 Pages 已验证列表仅有 `lorrainewong.dev`；新 `.com` 尚未申请/验证，DNS 列表也没有新域名 challenge |
| 注册与 DNSSEC | Verisign RDAP 显示域名已注册、`client transfer prohibited`，到期 2027-11-15；`delegationSigned=false`，公共 DS 查询无记录。没有证据证明已启用完整 DNSSEC 链；注册商锁状态不等于账户 2FA/续费设置已核实 |
| Firebase 方案 | 在已登录的 Firebase Console 本轮直接看到 Spark、No cost ($0/month) |
| App Check 注册 | 本轮 Console 的 `avalon-web` 显示 Fraud Defense、Registered；公开 key 与源码相同，TTL 1 小时、阈值 0.5、Essentials；未改任何值。注册状态不能代替新域名 token 测试 |
| Auth | Anonymous Enabled；授权域名为 `localhost`、`lw-avalon.firebaseapp.com`、`lw-avalon.web.app`、`avalon.lorrainewong.dev`，尚无新 `.com`。该 authorized-domains 列表与匿名请求/API key 限制作用不同，不能相互替代 |
| 浏览器 API key | Websites 限制为 `https://avalon.lorrainewong.dev/*` 与 `https://lorrainewong.github.io/*`；仅限 Firebase App Check API、Identity Toolkit API、Token Service API；无新域名、无新增 API |
| reCAPTCHA | 现有 Website / Score key 域名为旧自定义域名与 GitHub host；Disable domain verification 为 off，AMP off，无新 `.com`；没有点击 Reveal 或复制秘密 key |
| 数据库保护 | 本轮直接确认 RTDB Enforced、Authentication Monitoring；Rules 页面关键读写/验证表达式与仓库正常规则人工核对一致（含 seats/secret/online 权限），并非机器逐字节规则导出比对 |
| 用量快照 | RTDB 面板选择 Nov 8–Nov 15 / Last 7 days：连接峰值 14、下载 27.67 MB、当前存储 309.78 KB、load 峰值 1%；规则允许约 6k、拒绝 174。拒绝数不等于真实玩家失败率或攻击证据 |
| 验证用量 | Fraud Defense 项目面板本月 58 assessments、预测 118；该 key 详情为 57/预测 114，口径/更新时间不同，不混用，不据此声称已设置自动预警 |
| 多语言与 SEO | 36 个命名内容页的 canonical 均匹配当前旧域名，sitemap 37 条；切换时须一起更新，不能只改 CNAME |
| 过时文案 | 首页 description/OG description 两处仍称 seven languages；README 目录说明、文档索引和部分维护说明也有旧表述；仓库 description 也显示 seven languages。历史发布记录保留当时语言数，不盲目全局替换 |
| 静态依赖 | Firebase SDK、二维码脚本本地托管；13 个 HTML 源文件引用外部 Google Fonts；App Check 和 Firebase 身份/数据库请求仍是外部 Google 服务 |
| PWA | v29 worker；同一隔离 profile 的 v28→v29 更新、日/韩 About 离线正文及刷新检查通过。历史 v27→v28 超时原因未定，不能改写为通过；这是旧域名测试，不证明新域名 PWA 正常 |
| 邀请链接 | 复制、分享和二维码使用 `location.origin + location.pathname + '#' + code`；因此正常在新站开房会生成新域名链接。语言查询参数目前不包含在生成链接中，不在本批擅自改变行为 |
| 分析/监控 | 本轮代码审计未发现已接入的访问分析 beacon 或运营事件统计；外部监控、站长工具、Cloudflare 自动注入分析的账户配置未核实，不能认定已启用或未启用 |

原始只读证据保留在本次工作输出目录 `avalon-phase1/outputs`：
`github-pages.json`、`github-checks.json`、`public-audit.json`、
`domain-authority.json`、`live-v29-publication-baseline.json`、
`source-audit.json`、`offline-baseline.txt`、`console-observations.json`。
后者是本轮 UI 观察的无秘密摘要，不是后台 API 导出。原始账户调试记录不提交仓库。
公开探测来自执行机器，网络出口地区未验证，不代表马来西亚或中国大陆实测。

### 后台审计与待执行配置分界

Firebase CLI 用现有登录查询项目返回 401，未刷新或导出凭据；负责人随后登录了
Chrome 后，浏览器控制工具一度报 ScreenCaptureKit `-3812`；重试恢复后已读到
上表的关键后台配置，相关查看表单均关闭/取消，没有保存。CLI 登录本身未修改。
以下“完成标准”是 Batch 1 执行/复核要求，不把尚未创建的配置算作审计故障。
无需新增管理员、导出令牌、私钥或截图中的敏感信息。

| 后台 | 本轮观察 | 后续执行/复核标准 |
| --- | --- | --- |
| Cloudflare 新域名 | 已核：Active/Free、0 DNS；公开链未签 DNSSEC | 执行前再读规则/冲突记录；按批准清单创建 TXT/网站地址记录，DNSSEC 另行自查 |
| Cloudflare 旧域名 | 已核：DNS-only CNAME、0/10 跳转、有效边缘证书 | 切换前复核前值；只改 `avalon`，不动个人站 apex；上线后实测 edge HTTPS |
| GitHub 账户 Pages | 已核：仅旧 `.dev` Verified | 批准后申请新域名，取真实 TXT challenge；购买/NS 委派不等于 ownership verification |
| Firebase Authentication | 已核：Anonymous Enabled、现有四个授权域名 | 批准后新增 `.com`，保留旧值；不读取真实用户资料 |
| Google Cloud Credentials | 已核：两个精确 host referrers、三项 API | 批准后只加新 host referrer；保持 API 列表，不展示 key 值 |
| reCAPTCHA / Fraud Defense | 已核：两个旧 host、域名验证开启、同一项目/key | 批准后只加新域名；不创建 key、不调整阈值或切换测试模式 |
| Firebase App Check | 已核：provider、TTL、阈值、Enforced/Monitoring | 新 origin 真实 token 成功还未测；不能用旧站注册代替 |
| RTDB / 用量 | 已核：规则关键表达式、Usage 面板快照 | 真实权限/游戏测试留到新站阶段；不浏览房间、昵称、角色密文 |
| 账户安全 | 注册商锁、续费、2FA/恢复方式 | 由负责人核对；不变更支付或认证凭据 |

## 2. 执行责任与批准边界

**Codex 可立即完成：**只读网络/部署/源代码审计、准备分支与 PR、离线测试、
生成迁移文件清单、回滚清单、测试方案和手册；在本地准备未来变更但不发布。
本批不修改运行代码、正式 URL、后台授权或 DNS。

**Cloudflare 需要负责人操作或逐项明确批准：**GitHub 验证 TXT、新域名 apex/www
记录、仅旧 `avalon` 主机的代理与跳转规则、可能的 DNSSEC 变更。
现有 NS 不需要因迁移而更换。初期新站继续 GitHub Pages、DNS-only。

**Firebase / Google Cloud 需要负责人操作或逐项明确批准：**添加精确的新域名
Auth 授权、浏览器 key referrer、现有 reCAPTCHA key 的域名列表；所有更改先记录
前值。不修改已部署数据库规则、计费、App Check enforcement、TTL 或分数阈值。

**另行批准：**PR 合并/发布、GitHub Pages Custom Domain、旧站正式跳转、
站长工具账户授权、分析脚本启用、游戏事件采集。准备 PR 不代表这些操作已获批准。

## 3. 成本与推荐架构

推荐保留 GitHub Pages + Firebase + Cloudflare DNS。新 apex 与 www 由 Pages
提供 HTTPS，www 重定向到 apex；旧自定义域名由 Cloudflare 免费 Redirect Rule
承接。旧站跳转用精确 host 匹配，不能把个人站或其他子域名全部重定向。

| 项目 | 新增固定费用目标 | 限制与处理 |
| --- | --- | --- |
| Pages 自定义域名/HTTPS | RM0 | 沿用公开仓库和现有 Actions；证书签发/传播需等待，不承诺无缝切换 |
| apex、www DNS | RM0 | 不购买域名或套餐；已有 `.com` 后续续费仍由负责人管理 |
| Cloudflare 旧站跳转 | RM0 | 官方 Free 计划 Single Redirects 每 zone 10 条；须确认当前可用名额。需代理旧主机，不能把 DNS-only 当成边缘跳转 |
| Firebase | RM0 新固定月费 | 保持 Spark；RTDB 官方上限目前为 100 同时连接、1 GB 存储、10 GB/月下载；是配额，不是实测容量 |
| App Check / reCAPTCHA | 不新增订阅/计费账户 | 本轮后台为 Essentials，项目本月 58 assessments；当前官方 pricing 列出每月免费 10,000 次（组织合计），不把项目数当成组织总用量 |
| 分析和故障监控 | Batch 3 选型目标 RM0 | 先核对已有配置、免费限制、邮件与隐私影响，不先注册或开通付费试用 |

不建议启用付费替代方案。本计划不要求产生额外费用。若将来提出超出免费额度的
reCAPTCHA Premium，目前官方价为 10,001–100,000 次每月 USD8，之后每千次 USD1，
且需要有效计费方式；这里只说明风险，不开通。保持现有免费边界，额度不足时
先暂停推广和排查滥用，不通过降低安全标准处理。

## 4. Batch 1 具体顺序

以下是待批准的执行计划，不是已执行记录。

### Gate A：补齐审计、取得准备配置的批准

1. 复核第 1 节已记录的 DNS、Pages、key/referrers、Auth、reCAPTCHA 与 App Check
   前值，确认自审后未被其他维护改变。由负责人确认切换时没有需要保留的活跃游戏，
   不读取房间内容来猜测；账户安全待办由负责人自查。
2. 负责人验收 Batch 0，并批准具体的“准备配置”清单。首先只处理 ownership TXT
   和新域名精确授权，**不改 Pages 正式入口、现有站点 DNS 或启用跳转**。
3. 在 [GitHub 账户 Pages](https://github.com/settings/pages) 添加并验证
   `playavalonnow.com`，使用 GitHub 实际提供的 TXT 名称和值；保留 TXT。
   不提前把未认领的站点地址指向 Pages，也不使用通配 DNS。
4. Firebase Auth authorized domains 添加 `playavalonnow.com`；浏览器 API key
   referrer 添加 `https://playavalonnow.com/*`；现有 reCAPTCHA Web key 域名列表
   添加 `playavalonnow.com`。保留必要旧授权，不修改 API restrictions。
   www 只负责跳转，不运行游戏，默认不额外给它后端授权；服务本身的子域名继承
   行为应按后台实际规则核对，不把它说成精确主机隔离保证。
5. 暂不修改 `FIREBASE_CONFIG.authDomain`：它是 Firebase 的配置值，不应随网站
   canonical 域名机械替换。App Check 原 key/provider 可沿用，不因换域名重建。

### Gate B：本地候选版本与迁移 PR

1. 添加新 host 到 `site/config/app-check.js` 的精确 `allowedHosts`，保留必要旧 host。
   更新对应行为测试，验证未知 host 仍不会激活。只有前端 allowlist 不能证明后台授权成功。
2. 一起修改 `scripts/content-pages.mjs` 的正式 origin、首页与九语言源页面 metadata、
   `site/meta/CNAME`、robots、sitemap、README/中英文说明和相关测试中的当前正式 URL。
   保留带日期的历史上线记录。不要修改 Firebase 数据库 URL、Git remote 或支持链接。
3. 修正当前 seven languages 文案，保留中文/日文/韩文等现有正文和页面结构。
   检查 canonical、hreflang、OG/Twitter、VideoGame JSON-LD、社交图 URL；
   36 个命名页加首页仍为 37 条 sitemap。保留 legacy 路由。
4. 更新与运行资源相符的全套 asset/cache 版本。执行时从最新 main 确认下一个版本，
   不固定假定为 v30，避免与其他维护冲突。manifest 相对 start_url/scope 可保留，
   但要测试新 origin 安装；旧 origin 的 PWA 不会自动变成新 origin 安装。
5. 跑完整离线套件、打包、九语言/双主题/320px 与桌面布局、复制/分享/二维码检查。
   浏览器模拟与生产测试分别记录；用本地假后端完成可独立验证的部分。
6. 在负责人明确批准之前，不合并该迁移 PR；也不修改 Pages Custom Domain。

### Gate C：批准切换窗口，准备新域名与旧入口承接

GitHub Pages 每个站点只有一个自定义域名。无法假设同一站点可以同时绑定两个
不相关域名，并在旧站完全无影响时预先完成新站证书和联机验收。
**必须安排低流量窗口，先结束旧域名游戏，承认存在短时不可用风险。**
可先用临时 302 验证，稳定后才改 301，避免过早永久缓存错误跳转。

| 记录/设置 | 目标值 | 何时执行 |
| --- | --- | --- |
| Pages Custom Domain | `playavalonnow.com` | 候选版本全部检查通过，负责人批准窗口后；Actions 的 CNAME 文件本身不完成此设置 |
| Cloudflare 新 zone apex A | `185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153` | Pages 认领新域名后；DNS-only；保留无冲突的其他用途记录 |
| apex AAAA（建议） | `2606:50c0:8000::153`、`2606:50c0:8001::153`、`2606:50c0:8002::153`、`2606:50c0:8003::153` | 与 A 一并审查；不只配置 IPv6 |
| www CNAME | `lorrainewong.github.io` | DNS-only；不加 `/avalon`，不加协议；验证 Pages 自动 www→apex 与两主机证书 |
| 验证 TXT | GitHub 当次实际 challenge | 准备阶段先完成并保留；不能编造值 |
| Pages HTTPS | approved 且 Enforce HTTPS | 有效证书后检查；不绕过 TLS 警告，不把 HTTP 临时站作为正式入口 |
| 旧域名 DNS/跳转 | 仅 `avalon.lorrainewong.dev` 由 Cloudflare 边缘承接 | 具体代理/证书配置先核对并批准；新站验收后才启用正式跳转 |

Cloudflare 旧站规则草案：条件 `http.host eq "avalon.lorrainewong.dev"`，
目标表达式 `concat("https://playavalonnow.com", http.request.uri.path)`，
保留 query string；验收期 302，最终 301。规则应覆盖 HTTP/HTTPS，且最终 Location
不能带空 `#` 或拼入私密数据。必须先验证旧 host 的边缘 HTTPS 证书可用；
仅配置规则而保持 DNS-only 不生效。先核对当前记录与证书，再给出准确的代理变更前后值，
不要在尚未就绪时把旧站留成失去 Pages 绑定的悬空 CNAME。

不在本批自动给整站开启 Cloudflare 代理、不修改个人站 apex、不将游戏搬到 Workers。
若无法在免费现有规则内安全承接旧入口，停在此关卡，提出替代方案供负责人选择。
DNSSEC 是独立安全工作，需检查完整信任链后单独安排，不与首次域名切换同时盲目打开。

候选版本发布、Pages 设置和 DNS 必须按同一窗口协调，旧 metadata 与新 origin
短时不一致只允许存在于受控迁移窗口；不提前推广新地址。
证书可能花费较长时间，不能把预计时长当作已验证承诺。
建议窗口开始后 15 分钟仍不能正常 TLS 访问时停止推进并按回滚方案恢复，
最终窗口和可接受中断时长由负责人批准。

### Gate D：真实生产验收

仅在真实新域名可正常校验证书且后台授权就绪后进行。使用临时房间/测试身份，
不运行压力测试、不读取真实房间。需要测试账号清理时只操作本次明确创建的身份，
遵守工具对不可恢复删除的确认要求。

| 验收项 | 必须保留的证据 |
| --- | --- |
| 域名/HTTPS | DNS 权威与公共递归结果、apex/www 证书、HTTP→HTTPS、www→apex、无循环 |
| 静态发布 | 合并 SHA 与 Pages main 成功，必要文件字节/版本核对；Workers 另报，不混淆 |
| App Check | 新域名真实 provider token 交换成功；仅记录状态码与时间，不存储 token |
| 身份和权限 | 匿名登录成功；同一临时身份在有效 token 下的授权操作成功，缺失/无效 token 的数据库请求被拒绝，跨玩家越权仍被拒绝；不修改安全设置进行测试 |
| 五人联机 | 五个独立浏览器身份：昵称、创建、代码加入、邀请链接加入、二维码解码/访问、开局、各自角色、提名、投票、Quest、胜负、再来一局 |
| 恢复/异常 | 原房主与普通玩家分别重连、房主移交、短时断网、重复点击、失效房间；检查状态和私密角色恢复 |
| 设备范围 | 桌面 + 手机视口自动检查；真实手机/电脑混合必须另做并记录设备/网络，不能用视口模拟冒充真机 |
| 公共页面 | 九语言、双主题、手机/桌面、四类命名页与 legacy 转跳、隐私/非官方声明、Ko-fi 正确 |
| 邀请/旧入口 | 三种旧入口与 www，首页/命名路径/legacy 路径、query、hash、query+hash，浏览器最终地址和实际加入结果，无循环 |
| PWA/缓存 | 新 origin 首次安装、更新/离线；原隔离旧 profile 在线导航与已有安装入口，记录 controller 的实际版本及稳定缓存内容；不能只看 cache 名称出现 |
| 清理 | 本次临时房间/身份清理结果；未清理或未获删除确认时明确留作阻塞项，不默称成功 |

hash 不随 HTTP 请求发送。HTTP 标准规定无 fragment 的 Location 可继承原 fragment，
但仍须在实际浏览器中验证 `?lang=ja#TEST1` 等无真实会话的地址；curl 不能证明 hash
保存成功。保留房间码不代表旧玩家身份、房主密钥、私密角色或笔记被迁移。
新域名必须新开房间；不承诺旧房间可跨域恢复。

旧安装的 Service Worker 可能拦截导航，且离线时不可能取得服务器跳转。
须验证安装用户在线升级行为；若需要同源 worker 退役脚本/迁移提示，先准备并测试
该独立补丁，再批准部署。不清理用户全部浏览器数据，不将所有旧资源盲目重定向
后就宣称旧 PWA 更新成功。离线旧安装可仍显示旧页面，应在手册记录此限制。

### Gate E：稳定后再推广

通过上述核心验收并获负责人确认后，将旧 host 302 改为 301，再检查一次旧链接、
缓存和无循环；保持旧域名续费和跳转。Batch 4 再提交搜索引擎迁移及 sitemap，
不把 robots/canonical 更新等同于已收录。

## 5. 回滚与游戏中断风险

切换前保存：Pages 配置、当前 main SHA、DNS 记录/代理状态、跳转规则前值、
后端精确授权前值。不要把私钥、token、真实房间或玩家资料放入回滚包。

1. **仅新增准备授权出错：**旧正式入口不变，停止切换；纠正新增条目。
   不删除原授权，不用通配符代替，不调整安全规则。
2. **新 TLS/DNS/匿名登录/App Check/数据库失败：**停止推广；关闭旧→新跳转，
   恢复 Pages Custom Domain 为 `avalon.lorrainewong.dev` 及旧记录/代理前值；
   核对证书与 HTTPS。不要只撤代码却忘记恢复 Pages 设置。
3. **代码已经发布：**用 PR 恢复正式 URL/版本；涉及运行资源时发全新 cache/asset
   版本，不能复用旧 cache 名称。批准合并后验证 Pages SHA、静态资源和旧域名测试房间。
4. **防止跳转循环：**回滚前先取消旧→新，再评估新→旧临时跳转；绝不同时启用两个方向。
   301 已被客户端缓存时不能保证立即撤回，这正是先 302 验收的原因。
5. **新域名 DNS 残留：**不能保留已解除绑定且无人承接的 Pages CNAME/A。
   保留 ownership TXT，决定是否由已配置的免费边缘跳转承接新→旧，或安全移除
   此次新建的网站地址记录；不删除无关邮件/验证记录。
6. **会话限制：**恢复代码/DNS 不能恢复已经换 origin 丢失的身份或房主密钥。
   各域名上新开的房间分别处理，不复制私密 localStorage。

可能造成中断的操作包括：Pages 解绑旧域名、DNS/代理切换、证书签发未就绪、
新域名漏配任一后端限制、过早旧站跳转、旧 PWA 未验证、错误永久跳转缓存。
**这些风险尚未消除，不批准静默生产切换。**

## 6. 中国大陆访问与后续阶段

目前没有本轮中国大陆电信/联通/移动实测，也没有已验证的马来西亚和第三国网络
多客户端测试。负责人提及的过去 HTTP 节点测试没有随需求提供原始结果，本轮不
复用其成功率。报告见 [大陆访问报告](CHINA_ACCESS_REPORT.md)。

最需要验证的链条是：DNS/静态资源 → 匿名身份与令牌 → reCAPTCHA/App Check
→ RTDB WebSocket/长轮询 → 游戏状态同步。已本地托管 SDK 只减少脚本 CDN 依赖，
不会让 Google 的身份、验证和数据库服务改为本地。Cloudflare 旧站跳转或新站
静态 CDN 同样不能解决后端链路。以上是依赖分析，不是大陆屏蔽实测结论。

优先方案为移除首屏非必要的字体外网依赖、保留可靠系统字体回退、分层诊断和
九语言明确错误提示。不得禁用 App Check、代理所有 Firebase 请求或迁移身份/数据库
来掩盖可达性失败。若 L4–L7 在实网不可靠，再给出后端替代方案的代码量、免费
边界、安全模型、维护与回滚比较，待负责人批准。

## 7. Batch 0 验收清单

- [x] 同步并审计真实 checkout、主分支和部署状态。
- [x] 公开 DNS/HTTP/HTTPS/注册状态核对，新旧域名现状明确。
- [x] v29 发布内容与多语言 metadata 基线核对。
- [x] 核实本轮 Spark、Auth、App Check 参数/enforcement、API referrers、reCAPTCHA 域名和规则/用量。
- [x] 编制依赖、成本、批准边界、回滚、会话风险和真实验收方案。
- [x] 核实新旧 DNS、GitHub ownership 状态及旧主机跳转规则/边缘证书条件。
- [ ] 负责人完成续费/2FA/恢复方式安全自查；不在本轮修改计费或认证凭据。
- [ ] 负责人验收 Batch 0；确定切换窗口及后续每个配置变更的批准。

本批只修改文档，可通过撤销该 PR 回滚；本轮不增加固定费用、不改变生产状态。
禁止把未完成项勾选成已通过。

## 官方资料（2026-11-15 核对）

- [GitHub Pages 域名、apex/www DNS 与 Actions CNAME 行为](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub Pages 所有权验证与 TXT 保留](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [Cloudflare Redirects 免费额度](https://developers.cloudflare.com/rules/url-forwarding/)
- [Cloudflare Redirect Rule 设置与代理条件](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-dashboard/)
- [Cloudflare 路径/查询与临时、永久跳转设置](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/)
- [Firebase App Check Enterprise provider](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
- [Firebase Spark 价格与配额](https://firebase.google.com/pricing)
- [reCAPTCHA 当前价格与组织级免费额度](https://cloud.google.com/security/products/recaptcha#pricing)
- [HTTP Location 与 fragment 继承](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.2)
