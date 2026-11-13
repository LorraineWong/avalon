import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const js=read('../app.js'), css=read('../style.css'), html=read('../index.html');
const match=(text,re,msg)=>assert.ok(re.test(text),msg);
const section=(from,to)=>js.slice(js.indexOf(from),js.indexOf(to));

// One-screen side panel: only the action, the identity bar and one row of tabs.
const gameView=section('function viewGame(','function notesStorageKey(');
match(gameView,/actionBlock\(g\).*roleBar\(\)\+toolPanel\(g\)/s,'the game panel must be action + identity bar + tool tabs');
assert.ok(!/rulesBlock\(\)|historyBlock\(g\)|privateNotesPanel\(g\)/.test(gameView),'history, notes and rules must not be stacked in the game panel');
match(js,/function toolPanel\(g\)/,'tool tabs are missing');
match(js,/S\.ui\.tool = S\.ui\.tool===b\.dataset\.tool \? null : b\.dataset\.tool/,'tapping the open tab must collapse it');
match(js,/if\(\(tab==='host' && !hostTools\)/,'host tools must close when the player is no longer host');
match(css,/\.tool-body\{[^}]*max-height:[^}]*overflow:auto/s,'an open tool must scroll inside the panel instead of stretching the page');
match(css,/\.sheet\{position:fixed;left:0;right:0;bottom:0/,'open tools must become a bottom sheet on phones');
match(js,/setProperty\('--dock-h'/,'page padding must follow the real height of the fixed action dock');

// "Which one am I?" — marked on the round table and named in the identity bar.
match(js,/p===ME\.pid\?'<b class="me-chip">'\+t\('meMark'\)/,'my own seat must carry a visible marker');
match(css,/\.seatp\.me:not\(\.picked\) \.pn\{/,'my own name plate needs a distinct style');
match(js,/t\('youAre'\)\+' · '\+t\('seatNo', g\.order\.indexOf\(me\)\+1\)/,'the identity bar must state my seat number');

// Rename at any time, without clobbering a pending vote or quest card.
const rename=section('  rename(pid, nick){','  draftTeam(pid, step, picks){');
match(rename,/transaction\(raw=>/,'rename must merge into the latest seat state');
match(rename,/seat\.nick=nick/,'rename must only change the nickname');
match(js,/function saveRename\(\).*?slice\(0,12\).*?Net\.rename\(ME\.pid, nick\)/s,'rename must be capped and sent through the merge write');
match(js,/case 'editName': return openRename\(\)/,'rename entry point is missing');
match(html,/id="nameModal"/,'the rename dialog mount is missing');

// Lobby: guests see status and line-up, not disabled host controls.
const lobby=section('function viewLobby(','function pickMode(');
match(lobby,/const roleSetup=host \? presets\+compHtml\+lobbyGuideBar\(\)\+advanced : compHtml\+lobbyGuideBar\(\)/,'guests must not be shown host-only setup controls');
match(lobby,/t\('lobbyNeed',need\)/,'the lobby must say how many players are still needed');

console.log('Compact UI test passed.');
