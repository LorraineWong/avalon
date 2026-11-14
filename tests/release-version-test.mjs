import {readPublic} from './helpers/site.mjs';
// Every cache-busting ?v=N in the shipped pages and the service-worker shell list
// must use the same number as the service-worker cache name, so a release cannot
// ship a half-bumped set of assets.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const guides=['en','zh-cn','zh-tw','ru','es','pt','vi','privacy','unofficial-notice','support'].map(d=>d+'/index.html');
const files=['index.html',...guides,'dev/ui-preview.html','service-worker.js'];
const seen=new Map();
for(const f of files){
  const found=readPublic(f).match(/\?v=\d+/g)||[];
  assert.ok(found.length>0, f+' has no ?v= asset version');
  for(const v of found){ if(!seen.has(v)) seen.set(v,[]); seen.get(v).push(f); }
}
assert.equal(seen.size, 1, 'asset versions differ: '+[...seen].map(([v,fs])=>v+' in '+[...new Set(fs)].join(', ')).join('; '));
const cache=readPublic('service-worker.js').match(/const CACHE = 'avalon-shell-v(\d+)'/);
assert.ok(cache, 'service-worker.js has no avalon-shell-vN cache name');
assert.equal([...seen.keys()][0], '?v='+cache[1], 'asset version does not match the service-worker cache name');
console.log('release version ok: '+[...seen.keys()][0]);
