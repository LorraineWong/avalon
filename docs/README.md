# Project documentation

## Start here

- [Nine-language search-copy review](operations/SEO_COPY_REVIEW_V32.md) — titles and descriptions for all 36 content pages.
- [增长技术审计与分享改进](operations/GROWTH_AUDIT_2026-11-16.md) — SEO、隐私统计方案、优先级与 v36 候选验证范围。
- [公开网站巡检](operations/PUBLIC_SITE_MONITOR.md) — 发布后与每日检查、失败定位、SEO及Firebase人工查看范围。
- [v37 房间邀请](operations/SHARING_V37.md) — 九语言文案、简短链接、优先分享与复制兼容入口。
- [v38 首页横幅](operations/BANNER_V38.md) — 桌面双主题增高与人物裁切，保留手机紧凑布局。
- [SEO and brand v32](operations/SEO_BRAND_V32.md) — candidate assets, verification scope and owner Search Console steps.

- [Main README](../README.md) / [简体中文](../README.zh-CN.md) — project, play links and local preview.
- [Contributing](../CONTRIBUTING.md) — setup, formatting and pull requests.
- [Shared AI instructions](../AGENTS.md) — maintenance rules used by Codex and Claude Code.

## Development and design

- [Architecture](development/ARCHITECTURE.md) — browser/host model, data paths, encryption and phases.
- [Development guide](development/DEVELOPMENT.md) — preview, configuration, checks and deployment.
- [Repository maintenance](development/MAINTENANCE.md) — file responsibilities, sources of truth and staged refactoring.
- [Localization](development/LOCALIZATION.md) — nine languages, translation edits and verification.
- [Design system](development/DESIGN.md) — visual system, components, mobile controls and theme rules.

## Game rules and verification

- [Supported rules](game/BIG_BOX_RULES.md) — characters, modules and known boundaries.
- [Test guide](../tests/README.md) — offline, browser and live-test distinctions.
- [Coverage record](game/PLAYTEST.md) — scenarios, methods, recorded passes and remaining gaps.

## Release and operations

- [Phase 1 tracking](operations/PHASE1_TRACKER.md) — staged migration/operations scope and acceptance gates.
- [New-domain migration plan](operations/DOMAIN_MIGRATION_PLAN.md) — current audit, approvals, cutover, evidence and rollback.
- [New-domain cutover candidate](operations/DOMAIN_CUTOVER_V30.md) — configuration differences, approval gate and v30 validation scope.
- [Cloudflare preview operations](operations/CLOUDFLARE_PREVIEW.md) — dedicated preview command, validation and rollback.
- [China/global access report](operations/CHINA_ACCESS_REPORT.md) — layered evidence and unverified network coverage.
- [负责人运营手册](operations/OWNER_HANDBOOK_ZH.md) — Chinese owner guide; unconfigured services remain marked.
- [Launch readiness](operations/LAUNCH_READINESS.md) — dated security checks and external setup still needed.
- [Personal domain setup](operations/DOMAIN_SETUP.md) — Cloudflare DNS, Pages verification, HTTPS and origin/session cutover.
- [Release checklist](operations/RELEASE.md) — deployment, rollback and launch limitations.
- [Firebase operations](operations/FIREBASE_OPERATIONS.md) — capacity, App Check, cleanup and domains.
- [Emergency shutdown](operations/EMERGENCY.md) — offline-ready incident steps and the two rule files.
- [Support page plan](operations/SUPPORT_PLAN.md) — page configuration, provider comparison and payment activation checklist.

## Privacy, rights and security

- [Privacy notice](policies/PRIVACY.md) — English and Simplified Chinese data-handling reference.
- [Security policy](../.github/SECURITY.md) — trust boundaries and private vulnerability reporting.
- [Licence scope](../NOTICE) — MIT code/docs, excluded images and separate game rights.
- [Image licence](../site/assets/LICENSE.md) — images and screenshots are excluded from MIT.
- [Third-party notices](policies/THIRD_PARTY_NOTICES.md) — bundled libraries and upstream licence copies.

Repository documents are physically grouped by purpose. Static publication
keeps the existing `/docs/NAME.md` URLs, while guide sources in
`site/language/` retain their published language routes. The publication map is
in `scripts/site-layout.mjs`.
