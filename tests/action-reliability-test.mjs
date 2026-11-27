import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readGameSource} from './helpers/site.mjs';
const source=readGameSource();
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function context(extra={}){
 const store=new Map(),messages=[];
 const c={window:{},URL,location:{href:'https://playavalonnow.com/?lang=en#SECRET'},LANG:'en',
 S:{code:null,game:null,seats:{},ui:{nick:'Alex',busy:false,myActs:{}}},ME:{pid:'host',pub:{}},
 LS:{get:k=>store.get(k),set:(k,v)=>store.set(k,v)},render(){},toast:m=>messages.push(m),t:k=>k,
 validSeatNick:seat=>!!seat.nick,cleanNick:()=> 'Alex',randCode:()=> 'ABCDE',DEFAULT_SETTINGS:{},ROOM_TTL_MS:1000,
 recordEvent(){},...extra};
 vm.createContext(c);return {c,store,messages};
}
// A successful reservation/seat write is awaited, with double clicks locked out.
{
 const gate=defer();let reservations=0,seats=0;
 const {c}=context({Net:{connected:()=>true,db:{ref:()=>({transaction:async()=>{reservations++;await gate.promise;return {committed:true};}})},pub:async()=>{seats++;return true;},markOnline(){}},enterRoom:code=>{c.S.code=code;}});
 vm.runInContext(section('async function createRoom(){','function joinRoom(){'),c);
 const first=c.createRoom();await c.createRoom();assert.equal(reservations,1);assert.equal(c.S.ui.busy,true);
 gate.resolve();await first;assert.equal(seats,1);assert.equal(c.S.ui.busy,false);
}
// Network failures cannot pretend to create a room, and release the retry lock.
{
 const {c,messages}=context({Net:{connected:()=>true,db:{ref:()=>({transaction:async()=>{throw Error('denied');}})}}});
 vm.runInContext(section('async function createRoom(){','function joinRoom(){'),c);
 await c.createRoom();assert.equal(c.S.code,null);assert.equal(c.S.ui.busy,false);assert.deepEqual(messages,['writeFail']);
}
// No partial role delivery: encryption failure must leave the lobby untouched.
for(const fail of [true,false]){
 const commits=[],events=[];
 const {c}=context({isHost:()=>true,lobbyOrder:()=>['host','guest'],buildRoles:()=>({roles:['merlin','assassin']}),shuffle:a=>a,
 side:r=>r==='merlin'?'good':'evil',rnd:()=>0,SIZES:{2:[2,2,2,2,2]},privateRoleData:id=>({id}),
 enc:async(_pub,obj)=>{if(fail)throw Error('crypto failure');return {encrypted:obj};},
 Net:{ref:{update:async v=>commits.push(v)}},recordEvent:(...e)=>events.push(e)});
 c.S.game={status:'lobby',settings:{},code:'ABCDE',created:1};c.S.seats={host:{pub:{},nick:'A'},guest:{pub:{},nick:'B'}};
 vm.runInContext(section('async function startGame(){','async function playAgain(){'),c);
 await c.startGame();assert.equal(c.S.ui.busy,false);assert.equal(commits.length,fail?0:1);
 if(!fail){assert.deepEqual(Object.keys(commits[0]).sort(),['game','sec/guest','sec/host','sec/master']);assert.equal(JSON.parse(commits[0].game.j).status,'play');assert.equal(events[0][0],'game_started');}
}
// Action encryption and writes share one busy period, and merge the latest seat.
{
 const encryption=defer(),write=defer();let raw=JSON.stringify({nick:'Renamed',reaction:{id:'agree'}}),transactions=0;
 const {c}=context({enc:async()=>{await encryption.promise;return {ct:'encrypted'};},Net:{ref:{child:()=>({transaction:async fn=>{transactions++;raw=fn(raw);await write.promise;}})}}});
 c.S.game={status:'play',order:['host'],host:'host',hostPub:{},step:'g:vote'};c.S.seats.host={nick:'Old'};
 vm.runInContext(section('async function submit(v){','function acted('),c);
 const first=c.submit(true);await c.submit(false);assert.equal(c.S.ui.busy,true);assert.equal(transactions,0);
 encryption.resolve();await new Promise(r=>setTimeout(r,0));assert.equal(transactions,1);assert.equal(c.S.ui.busy,true);
 write.resolve();await first;assert.equal(c.S.ui.busy,false);assert.equal(JSON.parse(raw).nick,'Renamed');assert.equal(JSON.parse(raw).reaction.id,'agree');assert.equal(c.S.ui.myActs['g:vote'],true);
 c.Net.ref.child=()=>({transaction:async()=>{throw Error('denied');}});delete c.S.ui.myActs['g:vote'];
 await c.submit(false);assert.equal(c.S.ui.myActs['g:vote'],undefined);assert.equal(c.S.ui.busy,false);
 c.Net.ref.child=()=>({transaction:async()=>({committed:false})});await c.submit(false);assert.equal(c.S.ui.myActs['g:vote'],undefined,'aborted transaction is not an acknowledged action');
}
console.log('Action reliability: duplicate creation, reservation failure, atomic role deal, encryption failure, action acknowledgement, merge and rejected writes.');

