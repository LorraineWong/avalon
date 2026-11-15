# PlayAvalonNow 增长技术审计 v1.0

审计日期：2026-11-16（Asia/Kuala_Lumpur）。基线：main `773f273` / 线上 v35。
范围：公开页面、静态源码、离线测试及隔离浏览器；未读取私人 Search Console、GA4、Firebase 用量，也未创建生产用户或房间。没有关键词量、排名、真实用户留存或线上多人容量数据。

## 结论与已有/缺失清单

基础 SEO 已较完整，无需重构游戏架构。主要缺口是增长事件尚未采集、一个开发测试页缺少 noindex，以及邀请链接和文案尚未统一。新统计服务只设计，当前不启用、不上传事件。

| 项目 | 已有与实测 | 缺口/处理 |
| --- | --- | --- |
| sitemap / robots | robots 允许抓取并指向正式 sitemap；37 个唯一 URL（首页+九语言四类页面），本轮全部 HTTP 200 | 不重复提交 sitemap；Google 实际收录待站主在 GSC 查看 |
| canonical / 标题 / 描述 | 37 页唯一 canonical 自指；各内容页独立本地化标题和描述，OG/Twitter 对应；带 lang/UTM 首页 canonical 仍为根首页 | 无需重写用户已确认的首页标题/描述 |
| 域名归一 | HTTP→HTTPS、www、旧 GitHub Pages、旧游戏域名均 301 到正式域名；三类旧入口的深层路径及 UTM 保留 | 浏览器 fragment 不由服务器接收；另用浏览器离线路由验证 |
| 多语言 | en、zh-CN、zh-TW、ru、es、pt、vi、ja、ko；36 个内容页静态 HTML，lang、互返 hreflang、x-default 与 canonical 对齐 | 首页 ?lang= 动态界面共用一个 canonical，不能宣称九个独立可收录首页；未做九语言母语校对 |
| 旧内容地址 | /en/ 等旧指南、/privacy/ 等保留 HTTP 200、指向正式页面 canonical，并由浏览器跳转 | P1：静态托管下这些不是 HTTP 301；目前无需迁移托管。旧政策页按原始内容语言设置 canonical |
| 房间与隐私 | 房间通过 #邀请码 路由，服务器只返回公共首页；无房间列表、房间 sitemap、服务器房间快照；分享图和 metadata 不读取玩家信息 | 不对整个游戏首页加 noindex；robots 不是访问控制。邀请本身可转发，任何持有链接者仍可尝试加入 |
| 开发页 | ui-preview、social-preview 已 noindex | **P0：/dev/render-stability.html 线上 200 且缺少 noindex；补标记并为全部开发 HTML 建回归检查** |
| favicon | SVG、48/96 PNG、ICO、Apple/PWA 图标均已部署；尺寸在现有离线检查中验证 | Google 图标更新需重新抓取，不能保证显示时间 |
| 结构化数据 | 首页 WebSite+VideoGame，JSON 可解析；免费、浏览器、5–10 人、九语言与产品相符；无虚构评分/评价、价格、FAQ 富结果 | 语义及源码检查通过不等于 Google Rich Results Test 通过；VideoGame 不保证特殊搜索展示 |
| 增长数据 | 第一方源码和公开 HTML 未发现 GA4、GTM、Plausible、Umami 等统计标签，也未加载 Firebase Analytics SDK | **P0：先采用下述隐私事件设计；后台是否存在未使用的 GA 属性未核实** |
| 分享卡 | 全部37页 OG/Twitter、统一1200×630 PNG、图片尺寸/alt/站名已具备；线上图 HTTP200，内容为现有 Merlin/Morgana 与品牌 | 房间 # 不会产生专属预览；现有原生分享只有游戏名+房间码，复制/QR/分享丢失语言；用户追加授权后实施统一邀请链接和九语言文案 |
| 搜索内容 | 九语言指南已有流程、17角色、可选模块、5–10人数表、FAQ；About/隐私/条款独立，静态可读 | P1：先纠正“展开阵营”等与已展开界面不符的旧文案；英文/中文及其他语言都需内容复核 |
| 独立攻略 | 现有 #roles、#players 已覆盖基础需求 | P2：有 GSC 查询需求及独特内容后再考虑人数/角色攻略；不批量制造九语言重复薄页 |
| 留存 | 已有再来一局、同房返回大厅、断线恢复、PWA 壳缓存 | 没有留存基线；P2：结束后可评估“邀请朋友”入口。需具体设计再改界面，不能自动分享战绩或角色 |

