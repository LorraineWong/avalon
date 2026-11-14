import {readGameSource,readPublic} from './helpers/site.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { elements } from './helpers/html.mjs';

const app = readGameSource();
const html = readPublic('index.html');
const sw = readPublic('service-worker.js');
const manifest = JSON.parse(readPublic('manifest.webmanifest'));
const sitemap = readPublic('sitemap.xml');

for(const id of ['agree','think','sus','shock','laugh','sword']){
  assert.match(app, new RegExp(`id:'${id}'`), `missing reaction ${id}`);
}
assert.match(app, /transaction\(raw=>/, 'reactions must merge with the latest seat state');
assert.match(app, /now-S\.ui\.lastReactionAt<700/, 'reaction client rate limit is missing');
assert.match(app, /REACTION_MS = 5000/, 'reactions should expire from the board');
assert.ok(elements(html,'link').some(link=>link.rel==='manifest'&&link.href==='manifest.webmanifest'), 'manifest link is missing');
assert.match(html, /application\/ld\+json/, 'structured game data is missing');
assert.match(html, /hreflang="zh-CN"/, 'Chinese localized URL is missing');
assert.match(html, /hreflang="en"/, 'English localized URL is missing');
for(const page of ['zh-cn/index.html','en/index.html','privacy/index.html','unofficial-notice/index.html']){
  const source=readPublic(page);
  assert.match(source, /<title>[^<]+<\/title>/, `${page} needs a title`);
  assert.ok(elements(source,'meta').some(meta=>meta.name==='description'&&meta.content?.trim()), `${page} needs a description`);
  assert.match(sitemap, new RegExp(page.replace('index.html','').replace(/[/-]/g, m=>'\\'+m)), `${page} is missing from sitemap`);
}
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, './');
assert.ok(manifest.icons.some(icon=>icon.purpose.includes('maskable')), 'maskable app icon is missing');
assert.match(sw, /request\.mode === 'navigate'/, 'navigation fallback is missing');
assert.match(sw, /url\.origin !== self\.location\.origin/, 'service worker must ignore Firebase and other origins');

console.log('Public experience test: reactions, PWA and SEO checks passed.');
