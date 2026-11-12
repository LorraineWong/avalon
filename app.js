/* Avalon Online — static client. Realtime via Firebase Realtime Database (anonymous auth).
 * Architecture:
 *  - Every player signs in anonymously (Firebase uid) and keeps an ECDH key pair in localStorage.
 *  - Database security rules: only the host writes the game state and secrets; each player writes only their own seat.
 *  - The host's browser runs the game engine; actions are encrypted to the host and
 *    roles are encrypted to each player, so nobody can read others' roles from the database.
 */
'use strict';

/* ================= i18n ================= */
const I18N = {
  zh: {
    sub:'阿瓦隆 · 在线版', tagline:'抵抗组织：阿瓦隆', feat1:'5–10 人', feat2:'无需注册', feat3:'手机电脑都能玩', feat4:'身份加密，无法偷看',
    nick:'你的昵称', nickPh:'比如：小明', create:'创建房间', joinTitle:'加入房间', codePh:'房间号', join:'加入',
    joinHint:'输入朋友发来的房间号，或直接打开邀请链接。', resume:'你上次在房间 {0}', resumeBtn:'回到房间',
    needNick:'请先填写昵称', badCode:'请输入正确的房间号', notFound:'房间 {0} 不存在或已解散',
    connecting:'连接服务器中…', online:'已连接', offline:'连接断开，重连中…', noNet:'无法连接游戏服务器，请检查网络后刷新。',
    entering:'正在进入房间 {0}…', home:'首页', roomCode:'房间号', copyLink:'复制邀请链接', copied:'邀请链接已复制',
    share:'分享', inviteHint:'把链接发给朋友，打开就能加入。', players:'玩家', host:'房主', you:'你', seat:'入座', rename:'改名',
    leave:'离开房间', start:'开始游戏', dealing:'发牌中…', waitHost:'等待房主开始游戏…', full:'房间已满（最多 10 人）',
    renamed:'昵称已更新', roleSettings:'角色配置', hostOnly:'仅房主可修改', emptySeat:'等待加入',
    needPlayers:'需要 5–10 名玩家（当前 {0} 人）', tooManyEvil:'{0} 人局只有 {1} 个坏人，勾选的坏人角色太多了', tooManyGood:'好人特殊角色太多了',
    comp:'{0} 人局：{1} 好人 · {2} 坏人', compPrev:'按 {0} 人预览：{1} 好人 · {2} 坏人',
    optMerlin:'梅林 + 刺客', optMerlinD:'经典核心', optLady:'湖中仙女', optLadyD:'7 人及以上生效',
    ph_propose:'组队', ph_vote:'投票', ph_quest:'出任务', ph_lady:'湖中仙女', ph_assassin:'刺杀梅林', ph_end:'游戏结束',
    questN:'任务 {0}', attempt:'第 {0}/5 次组队', needTwo:'需 2 张失败', fails:'{0} 张失败',
    leaderPick:'你是队长：选 {0} 名队员', leaderHint:'点击圆桌上的玩家选择，可以选自己。', submitTeam:'提交队伍', resubmit:'重新提交',
    waitLeader:'{0} 正在挑选 {1} 名队员', discuss:'趁现在讨论一下吧。', voteTitle:'同意这支队伍出发吗？',
    approve:'赞成', reject:'反对', voted:'已投票，所有人投完前可以修改。', pleaseVote:'请投票，全部投完后统一公开。', votedCount:'已投 {0}/{1}',
    questTitle:'任务进行中', success:'成功', fail:'失败', goodOnly:'好人只能出“成功”。', evilChoice:'你是坏人，可以选择让任务失败。',
    played:'已出牌 {0}/{1}', youPlayed:'你已出牌。', waitTeam:'等待队员出牌…', twoNote:'本任务需要 2 张失败才算失败。',
    ladyTitle:'湖中仙女：查验一名玩家', ladyHint:'点击圆桌上的玩家（持有过仙女的人不能选）。', inspect:'查验 {0}', ladyWait:'{0} 正在使用湖中仙女…',
    assTitle:'好人完成了 3 个任务！', assMe:'你是刺客：和队友商量后，选出你认为的梅林。', stab:'刺杀 {0}', assWait:'刺客正在寻找梅林…', assEvil:'坏人可以公开讨论刺谁。',
    spectator:'你正在观战', myRole:'我的身份', tapReveal:'点击查看身份', yourRole:'你的身份', youSee:'你看到的{0}', none:'无',
    inspected:'你查验了 {0}：{1}', good:'好人', evil:'坏人', gotIt:'我记住了', loadingRole:'正在读取身份…',
    see_evil:'坏人', see_mp:'梅林或莫甘娜', see_allies:'坏人同伴', nightTitle:'夜晚降临', nightLead:'悄悄看一下你的身份，别让旁边的人看到。', flip:'翻开身份牌',
    voteReveal:'投票结果', passed:'队伍通过，出发！', rejected:'队伍被否决', yesNo:'{0} 赞成 · {1} 反对',
    questReveal:'任务 {0} 结果', qSuccess:'任务成功', qFail:'任务失败',
    goodWin:'好人阵营获胜', evilWin:'坏人阵营获胜', r5:'连续 5 次组队被否决', r3f:'3 个任务失败', r3s:'3 个任务成功',
    rhit:'刺客刺中了梅林，坏人翻盘！', rmiss:'刺客没有找到梅林！', stabbedX:'刺客刺杀了 {0}',
    again:'再来一局', waitAgain:'等待房主开新局', backHome:'回首页', allRoles:'身份揭晓',
    history:'对局记录', noHistory:'还没有投票记录。', round:'轮次', leaderTeam:'队长 / 队伍', result:'结果',
    rRejected:'否决', rOn:'出发中', try:'第 {0} 次',
    hostOffline:'房主 {0} 似乎掉线了。游戏由房主的设备推进，请房主重新打开链接，游戏会从当前进度继续。',
    rules:'规则速查', close:'关闭', ladyLog:'湖中仙女', kicked:'已移出', toMany:'最多选 {0} 人，先取消一个',
    rulesP1:'好人要完成 3 个任务，坏人要让 3 个任务失败。每轮由队长挑选队员，所有人公开投票，<b>超过半数</b>赞成才能出发，否则队长顺延到下一位。同一个任务<b>连续 5 次</b>组队被否决，坏人直接获胜。',
    rulesP2:'出任务时队员秘密出牌：好人只能出“成功”，坏人可以选择。7 人及以上时，<b>第 4 个任务需要 2 张失败</b>才算失败。好人完成 3 个任务后，刺客还有一次刺杀梅林的机会，刺中则坏人翻盘。',
    rulesP3:'湖中仙女（可选，7 人以上）：第 2、3、4 个任务结束后，持有者秘密查验一名玩家的阵营，然后把仙女交给对方。持有过仙女的人不能再被查验。',
    rulesP4:'人数配置：5 人 3 好 2 坏 · 6 人 4 好 2 坏 · 7 人 4 好 3 坏 · 8 人 5 好 3 坏 · 9 人 6 好 3 坏 · 10 人 6 好 4 坏',
    writeFail:'保存失败，请检查网络后重试', footer:'Avalon Online · 非官方粉丝作品，基于桌游《抵抗组织：阿瓦隆》', tooLong:'昵称最多 12 个字',
  },
  en: {
    sub:'Avalon · Online', tagline:'The Resistance: Avalon', feat1:'5–10 players', feat2:'No sign-up', feat3:'Phone & desktop', feat4:'Encrypted roles',
    nick:'Your name', nickPh:'e.g. Alex', create:'Create room', joinTitle:'Join a room', codePh:'Room code', join:'Join',
    joinHint:'Enter the code a friend sent you, or just open their invite link.', resume:'You were in room {0}', resumeBtn:'Rejoin',
    needNick:'Please enter your name first', badCode:'Please enter a valid room code', notFound:'Room {0} does not exist or was closed',
    connecting:'Connecting…', online:'Online', offline:'Connection lost, reconnecting…', noNet:'Cannot reach the game server. Check your network and refresh.',
    entering:'Joining room {0}…', home:'Home', roomCode:'Room code', copyLink:'Copy invite link', copied:'Invite link copied',
    share:'Share', inviteHint:'Send the link to friends — opening it joins the room.', players:'Players', host:'Host', you:'You', seat:'Take a seat', rename:'Rename',
    leave:'Leave room', start:'Start game', dealing:'Dealing…', waitHost:'Waiting for the host to start…', full:'Room is full (max 10)',
    renamed:'Name updated', roleSettings:'Roles', hostOnly:'Host only', emptySeat:'Open seat',
    needPlayers:'Need 5–10 players (now {0})', tooManyEvil:'A {0}-player game has only {1} evil players — too many evil roles selected', tooManyGood:'Too many special good roles',
    comp:'{0} players: {1} good · {2} evil', compPrev:'Preview for {0}: {1} good · {2} evil',
    optMerlin:'Merlin + Assassin', optMerlinD:'The classic core', optLady:'Lady of the Lake', optLadyD:'7+ players',
    ph_propose:'Team building', ph_vote:'Voting', ph_quest:'Quest', ph_lady:'Lady of the Lake', ph_assassin:'Assassination', ph_end:'Game over',
    questN:'Quest {0}', attempt:'Proposal {0}/5', needTwo:'Needs 2 fails', fails:'{0} fail(s)',
    leaderPick:'You lead: pick {0} players', leaderHint:'Tap players around the table. You may pick yourself.', submitTeam:'Propose team', resubmit:'Propose again',
    waitLeader:'{0} is picking {1} players', discuss:'Discuss while you wait.', voteTitle:'Approve this team?',
    approve:'Approve', reject:'Reject', voted:'Vote cast — you can change it until everyone has voted.', pleaseVote:'Cast your vote. All votes are revealed together.', votedCount:'Voted {0}/{1}',
    questTitle:'Quest in progress', success:'Success', fail:'Fail', goodOnly:'Good players can only play Success.', evilChoice:'You are evil — you may sabotage.',
    played:'Played {0}/{1}', youPlayed:'Card played.', waitTeam:'Waiting for the team…', twoNote:'This quest needs 2 fails to fail.',
    ladyTitle:'Lady of the Lake: inspect a player', ladyHint:'Tap a player (former holders cannot be chosen).', inspect:'Inspect {0}', ladyWait:'{0} is using the Lady of the Lake…',
    assTitle:'Good completed 3 quests!', assMe:'You are the Assassin: confer with your team and choose who you think is Merlin.', stab:'Assassinate {0}', assWait:'The Assassin is hunting for Merlin…', assEvil:'Evil may discuss openly.',
    spectator:'You are spectating', myRole:'My role', tapReveal:'Tap to reveal', yourRole:'Your role', youSee:'You see ({0})', none:'nobody',
    inspected:'You inspected {0}: {1}', good:'Good', evil:'Evil', gotIt:'Got it', loadingRole:'Loading your role…',
    see_evil:'evil', see_mp:'Merlin or Morgana', see_allies:'evil allies', nightTitle:'Night falls', nightLead:'Peek at your role — keep it hidden from anyone next to you.', flip:'Reveal my role',
    voteReveal:'Vote results', passed:'Team approved — off they go!', rejected:'Team rejected', yesNo:'{0} approve · {1} reject',
    questReveal:'Quest {0} result', qSuccess:'Quest succeeded', qFail:'Quest failed',
    goodWin:'Good wins', evilWin:'Evil wins', r5:'5 proposals in a row were rejected', r3f:'3 quests failed', r3s:'3 quests succeeded',
    rhit:'The Assassin found Merlin — Evil steals the win!', rmiss:'The Assassin missed Merlin!', stabbedX:'The Assassin chose {0}',
    again:'Play again', waitAgain:'Waiting for the host', backHome:'Home', allRoles:'Roles revealed',
    history:'History', noHistory:'No votes yet.', round:'Round', leaderTeam:'Leader / Team', result:'Result',
    rRejected:'Rejected', rOn:'On quest', try:'Try {0}',
    hostOffline:'Host {0} seems offline. The game runs on the host\'s device — ask them to reopen the link and it will resume.',
    rules:'Quick rules', close:'Close', ladyLog:'Lady of the Lake', kicked:'Removed', toMany:'Max {0} players — deselect one first',
    rulesP1:'Good must complete 3 quests; Evil must fail 3. Each round the leader proposes a team and everyone votes openly — a <b>strict majority</b> is needed, otherwise leadership passes on. If <b>5 proposals in a row</b> are rejected for one quest, Evil wins.',
    rulesP2:'Team members play cards secretly: Good can only play Success, Evil may choose. With 7+ players, <b>Quest 4 needs 2 fails</b>. If Good completes 3 quests, the Assassin gets one shot at Merlin — a hit means Evil wins.',
    rulesP3:'Lady of the Lake (optional, 7+): after Quests 2, 3 and 4 the holder secretly checks one player\'s loyalty, then passes the Lady to them. Former holders cannot be checked.',
    rulesP4:'Teams: 5p 3G/2E · 6p 4G/2E · 7p 4G/3E · 8p 5G/3E · 9p 6G/3E · 10p 6G/4E',
    writeFail:'Could not save — check your network and try again', footer:'Avalon Online · unofficial fan project based on the board game "The Resistance: Avalon"', tooLong:'Name: max 12 characters',
  }
};
const ROLE_TXT = {
  zh: {
    merlin:['梅林','你知道谁是坏人（莫德雷德除外）。别暴露自己，否则好人赢了也会被刺客翻盘。'],
    percival:['派西维尔','你能看到梅林和莫甘娜，但分不清谁是谁。保护真正的梅林。'],
    servant:['亚瑟的忠臣','你没有额外信息，靠发言和投票找出坏人。'],
    assassin:['刺客','好人完成 3 个任务后，由你刺杀一名玩家：刺中梅林，坏人翻盘。'],
    morgana:['莫甘娜','在派西维尔眼中，你看起来和梅林一样。'],
    mordred:['莫德雷德','梅林看不到你是坏人。'],
    oberon:['奥伯伦','你不认识其他坏人，他们也不认识你（但梅林能看到你）。'],
    minion:['莫德雷德的爪牙','你认识其他坏人（奥伯伦除外），想办法让任务失败。'],
  },
  en: {
    merlin:['Merlin','You know the evil players (except Mordred). Stay hidden — if the Assassin finds you, Evil wins.'],
    percival:['Percival','You see Merlin and Morgana, but cannot tell which is which. Protect the real Merlin.'],
    servant:['Loyal Servant','No special knowledge. Use discussion and votes to find the traitors.'],
    assassin:['Assassin','If Good completes 3 quests, you pick one player to assassinate. Hit Merlin and Evil wins.'],
    morgana:['Morgana','You appear as Merlin to Percival.'],
    mordred:['Mordred','Merlin cannot see you as evil.'],
    oberon:['Oberon','You do not know the other evil players and they do not know you (Merlin does see you).'],
    minion:['Minion of Mordred','You know your evil allies (except Oberon). Sabotage the quests.'],
  }
};
const ROLE_META = {
  merlin:{side:'good',ic:'✦',art:'assets/roles/merlin.webp'},
  percival:{side:'good',ic:'◈',art:'assets/roles/percival.webp'},
  servant:{side:'good',ic:'⚔',art:'assets/roles/servant.webp'},
  assassin:{side:'evil',ic:'†',art:'assets/roles/assassin.webp'},
  morgana:{side:'evil',ic:'☾',art:'assets/roles/morgana.webp'},
  mordred:{side:'evil',ic:'♜',art:'assets/roles/mordred.webp'},
  oberon:{side:'evil',ic:'♠',art:'assets/roles/oberon.webp'},
  minion:{side:'evil',ic:'◆',art:'assets/roles/minion.webp'},
};
let LANG = 'zh';
function t(k, ...a){ const s = (I18N[LANG][k] ?? I18N.zh[k] ?? k); return s.replace(/\{(\d)\}/g, (_,i)=>a[+i] ?? ''); }
const rName = r => ROLE_TXT[LANG][r][0];
const rDesc = r => ROLE_TXT[LANG][r][1];
const side = r => ROLE_META[r] ? ROLE_META[r].side : null;
const roleArt = (r, cls='role-art') => '<img class="'+cls+'" src="'+ROLE_META[r].art+'" alt="'+esc(rName(r))+'" loading="lazy">';

