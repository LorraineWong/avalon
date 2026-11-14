/* Avalon Online — static client. Realtime via Firebase Realtime Database (anonymous auth).
 * Architecture:
 *  - Every player signs in anonymously (Firebase uid) and keeps an ECDH key pair in localStorage.
 *  - Database security rules: only the host writes the game state and secrets; each player writes only their own seat.
 *  - The host's browser runs the game engine; actions are encrypted to the host and
 *    roles are encrypted to each player, so nobody can read others' roles from the database.
 */
'use strict';

/* ================= i18n ================= */
const REACTIONS = [
  {id:'agree', icon:'agree', label:'reactAgree'}, {id:'think', icon:'think', label:'reactThink'},
  {id:'sus', icon:'sus', label:'reactSus'}, {id:'shock', icon:'shock', label:'reactShock'},
  {id:'laugh', icon:'laugh', label:'reactLaugh'}, {id:'sword', icon:'sword', label:'reactSword'}
];
const REACTION_MS = 5000;
const ROLE_META = {
  merlin:{side:'good',icon:'sparkle',art:'assets/roles/merlin.webp'},
  percival:{side:'good',icon:'eye',art:'assets/roles/percival.webp'},
  servant:{side:'good',icon:'shield',art:'assets/roles/servant.webp'},
  assassin:{side:'evil',icon:'sword',art:'assets/roles/assassin.webp'},
  morgana:{side:'evil',icon:'moon',art:'assets/roles/morgana.webp'},
  mordred:{side:'evil',icon:'crown',art:'assets/roles/mordred.webp'},
  oberon:{side:'evil',icon:'eyeoff',art:'assets/roles/oberon.webp'},
  minion:{side:'evil',icon:'sword',art:'assets/roles/minion.webp'},
  lancelotGood:{side:'good',icon:'shield',art:'assets/roles/lancelot-good.webp'},
  lancelotEvil:{side:'evil',icon:'sword',art:'assets/roles/lancelot-evil.webp'},
  lunatic:{side:'evil',icon:'sus',art:'assets/roles/lunatic.webp'},
  brute:{side:'evil',icon:'sword',art:'assets/roles/brute.webp'},
  revealer:{side:'evil',icon:'flag',art:'assets/roles/revealer.webp'},
  cleric:{side:'good',icon:'droplet',art:'assets/roles/cleric.webp'},
  trickster:{side:'evil',icon:'swap',art:'assets/roles/trickster.webp'},
  troublemaker:{side:'good',icon:'smile',art:'assets/roles/troublemaker.webp'},
  untrustworthy:{side:'good',icon:'lock',art:'assets/roles/untrustworthy.webp'},
};
// Locale data is presentation-only; role IDs and room messages stay unchanged.
const LOCALES = typeof window!=='undefined' && window.AvalonLocales;
if(LOCALES) for(const [id,pack] of Object.entries(LOCALES.packs)){
  if(pack.messages) I18N[id]=pack.messages;
  if(pack.roles) ROLE_TXT[id]=pack.roles;
}
const validLanguage = value => Object.hasOwn(I18N,value) ? value : 'en';
const languageTag = value => LOCALES?.languages.find(x=>x.id===value)?.tag || (value==='zh'?'zh-CN':'en');
const extra = key => LOCALES?.packs[LANG]?.extra[key] || LOCALES?.packs.en.extra[key] || key;
const guideRoute = () => 'how-to-play/'+(LOCALES?.languages.find(x=>x.id===LANG)?.route || (LANG==='zh'?'zh-cn':'en'))+'/';
let LANG = 'en';
function t(k, ...a){ let s = (I18N[LANG][k] ?? I18N.zh[k] ?? k); if(LANG==='en' && a[0]===1 && ['goodNeeds','evilNeeds'].includes(k)) s=s.replace('Quests','Quest'); return s.replace(/\{(\d)\}/g, (_,i)=>a[+i] ?? ''); }
const rName = r => ROLE_TXT[LANG][r][0];
const rDesc = r => ROLE_TXT[LANG][r][1];
const side = r => ROLE_META[r] ? ROLE_META[r].side : null;
const roleArt = (r, cls='role-art') => '<img class="'+cls+'" src="'+ROLE_META[r].art+'" alt="'+esc(rName(r))+'" loading="lazy">';

/* ================= Rules ================= */
const EVIL_N = {5:2,6:2,7:3,8:3,9:3,10:4};
const SIZES  = {5:[2,3,2,3,3],6:[2,3,4,3,4],7:[2,3,3,4,4],8:[3,4,4,5,5],9:[3,4,4,5,5],10:[3,4,4,5,5]};
const DEFAULT_SETTINGS = {
  merlin:true, percival:true, morgana:true, mordred:false, oberon:false,
  lancelot:false, lancelotSwitch:false, lunatic:false, brute:false, revealer:false,
  cleric:false, trickster:false, troublemaker:false, untrustworthy:false,
  lady:false, excalibur:false
};
function presetSettings(id,n){
  const st=Object.assign({},DEFAULT_SETTINGS,{percival:false,morgana:false});
  if(id==='classic'){ st.percival=true; st.morgana=true; }
  if(id==='big'){
    st.percival=true; st.morgana=true; st.excalibur=true;
    if(n>=7){ st.morgana=false; st.lancelot=true; st.lady=true; }
  }
  return st;
}
function buildRoles(n, st){
  if(n<5 || n>10) return {err:t('needPlayers', n)};
  const ev=EVIL_N[n], gd=n-ev, good=[], evil=[];
  if(st.merlin){ good.push('merlin'); evil.push('assassin'); }
  if(st.percival) good.push('percival');
  if(st.morgana) evil.push('morgana');
  if(st.mordred) evil.push('mordred');
  if(st.oberon) evil.push('oberon');
  if(st.lancelot){ good.push('lancelotGood'); evil.push('lancelotEvil'); }
  if(st.lunatic) evil.push('lunatic');
  if(st.brute) evil.push('brute');
  if(st.revealer) evil.push('revealer');
  if(st.cleric) good.push('cleric');
  if(st.trickster) evil.push('trickster');
  if(st.troublemaker) good.push('troublemaker');
  if(st.untrustworthy) good.push('untrustworthy');
  if(evil.length>ev) return {err:t('tooManyEvil', n, ev)};
  if(good.length>gd) return {err:t('tooManyGood')};
  while(evil.length<ev) evil.push('minion');
  while(good.length<gd) good.push('servant');
  return {roles:good.concat(evil), ev, gd};
}
function roleSideFor(roles, pid, allegiances){ return (allegiances && allegiances[pid]) || side(roles[pid]); }
function questChoices(role, questIndex, allegiance, settings){
  if(allegiance==='good') return ['S'];
  if(role==='lunatic') return ['F'];
  if(role==='brute' && questIndex>2) return ['S'];
  if(settings && settings.lancelotSwitch && (role==='lancelotGood' || role==='lancelotEvil')) return ['F'];
  return ['S','F'];
}
function privateRoleData(id, roles, settings, allegiances, checks=[]){
  const ids=Object.keys(roles), role=roles[id], allegiance=roleSideFor(roles,id,allegiances);
  let sees=[], see='';
  if(role==='merlin'){
    sees=ids.filter(x=>(roleSideFor(roles,x,allegiances)==='evil' && roles[x]!=='mordred') || roles[x]==='untrustworthy');
    see='see_evil';
  } else if(role==='percival'){
    sees=ids.filter(x=>roles[x]==='merlin'||roles[x]==='morgana'); see='see_mp';
  } else if(role==='untrustworthy'){
    sees=ids.filter(x=>roles[x]==='assassin'); see='see_assassin';
  } else if(settings.lancelot && !settings.lancelotSwitch && role==='lancelotGood'){
    sees=ids.filter(x=>x!==id && (roles[x]==='lancelotGood'||roles[x]==='lancelotEvil')); see='see_lancelot';
  } else if(settings.lancelot && !settings.lancelotSwitch && role==='lancelotEvil'){
    sees=ids.filter(x=>x!==id && ((roles[x]==='lancelotGood') || (roleSideFor(roles,x,allegiances)==='evil'&&roles[x]!=='oberon'))); see='see_lancelot_allies';
  } else if(allegiance==='evil' && role!=='oberon' && !(settings.lancelotSwitch && (role==='lancelotGood'||role==='lancelotEvil'))){
    sees=ids.filter(x=>x!==id && roleSideFor(roles,x,allegiances)==='evil' && roles[x]!=='oberon'); see='see_allies';
  }
  return {role, allegiance, sees, see, checks};
}
function shownLoyalty(role, allegiance){ return role==='troublemaker' ? 'evil' : allegiance; }

/* ================= Utils ================= */
const $ = s => document.querySelector(s);
/* One small line-icon set for every button, so controls do not depend on how a
 * platform happens to draw emoji. */
