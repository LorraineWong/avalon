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

const syntax=spawnSync(process.execPath,['--check',fileURLToPath(new URL('../app.js',import.meta.url))],{encoding:'utf8'});
let failed=syntax.status!==0;
console.log((syntax.status===0?'PASS':'FAIL')+'  app.js syntax');
if(syntax.status!==0) console.log(syntax.stderr.trim());

for(const f of files){
  const r=spawnSync(process.execPath,[dir+f],{encoding:'utf8'});
  const ok=r.status===0; if(!ok) failed=true;
  console.log((ok?'PASS':'FAIL')+'  '+f);
  if(!ok) console.log((r.stderr||r.stdout).trim().split('\n').slice(0,12).join('\n'));
}
if(!live) console.log('SKIP  security-smoke-test.mjs (live Firebase; pass --live to include)');
process.exit(failed?1:0);
