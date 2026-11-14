import fs from 'node:fs';
import assert from 'node:assert/strict';

const js = fs.readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../assets/css/style.css', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');

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
assert.ok(fs.existsSync(new URL('../assets/player-avatars.webp', import.meta.url)), 'neutral player portrait sprite is missing');
assert.match(js, /function avStyle\(/, 'players need stable decorative portrait assignments');
assert.match(js, /function selectedTeamReview\(/, 'the leader needs a prominent selected-team summary');
assert.match(js, /pending\.action==='propose'/, 'team submission must pass through the confirmation dialog');
assert.match(css, /\.seatp\.picked \.pav\{outline:/, 'selected players need a high-contrast double ring');
assert.match(css, /\.b-pick-order\{/, 'selected players need a visible selection-order badge');
assert.match(css, /\.known-person\.clue\{/, 'private knowledge must share a visual treatment between the table and role panel');
assert.match(sw, /assets\/player-avatars\.webp/, 'the player portrait sprite must be available offline');

// Quest reveal must not hint at who played which card.
const reveal=js.slice(js.indexOf("} else if(o.type==='quest'){"),js.indexOf("} else if(o.type==='lady'){"));
assert.match(reveal, /i<q\.size-q\.fails\?'S':'F'/, 'revealed quest cards must use one fixed order derived only from the Fail count');
assert.ok(!/shuffle\(/.test(reveal), 'the reveal must not differ between players at the same table');
assert.match(reveal, /t\('shuffledNote'\)/, 'the reveal must say that card order is unrelated to the team list');
assert.match(js, /Object\.assign\(\{\},x,\{r:failed\?'F':'S',fails,team:g\.team,excalibur:excaliburTarget\|\|null\}\)/, 'the public quest record may only carry the result, the Fail count, the team and the Excalibur target');

console.log('Round-table experience checks passed.');
