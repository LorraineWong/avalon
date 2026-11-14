# Voluntary support page — draft

No payment page or collection link is enabled. The provider and final URL have
not been supplied by the maintainer. Keep the support entry hidden until then.

## Proposed page

Use “Support Avalon Online” / “支持 Avalon Online” as the title, with one short
introduction, a clear use-of-funds explanation and one external support button.
Place the entry in the site menu and footer, without interrupting a live game.
Core gameplay stays free; do not create donor-only roles, voting advantages or
paid access to the original game's material.

Suggested introduction:

> If Avalon Online helped your game night, you can voluntarily support its
> maintenance. Support helps with domain renewals, development and any future
> necessary service costs. Hosting and Firebase currently use free plans.
> No payment is needed to play, and support unlocks no extra features.

> 如果 Avalon Online 帮你们组织了一场开心的游戏，可以自愿支持项目维护。
> 支持款项可用于域名续费、开发维护及未来必要的服务支出。目前网站托管与
> Firebase 使用免费方案。游戏无需付款，支持也不会解锁额外功能。

Include the creation credits and unofficial fan-project notice. Payment data
should stay with the selected payment provider; do not collect card details or
store donor identities in game rooms. Avoid public donor lists by default.

## Before enabling

- The maintainer supplies the final provider and account URL. Check that it can
  receive funds for the maintainer's country and that fees and payout terms are
  understood; no provider has been selected in this draft.
- Prefer a simple voluntary one-time support flow. Do not preselect recurring
  payments; use the provider's actual terms for payments/refunds.
- Translate the final page and menu entry into all seven supported languages.
- Wire both shared `AvalonShell` navigation/footer and the game's fallback
  footer. Merely setting `AVALON_SUPPORT_URL` currently affects only the fallback
  footer; the normal shared footer does not consume that setting.
- Test the link, mobile layout, both themes and privacy notice before enabling.
