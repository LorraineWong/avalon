# Avalon Online 负责人运营手册

更新：2026-11-15。**这是 Phase 1 准备稿，尚未完成新域名迁移或监控开通。**
已完成、待配置和未验证项目会分别标明；不要根据下面出现一个入口就认为已经配置好。

当前实际网站：[Avalon Online](https://avalon.lorrainewong.dev/)。
计划正式地址：`https://playavalonnow.com/`，目前没有网站地址记录。
迁移获批并验收后再更新本手册的“当前实际网站”。

## 每天花两分钟看什么

1. 用手机或电脑打开当前实际网站，确认没有证书警告、空白或明显报错。
   单纯打开首页只能检查网页，不能证明多人游戏正常。
2. 看访问分析中的当天访客和趋势。**尚未核实/开通分析面板，当前不能查看此项。**
   Batch 3 完成后在这里补真实入口和查看方法。
3. 看故障和恢复邮件。**尚未核实/配置免费监控与收件人。**没有邮件目前不能说明没有故障。
4. 有玩家反馈时记录发生时间、手机/浏览器、网络地区、卡在哪一步；
   不索要角色截图、私密密钥或公开房间完整信息。

## 每周看什么

| 看什么 | 去哪里 | 目前能做什么 |
| --- | --- | --- |
| 网站发布是否正常 | [GitHub Actions](https://github.com/LorraineWong/avalon/actions) → Publish static site → 最新 main 记录 | 本轮 v29 发布成功。查看自己的更新，不把工作分支预览失败当作正式站失败 |
| 访客、来源、国家/地区、页面 | Batch 3 待补真实分析面板 | 尚未配置验收；不以“0”替代未启用 |
| 搜索曝光与抓取问题 | [Search Console](https://search.google.com/search-console) / [Bing Webmaster Tools](https://www.bing.com/webmasters/) | 新域名属性和 sitemap 提交未验证，账户授权后在 Batch 4 配置；收录和排名不保证 |
| 数据库免费额度 | [Firebase 项目](https://console.firebase.google.com/project/lw-avalon/overview) → Realtime Database → Usage | 本轮 Last 7 days / Nov 8–15：峰值连接 14、下载 27.67 MB、当前存储 309.78 KB；以后查看时重新选日期，不沿用此快照 |
| 匿名身份使用 | 同项目 → Authentication → Usage；可见指标按当前面板为准 | 匿名用户总数不是活跃玩家数，不批量删除真实用户 |
| App Check 异常 | 同项目 → Security → App Check → APIs / Apps | 本轮 RTDB Enforced、Auth Monitoring；比较有效/无效/缺失请求变化，Registered 只代表注册。验证失败比例不能直接当成玩家失败或攻击率 |
| 游戏使用情况 | Batch 5 待批准事件方案 | 尚未采集事件，不能报告开房/完局率 |
| 玩家反馈 | [GitHub Issues](https://github.com/LorraineWong/avalon/issues) | 可看已有反馈；新表单/模板方案待 Batch 5，Issues 提交需要 GitHub 账号 |

本轮后台已直接确认 Spark（免费）、Anonymous Enabled、App Check 应用 Registered、
RTDB Enforced 和 Auth Monitoring；验证参数为 1 小时、0.5、Essentials，均未修改。
看不到面板时请登录正确的 `lw-avalon` 项目，不新建一个相似名称的项目替代。

## 免费额度怎样判断

目前官方 Spark 数据库额度为：100 个同时连接、1 GB 数据、每月 10 GB 下载。
连接数不等于可承诺的玩家数：一个人多开页面、测试、重连和其他连接都会占用。
可采用“超过约一半开始留意，接近八成暂停扩大推广”的人工观察线；
这只是建议，不是已设置的自动告警，也不保证服务到达这些线才受影响。

App Check 使用的 reCAPTCHA 有独立免费限制。当前官方免费档为每月 10,000 次
assessments，按组织合计，不等于 10,000 个玩家或房间。本轮后台为 Essentials，
项目面板本月 58、预测 118 assessments；预测值不是实际发生量，也不是整个组织的合计。
不要因为 Firebase 显示 Spark 就认为其他 Google 服务不会遇到额度。
参考：[Firebase 价格](https://firebase.google.com/pricing)、
[reCAPTCHA 价格](https://cloud.google.com/security/products/recaptcha#pricing)。

发现用量异常：记录面板时间范围和增长趋势，暂缓推广，请维护者排查。
不要点击 Upgrade、连接计费账户或降低安全设置。免费服务不一定支持免费自动告警，
Batch 3 将逐项记录可用邮件通知和需要人工看的项目。

房间过期由房主再次连接时清理，并非保证到点自动删除。
匿名账户清理是另一件事，不能把有过期标记当成后台定时清理已开通。

## 每次更新网站后怎么验收

1. 请 Codex 提供 PR、合并版本和测试结果。未经你明确批准，不能合并或切换正式域名。
2. 打开 Actions，确认最新 **main** 的 Publish static site 成功，并对应本次版本。
   另一个 Workers 检查成功不代替 Pages 成功。
3. 打开实际正式地址，看首页、玩法、项目说明、隐私、条款；切一次语言和明暗主题，
   在手机窄屏与电脑各看一遍。不要用“我能打开”代表所有国家/设备都通过。
4. 涉及域名、登录或联机修改时，让 Codex 用本次临时身份/房间完成真实测试和清理。
   新域名迁移必须有完整五人流程、重连/移交和 App Check 权限结果。
5. 请 Codex 核对线上资源和缓存版本。缓存名称出现不代表更新已接管，要看实际
   controller 的版本、稳定缓存内容和离线正文。不要先清空你日常浏览器的数据。
6. 没通过时先停止推广，按已批准的回滚清单恢复。不要连续点击部署来碰运气。

## 域名切换前后要告诉玩家什么

请先在旧地址结束当前游戏，再去新地址开新房。
新旧域名下的匿名身份、房主解密密钥、私密笔记、缓存和已安装应用不自动搬迁。
保留旧邀请中的房间码不代表房主能够在新域名恢复旧房。
不把私钥放进链接，不要求玩家上传浏览器存储。

迁移后旧地址应在线跳转到新地址；离线的旧安装可能仍显示缓存页面。
先联网打开新地址再安装新应用；具体提示以 Batch 1 的实测为准，不提前清除旧数据。

## 故障时先做什么

1. 记录时间、实际网址、出错步骤和普通错误提示，不公开昵称、token 或私密角色。
2. 在另一台设备或另一条网络试一次。若只是首页在线但开房失败，分别报告这两点。
3. 看 Actions 和后续监控面板；不要通过反复创建房间测试网站在线率。
4. 请维护者判断是静态站、登录、验证、数据库还是同步问题。
   [迁移回滚计划](DOMAIN_MIGRATION_PLAN.md) 包含 DNS、Pages、跳转和代码恢复顺序。
5. 涉及数据暴露时使用 [GitHub 私密漏洞报告](https://github.com/LorraineWong/avalon/security/advisories/new)
   与 [应急指南](EMERGENCY.md)。应急 deny-all 不是正常排障默认操作。

## 哪些设置不要随意修改

| 后台入口与菜单 | 不要自行改的内容 | 原因 |
| --- | --- | --- |
| [Firebase](https://console.firebase.google.com/project/lw-avalon/overview) → Realtime Database → Rules | 数据库权限规则 | 可能泄露资料或让全部玩家无法使用 |
| 同项目 → Security → App Check → APIs | enforcement 开关 | 关闭会降低保护；错误开启也可能阻断正常请求 |
| 同项目 → Authentication → Settings → Authorized domains | 授权域名 | 漏配新站或删除旧站可能破坏身份流程 |
| [Google Cloud 凭据](https://console.cloud.google.com/apis/credentials?project=lw-avalon) → 对应 Browser API key | 来源和 API 限制 | 不选择无限制，不增加通配域名，不把 key 当作私钥公开求助 |
| [Google Cloud 验证服务](https://console.cloud.google.com/security/recaptcha?project=lw-avalon) → 网站 key | 域名验证、阈值、测试模式 | 改动可能令 App Check 无法正常验证；页面有时显示 Fraud Defense 名称 |
| [GitHub Pages 设置](https://github.com/LorraineWong/avalon/settings/pages) | Custom domain、HTTPS、发布方式 | 改动影响玩家入口；修改仓库 CNAME 文件不等于完成设置 |
| [Cloudflare](https://dash.cloudflare.com/) → 选择相应域名 → DNS → Records / Rules → Overview | 网站地址、代理和跳转规则 | 可能让网站离线、跳转循环，或影响个人网站；不要改 `lorrainewong.dev` apex |
| Firebase 项目底部 Spark → Upgrade / Google Cloud Billing | 付费方案或计费账户 | 可能产生费用；本阶段不启用 |

菜单名称可能随平台更新，先确认项目和域名，再操作。本文是文字路径；
本轮没有保存后台截图，浏览器工具错误重试后已恢复，不将其当作页面配置错误。
密码、验证码、付款、合同或恢复密钥由你本人处理。

## 待后续批次补齐

- Batch 1：正式上线日期、真实新域名验收与回滚结果。
- Batch 2：大陆分运营商实网结论、马来西亚/海外对照、已知限制。
- Batch 3：分析/监控真实面板链接、指定通知地址、故障与恢复邮件结果、额度检查记录。
- Batch 4：Google/Bing 验证与 sitemap 回执、每周搜索检查实例。
- Batch 5：批准后的事件定义、反馈入口、公开推广验收报告。
