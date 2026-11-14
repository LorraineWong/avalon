import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
const start=app.indexOf('function validSeatNick('),end=app.indexOf('function cleanNick(',start);
const box={};vm.runInNewContext(app.slice(start,end)+';globalThis.valid=validSeatNick;',box);
for(const nick of ['Alex','小明','a'.repeat(12)])assert.ok(box.valid({nick}));
for(const nick of ['', '   ', 'a'.repeat(13), 'a'.repeat(19000), 123, null, {}, 'A\nB','A\u007fB'])assert.equal(box.valid({nick}),false);
assert.equal(box.valid(null),false);
assert.match(app,/S\.seats=Object\.fromEntries\(Object\.entries\(receivedSeats\)\.filter/);
assert.match(app,/if\(S\.game\?\.host===ME\.pid\)[\s\S]*?if\(!validSeatNick\(seat\)\) Net\.pub\('seat\/\'\+pid,null\)/);
const rules=JSON.parse(fs.readFileSync(new URL('../firebase/database.rules.json',import.meta.url),'utf8')).rules.rooms.$code;
// Evaluate the actual rule expressions with Firebase's snapshot subset used here.
function snapshot(value){return {exists:()=>value!==null&&value!==undefined,val:()=>value,child(path){return snapshot(path.split('/').reduce((v,k)=>v?.[k],value));}};}
for(const collection of ['seats','online','sec']){
 const expr=rules[collection][collection==='sec'?'$id':'$uid']['.write'];
 function allowed({room=null,auth='guest',value={j:'{}'}}={}){
  const root=snapshot({rooms:{ABCDE:room}});return vm.runInNewContext(expr,{auth:auth?{uid:auth}:null,$code:'ABCDE',$uid:'guest',root,newData:snapshot(value)});
 }
 assert.equal(allowed(),false,collection+' cannot create orphan records');
 assert.equal(allowed({room:{seats:{}},auth:'guest'}),false,collection+' requires game, not just room children');
 if(collection==='sec'){
  assert.equal(allowed({room:{game:{host:'host'}}}),false);
  assert.equal(allowed({room:{game:{host:'host'}},auth:'host'}),true);
 }else{
  assert.equal(allowed({room:{game:{host:'host'}}}),true,collection+' existing room works');
  assert.equal(allowed({room:{game:{host:'host'}},auth:'other'}),false,collection+' cannot spoof owner');
  assert.equal(allowed({value:null}),true,collection+' stale own-record cleanup is allowed');
 }
 assert.equal(allowed({auth:null}),false);
}
const emergency=JSON.parse(fs.readFileSync(new URL('../firebase/emergency-deny-all.rules.json',import.meta.url),'utf8'));
assert.deepEqual(emergency,{rules:{'.read':false,'.write':false}});
console.log('Abuse prevention: remote nickname validation, orphan writes denied, existing ownership and safe cleanup preserved; emergency rules deny all.');
