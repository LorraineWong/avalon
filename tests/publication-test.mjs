import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readdirSync,readFileSync,lstatSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {prepareSite} from '../scripts/prepare-site.mjs';
import {languages,sourceForPublic} from '../scripts/site-layout.mjs';
const first=mkdtempSync(path.join(os.tmpdir(),'avalon-site-first-')),second=mkdtempSync(path.join(os.tmpdir(),'avalon-site-second-'));
function hashes(root,dir=''){
 return readdirSync(path.join(root,dir)).sort().flatMap(name=>{const relative=path.join(dir,name),full=path.join(root,relative);return lstatSync(full).isDirectory()?hashes(root,relative):[[relative,createHash('sha256').update(readFileSync(full)).digest('hex')]];});
}
try{
 prepareSite(first);prepareSite(second);assert.deepEqual(hashes(first),hashes(second),'publication deterministic');
 for(const lang of languages)assert.ok(readFileSync(path.join(first,lang,'index.html')).equals(readFileSync(sourceForPublic(lang+'/index.html'))),'preserve '+lang+' route/content');
 const files=hashes(first).map(([name])=>name);
 assert.ok(files.includes('index.html')&&files.includes('service-worker.js')&&files.includes('assets/js/game-base.js'));
 assert.ok(files.includes('docs/RELEASE.md'),'preserve published maintenance URL');
 assert.ok(files.every(file=>!file.startsWith('site/')&&!file.startsWith('tests/')&&!file.startsWith('firebase/')&&!file.includes('.git/')),'exclude maintenance internals');
 assert.throws(()=>prepareSite(path.join(os.tmpdir(),'unrelated-owner-folder')),/Output must/,'protect unrelated output directories');
 console.log('Publication: deterministic static files, seven stable guide URLs, preserved maintenance URLs and no private/developer deployment inputs.');
}finally{rmSync(first,{recursive:true,force:true});rmSync(second,{recursive:true,force:true});}