{
 const {c}=context();c.S.seats={host:{nick:'Alex'},guest:{nick:'Ｐｌａｙｅｒ'}};
 vm.runInContext(section('function nickInUse(', 'async function takeSeat('),c);
 assert.equal(c.nickInUse('player'),true,'normalize width and case for duplicate names');
 assert.equal(c.nickInUse('Alex'),false,'own nickname is reusable');
}
// Optional-rule private payloads and public state share one acknowledged commit.
{
 let reject=true;const writes=[];
 const original={roles:{host:'merlin'}},replacement={roles:{host:'merlin'},lancelotDeck:[true]};
 const {c}=context({console:{error(){}},isHost:()=>true,Net:{ver:()=>1,ref:{update:async updates=>{writes.push(updates);if(reject)throw Error('denied');}}}});
 c.S.game={status:'play',gid:'g',host:'host'};c.S.master=original;
 vm.runInContext(section("const PRIVATE_UPDATES=",'async function readAct('),c);
 const key=vm.runInContext('PRIVATE_UPDATES',c),patch={phase:'propose',lancelot:{draws:[{q:1,switched:true}]}};
 patch[key]={updates:{'sec/master':{j:'encrypted'},'sec/guest':{j:'encrypted'}},master:replacement};
 c.computeNext=async()=>patch;
 await c.hostTick();assert.equal(c.S.master,original,'rejected atomic write leaves private state unchanged');
 reject=false;await c.hostTick();assert.equal(c.S.master,replacement);
 assert.deepEqual(Object.keys(writes[1]).sort(),['game','sec/guest','sec/master']);
 assert.doesNotMatch(writes[1].game.j,/lancelotDeck|sec\/master|private updates/,'public JSON cannot contain pending private changes');
}

// A new switching-Lancelot game encrypts the deck only for the host.
{
 const commits=[];
 const {c}=context({isHost:()=>true,lobbyOrder:()=>['host','guest'],buildRoles:()=>({roles:['lancelotGood','lancelotEvil']}),shuffle:a=>a,
 side:r=>r==='lancelotGood'?'good':'evil',rnd:()=>0,SIZES:{2:[2,2,2,2,2]},privateRoleData:id=>({id}),
 enc:async(_pub,obj)=>({encrypted:obj}),Net:{ref:{update:async updates=>commits.push(updates)}}});
 c.S.game={status:'lobby',settings:{lancelot:true,lancelotSwitch:true},code:'ABCDE',created:1};c.S.seats={host:{pub:{},nick:'A'},guest:{pub:{},nick:'B'}};
 vm.runInContext(section('async function startGame(){','async function playAgain(){'),c);await c.startGame();
 const publicState=JSON.parse(commits[0].game.j),privateState=JSON.parse(commits[0]['sec/master'].j).box.encrypted;
 assert.equal(privateState.lancelotDeck.length,5);assert.equal(privateState.lancelotOffset,1);
 assert.doesNotMatch(JSON.stringify(publicState),/deck/i);assert.equal(publicState.lancelot.draws.length,1);
}

