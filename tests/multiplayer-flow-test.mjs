// Multi-client flow test.
//
// Every player is a separate node:vm context running the unmodified app.js (boot() included)
// against one shared in-memory stand-in for Firebase Realtime Database. Actions go through the
// rendered UI: a click is only dispatched when the matching enabled data-* control is present
// in the HTML the client just rendered.
//
// Covered here (previously listed as "not covered" in docs/PLAYTEST.md):
//   A/B. Quest 4's two-Fail rule in 7-player games.
//   C.   Host network interruption and recovery.
//   D.   Host closes the page and reopens the room link.
//
// Limits: this is not live Firebase. Security rules are not evaluated, and offline writes are
// queued without the optimistic local events the real SDK fires.
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';

const EXPORTS='\nglobalThis.__app={S,ME,Net,side,t,dec,isHost};';
const source=(await readFile(new URL('../app.js',import.meta.url),'utf8'))+EXPORTS;
const script=new vm.Script(source,{filename:'app.js'});

let passed=0;
function assert(value,message){ if(!value) throw new Error('Assertion failed: '+message); passed++; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(cond,label,ms=8000){
  const end=Date.now()+ms;
  while(Date.now()<end){ if(cond()) return; await sleep(5); }
  throw new Error('Timed out waiting for: '+label);
}
const problems=[];
process.on('unhandledRejection',e=>problems.push('unhandledRejection: '+(e&&e.stack||e)));

/* ---------------- In-memory Realtime Database ---------------- */
const clone=v=>v===undefined?null:JSON.parse(JSON.stringify(v));
const parts=p=>p.split('/').filter(Boolean);
class FakeDB{
  constructor(){ this.root={}; this.conns=new Set(); }
  get(path){ let n=this.root; for(const k of parts(path)){ if(n==null||typeof n!=='object') return null; n=n[k]; } return n===undefined?null:n; }
  set(path,value){
    const ks=parts(path), v=this.resolve(clone(value));
    const empty=v===null||(typeof v==='object'&&!Object.keys(v).length);
    const chain=[this.root];
    for(const k of ks.slice(0,-1)){
      let n=chain[chain.length-1];
      if(n[k]==null||typeof n[k]!=='object'){ if(empty) return this.changed(path); n[k]={}; }
      chain.push(n[k]);
    }
    const last=ks[ks.length-1];
    if(empty){
      delete chain[chain.length-1][last];
      for(let i=chain.length-1;i>0;i--){ if(Object.keys(chain[i]).length) break; delete chain[i-1][ks[i-1]]; }
    } else chain[chain.length-1][last]=v;
    this.changed(path);
  }
  resolve(v){
    if(v&&typeof v==='object'){
      if(v['.sv']==='timestamp') return Date.now();
      for(const k of Object.keys(v)){ v[k]=this.resolve(v[k]); if(v[k]===null) delete v[k]; }
    }
    return v;
  }
  changed(path){ for(const c of this.conns) c.notify(path); }
}
const overlaps=(a,b)=>a===b||a.startsWith(b+'/')||b.startsWith(a+'/');

/* One browser tab's connection to the database. */
class Conn{
  constructor(db,uid){ this.db=db; this.uid=uid; this.connected=true; this.dead=false; this.listeners=[]; this.info=[]; this.queue=[]; this.onDisc=[]; db.conns.add(this); }
  notify(path){ if(!this.connected||this.dead) return; for(const l of this.listeners) if(overlaps(l.path,path)) this.deliver(l); }
  deliver(l){
    if(l.pending) return; l.pending=true;
    setTimeout(()=>{ l.pending=false; if(this.dead||!this.connected||!this.listeners.includes(l)) return; const v=clone(this.db.get(l.path)); l.cb({val:()=>v}); },0);
  }
  write(op){
    if(this.dead) return new Promise(()=>{});
    if(this.connected){ op(); return Promise.resolve(); }
    return new Promise(res=>this.queue.push(()=>{ op(); res(); }));
  }
  fireInfo(){ for(const cb of this.info){ const v=this.connected; setTimeout(()=>{ if(!this.dead) cb({val:()=>v}); },0); } }
  runDisconnect(){ const list=this.onDisc; this.onDisc=[]; for(const p of list) this.db.set(p,null); }
  setConnected(on){
    if(this.dead||on===this.connected) return;
    this.connected=on;
    if(!on){ this.runDisconnect(); this.fireInfo(); return; }
    this.fireInfo();
    const q=this.queue; this.queue=[]; for(const op of q) op();
    for(const l of this.listeners) this.deliver(l);
  }
  close(){ this.connected=false; this.dead=true; this.runDisconnect(); this.listeners=[]; this.info=[]; this.db.conns.delete(this); }
  ref(path){
    const conn=this, db=this.db;
    return {
      on(type,cb){
        if(path==='.info/connected'){ conn.info.push(cb); const v=conn.connected; setTimeout(()=>{ if(!conn.dead) cb({val:()=>v}); },0); return; }
        const l={path,cb,pending:false}; conn.listeners.push(l); if(conn.connected) conn.deliver(l);
      },
      off(){ conn.listeners=conn.listeners.filter(l=>l.path!==path); },
      child(p){ return conn.ref(path+'/'+p); },
      set(v){ return conn.write(()=>db.set(path,v)); },
      remove(){ return conn.write(()=>db.set(path,null)); },
      update(obj){ const o=clone(obj); return conn.write(()=>{ for(const [k,v] of Object.entries(o)) db.set(path+'/'+k,v); }); },
      transaction(fn){ return conn.write(()=>{ const next=fn(clone(db.get(path))); if(next!==undefined) db.set(path,next); }); },
      onDisconnect(){
        return {
          remove(){ if(!conn.onDisc.includes(path)) conn.onDisc.push(path); return Promise.resolve(); },
          cancel(){ conn.onDisc=conn.onDisc.filter(p=>p!==path); return Promise.resolve(); }
        };
      }
    };
  }
}

/* ---------------- One player's browser tab ---------------- */
const ELEMENT_IDS=['app','ov','toast','rulesModal','infoModal','qrModal','confirmModal'];
const escRe=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
async function openClient(db,{uid,store=new Map(),hash=''}){
  const conn=new Conn(db,uid), timers=new Set(), listeners={}, els={}, errors=[];
  const classList={add(){},remove(){},toggle(){}};
  for(const id of ELEMENT_IDS) els[id]={id,innerHTML:'',textContent:'',classList,querySelector:()=>null,querySelectorAll:()=>[],focus(){}};
  const on=(type,fn)=>{ (listeners[type]=listeners[type]||[]).push(fn); };
  const timeout=(fn,ms,...a)=>{ const id=setTimeout(()=>{ timers.delete(id); fn(...a); },ms); timers.add(id); return id; };
  const interval=(fn,ms)=>{ const id=setInterval(fn,ms); timers.add(id); return id; };
  const location={hash,origin:'http://test',pathname:'/',search:'',protocol:'http:'};
  const database=()=>({ref:p=>conn.ref(p)});
  database.ServerValue={TIMESTAMP:{'.sv':'timestamp'}};
  const auth={currentUser:null,async signInAnonymously(){ this.currentUser={uid}; return {user:this.currentUser}; }};
  const log=kind=>(...a)=>errors.push(kind+': '+a.map(x=>x&&x.stack||String(x)).join(' '));
  const context={
    console:{log(){},info(){},error:log('console.error'),warn:log('console.warn')},
    crypto:webcrypto,TextEncoder,TextDecoder,URL,Map,Set,Promise,Uint8Array,Uint32Array,ArrayBuffer,
    JSON,Math,Date,Object,String,Number,Boolean,RegExp,Error,Array,
    setTimeout:timeout,clearTimeout:id=>{ timers.delete(id); clearTimeout(id); },setInterval:interval,clearInterval:id=>{ timers.delete(id); clearInterval(id); },
    requestAnimationFrame:fn=>timeout(fn,0),
    atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),
    navigator:{language:'en-US'},location,
    history:{replaceState(_s,_t,url){ location.hash=String(url||'').startsWith('#')?String(url):''; }},
    localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>{ store.set(k,String(v)); },removeItem:k=>{ store.delete(k); }},
    document:{
      querySelector:s=>s[0]==='#'?(els[s.slice(1)]||null):null,getElementById:()=>null,addEventListener:on,
      body:{classList},documentElement:{lang:''},activeElement:null
    },
    addEventListener:on,
    firebase:{initializeApp(){},auth:()=>auth,database}
  };
  context.globalThis=context; context.window=context;
  vm.createContext(context);
  script.runInContext(context);
  const app=context.__app;
  const c={
    uid,store,conn,app,errors,
    get S(){ return app.S; },
    get g(){ return app.S.game; },
    html(){ return els.app.innerHTML+els.ov.innerHTML+els.confirmModal.innerHTML; },
    overlayHtml(){ return els.ov.innerHTML; },
    has(attr,value){
      const re=new RegExp('<[^>]*\\bdata-'+attr+'="'+escRe(value)+'"[^>]*>','g');
      return (c.html().match(re)||[]).some(tag=>!/\sdisabled\b/.test(tag));
    },
    click(attr,value){
      assert(c.has(attr,value),uid+' sees an enabled data-'+attr+'="'+value+'" control');
      const target={closest:()=>({dataset:{[attr]:String(value)}})};
      for(const fn of listeners.click||[]) fn({target});
    },
    type(id,value){ for(const fn of listeners.input||[]) fn({target:{id,value}}); },
    close(){ conn.close(); for(const id of timers){ clearTimeout(id); clearInterval(id); } timers.clear(); }
  };
  await until(()=>app.ME.pid&&app.ME.priv,uid+' boots and signs in');
  return c;
}

