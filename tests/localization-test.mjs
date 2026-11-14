import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const context={window:{}};
vm.createContext(context);
vm.runInContext(read('locales.js'),context);
const registry=context.window.AvalonLocales, source=read('app.js');
vm.runInContext(source.slice(source.indexOf('const I18N ='),source.indexOf('const REACTIONS ='))+source.slice(source.indexOf('const ROLE_TXT ='),source.indexOf('const ROLE_META ='))+';globalThis.base={messages:I18N,roles:ROLE_TXT};',context);
const {base}=context;
assert.equal(registry.languages.length,7);
assert.equal(new Set(registry.languages.map(l=>l.id)).size,7);
const placeholders=s=>(s.match(/\{\d\}/g)||[]).sort();
for(const language of registry.languages){
 const {id,tag,route}=language, pack=registry.packs[id];
 assert.equal(pack.shell.length,6);
 assert.deepEqual(Object.keys(pack.extra).sort(),Object.keys(registry.packs.en.extra).sort());
 if(!['en','zh'].includes(id)){
  assert.deepEqual(Object.keys(pack.messages).sort(),Object.keys(base.messages.en).sort(),id+' message coverage');
  for(const [key,text] of Object.entries(pack.messages)){
   assert.ok(text.trim(),id+' empty '+key);
   assert.deepEqual(placeholders(text),placeholders(base.messages.en[key]),id+' placeholders '+key);
   assert.deepEqual((text.match(/<\/?b>/g)||[]),(base.messages.en[key].match(/<\/?b>/g)||[]),id+' inline markup '+key);
  }
  assert.deepEqual(Object.keys(pack.roles).sort(),Object.keys(base.roles.en).sort(),id+' role coverage');
  for(const [role,text] of Object.entries(pack.roles))assert.ok(text.length===2&&text.every(Boolean),id+' role '+role);
  for(const kind of ['privacy','legal'])assert.ok(pack.policies[kind].length>500,id+' '+kind);
 }
 const guide=read(route+'/index.html');
 assert.ok(guide.includes('<html lang="'+tag+'">'),id+' HTML language');
 assert.ok(guide.includes('rel="canonical" href="https://lorrainewong.github.io/avalon/'+route+'/"'),id+' canonical');
 assert.equal((guide.match(/class="character-card /g)||[]).length,17,id+' guide roles');
 for(const other of registry.languages)assert.ok(guide.includes('hreflang="'+other.tag+'" href="https://lorrainewong.github.io/avalon/'+other.route+'/"'),id+' alternate '+other.id);
 assert.ok(guide.includes('locales.js?v=22'),id+' locale script');
 assert.ok(read('sitemap.xml').includes('/'+route+'/</loc>'),id+' sitemap');
}
assert.ok(read('service-worker.js').includes('./locales.js?v=22'),'offline locale data');
console.log('Seven languages: complete messages, placeholders, markup, 17 roles, policies, guide metadata and offline shell.');
