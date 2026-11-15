import {readGameSource,readPublic} from './helpers/site.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {elements} from './helpers/html.mjs';
const source=readGameSource();
const state={};
vm.runInNewContext(source.match(/const EVIL_N = .*?;/)[0]+source.match(/const SIZES\s*= .*?;/)[0]+'globalThis.rules={EVIL_N,SIZES}',state);
const rows=html=>[...html.replace(/\s+>/g,'>').replace(/>\s+</g,'><').matchAll(/<tr><th scope="row">(\d+)<\/th><td class="good-text">(\d+)<\/td><td class="evil-text">(\d+)<\/td><td><div class="quest-sizes">(.*?)<\/div><\/td><\/tr>/g)];
const registry={window:{}};
vm.runInNewContext(readPublic('assets/js/locales.js'),registry);
vm.runInNewContext(readPublic('assets/js/guide.js'),registry);
for(const {route,id} of registry.window.AvalonLocales.languages){
  const page=route+'/index.html';
  const guide=registry.window.AvalonGuide;
  const html=readPublic(page).replace('<!-- guide:modules -->',guide.modules(id)).replace('<!-- guide:players -->',guide.players(id)), table=rows(html);
  const modules=elements(html,'article').filter(x=>x.class?.split(' ').includes('module-reference'));
  assert.deepEqual(modules.map(x=>x.id),['module-lady','module-excalibur','module-lancelots'],page+' supported module references');
  for(const module of modules){
    const block=html.slice(html.indexOf('id="'+module.id+'"'),html.indexOf('</article>',html.indexOf('id="'+module.id+'"')));
    assert.equal(elements(block,'h3').length,1,page+' named quick module reference');
    if(module.id==='module-lady')assert.ok(block.includes('7–10'),page+' Lady player bounds');
  }
  assert.equal(elements(html,'div').filter(x=>x.class==='guide-player-summary').length,1,page+' player-count explanation');
  assert.equal(elements(guide.modules(id,{settings:{lady:true},n:6}),'article').length,0,'Lady inactive below seven');
  assert.equal(elements(guide.modules(id,{settings:{lady:true,excalibur:true,lancelot:true},n:7}),'article').length,3,'active modules appear in the room reference');
  assert.equal(elements(html,'details').filter(x=>x.class?.includes('guide-')).length,0,'cards and player table remain expanded');
  assert.ok(elements(html,'article').filter(x=>x.class?.split(' ').includes('module-reference')).every(x=>x.class.split(' ').includes('character-card')),'modules reuse public role cards');
  for(const image of elements(html,'img').filter(x=>x.src?.includes('/modules/'))){
    assert.ok(fs.existsSync(new URL('../site/'+image.src.slice(3),import.meta.url)),page+' missing module illustration');
    assert.ok(image.width&&image.height,page+' module image reserves layout space');
  }
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
