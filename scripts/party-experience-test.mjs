import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');

assert.match(js,/function presetSettings\(id,n\)/,'role presets are missing');
assert.match(js,/if\(n>=7\)\{ st\.morgana=false; st\.lancelot=true; st\.lady=true; \}/,'expansion preset must adapt to player count');
assert.match(js,/if\(b\.dataset\.quest\)\{ S\.ui\.questConfirm=b\.dataset\.quest; return render\(\); \}/,'Quest cards must enter confirmation instead of submitting immediately');
assert.match(js,/case 'questSubmit'/,'Quest confirmation action is missing');
assert.match(js,/function privacyCoverHtml\(\)/,'privacy cover is missing');
assert.match(js,/if\(S\.ui\.privacyCover\) S\.peek=false/,'covering the screen must hide the open role');
assert.match(html,/vendor\/qrcode\.min\.js/,'local QR generator is not loaded');
assert.match(sw,/vendor\/qrcode\.min\.js/,'QR generator is not in the PWA shell');
assert.match(js,/function renderQRModal\(\)/,'QR invite modal is missing');
assert.match(js,/const box=await enc\(seat\.pub,S\.master\)/,'host master state must be encrypted for the successor');
const transfer=js.slice(js.indexOf('async function transferHost'),js.indexOf('/* Player action'));
assert.match(transfer,/await Net\.ref\.update\(\{/,'host transfer must use one atomic database update');
assert.match(transfer,/'sec\/master':\{j:JSON\.stringify\(\{gid:g\.gid,box\}\)\}/,'atomic host transfer must include the successor-encrypted master');
assert.match(transfer,/game:\{host:target,j:JSON\.stringify\(next\)\}/,'atomic host transfer must include the new host state');
assert.match(js,/g\.status!=='lobby' \|\| S\.seats\[ME\.pid\]/,'players may take a seat only while the room is in the lobby');
assert.match(js,/if\(g && g\.status==='lobby'\)/,'leaving the lobby must release the player seat');
assert.match(js,/status:'lobby'.*settings:g\.settings/s,'Play again must return the same room to an open lobby');
assert.match(js,/function lobbyGuideBar\(/,'the lobby needs a compact, early rules launcher');
assert.match(js,/data-a="rulesLineup".*data-a="rulesFull"/s,'the guide must separate current roles from the full rules');
const lobbyView=js.slice(js.indexOf('function viewLobby'),js.indexOf('function pickMode'));
assert.doesNotMatch(lobbyView,/rulesBlock\(\)/,'the lobby must not render the complete inline role catalogue');
assert.match(lobbyView,/details class="settings-advanced".*S\.ui\.settingsOpen/s,'individual role cards must be collapsed by default with persistent open state');

console.log('Party experience checks passed.');