/* ---------------- Table helpers ---------------- */
const sideOf=c=>c.S.mine.allegiance||c.app.side(c.S.mine.role);
async function dismissOverlays(c){
  for(let i=0;i<8&&c.S.ov.length;i++){
    const o=c.S.ov[0];
    if(o.type==='night'&&!o.flipped) c.click('a','flipcard');
    c.click('a','ovnext');
    await sleep(0);
  }
  assert(!c.S.ov.length,c.uid+' has no overlay left open');
}
async function setupRoom(db,n,tag){
  const clients=[];
  const host=await openClient(db,{uid:tag+'-p1'});
  host.type('nick','P1'); host.click('a','create');
  await until(()=>host.g&&host.g.status==='lobby'&&host.S.seats[host.uid],tag+' host creates a room');
  const code=host.S.code;
  clients.push(host);
  for(let i=2;i<=n;i++){
    const c=await openClient(db,{uid:tag+'-p'+i});
    c.type('nick','P'+i); c.type('joinCode',code.toLowerCase()); c.click('a','join');
    await until(()=>c.S.seats[c.uid],c.uid+' takes a seat');
    clients.push(c);
  }
  await until(()=>Object.keys(host.S.seats).length===n&&host.has('a','start'),tag+' host can start with '+n+' players');
  host.click('a','start');
  await until(()=>clients.every(c=>c.g&&c.g.status==='play'&&c.S.mine&&c.S.mine.role),tag+' every client receives a role');
  const room={db,code,clients,host,byPid:Object.fromEntries(clients.map(c=>[c.uid,c]))};
  room.goods=clients.filter(c=>sideOf(c)==='good').map(c=>c.uid);
  room.evils=clients.filter(c=>sideOf(c)==='evil').map(c=>c.uid);
  return room;
}
async function nightChecks(room){
  for(const c of room.clients){
    await until(()=>c.S.ov.length&&c.S.ov[0].type==='night',c.uid+' gets the night overlay');
    assert(c.overlayHtml().includes(c.app.t('nightTitle')),c.uid+' night overlay is rendered');
    await dismissOverlays(c);
    assert(c.app.isHost()===(c===room.host),c.uid+' host flag is correct');
    assert(c===room.host ? Object.keys(c.S.master.roles).length===room.clients.length : c.S.master===null,c.uid+' only the host holds the role table');
  }
}
async function propose(room,team){
  const leader=room.byPid[room.host.g.order[room.host.g.leader]];
  await until(()=>leader.g.phase==='propose'&&team.every(p=>leader.has('pick',p)),leader.uid+' can pick the team');
  for(const p of team) leader.click('pick',p);
  leader.click('a','propose'); leader.click('a','confirmRun');
  await until(()=>room.clients.every(c=>c.g.phase==='vote'),'everyone reaches the vote');
  assert(JSON.stringify(room.host.g.team.slice().sort())===JSON.stringify(team.slice().sort()),'proposed team is the one the leader picked');
}
async function voteAll(room,voters=room.clients){ for(const c of voters) c.click('vote','1'); }
async function playCards(room,cards){
  for(const [pid,card] of Object.entries(cards)){
    const c=room.byPid[pid];
    c.click('quest',card); c.click('a','questSubmit');
  }
}
async function playQuest(room,team,cards,beforeCards){
  const q=room.host.g.q;
  await propose(room,team);
  await voteAll(room);
  await until(()=>room.clients.every(c=>c.g.phase==='quest'),'everyone reaches quest '+(q+1));
  for(const c of room.clients) await dismissOverlays(c);
  if(beforeCards) await beforeCards();
  await playCards(room,cards);
  await until(()=>room.clients.every(c=>c.g.quests[q].r),'quest '+(q+1)+' is resolved for everyone');
  return room.host.g.quests[q];
}
const cardsFor=(team,failers=[])=>Object.fromEntries(team.map(p=>[p,failers.includes(p)?'F':'S']));

