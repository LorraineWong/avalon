import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { attributes, elements, markup } from './helpers/html.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const skip = new Set(['.git', 'node_modules', '.firebase', '.wrangler', '.vscode', '.idea', 'vendor', 'coverage', 'test-results', 'playwright-report']);
const sources = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && /\.(html|css|md)$/.test(path)) sources.push(path);
  }
}
walk(root);

const missing = [];
let references = 0;
function check(source, base, href) {
  if (!href || href.startsWith('#')) return;
  const url = new URL(href.replaceAll('&amp;', '&'), base);
  if (url.protocol !== 'file:') return;
  let path = fileURLToPath(url);
  references++;
  if (!path.startsWith(root)) {
    missing.push(relative(root, source) + ': outside repository: ' + href);
    return;
  }
  if (existsSync(path) && statSync(path).isDirectory()) path = resolve(path, 'index.html');
  if (!existsSync(path) || !statSync(path).isFile()) missing.push(relative(root, source) + ': ' + href);
}

for (const path of sources) {
  const text = readFileSync(path, 'utf8');
  let base = pathToFileURL(path);
  if (path.endsWith('.html')) {
    const declaredBase = elements(text, 'base')[0]?.href;
    if (declaredBase) base = new URL(declaredBase, base);
  }
  if (/\.(html|md)$/.test(path)) {
    for (const [tag] of markup(text).matchAll(/<(?:a|link|script|img|source|video)\b[^>]*>/gi)) {
      const attrs = attributes(tag);
      for (const key of ['href', 'src', 'poster']) if (attrs[key]) check(path, base, attrs[key]);
    }
  }
  if (path.endsWith('.md')) {
    for (const [, angled, plain] of text.matchAll(/!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\s*\)/g)) {
      check(path, base, angled || plain);
    }
  }
  if (path.endsWith('.css')) {
    for (const [, href] of text.matchAll(/url\(\s*["']?([^\s)'";]+)/g)) check(path, base, href);
  }
}

const sw = resolve(root, 'service-worker.js');
const context = { self: { addEventListener() {} } };
runInNewContext(readFileSync(sw, 'utf8') + '\n;globalThis.precache = SHELL;', context);
assert.ok(context.precache.length > 0, 'service worker must have precache entries');
for (const href of context.precache) check(sw, pathToFileURL(sw), href);
assert.deepEqual(missing, [], 'Broken local references:\n' + missing.join('\n'));
console.log(`Repository integrity: ${sources.length} HTML/CSS/Markdown files, ${references} local references including ${context.precache.length} precache entries; no network requests.`);
