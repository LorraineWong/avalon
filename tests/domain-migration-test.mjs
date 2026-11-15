import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareSite} from '../scripts/prepare-site.mjs';
import {languages} from '../scripts/site-layout.mjs';
import {elements} from './helpers/html.mjs';

const origin='https://playavalonnow.com';
const out=mkdtempSync(path.join(os.tmpdir(),'avalon-site-domain-'));
try{
  prepareSite(out);
  const read=name=>readFileSync(path.join(out,name),'utf8');
  assert.equal(read('CNAME').trim(),'playavalonnow.com');
  assert.ok(read('robots.txt').includes('Sitemap: '+origin+'/sitemap.xml'));
  const locations=[...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  assert.equal(locations.length,37);assert.equal(new Set(locations).size,37);
  assert.ok(locations.every(url=>new URL(url).origin===origin));
  const routes=['',...['how-to-play','privacy-policy','terms','about'].flatMap(kind=>languages.map(lang=>kind+'/'+lang+'/'))];
  for(const route of routes){
    const html=read(route+'index.html'),links=elements(html,'link'),meta=elements(html,'meta');
    assert.equal(links.find(link=>link.rel==='canonical')?.href,origin+'/'+route);
    assert.equal(meta.filter(tag=>tag.property==='og:url').length,1,'one Open Graph URL: '+route);
    assert.equal(meta.find(tag=>tag.property==='og:url')?.content,origin+'/'+route);
    for(const name of ['og:title','og:description'])assert.ok(meta.find(tag=>tag.property===name)?.content,'localized social metadata '+route+' '+name);
    for(const name of ['twitter:title','twitter:description'])assert.ok(meta.find(tag=>tag.name===name)?.content,'Twitter metadata '+route+' '+name);
    for(const link of links.filter(link=>link.rel==='alternate'))assert.equal(new URL(link.href).origin,origin);
    for(const tag of meta.filter(tag=>tag.property==='og:image'||tag.name==='twitter:image'))assert.equal(new URL(tag.content).origin,origin);
    assert.ok(!html.includes('avalon.lorrainewong.dev'),'no old-host metadata: '+route);
  }
  const home=read('index.html');
  const game=JSON.parse(home.match(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/)[1]);
  assert.equal(game.url,origin+'/');assert.equal(game.inLanguage.length,9);assert.ok(game.inLanguage.includes('ja')&&game.inLanguage.includes('ko'));
  assert.doesNotMatch(home,/seven languages/i);
  // A website-origin move must not redirect identity/database traffic to a different backend.
  const app=read('assets/js/app.js');
  assert.ok(app.includes("authDomain:'lw-avalon.firebaseapp.com'"));
  assert.ok(app.includes("databaseURL:'https://lw-avalon-default-rtdb.asia-southeast1.firebasedatabase.app'"));
  assert.ok(app.includes("projectId:'lw-avalon'"));
  console.log('Domain migration: 37 canonical/social/sitemap URLs, nine languages, precise origin and unchanged Firebase backend.');
}finally{rmSync(out,{recursive:true,force:true});}