/* ---------------- Scenario A: one Fail on Quest 4 is not enough ---------------- */
{
  const db=new FakeDB(), room=await setupRoom(db,7,'a'), {goods,evils,clients,host}=room;
  assert(goods.length===4&&evils.length===3,'A: 7 players are dealt 4 Good and 3 Evil');
  await nightChecks(room);
  const outsider=clients[1];
  let undecryptable=0;
  for(const [id,d] of Object.entries(outsider.S.secrets)){
    if(id===outsider.uid) continue;
    try{ await outsider.app.dec(d.box); }catch(e){ undecryptable++; }
  }
  assert(undecryptable===7,'A: a player cannot decrypt the six other roles or the host role table');
  assert(JSON.stringify(host.g.quests.map(x=>x.two))==='[false,false,false,true,false]','A: only Quest 4 needs two Fails');

  let r=await playQuest(room,goods.slice(0,2),cardsFor(goods.slice(0,2)));
  assert(r.r==='S'&&r.fails===0,'A: Quest 1 succeeds');
  for(const c of clients) await dismissOverlays(c);
  r=await playQuest(room,goods.slice(0,3),cardsFor(goods.slice(0,3)));
  assert(r.r==='S','A: Quest 2 succeeds');
  for(const c of clients) await dismissOverlays(c);
  const t3=[goods[0],goods[1],evils[0]];
  r=await playQuest(room,t3,cardsFor(t3,[evils[0]]));
  assert(r.r==='F'&&r.fails===1,'A: Quest 3 fails with a single Fail');
  for(const c of clients) await dismissOverlays(c);

  const t4=[goods[0],goods[1],goods[2],evils[0]];
  r=await playQuest(room,t4,cardsFor(t4,[evils[0]]),async()=>{
    const note=host.app.t('twoNote');
    for(const c of clients) assert(c.html().includes(c.app.t('twoNote')),'A: '+c.uid+' is told Quest 4 needs two Fails');
    assert(note.length>0,'A: two-Fail note text exists');
    assert(room.byPid[evils[0]].has('quest','F'),'A: the Evil team member may play Fail');
    assert(!room.byPid[goods[0]].has('quest','F')&&room.byPid[goods[0]].has('quest','S'),'A: a Good team member can only play Success');
    assert(!room.byPid[goods[3]].has('quest','S'),'A: a player off the team has no quest card');
  });
  assert(r.two===true&&r.fails===1&&r.r==='S','A: Quest 4 with exactly one Fail still succeeds');
  for(const c of clients){
    await until(()=>c.S.ov.some(o=>o.type==='quest'&&o.qi===3)&&c.overlayHtml().includes(c.app.t('needTwo')),c.uid+' sees the Quest 4 result with the two-Fail reminder');
    assert(c.overlayHtml().includes(c.app.t('qSuccess')),'A: '+c.uid+' result overlay says the quest succeeded');
    await dismissOverlays(c);
  }
  await until(()=>clients.every(c=>c.g.phase==='assassin'),'A: three successes lead to the assassination');
  const assassin=clients.find(c=>c.S.mine.role==='assassin');
  const target=goods.find(p=>room.byPid[p].S.mine.role!=='merlin');
  await until(()=>assassin.has('pick',target),'A: the Assassin can pick a target');
  assert(clients.filter(c=>c.has('pick',target)).length===1,'A: only the Assassin can pick a target');
  assassin.click('pick',target); assassin.click('a','single'); assassin.click('a','confirmRun');
  await until(()=>clients.every(c=>c.g.status==='end'),'A: the game ends');
  for(const c of clients){
    assert(c.g.winner==='good'&&c.g.reason==='rmiss','A: '+c.uid+' sees Good win after a missed assassination');
    assert(Object.keys(c.g.roles).length===7,'A: '+c.uid+' sees all roles revealed');
    await until(()=>c.html().includes(c.app.t('goodWin')),c.uid+' end screen is rendered');
  }
  for(const c of clients){ problems.push(...c.errors.map(e=>c.uid+' '+e)); c.close(); }
}

