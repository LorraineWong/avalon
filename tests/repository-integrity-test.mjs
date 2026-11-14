import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync,statSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {attributes,elements,markup} from './helpers/html.mjs';
import {prepareSite} from '../scripts/prepare-site.mjs';
const repository=fileURLToPath(new URL('../',import.meta.url));
const publication=mkdtempSync(resolve(os.tmpdir(),'avalon-site-integrity-'));
const skip=new Set(['.git','node_modules','.firebase','.wrangler','.vscode','.idea','vendor','coverage','test-results','playwright-report','dist']);
let references=0,files=0;const missing=[];
function inspect(root,markdownOnly=false){
 function check(source,base,href){
  if(!href||href.startsWith('#'))return;
  const url=new URL(href.replaceAll('&amp;','&'),base);if(url.protocol!=='file:')return;
  let path=fileURLToPath(url);references++;
  if(!path.startsWith(root)){missing.push(relative(root,source)+': outside root '+href);return;}
  if(existsSync(path)&&statSync(path).isDirectory())path=resolve(path,'index.html');
  if(!existsSync(path)||!statSync(path).isFile())missing.push(relative(root,source)+': '+href);
 }
 function walk(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
   if(skip.has(entry.name))continue;const path=resolve(dir,entry.name);
   if(entry.isDirectory()){walk(path);continue;}
   if(!entry.isFile()||!(markdownOnly?/\.md$/:/\.(html|css|md)$/).test(path))continue;
   files++;const text=readFileSync(path,'utf8');let base=pathToFileURL(path);
   if(path.endsWith('.html')){const declared=elements(text,'base')[0]?.href;if(declared)base=new URL(declared,base);}
   if(/\.(html|md)$/.test(path))for(const[tag]of markup(text).matchAll(/<(?:a|link|script|img|source|video)\b[^>]*>/gi)){
    const attrs=attributes(tag);for(const key of ['href','src','poster'])if(attrs[key])check(path,base,attrs[key]);
   }
   if(path.endsWith('.md'))for(const[,angled,plain]of text.matchAll(/!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\s*\)/g))check(path,base,angled||plain);
   if(path.endsWith('.css'))for(const[,href]of text.matchAll(/url\(\s*["']?([^\s)'";]+)/g))check(path,base,href);
  }
 }
 walk(root);
 if(!markdownOnly){
  const sw=resolve(root,'service-worker.js'),context={self:{addEventListener(){}}};
  runInNewContext(readFileSync(sw,'utf8')+';globalThis.precache=SHELL;',context);
  assert.ok(context.precache.length);for(const href of context.precache)check(sw,pathToFileURL(sw),href);
 }
}
try{
 prepareSite(publication);inspect(repository,true);inspect(publication+'/');
 assert.deepEqual(missing,[],'Broken source/public references:\n'+missing.join('\n'));
 console.log(`Repository and publication integrity: ${files} files, ${references} local references including offline precache; no network.`);
}finally{rmSync(publication,{recursive:true,force:true});}
