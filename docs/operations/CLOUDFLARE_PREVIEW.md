# Cloudflare 分支预览配置与验证

更新：2026-11-15。负责人要求修复 PR 的 Deploying Preview to Cloudflare，
并授权检查通过后合并上线。这个授权覆盖本次预览修复和文档 PR，
新正式域名的 DNS/Firebase 安全配置仍按迁移计划单独批准。

## 观察到的失败

构建 `b7d6d744-3e96-4328-8c4e-31daea83d500` 对应 PR #27 的 `ac5a5e3`：

- `node scripts/prepare-site.mjs` 成功，138 个静态文件准备完成。
- 非生产命令为 `npx --yes wrangler@4.162.0 versions upload --config config/wrangler.jsonc`。
- 部署阶段报 Wrangler 配置中的 `avalon` 必须匹配 Worker 名称。
- Worker 后台名称与仓库名称都为 `avalon`，main 的同配置部署成功。

这些直接证据定位到旧分支上传路径的身份匹配检查；没有导出当前 trigger 内部
script tag，因此不宣称已经证明本账户一定存在“错误 tag”这一内部原因。
相关上游报告已转到 [developer-platform #100](https://github.com/cloudflare/developer-platform/issues/100)。
不采用移除 `WRANGLER_CI_MATCH_TAG`、更名生产 Worker、禁用检查或扩大令牌权限的方式处理。

## 当前配置

在 Workers & Pages → `avalon` → Settings → Builds：

| 项目 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 构建命令 | `node scripts/prepare-site.mjs` |
| 生产部署命令 | `npx --yes wrangler@4.162.0 deploy --config config/wrangler.jsonc` |
| Preview base 的 Preview command | `npx --yes wrangler@4.162.0 preview --config config/wrangler.jsonc` |
| 根目录 | `/` |
| 预览分支构建 | 启用，沿用原设置 |

只改了 Preview command，刷新后确认保存。沿用现有 build token、Worker 名称、
生产命令和无运行绑定的静态资源配置，没有修改 DNS、Firebase、账单或权限。
官方当前分支构建流程使用专门的 `wrangler preview`；本机固定版本的 CLI
`preview --help` 也确认该命令存在。它与上传 production version 的
`versions upload` 是不同流程。

## 每次验证

1. 提交非 main 分支，观察该 SHA 的 `Workers Builds: avalon` 状态及详细日志。
2. 核对实际运行的是 `preview`，记录成功构建 ID 和生成的预览 URL。
3. 用正常 TLS 请求预览中的项目说明及关键静态资源；需要浏览器验证时拦截
   生产 Firebase 请求。不在预览创建生产用户或房间。
4. 确认生产部署未被预览覆盖；合并后再分别验证 Pages main 和 Workers main。
5. 成功证据写入 PR/发布记录，不能仅根据修改设置就宣称预览已经可访问。

预览没有独立 Firebase 后端，源码中的生产连接仍然存在；不要把它当成隔离的
联机测试环境，不授权任意预览域名，不通过禁用 App Check 让预览开房。

## 回滚

若新预览流程出现问题，记录当次日志并暂停使用预览；生产命令不需要修改。
要撤回本次设置，可将 Preview command 恢复为上面的旧 `versions upload` 命令，
但那会恢复已知失败路径，不是修复。不要因此绕过身份校验或删除现有 Worker。
此变更不要求开通付费计划，未新增服务绑定或计费账户。

## 官方参考

- [分支构建与 Preview command](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)
- [Previews 入门](https://developers.cloudflare.com/workers/previews/get-started/)
- [Preview 与 Version URL 工作流区别](https://developers.cloudflare.com/workers/previews/compare-workflows/)