/* ---------------- Scenario B: two Fails on Quest 4 fail it ---------------- */
{
  const db=new FakeDB(), room=await setupRoom(db,7,'b'), {goods,evils,clients}=room;
  await nightChecks(room);
  const t1=[goods[0],evils[0]];
  let r=await playQuest(room,t1,cardsFor(t1,[evils[0]]));
  assert(r.r==='F','B: Quest 1 fails');
  for(const c of clients) await dismissOverlays(c);
  const t2=[goods[0],goods[1],evils[1]];
  r=await playQuest(room,t2,cardsFor(t2,[evils[1]]));
  assert(r.r==='F','B: Quest 2 fails');
  for(const c of clients) await dismissOverlays(c);
  r=await playQuest(room,goods.slice(0,3),cardsFor(goods.slice(0,3)));
  assert(r.r==='S','B: Quest 3 succeeds');
  for(const c of clients) await dismissOverlays(c);
  const t4=[goods[0],goods[1],evils[0],evils[1]];
  r=await playQuest(room,t4,cardsFor(t4,[evils[0],evils[1]]));
  assert(r.two===true&&r.fails===2&&r.r==='F','B: Quest 4 with two Fails fails');
  await until(()=>clients.every(c=>c.g.status==='end'),'B: the game ends');
  for(const c of clients){
    assert(c.g.winner==='evil'&&c.g.reason==='r3f','B: '+c.uid+' sees Evil win on three failed quests');
    await until(()=>c.html().includes(c.app.t('evilWin')),c.uid+' end screen is rendered');
  }
  for(const c of clients){ problems.push(...c.errors.map(e=>c.uid+' '+e)); c.close(); }
}