for(const saved of [true,false]){
 const {c,store,messages}=context({nickInUse:()=>false,Net:{rename:async()=>saved}});c.S.seats.host={nick:'Old'};
 vm.runInContext(section('async function renameSeat(){','function openRename('),c);assert.equal(await c.renameSeat(),saved);
 assert.equal(messages.includes('renamed'),saved,'rename success is reported only after acknowledgement');
 assert.equal(store.get('nick'),saved?'Alex':undefined);
}
{
 let closed=0;const {c}=context({nickInUse:()=>false,renameSeat:async()=>true,closeRename:()=>closed++});
 c.S.ui.rename={draft:'A'.repeat(20)};vm.runInContext(section('async function saveRename(){','function renderNameModal('),c);
 await c.saveRename();assert.equal(c.S.ui.nick.length,12);assert.equal(closed,1);
}
for(const saved of [true,false]){
 const gate=defer();let calls=0;
 const {c}=context({isHost:()=>true,Net:{pub:async()=>{calls++;await gate.promise;return saved;}}});
 c.S.code='ABCDE';c.S.game={code:'ABCDE',host:'host',status:'lobby',settings:{morgana:true}};
 vm.runInContext(section('async function updateLobbySettings(', 'async function startGame('),c);
 const pending=c.updateLobbySettings({morgana:false,lancelot:true});assert.equal(c.S.ui.busy,true);
 c.toggleSetting('lancelotSwitch');assert.equal(calls,1,'settings cannot race another pending setting write');
 gate.resolve();await pending;assert.equal(c.S.ui.busy,false);assert.equal(c.S.game.settings.morgana,!saved,'only acknowledged settings are shown as saved');
}
// A refreshed client advertises support before inheriting a private Lancelot deck.
for(const supported of [false,true]){
 let writes=0;const {c,messages}=context({isHost:()=>true,extra:key=>key,nickOf:()=> 'Guest',enc:async()=>({ct:'encrypted'}),Net:{isOnline:()=>true,ref:{update:async()=>writes++}}});
 c.S.game={gid:'g',status:'play',settings:{lancelotSwitch:true},order:['host','guest'],host:'host'};
 c.S.master={roles:{},lancelotDeck:[true,false]};c.S.ui.hostSuccessor='guest';
 c.S.seats.guest={pub:{},capabilities:supported?{privateLancelotDeck:1}:{}};
 vm.runInContext(section('async function transferHost(){','/* Player action'),c);await c.transferHost();
 assert.equal(writes,supported?1:0);
 if(!supported)assert.deepEqual(messages,['hostRefreshRequired'],'legacy engine must refresh before receiving a private deck');
}
// Capability advertisement merges into a legacy seat without replacing its action.
{
 let raw=JSON.stringify({pid:'host',nick:'Legacy',act:{k:'step',box:{ct:'encrypted'}}});
 const c={JSON,Object};vm.createContext(c);
 vm.runInContext('globalThis.net={'+section('  advertiseCapabilities(pid){','  draftTeam(')+'};',c);
 c.net.conn=true;c.net.capabilityWrite=false;c.net.ref={child:()=>({transaction:async fn=>{raw=fn(raw);}})};
 await c.net.advertiseCapabilities('host');
 assert.equal(JSON.parse(raw).capabilities.privateLancelotDeck,1);assert.equal(JSON.parse(raw).act.k,'step');assert.equal(JSON.parse(raw).nick,'Legacy');
 assert.equal(c.net.capabilityWrite,false);
}
