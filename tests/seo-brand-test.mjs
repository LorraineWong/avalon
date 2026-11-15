import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,readdirSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareSite} from '../scripts/prepare-site.mjs';
import {elements} from './helpers/html.mjs';
const origin='https://playavalonnow.com/',out=mkdtempSync(path.join(os.tmpdir(),'avalon-site-seo-'));
try{
  prepareSite(out);
  const read=route=>readFileSync(path.join(out,route));
  const html=route=>read(route+'index.html').toString();
  const version=read('service-worker.js').toString().match(/avalon-shell-v(\d+)/)[1];
  const home=html(''),title='Play Avalon Online Free | PlayAvalonNow';
  for(const file of readdirSync(path.join(out,'dev')).filter(name=>name.endsWith('.html'))){
    const meta=elements(read('dev/'+file).toString(),'meta');
    assert.ok(meta.some(tag=>tag.name==='robots'&&tag.content.split(/[\s,]+/).includes('noindex')),'development page must not be indexed: '+file);
  }
  assert.ok(home.includes('<title>'+title+'</title>'));
  assert.ok(home.includes('Create a private room, invite your friends and enjoy social deduction in your browser. No signup or download.'));
  assert.match(home,/<p id="startup-status"[^>]*role="status">Loading game…<\/p>/);
  assert.match(home,/role="progressbar" aria-labelledby="startup-status"/);
  assert.doesNotMatch(home,/aria-valuenow=/);
  assert.doesNotMatch(home,/static-game-introduction|How to play with friends|intro-title/);
  assert.match(home,/<noscript>[\s\S]*?social deduction[\s\S]*?5–10[\s\S]*?<\/noscript>/);
  assert.match(html('how-to-play/zh-cn/'), /<title>阿瓦隆玩法指南：规则、角色与 5–10 人配置 \| PlayAvalonNow<\/title>/);
  assert.match(html('how-to-play/en/'), /<title>How to Play Avalon: Rules, Roles &amp; 5–10 Players \| PlayAvalonNow<\/title>/);
  assert.doesNotMatch(html('how-to-play/en/'), /&amp;amp;|five minutes/);
  const data=[...home.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const website=data.find(item=>item['@type']==='WebSite'),game=data.find(item=>item['@type']==='VideoGame');
  assert.equal(website.name,'PlayAvalonNow');assert.equal(website.url,origin);
  assert.equal(game.url,origin);assert.equal(game.playMode,'https://schema.org/MultiPlayer');
  assert.equal(game.numberOfPlayers.minValue,5);assert.equal(game.numberOfPlayers.maxValue,10);assert.equal(game.isAccessibleForFree,true);
  const copy=JSON.parse(readFileSync(new URL('../site/language/seo-copy.json',import.meta.url),'utf8'));
  assert.equal(Object.keys(copy).length,9);
  const kinds={'how-to-play':'guide','about':'support','privacy-policy':'privacy','terms':'legal'};
  const escape=value=>value.replaceAll('&','&amp;').replaceAll('\"','&quot;');
  const routes=[...read('sitemap.xml').toString().matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].slice(origin.length));
  for(const route of routes){
    const source=html(route),links=elements(source,'link'),meta=elements(source,'meta');
    assert.ok(!meta.some(tag=>tag.name==='robots'&&/noindex/i.test(tag.content)),'public canonical page remains indexable: '+route);
    if(route){
      const [family,language]=route.split('/'),id=({'zh-cn':'zh','zh-tw':'zh-TW'}[language]||language),expected=copy[id][kinds[family]];
      assert.ok(source.includes('<title>'+escape(expected.title+' | PlayAvalonNow')+'</title>'),route+' authored title');
      for(const field of ['og:title','twitter:title'])assert.equal(meta.find(m=>m.name===field||m.property===field)?.content,escape(expected.title+' | PlayAvalonNow'),route+' '+field);
      for(const field of ['description','og:description','twitter:description'])assert.equal(meta.find(m=>m.name===field||m.property===field)?.content,escape(expected.description),route+' '+field);
      const scripts=elements(source,'script').map(s=>s.src||'');
      if(family==='how-to-play')assert.ok(!scripts.some(src=>/\/(project|project-copy|policy-copy|policy-pages)\.js/.test(src)),route+' no unused content helpers');
      if(family==='about')assert.ok(scripts.some(src=>/\/project\.js/.test(src)),route+' project renderer retained');
      if(family==='terms'||family==='privacy-policy')assert.ok(scripts.some(src=>/\/policy-pages\.js/.test(src)),route+' policy renderer retained');
    }
    assert.equal(meta.find(tag=>tag.property==='og:site_name')?.content,'PlayAvalonNow',route);
    for(const tag of ['og:image','twitter:image'])assert.equal(meta.find(item=>item.property===tag||item.name===tag)?.content,origin+'assets/social-preview.png?v='+version,route);
    for(const tag of ['og:image:alt','twitter:image:alt','og:image:width','og:image:height'])assert.ok(meta.some(item=>(item.property===tag||item.name===tag)&&item.content),tag+' '+route);
    for(const link of links.filter(item=>['icon','apple-touch-icon'].includes(item.rel)))read(new URL(link.href,origin+route).pathname.slice(1));
    for(const alternate of links.filter(link=>link.hreflang)){
      const target=alternate.href.slice(origin.length),targetLinks=elements(html(target),'link');
      assert.equal(targetLinks.find(link=>link.rel==='canonical')?.href,alternate.href,'alternate must be canonical: '+route);
      if(alternate.hreflang!=='x-default'){
        assert.equal(elements(html(target),'html')[0].lang,alternate.hreflang,'language: '+route);
        assert.ok(targetLinks.some(link=>link.hreflang&&link.href===origin+route),'reciprocal: '+route);
      }
      if(route)assert.equal(target.split('/')[0],route.split('/')[0],'alternate must describe the same content');
    }
  }
  const png=read('assets/social-preview.png');assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
  for(const [name,size] of [['favicon-96',96],['favicon-48',48],['apple-touch-icon',180],['pwa-192',192],['pwa-512',512],['pwa-maskable-512',512]]){
    const bytes=read('assets/'+name+'.png');assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);
  }
  const ico=read('favicon.ico');assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),3);
  console.log('SEO brand: 37 pages, canonical reciprocal language families, JSON-LD, sharing and icon dimensions.');
}finally{rmSync(out,{recursive:true,force:true});}
