import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
const listeners={}, deleted=[],stored=[],pending=[];
const hits=new Map(), origin='https://example.com', home=origin+'/avalon/';
let offline=false, status=200;
const context={URL,Response,self:{location:{origin,href:home+'service-worker.js'},addEventListener:(type,fn)=>listeners[type]=fn,clients:{claim:async()=>{}},skipWaiting:async()=>{}},
  fetch:async()=>{if(offline)throw Error('offline');return new Response('body',{status});},
  caches:{keys:async()=>['avalon-shell-v24','avalon-shell-v25','another-project-cache'],delete:async key=>deleted.push(key),match:async key=>hits.get(typeof key==='string'?key:key.url)?.clone(),open:async()=>({put:async(req,res)=>stored.push({url:req.url,status:res.status}),addAll:async()=>{}})}};
vm.runInNewContext(source,context);
function event(url,{mode='navigate',destination='',method='GET'}={}){
  let response;
  const e={request:{url,mode,destination,method},waitUntil:p=>pending.push(p),respondWith:p=>response=p};
  listeners.fetch(e);
  return response;
}
listeners.activate({waitUntil:p=>pending.push(p)});await Promise.all(pending.splice(0));
assert.deepEqual(deleted,['avalon-shell-v24'],'keep current and other projects’ caches');
assert.equal(event('https://firebase.example/room'),undefined,'ignore external services');
assert.equal(event(home,{method:'POST'}),undefined,'do not cache writes');
await event(home);await Promise.all(pending.splice(0));
assert.equal(stored.at(-1).status,200,'successful navigation cached with event lifetime');
const count=stored.length;status=404;await event(home+'missing.js',{mode:'cors'});await Promise.all(pending.splice(0));
assert.equal(stored.length,count,'never cache error responses');
status=200;offline=true;
hits.set(home+'index.html',new Response('game shell'));
assert.equal(await (await event(home)).text(),'game shell','offline home fallback');
assert.equal(await (await event(home+'index.html?version=1')).text(),'game shell','offline index fallback');
hits.set(home+'support/',new Response('support page'));
assert.equal(await (await event(home+'support/')).text(),'support page','retain cached public page');
const nested=await event(home+'never-cached/');
assert.equal(nested.status,302);assert.equal(nested.headers.get('location'),home,'uncached nested page redirects to correct base');
const rootContext={...context,self:{...context.self,location:{origin,href:origin+'/service-worker.js'},addEventListener:(type,fn)=>listeners[type]=fn}};
vm.runInNewContext(source,rootContext);
const customDomain=await event(origin+'/never-cached/');
assert.equal(customDomain.headers.get('location'),origin+'/','same behavior at custom-domain root');
console.log('Service worker: isolated cache cleanup, lifetime-tracked writes, no error caching, offline pages and safe nested fallback at project/custom-domain roots.');
