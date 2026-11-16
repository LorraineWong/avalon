import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {prepareSite} from '../scripts/prepare-site.mjs';
import {checkPublicSite,publicRoutes} from '../scripts/check-public-site.mjs';

const out=mkdtempSync(path.join(os.tmpdir(),'avalon-site-monitor-'));
const origin='https://playavalonnow.com';
const requests=[];
function fixture(url,options){
  const parsed=new URL(url);requests.push(url);
  assert.ok(['playavalonnow.com','www.playavalonnow.com','lorrainewong.github.io','avalon.lorrainewong.dev'].includes(parsed.hostname),'only known public hosts');
  assert.equal(options.credentials,'omit');assert.equal(options.redirect,'manual');assert.equal(options.method,'GET');
  assert.ok(!/rooms|firebase|identitytoolkit/.test(url),'no room/auth/database requests');
  if(parsed.origin!==origin){
    const route=parsed.hostname==='lorrainewong.github.io'?parsed.pathname.replace(/^\/avalon/,''):parsed.pathname;
    return new Response(null,{status:301,headers:{location:origin+route+parsed.search}});
  }
  let file=parsed.pathname;if(file.endsWith('/'))file+='index.html';
  let body;try{body=readFileSync(path.join(out,file));}catch{return new Response('Not found',{status:404});}
  const type=({'.html':'text/html; charset=utf-8','.xml':'application/xml','.txt':'text/plain','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.ico':'image/vnd.microsoft.icon','.webmanifest':'application/manifest+json'})[path.extname(file)];
  return new Response(body,{headers:{'content-type':type}});
}
const run=fetcher=>checkPublicSite({fetcher,attempts:1,retryMs:0,sleep:async()=>{}});
try{
  prepareSite(out);
  const good=await run(fixture);
  assert.equal(good.failed,0,JSON.stringify(good.results.filter(r=>!r.ok)));
  assert.equal(publicRoutes.length,37);assert.ok(good.total>=70);
  for(const [target,change,message] of [
    ['/how-to-play/ja/',r=>new Response(r.body,{headers:{...Object.fromEntries(r.headers),'x-robots-tag':'noindex'}}),'noindex'],
    ['/',async r=>new Response((await r.text()).replace('href="https://playavalonnow.com/" />','href="https://example.invalid/" />'),{headers:r.headers}),'alternates'],
    ['/about/zh-cn/',async r=>new Response((await r.text()).replace('<html lang="zh-CN">','<html lang="en">'),{headers:r.headers}),'language'],
    ['/robots.txt',r=>new Response('User-agent: *\nDisallow: /\nSitemap: https://playavalonnow.com/sitemap.xml'),'blocks root'],
    ['/sitemap.xml',async r=>new Response((await r.text()).replace('<loc>https://playavalonnow.com/</loc>','<loc>https://example.invalid/</loc>')),'sitemap'],
    ['/dev/render-stability.html',async r=>new Response((await r.text()).replace('content="noindex"','content="index"')),'noindex'],
    ['/',async r=>new Response((await r.text()).replaceAll('5–10 players','5–10 friends'),{headers:r.headers}),'player-count'],
    ['/about/en/',async r=>new Response((await r.text()).replace('assets/brand-mark.svg"','assets/brand-mark.svg?cache=old"'),{headers:r.headers}),'icon URLs'],
    ['/how-to-play/en/',async r=>new Response((await r.text()).replace('sizes="96x96"','sizes="32x32"'),{headers:r.headers}),'primary icon'],
    ['/service-worker.js',async r=>new Response((await r.text()).replace(/avalon-shell-v\d+/,'avalon-shell-v0'),{headers:r.headers}),'asset differs'],
    ['/assets/social-preview.png',r=>new Response('not an image',{headers:r.headers}),'asset differs'],
    ['/favicon.ico',r=>new Response(r.body,{headers:{'content-type':'text/html'}}),'content type']
  ]){
    const result=await run(async(url,options)=>{const r=fixture(url,options);return new URL(url).origin===origin&&new URL(url).pathname===target?change(r):r;});
    assert.ok(!result.ok&&result.results.some(r=>!r.ok&&r.error.includes(message)),target+' detects '+message);
  }
  const brokenRedirect=await run((url,options)=>url.startsWith('https://www.')?new Response(null,{status:301,headers:{location:origin+'/'}}):fixture(url,options));
  assert.ok(brokenRedirect.results.some(r=>!r.ok&&r.error.includes('redirect')),'lost path/query detected');
  let calls=0,waits=0;
  const retry=await checkPublicSite({attempts:3,retryMs:0,sleep:async()=>{waits++;},fetcher:(url,options)=>{
    if(url===origin+'/robots.txt'&&++calls<3)return new Response('temporary',{status:503});
    return fixture(url,options);
  }});
  assert.equal(retry.ok,true);assert.equal(calls,3);assert.equal(waits,2);
  calls=0;
  const failed=await checkPublicSite({attempts:3,retryMs:0,sleep:async()=>{},fetcher:(url,options)=>{
    if(url===origin+'/robots.txt'){calls++;return new Response('outage',{status:503});}
    return fixture(url,options);
  }});
  assert.equal(failed.failed,1);assert.equal(calls,3);assert.match(failed.results.find(r=>!r.ok).error,/503/);
  console.log('Public monitor: '+good.total+' passing fixtures; language, indexing, sitemap, redirect, asset, content-type failures; transient retry recovery and permanent failure; no live requests.');
}finally{rmSync(out,{recursive:true,force:true});}