/* ---------------- Scenarios C and D: the host drops out and comes back ---------------- */
{
  const db=new FakeDB(), room=await setupRoom(db,5,'c'), {clients}=room;
  let host=room.host;
  const others=clients.filter(c=>c!==host), hostRole=host.S.mine.role, hostPub=JSON.stringify(host.app.ME.pub);
  await nightChecks(room);
  const team=[others[0].uid,others[1].uid];
  await propose(room,team);

  // C: network interruption while the table votes.
  await until(()=>others.every(c=>c.app.Net.isOnline(host.uid)),'C: host starts online');
  host.conn.setConnected(false);
  await until(()=>!host.app.Net.connected()&&host.html().includes(host.app.t('offline')),'C: host sees the connection-lost banner');
  await until(()=>others.every(c=>!c.app.Net.isOnline(host.uid)),'C: other players see the host offline');
  await voteAll(room);
  await sleep(150);
  assert(others.every(c=>c.g.phase==='vote'&&c.g.order.filter(p=>c.S.seats[p].act&&c.S.seats[p].act.k===c.g.step).length===4),'C: the vote waits for the host while it is offline');
  assert(host.conn.queue.length>0,'C: the host vote is queued, not lost');
  host.conn.setConnected(true);
  await until(()=>clients.every(c=>c.g.phase==='quest'),'C: the engine resumes after the host reconnects');
  const round=host.g.rounds[0];
  assert(Object.keys(round.votes).length===5&&Object.values(round.votes).every(Boolean)&&round.ok,'C: all five votes, including the queued host vote, are counted');
  await until(()=>others.every(c=>c.app.Net.isOnline(host.uid)),'C: host is shown online again');
  assert(host.app.Net.connected()&&!host.html().includes(host.app.t('offline')),'C: host banner clears');
  for(const c of clients) await dismissOverlays(c);

  // D: the host tab is closed during the quest and the room link is reopened.
  const store=host.store;
  problems.push(...host.errors.map(e=>host.uid+' '+e));
  host.close();
  await until(()=>others.every(c=>!c.app.Net.isOnline(host.uid)),'D: other players see the closed host offline');
  await playCards(room,cardsFor(team));
  await sleep(150);
  assert(others.every(c=>c.g.phase==='quest'&&!c.g.quests[0].r),'D: the quest is not resolved while the host page is closed');

  host=await openClient(db,{uid:host.uid,store,hash:'#'+room.code});
  room.host=host; room.clients=clients.map(c=>c.uid===host.uid?host:c); room.byPid[host.uid]=host;
  await until(()=>room.clients.every(c=>c.g&&c.g.quests[0].r==='S'&&c.g.phase==='propose'&&c.g.q===1),'D: the reopened host resolves the quest and starts Quest 2');
  assert(host.S.code===room.code&&host.app.isHost(),'D: the room link restores the host seat');
  assert(JSON.stringify(host.app.ME.pub)===hostPub,'D: the stored key pair is reused');
  assert(host.S.master&&Object.keys(host.S.master.roles).length===5,'D: the host role table decrypts again');
  assert(host.S.mine&&host.S.mine.role===hostRole,'D: the host still has the same role');
  assert(host.S.ov.every(o=>o.type!=='night'),'D: the night overlay is not shown a second time');
  await until(()=>others.every(c=>c.app.Net.isOnline(host.uid)),'D: host is shown online again');
  for(const c of room.clients){
    await until(()=>c.S.ov.some(o=>o.type==='quest'),c.uid+' sees the Quest 1 result');
    await dismissOverlays(c);
  }
  const t2=room.clients.slice(0,3).map(c=>c.uid);
  const r=await playQuest(room,t2,Object.fromEntries(t2.map(p=>[p,'S'])));
  assert(r.r==='S'&&room.host.g.q===2,'D: the game keeps running normally after the reload');
  for(const c of room.clients){ problems.push(...c.errors.map(e=>c.uid+' '+e)); c.close(); }
}

await sleep(20);
assert(problems.length===0,'no console errors, warnings or unhandled rejections:\n'+problems.join('\n'));
console.log(`Multiplayer flow test: ${passed} checks passed.`);
process.exit(0);
