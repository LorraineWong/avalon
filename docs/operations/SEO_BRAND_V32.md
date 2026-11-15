# PlayAvalonNow SEO and branding — v32

Prepared 15 November 2026, Malaysia time. **Candidate changes, not a production
release record.** Production checks below refer to v31 until v32 is merged and
deployed. No Search Console submissions or social posts were made.

## Changes

- Home title: `Play Avalon Online Free | PlayAvalonNow`; description uses the
  owner's supplied text. Open Graph and Twitter metadata share the formal
  origin, brand, 1200×630 PNG and `?v=32` image URL.
- `WebSite` names the site PlayAvalonNow. `VideoGame` retains Avalon Online as
  the game name and adds PlayAvalonNow as an alternate name. Its multiplayer
  enumeration is an explicit Schema.org URL; no invented ratings or reviews.
- Canonicals are retained. Home has self-referencing English and x-default
  alternates. The game is not a translation of a rules guide. The nine guide,
  About, privacy and terms translations retain reciprocal alternates within
  each page family, matching HTML language and canonical targets. Home links
  to all nine guides. Legacy guides point to their canonical language family.
- Home has substantive, visible HTML before JavaScript, including room setup,
  rules, win conditions and guide links. The normal home UI keeps its original layout and adds only a semantic main
  landmark. The owner rejected an extra visible guide card; it was removed. No hidden keyword blocks or crawler-only UI.
- Existing round-table/sword mark has light/dark SVG and 512px PNG exports.
  Theme selection changes the actual mark in the shared header and game UI.
  Stable 48/96px PNG and multi-size ICO favicons, opaque 180px Apple icon,
  192/512px PWA PNGs and separate safely inset maskable PNG reuse the mark.
- Share artwork uses the existing Merlin/Morgana assets. The owner's requested
  removal of the lower-left fan-project caption applies to the share artwork;
  project credits and the site's fan-project notice are retained.
- Runtime asset queries and service-worker cache advance together to v32.
  No gameplay, room URLs, cryptography, Firebase permissions, billing, tracking,
  third-party dependencies or deployment workflows were changed.
- README points to canonical guides. Old domain/setup documents now explicitly
  mark earlier instructions as history and direct readers to current records.

## Reproducing the artwork

Run `node scripts/prepare-site.mjs`, serve `dist/`, open
`/dev/social-preview.html`, and take a 1200×630 screenshot at device scale 1.
Save it as `site/assets/social-preview.png`, then prepare the site again.
The artwork page is noindex. Image licensing exclusions remain in effect.

## Validation

See the validation results appended below. Offline simulations and responsive
browser emulation do not establish live phone multiplayer compatibility.
Simulated crawler User-Agent requests do not establish actual platform cache
refreshes. JSON parsing/property checks do not guarantee a Google rich result.

## Owner actions after publication

1. Confirm the Pages deployment is for the merged v32 commit, then check home,
   the versioned sharing image, `/assets/favicon-96.png`, `/favicon.ico`,
   `/robots.txt` and `/sitemap.xml`; recheck all 37 sitemap locations.
2. In the existing Search Console property, inspect `https://playavalonnow.com/`.
   Run **Test live URL**, open the tested-page screenshot, and check crawl/index
   permissions. Request indexing once if appropriate. Sitemap was already added;
   do not add it again or replace the verification method without a reason.
3. Inspect English and Simplified Chinese guides and English About if needed.
   Let the existing sitemap expose the remaining translated pages. Review
   Google's selected canonical in indexed results, not only the live test.
4. Use Facebook Sharing Debugger's **Scrape Again** after deployment. In
   WhatsApp and Discord, paste the home link into a private draft and inspect
   the card before sending. There is no need to publish a promotion post.
   Image versioning helps image caches; existing message previews may persist.
5. On a real phone and desktop, create/join a new temporary room and complete
   proposals, voting, quests and assassination/end; verify language/theme,
   reconnect and an existing PWA session's upgrade. Remove test rooms/accounts.
   Production acceptance for this candidate remains pending until this is done.

Google chooses site names, favicons, title links and snippets algorithmically;
these changes cannot guarantee a specific logo, snippet, ranking or index date.

## Official references checked

- [Site names](https://developers.google.com/search/docs/appearance/site-names)
- [Search favicons](https://developers.google.com/search/docs/appearance/favicon-in-search)
- [Localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [URL inspection](https://support.google.com/webmasters/answer/9012289)
- [Open Graph](https://ogp.me/)
- [Facebook sharing](https://developers.facebook.com/documentation/sharing/webmasters)
- [VideoGame vocabulary](https://schema.org/VideoGame)

## Candidate validation results

- `node tests/run-all.mjs`: all 38 syntax/regression checks passed; the live
  Firebase permission smoke suite was deliberately not invoked.
- Browser: 54 home combinations (nine languages × two themes × 320/390/1440px),
  five fake-backend room screens, manual theme switching and readable HTML with
  JavaScript disabled passed. No extra homepage guide card remains. No page
  exceptions, broken home images or horizontal home overflow in this matrix.
- Canonical/language tests cover all 37 sitemap pages, reciprocal same-content
  alternates, valid JSON-LD fields, share metadata and icon dimensions.
- Current production v31: robots/sitemap and all 37 listed pages returned 200.
  Both candidate files and current public files returned 200 for three simulated
  social-crawler User-Agents. Actual WhatsApp/Discord/Facebook previews remain
  pending v32 publication and platform-side refresh.
- Old host and www returned 301; a browser preserved `?lang=zh#SEO32` through the
  old-host redirect. This verifies URL transport, not cross-origin migration of
  the old room's local identity or private keys.
- Local worker test: a seeded v31 cache was removed, v32 precached 51 entries,
  and home plus Japanese/Korean About worked offline. This is a local candidate
  check; a real existing production PWA session still needs release acceptance.
- Homepage accessibility spot checks: one H1/main landmark, no missing image alt
  attributes, labeled inputs and keyboard focus movement. This is not a complete
  WCAG audit or a screen-reader certification.
- Cold local lab at 1.6 Mbps/150 ms/4× CPU, external fonts and production backend
  blocked: mobile last observed LCP ~4.8 s, CLS ~0.079; desktop ~9.2 s, CLS ~0.024.
  These observations do not meet a claim of fast mobile performance. They include
  initial HTML replacement and existing large scripts/hero resources; prioritise
  a separate measured asset/loading pass if speed is the next objective. They
  are not field Core Web Vitals and do not include real App Check/database load.

Evidence retained locally in the task's `avalon-seo/outputs` folder: offline.txt,
browser.json, http.json, pwa.json, performance-accessibility.json and screenshots.
No production game, real mobile multiplayer session or Search Console submission
was performed for this candidate. Previously recorded v30/v31 results are not
relabelled as v32 passes.

## Search-result copy follow-up

The owner supplied a Google results screenshot showing the default globe icon
and a generic Chinese guide title/snippet. The generator previously overwrote
all authored guide titles with generic navigation labels. It now preserves
specific guide titles in all nine languages and adds the PlayAvalonNow brand.
English/Simplified/Traditional Chinese guide descriptions now state the actual
rules/roles/player-count content and free-room benefit without a promised
learning time. Legacy guide routes share the same authored metadata. Public-page
runtime titles also retain the same brand. No visible homepage module was added.

These are preference signals for Google, not guaranteed search-result text.
Existing results require a new crawl after publication; do not remove useful
indexed pages merely to hide an older title or default icon.
