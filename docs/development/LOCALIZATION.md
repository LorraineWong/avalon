# Localization

Avalon Online supports English (`en`), Simplified Chinese (`zh`), Traditional Chinese (`zh-TW`), Russian (`ru`), Spanish (`es`), Portuguese (`pt`) and Vietnamese (`vi`). The language choice is local to each browser and does not change room data or other players’ language.

- `site/language/locales.js` holds language metadata, supplemental interface copy, and the five added message and role dictionaries. English and Simplified Chinese game dictionaries are in `site/language/game-base.js`.
- Each language has a static rules and role guide at its registered `route`, with its own title, description, canonical URL and reciprocal `hreflang` links.
- Privacy and notice pages use the same language preference. Developer documentation remains in English and Simplified Chinese.
- Translations are bundled static files. Players’ text is never sent to a translation service. The offline shell includes the dictionaries.

## Editing translations

Keep message keys, role IDs, `{0}` / `{1}` placeholders, numeric game rules and `<b>` markup intact. Update both role names and explanations in the game dictionary and the corresponding static guide. Do not translate asset filenames, room payloads or game identifiers.

Run `node tests/run-all.mjs`. The localization check verifies key and placeholder parity, all 17 roles, policy coverage, guide metadata and sitemap entries. Also inspect 320px mobile and desktop layouts in both themes, especially long buttons and headings.

The five added translations began as machine-assisted drafts. Core action labels and alignment names were reviewed for consistency; fluent-player review of idiom and specialist role terminology is still welcome. Report the language, screen and suggested replacement in a GitHub issue without including private room information.

## 中文说明

支持英文、简体中文、繁体中文、俄文、西班牙文、葡萄牙文及越南文。语言偏好仅保存在本机，不改变房间数据或其他玩家的设置。翻译随静态网站发布，不会把玩家输入发送给翻译服务。

修改时保留消息键、角色 ID、参数占位符、规则数字和 HTML 标记，并同步游戏内角色说明与静态指南。运行 `node tests/run-all.mjs`，再检查手机、桌面及两种主题。新增翻译以机器辅助草稿为起点，已统一主要操作和阵营术语，仍欢迎母语玩家进一步校对。

All language-specific source lives in `site/language/`, including the seven
guide directories, project copy and shared privacy additions. Publication maps
guide sources back to the stable `/en/`, `/zh-cn/` and other existing routes.
Do not point browser links at source-only `site/` paths.

### v27 content language navigation

Named static content URLs include both page purpose and language, for example
`/how-to-play/en/`, `/privacy-policy/zh-cn/` and `/about/vi/`. The language selector
navigates to the same content page in the new language. Root game navigation uses
`/?lang=<locale-id>` and preserves room hashes. Static publication chooses the
page language from the URL rather than localStorage; browser preference is only
used when resolving legacy shared URLs.
