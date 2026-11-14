# Public page refinement — v27 review

Prepared on 15 November 2026; the owner approved the final local preview and
authorized merging and publication. Production deployment must be checked
separately after the merge.

## Result

- Shared primary/secondary actions and reliable hover text; blue Start Game,
  red Leave Room, consistent gold Join/Create/Play/Ko-fi actions.
- Compact inline home feature facts, Your Name capitalization, theme-aware
  centered QR title, desktop/mobile About navigation, shared footer/social links.
- About uses a concise single-column introduction and one unboxed support section.
  Payment and credits details are collapsed; personal social links stay on About,
  while the footer links only to the project repository. Ko-fi is external; no checkout,
  payment, receipt-privacy claim or funding target was introduced.
- Twenty-eight static localized content pages, reciprocal hreflang/canonicals,
  29-entry sitemap, and legacy browser redirects. Old routes remain published;
  redirects are not HTTP 301s. Root game identity and room hashes stay on the
  existing origin and path.
- Privacy and terms have in-page contents navigation. English/Simplified Chinese
  copy is reorganized around actual processing, recipients, browser storage,
  retention limits, providers, user choices, conduct, availability, rights,
  support, warranty and contact. Other languages retain their existing
  disclosures with the shared presentation and routing. Native-speaker review
  remains advisable.

## Owner review

The owner approved the current page and policy draft for publication. The existing
13+ age statement, warranty/liability wording and external payment/refund wording
remain part of the published notices.
No governing-law choice, arbitration requirement, deletion deadline, refund
promise or new payment processing was added. This is website documentation and
not a certification of legal compliance. A jurisdiction-specific legal review
and any additional language requirements are separate work.

## Verification scope

Run `node tests/run-all.mjs` and `git diff --check`. The new content-routing suite
checks all 28 generated documents, canonical/hreflang metadata, static localized
navigation, assets, duplicate disclosures and the sitemap. Browser evidence is
saved outside the repository in the dated avalon-polish outputs directory.
All gameplay previews use the fake backend; no production users/rooms, cloud
security settings, DNS, billing or real payments are changed for this work.

## References consulted

- Google recommends distinct URLs for language versions, with hreflang:
  https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- Malaysian Personal Data Protection Commissioner guidance on explaining actual
  processing clearly in privacy notices:
  https://www.pdp.gov.my/en/akta/guidance-on-the-preparation-of-personal-data-protection-notices/

### Local verification completed

All 19 offline suites plus JavaScript syntax checks passed. Browser checks passed
168 home/lobby/content combinations plus 56 vote/quest combinations across seven
languages, light/dark themes and 320/1440px viewports. All 28 localized content
pages were also checked with JavaScript disabled. Start/Leave text contrast
passed 4.5:1 in eight normal/hover/theme combinations. Root language switching
preserved the room hash; the v26 cache was retired and legacy Support navigation
worked offline with the v27 cache. Font requests and animations were disabled
for layout checks. These are simulated viewports and fake-backend previews,
not real devices or production multiplayer/capacity validation.
