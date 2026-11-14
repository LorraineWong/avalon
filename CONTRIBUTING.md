# Contributing to Avalon Online

Start with the [development guide](docs/development/DEVELOPMENT.md),
[architecture](docs/development/ARCHITECTURE.md) and [file organisation](docs/development/MAINTENANCE.md).
Use Node.js 24 for parity with CI. No package installation is needed to run the
site or its offline tests.

## A small change

1. Check your working tree and incoming `main` changes before starting a branch.
2. Prepare it with `node scripts/prepare-site.mjs`, then serve with
   `python3 -m http.server 4173 --directory dist`. For UI work, open
   `dev/ui-preview.html?state=home&lang=en`; it uses a fake backend. The regular
   home page uses the configured production Firebase backend and its allowed
   origins, so it is not a localhost multiplayer test environment.
3. Keep changes focused. Separate gameplay, translations, formatting and asset
   replacements where possible. Preserve public URLs and image licence notices.
4. Run `node tests/run-all.mjs` and `git diff --check`. For UI work also check
   narrow phones (including 320px), desktop, both themes and affected languages.
5. Open a PR describing the resulting behaviour and checks actually performed.
   Do not report offline simulations as live multiplayer or visual coverage.

For translation changes, follow [LOCALIZATION.md](docs/development/LOCALIZATION.md). For
release and cache changes, use [RELEASE.md](docs/operations/RELEASE.md). For private security
reports, follow [.github/SECURITY.md](.github/SECURITY.md), not public issues.

## Formatting

`.editorconfig` defines UTF-8, LF and two-space indentation; `.gitattributes`
keeps text line endings consistent. Use readable HTML rather than committing
entire guides on one line. Markdown paragraphs need not be hard-wrapped.

The optional formatter is pinned to Prettier 3.10.1. It is a development tool,
not a runtime dependency or build step. `npx` may download it on first use:

```sh
npx --yes prettier@3.10.1 --check "**/*.{html,md,json,yml,yaml}"
npx --yes prettier@3.10.1 --write "**/*.{html,md,json,yml,yaml}"
```

The ignore file excludes third-party/generated files and compact JS/CSS.
Embedded script/style formatting is disabled. Do not mass-format the runtime
or weaken behaviour assertions merely to make a formatter pass. See the
[staged maintenance plan](docs/development/MAINTENANCE.md#next-maintenance-work).

## 中文摘要

先检查工作区并同步远端，再建分支。项目是原生静态网站，无需安装运行依赖。
界面开发请用 `dev/ui-preview.html`，不要误连真实房间。提交前运行离线检查，
涉及界面时检查七语言、双主题及手机布局。格式整理与玩法改动尽量分开；
图片不包含在 MIT 许可中。AI 开发工具共用的维护规则在 [AGENTS.md](AGENTS.md)。
