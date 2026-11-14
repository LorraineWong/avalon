<p align="center"><img src="assets/brand-mark.svg" width="80" height="80" alt="Avalon Online"></p>
<h1 align="center">Avalon Online</h1>
<p align="center"><strong><a href="https://lorrainewong.github.io/avalon/">开始游戏</a></strong> · <a href="https://lorrainewong.github.io/avalon/zh-cn/">玩法指南</a> · <a href="docs/README.md">项目文档</a> · <a href="README.md">English</a></p>
<p align="center">供 <strong>5–10 位朋友</strong>一起游玩的免费在线阿瓦隆。无需注册或下载。</p>

## 和朋友一起玩

1. 输入昵称并创建房间。
2. 分享邀请链接、房间号或二维码。
3. 至少五人加入后，选择角色预设并开始游戏。

远程游玩时配合语音通话，线下聚会时直接围桌讨论。每位玩家需要独立的浏览器画面，以保护身份信息。

## 功能

- 完整对局流程：组队、投票、秘密任务、刺杀与再来一局。
- 17 种角色、推荐预设，以及湖中仙女、王者之剑等可选模块。
- 手机与桌面适配，浅色／深色主题，七种语言切换（英文、简体中文、繁体中文、俄文、西班牙文、葡萄牙文、越南文）。
- 身份与行动加密、本地推理笔记、断线重连及房主转移。

## 本地开发

使用原生 HTML、CSS 和 JavaScript，无需构建或安装依赖。

```sh
git clone https://github.com/LorraineWong/avalon.git
cd avalon
python3 -m http.server 4173
```

通过[离线界面预览](http://localhost:4173/dev/ui-preview.html?state=home&lang=zh)使用模拟玩家开发界面。普通首页会连接已配置的线上 Firebase 后端。

使用 Node.js 运行自动检查：

```sh
node tests/run-all.mjs
```

Firebase 配置、部署和多人测试方式见[开发指南](docs/DEVELOPMENT.md)。

## 文档与贡献

[文档索引](docs/README.md) · [规则支持范围](docs/BIG_BOX_RULES.md) · [安全政策](.github/SECURITY.md) · [隐私说明](https://lorrainewong.github.io/avalon/privacy/)

欢迎提交范围明确的 PR 和可复现的问题报告。界面问题请附上设备、屏幕尺寸和主题；修改游戏流程时，请使用相互隔离的玩家会话测试。

## 项目声明

本项目为非官方粉丝作品，与《抵抗组织：阿瓦隆》的创作者及出版商无隶属关系。游戏名称与设定归各自权利人所有，请支持正版桌游。

身份资料在浏览器之间加密，但房主浏览器仍是受信任的一方。威胁模型和私密漏洞报告方式见[安全政策](.github/SECURITY.md)。

<!-- Project-site /avalon/robots.txt is not a host-root robots file. Submit sitemap.xml through Search Console. 项目路径 robots.txt 不是站点根规则；通过 Search Console 提交 sitemap。 -->

授权：源代码与文档采用 [MIT License](LICENSE)；图片[不在该许可范围内](assets/LICENSE.md)。第三方依赖声明与游戏权利分别处理。

## 制作说明

Avalon Online 由 Lorraine 维护，开发主要使用 Claude Code 与 OpenAI Codex，本站图片由 GPT 生成。使用 AI 工具不代表 Anthropic、OpenAI 或原游戏发行方对本项目的认可或背书；本站不使用官方桌游卡牌图片。
