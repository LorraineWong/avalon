# v28 public UI, guides and language review

The owner authorised this release on 15 November 2026 after iterative local
review. Production publication must still be verified against the merged SHA.

## Resulting behavior

- Home, content pages and room layouts share a 1208px maximum content boundary
  and 16px side gutters. Room explanatory text uses the shared type scale;
  Host-transfer guidance is readable in both themes.
- Main navigation switches to the side menu at <=1200px instead of wrapping
  into a second header row. Resize and keyboard focus follow that breakpoint.
- Room synchronization reuses unchanged DOM nodes, preserving note focus,
  text selection and panel/page scroll. Real state updates still render.
- About copy is concise and personal across all nine languages. Approved links,
  collapsed payment/credit disclosures, rights notices and image exclusions stay.
- Public and room quick guides use brief shared module/player explanations.
  Good/Evil cards, module cards and the six-row player/Quest table are expanded.
  Modules reuse the surrounding role-card layout and use neutral gold titles.
  The unsupported-extension sentence is removed, as requested by the owner.
- Original Lake/Excalibur illustrations accompany the guide; Lancelot portraits
  are reused. No new game module or gameplay rule was implemented.
- Japanese and Korean cover all 321 game messages, 17 roles, shell/menu text,
  project page, guides and policy disclosures. There are 36 named localized
  static pages and 37 sitemap URLs. Existing URLs remain browser-redirect
  compatible; no HTTP 301 or search-indexing claim is made.
- Cache and first-party asset queries advance together to v28. The offline
  shell includes the shared guide renderer and new localized About routes.

## Validation and limits

The default offline suites and syntax checks cover key/placeholder/markup
parity, rules, simulated multiplayer, publication, routes, sitemap and caches.
Local real-browser checks cover all nine languages, both themes and phone /
intermediate / desktop widths. Guide checks verify expanded content and matching
card geometry. Changed-update regressions preserve note nodes, focus, selection
and scroll while remote names and phase changes still update. Player counts
5–10, no-JavaScript content, language/hash switching and offline About were
also checked. `dev/render-stability.html` is a repeatable fake-backend regression.

These are browser viewport and simulated-backend results, not physical-device,
capacity or new production multiplayer tests. Translations are AI-assisted;
native-speaker and legal certification are not claimed. Policy translations
preserve the existing disclosures and do not alter billing or service promises.

## Production boundary

Publishing uses the existing protected-main PR/Offline tests/squash-merge flow
and automatic Pages deployment. Distinguish the Cloudflare preview status from
Pages and Workers main statuses. No Firebase rules, App Check enforcement, DNS,
allowed origins, payment settings or billing changes belong to this release.