## 优先级、文件、效果和风险

| 优先级 | 事项 / 文件 | 预期效果 | 风险及验收 |
| --- | --- | --- | --- |
| P0 本次 | `dev/render-stability.html`、`tests/seo-brand-test.mjs`：开发页统一禁止收录 | 避免测试页面进入搜索；不影响游戏首页 | 已被收录时要等重抓；勿在 robots 阻止抓取该页，否则搜索引擎看不到 noindex。检查打包输出全部 dev HTML |
| P0 方案 | 本文事件合同；未来独立 `site/assets/js/analytics.js` / `site/config/analytics.js`，以及 `site/assets/js/app.js` 成功动作接点 | 可观察建房→入座→开局→完成→再玩漏斗 | 不能直接在点击或任意 `.then()` 上计数；下文描述确认/去重/隐私边界。启用前需选服务、同意流程和九语言隐私文案 |
| P1 用户追加、本次实现 | `site/assets/js/app.js`、`site/language/locales.js`：邀请 URL 共用函数、当前语言、固定渠道字段、原生分享品牌标题+邀请说明 | 邀请更清楚，接收者打开相同语言；未来可区别复制/原生/QR 来源 | 保持 #邀请码；不能复制来访者任意 query；取消分享不显示成功；失败可显示可手动复制的链接 |
| P1 | `site/assets/js/public-ui.js` / `scripts/content-pages.mjs`：评估旧链接跳转保留安全 UTM | 避免从旧指南进站时丢渠道 | 不影响现有 canonical；尚未实施，以免扩大修改范围 |
| P1 | `site/language/*/index.html`、`site/language/locales.js` 内容复核 | 规则更准确，减少玩家理解成本 | 九语言同步，不凭猜测重写规则；本次不增文章或模块 |
| P2 | 性能、独立攻略、结束分享入口 | 在真实数据支持下优化转化/搜索覆盖 | 需实际 CWV/查询数据；不提前拆分架构、加插件或付费服务 |

涉及运行资源的分享修改需所有 `?v=` 与 `site/pwa/service-worker.js` 统一到 v36；仅增加开发页 noindex 本身不需要版本升级。源码 HTML、共享壳、预览页面也随版本对齐。不要重绘现有 logo/分享画面，不改认证、规则、App Check、计费、房间同步。

## 移动性能：本轮测量与局限

生产静态资源、全新 Chrome context、390×844、模拟下行1.6Mbps/延迟150ms/CPU4倍降速，每页3次；禁用SW并拦截所有外部主机，避免匿名用户与房间创建。首页会渲染但认证不可用；字体/reCAPTCHA/Firebase未完整加载，不能作完整生产速度或 CWV 达标结论。

| 页面 | LCP 三次（秒） | 中位数 | CLS / 横向溢出 |
| --- | --- | --- | --- |
| 首页 | 1.952 / 1.976 / 1.924 | 1.952 | 0 / 无 |
| 英文玩法 | 1.228 / 1.208 / 1.244 | 1.228 | 0 / 无 |
| 简中玩法 | 1.532 / 1.228 / 1.244 | 1.244 | 0 / 无 |

未测 INP；无 CrUX 第75百分位实地数据。当前主要成本：同步 locale 约216KiB、app约116KiB、Auth SDK约140KiB、Database SDK约164KiB，loading两图合计约232KiB（均为本地未压缩大小，非传输量）。线上HTML有gzip。字体与认证是外部依赖；本轮不改变脚本顺序或加载架构，以免损伤初始化/恢复。

## 低成本隐私统计方案（未启用）

建议先复用现有 GSC 看搜索；游戏行为若要采集，可选免费 GA4 标准属性，沿用现有 Pages/Firebase、不把分析事件写入公开房间树、不启用 Blaze。GA4 是第三方统计，不能称为匿名或零隐私影响；若用户不接受第三方，则继续只用 GSC/控制台汇总，游戏转化漏斗保持未知。Cloudflare Web Analytics 类页面统计也不能自动替代六个业务事件。

启用约束：默认不加载统计脚本、不发 cookieless ping；明确同意后才加载；关闭广告个性化、Google Signals、增强衡量、自动 page_view/历史导航/点击/表单/站内搜索采集；不设 Firebase uid 或 user_id。尊重拒绝/撤回/GPC（产品策略，非法律合规认证）；未同意者直接跳过，不补传历史行为。采集失败不得阻断游戏、重试房间操作或弹报错。需更新九语言隐私说明及选择入口。

