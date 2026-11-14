# Project documentation

## Start here

- [Main README](../README.md) / [简体中文](../README.zh-CN.md) — project, play links and local preview.
- [Contributing](../CONTRIBUTING.md) — setup, formatting and pull requests.
- [Shared AI instructions](../AGENTS.md) — maintenance rules used by Codex and Claude Code.

## Development and design

- [Architecture](development/ARCHITECTURE.md) — browser/host model, data paths, encryption and phases.
- [Development guide](development/DEVELOPMENT.md) — preview, configuration, checks and deployment.
- [Repository maintenance](development/MAINTENANCE.md) — file responsibilities, sources of truth and staged refactoring.
- [Localization](development/LOCALIZATION.md) — seven languages, translation edits and verification.
- [Design system](development/DESIGN.md) — visual system, components, mobile controls and theme rules.

## Game rules and verification

- [Supported rules](game/BIG_BOX_RULES.md) — characters, modules and known boundaries.
- [Test guide](../tests/README.md) — offline, browser and live-test distinctions.
- [Coverage record](game/PLAYTEST.md) — scenarios, methods, recorded passes and remaining gaps.

## Release and operations

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