const ICONS = {
  agree:'<path d="M8 10 12 3c2 0 2 2 1 6h5a2 2 0 0 1 2 2l-1 7a2 2 0 0 1-2 2H8Z"/><rect x="3" y="10" width="5" height="10" rx="1"/>',
  think:'<path d="M9 20a8.5 8.5 0 1 1 12-8"/><path d="m7 8 3 1m5-1 2 1M9 11v.5m6-.5v.5M8 16h4m3 6v-7a1.5 1.5 0 0 1 3 0v3l2-1a2 2 0 0 1 2 2l-1 3"/>',
  sus:'<circle cx="12" cy="12" r="8.5"/><path d="m6.5 8 4 1.5m3-1 4-1M9 11v.5m6-.5v.5m-6 5 6-1"/>',
  shock:'<circle cx="12" cy="12" r="8.5"/><path d="M8 8h2m4 0h2M9 11h.01M15 11h.01"/><ellipse cx="12" cy="16" rx="2" ry="2.5"/>',
  laugh:'<circle cx="12" cy="12" r="8.5"/><path d="m6.5 10 2-2 2 2m3 0 2-2 2 2M7.5 14h9a4.5 4.5 0 0 1-9 0Z"/>',
  shield:'<path d="M12 3 20 6v6c0 4.5-4 7.5-8 9-4-1.5-8-4.5-8-9V6Z"/><path d="m8.5 11 2.5 3 4.5-5"/>',
  sword:'<path d="m14 4 6-1-1 6-9.5 9.5-4-4Z"/><path d="m4 13 7 7M3 21l4-4M12 10l3 3"/>',
  moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  device:'<rect x="3" y="4" width="14" height="11" rx="2"/><path d="M7 20h6M10 15v5"/><rect x="16" y="10" width="5" height="10" rx="1"/>',
  globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  sparkle:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  droplet:'<path d="M12 3c-2 4-7 7.5-7 12a7 7 0 0 0 14 0c0-4.5-5-8-7-12Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  vote:'<path d="m9 3 7 4-4 7-7-4Z"/><path d="M4 13 2 17v4h20v-4l-3-5M2 17h20M14 16h4"/>',
  flag:'<path d="M5 21V3c5-3 9 4 14 0v10c-5 4-9-3-14 0"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  qr:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM18.5 14H20M14 18.5V20"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14.3-4.3L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.3L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  play:'<path d="M8 5.5v13l11-6.5z"/>',
  book:'<path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v12.5H7.5A2.5 2.5 0 0 1 5 17z"/><path d="M5 17a2.5 2.5 0 0 1 2.5-2.5H18"/>',
  users:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5"/><path d="M16 5.6a3.2 3.2 0 0 1 0 5.8M18 14.9c1.700.700 2.700 2.300 3 4.600"/>',
  pencil:'<path d="M4 20l1-4.500L16.500 4a2.100 2.100 0 0 1 3 3L8 18.500z"/><path d="M14.500 6l3 3"/>',
  eye:'<path d="M2.500 12c1-2 4.500-6 9.500-6s8.500 4 9.500 6c-1 2-4.500 6-9.500 6s-8.500-4-9.500-6z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M3 3l18 18"/><path d="M10.600 6.200A9.600 9.600 0 0 1 12 6c5 0 8.500 4 9.500 6a13 13 0 0 1-2.600 3.400M6.400 7.600A13 13 0 0 0 2.500 12c1 2 4.500 6 9.500 6a9.300 9.300 0 0 0 4-.900"/><path d="M9.900 9.900a3 3 0 0 0 4.200 4.200"/>',
  list:'<path d="M8 6.500h12M8 12h12M8 17.500h12M4 6.500h.01M4 12h.01M4 17.500h.01"/>',
  smile:'<circle cx="12" cy="12" r="8.500"/><path d="M8.500 14a4.200 4.200 0 0 0 7 0M9 9.800h.01M15 9.800h.01"/>',
  crown:'<path d="M4 18.500h16M4.500 15L3.500 7l5 4L12 5l3.500 6 5-4-1 8z"/>',
  share:'<path d="M12 15V4M8 7.500L12 4l4 3.500"/><path d="M5 12v6.500A1.500 1.500 0 0 0 6.500 20h11a1.500 1.500 0 0 0 1.500-1.500V12"/>',
  exit:'<path d="M14 4.500H6.500v15H14"/><path d="M10 12h10M17 8.500l3.500 3.500-3.500 3.500"/>',
  swap:'<path d="M4 8.500h14M14.500 5L18 8.500 14.500 12"/><path d="M20 15.500H6M9.500 12L6 15.500 9.500 19"/>',
};
const roleIcon = r => ic(ROLE_META[r]?.icon || 'shield');
const ic = n => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">'+ICONS[n]+'</svg>';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rnd(n){ const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]%n; }
function shuffle(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randCode(len=5, A='ABCDEFGHJKMNPQRSTUVWXYZ23456789'){ let s=''; for(let i=0;i<len;i++) s+=A[rnd(A.length)]; return s; }
const LS = {
  get(k){ try{ return JSON.parse(localStorage.getItem('lwav.'+k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem('lwav.'+k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem('lwav.'+k); }catch(e){} }
};
let toastT;
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.remove('hidden'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.add('hidden'), 3000); }
const AV_COLORS=['#0e7490','#1d4ed8','#0f766e','#4338ca','#0369a1','#155e75','#3730a3','#047857','#1e40af','#5b21b6','#0c4a6e','#115e59'];
function avHash(id){ let h=0; for(const c of String(id)) h=(h*31+c.charCodeAt(0))>>>0; return h; }
function avColor(id){ return AV_COLORS[avHash(id)%AV_COLORS.length]; }
function avStyle(id){ const i=avHash(id)%16, x=(i%4)*100/3, y=Math.floor(i/4)*100/3; return 'background-color:'+avColor(id)+';background-position:'+x.toFixed(3)+'% '+y.toFixed(3)+'%'; }
function initials(n){ n=String(n||'?').trim(); const ch=[...n]; return /^[A-Za-z]/.test(n) ? ch.slice(0,2).join('').toUpperCase() : (ch[0]||'?'); }

/* ================= Crypto (ECDH P-256 + AES-GCM) ================= */
const EC={name:'ECDH', namedCurve:'P-256'};
const b64=buf=>{ const u=new Uint8Array(buf); let s=''; for(let i=0;i<u.length;i++) s+=String.fromCharCode(u[i]); return btoa(s); };
const unb64=s=>Uint8Array.from(atob(s), c=>c.charCodeAt(0));
async function enc(pub, obj){
  const pk=await crypto.subtle.importKey('jwk',{kty:'EC',crv:'P-256',x:pub.x,y:pub.y,ext:true},EC,false,[]);
  const eph=await crypto.subtle.generateKey(EC,true,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'ECDH',public:pk},eph.privateKey,{name:'AES-GCM',length:256},false,['encrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(obj)));
  const e=await crypto.subtle.exportKey('jwk',eph.publicKey);
  return {e:{x:e.x,y:e.y}, iv:b64(iv), ct:b64(ct)};
}
async function dec(box){
  const pk=await crypto.subtle.importKey('jwk',{kty:'EC',crv:'P-256',x:box.e.x,y:box.e.y,ext:true},EC,false,[]);
  const key=await crypto.subtle.deriveKey({name:'ECDH',public:pk},ME.priv,{name:'AES-GCM',length:256},false,['decrypt']);
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(box.iv)},key,unb64(box.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
const decCache=new Map();
async function decC(box){
  const k=box.iv+box.ct.slice(0,32);
  if(decCache.has(k)) return decCache.get(k);
  const v=await dec(box); decCache.set(k,v); return v;
}

/* ================= Identity ================= */
// ME.pid is the Firebase anonymous-auth uid; the ECDH key pair lives in localStorage, bound to that uid.
const ME = {pid:null, priv:null, pub:null};
async function loadIdentity(uid){
  let id = LS.get('id');
  if(!id || id.pid!==uid || !id.priv || !id.pub){
    const kp=await crypto.subtle.generateKey(EC,true,['deriveKey']);
    const priv=await crypto.subtle.exportKey('jwk',kp.privateKey);
    const pj=await crypto.subtle.exportKey('jwk',kp.publicKey);
    id={pid:uid, priv, pub:{x:pj.x,y:pj.y}};
    LS.set('id', id);
  }
  ME.pid=id.pid; ME.pub=id.pub;
  ME.priv=await crypto.subtle.importKey('jwk',id.priv,EC,false,['deriveKey']);
}

/* ================= Network (Firebase Realtime Database) ================= */
// Layout: rooms/<CODE>/game {host, j}, seats/<uid> {j}, sec/<id> {j}, online/<uid> timestamp.
// Documents are stored as JSON strings (j) so arrays and nulls round-trip exactly.
const FIREBASE_CONFIG = (typeof window!=='undefined' && window.AVALON_FIREBASE) || {
  apiKey:'AIzaSyCfqmltcXOvlBN_GYuYhTIMEak31RpC1cg',
  authDomain:'lw-avalon.firebaseapp.com',
  databaseURL:'https://lw-avalon-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId:'lw-avalon',
  storageBucket:'lw-avalon.firebasestorage.app',
  messagingSenderId:'282689238789',
  appId:'1:282689238789:web:44b4f71ad48559c88d296c'
};
// Support and contact links are maintained in assets/js/project.js.
const ROOM_TTL_MS = 72 * 60 * 60 * 1000;
const END_TTL_MS = 24 * 60 * 60 * 1000;
const Net = {
  db:null, auth:null, ref:null, onlineRef:null, reactionTimer:null, draftWrite:Promise.resolve(), code:null, loaded:false, conn:false, everConnected:false, authFailed:false,
  raw:new Map(), parsed:new Map(), revs:new Map(), online:new Set(),
  async init(){
    firebase.initializeApp(FIREBASE_CONFIG);
    if(typeof window!=='undefined' && window.AvalonAppCheck) window.AvalonAppCheck.activate(firebase);
    this.auth=firebase.auth(); this.db=firebase.database();
    this.db.ref('.info/connected').on('value', s=>{
      this.conn=!!s.val();
      if(this.conn){ this.everConnected=true; this.markOnline(); }
      changed();
    });
    try{
      const cred = this.auth.currentUser ? null : await this.auth.signInAnonymously();
      const user = this.auth.currentUser || (cred && cred.user);
      if(!user) throw new Error('no user');
      return user.uid;
    }catch(e){ console.error('auth', e); this.authFailed=true; changed(); return null; }
  },
  connected(){ return this.conn; },
  join(code){
    if(this.ref){ this.ref.off(); this.ref=null; }
    clearTimeout(this.reactionTimer); this.reactionTimer=null;
    if(this.onlineRef){ this.onlineRef.onDisconnect().cancel(); this.onlineRef.remove().catch(()=>{}); this.onlineRef=null; }
    this.code=code; this.loaded=false; this.raw=new Map(); this.parsed=new Map(); this.revs=new Map(); this.online=new Set();
    if(!code) return;
    this.ref=this.db.ref('rooms/'+code);
    this.ref.on('value', snap=>this.onSnap(code, snap), err=>{ console.error('read', err); toast(t('noNet')); });
    this.markOnline();
  },
  onSnap(code, snap){
    if(code!==this.code) return;
    const v=snap.val()||{}, next=new Map();
    if(v.game && v.game.j) next.set('game', v.game.j);
    for(const [k,x] of Object.entries(v.seats||{})) if(x && x.j) next.set('seat/'+k, x.j);
    for(const [k,x] of Object.entries(v.sec||{})) if(x && x.j) next.set('sec/'+k, x.j);
    for(const key of new Set([...this.raw.keys(), ...next.keys()])){
      if(this.raw.get(key)!==next.get(key)){ this.revs.set(key, (this.revs.get(key)||0)+1); this.parsed.delete(key); }
    }
    this.raw=next;
    this.online=new Set(Object.keys(v.online||{}));
    this.loaded=true;
    if(v.game && !this.onlineRef) this.markOnline();
    clearTimeout(this.reactionTimer); this.reactionTimer=null;
    const now=Date.now(); let nextExpiry=Infinity;
    for(const x of Object.values(v.seats||{})){
      try{ const seat=x&&x.j&&JSON.parse(x.j), at=seat&&seat.reaction&&seat.reaction.at; if(at&&at+REACTION_MS>now) nextExpiry=Math.min(nextExpiry,at+REACTION_MS-now); }catch(e){}
    }
    if(Number.isFinite(nextExpiry)) this.reactionTimer=setTimeout(()=>render(), nextExpiry+80);
    changed();
  },
  get(key){
    if(!this.raw.has(key)) return null;
    if(!this.parsed.has(key)){ try{ this.parsed.set(key, JSON.parse(this.raw.get(key))); }catch(e){ this.parsed.set(key, null); } }
    return this.parsed.get(key);
  },
  ver(key){ return this.revs.get(key)||0; },
  had(key){ return this.revs.has(key); },
  pub(key, d){
    if(!this.ref) return Promise.resolve();
    const path = key==='game' ? 'game' : key.startsWith('seat/') ? 'seats/'+key.slice(5) : 'sec/'+key.slice(4);
    const val = d==null ? null : (key==='game' ? {host:d.host, j:JSON.stringify(d)} : {j:JSON.stringify(d)});
    return this.ref.child(path).set(val).catch(e=>{ console.warn('write failed', key, e); toast(t('writeFail')); });
  },
  react(pid, id, at){
    if(!this.ref) return Promise.resolve();
    return this.ref.child('seats/'+pid+'/j').transaction(raw=>{
      if(!raw) return raw;
      try{ const seat=JSON.parse(raw); seat.reaction={id,at}; return JSON.stringify(seat); }catch(e){ return; }
    }).catch(e=>{ console.warn('reaction failed', e); toast(t('writeFail')); });
  },
  rename(pid, nick){
    if(!this.ref) return Promise.resolve();
    // Merge into the latest seat so a rename can never overwrite a vote or quest card.
    return this.ref.child('seats/'+pid+'/j').transaction(raw=>{
      if(!raw) return raw;
      try{ const seat=JSON.parse(raw); seat.nick=nick; return JSON.stringify(seat); }catch(e){ return; }
    }).catch(e=>{ console.warn('rename failed', e); toast(t('writeFail')); });
  },
  draftTeam(pid, step, picks){
    if(!this.ref) return Promise.resolve();
    const code=this.code;
    this.draftWrite=this.draftWrite.catch(()=>{}).then(()=>{
      if(code!==this.code || !this.ref) return;
      return this.ref.child('seats/'+pid+'/j').transaction(raw=>{
        if(!raw) return raw;
        try{ const seat=JSON.parse(raw); seat.draftTeam={step,picks}; return JSON.stringify(seat); }catch(e){ return; }
      });
    }).catch(e=>{ console.warn('draft team failed', e); });
    return this.draftWrite;
  },
  dropRoom(){
    if(!this.ref) return Promise.resolve();
    // Delete host-owned children before the game record, because the rules use
    // the game's host id to authorize seat and secret cleanup.
    const jobs=[];
    for(const key of this.raw.keys()){
      if(key.startsWith('seat/')) jobs.push(this.ref.child('seats/'+key.slice(5)).remove());
      if(key.startsWith('sec/')) jobs.push(this.ref.child('sec/'+key.slice(4)).remove());
    }
    if(this.onlineRef) jobs.push(this.onlineRef.remove());
    return Promise.all(jobs).then(()=>this.ref.child('game').remove()).catch(e=>{ console.warn('room cleanup failed', e); toast(t('writeFail')); });
  },
  markOnline(){
    if(!this.code || !this.conn || !ME.pid || !this.raw.has('game')) return;
    const r=this.db.ref('rooms/'+this.code+'/online/'+ME.pid);
    this.onlineRef=r;
    r.onDisconnect().remove();
    r.set(firebase.database.ServerValue.TIMESTAMP).catch(()=>{});
  },
  isOnline(pid){ return pid===ME.pid || this.online.has(pid); },
  prefixed(p){ const out={}; for(const k of this.raw.keys()){ if(k.startsWith(p)){ const d=this.get(k); if(d) out[k.slice(p.length)]=d; } } return out; }
};

/* ================= App state ================= */
const S = {
  view:'home', code:null, joinedAt:0, game:null, seats:{}, secrets:{},
  mine:null, master:null, ladyMine:[], checksMine:[], ui:{nick:'', joinCode:'', pick:[], pickStep:'', myActs:{}, busy:false, excalibur:null, rulesOpen:false, guideTab:'rules', rulesInlineOpen:false, settingsOpen:false, infoOpen:null, qrOpen:false, privacyCover:false, questConfirm:null, confirm:null, hostSuccessor:'', confirmHostTransfer:false, lastReactionAt:0, notesOpen:false, tool:null, rename:null},
  ov:[], seen:null, notFoundTimer:null, lastGid:null,
};

/* ================= Boot ================= */
async function boot(){
  LANG = validLanguage(new URL(location.search||'',location.origin||'https://avalon.lorrainewong.dev').searchParams.get('lang') || LS.get('lang'));
  document.documentElement.lang = languageTag(LANG);
  if(!window.crypto || !crypto.subtle){ $('#app').innerHTML='<div class="glass card">This browser does not support Web Crypto. Please use a recent Chrome / Safari / Edge (https).</div>'; return; }
  render();
  const uid = await Net.init();
  if(!uid){ render(); return; }
  await loadIdentity(uid);
  S.ui.nick = LS.get('nick') || '';
  const h=(location.hash||'').slice(1).toUpperCase();
  if(/^[A-Z0-9]{4,8}$/.test(h)) enterRoom(h);
  render();
  setInterval(()=>{ if(S.code) sync(); }, 4000); // refresh online dots, retry engine
}

let renderQueued=false;
function changed(){
  if(renderQueued) return; renderQueued=true;
  (window.requestAnimationFrame||setTimeout)(()=>{ renderQueued=false; sync(); });
}

/* Pull room data from Net into S, decrypt what is mine, detect transitions. */
function sync(){
  if(S.code){
    S.game = Net.get('game');
    const receivedSeats=Net.prefixed('seat/');
    S.seats=Object.fromEntries(Object.entries(receivedSeats).filter(([,seat])=>validSeatNick(seat)));
    // The host validates remote records too; modified clients bypass input maxlength.
    if(S.game?.host===ME.pid) for(const [pid,seat] of Object.entries(receivedSeats)){
      if(!validSeatNick(seat)) Net.pub('seat/'+pid,null);
    }
    S.secrets = Net.prefixed('sec/');
    if(!S.game && Net.loaded){ toast(t('notFound', S.code)); return goHome(true); } // room missing or closed
    if(S.game && S.game.host===ME.pid && S.game.expires && Date.now()>S.game.expires){ Net.dropRoom().then(()=>goHome(true)); return; }
    if(S.game && S.game.status==='lobby' && S.autoSeat && !S.seats[ME.pid] && Net.loaded){ S.autoSeat=false; takeSeat(); }
    if(S.game && S.game.step!==S.ui.pickStep){ S.ui.pick=[]; S.ui.excalibur=null; S.ui.questConfirm=null; S.ui.pickStep=S.game.step; }
    decryptSecrets().then(()=>{ detect(); render(); hostTick(); });
  }
  render();
}
async function decryptSecrets(){
  const g=S.game, gid=g && g.gid;
  if(!gid){ S.mine=null; S.master=null; S.ladyMine=[]; S.checksMine=[]; return; }
  const m=S.secrets[ME.pid];
  if(m && m.gid===gid){ try{ S.mine=await decC(m.box); }catch(e){ S.mine=null; } } else S.mine=null;
  const ms=S.secrets.master;
  if(g.host===ME.pid && ms && ms.gid===gid){ try{ S.master=await decC(ms.box); }catch(e){ S.master=null; } } else if(g.host!==ME.pid) S.master=null;
  const lady=[], checks=(S.mine && S.mine.checks ? S.mine.checks.slice() : []);
  for(const [id,d] of Object.entries(S.secrets)){
    if(id.startsWith('lady-') && d.gid===gid && d.to===ME.pid){ try{ lady.push(await decC(d.box)); }catch(e){} }
    if(id.startsWith('check-') && d.gid===gid && d.to===ME.pid){ try{ checks.push(await decC(d.box)); }catch(e){} }
  }
  lady.sort((a,b)=>a.q-b.q); S.ladyMine=lady; S.checksMine=checks;
}
function detect(){
  const g=S.game; if(!g) return;
  const snap={gid:g.gid, rounds:(g.rounds||[]).length, quests:(g.quests||[]).filter(q=>q.r).length, end:g.status==='end', lady:S.ladyMine.length};
  const prev=S.seen; S.seen=snap;
  if(!prev || prev.gid!==snap.gid){
    S.ov=S.ov.filter(o=>o.type==='night' && g.gid);
    // New game (or first load): show the night overlay once per game.
    if(g.status==='play' && S.mine && !LS.get('night.'+g.gid)){ S.ov.push({type:'night', flipped:false}); LS.set('night.'+g.gid, 1); }
    else if(g.status==='play' && !S.mine && g.order && g.order.includes(ME.pid)) S.seen=Object.assign({}, snap, {gid:null});
    return;
  }
  if(snap.rounds>prev.rounds){ const r=g.rounds[g.rounds.length-1]; S.ov.push({type:'vote', r}); }
  if(snap.quests>prev.quests){ const qi=[...g.quests.keys()].filter(i=>g.quests[i].r)[snap.quests-1]; S.ov.push({type:'quest', qi}); }
  if(snap.lady>prev.lady){ S.ov.push({type:'lady', x:S.ladyMine[S.ladyMine.length-1]}); }
  if(snap.end && !prev.end) S.ov.push({type:'end'});
}

/* ================= Room actions ================= */
function validSeatNick(seat){
  return !!seat && typeof seat.nick==='string' && seat.nick.length<=12 && seat.nick.trim().length>0 && !/[\u0000-\u001f\u007f]/.test(seat.nick);
}
function cleanNick(){ return (S.ui.nick||'').trim().slice(0,12); }
function enterRoom(code){
  S.code=code; S.view='room'; S.joinedAt=Date.now(); S.autoSeat=true; S.seen=null;
  S.game=null; S.seats={}; S.secrets={}; S.mine=null; S.master=null; S.ladyMine=[]; S.checksMine=[]; S.ov=[];
  Net.join(code);
  setTimeout(sync, 1600);
  try{ history.replaceState(null,'','#'+code); }catch(e){ location.hash=code; }
  LS.set('last', code);
  render();
}
function goHome(forget){
  Net.join(null); S.code=null; S.view='home'; S.game=null; S.ov=[];
  try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){}
  if(forget) LS.set('last', null);
  render();
}
async function createRoom(){
  const nick=cleanNick(); if(!nick) return toast(t('needNick'));
  LS.set('nick', nick);
  const code=randCode(5);
  enterRoom(code);
  S.autoSeat=false;
  await Net.pub('game', {code, host:ME.pid, hostPub:ME.pub, status:'lobby', created:Date.now(), expires:Date.now()+ROOM_TTL_MS, settings:Object.assign({},DEFAULT_SETTINGS), gid:''});
  Net.markOnline();
  Net.pub('seat/'+ME.pid, {pid:ME.pid, nick, pub:ME.pub, joined:Date.now(), act:null});
}
function joinRoom(){
  const nick=cleanNick(); if(!nick) return toast(t('needNick'));
  const code=(S.ui.joinCode||'').trim().toUpperCase();
  if(!/^[A-Z0-9]{4,8}$/.test(code)) return toast(t('badCode'));
  LS.set('nick', nick); enterRoom(code);
}
function takeSeat(){
  const g=S.game; if(!g || g.status!=='lobby' || S.seats[ME.pid]) return;
  if(Object.keys(S.seats).length>=10) return toast(t('full'));
  const nick=cleanNick() || ('P'+randCode(3));
  S.ui.nick=nick; LS.set('nick', nick);
  Net.pub('seat/'+ME.pid, {pid:ME.pid, nick, pub:ME.pub, joined:Date.now(), act:null});
}
function renameSeat(){
  const nick=cleanNick(); if(!nick) return toast(t('needNick'));
  LS.set('nick', nick);
  const s=S.seats[ME.pid]; if(s && s.nick!==nick){ Net.rename(ME.pid, nick); toast(t('renamed')); }
}
function openRename(){
  const s=S.seats[ME.pid];
  S.ui.rename={draft:(s&&s.nick)||S.ui.nick||''};
  renderNameModal();
}
function closeRename(){ S.ui.rename=null; renderNameModal(); }
function saveRename(){
  const r=S.ui.rename; if(!r) return;
  const nick=String(r.draft||'').trim().slice(0,12); if(!nick) return toast(t('needNick'));
  closeRename();
  S.ui.nick=nick; LS.set('nick', nick);
  const s=S.seats[ME.pid]; if(s && s.nick!==nick){ Net.rename(ME.pid, nick); toast(t('renamed')); }
  render();
}
function renderNameModal(){
  let el=$('#nameModal');
  if(!el){ if(!S.ui.rename || !document.body || !document.createElement) return; el=document.createElement('div'); el.id='nameModal'; document.body.appendChild(el); }
  const r=S.ui.rename;
  if(!r){ el.innerHTML=''; return; }
  el.innerHTML='<div class="rules-modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="nameTitle"><div class="glass confirm-sheet name-sheet"><i class="player-avatar name-avatar" style="'+avStyle(ME.pid)+'"></i><h2 id="nameTitle">'+t('renameTitle')+'</h2><p>'+t('renameHint')+'</p>'
    +'<input class="input" id="renameInput" maxlength="12" autocomplete="off" aria-label="'+t('nick')+'" placeholder="'+t('nickPh')+'" value="'+esc(r.draft)+'">'
    +'<div class="row"><button class="btn ghost big" data-a="renameCancel">'+t('cancel')+'</button><button class="btn pri big" data-a="renameSave">'+t('save')+'</button></div></div></div>';
  requestAnimationFrame(()=>{ const i=$('#renameInput'); if(i){ i.focus(); try{ i.select(); }catch(e){} } });
}
function lobbyOrder(){ return Object.values(S.seats).filter(validSeatNick).sort((a,b)=>(a.joined||0)-(b.joined||0) || String(a.pid).localeCompare(b.pid)).map(s=>s.pid); }
const isHost = () => !!(S.game && S.game.host===ME.pid);
function leaveRoom(){
  const g=S.game;
  if(g && g.status==='lobby'){
    const others=lobbyOrder().filter(p=>p!==ME.pid);
    if(g.host===ME.pid){
      if(others.length) Net.pub('game', Object.assign({}, g, {host:others[0], hostPub:S.seats[others[0]].pub}));
      else { Net.dropRoom(); return setTimeout(()=>goHome(true), 150); }
    }
    if(S.seats[ME.pid]) Net.pub('seat/'+ME.pid, null);
  }
  setTimeout(()=>goHome(true), 150);
}
function kick(pid){ if(isHost() && S.game.status==='lobby') Net.pub('seat/'+pid, null); }
function toggleSetting(k){
  if(!isHost() || S.game.status!=='lobby') return;
  const st=Object.assign({}, DEFAULT_SETTINGS, S.game.settings);
  st[k]=!st[k];
  if(k==='merlin' && !st.merlin){ st.percival=false; st.morgana=false; st.mordred=false; }
  if(['percival','morgana','mordred'].includes(k) && st[k]) st.merlin=true;
  if(k==='lancelotSwitch' && st.lancelotSwitch) st.lancelot=true;
  if(k==='lancelot' && !st.lancelot) st.lancelotSwitch=false;
  if(k==='untrustworthy' && st.untrustworthy) st.merlin=true;
  Net.pub('game', Object.assign({}, S.game, {settings:st}));
}
function applyPreset(id){
  if(!isHost() || S.game.status!=='lobby') return;
  const n=Math.min(10,Math.max(5,lobbyOrder().length)), st=presetSettings(id,n);
  Net.pub('game',Object.assign({},S.game,{settings:st}));
  toast(t('presetApplied',t(id==='new'?'presetNew':id==='classic'?'presetClassic':'presetBig')));
}
async function startGame(){
  const g=S.game; if(!isHost() || g.status!=='lobby' || S.ui.busy) return;
  const ids=lobbyOrder(), n=ids.length, st=Object.assign({}, DEFAULT_SETTINGS, g.settings);
  const br=buildRoles(n, st); if(br.err) return toast(br.err);
  S.ui.busy=true; render();
  try{
    const dealt=shuffle(br.roles), roles={}, allegiances={};
    ids.forEach((id,i)=>{ roles[id]=dealt[i]; allegiances[id]=side(dealt[i]); });
    const gid=randCode(8), pubs={}, nicks={}, leader=rnd(n);
    ids.forEach(id=>{ pubs[id]=S.seats[id].pub; nicks[id]=S.seats[id].nick; });
    let lancelot=null;
    if(st.lancelot && st.lancelotSwitch){
      const deck=shuffle([false,false,false,false,true,true]);
      const switched=deck.shift();
      const lp=ids.filter(id=>roles[id]==='lancelotGood'||roles[id]==='lancelotEvil');
      if(switched && lp.length===2) [allegiances[lp[0]],allegiances[lp[1]]]=[allegiances[lp[1]],allegiances[lp[0]]];
      lancelot={deck, draws:[{q:0, switched}]};
    }
    const cleric=ids.find(id=>roles[id]==='cleric'), leaderId=ids[leader];
    const needsTricksterChoice=!!(cleric && roles[leaderId]==='trickster');
    for(const id of ids){
      const checks=(id===cleric && !needsTricksterChoice) ? [{source:'cleric', target:leaderId, side:shownLoyalty(roles[leaderId],allegiances[leaderId])}] : [];
      Net.pub('sec/'+id, {gid, box: await enc(pubs[id], privateRoleData(id,roles,st,allegiances,checks))});
    }
    Net.pub('sec/master', {gid, box: await enc(ME.pub, {roles,allegiances})});
    S.master={roles,allegiances};
    const holder=(st.lady && n>=7) ? ids[(leader-1+n)%n] : null;
    Net.pub('game', {
      code:g.code, host:ME.pid, hostPub:ME.pub, created:g.created, expires:Date.now()+ROOM_TTL_MS, settings:st,
      status:'play', gid, order:ids, pubs, nicks, n,
      phase:needsTricksterChoice?'loyalty':'propose', q:0, att:1, leader, team:[], excaliburHolder:null,
      step:needsTricksterChoice?gid+':loyalty:cleric':gid+':propose:0:1',
      quests:SIZES[n].map((size,i)=>({size, two:(i===3 && n>=7), r:null, fails:null, team:null})),
      rounds:[], lady: holder ? {holder, used:[holder], log:[]} : null,
      loyalty:needsTricksterChoice?{source:'cleric', viewer:cleric, target:leaderId, next:'propose'}:null,
      lancelot, revealed:[], events:[], winner:null, reason:'', roles:null, assassinPick:null, started:Date.now()
    });
  }catch(e){ console.error(e); }
  S.ui.busy=false; render();
}
function playAgain(){
  const g=S.game; if(!isHost()) return;
  for(const id of Object.keys(S.secrets)) Net.pub('sec/'+id, null);
  Net.pub('game', {code:g.code, host:ME.pid, hostPub:ME.pub, status:'lobby', created:g.created||Date.now(), expires:Date.now()+ROOM_TTL_MS, settings:g.settings||DEFAULT_SETTINGS, gid:''});
  S.ov=[];
}
async function transferHost(){
  const g=S.game, target=S.ui.hostSuccessor;
  if(!isHost() || !g || g.status!=='play' || !S.master || S.ui.busy) return;
  if(!target || !g.order.includes(target) || target===ME.pid || !Net.isOnline(target)) return toast(t('chooseHost'));
  const seat=S.seats[target]; if(!seat||!seat.pub) return toast(t('chooseHost'));
  S.ui.busy=true; render();
  try{
    const box=await enc(seat.pub,S.master);
    const next=Object.assign({},g,{host:target,hostPub:seat.pub,events:(g.events||[]).concat([{type:'hostChanged',player:target}])});
    if(!Net.ref) throw new Error('room unavailable');
    // Keep the encrypted host key and the public host pointer in one atomic
    // database update. A dropped connection can never leave half a transfer.
    await Net.ref.update({
      'sec/master':{j:JSON.stringify({gid:g.gid,box})},
      game:{host:target,j:JSON.stringify(next)}
    });
    S.ui.confirmHostTransfer=false; toast(t('hostTransferred',nickOf(target)));
  }catch(e){ console.error(e); toast(t('writeFail')); }
  S.ui.busy=false; render();
}

/* Player action, encrypted to the host. */
async function submit(v){
  const g=S.game, seat=S.seats[ME.pid]; if(!g || !seat) return;
  const step=g.step;
  S.ui.busy=true; render();
  try{
    const box=await enc(g.hostPub, {v});
    Net.pub('seat/'+ME.pid, Object.assign({}, S.seats[ME.pid], {act:{k:step, box}}));
    S.ui.myActs[step]=v;
  }catch(e){ console.error(e); }
  S.ui.busy=false; render();
}
function acted(pid){ const s=S.seats[pid], g=S.game; return !!(s && s.act && g && s.act.k===g.step); }

/* ================= Host engine ================= */
let ticking=false, again=false;
async function hostTick(){
  const g=S.game;
  if(!g || !isHost() || g.status!=='play' || !S.master || !S.master.roles) return;
  if(ticking){ again=true; return; }
  ticking=true;
  const v0=Net.ver('game');
  try{
    const patch=await computeNext(g);
    if(patch && Net.ver('game')===v0) Net.pub('game', Object.assign({}, g, patch));
  }catch(e){ console.error('engine', e); }
  finally{ ticking=false; if(again){ again=false; hostTick(); } }
}
async function readAct(pid, step){
  const s=S.seats[pid];
  if(!s || !s.act || s.act.k!==step || !s.act.box) return undefined;
  try{ return (await decC(s.act.box)).v; }catch(e){ return undefined; }
}
function endPatch(g, winner, reason, extra){
  return Object.assign({}, extra, {status:'end', phase:'end', winner, reason, roles:S.master.roles, allegiances:S.master.allegiances, expires:Date.now()+END_TTL_MS, step:g.gid+':end'});
}
async function saveMaster(g){
  Net.pub('sec/master', {gid:g.gid, box:await enc(ME.pub,S.master)});
}
async function publishLoyalty(g, source, viewer, target, shown){
  const payload={source, target, side:shown, q:g.q};
  const key=source==='lady' ? 'lady-'+g.q : 'check-'+source+'-'+g.q;
  Net.pub('sec/'+key, {gid:g.gid, to:viewer, box:await enc(g.pubs[viewer],payload)});
}
async function beginQuest(g, base, q){
  let lancelot=g.lancelot, events=(g.events||[]).slice();
  if(g.settings.lancelotSwitch && lancelot && lancelot.deck && lancelot.deck.length){
    const deck=lancelot.deck.slice(), switched=deck.shift(), draws=(lancelot.draws||[]).concat([{q,switched}]);
    lancelot={deck,draws};
    events.push({type:switched?'lancelotSwitchLog':'lancelotNoChange',q});
    if(switched){
      const lp=g.order.filter(id=>g.roles ? (g.roles[id]==='lancelotGood'||g.roles[id]==='lancelotEvil') : (S.master.roles[id]==='lancelotGood'||S.master.roles[id]==='lancelotEvil'));
      if(lp.length===2){
        const a=Object.assign({},S.master.allegiances);
        [a[lp[0]],a[lp[1]]]=[a[lp[1]],a[lp[0]]]; S.master.allegiances=a;
        for(const id of lp) Net.pub('sec/'+id,{gid:g.gid,box:await enc(g.pubs[id],privateRoleData(id,S.master.roles,g.settings,a))});
        await saveMaster(g);
      }
    }
  }
  return Object.assign({},base,{q,phase:'propose',step:g.gid+':propose:'+q+':1',lancelot,events});
}
async function resolveQuest(g, cards, excaliburTarget){
  const roles=S.master.roles, allegiances=S.master.allegiances, finalCards=Object.assign({},cards);
  for(const u of g.team){
    if(!questChoices(roles[u],g.q,roleSideFor(roles,u,allegiances),g.settings).includes(cards[u])) return null;
  }
  if(excaliburTarget){
    if(!g.team.includes(excaliburTarget) || excaliburTarget===g.excaliburHolder) return null;
    finalCards[excaliburTarget]=finalCards[excaliburTarget]==='F'?'S':'F';
  }
  const fails=g.team.filter(u=>finalCards[u]==='F').length, qd=g.quests[g.q], failed=fails>=(qd.two?2:1);
  const quests=g.quests.map((x,i)=>i===g.q?Object.assign({},x,{r:failed?'F':'S',fails,team:g.team,excalibur:excaliburTarget||null}):x);
  const sc=quests.filter(x=>x.r==='S').length, fc=quests.filter(x=>x.r==='F').length;
  let revealed=(g.revealed||[]).slice(), events=(g.events||[]).slice();
  const revealer=g.order.find(u=>roles[u]==='revealer');
  if(fc===2 && revealer && !revealed.includes(revealer)){ revealed.push(revealer); events.push({type:'revealerShown',player:revealer,q:g.q}); }
  const common={quests,revealed,events,questBox:null,excaliburHolder:null};
  if(fc>=3) return endPatch(g,'evil','r3f',common);
  if(sc>=3){
    const vals=Object.values(roles);
    if(vals.includes('assassin')&&vals.includes('merlin')){
      if(vals.includes('untrustworthy')) return Object.assign(common,{phase:'recruit',step:g.gid+':recruit'});
      return Object.assign(common,{phase:'assassin',step:g.gid+':assassin'});
    }
    return endPatch(g,'good','r3s',common);
  }
  const q=g.q+1, base=Object.assign(common,{q,att:1,leader:(g.leader+1)%g.order.length,team:[]});
  if(g.lady && q>=2 && q<=4) return Object.assign(base,{phase:'lady',step:g.gid+':lady:'+q});
  return beginQuest(g,base,q);
}
async function computeNext(g){
  const n=g.order.length, roles=S.master.roles, gid=g.gid, inGame=u=>g.order.includes(u);
  switch(g.phase){
    case 'propose': {
      const v=await readAct(g.order[g.leader], g.step);
      const picked=Array.isArray(v)?{team:v,excalibur:null}:v;
      if(!picked || !Array.isArray(picked.team)) return null;
      const team=[...new Set(picked.team)].filter(inGame);
      if(team.length!==g.quests[g.q].size) return null;
      let excaliburHolder=null;
      if(g.settings.excalibur){
        excaliburHolder=picked.excalibur;
        if(!team.includes(excaliburHolder)||excaliburHolder===g.order[g.leader]) return null;
      }
      return {phase:'vote',team,excaliburHolder,step:gid+':vote:'+g.q+':'+g.att};
    }
    case 'vote': {
      const votes={};
      for(const u of g.order){ const v=await readAct(u, g.step); if(v===undefined) return null; votes[u]=!!v; }
      const yes=Object.values(votes).filter(Boolean).length, ok=yes*2>n;
      const rounds=(g.rounds||[]).concat([{q:g.q, att:g.att, leader:g.order[g.leader], team:g.team, votes, ok}]);
      if(ok) return {rounds, phase:'quest', step:gid+':quest:'+g.q+':'+g.att};
      if(g.att>=5) return endPatch(g, 'evil', 'r5', {rounds});
      return {rounds, att:g.att+1, leader:(g.leader+1)%n, team:[], excaliburHolder:null, phase:'propose', step:gid+':propose:'+g.q+':'+(g.att+1)};
    }
    case 'quest': {
      const cards={};
      for(const u of g.team){ const v=await readAct(u, g.step); if(v===undefined) return null; cards[u]=v; }
      for(const u of g.team){ if(!questChoices(roles[u],g.q,roleSideFor(roles,u,S.master.allegiances),g.settings).includes(cards[u])) return null; }
      if(g.settings.excalibur && g.excaliburHolder) return {phase:'excalibur',questBox:await enc(ME.pub,{cards}),step:gid+':excalibur:'+g.q+':'+g.att};
      return resolveQuest(g,cards,null);
    }
    case 'excalibur': {
      const target=await readAct(g.excaliburHolder,g.step); if(target===undefined) return null;
      const saved=await decC(g.questBox); if(!saved||!saved.cards) return null;
      return resolveQuest(g,saved.cards,target||null);
    }
    case 'lady': {
      const h=g.lady.holder, tg=await readAct(h, g.step);
      if(!inGame(tg) || tg===h || g.lady.used.includes(tg)) return null;
      if(roles[tg]==='trickster') return {phase:'loyalty',loyalty:{source:'lady',viewer:h,target:tg,next:'propose'},step:gid+':loyalty:lady:'+g.q};
      await publishLoyalty(g,'lady',h,tg,shownLoyalty(roles[tg],roleSideFor(roles,tg,S.master.allegiances)));
      const base={lady:{holder:tg,used:g.lady.used.concat([tg]),log:(g.lady.log||[]).concat([{q:g.q,from:h,to:tg}])},loyalty:null,att:1,team:[]};
      return beginQuest(g,base,g.q);
    }
    case 'loyalty': {
      const x=g.loyalty, shown=await readAct(x.target,g.step);
      if(shown!=='good'&&shown!=='evil') return null;
      await publishLoyalty(g,x.source,x.viewer,x.target,shown);
      if(x.source==='lady'){
        const base={lady:{holder:x.target,used:g.lady.used.concat([x.target]),log:(g.lady.log||[]).concat([{q:g.q,from:x.viewer,to:x.target}])},loyalty:null,att:1,team:[]};
        return beginQuest(g,base,g.q);
      }
      return {phase:'propose',loyalty:null,step:gid+':propose:'+g.q+':'+g.att};
    }
    case 'recruit': {
      const a=g.order.find(u=>roles[u]==='assassin'), tg=await readAct(a,g.step); if(!inGame(tg)||tg===a) return null;
      const servant=g.order.find(u=>roles[u]==='untrustworthy');
      if(tg===servant){
        S.master.allegiances=Object.assign({},S.master.allegiances,{[servant]:'evil'});
        Net.pub('sec/'+servant,{gid,box:await enc(g.pubs[servant],privateRoleData(servant,roles,g.settings,S.master.allegiances))});
        await saveMaster(g);
        return {phase:'assassin',recruitedPlayer:servant,recruitPick:tg,events:(g.events||[]).concat([{type:'recruited',player:servant}]),step:gid+':assassin'};
      }
      return {phase:'assassin',recruitPick:tg,step:gid+':assassin'};
    }
    case 'assassin': {
      const a=g.recruitedPlayer||g.order.find(u=>roles[u]==='assassin'); if(!a) return null;
      const tg=await readAct(a, g.step);
      if(!inGame(tg) || tg===a) return null;
      const hit=roles[tg]==='merlin';
      return endPatch(g, hit?'evil':'good', hit?'rhit':'rmiss', {assassinPick:tg});
    }
  }
  return null;
}

/* ================= Rendering ================= */
function nickOf(p){ const g=S.game; return (S.seats[p] && S.seats[p].nick) || (g && g.nicks && g.nicks[p]) || '?'; }
function avatar(p, cls){ return '<div class="'+(cls||'av')+' player-avatar" style="'+avStyle(p)+'" aria-hidden="true"></div>'; }

function render(){
  const app=$('#app'); if(!app) return;
  document.title=LOCALES?extra('pageTitle'):(LANG==='zh'?'阿瓦隆在线玩｜免费、无需注册、5–10 人好友房':'Avalon Online | Free 5–10 Player Social Deduction Game');
  document.documentElement.lang=languageTag(LANG);
  const gameActive=!!(S.code && S.game && S.game.status!=='lobby');
  document.body.classList.toggle('game-active', gameActive);
  document.body.classList.toggle('game-ended', gameActive && S.game.status==='end');
  const a=document.activeElement, fid=a && a.id, fsel=a && a.selectionStart;
  let html=topBar();
  if(!S.code) html+=viewHome();
  else if(!S.game) html+='<div class="glass card" style="text-align:center;max-width:480px;margin:40px auto">'+t('entering', esc(S.code))+'<div class="muted small" style="margin-top:6px">'+(Net.connected()?'':t('connecting'))+'</div></div>';
  else if(S.game.status==='lobby') html+=viewLobby();
  else html+=viewGame();
  html+=siteFooter()+privacyCoverHtml();
  app.innerHTML=html;
  try{
    const dock=document.querySelector('.dock'), fixed=dock && getComputedStyle(dock).position==='fixed';
    document.documentElement.style.setProperty('--dock-h', (fixed?dock.offsetHeight:0)+'px');
  }catch(e){}
  renderOverlay();
  renderRulesModal();
  renderInfoModal();
  renderQRModal();
  renderConfirmModal();
  if(fid){ const el=document.getElementById(fid); if(el){ el.focus(); try{ el.setSelectionRange(fsel,fsel); }catch(e){} } }
}
function topBar(){
  const conn=Net.connected();
  const st = !Net.everConnected ? t('connecting') : (conn ? t('online') : t('offline'));
  if(!S.code && typeof AvalonShell!=='undefined') return AvalonShell.header(LANG,'./','home','<span class="av-status '+(conn?'is-online':Net.everConnected?'is-offline':'is-connecting')+'" role="status" aria-label="'+esc(st)+'" title="'+esc(st)+'"><span class="status-dot" aria-hidden="true"></span>'+st+'</span>')+((Net.authFailed || (!Net.everConnected && S.bootAt && Date.now()-S.bootAt>15000))?'<div class="banner-off">'+t('noNet')+'</div>':'');
  return '<div class="top"><button class="brand av-brand" data-a="home" aria-label="'+t('home')+'"><span class="av-mark"><img src="assets/brand-mark.svg" alt="" width="40" height="40"></span><span><b>AVALON</b><small>'+t('sub')+'</small></span></button>'
    +(!S.code?'<nav class="site-navigation" aria-label="Main navigation"><button data-a="home" aria-current="page">'+t('home')+'</button><a href="'+guideRoute()+'">'+t('guide')+'</a><a href="privacy/">'+t('privacy')+'</a><a href="unofficial-notice/">'+t('legal')+'</a></nav>':'')
    +'<div class="top-r">'+(S.code&&S.game?((S.game.status!=='lobby'?'<button class="chip btn privacy-cover-btn" data-a="privacyCover" aria-label="'+t('privacyCover')+'">'+ic('eyeoff')+'<span>'+t('privacyCover')+'</span></button>':'')+(S.game.status==='lobby'?'<button class="chip btn rules-access" data-a="rules" aria-label="'+t('rulesAnytime')+'">'+ic('book')+'<span>'+t('rulesAnytime')+'</span></button>':'')+'<span class="chip room-chip"><span class="dot '+(conn?'on':'')+'"></span><b style="letter-spacing:2px">'+esc(S.code)+'</b></span>'):'<span class="chip"><span class="dot '+(conn?'on':'')+'"></span>'+st+'</span>')
    +(typeof AvalonShell!=='undefined'?AvalonShell.themeControl(LANG)+AvalonShell.languageControl(LANG,'siteLanguage')+AvalonShell.menuControl(LANG,'./','',Boolean(S.code)):'')+'</div></div>'
    +(Net.everConnected && !conn ? '<div class="banner-off">'+t('offline')+'</div>' : '')
    +((Net.authFailed || (!Net.everConnected && S.bootAt && Date.now()-S.bootAt>15000)) ? '<div class="banner-off">'+t('noNet')+'</div>' : '');
}
function siteFooter(){
  if(typeof AvalonShell!=='undefined') return AvalonShell.footer(LANG,'./');
  const support = window.AvalonProject ? '<a class="foot-link" href="support/">'+esc(window.AvalonProject.title(LANG))+'</a>' : '';
  return '<footer class="foot"><p>'+t('footer')+'</p><nav aria-label="Footer"><button class="foot-link" data-a="info" data-info="privacy">'+t('privacy')+'</button><button class="foot-link" data-a="info" data-info="legal">'+t('legal')+'</button><a class="foot-link" href="'+guideRoute()+'">'+t('guide')+'</a><a class="foot-link" href="privacy/">'+t('privacyFull')+'</a><a class="foot-link" href="unofficial-notice/">'+t('legalFull')+'</a>'+support+'<a class="foot-link" href="https://github.com/LorraineWong/avalon" target="_blank" rel="noopener noreferrer">GitHub</a></nav></footer>';
}
function roleGuide(r, count=1){
  return '<div class="role-guide '+side(r)+'">'+roleArt(r,'guide-art')+'<span><b class="'+(side(r)==='good'?'res-s':'res-f')+'">'+rName(r)+(count>1?' ×'+count:'')+'</b><br><span class="muted">'+rDesc(r)+'</span></span></div>';
}
function currentLineupContent(){
  if(!S.game) return '';
  const actual=S.game.n || (S.game.order&&S.game.order.length) || Object.keys(S.seats||{}).length, n=Math.min(10,Math.max(5,actual));
  const built=buildRoles(n,Object.assign({},DEFAULT_SETTINGS,S.game.settings));
  if(built.err || !built.roles) return '';
  const counts={}; built.roles.forEach(r=>counts[r]=(counts[r]||0)+1);
  const roles=Object.keys(counts);
  return '<section class="current-lineup-guide"><div class="lineup-guide-head"><div><h3>'+ic('users')+' '+t('currentLineup')+' · '+n+'</h3><p>'+t('lineupHint')+(actual<5?' '+t('lineupPreview',n):'')+'</p></div><div class="lineup-totals"><span class="tag good">'+built.gd+' '+t('good')+'</span><span class="tag evil">'+built.ev+' '+t('evil')+'</span></div></div><div class="rgrid lineup-guide-grid">'+roles.map(r=>roleGuide(r,counts[r])).join('')+'</div></section>';
}
function setupTable(){
  return '<section class="setup-reference"><h3>'+ic('users')+extra('setupReference')+'</h3><div class="setup-table-wrap"><table class="setup-table"><thead><tr><th scope="col">'+t('players')+'</th><th scope="col" class="good-text">'+ic('shield')+t('good')+'</th><th scope="col" class="evil-text">'+ic('sword')+t('evil')+'</th><th scope="col">'+extra('questTeams')+'</th></tr></thead><tbody>'
    +[5,6,7,8,9,10].map(n=>'<tr><th scope="row">'+n+'</th><td class="good-text">'+(n-EVIL_N[n])+'</td><td class="evil-text">'+EVIL_N[n]+'</td><td><div class="quest-sizes">'+SIZES[n].map((size,i)=>'<span class="'+(n>=7&&i===3?'two-fails':'')+'" title="'+t('questN',i+1)+(n>=7&&i===3?' · '+t('needTwo'):'')+'">'+size+'</span>').join('')+'</div></td></tr>').join('')
    +'</tbody></table></div><p class="setup-footnote">'+extra('setupFootnote')+'</p></section>';
}
function rulesContent(){
  const good=['merlin','percival','cleric','troublemaker','untrustworthy','lancelotGood','servant'];
  const evil=['assassin','morgana','mordred','oberon','trickster','lunatic','brute','revealer','lancelotEvil','minion'];
  return '<section class="rules-flow"><h3>'+ic('sword')+' '+t('howToPlay')+'</h3><ol>'
    +[['step1Title','step1Body'],['step2Title','step2Body'],['step3Title','step3Body'],['step4Title','step4Body']].map(x=>'<li><b>'+t(x[0]).replace(/^\d · /,'')+'</b><span>'+t(x[1])+'</span></li>').join('')+'</ol></section>'
    +'<div class="rules-copy"><p>'+t('rulesP3')+'</p></div><h3 class="all-role-title">'+t('allRoleGuide')+'</h3>'
    +'<div class="rule-camps"><section class="camp good"><h3>'+ic('shield')+' '+t('goodCamp')+'</h3><div class="rgrid">'+good.map(r=>roleGuide(r)).join('')+'</div></section>'
    +'<section class="camp evil"><h3>'+ic('sword')+' '+t('evilCamp')+'</h3><div class="rgrid">'+evil.map(r=>roleGuide(r)).join('')+'</div></section></div>'
    +setupTable();
}
function rulesBlock(){
  return '<details class="rules" '+(S.ui.rulesInlineOpen?'open':'')+'><summary><span class="summary-mark">'+ic('sparkle')+'</span> '+t('rules')+'</summary>'+rulesContent()+'</details>';
}
function lobbyGuideBar(){
  return '<div class="lobby-guide-links"><button class="btn sm" data-a="rulesLineup">'+ic('users')+t('roleInfo')+'</button><button class="btn ghost sm" data-a="rulesFull">'+ic('book')+t('fullRules')+'</button></div>';
}
function renderRulesModal(){
  const el=$('#rulesModal'); if(!el) return;
  if(!S.ui.rulesOpen){ if(el.innerHTML) el.innerHTML=''; el._key=null; return; }
  const tab=S.ui.guideTab==='lineup'?'lineup':'rules', key=LANG+':'+tab+':'+JSON.stringify(S.game&&S.game.settings)+':'+Object.keys(S.seats||{}).length;
  if(el._key===key && el.innerHTML) return;
  el._key=key;
  const tabs='<div class="rules-tabs" role="tablist"><button class="btn '+(tab==='lineup'?'active':'')+'" role="tab" aria-selected="'+(tab==='lineup')+'" data-a="rulesLineup">'+ic('users')+t('currentLineup')+'</button><button class="btn '+(tab==='rules'?'active':'')+'" role="tab" aria-selected="'+(tab==='rules')+'" data-a="rulesFull">'+ic('book')+t('fullRules')+'</button></div>';
  const content=tab==='lineup'?currentLineupContent():rulesContent();
  el.innerHTML='<div class="rules-modal" role="dialog" aria-modal="true" aria-label="'+t('rulesAnytime')+'"><div class="glass rules-sheet"><div class="rules-head"><div><div class="eyebrow">AVALON GUIDE</div><h2>'+(tab==='lineup'?ic('users')+' '+t('currentLineup'):ic('book')+' '+t('fullRules'))+'</h2></div><button class="btn ghost icon rules-close" data-a="closeRules" aria-label="'+t('close')+'">'+ic('x')+'</button></div>'+tabs+'<div class="rules-tab-content">'+content+'</div></div></div>';
  requestAnimationFrame(()=>el.querySelector('.rules-close')?.focus());
}
function baseInfoContent(kind){
  if(LOCALES?.packs[LANG]?.policies) return LOCALES.packs[LANG].policies[kind];
  if(LANG==='zh' && kind==='privacy') return '<p>这个网站使用 Firebase 匿名登录来连接游戏。我们会处理随机生成的匿名账号 ID、你输入的昵称、房间状态与加密后的游戏行动。你的身份解密私钥、偏好和私人推理笔记保存在当前浏览器的 localStorage。</p><p>私人笔记不会上传 Firebase，也不会分享给房主或其他玩家；但能使用这台设备和浏览器的人可能看到它们。你可以在游戏中清空本局笔记，或清除浏览器网站资料。</p><p>游戏不要求邮箱或真实姓名，也没有广告追踪器。请不要把真实姓名或敏感资料当作昵称。新房间带有 72 小时有效期标记；已结束的游戏使用 24 小时标记。房主再次连接时会清除过期房间，维护期间也可能删除旧资料。</p><p>Firebase 和字体服务可能按其政策处理必要的网络资料（例如 IP 地址）。如需报告隐私或安全问题，请使用 GitHub 仓库 Security 页面中的私密漏洞报告功能。<a href="privacy/">查看隐私全文</a>。</p>';
  if(LANG==='zh') return '<p>Avalon Online 是免费的非官方粉丝项目，与《抵抗组织：阿瓦隆》的设计者、出版商及其他权利人不存在隶属、授权、赞助或认可关系。</p><p>相关名称、角色与游戏设定归各自权利人所有。本站代码与界面为本项目开发，图片由 GPT 生成，不使用官方卡牌素材。请支持正版桌游。</p><p>本项目旨在方便玩家进行线上聚会，不宣称拥有原作知识产权，也不提供官方产品的替代授权。自愿赞助只用于网站与开发成本，不解锁游戏功能，也不代表出售或授权原作内容。</p><p>如果权利人认为本站内容存在问题，请通过 GitHub 仓库联系我们处理。<a href="unofficial-notice/">查看完整声明</a>。</p>';
  if(kind==='privacy') return '<p>This site uses Firebase Anonymous Authentication to connect games. We process a randomly generated anonymous account ID, the nickname you enter, room state, and encrypted game actions. Your role-decryption private key, preferences, and private deduction notes stay in this browser’s localStorage.</p><p>Private notes are never uploaded to Firebase or shared with the host or other players. Anyone with access to this device and browser may still see them. Clear notes in the game or remove this site’s browser data when needed.</p><p>No email or real name is required, and the site has no advertising trackers. Do not use a real name or sensitive information as your nickname. New rooms carry a 72-hour expiry marker; completed games use a 24-hour marker. The host client removes expired rooms when it reconnects, and old data may also be deleted during maintenance.</p><p>Firebase and the font provider may process necessary network data such as IP addresses under their own policies. Report privacy or security issues privately through the repository’s GitHub Security page. <a href="privacy/">Read the full privacy notice</a>.</p>';
  return '<p>Avalon Online is a free, unofficial fan project. It is not affiliated with, authorized by, sponsored, or endorsed by the designers, publishers, or other rights holders of The Resistance: Avalon.</p><p>Game, character, and setting names belong to their respective owners. The code and interface were developed for this project; site images were generated with GPT, and no official card artwork is used. Please support the official board game.</p><p>The project helps players run online game nights. It does not claim ownership of the original intellectual property or provide an official replacement licence. Voluntary support only covers site and development costs and unlocks no gameplay.</p><p>Rights holders can contact the project through its GitHub repository. <a href="unofficial-notice/">Read the full notice</a>.</p>';
}
function infoContent(kind){return baseInfoContent(kind)+(kind==='privacy'?(window.AvalonPrivacyAdditions?.[LANG]||''):'');}
function renderInfoModal(){
  const el=$('#infoModal'); if(!el) return;
  const kind=S.ui.infoOpen;
  if(!kind){ if(el.innerHTML) el.innerHTML=''; el._key=null; return; }
  const key=kind+':'+LANG; if(el._key===key) return; el._key=key;
  const title=kind==='privacy'?t('privacy'):t('legal');
  el.innerHTML='<div class="rules-modal info-modal" role="dialog" aria-modal="true" aria-labelledby="infoTitle"><div class="glass rules-sheet info-sheet"><div class="rules-head"><div><div class="eyebrow">AVALON ONLINE</div><h2 id="infoTitle">'+title+'</h2></div><button class="btn ghost icon rules-close" data-a="closeInfo" aria-label="'+t('close')+'">'+ic('x')+'</button></div><div class="info-copy">'+infoContent(kind)+'</div></div></div>';
  requestAnimationFrame(()=>el.querySelector('.rules-close')?.focus());
}
function renderQRModal(){
  const el=$('#qrModal'); if(!el) return;
  if(!S.ui.qrOpen || !S.game){ el.innerHTML=''; el._key=null; return; }
  const link=location.origin+location.pathname+'#'+S.game.code, key=LANG+':'+link;
  if(el._key===key && el.innerHTML) return; el._key=key;
  el.innerHTML='<div class="rules-modal qr-modal" role="dialog" aria-modal="true" aria-labelledby="qrTitle"><div class="glass qr-sheet"><button class="btn ghost icon qr-close" data-a="closeQR" aria-label="'+t('close')+'">'+ic('x')+'</button><div class="eyebrow">AVALON · '+esc(S.game.code)+'</div><h2 id="qrTitle">'+t('scanJoin')+'</h2><div id="qrCanvas" class="qr-canvas"></div><b class="qr-code">'+esc(S.game.code)+'</b><button class="btn pri" data-a="copy">'+ic('link')+t('copyLink')+'</button></div></div>';
  requestAnimationFrame(()=>{ const box=$('#qrCanvas'); if(box&&window.QRCode) new QRCode(box,{text:link,width:220,height:220,colorDark:'#110d0a',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M}); el.querySelector('.qr-close')?.focus(); });
}
function askConfirm(message, action, value=null, people=[], confirmLabel=''){
  S.ui.confirm={message,action,value,people,confirmLabel};
  renderConfirmModal();
}
function runConfirmed(){
  const pending=S.ui.confirm; S.ui.confirm=null; renderConfirmModal();
  if(!pending) return;
  if(pending.action==='kick') return kick(pending.value);
  if(pending.action==='leave') return leaveRoom();
  if(pending.action==='again') return playAgain();
  if(pending.action==='propose') return submit(pending.value);
  if(pending.action==='submit') return submit(pending.value);
}
function renderConfirmModal(){
  const el=$('#confirmModal'); if(!el) return;
  const pending=S.ui.confirm;
  if(!pending){ el.innerHTML=''; return; }
  const people=(pending.people||[]).map(pid=>'<span class="confirm-person"><i class="player-avatar" style="'+avStyle(pid)+'"></i><b>'+esc(nickOf(pid))+'</b></span>').join('');
  el.innerHTML='<div class="rules-modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirmTitle"><div class="glass confirm-sheet '+esc(pending.action)+'"><div class="confirm-mark">!</div><h2 id="confirmTitle">'+t('confirmTitle')+'</h2><p>'+esc(pending.message)+'</p>'+(people?'<div class="confirm-people">'+people+'</div>':'')+'<div class="row"><button class="btn ghost big" data-a="confirmCancel">'+t('cancel')+'</button><button class="btn evil big" data-a="confirmRun">'+esc(pending.confirmLabel||t('confirm'))+'</button></div></div></div>';
  requestAnimationFrame(()=>el.querySelector('[data-a="confirmRun"]')?.focus());
}
function privacyCoverHtml(){
  if(!S.ui.privacyCover) return '';
  return '<div class="privacy-cover" role="dialog" aria-modal="true"><div class="privacy-cover-crest"><img src="assets/brand-mark.svg" alt="" width="78" height="78"></div><h2>'+t('coveredTitle')+'</h2><p>'+t('coveredHint')+'</p><button class="btn pri big" data-a="privacyCover">'+t('revealScreen')+'</button></div>';
}
function viewHome(){
  const last=LS.get('last');
  return '<div class="hero"><div class="hero-art hero-art-good"><img src="'+ROLE_META.merlin.art+'" alt="Merlin"></div><div class="hero-art hero-art-evil"><img src="'+ROLE_META.morgana.art+'" alt="Morgana"></div>'
    +'<div class="hero-copy"><div class="eyebrow">'+extra('projectLabel')+'</div><div class="crest"><span>V</span></div><h1>Avalon Online</h1><div class="sub">'+t('tagline')+'</div><p class="hero-lead">'+extra('projectLead')+'</p><p class="hero-oath">'+extra('oath')+'</p>'
    +'<div class="feature"><span>'+ic('users')+'<b>'+t('feat1')+'</b></span><span>'+ic('sparkle')+'<b>'+t('feat2')+'</b></span><span>'+ic('device')+'<b>'+t('feat3')+'</b></span><span>'+ic('lock')+'<b>'+t('feat4')+'</b></span></div></div></div>'
    +(last ? '<div class="glass resume"><span>'+t('resume','<b style="letter-spacing:2px">'+esc(last)+'</b>')+'</span><button class="btn pri" data-a="resume">'+t('resumeBtn')+'</button></div>' : '')
    +'<div class="home-grid"><div class="glass card"><h2>'+t('nick')+'</h2><input class="input" id="nick" aria-label="'+t('nick')+'" maxlength="12" placeholder="'+t('nickPh')+'" value="'+esc(S.ui.nick)+'">'
    +'<button class="btn pri" data-a="create">'+ic('plus')+t('create')+'</button></div>'
    +'<div class="glass card"><h2>'+t('joinTitle')+'</h2><div class="row"><input class="input code" id="joinCode" aria-label="'+t('codePh')+'" maxlength="8" placeholder="'+t('codePh')+'" value="'+esc(S.ui.joinCode)+'" style="flex:1;min-width:0">'
    +'<button class="btn pri" data-a="join">'+t('join')+'</button></div><p class="muted small" style="margin-bottom:0">'+t('joinHint')+'</p></div></div>'
    ;
}
function viewLobby(){
  const g=S.game, ids=lobbyOrder(), n=ids.length, host=isHost(), seated=!!S.seats[ME.pid];
  const st=Object.assign({}, DEFAULT_SETTINGS, g.settings);
  const br=buildRoles(n, st), pv=buildRoles(Math.min(10,Math.max(5,n)), st);
  let seats=ids.map(p=>{
    const s=S.seats[p], mine=p===ME.pid;
    return '<div class="seatcard'+(mine?' me':'')+'">'+'<div class="av player-avatar" style="'+avStyle(p)+'"><span class="on '+(Net.isOnline(p)?'y':'')+'"></span></div>'
      +'<div class="seat-info"><div class="nm">'+esc(s.nick)+'</div>'+(p===g.host?'<span class="tag host">'+ic('crown')+' '+t('host')+'</span>':'')+(mine?'<span class="tag me">'+t('you')+'</span>':'')+'</div>'
      +(mine?'<button class="seat-edit" data-a="editName" aria-label="'+t('editName')+'">'+ic('pencil')+t('editName')+'</button>':'')
      +(host && !mine ? '<button class="x" title="kick" aria-label="kick" data-kick="'+esc(p)+'">'+ic('x')+'</button>' : '')+'</div>';
  }).join('');
  for(let i=n;i<Math.max(5,Math.min(10,n+1));i++) seats+='<div class="seatcard empty tiny">'+t('emptySeat')+'</div>';
  const tile=(k,role,name,desc,cls)=>'<button class="rt '+cls+(st[k]?' on':'')+'" '+(host?'data-set="'+k+'"':'disabled')+'>'+roleArt(role,'tile-art')+'<span><b>'+name+'</b><span>'+desc+'</span></span></button>';
  const lineupSide=(s,label,count)=>'<section class="lineup-side '+s+'"><h3><span>'+(s==='good'?ic('shield'):ic('sword'))+' '+label+'</span><b>'+count+'</b></h3><div class="lineup-roles">'+pv.roles.filter(r=>side(r)===s).map(r=>'<span class="lineup-character">'+roleArt(r,'lineup-art')+'<span>'+rName(r)+'</span></span>').join('')+'</div></section>';
  const compHtml = pv.err ? '<p class="warn small">'+esc(pv.err)+'</p>' :
    '<div class="lineup-title">'+(n<5?t('lineupPreviewTitle',5):t('currentLineup')+' · '+n)+'</div><div class="lineup">'+lineupSide('good',t('goodCamp'),pv.gd)+lineupSide('evil',t('evilCamp'),pv.ev)+'</div>'
    +'<p class="muted small" style="margin:7px 0 0">'+(n<5?t('lineupWaiting'):'')+'</p>';
  const goodSettings=tile('percival','percival',rName('percival'),rDesc('percival').split(/[。.]/)[0],'good')
    +tile('cleric','cleric',rName('cleric'),rDesc('cleric').split(/[。.]/)[0],'good')
    +tile('troublemaker','troublemaker',rName('troublemaker'),rDesc('troublemaker').split(/[。.]/)[0],'good')
    +tile('untrustworthy','untrustworthy',rName('untrustworthy'),rDesc('untrustworthy').split(/[。.]/)[0],'good');
  const evilSettings=tile('morgana','morgana',rName('morgana'),rDesc('morgana').split(/[。.]/)[0],'evil')
    +tile('mordred','mordred',rName('mordred'),rDesc('mordred').split(/[。.]/)[0],'evil')
    +tile('oberon','oberon',rName('oberon'),rDesc('oberon').split(/[，(（,]/)[0],'evil')
    +tile('lunatic','lunatic',rName('lunatic'),rDesc('lunatic').split(/[。.]/)[0],'evil')
    +tile('brute','brute',rName('brute'),rDesc('brute').split(/[。.]/)[0],'evil')
    +tile('revealer','revealer',rName('revealer'),rDesc('revealer').split(/[。.]/)[0],'evil')
    +tile('trickster','trickster',rName('trickster'),rDesc('trickster').split(/[。.]/)[0],'evil');
  const modules=tile('merlin','merlin',t('optMerlin'),t('optMerlinD'),'neutral')
    +tile('lancelot','lancelotGood',t('optLancelot'),t('optLancelotD'),'neutral')
    +tile('lancelotSwitch','lancelotEvil',t('optLancelotSwitch'),t('optLancelotSwitchD'),'neutral')
    +'<button class="rt neutral'+(st.lady?' on':'')+'" '+(host?'data-set="lady"':'disabled')+'><span class="lady-art">'+ic('droplet')+'</span><span><b>'+t('optLady')+'</b><span>'+t('optLadyD')+'</span></span></button>'
    +'<button class="rt neutral'+(st.excalibur?' on':'')+'" '+(host?'data-set="excalibur"':'disabled')+'><span class="lady-art">'+ic('sword')+'</span><span><b>'+t('optExcalibur')+'</b><span>'+t('optExcaliburD')+'</span></span></button>';
  const need=Math.max(0,5-n);
  const status='<div class="lobby-status'+(need?'':' ready')+'"><b>'+(need?(need===1?t('lobbyNeedOne'):t('lobbyNeed',need)):t(host?'lobbyReadyHost':'lobbyReady'))+'</b><span>'+t('lobbySteps')+'</span></div>';
  const presets='<div class="preset-wrap"><span class="muted tiny">'+t('presets')+'</span><div class="preset-row">'+['new','classic','big'].map(id=>{
    const expected=presetSettings(id,Math.min(10,Math.max(5,n))), active=Object.keys(expected).every(k=>!!st[k]===!!expected[k]);
    return '<button class="btn sm preset-btn'+(active?' active':'')+'" data-preset="'+id+'" aria-pressed="'+active+'">'+(active?ic('check'):'')+t(id==='new'?'presetNew':id==='classic'?'presetClassic':'presetBig')+'</button>';
  }).join('')+'</div></div>';
  const advanced='<details class="settings-advanced" '+(S.ui.settingsOpen?'open':'')+'><summary><span><b>'+ic('settings')+' '+t('advancedRoles')+'</b><small>'+t('advancedRolesHint')+'</small></span><i>⌄</i></summary><div class="settings-advanced-body"><div class="settings-camps">'
    +'<section class="setting-camp good"><h3>'+ic('shield')+' '+t('goodCamp')+'</h3><div class="roletiles">'+goodSettings+'</div></section>'
    +'<section class="setting-camp evil"><h3>'+ic('sword')+' '+t('evilCamp')+'</h3><div class="roletiles">'+evilSettings+'</div></section></div>'
    +'<section class="setting-camp modules"><h3>'+ic('sparkle')+' '+t('gameModules')+'</h3><div class="roletiles">'+modules+'</div></section></div></details>';
  // Guests only need to see what is in play; the controls stay with the host.
  const roleSetup=host ? presets+compHtml+lobbyGuideBar()+advanced : compHtml+lobbyGuideBar();
  return '<div class="glass card roomcode"><div class="roomcode-main"><div class="muted small">'+t('roomCode')+'</div><div class="code">'+esc(g.code)+'</div></div>'
    +'<div class="roomcode-side"><div class="row roomcode-actions"><button class="btn pri" data-a="copy">'+ic('link')+t('copyLink')+'</button><button class="btn" data-a="qr">'+ic('qr')+t('showQR')+'</button>'+(navigator.share?'<button class="btn" data-a="share">'+ic('share')+t('share')+'</button>':'')+'</div><div class="muted small roomcode-hint">'+t('inviteHint')+'</div></div></div>'
    +'<div class="lobby"><div class="glass card lobby-players">'+status+'<h2>'+t('players')+' · '+n+'/10</h2><div class="seats">'+seats+'</div>'
    +(seated?'':'<div class="row seat-join"><input class="input" id="nick" maxlength="12" placeholder="'+t('nickPh')+'" value="'+esc(S.ui.nick)+'" style="flex:1;min-width:120px"><button class="btn pri" data-a="seat">'+t('seat')+'</button></div>')
    +'<div class="row lobby-actions">'
    +(host?'<button class="btn start-action big" data-a="start" '+(br.err||S.ui.busy?'disabled':'')+'>'+(S.ui.busy?t('dealing'):ic('play')+t('start'))+'</button>':'<span class="muted lobby-wait">'+ic('clock')+' '+t('waitHost')+'</span>')
    +'<button class="btn danger" data-a="leave">'+ic('exit')+t('leave')+'</button></div>'
    +(host&&br.err&&!need?'<p class="warn small" style="margin-bottom:0">'+esc(br.err)+'</p>':'')+'</div>'
    +'<div class="glass card lobby-roles"><h2>'+t('roleSettings')+(host?'':' <span class="muted small">· '+t('hostOnly')+'</span>')+'</h2>'+roleSetup+'</div></div>';
}

function pickMode(g){
  if(S.ui.busy || g.status!=='play') return null;
  const me=ME.pid;
  if(g.phase==='propose' && g.order[g.leader]===me) return {max:g.quests[g.q].size, ok:()=>true};
  if(g.phase==='lady' && g.lady && g.lady.holder===me) return {max:1, ok:u=>u!==me && !g.lady.used.includes(u)};
  if(g.phase==='excalibur' && g.excaliburHolder===me) return {max:1, ok:u=>g.team.includes(u)&&u!==me};
  if(g.phase==='recruit' && S.mine && S.mine.role==='assassin') return {max:1, ok:u=>u!==me};
  if(g.phase==='assassin' && ((g.recruitedPlayer&&g.recruitedPlayer===me)||(!g.recruitedPlayer&&S.mine&&S.mine.role==='assassin'))) return {max:1, ok:u=>u!==me};
  return null;
}
function needsAct(g,u){
  if(g.phase==='propose') return g.order[g.leader]===u;
  if(g.phase==='vote') return true;
  if(g.phase==='quest') return (g.team||[]).includes(u);
  if(g.phase==='excalibur') return g.excaliburHolder===u;
  if(g.phase==='lady') return !!(g.lady && g.lady.holder===u);
  if(g.phase==='loyalty') return !!(g.loyalty && g.loyalty.target===u);
  if(g.phase==='recruit') return u===ME.pid&&S.mine&&S.mine.role==='assassin';
  if(g.phase==='assassin') return u===ME.pid&&((g.recruitedPlayer&&g.recruitedPlayer===u)||(!g.recruitedPlayer&&S.mine&&S.mine.role==='assassin'));
  return false;
}
function viewGame(){
  const g=S.game;
  const offline = g.status==='play' && !isHost() && Net.connected() && Date.now()-S.joinedAt>25000 && !Net.isOnline(g.host);
  return (offline?'<div class="banner-off">⚠️ '+t('hostOffline', esc(nickOf(g.host)))+'</div>':'')
    +'<div class="game"><div class="game-table">'+tableView(g)+'</div><div class="panel">'
    +'<div class="dock '+(g.status==='end'?'dock-end':'')+'">'+actionBlock(g)+'</div>'
    +roleBar()+toolPanel(g)+'</div></div>';
}
function notesStorageKey(g=S.game){ return g&&S.code ? 'notes.'+S.code+'.'+(g.gid||'lobby') : ''; }
function readPrivateNotes(){ const key=notesStorageKey(); return key ? (LS.get(key)||{}) : {}; }
function noteRoleOptions(g){
  const built=buildRoles(g.n||g.order.length,Object.assign({},DEFAULT_SETTINGS,g.settings));
  return built.roles ? [...new Set(built.roles)] : [];
}
function noteMarkLabel(mark){
  if(mark==='good') return t('leanGood');
  if(mark==='evil') return t('leanEvil');
  return ROLE_META[mark] ? rName(mark) : '';
}
function savePrivateNote(pid, field, value){
  const g=S.game, key=notesStorageKey(g); if(!g||!key||!g.order.includes(pid)) return;
  const notes=readPrivateNotes(), next=Object.assign({},notes[pid]||{});
  if(field==='text') next.text=String(value||'').slice(0,240);
  if(field==='mark'){
    const allowed=new Set(['','good','evil',...noteRoleOptions(g)]); if(!allowed.has(value)) return;
    next.mark=value;
  }
  if(!next.text&&!next.mark) delete notes[pid]; else notes[pid]=next;
  LS.set(key,notes);
}
function privateNotesPanel(g){
  if(!g.order||!g.order.length) return '';
  const open=S.ui.notesOpen;
  if(!open) return '<button class="glass card private-notes-toggle" data-a="toggleNotes"><span>'+ic('pencil')+'</span><span><b>'+t('privateNotes')+'</b><small>'+t('openNotes')+'</small></span><span>›</span></button>';
  const notes=readPrivateNotes(), roles=noteRoleOptions(g);
  const options=(selected)=>'<option value="">'+t('unmarked')+'</option><option value="good" '+(selected==='good'?'selected':'')+'>'+t('leanGood')+'</option><option value="evil" '+(selected==='evil'?'selected':'')+'>'+t('leanEvil')+'</option>'+roles.map(r=>'<option value="'+r+'" '+(selected===r?'selected':'')+'>'+rName(r)+'</option>').join('');
  const rows=g.order.filter(pid=>pid!==ME.pid).map(pid=>{ const note=notes[pid]||{}; return '<div class="private-note-row"><div class="private-note-person"><span class="note-avatar player-avatar" style="'+avStyle(pid)+'"></span><b>'+esc(nickOf(pid))+'</b></div><select class="note-select" id="note-mark-'+esc(pid)+'" data-note-player="'+esc(pid)+'" aria-label="'+t('suspectAs')+' · '+esc(nickOf(pid))+'">'+options(note.mark||'')+'</select><textarea class="note-text" id="note-text-'+esc(pid)+'" data-note-player="'+esc(pid)+'" maxlength="240" rows="1" aria-label="'+t('privateNotes')+' · '+esc(nickOf(pid))+'" placeholder="'+t('notePlaceholder')+'">'+esc(note.text||'')+'</textarea></div>'; }).join('');
  return '<section class="glass card private-notes"><div class="private-notes-head"><div><h3>'+ic('pencil')+' '+t('privateNotes')+'</h3><p>'+ic('lock')+' '+t('notesHint')+'</p></div></div><div class="private-note-list">'+rows+'</div><button class="btn link notes-clear" data-a="clearNotes">'+t('clearNotes')+'</button></section>';
}
function reactionPanel(g){
  if(!g.order.includes(ME.pid) || !S.seats[ME.pid]) return '';
  return '<div class="reactions" role="group" aria-label="'+t('react')+'"><div class="reaction-row">'
    +REACTIONS.map(r=>'<button class="reaction-btn" data-reaction="'+r.id+'" aria-label="'+t(r.label)+'" title="'+t(r.label)+'">'+ic(r.icon)+'</button>').join('')+'</div></div>';
}
/* Everything that is not the current action lives behind one row of tabs, so the
 * side panel stays one screen tall. On phones an open tab becomes a bottom sheet. */
function toolPanel(g){
  const inGame=g.order.includes(ME.pid), canReact=inGame && !!S.seats[ME.pid], hostTools=isHost() && g.status==='play';
  let tab=S.ui.tool;
  if((tab==='host' && !hostTools) || (tab==='notes' && !inGame) || (tab==='react' && !canReact)) tab=null;
  const tabBtn=(id,icon,label,cls)=>'<button class="tool-tab'+(cls?' '+cls:'')+(tab===id?' on':'')+'" data-tool="'+id+'" aria-expanded="'+(tab===id)+'">'+ic(icon)+'<span>'+label+'</span></button>';
  const tabs=(canReact?tabBtn('react','smile',t('tReact'),'only-narrow'):'')+tabBtn('history','list',t('tHistory'))+(inGame?tabBtn('notes','pencil',t('tNotes')):'')+(hostTools?tabBtn('host','crown',t('tHost')):'')
    +'<button class="tool-tab" data-a="rules">'+ic('book')+'<span>'+t('tRules')+'</span></button>';
  const body=tab==='history'?historyBlock(g):tab==='notes'?privateNotesPanel(g):tab==='host'?hostToolsPanel(g):tab==='react'?reactionPanel(g):'';
  return '<section class="glass card tools">'+(canReact?'<div class="only-wide">'+reactionPanel(g)+'</div>':'')+'<div class="tool-tabs" role="toolbar">'+tabs+'</div>'
    +(body?'<button class="sheet-backdrop" data-tool="'+tab+'" aria-label="'+t('close')+'"></button><div class="tool-body sheet tool-'+tab+'"><div class="tool-sheet-head"><b>'+t(({history:'tHistory',notes:'tNotes',host:'tHost',react:'tReact'})[tab])+'</b><button class="btn ghost icon sheet-close tool-close" data-tool="'+tab+'" aria-label="'+t('close')+'">'+ic('x')+'</button></div>'+body+'</div>':'')+'</section>';
}
function sendReaction(id){
  const def=REACTIONS.find(r=>r.id===id), now=Date.now();
  if(!def || !S.seats[ME.pid] || now-S.ui.lastReactionAt<700) return;
  S.ui.lastReactionAt=now;
  Net.react(ME.pid,id,now);
}
function visibleReaction(seat){
  const r=seat&&seat.reaction, def=r&&REACTIONS.find(x=>x.id===r.id);
  return def && Date.now()-r.at<REACTION_MS ? def : null;
}
function publicDraftTeam(g){
  if(!g || g.phase!=='propose') return [];
  const leader=g.order[g.leader], max=g.quests[g.q].size;
  if(leader===ME.pid) return S.ui.pick.slice(0,max);
  const draft=S.seats[leader]&&S.seats[leader].draftTeam;
  if(!draft || draft.step!==g.step || !Array.isArray(draft.picks)) return [];
  return [...new Set(draft.picks)].filter(pid=>g.order.includes(pid)).slice(0,max);
}
function questScore(g){
  return (g.quests||[]).reduce((out,q)=>{ if(q.r==='S') out.good++; if(q.r==='F') out.evil++; return out; },{good:0,evil:0});
}
function phaseActors(g){
  if(!g||g.status!=='play') return [];
  if(g.phase==='propose') return [g.order[g.leader]];
  if(g.phase==='vote') return g.order.slice();
  if(g.phase==='quest') return (g.team||[]).slice();
  if(g.phase==='excalibur') return g.excaliburHolder?[g.excaliburHolder]:[];
  if(g.phase==='lady') return g.lady&&g.lady.holder?[g.lady.holder]:[];
  if(g.phase==='loyalty') return g.loyalty&&g.loyalty.target?[g.loyalty.target]:[];
  // Recruitment and assassination actors are deliberately not exposed here.
  return [];
}
function actionStatus(g){
  const actors=phaseActors(g); if(!actors.length || g.phase==='propose') return '';
  const waiting=actors.filter(pid=>!acted(pid));
  if(!waiting.length) return '<div class="action-status done">✓ '+t('allDone')+'</div>';
  return '<div class="action-status"><b>'+t('waitingFor')+'</b><div class="wait-people">'+waiting.map(pid=>'<span class="wait-person '+(Net.isOnline(pid)?'':'offline')+'"><i class="player-avatar" style="'+avStyle(pid)+'"></i><span>'+esc(nickOf(pid))+(Net.isOnline(pid)?'':' · '+t('offlinePlayer'))+'</span></span>').join('')+'</div></div>';
}
function tableView(g){
  const n=g.order.length, pm=pickMode(g), endRoles=g.status==='end'?(g.roles||{}):null;
  const privateNotes=S.ui.notesOpen?readPrivateNotes():{};
  const sees=new Set((S.peek&&S.mine&&S.mine.sees)||[]), lady={}; if(S.peek) S.ladyMine.forEach(x=>lady[x.target]=x.side); // private info only while the role card is open
  const checked={}; if(S.peek) S.checksMine.filter(x=>x.source!=='lady').forEach(x=>checked[x.target]=x.side);
  const draftTeam=publicDraftTeam(g);
  const last=(g.rounds||[]).slice(-1)[0];
  const showVotes = last && g.status==='play' && (g.phase==='quest' || (g.phase==='propose' && !last.ok && last.q===g.q));
  const L=g.order[g.leader];
  const seats=g.order.map((p,i)=>{
    const ang=(-90 + i*360/n)*Math.PI/180;
    const x=50+41*Math.cos(ang), y=50+36*Math.sin(ang);
    const onTeam=['vote','quest','excalibur'].includes(g.phase) && (g.team||[]).includes(p);
    const can=pm && pm.ok(p), picked=(g.phase==='propose'?draftTeam:S.ui.pick).includes(p), skillKnown=sees.has(p)||!!lady[p]||!!checked[p];
    let tags='';
    if(endRoles && endRoles[p]) tags+='<span class="tag '+((g.allegiances&&g.allegiances[p])||side(endRoles[p]))+'">'+roleIcon(endRoles[p])+' '+rName(endRoles[p])+'</span>';
    else {
      if(sees.has(p)) tags+='<span class="tag clue">'+t(S.mine.see)+'</span>';
      if(lady[p]) tags+='<span class="tag '+lady[p]+'">'+ic('droplet')+' '+t(lady[p])+'</span>';
      if((g.revealed||[]).includes(p)) tags+='<span class="tag evil">◉ '+rName('revealer')+'</span>';
      const note=privateNotes[p], noteLabel=note&&noteMarkLabel(note.mark);
      if(noteLabel) tags+='<span class="tag note-tag '+(note.mark==='good'||side(note.mark)==='good'?'good':note.mark==='evil'||side(note.mark)==='evil'?'evil':'')+'">'+ic('pencil')+' '+esc(noteLabel)+'</span>';
    }
    let badges='<span class="b-off '+(Net.isOnline(p)?'y':'')+'"></span>';
    const reaction=visibleReaction(S.seats[p]);
    if(reaction) badges+='<span class="reaction-bubble" aria-label="'+t(reaction.label)+'">'+ic(reaction.icon)+'</span>';
    if(skillKnown) badges+='<span class="badge b-known" aria-label="'+t('youSee',nickOf(p))+'">'+ic('eye')+'</span>';
    if(picked) badges+='<span class="badge b-pick-order" aria-label="'+t('selectedTeam')+'">'+((g.phase==='propose'?draftTeam:S.ui.pick).indexOf(p)+1)+'</span>';
    if(g.status==='play' && p===L && ['propose','vote','quest','excalibur'].includes(g.phase)) badges+='<span class="badge b-crown">'+ic('crown')+'</span>';
    if(g.lady && g.lady.holder===p && g.status==='play') badges+='<span class="badge b-lady">'+ic('droplet')+'</span>';
    if(g.excaliburHolder===p && g.status==='play') badges+='<span class="badge b-lady">'+ic('sword')+'</span>';
    if(g.status==='play' && needsAct(g,p)) badges+= acted(p) ? '<span class="badge b-act">✓</span>' : '<span class="badge b-wait">'+ic('clock')+'</span>';
    if(showVotes && last.votes[p]!==undefined) badges+='<span class="badge b-vote '+(last.votes[p]?'y':'n')+'">'+(last.votes[p]?'✓':'✗')+'</span>';
    const cls='seatp'+(onTeam?' team':'')+(can?' pick':'')+(picked?' picked':'')+(skillKnown?' skill-known':'')+(p===ME.pid?' me':'')+(g.assassinPick===p?' stabbed':'')+(pm&&!can?' dimmed':'');
    return '<button class="'+cls+'" title="'+esc(nickOf(p))+'" style="left:'+x.toFixed(2)+'%;top:calc('+y.toFixed(2)+'% - var(--seat-avatar)/2)" '+(can?'data-pick="'+esc(p)+'"':'tabindex="-1"')+'>'
      +'<div class="pav player-avatar" style="'+avStyle(p)+'">'+badges+'</div>'
      +'<div class="pn">'+(p===ME.pid?'<b class="me-chip">'+t('meMark')+'</b>':'')+(i+1)+'·'+esc(nickOf(p))+'</div><div class="pt">'+tags+'</div></button>';
  }).join('');
  const qt=g.quests.map((q,i)=>'<div class="qt '+(q.r||'')+(q.two?' two':'')+(i===g.q&&g.status==='play'&&!q.r?' cur':'')+'">'+(q.r?(q.r==='S'?'✓':'✗'):q.size)
    +'<small>'+(q.r?t('fails',q.fails):t('questN',i+1))+'</small></div>').join('');
  const rej=[1,2,3,4,5].map(i=>'<i class="'+(i<g.att&&g.status==='play'?'x':'')+(i===5?' last':'')+'"></i>').join('');
  const score=questScore(g), scoreLabel=t('good')+' '+score.good+' · '+t('evil')+' '+score.evil, scoreHint=score.good>=3?t('r3s'):score.evil>=3?t('r3f'):t('goodNeeds',3-score.good)+' · '+t('evilNeeds',3-score.evil); let center;
  if(g.status==='end') center='<div class="table-kicker">'+t('score')+'</div><div class="ph '+(g.winner==='good'?'res-s':'res-f')+'">'+(g.winner==='good'?ic('shield')+' '+t('goodWin'):ic('sword')+' '+t('evilWin'))+'</div><div class="scoreline" aria-label="'+esc(scoreLabel)+'"><span class="score-good">'+ic('shield')+' '+score.good+'</span><i>:</i><span class="score-evil">'+score.evil+' '+ic('sword')+'</span></div><div class="phs">'+t(g.reason)+'</div>';
  else center='<div class="table-kicker">'+t('questN', g.q+1)+' · '+t('attempt',g.att)+'</div><div class="ph">'+t('ph_'+g.phase)+'</div><div class="scoreline" aria-label="'+esc(scoreLabel)+'"><span class="score-good">'+ic('shield')+' '+score.good+'</span><i>:</i><span class="score-evil">'+score.evil+' '+ic('sword')+'</span></div><div class="phs">'+scoreHint+'</div>';
  return '<div class="glass card" style="padding:10px"><div class="tablewrap"><div class="table" data-players="'+n+'" style="--seat-avatar:'+(n>=9?'10.75cqw':n>=7?'11.5cqw':'12.5cqw')+'"><div class="disc">'+center+'<div class="qtoks">'+qt+'</div>'
    +(g.status==='play'?'<div class="rejs">'+rej+'<span>'+t('attempt', g.att)+'</span></div>':'')+'</div>'+seats+'</div></div>'
    +(g.lady&&g.lady.log&&g.lady.log.length?'<p class="muted small" style="text-align:center;margin:4px 0 6px">'+ic('droplet')+' '+g.lady.log.map(x=>esc(nickOf(x.from))+' → '+esc(nickOf(x.to))).join(' · ')+'</p>':'')
    +(g.events&&g.events.length?'<p class="muted small" style="text-align:center;margin:4px 0 6px">'+g.events.slice(-3).map(x=>ic('sparkle')+' '+t(x.type)+(x.player?' · '+esc(nickOf(x.player)):'')).join(' · ')+'</p>':'')+'</div>';
}
function assassinationResult(g, compact=false){
  const target=g&&g.assassinPick, roles=g&&g.roles;
  if(!target || !roles || !roles[target]) return '';
  const role=roles[target], hit=role==='merlin';
  return '<section class="assassination-result '+(hit?'hit':'miss')+(compact?' compact':'')+'"><div class="assassination-mark">'+(hit?'✓':'✕')+'</div><div class="assassination-copy"><small>'+t('assResult')+'</small><strong>'+(hit?t('assHit'):t('assMiss'))+'</strong><div class="assassination-target"><span class="assassination-avatar player-avatar" style="'+avStyle(target)+'"></span><span><b>'+esc(nickOf(target))+'</b><em>'+t('revealedAs',esc(nickOf(target)),'<b>'+roleIcon(role)+' '+rName(role)+'</b>')+'</em></span></div></div></section>';
}
function selectedTeamReview(list,size){
  return '<section class="selected-team-review"><div class="selected-team-head"><b>'+t('selectedTeam')+' · '+list.length+'/'+size+'</b>'+(list.length?'<small>'+t('tapRemove')+'</small>':'')+'</div><div class="selected-people">'+list.map((pid,i)=>'<button class="selected-person" data-pick="'+esc(pid)+'" aria-label="'+t('tapRemove')+' · '+esc(nickOf(pid))+'"><span class="selected-order">'+(i+1)+'</span><i class="player-avatar" style="'+avStyle(pid)+'"></i><span>'+esc(nickOf(pid))+'</span><em>'+ic('x')+'</em></button>').join('')+'</div></section>';
}
function actionBlock(g){
  const me=ME.pid, inGame=g.order.includes(me), busy=S.ui.busy, mine=S.ui.myActs[g.step], L=g.order[g.leader];
  if(g.status==='end') return '<div class="glass card act">'+assassinationResult(g,true)+'<h2>'+(g.winner==='good'?ic('shield')+' '+t('goodWin'):ic('sword')+' '+t('evilWin'))+'</h2><div class="hint">'+t(g.reason)+'</div>'
    +'<div class="row">'+(isHost()?'<button class="btn pri big" data-a="again">'+ic('refresh')+t('again')+'</button>':'<span class="muted">'+t('waitAgain')+'</span>')+'<button class="btn ghost big" data-a="showend">'+t('allRoles')+'</button></div></div>';
  if(!inGame) return '<div class="glass card act"><h2>'+ic('eye')+' '+t('spectator')+'</h2><div class="hint">'+t('ph_'+g.phase)+'</div></div>';
  const prog=(list)=>{ const k=list.filter(acted).length; return '<div class="progress"><b style="width:'+(100*k/list.length)+'%"></b></div>'; };
  const chips=list=>'<div class="pickrow">'+list.map(u=>'<span class="tag" style="font-size:13px;padding:2px 10px">'+esc(nickOf(u))+'</span>').join('')+'</div>';
  let h='';
  if(g.phase==='propose'){
    const size=g.quests[g.q].size;
    if(L===me){
      const sword=g.settings.excalibur && S.ui.pick.length===size ? '<div class="hint" style="margin-top:10px">'+ic('sword')+' '+t('excaliburPick')+'<br><span class="muted small">'+t('excaliburHint')+'</span></div><div class="pickrow">'+S.ui.pick.filter(u=>u!==me).map(u=>'<button class="tag '+(S.ui.excalibur===u?'good':'')+'" data-excalibur="'+esc(u)+'">'+ic('sword')+' '+esc(nickOf(u))+'</button>').join('')+'</div>' : '';
      const ready=S.ui.pick.length===size && (!g.settings.excalibur||!!S.ui.excalibur);
      h='<h2>'+ic('crown')+' '+t('leaderPick', size)+'</h2><div class="hint">'+t('leaderHint')+'</div>'+selectedTeamReview(S.ui.pick,size)+sword
        +'<button class="btn pri big" style="width:100%" data-a="propose" '+(!ready||busy?'disabled':'')+'>'+(acted(me)?t('resubmit'):t('submitTeam'))+'</button>';
    }
    else { const draft=publicDraftTeam(g); h='<h2>'+ic('clock')+' '+t('waitLeader', esc(nickOf(L)), size)+'</h2><div class="hint">'+t('discuss')+'</div>'+(draft.length?'<div class="muted tiny" style="margin-bottom:5px">'+t('leaderDraft')+' · '+draft.length+'/'+size+'</div>'+chips(draft):''); }
  } else if(g.phase==='vote'){
    h='<h2>'+ic('vote')+' '+t('voteTitle')+'</h2>'+chips(g.team)
      +'<div class="row"><button class="btn good big '+(mine===true?'sel':'')+'" data-vote="1" aria-pressed="'+(mine===true)+'" '+(busy?'disabled':'')+'>'+ic('check')+t('approve')+(mine===true?'<span class="vote-selected">'+t('selectedLabel')+'</span>':'')+'</button>'
      +'<button class="btn evil big '+(mine===false?'sel':'')+'" data-vote="0" aria-pressed="'+(mine===false)+'" '+(busy?'disabled':'')+'>'+ic('x')+t('reject')+(mine===false?'<span class="vote-selected">'+t('selectedLabel')+'</span>':'')+'</button></div>'
      +'<div class="vote-feedback hint" role="status" aria-live="polite" style="margin:10px 0 0">'+(busy?t('voteSubmitting'):typeof mine==='boolean'?t('voteSelection',t(mine?'approve':'reject')):t('pleaseVote'))+' · '+t('votedCount', g.order.filter(acted).length, g.order.length)+'</div>'+prog(g.order);
  } else if(g.phase==='quest'){
    h='<h2>'+ic('sword')+' '+t('questTitle')+'</h2>'+chips(g.team);
    if(g.team.includes(me)){
      const allegiance=(S.mine&&S.mine.allegiance)||side(S.mine&&S.mine.role), choices=S.mine?questChoices(S.mine.role,g.q,allegiance,g.settings):['S'];
      const note=choices.length===1?(choices[0]==='F'?t('mustFail'):t(allegiance==='evil'?'cannotFail':'goodOnly')):t('evilChoice');
      if(S.ui.questConfirm){
        const qv=S.ui.questConfirm;
        h+='<div class="quest-confirm '+(qv==='S'?'success':'fail')+'"><div><small>'+t('confirmQuest')+'</small><strong>'+(qv==='S'?'✓ '+t('success'):'✗ '+t('fail'))+'</strong><p>'+t('confirmQuestHint')+'</p></div><button class="btn '+(qv==='S'?'good':'evil')+' big" data-a="questSubmit" '+(busy?'disabled':'')+'>'+(qv==='S'?t('confirmSuccess'):t('confirmFail'))+'</button><button class="btn ghost" data-a="questCancel">'+t('changeChoice')+'</button></div>';
      } else {
        h+='<div class="quest-choices"><button class="btn quest-choice success '+(mine==='S'?'sel':'')+'" data-quest="S" '+(!choices.includes('S')||busy?'disabled':'')+'>'+ic('check')+t('success')+'</button>'
          +'<button class="btn quest-choice fail '+(mine==='F'?'sel':'')+'" data-quest="F" '+(!choices.includes('F')||busy?'disabled':'')+'>'+ic('x')+t('fail')+'</button></div>';
      }
      h+='<div class="hint" style="margin:10px 0 0">'+note+(acted(me)?' '+t('youPlayed'):'')+(g.quests[g.q].two?' '+t('twoNote'):'')+'</div>';
    } else h+='<div class="hint">'+t('waitTeam')+' '+t('played', g.team.filter(acted).length, g.team.length)+(g.quests[g.q].two?' · '+t('twoNote'):'')+'</div>';
    h+=prog(g.team);
  } else if(g.phase==='excalibur'){
    if(g.excaliburHolder===me) h='<h2>'+ic('sword')+' '+t('excaliburUse')+'</h2>'+chips(g.team.filter(u=>u!==me))+'<button class="btn pri big" style="width:100%" data-a="single" '+(S.ui.pick.length!==1||busy?'disabled':'')+'>'+ic('sword')+' '+(S.ui.pick[0]?esc(nickOf(S.ui.pick[0])):'…')+'</button><button class="btn ghost" style="width:100%;margin-top:8px" data-a="excaliburSkip" '+(busy?'disabled':'')+'>'+t('excaliburSkip')+'</button>';
    else h='<h2>'+ic('sword')+' '+t('ph_excalibur')+'</h2><div class="hint">'+t('excaliburWait',esc(nickOf(g.excaliburHolder)))+'</div>';
  } else if(g.phase==='lady'){
    const ho=g.lady.holder;
    if(ho===me) h='<h2>'+ic('droplet')+' '+t('ladyTitle')+'</h2><div class="hint">'+t('ladyHint')+'</div><button class="btn pri big" style="width:100%" data-a="single" '+(S.ui.pick.length!==1||busy?'disabled':'')+'>'+t('inspect', S.ui.pick[0]?esc(nickOf(S.ui.pick[0])):'…')+'</button>';
    else h='<h2>'+ic('droplet')+' '+t('ph_lady')+'</h2><div class="hint" style="margin-bottom:0">'+t('ladyWait', esc(nickOf(ho)))+'</div>';
  } else if(g.phase==='loyalty'){
    if(g.loyalty&&g.loyalty.target===me) h='<h2>'+ic('shield')+' '+t('loyaltyChoose')+'</h2><div class="hint">'+t('loyaltyHint')+'</div><div class="row"><button class="btn good big" data-loyalty="good" '+(busy?'disabled':'')+'>'+t('showGood')+'</button><button class="btn evil big" data-loyalty="evil" '+(busy?'disabled':'')+'>'+t('showEvil')+'</button></div>';
    else h='<h2>'+ic('shield')+' '+t('ph_loyalty')+'</h2><div class="hint">'+t('loyaltyWait')+'</div>';
  } else if(g.phase==='recruit'){
    if(S.mine&&S.mine.role==='assassin') h='<h2>'+ic('sword')+' '+t('recruitTitle')+'</h2><div class="hint">'+t('recruitMe')+'</div><button class="btn evil big" style="width:100%" data-a="single" '+(S.ui.pick.length!==1||busy?'disabled':'')+'>'+t('inspect',S.ui.pick[0]?esc(nickOf(S.ui.pick[0])):'…')+'</button>';
    else h='<h2>'+ic('sword')+' '+t('recruitTitle')+'</h2><div class="hint">'+t('recruitWait')+'</div>';
  } else if(g.phase==='assassin'){
    if((g.recruitedPlayer&&g.recruitedPlayer===me)||(!g.recruitedPlayer&&S.mine&&S.mine.role==='assassin')) h='<h2>'+ic('sword')+' '+t('assTitle')+'</h2><div class="hint">'+t('assMe')+'</div><button class="btn evil big" style="width:100%" data-a="single" '+(S.ui.pick.length!==1||busy?'disabled':'')+'>'+t('stab', S.ui.pick[0]?esc(nickOf(S.ui.pick[0])):'…')+'</button>';
    else h='<h2>'+ic('sword')+' '+t('assTitle')+'</h2><div class="hint" style="margin-bottom:0">'+t('assWait')+(S.mine&&((S.mine.allegiance||side(S.mine.role))==='evil')?' '+t('assEvil'):'')+'</div>';
  }
  return '<div class="glass card act">'+h+actionStatus(g)+'</div>';
}
function roleBar(){
  const g=S.game, me=ME.pid; if(!g.order.includes(me)) return '';
  const s=S.mine ? (S.mine.allegiance||side(S.mine.role)) : '';
  // Who am I at this table: portrait, seat number and name, with rename one tap away.
  const id='<button class="me-id" data-a="editName" aria-label="'+t('editName')+'"><i class="player-avatar" style="'+avStyle(me)+'"></i><span class="me-text"><small>'+t('youAre')+' · '+t('seatNo', g.order.indexOf(me)+1)+'</small><b><span>'+esc(nickOf(me))+'</span><em>'+ic('pencil')+'</em></b></span></button>';
  const role=!S.mine ? '<span class="me-role muted small">'+t('loadingRole')+'</span>'
    : '<button class="me-role '+(S.peek?s:'')+'" data-a="peek" aria-expanded="'+!!S.peek+'"><span class="rb-ic">'+(S.peek?roleArt(S.mine.role,'rolebar-art'):'<span class="card-seal"><img src="assets/brand-mark.svg" alt="" width="32" height="32"></span>')+'</span><span class="me-text"><small>'+t('myRole')+'</small><b>'+(S.peek?rName(S.mine.role):t('tapReveal'))+'</b></span></button>';
  return '<div class="glass card mebar">'+id+role+'</div>'
    +(S.peek&&S.mine?'<button class="sheet-backdrop" data-a="peek" aria-label="'+t('hideRole')+'"></button><div class="glass card know-card sheet"><div class="sheet-head"><b class="'+(s==='good'?'res-s':'res-f')+'">'+roleIcon(S.mine.role)+' '+rName(S.mine.role)+' · '+t(s)+'</b><button class="btn ghost sm sheet-close" data-a="peek">'+ic('eyeoff')+t('hideRole')+'</button></div><div class="identity-detail"><div class="identity-portrait '+s+'">'+roleArt(S.mine.role,'identity-art')+'<span>'+t(s)+'</span></div><div class="identity-knowledge">'+knowBlock()+'</div></div></div>':'');
}
function hostToolsPanel(g){
  if(!isHost() || g.status!=='play') return '';
  const candidates=g.order.filter(p=>p!==ME.pid&&Net.isOnline(p));
  const options='<option value="">'+t('transferTo')+'</option>'+candidates.map(p=>'<option value="'+esc(p)+'" '+(S.ui.hostSuccessor===p?'selected':'')+'>'+esc(nickOf(p))+'</option>').join('');
  if(S.ui.confirmHostTransfer){
    const name=nickOf(S.ui.hostSuccessor);
    return '<section class="glass card host-tools confirm"><h3>'+ic('crown')+' '+t('hostTools')+'</h3><p>'+t('transferWarning')+'</p><div class="row"><button class="btn evil" data-a="transferHost" '+(S.ui.busy?'disabled':'')+'>'+t('confirmTransfer',esc(name))+'</button><button class="btn ghost" data-a="cancelHostTransfer">'+t('close')+'</button></div></section>';
  }
  return '<section class="glass card host-tools"><h3>'+ic('crown')+' '+t('hostTools')+'</h3><div class="row"><select class="host-select" id="hostSuccessor" aria-label="'+t('transferTo')+'">'+options+'</select><button class="btn" data-a="prepareHostTransfer" '+(!candidates.length?'disabled':'')+'>'+ic('swap')+t('transferHost')+'</button></div></section>';
}
function knowBlock(){
  const m=S.mine; let h='<div class="small" style="margin-bottom:8px">'+rDesc(m.role)+'</div>';
  const person=(u,cls,label)=>'<span class="known-person '+cls+'"><span class="known-avatar player-avatar" style="'+avStyle(u)+'"></span><span><b>'+esc(nickOf(u))+'</b>'+(label?'<small>'+label+'</small>':'')+'</span></span>';
  if(m.allegiance&&m.allegiance!==side(m.role)) h+='<div class="know"><b class="'+(m.allegiance==='good'?'res-s':'res-f')+'">'+t('currentLoyalty',t(m.allegiance))+'</b></div>';
  if(m.see) h+='<div class="know"><div class="kl">'+t('youSee', t(m.see))+'</div><div class="known-people">'+((m.sees||[]).length?m.sees.map(u=>person(u,'clue',t(m.see))).join(''):t('none'))+'</div></div>';
  S.ladyMine.forEach(x=>{ h+='<div class="know"><div class="kl">'+ic('droplet')+' '+t('ladyLog')+'</div>'+person(x.target,x.side,t(x.side))+'</div>'; });
  S.checksMine.filter(x=>x.source!=='lady').forEach(x=>{ h+='<div class="know"><div class="kl">'+ic('droplet')+' '+t('inspected',esc(nickOf(x.target)),t(x.side))+'</div>'+person(x.target,x.side,t(x.side))+'</div>'; });
  return h;
}
function historyBlock(g){
  const rounds=g.rounds||[];
  if(!rounds.length) return '<div class="glass card log"><h3>'+t('history')+'</h3><div class="history-empty">'+ic('list')+'<b>'+t('noHistory')+'</b><p>'+extra('historyHelp')+'</p></div></div>';
  const rows=rounds.slice().reverse().map(r=>{
    const qr=g.quests[r.q];
    const res = r.ok ? (qr && qr.r ? (qr.r==='S'?'<span class="res-s">✓ '+t('qSuccess')+'</span>':'<span class="res-f">✗ '+t('fails',qr.fails)+'</span>') : t('rOn')) : '<span class="res-r">'+t('rRejected')+'</span>';
    const yes=g.order.filter(u=>r.votes[u]), no=g.order.filter(u=>r.votes[u]===false);
    return '<tr><td><b>Q'+(r.q+1)+'</b><br><span class="muted tiny">'+t('try', r.att)+'</span></td><td>'+ic('crown')+' '+esc(nickOf(r.leader))+'<br><span class="muted">'+r.team.map(u=>esc(nickOf(u))).join(', ')+'</span><br>'
      +yes.map(u=>'<span class="vchip y">✓'+esc(nickOf(u))+'</span>').join('')+no.map(u=>'<span class="vchip n">✗'+esc(nickOf(u))+'</span>').join('')+'</td><td>'+res+'</td></tr>';
  }).join('');
  return '<div class="glass card log"><h3>'+t('history')+'</h3><table><tr><th>'+t('round')+'</th><th>'+t('leaderTeam')+'</th><th>'+t('result')+'</th></tr>'+rows+'</table></div>';
}

/* ================= Overlays ================= */
function renderOverlay(){
  const el=$('#ov'); if(!el) return;
  if(S.ov.length && !(S.game && S.game.order && S.game.gid)) S.ov=[]; // game was reset to the lobby
  const o=S.ov[0];
  if(!o){ if(el.innerHTML) el.innerHTML=''; el._k=null; return; }
  const key=JSON.stringify([o.type, o.flipped, o.qi, o.r && o.r.att, o.r && o.r.q, LANG, S.mine && S.mine.role]);
  if(el._k===key) return; // keep animations from restarting
  el._k=key;
  const g=S.game; let h='';
  if(o.type==='night'){
    const m=S.mine; if(!m){ S.ov.shift(); return renderOverlay(); }
    const s=m.allegiance||side(m.role);
    h='<h2>'+ic('moon')+' '+t('nightTitle')+'</h2><p class="lead">'+t('nightLead')+'</p>'
      +'<button type="button" class="rolecard '+(o.flipped?'flip':'')+'" data-a="flipcard" aria-label="'+(o.flipped?rName(m.role):t('flip'))+'"><span class="in"><span class="face back"><span class="card-orbit" aria-hidden="true"></span><span class="card-seal large"><img src="assets/brand-mark.svg" alt="" width="72" height="72"></span><span class="card-wordmark">AVALON</span><span class="card-secret">'+ic('lock')+extra('secretIdentity')+'</span></span>'
      +'<span class="face front '+s+'">'+roleArt(m.role,'rolecard-art')+'<span class="rolecard-caption"><span class="rs">'+ic(s==='good'?'shield':'sword')+t(s)+'</span><span class="rn">'+rName(m.role)+'</span></span></span></span></button>'
      +(o.flipped?knowBlock()+'<button class="btn pri big" style="width:100%" data-a="ovnext">'+t('gotIt')+'</button>':'<button class="btn pri big" style="width:100%" data-a="flipcard">'+t('flip')+'</button>');
  } else if(o.type==='vote'){
    const r=o.r, yes=Object.values(r.votes).filter(Boolean).length, no=Object.keys(r.votes).length-yes;
    h='<h2>'+ic('vote')+' '+t('voteReveal')+'</h2><p class="lead">'+t('questN', r.q+1)+' · '+t('try', r.att)+'</p>'
      +'<div class="bigres '+(r.ok?'good':'evil')+'">'+(r.ok?t('passed'):t('rejected'))+'</div><p class="muted">'+t('yesNo', yes, no)+'</p>'
      +'<div class="vlist">'+g.order.map((u,i)=>'<div style="animation-delay:'+(i*60)+'ms"><span>'+esc(nickOf(u))+'</span><span class="vchip '+(r.votes[u]?'y':'n')+'">'+(r.votes[u]?'✓ '+t('approve'):'✗ '+t('reject'))+'</span></div>').join('')+'</div>'
      +'<button class="btn pri big" style="width:100%" data-a="ovnext">OK</button>';
  } else if(o.type==='quest'){
    const q=g.quests[o.qi];
    // The host only ever publishes how many Fail cards were played, never who played what.
    // Show them in one fixed order (Success first, Fail last) on every screen, so the row can
    // neither line up with the team list by chance nor differ between players at the table.
    const cards=Array.from({length:q.size},(c,i)=>i<q.size-q.fails?'S':'F');
    h='<h2>'+ic('sword')+' '+t('questReveal', o.qi+1)+'</h2><p class="lead">'+q.team.map(u=>esc(nickOf(u))).join(' · ')+'</p><p class="muted tiny reveal-note">'+t('shuffledNote')+'</p>'
      +'<div class="cards">'+cards.map((c,i)=>'<div class="qcard" style="animation-delay:'+(400+i*450)+'ms"><div class="f b"></div><div class="f '+(c==='S'?'s':'x')+'">'+(c==='S'?'✓':'✗')+'</div></div>').join('')+'</div>'
      +'<div class="bigres '+(q.r==='S'?'good':'evil')+'" style="animation-delay:'+(600+q.size*450)+'ms">'+(q.r==='S'?t('qSuccess'):t('qFail'))+'</div>'
      +'<p class="muted">'+t('fails', q.fails)+(q.two?' · '+t('needTwo'):'')+'</p><button class="btn pri big" style="width:100%" data-a="ovnext">OK</button>';
  } else if(o.type==='lady'){
    const x=o.x; h='<h2>'+ic('droplet')+' '+t('ph_lady')+'</h2><div class="bigres '+x.side+'" style="margin:18px 0">'+esc(nickOf(x.target))+' · '+t(x.side)+'</div><button class="btn pri big" style="width:100%" data-a="ovnext">OK</button>';
  } else if(o.type==='end'){
    const roles=g.roles||{};
    h=(g.assassinPick?'<h2>'+ic('sword')+' '+t('assResult')+'</h2>'+assassinationResult(g):'<h2>'+(g.winner==='good'?ic('shield'):ic('sword'))+'</h2>')+'<div class="bigres '+g.winner+'">'+(g.winner==='good'?t('goodWin'):t('evilWin'))+'</div><p class="lead" style="margin-top:8px">'+t(g.reason)+'</p>'
      +'<div class="endroles">'+g.order.map(u=>'<div class="'+((g.allegiances&&g.allegiances[u])||side(roles[u]))+'"><span>'+esc(nickOf(u))+(u===ME.pid?' ('+t('you')+')':'')+'</span><b>'+roleIcon(roles[u])+' '+rName(roles[u])+'</b></div>').join('')+'</div>'
      +'<div class="row">'+(isHost()?'<button class="btn pri big" data-a="again">'+ic('refresh')+t('again')+'</button>':'')+'<button class="btn big" data-a="ovnext">'+t('close')+'</button></div>';
  }
  el.innerHTML='<div class="ov" role="dialog" aria-modal="true" aria-label="'+(o.type==='night'?t('yourRole'):t('result'))+'"><div class="glass ovbox '+(o.type==='night'?'night-sheet':'')+'">'+h+'</div></div>';
  requestAnimationFrame(()=>{ const primary=o.type==='night'&&!o.flipped?el.querySelector?.('.rolecard'):(el.querySelector?.('[data-a="ovnext"]')||el.querySelector?.('button')); primary?.focus?.(); });
}

/* ================= Events ================= */
document.addEventListener('input', e=>{
  if(e.target.id==='nick') S.ui.nick=e.target.value;
  if(e.target.id==='joinCode') S.ui.joinCode=e.target.value.toUpperCase();
  if(e.target.id==='renameInput' && S.ui.rename) S.ui.rename.draft=e.target.value;
  if(e.target.matches&&e.target.matches('.note-text[data-note-player]')) savePrivateNote(e.target.dataset.notePlayer,'text',e.target.value);
});
document.addEventListener('change', e=>{
  if(e.target.matches('[data-site-language]')){ LANG=validLanguage(e.target.value); LS.set('lang',LANG); const url=new URL(location.pathname+location.search,location.origin);url.searchParams.set('lang',LANG);history.replaceState(null,'',url.pathname+url.search+location.hash); document.documentElement.lang=languageTag(LANG); return render(); }
  if(e.target.id==='siteLanguage'){ LANG=validLanguage(e.target.value); LS.set('lang',LANG); const url=new URL(location.pathname+location.search,location.origin);url.searchParams.set('lang',LANG);history.replaceState(null,'',url.pathname+url.search+location.hash); document.documentElement.lang=languageTag(LANG); return render(); }
  if(e.target.matches&&e.target.matches('.note-select[data-note-player]')){ savePrivateNote(e.target.dataset.notePlayer,'mark',e.target.value); render(); }
  if(e.target.id==='hostSuccessor'){ S.ui.hostSuccessor=e.target.value; S.ui.confirmHostTransfer=false; render(); }
});
document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && S.ui.rename) return closeRename();
  if(e.key==='Enter' && e.target.id==='renameInput') return saveRename();
  if(e.key==='Escape' && S.ui.confirm){ S.ui.confirm=null; renderConfirmModal(); return; }
  if(e.key==='Escape' && S.ui.qrOpen){ S.ui.qrOpen=false; renderQRModal(); return; }
  if(e.key==='Escape' && S.ui.infoOpen){ S.ui.infoOpen=null; renderInfoModal(); return; }
  if(e.key==='Escape' && S.ui.rulesOpen){ S.ui.rulesOpen=false; renderRulesModal(); return; }
  if(e.key==='Tab' && (S.ui.confirm || S.ui.qrOpen || S.ui.infoOpen || S.ui.rulesOpen || S.ov.length)){
    const root=S.ui.confirm?$('#confirmModal'):S.ui.qrOpen?$('#qrModal'):S.ui.infoOpen?$('#infoModal'):S.ui.rulesOpen?$('#rulesModal'):$('#ov');
    const items=root&&[...root.querySelectorAll('button,a[href],[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled);
    if(items&&items.length){ const first=items[0], last=items[items.length-1]; if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); } }
  }
  if(e.key!=='Enter') return;
  if(e.target.id==='joinCode') joinRoom();
  else if(e.target.id==='nick'){ if(!S.code) createRoom(); else if(S.seats[ME.pid]) renameSeat(); else takeSeat(); }
});
document.addEventListener('toggle', e=>{
  if(e.target.matches && e.target.matches('details.rules')) S.ui.rulesInlineOpen=e.target.open;
  if(e.target.matches && e.target.matches('details.settings-advanced')) S.ui.settingsOpen=e.target.open;
}, true);
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-a],[data-pick],[data-vote],[data-quest],[data-kick],[data-set],[data-preset],[data-excalibur],[data-loyalty],[data-reaction],[data-tool]'); if(!b) return;
  if(b.dataset.tool){ S.ui.tool = S.ui.tool===b.dataset.tool ? null : b.dataset.tool; S.ui.notesOpen = S.ui.tool==='notes'; return render(); }
  if(b.dataset.reaction) return sendReaction(b.dataset.reaction);
  if(b.dataset.kick) return askConfirm(t('confirmKick',nickOf(b.dataset.kick)),'kick',b.dataset.kick,[b.dataset.kick]);
  if(b.dataset.set) return toggleSetting(b.dataset.set);
  if(b.dataset.preset) return applyPreset(b.dataset.preset);
  if(b.dataset.excalibur){ S.ui.excalibur=b.dataset.excalibur; return render(); }
  if(b.dataset.loyalty) return submit(b.dataset.loyalty);
  if(b.dataset.pick){
    const pm=pickMode(S.game), u=b.dataset.pick; if(!pm) return;
    if(pm.max===1) S.ui.pick = S.ui.pick[0]===u ? [] : [u];
    else if(S.ui.pick.includes(u)) S.ui.pick=S.ui.pick.filter(x=>x!==u);
    else if(S.ui.pick.length<pm.max) S.ui.pick=S.ui.pick.concat([u]);
    else toast(t('toMany', pm.max));
    if(S.ui.excalibur && !S.ui.pick.includes(S.ui.excalibur)) S.ui.excalibur=null;
    if(S.game.phase==='propose' && S.game.order[S.game.leader]===ME.pid) Net.draftTeam(ME.pid,S.game.step,S.ui.pick.slice());
    return render();
  }
  if(b.dataset.vote) return submit(b.dataset.vote==='1');
  if(b.dataset.quest){ S.ui.questConfirm=b.dataset.quest; return render(); }
  switch(b.dataset.a){
    case 'home': return S.code ? goHome(false) : render();
    case 'lang': LANG = LANG==='zh'?'en':'zh'; LS.set('lang', LANG); document.documentElement.lang = LANG==='zh'?'zh-CN':'en'; return render();
    case 'rules': S.ui.guideTab=S.game&&S.game.status==='lobby'?'lineup':'rules'; S.ui.rulesOpen=true; return renderRulesModal();
    case 'rulesLineup': S.ui.guideTab='lineup'; S.ui.rulesOpen=true; return renderRulesModal();
    case 'rulesFull': S.ui.guideTab='rules'; S.ui.rulesOpen=true; return renderRulesModal();
    case 'closeRules': S.ui.rulesOpen=false; return renderRulesModal();
    case 'info': S.ui.infoOpen=b.dataset.info; return renderInfoModal();
    case 'closeInfo': S.ui.infoOpen=null; return renderInfoModal();
    case 'qr': S.ui.qrOpen=true; return renderQRModal();
    case 'closeQR': S.ui.qrOpen=false; return renderQRModal();
    case 'confirmCancel': S.ui.confirm=null; return renderConfirmModal();
    case 'confirmRun': return runConfirmed();
    case 'privacyCover': S.ui.privacyCover=!S.ui.privacyCover; if(S.ui.privacyCover) S.peek=false; return render();
    case 'questSubmit': { const v=S.ui.questConfirm; S.ui.questConfirm=null; return v?submit(v):render(); }
    case 'questCancel': S.ui.questConfirm=null; return render();
    case 'prepareHostTransfer': if(!S.ui.hostSuccessor) return toast(t('chooseHost')); S.ui.confirmHostTransfer=true; return render();
    case 'cancelHostTransfer': S.ui.confirmHostTransfer=false; return render();
    case 'transferHost': return transferHost();
    case 'toggleNotes': S.ui.notesOpen=!S.ui.notesOpen; S.ui.tool=S.ui.notesOpen?'notes':null; return render();
    case 'editName': return openRename();
    case 'renameCancel': return closeRename();
    case 'renameSave': return saveRename();
    case 'clearNotes': { const key=notesStorageKey(); if(key) LS.del(key); render(); return toast(t('notesCleared')); }
    case 'focusCreate': { const field=$('#nick'); if(field){ field.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(()=>field.focus({preventScroll:true}),350); } return; }
    case 'create': return createRoom();
    case 'join': return joinRoom();
    case 'resume': { const l=LS.get('last'); if(l) enterRoom(l); return; }
    case 'seat': return takeSeat();
    case 'rename': return renameSeat();
    case 'leave': return S.game&&S.game.status!=='lobby' ? askConfirm(t('confirmLeave'),'leave') : leaveRoom();
    case 'start': return startGame();
    case 'again': return askConfirm(t('confirmAgain'),'again');
    case 'propose': {
      const team=S.ui.pick.slice(), value=S.game.settings.excalibur?{team,excalibur:S.ui.excalibur}:team;
      return askConfirm(t('confirmTeam',team.map(nickOf).join(LANG==='zh'?'、':', ')),'propose',value,team,t('confirmTeamAction'));
    }
    case 'single': {
      const target=S.ui.pick[0]; if(!target) return;
      if(S.game.phase==='assassin') return askConfirm(t('confirmAssassin',nickOf(target)),'submit',target,[target]);
      if(S.game.phase==='excalibur') return askConfirm(t('confirmExcalibur',nickOf(target)),'submit',target,[target]);
      return submit(target);
    }
    case 'excaliburSkip': return submit(null);
    case 'peek': S.peek=!S.peek; return render();
    case 'flipcard': if(S.ov[0] && S.ov[0].type==='night'){ S.ov[0].flipped=true; renderOverlay(); } return;
    case 'ovnext': S.ov.shift(); return renderOverlay();
    case 'showend': S.ov.push({type:'end'}); return renderOverlay();
    case 'copy': {
      const link=location.origin+location.pathname+'#'+S.game.code;
      const ok=()=>toast(t('copied')), fail=()=>toast(link);
      try{ navigator.clipboard.writeText(link).then(ok, fail); }catch(err){ fail(); }
      return;
    }
    case 'share': {
      const link=location.origin+location.pathname+'#'+S.game.code;
      navigator.share({title:'Avalon '+S.game.code, text:'Avalon · '+S.game.code, url:link}).catch(()=>{});
      return;
    }
  }
});
window.addEventListener('hashchange', ()=>{
  const h=(location.hash||'').slice(1).toUpperCase();
  if(/^[A-Z0-9]{4,8}$/.test(h) && h!==S.code) enterRoom(h);
});

S.bootAt=Date.now();
if('serviceWorker' in navigator && location.protocol==='https:') window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(e=>console.warn('service worker',e)));
boot();