只允许：事件名、schema_version、九语言枚举、粗略 device_category（mobile/tablet/desktop/unknown，启发式不保证准确）、归一渠道、受控 utm_source/medium/campaign、share_method。UTM 必须匹配站主维护的已知活动值；未知归为 other，禁止原样转发任意字符串，避免有人把昵称/邀请码塞进 UTM。只保留一个会话的首次受控来源，直接访问不覆盖；重新分享使用固定 invite 来源，不继承原访问者私人参数。来源 referrer 只在本地映射 search/social/referral/direct，不上传原始URL。协议发送的 page_location 固定为正式根URL，page_referrer 固定空或受控来源；验证网络实际 payload，防止默认自动参数泄露 query/hash。

禁止：完整URL及fragment、完整房间码及其可枚举哈希、gid、uid、昵称、私聊、笔记、秘密角色、行动与胜负角色图谱、原始referrer、精确设备指纹。GA 服务本身仍可能处理IP/浏览器等连接元数据，需如实披露。

### 成功事件合同

指标必须区分“房间/房主动作数”和“参与者体验数”；后两者不能直接当作唯一对局总数。

| 事件 | 真实成功条件 | 单位 / 本地去重依据（不上传） |
| --- | --- | --- |
| room_created | 发起建房后 game 和自己的 seat 两次写入均获后端确认，且仍是同次创建 | 建房动作；room code+created+动作ID |
| room_joined | 入座写入获确认并在当前房间看到自己的有效 seat；仅打开链接/观战不算 | 浏览器参与者首次入座；room code+created+本地参与标记。重连/刷新不算新加入 |
| invite_shared | clipboard.writeText resolve，或 navigator.share resolve；二维码仅打开不算成功分享 | 成功调用；每次明确用户操作独立ID。原生 resolve 只表示系统接受/交付，无法保证好友收到或点开 |
| game_started | 已加入的本浏览器首次看到对应 gid 从大厅变为 play，且自己在 order；首次打开已在进行的游戏不补计 | 参与者开局；room identity+gid+事件名 |
| game_completed | 本浏览器已观察该 gid 开局/进行且属于 order，之后首次观察 status=end | 参与者完成；同一gid仅一次，刷新/重复监听不重计；不上传胜负/角色 |
| play_again | 房主明确确认再玩后，写入获后端确认并观察同房从该结束gid回大厅 | 房主返回大厅动作；上局gid+事件名；不能把点击确认或下局尚未开始算成功开局 |

特别注意：`Net.pub()` 当前 catch 会吞掉写错误，调用 `.then()` / `await` 完成不等于写成功。统计实施需另设受控成功回调或明确确认通道，不能为统计改写所有网络错误语义。Firebase 本地回声也不等于服务器确认，需等待写 promise 成功再确认当前操作上下文；把 room/code/gid 在动作开始时捕获，离房或切房后不串记。

去重：只在玩家同意后使用独立 `lwav.analytics.*` 命名空间，持久化24小时有界成功标记，和既有身份/密钥完全分离。相同动作先在内存锁定，后端确认后落成功标记，再交给传输层。刷新后不重发；重复回调、监听、重连、同次并发点击只计一次。并发标签页用 Web Locks/共享标记串行检查；不支持时明确退化，不能宣称严格去重。存储不可用时保留内存去重并披露刷新重复风险；不通过上传稳定玩家/房间标识换取跨设备去重。

这是一份隐私优先、尽量不重复的客户端方案：先标记后发送可能漏报，后标记可能在崩溃时重复；GA4 自定义 event_id 不提供任意事件的可靠全局 exactly-once 保证。跨设备、清存储、房主交接不保证严格唯一房间/对局数。若未来确需权威对局总数，必须另行评估受保护接收端及幂等存储，不能声称当前免费纯前端方案已经做到。

## 需要站主在控制台做的项目

本次低风险代码修改无 Google/Firebase 控制台操作。不要重新验证域名、重复提交已有 sitemap，或放宽 API 来源/App Check。

1. GSC：查看首页、英文/简中玩法URL的实际 Google canonical、抓取/渲染、索引原因，以及移动 CWV 是否有足够数据；站主自行操作。仅必要时请求索引一次。
2. 统计若选GA4：创建/确认标准属性、正式域名Web数据流，提供公开 Measurement ID（不要提供登录凭据或Measurement Protocol secret）；关闭上述自动/广告能力，选择较短的数据保留设置，按预算维度注册 language/source/device/share_method，DebugView验证后再决定关键事件。不要创建过多自定义维度或把房间码注册为维度。
3. Firebase：无需为GA4改数据库规则、身份方式或升级Spark；上线推广前自行查看当前Auth/RTDB用量。已有 App Check/三个API限制保持。
4. Google Rich Results Test / Schema Markup Validator：站主可验证公开首页；工具未检出可展示类型不等于 VideoGame JSON-LD 语法错误。无本轮在线验证结果可冒充。

