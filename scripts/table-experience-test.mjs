import fs from 'node:fs';
import assert from 'node:assert/strict';

const js = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

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
assert.match(js, /function questScore\(/, 'the round table must calculate a persistent quest score');
assert.match(js, /function actionStatus\(/, 'the action card must name players who have not acted');
assert.match(js, /Recruitment and assassination actors are deliberately not exposed/, 'waiting status must protect hidden actor identities');
assert.match(js, /confirmAssassin/, 'assassination must require an explicit confirmation');
assert.match(js, /confirmExcalibur/, 'an Excalibur switch must require an explicit confirmation');
assert.match(js, /confirmAgain/, 'starting another game must require an explicit confirmation');
assert.match(html, /id="confirmModal"/, 'the shared confirmation dialog mount is missing');
assert.match(css, /\.scoreline\{/, 'score styling is missing');
assert.match(css, /\.wait-person\.offline\{/, 'offline waiting-player styling is missing');

console.log('Round-table experience checks passed.');
