import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const state={};
vm.runInNewContext(source.match(/const EVIL_N = .*?;/)[0]+source.match(/const SIZES\s*= .*?;/)[0]+'globalThis.rules={EVIL_N,SIZES}',state);
const rows=html=>[...html.replace(/\s+>/g,'>').replace(/>\s+</g,'><').matchAll(/<tr><th scope="row">(\d+)<\/th><td class="good-text">(\d+)<\/td><td class="evil-text">(\d+)<\/td><td><div class="quest-sizes">(.*?)<\/div><\/td><\/tr>/g)];
const registry={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../locales.js',import.meta.url),'utf8'),registry);
for(const {route} of registry.window.AvalonLocales.languages){
  const page=route+'/index.html';
  const html=fs.readFileSync(new URL('../'+page,import.meta.url),'utf8'), table=rows(html);
  assert.equal(table.length,6,`${page} must include all player counts`);
  for(const [,players,good,evil,sizes] of table){
    const n=Number(players);
    assert.equal(Number(evil),state.rules.EVIL_N[n]);
    assert.equal(Number(good),n-state.rules.EVIL_N[n]);
    assert.deepEqual([...sizes.matchAll(/<span class="[^"]*">(\d+)<\/span>/g)].map(x=>Number(x[1])),Array.from(state.rules.SIZES[n]));
  }
}
const definitions=new Set([...source.slice(source.indexOf('const ICONS = {'),source.indexOf('const roleIcon')).matchAll(/^  (\w+):/gm)].map(x=>x[1]));
for(const [,name] of source.matchAll(/\bic\('([^']+)'\)/g)) assert.ok(definitions.has(name),`Unknown SVG icon: ${name}`);
console.log('Guide reference checks passed: player balances, Quest team sizes and named SVG icons.');
