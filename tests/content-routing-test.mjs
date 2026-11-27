import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,existsSync} from 'node:fs';
import os from 'node:os';import path from 'node:path';
import {prepareSite} from '../scripts/prepare-site.mjs';
import {languages} from '../scripts/site-layout.mjs';
import {elements} from './helpers/html.mjs';
const out=mkdtempSync(path.join(os.tmpdir(),'avalon-site-routes-'));
try{
 prepareSite(out);
 for(const lang of languages)for(const page of ['how-to-play','privacy-policy','terms','about']){
  const route=page+'/'+lang+'/',html=readFileSync(path.join(out,route,'index.html'),'utf8');
  const links=elements(html,'link');
  assert.equal(links.filter(l=>l.rel==='canonical').length,1);
  assert.ok(links.some(l=>l.rel==='canonical'&&l.href==='https://playavalonnow.com/'+route));
  assert.equal(links.filter(l=>l.rel==='alternate'&&l.hreflang!=='x-default').length,languages.length,'all language alternates');
  assert.equal(elements(html,'h1').length,1,'one static page heading');
  assert.equal((html.match(/id="privacy-additions"/g)||[]).length,page==='privacy-policy'?1:0,'no duplicate privacy content');
  assert.equal((html.match(/id="project-credits"/g)||[]).length,page==='about'?1:0,'credits live only on About');
  const anchors=elements(html,'a');
  for(const name of ['how-to-play','privacy-policy','terms','about'])assert.ok(anchors.some(l=>l.href==='../../'+name+'/'+lang+'/'),'static localized navigation '+name);
  for(const element of [...elements(html,'script'),...links]){
   const href=element.src||element.href;if(!href||/^https?:/.test(href))continue;
   assert.ok(existsSync(path.resolve(out,route,href.split('?')[0])),'packaged asset '+route+' '+href);
  }
 }
 const redirects=readFileSync(path.join(out,'_redirects'),'utf8').trim().split('\n').map(line=>line.split(' '));
 const targets=new Map(redirects.map(([from,to,status])=>{assert.equal(status,'301');return [from,to];}));
 assert.equal(targets.size,redirects.length,'no duplicate redirect sources');
 for(const [from,to] of targets){
  assert.notEqual(from,to,'no self redirect');assert.ok(!targets.has(to),'all aliases redirect directly, never chain');
  assert.ok(existsSync(path.join(out,to,'index.html')),'redirect target is a real page');
 }
 assert.equal(targets.get('/how-to-play/'),'/how-to-play/en/');
 for(const page of ['how-to-play','privacy-policy','terms','about']){
  const root=readFileSync(path.join(out,page,'index.html'),'utf8');
  assert.ok(!root.includes('<script>'),'fallback has a single deterministic language target');
  assert.equal(elements(root,'link').find(x=>x.rel==='canonical').href,'https://playavalonnow.com/'+page+'/en/');
 }
 const xml=readFileSync(path.join(out,'sitemap.xml'),'utf8');assert.equal((xml.match(/<loc>/g)||[]).length,1+languages.length*4);
 assert.equal(xml,readFileSync(new URL('../site/meta/sitemap.xml',import.meta.url),'utf8'),'source and output sitemap agree');
 console.log('Content routing: 36 localized static pages, reciprocal alternates, named navigation, 37 sitemap entries and legacy route preservation.');
}finally{rmSync(out,{recursive:true,force:true});}
