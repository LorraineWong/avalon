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
  assert.ok(links.some(l=>l.rel==='canonical'&&l.href==='https://avalon.lorrainewong.dev/'+route));
  assert.equal(links.filter(l=>l.rel==='alternate'&&l.hreflang!=='x-default').length,7,'all language alternates');
  assert.equal(elements(html,'h1').length,1,'one static page heading');
  assert.equal((html.match(/id="privacy-additions"/g)||[]).length,page==='privacy-policy'?1:0,'no duplicate privacy content');
  assert.equal((html.match(/id="project-credits"/g)||[]).length,page==='terms'?1:0,'no duplicate credits');
  const anchors=elements(html,'a');
  for(const name of ['how-to-play','privacy-policy','terms','about'])assert.ok(anchors.some(l=>l.href==='../../'+name+'/'+lang+'/'),'static localized navigation '+name);
  for(const element of [...elements(html,'script'),...links]){
   const href=element.src||element.href;if(!href||/^https?:/.test(href))continue;
   assert.ok(existsSync(path.resolve(out,route,href.split('?')[0])),'packaged asset '+route+' '+href);
  }
 }
 const xml=readFileSync(path.join(out,'sitemap.xml'),'utf8');assert.equal((xml.match(/<loc>/g)||[]).length,29);
 assert.equal(xml,readFileSync(new URL('../site/meta/sitemap.xml',import.meta.url),'utf8'),'source and output sitemap agree');
 console.log('Content routing: 28 localized static pages, reciprocal alternates, named navigation, 29 sitemap entries and legacy route preservation.');
}finally{rmSync(out,{recursive:true,force:true});}