## 测试与验收

- 全量离线 `node tests/run-all.mjs`、静态打包、差异空白检查。
- SEO：37页状态/canonical/OG/标题/描述，九语言互返与lang，图标/分享图尺寸，robots/sitemap；不存在路径404；所有开发HTML带noindex，公共37页不被误标。
- 分享：九语言×copy/native/QR使用同一链接生成逻辑；`?lang=…&utm_…#CODE` 能原样解析房间，切语言/刷新/退出不丢已有query；不带昵称/角色/原始来访参数；取消不显示成功，复制失败显示手动链接。分享图与公共metadata不含动态房间信息。
- 浏览器：320/390/1440、双主题、九语言受影响房间界面；原生分享使用stub验证payload，QR使用本地生成器验证输入；不能冒充真实手机分享面板、扫描或社交平台卡片验收。
- 统计未来：拒绝时零请求；允许时检查真实payload白名单；写入拒绝/离房/重复回调/重连/刷新/多标签/房主交接/SDK失败都需专门测试，模拟后再授权临时生产房验收。此轮不启用，因此不能标记事件成功统计。
- 发布：实施与验证完成后提供可审查差异/PR；未获本次明确发布指令前不合并或发布。最终记录区分本地通过与线上生效。

## 证据与参考

本机证据目录：`/Users/lorraine/Documents/Codex/2026-11-16/avalon-growth/outputs/`；`http-audit.json`（37页面和14探针）、`mobile-audit.json`（9次测量）。这些证据不含身份凭据，未写进网站。

- [Google canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google 多语言页面](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google URL/fragment 说明](https://developers.google.com/search/docs/crawling-indexing/url-structure)
- [Google 结构化数据准则](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Web Vitals 与实地测量](https://web.dev/articles/vitals)
- [GA4 参数配置](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Web Share 规范](https://www.w3.org/TR/web-share/)

## 实施结果

本次候选 v36 已实现：开发渲染测试页 noindex；统一邀请 URL（当前语言 + 固定 invite 来源和 copy/native/QR 渠道 + #邀请码）；九语言品牌邀请标题与说明；分享取消静默、其他失败保留手动链接。未改游戏、认证、同步或数据规则，未增加统计网络请求。

邀请图继续复用既有1200×630品牌PNG，未重绘。原生分享的附带文字支持九语言；聊天平台抓取的卡片仍读取首页静态英文 metadata，不会因 ?lang 自动变成九语言卡片，也不显示实时房间人数/状态。系统/目标应用可能只采用 title/text/url 的一部分。未实际发送 WhatsApp/Discord/微信消息，不能声称平台卡片验收或缓存刷新完成。

验证结果：

- Node24 全量离线通过：16项脚本语法+23项测试；新增邀请行为回归涵盖九语言、三渠道、复制成功/拒绝/不可用、原生取消/拒绝/同步抛错；开发页 noindex 与公共37页不误禁收录均通过。
- Chrome 54组（九语言×双主题×320/390/1440）：真实点击复制/原生分享stub/QR，语言与渠道正确，无横向溢出，QR使用真实本地生成器。根首页真实 boot 路径在假后端下接受 language+UTM+#room。
- 本地同一浏览器的模拟 v35缓存→v36缓存升级完成，旧缓存清理，新缓存51项；此测试使用当前静态资源模拟旧版本URL，不是生产旧profile或历史v35代码验收。
- `git diff --check` 通过。没有运行生产用户/房间测试；没有实际手机原生面板、扫码、跨设备多人整局或真实用户CWV验收。

补充证据：`offline-tests.txt`、`share-browser.json`、`invite-qr-mobile.png`、`pwa-upgrade.json`，均在上述本机证据目录。初次审计提交时正式网站为v35，此处记录发布前验证，不冒充生产结果。

后续授权（2026-11-16）：站主明确要求把本次修改完成后上线。v36追加[公开网站巡检](PUBLIC_SITE_MONITOR.md)：发布后与每日运行，71项公开页面/资源检查，最多三次重试，失败显示在GitHub运行结果；邮件取决于个人通知设置。没有启用增长事件或改变Firebase。新增监控负向/重试测试完全离线，最终部署与真实公开检查以对应GitHub运行记录为准。
