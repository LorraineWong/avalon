// Style lint: literal text sizes, weights and corner radii must come from the shared scale
// documented in docs/development/DESIGN.md. Fluid clamp() sizes and var() tokens are not checked.
import assert from 'node:assert/strict';
import {readPublic} from './helpers/site.mjs';

const TEXT=new Set([10,11,12,13,14,15,16,18,20,24,28]); // px; 30px and above are per-component display sizes
const WEIGHT=new Set([400,500,600,700,800]);
const RADIUS=new Set([0,2,4,6,8,12,16,999]);
const problems=[];
for(const file of ['style.css','theme.css','site-shell.css','landing.css']){
  const css=readPublic('assets/css/'+file);
  const sizes=[...css.matchAll(/font-size:(\d+(?:\.\d+)?)px/g),...css.matchAll(/font:(?:\d{3} )?(\d+(?:\.\d+)?)px/g)];
  for(const m of sizes){ const v=+m[1]; if(v<30&&v!==8&&!TEXT.has(v)) problems.push(file+': text size '+m[1]+'px'); }
  for(const m of [...css.matchAll(/font-weight:(\d+)/g),...css.matchAll(/font:(\d{3}) /g)]) if(!WEIGHT.has(+m[1])) problems.push(file+': font weight '+m[1]);
  for(const m of css.matchAll(/border-radius:([^;}]+)/g)) for(const px of m[1].matchAll(/(\d+(?:\.\d+)?)px/g)) if(!RADIUS.has(+px[1])) problems.push(file+': radius '+px[1]+'px');
}
assert.deepEqual([...new Set(problems)],[],'values outside the design scale');
console.log('Design scale checks passed.');