/* ================= Rules ================= */
const EVIL_N = {5:2,6:2,7:3,8:3,9:3,10:4};
const SIZES  = {5:[2,3,2,3,3],6:[2,3,4,3,4],7:[2,3,3,4,4],8:[3,4,4,5,5],9:[3,4,4,5,5],10:[3,4,4,5,5]};
const DEFAULT_SETTINGS = {merlin:true, percival:true, morgana:true, mordred:false, oberon:false, lady:false};
function buildRoles(n, st){
  if(n<5 || n>10) return {err:t('needPlayers', n)};
  const ev=EVIL_N[n], gd=n-ev, good=[], evil=[];
  if(st.merlin){ good.push('merlin'); evil.push('assassin'); }
  if(st.percival) good.push('percival');
  if(st.morgana) evil.push('morgana');
  if(st.mordred) evil.push('mordred');
  if(st.oberon) evil.push('oberon');
  if(evil.length>ev) return {err:t('tooManyEvil', n, ev)};
  if(good.length>gd) return {err:t('tooManyGood')};
  while(evil.length<ev) evil.push('minion');
  while(good.length<gd) good.push('servant');
  return {roles:good.concat(evil), ev, gd};
}

/* ================= Utils ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rnd(n){ const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]%n; }
function shuffle(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randCode(len=5, A='ABCDEFGHJKMNPQRSTUVWXYZ23456789'){ let s=''; for(let i=0;i<len;i++) s+=A[rnd(A.length)]; return s; }
const LS = {
  get(k){ try{ return JSON.parse(localStorage.getItem('lwav.'+k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem('lwav.'+k, JSON.stringify(v)); }catch(e){} }
};
let toastT;
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.remove('hidden'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.add('hidden'), 3000); }
const AV_COLORS=['#0e7490','#1d4ed8','#0f766e','#4338ca','#0369a1','#155e75','#3730a3','#047857','#1e40af','#5b21b6','#0c4a6e','#115e59'];
function avColor(id){ let h=0; for(const c of String(id)) h=(h*31+c.charCodeAt(0))>>>0; return AV_COLORS[h%AV_COLORS.length]; }
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
const Net = {
  db:null, auth:null, ref:null, onlineRef:null, code:null, loaded:false, conn:false, everConnected:false, authFailed:false,
  raw:new Map(), parsed:new Map(), revs:new Map(), online:new Set(),
  async init(){
    firebase.initializeApp(FIREBASE_CONFIG);
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
  markOnline(){
    if(!this.code || !this.conn || !ME.pid) return;
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
  mine:null, master:null, ladyMine:[], ui:{nick:'', joinCode:'', pick:[], pickStep:'', myActs:{}, busy:false},
  ov:[], seen:null, notFoundTimer:null, lastGid:null,
};

/* ================= Boot ================= */
async function boot(){
  LANG = LS.get('lang') || ((navigator.language||'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en');
  document.documentElement.lang = LANG==='zh' ? 'zh-CN' : 'en';
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
    S.seats = Net.prefixed('seat/');
    S.secrets = Net.prefixed('sec/');
    if(!S.game && Net.loaded){ toast(t('notFound', S.code)); return goHome(true); } // room missing or closed
    if(S.game && S.game.status==='lobby' && S.autoSeat && !S.seats[ME.pid] && Net.loaded){ S.autoSeat=false; takeSeat(); }
    if(S.game && S.game.step!==S.ui.pickStep){ S.ui.pick=[]; S.ui.pickStep=S.game.step; }
    decryptSecrets().then(()=>{ detect(); render(); hostTick(); });
  }
  render();
}
async function decryptSecrets(){
  const g=S.game, gid=g && g.gid;
  if(!gid){ S.mine=null; S.master=null; S.ladyMine=[]; return; }
  const m=S.secrets[ME.pid];
  if(m && m.gid===gid){ try{ S.mine=await decC(m.box); }catch(e){ S.mine=null; } } else S.mine=null;
  const ms=S.secrets.master;
  if(g.host===ME.pid && ms && ms.gid===gid){ try{ S.master=await decC(ms.box); }catch(e){ S.master=null; } } else if(g.host!==ME.pid) S.master=null;
  const lady=[];
  for(const [id,d] of Object.entries(S.secrets)){
    if(id.startsWith('lady-') && d.gid===gid && d.to===ME.pid){ try{ lady.push(await decC(d.box)); }catch(e){} }
  }
  lady.sort((a,b)=>a.q-b.q); S.ladyMine=lady;
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
function cleanNick(){ return (S.ui.nick||'').trim().slice(0,12); }
function enterRoom(code){
  S.code=code; S.view='room'; S.joinedAt=Date.now(); S.autoSeat=true; S.seen=null;
  S.game=null; S.seats={}; S.secrets={}; S.mine=null; S.master=null; S.ladyMine=[]; S.ov=[];
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
function createRoom(){
  const nick=cleanNick(); if(!nick) return toast(t('needNick'));
  LS.set('nick', nick);
  const code=randCode(5);
  enterRoom(code);
  S.autoSeat=false;
  Net.pub('game', {code, host:ME.pid, hostPub:ME.pub, status:'lobby', created:Date.now(), settings:Object.assign({},DEFAULT_SETTINGS), gid:''});
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
  const s=S.seats[ME.pid]; if(s && s.nick!==nick){ Net.pub('seat/'+ME.pid, Object.assign({}, s, {nick})); toast(t('renamed')); }
}
function lobbyOrder(){ return Object.values(S.seats).sort((a,b)=>(a.joined||0)-(b.joined||0) || String(a.pid).localeCompare(b.pid)).map(s=>s.pid); }
const isHost = () => !!(S.game && S.game.host===ME.pid);
function leaveRoom(){
  const g=S.game;
  if(g && g.status==='lobby'){
    const others=lobbyOrder().filter(p=>p!==ME.pid);
    if(g.host===ME.pid){
      if(others.length) Net.pub('game', Object.assign({}, g, {host:others[0], hostPub:S.seats[others[0]].pub}));
      else Net.pub('game', null);
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
  Net.pub('game', Object.assign({}, S.game, {settings:st}));
}
async function startGame(){
  const g=S.game; if(!isHost() || g.status!=='lobby' || S.ui.busy) return;
  const ids=lobbyOrder(), n=ids.length, st=Object.assign({}, DEFAULT_SETTINGS, g.settings);
  const br=buildRoles(n, st); if(br.err) return toast(br.err);
  S.ui.busy=true; render();
  try{
    const dealt=shuffle(br.roles), roles={};
    ids.forEach((id,i)=>roles[id]=dealt[i]);
    const gid=randCode(8), pubs={}, nicks={};
    ids.forEach(id=>{ pubs[id]=S.seats[id].pub; nicks[id]=S.seats[id].nick; });
    for(const id of ids){
      const r=roles[id]; let sees=[], see='';
      if(r==='merlin'){ sees=ids.filter(x=>side(roles[x])==='evil' && roles[x]!=='mordred'); see='see_evil'; }
      else if(r==='percival'){ sees=ids.filter(x=>roles[x]==='merlin'||roles[x]==='morgana'); see='see_mp'; }
      else if(side(r)==='evil' && r!=='oberon'){ sees=ids.filter(x=>x!==id && side(roles[x])==='evil' && roles[x]!=='oberon'); see='see_allies'; }
      Net.pub('sec/'+id, {gid, box: await enc(pubs[id], {role:r, sees, see})});
    }
    Net.pub('sec/master', {gid, box: await enc(ME.pub, {roles})});
    S.master={roles};
    const leader=rnd(n), holder=(st.lady && n>=7) ? ids[(leader-1+n)%n] : null;
    Net.pub('game', {
      code:g.code, host:ME.pid, hostPub:ME.pub, created:g.created, settings:st,
      status:'play', gid, order:ids, pubs, nicks, n,
      phase:'propose', q:0, att:1, leader, team:[], step:gid+':propose:0:1',
      quests:SIZES[n].map((size,i)=>({size, two:(i===3 && n>=7), r:null, fails:null, team:null})),
      rounds:[], lady: holder ? {holder, used:[holder], log:[]} : null,
      winner:null, reason:'', roles:null, assassinPick:null, started:Date.now()
    });
  }catch(e){ console.error(e); }
  S.ui.busy=false; render();
}
function playAgain(){
  const g=S.game; if(!isHost()) return;
  for(const id of Object.keys(S.secrets)) Net.pub('sec/'+id, null);
  Net.pub('game', {code:g.code, host:ME.pid, hostPub:ME.pub, status:'lobby', created:g.created||Date.now(), settings:g.settings||DEFAULT_SETTINGS, gid:''});
  S.ov=[];
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
  return Object.assign({}, extra, {status:'end', phase:'end', winner, reason, roles:S.master.roles, step:g.gid+':end'});
}
async function computeNext(g){
  const n=g.order.length, roles=S.master.roles, gid=g.gid, inGame=u=>g.order.includes(u);
  switch(g.phase){
    case 'propose': {
      const v=await readAct(g.order[g.leader], g.step);
      if(!Array.isArray(v)) return null;
      const team=[...new Set(v)].filter(inGame);
      if(team.length!==g.quests[g.q].size) return null;
      return {phase:'vote', team, step:gid+':vote:'+g.q+':'+g.att};
    }
    case 'vote': {
      const votes={};
      for(const u of g.order){ const v=await readAct(u, g.step); if(v===undefined) return null; votes[u]=!!v; }
      const yes=Object.values(votes).filter(Boolean).length, ok=yes*2>n;
      const rounds=(g.rounds||[]).concat([{q:g.q, att:g.att, leader:g.order[g.leader], team:g.team, votes, ok}]);
      if(ok) return {rounds, phase:'quest', step:gid+':quest:'+g.q+':'+g.att};
      if(g.att>=5) return endPatch(g, 'evil', 'r5', {rounds});
      return {rounds, att:g.att+1, leader:(g.leader+1)%n, team:[], phase:'propose', step:gid+':propose:'+g.q+':'+(g.att+1)};
    }
    case 'quest': {
      const cards={};
      for(const u of g.team){ const v=await readAct(u, g.step); if(v===undefined) return null; cards[u]=v; }
      const fails=g.team.filter(u=>cards[u]==='F' && side(roles[u])==='evil').length; // good can never fail
      const qd=g.quests[g.q], failed=fails>=(qd.two?2:1);
      const quests=g.quests.map((x,i)=> i===g.q ? Object.assign({}, x, {r:failed?'F':'S', fails, team:g.team}) : x);
      const sc=quests.filter(x=>x.r==='S').length, fc=quests.filter(x=>x.r==='F').length;
      if(fc>=3) return endPatch(g, 'evil', 'r3f', {quests});
      if(sc>=3){
        const vals=Object.values(roles);
        if(vals.includes('assassin') && vals.includes('merlin')) return {quests, phase:'assassin', step:gid+':assassin'};
        return endPatch(g, 'good', 'r3s', {quests});
      }
      const q=g.q+1, base={quests, q, att:1, leader:(g.leader+1)%n, team:[]};
      if(g.lady && q>=2 && q<=4) return Object.assign(base, {phase:'lady', step:gid+':lady:'+q});
      return Object.assign(base, {phase:'propose', step:gid+':propose:'+q+':1'});
    }
    case 'lady': {
      const h=g.lady.holder, tg=await readAct(h, g.step);
      if(!inGame(tg) || tg===h || g.lady.used.includes(tg)) return null;
      Net.pub('sec/lady-'+g.q, {gid, to:h, box: await enc(g.pubs[h], {q:g.q, target:tg, side:side(roles[tg])})});
      return {lady:{holder:tg, used:g.lady.used.concat([tg]), log:(g.lady.log||[]).concat([{q:g.q, from:h, to:tg}])},
              phase:'propose', step:gid+':propose:'+g.q+':1'};
    }
    case 'assassin': {
      const a=g.order.find(u=>roles[u]==='assassin'); if(!a) return null;
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
function avatar(p, cls){ return '<div class="'+(cls||'av')+'" style="background:'+avColor(p)+'">'+esc(initials(nickOf(p)))+'</div>'; }

function render(){
  const app=$('#app'); if(!app) return;
  const gameActive=!!(S.code && S.game && S.game.status!=='lobby');
  document.body.classList.toggle('game-active', gameActive);
  document.body.classList.toggle('game-ended', gameActive && S.game.status==='end');
  const a=document.activeElement, fid=a && a.id, fsel=a && a.selectionStart;
  let html=topBar();
  if(!S.code) html+=viewHome();
  else if(!S.game) html+='<div class="glass card" style="text-align:center;max-width:480px;margin:40px auto">'+t('entering', esc(S.code))+'<div class="muted small" style="margin-top:6px">'+(Net.connected()?'':t('connecting'))+'</div></div>';
  else if(S.game.status==='lobby') html+=viewLobby();
  else html+=viewGame();
  html+='<div class="foot">'+t('footer')+'</div>';
  app.innerHTML=html;
  renderOverlay();
  if(fid){ const el=document.getElementById(fid); if(el){ el.focus(); try{ el.setSelectionRange(fsel,fsel); }catch(e){} } }
}
function topBar(){
  const conn=Net.connected();
  const st = !Net.everConnected ? t('connecting') : (conn ? t('online') : t('offline'));
  return '<div class="top"><button class="brand" data-a="home"><div class="mark"><span>V</span></div><div><div class="t1">AVALON</div><div class="t2">'+t('sub')+'</div></div></button>'
    +'<div class="top-r">'+(S.code&&S.game?'<span class="chip"><span class="dot '+(conn?'on':'')+'"></span><b style="letter-spacing:2px">'+esc(S.code)+'</b></span>':'<span class="chip"><span class="dot '+(conn?'on':'')+'"></span>'+st+'</span>')
    +'<button class="chip btn" data-a="lang">'+(LANG==='zh'?'EN':'中文')+'</button></div></div>'
    +(Net.everConnected && !conn ? '<div class="banner-off">'+t('offline')+'</div>' : '')
    +((Net.authFailed || (!Net.everConnected && S.bootAt && Date.now()-S.bootAt>15000)) ? '<div class="banner-off">'+t('noNet')+'</div>' : '');
}
function rulesBlock(){
  const order=['merlin','percival','servant','assassin','morgana','mordred','oberon','minion'];
  return '<details class="rules"><summary><span class="summary-mark">✦</span> '+t('rules')+'</summary><p>'+t('rulesP1')+'</p><p>'+t('rulesP2')+'</p><p>'+t('rulesP3')+'</p>'
    +'<div class="rgrid">'+order.map(r=>'<div class="role-guide '+side(r)+'">'+roleArt(r,'guide-art')+'<span><b class="'+(side(r)==='good'?'res-s':'res-f')+'">'+rName(r)+'</b><br><span class="muted">'+rDesc(r)+'</span></span></div>').join('')+'</div>'
    +'<p class="muted small">'+t('rulesP4')+'</p></details>';
}
function viewHome(){
  const last=LS.get('last');
  return '<div class="hero"><div class="hero-art hero-art-good"><img src="'+ROLE_META.merlin.art+'" alt="Merlin"></div><div class="hero-art hero-art-evil"><img src="'+ROLE_META.morgana.art+'" alt="Morgana"></div>'
    +'<div class="hero-copy"><div class="eyebrow">THE RESISTANCE</div><div class="crest"><span>V</span></div><h1>AVALON</h1><div class="sub">'+t('tagline')+'</div><p class="hero-oath">'+(LANG==='zh'?'忠诚藏于誓言，背叛隐于圆桌。':'Loyalty hides in every oath. Treachery sits at the table.')+'</p>'
    +'<div class="feature"><span>♟ '+t('feat1')+'</span><span>✦ '+t('feat2')+'</span><span>⌁ '+t('feat3')+'</span><span>⌘ '+t('feat4')+'</span></div></div></div>'
    +(last ? '<div class="glass resume"><span>'+t('resume','<b style="letter-spacing:2px">'+esc(last)+'</b>')+'</span><button class="btn pri" data-a="resume">'+t('resumeBtn')+'</button></div>' : '')
    +'<div class="home-grid"><div class="glass card"><h2>'+t('nick')+'</h2><input class="input" id="nick" maxlength="12" placeholder="'+t('nickPh')+'" value="'+esc(S.ui.nick)+'">'
    +'<button class="btn pri big" style="width:100%;margin-top:14px" data-a="create">✨ '+t('create')+'</button></div>'
    +'<div class="glass card"><h2>'+t('joinTitle')+'</h2><div class="row"><input class="input code" id="joinCode" maxlength="8" placeholder="'+t('codePh')+'" value="'+esc(S.ui.joinCode)+'" style="flex:1;min-width:0">'
    +'<button class="btn" data-a="join">'+t('join')+'</button></div><p class="muted small" style="margin-bottom:0">'+t('joinHint')+'</p></div></div>'
    +'<div class="glass card" style="max-width:820px;margin:16px auto 0">'+rulesBlock()+'</div>';
}
function viewLobby(){
  const g=S.game, ids=lobbyOrder(), n=ids.length, host=isHost(), seated=!!S.seats[ME.pid];
  const st=Object.assign({}, DEFAULT_SETTINGS, g.settings);
  const br=buildRoles(n, st), pv=buildRoles(Math.min(10,Math.max(5,n)), st);
  let seats=ids.map(p=>{
    const s=S.seats[p];
    return '<div class="seatcard">'+'<div class="av" style="background:'+avColor(p)+'">'+esc(initials(s.nick))+'<span class="on '+(Net.isOnline(p)?'y':'')+'"></span></div>'
      +'<div><div class="nm">'+esc(s.nick)+'</div>'+(p===g.host?'<span class="tag host">👑 '+t('host')+'</span>':'')+(p===ME.pid?'<span class="tag me">'+t('you')+'</span>':'')+'</div>'
      +(host && p!==ME.pid ? '<button class="x" title="kick" data-kick="'+esc(p)+'">×</button>' : '')+'</div>';
  }).join('');
  for(let i=n;i<Math.max(5,Math.min(10,n+1));i++) seats+='<div class="seatcard empty tiny">'+t('emptySeat')+'</div>';
  const tile=(k,role,name,desc,cls)=>'<button class="rt '+cls+(st[k]?' on':'')+'" '+(host?'data-set="'+k+'"':'disabled')+'>'+roleArt(role,'tile-art')+'<span><b>'+name+'</b><span>'+desc+'</span></span></button>';
  const compHtml = pv.err ? '<p class="warn small">'+esc(pv.err)+'</p>' :
    '<div class="comp">'+pv.roles.map(r=>'<span class="tag '+side(r)+'">'+ROLE_META[r].ic+' '+rName(r)+'</span>').join('')+'</div>'
    +'<p class="muted small" style="margin:6px 0 0">'+(n>=5&&n<=10 ? t('comp', n, pv.gd, pv.ev) : t('compPrev', Math.min(10,Math.max(5,n)), pv.gd, pv.ev))+'</p>';
  return '<div class="glass card roomcode"><div><div class="muted small">'+t('roomCode')+'</div><div class="code">'+esc(g.code)+'</div><div class="muted small">'+t('inviteHint')+'</div></div>'
    +'<div class="row"><button class="btn pri" data-a="copy">🔗 '+t('copyLink')+'</button>'+(navigator.share?'<button class="btn" data-a="share">'+t('share')+'</button>':'')+'</div></div>'
    +'<div class="lobby"><div class="glass card"><h2>'+t('players')+' · '+n+'/10</h2><div class="seats">'+seats+'</div>'
    +'<div class="row" style="margin-top:14px"><input class="input" id="nick" maxlength="12" placeholder="'+t('nickPh')+'" value="'+esc(S.ui.nick)+'" style="flex:1;min-width:120px">'
    +(seated?'<button class="btn" data-a="rename">'+t('rename')+'</button>':'<button class="btn pri" data-a="seat">'+t('seat')+'</button>')+'</div>'
    +'<div class="row" style="margin-top:14px">'
    +(host?'<button class="btn pri big" data-a="start" '+(br.err||S.ui.busy?'disabled':'')+'>'+(S.ui.busy?t('dealing'):'⚔️ '+t('start'))+'</button>':'<span class="muted" style="flex:1">⏳ '+t('waitHost')+'</span>')
    +'<button class="btn ghost" data-a="leave">'+t('leave')+'</button></div>'
    +(host&&br.err?'<p class="warn small" style="margin-bottom:0">'+esc(br.err)+'</p>':'')+'</div>'
    +'<div class="glass card"><h2>'+t('roleSettings')+(host?'':' <span class="muted small">· '+t('hostOnly')+'</span>')+'</h2><div class="roletiles">'
    +tile('merlin','merlin',t('optMerlin'),t('optMerlinD'),'good')
    +tile('percival','percival',rName('percival'),rDesc('percival').split(/[。.]/)[0],'good')
    +tile('morgana','morgana',rName('morgana'),rDesc('morgana').split(/[。.]/)[0],'evil')
    +tile('mordred','mordred',rName('mordred'),rDesc('mordred').split(/[。.]/)[0],'evil')
    +tile('oberon','oberon',rName('oberon'),rDesc('oberon').split(/[，(（,]/)[0],'evil')
    +'<button class="rt neutral'+(st.lady?' on':'')+'" '+(host?'data-set="lady"':'disabled')+'><span class="lady-art">◯</span><span><b>'+t('optLady')+'</b><span>'+t('optLadyD')+'</span></span></button>'
    +'</div>'+compHtml+'</div></div>'
    +'<div class="glass card">'+rulesBlock()+'</div>';
}

function pickMode(g){
  if(S.ui.busy || g.status!=='play') return null;
  const me=ME.pid;
  if(g.phase==='propose' && g.order[g.leader]===me) return {max:g.quests[g.q].size, ok:()=>true};
  if(g.phase==='lady' && g.lady && g.lady.holder===me) return {max:1, ok:u=>u!==me && !g.lady.used.includes(u)};
  if(g.phase==='assassin' && S.mine && S.mine.role==='assassin') return {max:1, ok:u=>u!==me};
  return null;
}
function needsAct(g,u){
  if(g.phase==='propose') return g.order[g.leader]===u;
  if(g.phase==='vote') return true;
  if(g.phase==='quest') return (g.team||[]).includes(u);
  if(g.phase==='lady') return !!(g.lady && g.lady.holder===u);
  return false;
}
function viewGame(){
  const g=S.game, n=g.order.length;
  const offline = g.status==='play' && !isHost() && Net.connected() && Date.now()-S.joinedAt>25000 && !Net.isOnline(g.host);
  return (offline?'<div class="banner-off">⚠️ '+t('hostOffline', esc(nickOf(g.host)))+'</div>':'')
    +'<div class="game"><div>'+tableView(g)+'</div><div class="panel">'
    +'<div class="dock '+(g.status==='end'?'dock-end':'')+'">'+actionBlock(g)+'</div>'
    +roleBar()+historyBlock(g)
    +'<div class="glass card">'+rulesBlock()+'</div></div></div>';
}
function tableView(g){
  const n=g.order.length, pm=pickMode(g), endRoles=g.status==='end'?(g.roles||{}):null;
  const sees=new Set((S.peek&&S.mine&&S.mine.sees)||[]), lady={}; if(S.peek) S.ladyMine.forEach(x=>lady[x.target]=x.side); // private info only while the role card is open
  const last=(g.rounds||[]).slice(-1)[0];
  const showVotes = last && g.status==='play' && (g.phase==='quest' || (g.phase==='propose' && !last.ok && last.q===g.q));
  const L=g.order[g.leader];
  const seats=g.order.map((p,i)=>{
    const ang=(-90 + i*360/n)*Math.PI/180, R=41;
    const x=50+R*Math.cos(ang), y=50+R*Math.sin(ang);
    const onTeam=(g.phase==='vote'||g.phase==='quest') && (g.team||[]).includes(p);
    const can=pm && pm.ok(p), picked=S.ui.pick.includes(p);
    let tags='';
    if(endRoles && endRoles[p]) tags+='<span class="tag '+side(endRoles[p])+'">'+ROLE_META[endRoles[p]].ic+' '+rName(endRoles[p])+'</span>';
    else {
      if(sees.has(p)) tags+='<span class="tag '+(S.mine.role==='percival'?'good':'evil')+'">'+(S.mine.role==='percival'?'🧙?':'👁 '+t('evil'))+'</span>';
      if(lady[p]) tags+='<span class="tag '+lady[p]+'">🧜‍♀️ '+t(lady[p])+'</span>';
    }
    let badges='<span class="b-off '+(Net.isOnline(p)?'y':'')+'"></span>';
    if(g.status==='play' && p===L && ['propose','vote','quest'].includes(g.phase)) badges+='<span class="badge b-crown">👑</span>';
    if(g.lady && g.lady.holder===p && g.status==='play') badges+='<span class="badge b-lady">🧜‍♀️</span>';
    if(g.status==='play' && needsAct(g,p)) badges+= acted(p) ? '<span class="badge b-act">✓</span>' : '<span class="badge b-wait">⏳</span>';
    if(showVotes && last.votes[p]!==undefined) badges+='<span class="badge b-vote '+(last.votes[p]?'y':'n')+'">'+(last.votes[p]?'✓':'✗')+'</span>';
    const cls='seatp'+(onTeam?' team':'')+(can?' pick':'')+(picked?' picked':'')+(p===ME.pid?' me':'')+(g.assassinPick===p?' stabbed':'')+(pm&&!can?' dimmed':'');
    return '<button class="'+cls+'" style="left:'+x.toFixed(2)+'%;top:'+y.toFixed(2)+'%" '+(can?'data-pick="'+esc(p)+'"':'tabindex="-1"')+'>'
      +'<div class="pav" style="background:'+avColor(p)+'">'+esc(initials(nickOf(p)))+badges+'</div>'
      +'<div class="pn">'+(i+1)+'·'+esc(nickOf(p))+'</div><div class="pt">'+tags+'</div></button>';
  }).join('');
  const qt=g.quests.map((q,i)=>'<div class="qt '+(q.r||'')+(q.two?' two':'')+(i===g.q&&g.status==='play'&&!q.r?' cur':'')+'">'+(q.r?(q.r==='S'?'✓':'✗'):q.size)
    +'<small>'+(q.r?t('fails',q.fails):t('questN',i+1))+'</small></div>').join('');
  const rej=[1,2,3,4,5].map(i=>'<i class="'+(i<g.att&&g.status==='play'?'x':'')+(i===5?' last':'')+'"></i>').join('');
  let center;
  if(g.status==='end') center='<div class="ph" style="color:'+(g.winner==='good'?'#7dd3fc':'#c4b5fd')+'">'+(g.winner==='good'?'🛡️ '+t('goodWin'):'🗡️ '+t('evilWin'))+'</div><div class="phs">'+t(g.reason)+'</div>';
  else center='<div class="ph">'+t('questN', g.q+1)+' · '+t('ph_'+g.phase)+'</div>';
  return '<div class="glass card" style="padding:10px"><div class="tablewrap"><div class="table"><div class="disc">'+center+'<div class="qtoks">'+qt+'</div>'
    +(g.status==='play'?'<div class="rejs">'+rej+'<span>'+t('attempt', g.att)+'</span></div>':'')+'</div>'+seats+'</div></div>'
    +(g.lady&&g.lady.log&&g.lady.log.length?'<p class="muted small" style="text-align:center;margin:4px 0 6px">🧜‍♀️ '+g.lady.log.map(x=>esc(nickOf(x.from))+' → '+esc(nickOf(x.to))).join(' · ')+'</p>':'')+'</div>';
}
function actionBlock(g){
  const me=ME.pid, inGame=g.order.includes(me), busy=S.ui.busy, mine=S.ui.myActs[g.step], L=g.order[g.leader];
  if(g.status==='end') return '<div class="glass card act"><h2>'+(g.winner==='good'?'🛡️ '+t('goodWin'):'🗡️ '+t('evilWin'))+'</h2><div class="hint">'+t(g.reason)+'</div>'
    +'<div class="row">'+(isHost()?'<button class="btn pri big" data-a="again">🔄 '+t('again')+'</button>':'<span class="muted">'+t('waitAgain')+'</span>')+'<button class="btn ghost" data-a="showend">'+t('allRoles')+'</button></div></div>';
  if(!inGame) return '<div class="glass card act"><h2>👀 '+t('spectator')+'</h2><div class="hint">'+t('ph_'+g.phase)+'</div></div>';
  const prog=(list)=>{ const k=list.filter(acted).length; return '<div class="progress"><b style="width:'+(100*k/list.length)+'%"></b></div>'; };
  const chips=list=>'<div class="pickrow">'+list.map(u=>'<span class="tag" style="font-size:13px;padding:2px 10px">'+esc(nickOf(u))+'</span>').join('')+'</div>';
  let h='';
  if(g.phase==='propose'){
    const size=g.quests[g.q].size;
    if(L===me) h='<h2>👑 '+t('leaderPick', size)+'</h2><div class="hint">'+t('leaderHint')+' ('+S.ui.pick.length+'/'+size+')</div>'+chips(S.ui.pick)
      +'<button class="btn pri big" style="width:100%" data-a="propose" '+(S.ui.pick.length!==size||busy?'disabled':'')+'>'+(acted(me)?t('resubmit'):t('submitTeam'))+'</button>';
    else h='<h2>⏳ '+t('waitLeader', esc(nickOf(L)), size)+'</h2><div class="hint" style="margin-bottom:0">'+t('discuss')+'</div>';
  } else if(g.phase==='vote'){
    h='<h2>🗳️ '+t('voteTitle')+'</h2>'+chips(g.team)
      +'<div class="row"><button class="btn good big '+(mine===true?'sel':'')+'" data-vote="1" '+(busy?'disabled':'')+'>👍 '+t('approve')+'</button>'
      +'<button class="btn evil big '+(mine===false?'sel':'')+'" data-vote="0" '+(busy?'disabled':'')+'>👎 '+t('reject')+'</button></div>'
      +'<div class="hint" style="margin:10px 0 0">'+(acted(me)?t('voted'):t('pleaseVote'))+' · '+t('votedCount', g.order.filter(acted).length, g.order.length)+'</div>'+prog(g.order);
  } else if(g.phase==='quest'){
    h='<h2>⚔️ '+t('questTitle')+'</h2>'+chips(g.team);
    if(g.team.includes(me)){
      const evil=S.mine && side(S.mine.role)==='evil';
      h+='<div class="row"><button class="btn good big '+(mine==='S'?'sel':'')+'" data-quest="S" '+(busy?'disabled':'')+'>✓ '+t('success')+'</button>'
        +'<button class="btn evil big '+(mine==='F'?'sel':'')+'" data-quest="F" '+(!evil||busy?'disabled':'')+'>✗ '+t('fail')+'</button></div>'
        +'<div class="hint" style="margin:10px 0 0">'+(evil?t('evilChoice'):t('goodOnly'))+(acted(me)?' '+t('youPlayed'):'')+(g.quests[g.q].two?' '+t('twoNote'):'')+'</div>';
    } else h+='<div class="hint">'+t('waitTeam')+' '+t('played', g.team.filter(acted).length, g.team.length)+(g.quests[g.q].two?' · '+t('twoNote'):'')+'</div>';
    h+=prog(g.team);
  } else if(g.phase==='lady'){
    const ho=g.lady.holder;
    if(ho===me) h='<h2>🧜‍♀️ '+t('ladyTitle')+'</h2><div class="hint">'+t('ladyHint')+'</div><button class="btn pri big" style="width:100%" data-a="single" '+(S.ui.pick.length!==1||busy?'disabled':'')+'>'+t('inspect', S.ui.pick[0]?esc(nickOf(S.ui.pick[0])):'…')+'</button>';
    else h='<h2>🧜‍♀️ '+t('ph_lady')+'</h2><div class="hint" style="margin-bottom:0">'+t('ladyWait', esc(nickOf(ho)))+'</div>';
  } else if(g.phase==='assassin'){
    if(S.mine && S.mine.role==='assassin') h='<h2>🗡️ '+t('assTitle')+'</h2><div class="hint">'+t('assMe')+'</div><button class="btn evil big" style="width:100%" data-a="single" '+(S.ui.pick.length!==1||busy?'disabled':'')+'>'+t('stab', S.ui.pick[0]?esc(nickOf(S.ui.pick[0])):'…')+'</button>';
    else h='<h2>🗡️ '+t('assTitle')+'</h2><div class="hint" style="margin-bottom:0">'+t('assWait')+(S.mine&&side(S.mine.role)==='evil'?' '+t('assEvil'):'')+'</div>';
  }
  return '<div class="glass card act">'+h+'</div>';
}
function roleBar(){
  const g=S.game; if(!g.order.includes(ME.pid)) return '';
  if(!S.mine) return '<div class="glass card muted">'+t('loadingRole')+'</div>';
  const s=side(S.mine.role);
  return '<button class="glass card rolebar '+(S.peek?s:'')+'" data-a="peek"><span class="rb-l"><span class="rb-ic">'+(S.peek?roleArt(S.mine.role,'rolebar-art'):'<span class="card-seal">V</span>')+'</span>'
    +'<span><div class="muted tiny">'+t('myRole')+'</div><b>'+(S.peek?rName(S.mine.role):'••••••')+'</b></span></span><span class="muted small">'+(S.peek?'🙈':t('tapReveal'))+'</span></button>'
    +(S.peek?'<div class="glass card" style="margin-top:-8px">'+knowBlock()+'</div>':'');
}
function knowBlock(){
  const m=S.mine; let h='<div class="small" style="margin-bottom:8px">'+rDesc(m.role)+'</div>';
  if(m.see) h+='<div class="know"><div class="kl">'+t('youSee', t(m.see))+'</div>'+((m.sees||[]).length?m.sees.map(u=>'<span class="tag '+(m.role==='percival'?'good':'evil')+'" style="font-size:13px">'+esc(nickOf(u))+'</span>').join(' '):t('none'))+'</div>';
  S.ladyMine.forEach(x=>{ h+='<div class="know">🧜‍♀️ '+t('inspected', '<b>'+esc(nickOf(x.target))+'</b>', '<b class="'+(x.side==='good'?'res-s':'res-f')+'">'+t(x.side)+'</b>')+'</div>'; });
  return h;
}
function historyBlock(g){
  const rounds=g.rounds||[];
  if(!rounds.length) return '<div class="glass card log"><h3>'+t('history')+'</h3><div class="muted small">'+t('noHistory')+'</div></div>';
  const rows=rounds.slice().reverse().map(r=>{
    const qr=g.quests[r.q];
    const res = r.ok ? (qr && qr.r ? (qr.r==='S'?'<span class="res-s">✓ '+t('qSuccess')+'</span>':'<span class="res-f">✗ '+t('fails',qr.fails)+'</span>') : t('rOn')) : '<span class="res-r">'+t('rRejected')+'</span>';
    const yes=g.order.filter(u=>r.votes[u]), no=g.order.filter(u=>r.votes[u]===false);
    return '<tr><td><b>Q'+(r.q+1)+'</b><br><span class="muted tiny">'+t('try', r.att)+'</span></td><td>👑 '+esc(nickOf(r.leader))+'<br><span class="muted">'+r.team.map(u=>esc(nickOf(u))).join(', ')+'</span><br>'
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
    const s=side(m.role);
    h='<h2>🌙 '+t('nightTitle')+'</h2><p class="lead">'+t('nightLead')+'</p>'
      +'<div class="rolecard '+(o.flipped?'flip':'')+'" data-a="flipcard"><div class="in"><div class="face back"><div class="card-seal large">V</div><span>AVALON</span></div>'
      +'<div class="face front '+s+'">'+roleArt(m.role,'rolecard-art')+'<div class="rolecard-caption"><div class="rs">'+t(s)+'</div><div class="rn">'+rName(m.role)+'</div></div></div></div></div>'
      +(o.flipped?knowBlock()+'<button class="btn pri big" style="width:100%" data-a="ovnext">'+t('gotIt')+'</button>':'<button class="btn pri big" style="width:100%" data-a="flipcard">'+t('flip')+'</button>');
  } else if(o.type==='vote'){
    const r=o.r, yes=Object.values(r.votes).filter(Boolean).length, no=Object.keys(r.votes).length-yes;
    h='<h2>🗳️ '+t('voteReveal')+'</h2><p class="lead">'+t('questN', r.q+1)+' · '+t('try', r.att)+'</p>'
      +'<div class="bigres '+(r.ok?'good':'evil')+'">'+(r.ok?t('passed'):t('rejected'))+'</div><p class="muted">'+t('yesNo', yes, no)+'</p>'
      +'<div class="vlist">'+g.order.map((u,i)=>'<div style="animation-delay:'+(i*60)+'ms"><span>'+esc(nickOf(u))+'</span><span class="vchip '+(r.votes[u]?'y':'n')+'">'+(r.votes[u]?'✓ '+t('approve'):'✗ '+t('reject'))+'</span></div>').join('')+'</div>'
      +'<button class="btn pri big" style="width:100%" data-a="ovnext">OK</button>';
  } else if(o.type==='quest'){
    const q=g.quests[o.qi]; const cards=shuffle(Array(q.size).fill('S').map((c,i)=>i<q.fails?'F':'S'));
    h='<h2>⚔️ '+t('questReveal', o.qi+1)+'</h2><p class="lead">'+q.team.map(u=>esc(nickOf(u))).join(' · ')+'</p>'
      +'<div class="cards">'+cards.map((c,i)=>'<div class="qcard" style="animation-delay:'+(400+i*450)+'ms"><div class="f b"></div><div class="f '+(c==='S'?'s':'x')+'">'+(c==='S'?'✓':'✗')+'</div></div>').join('')+'</div>'
      +'<div class="bigres '+(q.r==='S'?'good':'evil')+'" style="animation-delay:'+(600+q.size*450)+'ms">'+(q.r==='S'?t('qSuccess'):t('qFail'))+'</div>'
      +'<p class="muted">'+t('fails', q.fails)+(q.two?' · '+t('needTwo'):'')+'</p><button class="btn pri big" style="width:100%" data-a="ovnext">OK</button>';
  } else if(o.type==='lady'){
    const x=o.x; h='<h2>🧜‍♀️ '+t('ph_lady')+'</h2><div class="bigres '+x.side+'" style="margin:18px 0">'+esc(nickOf(x.target))+' · '+t(x.side)+'</div><button class="btn pri big" style="width:100%" data-a="ovnext">OK</button>';
  } else if(o.type==='end'){
    const roles=g.roles||{};
    h='<h2>'+(g.winner==='good'?'🛡️':'🗡️')+'</h2><div class="bigres '+g.winner+'">'+(g.winner==='good'?t('goodWin'):t('evilWin'))+'</div><p class="lead" style="margin-top:8px">'+t(g.reason)
      +(g.assassinPick?'<br>'+t('stabbedX','<b>'+esc(nickOf(g.assassinPick))+'</b>'):'')+'</p>'
      +'<div class="endroles">'+g.order.map(u=>'<div class="'+side(roles[u])+'"><span>'+esc(nickOf(u))+(u===ME.pid?' ('+t('you')+')':'')+'</span><b>'+ROLE_META[roles[u]].ic+' '+rName(roles[u])+'</b></div>').join('')+'</div>'
      +'<div class="row">'+(isHost()?'<button class="btn pri big" data-a="again">🔄 '+t('again')+'</button>':'')+'<button class="btn big" data-a="ovnext">'+t('close')+'</button></div>';
  }
  el.innerHTML='<div class="ov"><div class="glass ovbox">'+h+'</div></div>';
}

/* ================= Events ================= */
document.addEventListener('input', e=>{
  if(e.target.id==='nick') S.ui.nick=e.target.value;
  if(e.target.id==='joinCode') S.ui.joinCode=e.target.value.toUpperCase();
});
document.addEventListener('keydown', e=>{
  if(e.key!=='Enter') return;
  if(e.target.id==='joinCode') joinRoom();
  else if(e.target.id==='nick'){ if(!S.code) createRoom(); else if(S.seats[ME.pid]) renameSeat(); else takeSeat(); }
});
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-a],[data-pick],[data-vote],[data-quest],[data-kick],[data-set]'); if(!b) return;
  if(b.dataset.kick) return kick(b.dataset.kick);
  if(b.dataset.set) return toggleSetting(b.dataset.set);
  if(b.dataset.pick){
    const pm=pickMode(S.game), u=b.dataset.pick; if(!pm) return;
    if(pm.max===1) S.ui.pick = S.ui.pick[0]===u ? [] : [u];
    else if(S.ui.pick.includes(u)) S.ui.pick=S.ui.pick.filter(x=>x!==u);
    else if(S.ui.pick.length<pm.max) S.ui.pick=S.ui.pick.concat([u]);
    else toast(t('toMany', pm.max));
    return render();
  }
  if(b.dataset.vote) return submit(b.dataset.vote==='1');
  if(b.dataset.quest) return submit(b.dataset.quest);
  switch(b.dataset.a){
    case 'home': return S.code ? goHome(false) : render();
    case 'lang': LANG = LANG==='zh'?'en':'zh'; LS.set('lang', LANG); document.documentElement.lang = LANG==='zh'?'zh-CN':'en'; return render();
    case 'create': return createRoom();
    case 'join': return joinRoom();
    case 'resume': { const l=LS.get('last'); if(l) enterRoom(l); return; }
    case 'seat': return takeSeat();
    case 'rename': return renameSeat();
    case 'leave': return leaveRoom();
    case 'start': return startGame();
    case 'again': return playAgain();
    case 'propose': return submit(S.ui.pick.slice());
    case 'single': return submit(S.ui.pick[0]);
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
boot();
