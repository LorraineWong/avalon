import fs from 'node:fs';
import assert from 'node:assert/strict';

const js = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');

assert.match(js, /function publicDraftTeam\(/, 'public draft-team projection is missing');
assert.match(js, /Net\.draftTeam\(ME\.pid,S\.game\.step,S\.ui\.pick\.slice\(\)\)/, 'leader picks are not published live');
assert.match(js, /draft\.step!==g\.step/, 'stale draft teams must be ignored');
assert.match(js, /this\.draftWrite=this\.draftWrite/, 'draft writes must stay in click order');
assert.match(js, /class="known-person/, 'skill knowledge should include player avatars');
assert.match(js, /skill-known/, 'known players should be marked on the round table');
assert.match(css, /\.seatp\.picked \.pav\{[^}]*#2aaef2/s, 'draft team selection should use a distinct blue ring');
const finalTable = css.slice(css.lastIndexOf('.table .disc{'), css.indexOf('.disc .ph', css.lastIndexOf('.table .disc{')));
assert.doesNotMatch(finalTable, /repeating-radial-gradient/, 'round table must not use repeating rings');
assert.match(css, /\.qt\.S\{[^}]*#27aef4[^}]*#075c9e/s, 'successful quests must be strongly blue');
assert.match(css, /\.qt\.F\{[^}]*#e05a4c[^}]*#941f1b/s, 'failed quests must be strongly red');
assert.match(css, /\.qcard \.f\.x\{[^}]*#e05245[^}]*#9f201c/s, 'Fail cards must be red, not purple');
assert.match(css, /\.bigres\.evil\{[^}]*#ff756a[^}]*213,55,45/s, 'failed Quest result text must be red');

console.log('Round-table experience checks passed.');
