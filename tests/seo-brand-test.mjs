import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareSite} from '../scripts/prepare-site.mjs';
import {elements} from './helpers/html.mjs';
const origin='https://playavalonnow.com/',out=mkdtempSync(path.join(os.tmpdir(),'avalon-site-seo-'));
try{
  prepareSite(out);
  const read=route=>readFileSync(path.join(out,route));
  const html=route=>read(route+'index.html').toString();
  const home=html(''),title='Play Avalon Online Free | PlayAvalonNow';
  assert.ok(home.includes('<title>'+title+'</title>'));
  assert.ok(home.includes('Create a private room, invite your friends and enjoy social deduction in your browser. No signup or download.'));
  assert.match(home,/<div id="app"><main[\s\S]*?social deduction board game[\s\S]*?propose a team, vote and complete quests/);
  const data=[...home.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const website=data.find(item=>item['@type']==='WebSite'),game=data.find(item=>item['@type']==='VideoGame');
  assert.equal(website.name,'PlayAvalonNow');assert.equal(website.url,origin);
  assert.equal(game.url,origin);assert.equal(game.playMode,'https://schema.org/MultiPlayer');
  assert.equal(game.numberOfPlayers.minValue,5);assert.equal(game.numberOfPlayers.maxValue,10);assert.equal(game.isAccessibleForFree,true);
  const routes=[...read('sitemap.xml').toString().matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].slice(origin.length));
  for(const route of routes){
    const source=html(route),links=elements(source,'link'),meta=elements(source,'meta');
    assert.equal(meta.find(tag=>tag.property==='og:site_name')?.content,'PlayAvalonNow',route);
    for(const tag of ['og:image','twitter:image'])assert.equal(meta.find(item=>item.property===tag||item.name===tag)?.content,origin+'assets/social-preview.png?v=32',route);
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
