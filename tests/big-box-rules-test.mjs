import {readGameSource} from './helpers/site.mjs';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';

let source=readGameSource();
source=source.replace(/\nboot\(\);\s*$/,'\n');
source+='\nglobalThis.__rules={DEFAULT_SETTINGS,buildRoles,questChoices,privateRoleData,shownLoyalty,resolveQuest,beginQuest,S,Net,ME};';

const noop=()=>{};
const context={
  console,crypto:webcrypto,TextEncoder,TextDecoder,URL,Map,Set,Promise,Uint8Array,Uint32Array,ArrayBuffer,
  JSON,Math,Date,Object,String,Number,Boolean,RegExp,Error,setTimeout,clearTimeout,setInterval:noop,clearInterval:noop,
  atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),
  navigator:{language:'en-US',share:null},location:{hash:'',origin:'http://test',pathname:'/'},history:{replaceState:noop},
  localStorage:{getItem:()=>null,setItem:noop},document:{querySelector:()=>null,addEventListener:noop,documentElement:{lang:'en'}},
  window:{addEventListener:noop,requestAnimationFrame:fn=>fn(),crypto:webcrypto}
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'assets/js/app.js'});

const R=context.__rules;
let passed=0;
function assert(value,message){ if(!value) throw new Error(message); passed++; }

const settings={...R.DEFAULT_SETTINGS,lancelot:true,lunatic:true,cleric:true};
const built=R.buildRoles(10,settings);
assert(!built.err,'10-player expanded role set should fit');
assert(built.roles.includes('lancelotGood')&&built.roles.includes('lancelotEvil'),'both Lancelots are dealt together');
assert(built.roles.length===10,'role count matches player count');
assert(JSON.stringify(R.questChoices('lunatic',0,'evil',settings))==='["F"]','Lunatic must fail');
assert(R.questChoices('brute',2,'evil',settings).includes('F'),'Brute may fail Quest 3');
assert(JSON.stringify(R.questChoices('brute',3,'evil',settings))==='["S"]','Brute cannot fail Quest 4');
assert(JSON.stringify(R.questChoices('servant',0,'good',settings))==='["S"]','Good roles cannot fail');

const roles={m:'merlin',a:'assassin',u:'untrustworthy',o:'mordred',x:'minion'};
const allegiances={m:'good',a:'evil',u:'good',o:'evil',x:'evil'};
const merlin=R.privateRoleData('m',roles,settings,allegiances);
const servant=R.privateRoleData('u',roles,settings,allegiances);
assert(merlin.sees.includes('u')&&merlin.sees.includes('a')&&!merlin.sees.includes('o'),'Merlin knowledge is correct');
assert(servant.sees.length===1&&servant.sees[0]==='a','Untrustworthy Servant knows the Assassin');
assert(R.shownLoyalty('troublemaker','good')==='evil','Troublemaker must lie when checked');
const lanceRoles={lg:'lancelotGood',le:'lancelotEvil',a:'assassin',o:'oberon',g:'servant'};
const lanceSides={lg:'good',le:'evil',a:'evil',o:'evil',g:'good'};
const evilLancelot=R.privateRoleData('le',lanceRoles,{...R.DEFAULT_SETTINGS,lancelot:true},lanceSides);
assert(evilLancelot.sees.includes('lg')&&evilLancelot.sees.includes('a')&&!evilLancelot.sees.includes('o'),'base Evil Lancelot knows counterpart and visible Evil allies');

R.Net.pub=async()=>{};
R.S.master={roles:{g:'servant',e:'minion',m:'merlin',a:'assassin',u:'untrustworthy'},allegiances:{g:'good',e:'evil',m:'good',a:'evil',u:'good'}};
const game={gid:'T',settings:{...R.DEFAULT_SETTINGS,excalibur:true},order:['g','e','m','a','u'],q:0,att:1,leader:0,team:['g','e'],excaliburHolder:'e',quests:[{size:2,two:false,r:null},{size:3,two:false,r:null},{size:2,two:false,r:null},{size:3,two:false,r:null},{size:3,two:false,r:null}],rounds:[],lady:null,lancelot:null,events:[],revealed:[]};
const sword=await R.resolveQuest(game,{g:'S',e:'S'},'g');
assert(sword.quests[0].r==='F'&&sword.quests[0].fails===1,'Excalibur can switch Success to Fail');

R.S.master={roles:{r:'revealer',g1:'servant',g2:'servant',m:'merlin',a:'assassin'},allegiances:{r:'evil',g1:'good',g2:'good',m:'good',a:'evil'}};
const revealGame={...game,settings:{...R.DEFAULT_SETTINGS},order:['r','g1','g2','m','a'],q:1,team:['r','g1','g2'],excaliburHolder:null,quests:[{size:2,two:false,r:'F',fails:1},{size:3,two:false,r:null},{size:2,two:false,r:null},{size:3,two:false,r:null},{size:3,two:false,r:null}]};
const reveal=await R.resolveQuest(revealGame,{r:'F',g1:'S',g2:'S'},null);
assert(reveal.revealed.includes('r'),'Revealer is exposed after second failed Quest');

R.S.master={roles:{m:'merlin',a:'assassin',u:'untrustworthy',g:'servant',e:'minion'},allegiances:{m:'good',a:'evil',u:'good',g:'good',e:'evil'}};
const recruitGame={...game,settings:{...R.DEFAULT_SETTINGS},order:['m','a','u','g','e'],q:2,team:['m','g'],excaliburHolder:null,quests:[{size:2,two:false,r:'S',fails:0},{size:3,two:false,r:'S',fails:0},{size:2,two:false,r:null},{size:3,two:false,r:null},{size:3,two:false,r:null}]};
const recruit=await R.resolveQuest(recruitGame,{m:'S',g:'S'},null);
assert(recruit.phase==='recruit','recruitment precedes assassination');

const kp=await webcrypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey']);
const jwk=await webcrypto.subtle.exportKey('jwk',kp.publicKey),pub={x:jwk.x,y:jwk.y};
R.ME.pub=pub;
R.S.master={roles:{lg:'lancelotGood',le:'lancelotEvil'},allegiances:{lg:'good',le:'evil'}};
const switchGame={gid:'L',settings:{...R.DEFAULT_SETTINGS,lancelot:true,lancelotSwitch:true},order:['lg','le'],pubs:{lg:pub,le:pub},lancelot:{deck:[true],draws:[]},events:[]};
const switched=await R.beginQuest(switchGame,{att:1,team:[]},1);
assert(R.S.master.allegiances.lg==='evil'&&R.S.master.allegiances.le==='good','Lancelot allegiances switch');
assert(switched.lancelot.draws[0].switched===true,'Lancelot draw is public state');

console.log(`Big Box rules unit test: ${passed} checks passed.`);
