import {readGameSource,readPublic} from './helpers/site.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const js = readGameSource();
const css = readPublic('assets/css/style.css');

assert.match(js, /function assassinationResult\(g, compact=false\)/, 'assassination result component is missing');
assert.match(js, /const role=roles\[target\], hit=role==='merlin'/, 'hit must be derived from the revealed target role');
assert.match(js, /assHit:'杀对了！刺杀命中梅林'/, 'Chinese hit copy must be explicit');
assert.match(js, /assMiss:'杀错了！目标不是梅林'/, 'Chinese miss copy must be explicit');
assert.match(js, /assassinationResult\(g,true\)/, 'the persistent end panel must show the result');
assert.match(js, /assassinationResult\(g\)/, 'the automatic end overlay must show the result');
assert.match(css, /\.assassination-result\.hit/, 'hit styling is missing');
assert.match(css, /\.assassination-result\.miss/, 'miss styling is missing');

console.log('Assassination result checks passed.');
