#!/usr/bin/env node
/* Runs every offline check in this folder.
 *   node tests/run-all.mjs          offline checks only
 *   node tests/run-all.mjs --live   also run the production security smoke test,
 *                                   which creates and removes a temporary room and
 *                                   two anonymous users in the live Firebase project */
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir=fileURLToPath(new URL('.',import.meta.url));
const live=process.argv.includes('--live');
const LIVE_ONLY=new Set(['security-smoke-test.mjs']);
const files=readdirSync(dir).filter(f=>f.endsWith('-test.mjs')).filter(f=>live||!LIVE_ONLY.has(f)).sort();

let failed=false;
const root=fileURLToPath(new URL('../',import.meta.url));
function scriptsIn(dir){return readdirSync(root+dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?scriptsIn(dir+entry.name+'/'):/\.(js|mjs)$/.test(entry.name)?[dir+entry.name]:[]);}
const scripts=['site/pwa/service-worker.js',...scriptsIn('site/assets/js/'),...scriptsIn('site/language/'),...scriptsIn('site/config/'),...scriptsIn('scripts/')].sort();
for(const file of scripts){
  const syntax=spawnSync(process.execPath,['--check',root+file],{encoding:'utf8'});
  if(syntax.status!==0) failed=true;
  console.log((syntax.status===0?'PASS':'FAIL')+'  '+file+' syntax');
  if(syntax.status!==0) console.log(syntax.stderr.trim());
}

for(const f of files){
  const r=spawnSync(process.execPath,[dir+f],{encoding:'utf8'});
  const ok=r.status===0; if(!ok) failed=true;
  console.log((ok?'PASS':'FAIL')+'  '+f);
  if(!ok) console.log((r.stderr||r.stdout).trim().split('\n').slice(0,12).join('\n'));
}
if(!live) console.log('SKIP  security-smoke-test.mjs (live Firebase; pass --live to include)');
process.exit(failed?1:0);
