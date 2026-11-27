// Optional browser regression using only a shared local fake backend.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '../..');
const tree = {};
const clone = (v) => (v == null ? null : JSON.parse(JSON.stringify(v)));
function read(path) {
  return clone(
    path
      .split('/')
      .filter(Boolean)
      .reduce((v, k) => v?.[k], tree),
  );
}
function write(path, value) {
  const keys = path.split('/').filter(Boolean),
    last = keys.pop();
  let obj = tree;
  for (const key of keys) obj = obj[key] ??= {};
  if (value == null) delete obj[last];
  else obj[last] = clone(value);
}
const mock = `(()=>{let connected=true;window.auditConnected=v=>connected=v;const listeners=[];function ref(path){return {child:p=>ref(path+'/'+p),on(type,cb){const sub={path,cb,last:undefined};listeners.push(sub);},off(){for(let i=listeners.length-1;i>=0;i--)if(listeners[i].path===path)listeners.splice(i,1);},set:v=>window.dbOp({type:'set',path,value:v}),remove:()=>window.dbOp({type:'set',path,value:null}),update:value=>window.dbOp({type:'update',path,value}),async transaction(fn){const raw=await window.dbOp({type:'read',path});const next=fn(raw);if(next===undefined)return {committed:false};await window.dbOp({type:'set',path,value:next});return {committed:true};},onDisconnect(){return {remove:async()=>{},cancel:async()=>{}};}};}setInterval(async()=>{if(!connected)return;for(const sub of listeners.slice()){const value=sub.path==='.info/connected'?true:await window.dbOp({type:'read',path:sub.path});const key=JSON.stringify(value);if(key!==sub.last){sub.last=key;sub.cb({val:()=>value});}}},30);const database=()=>({ref});database.ServerValue={TIMESTAMP:1};window.firebase={initializeApp(){},auth:()=>({currentUser:{uid:window.auditUid}}),database};window.AvalonAnalytics={track:(name,props)=>window.dbOp({type:'event',name,props})};})();`;
(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-gpu'],
  });
  const pages = [],
    contexts = [],
    events = [],
    errors = [];
  for (let i = 0; i < 5; i++) {
    const context = await browser.newContext({
      serviceWorkers: 'block',
      viewport: { width: i ? 390 : 1440, height: 900 },
    });
    contexts.push(context);
    await context.exposeBinding('dbOp', (_source, op) => {
      if (op.type === 'read') return read(op.path);
      if (op.type === 'set') write(op.path, op.value);
      if (op.type === 'update')
        for (const [key, value] of Object.entries(op.value)) write(op.path + '/' + key, value);
      if (op.type === 'event') events.push({ uid: i, name: op.name, props: op.props });
      return true;
    });
    await context.route('**/audit-client*', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: fs
          .readFileSync(root + '/dist/index.html', 'utf8')
          .replace(
            '</head>',
            '<style>*{animation:none!important;transition:none!important;backdrop-filter:none!important;filter:none!important}</style></head>',
          )
          .replace(/<script src="vendor\/firebase-[^"]+"><\/script>/g, '')
          .replace(
            '<script src="vendor/qrcode.min.js">',
            `<script>window.auditUid='p${i}';${mock}</script><script src="vendor/qrcode.min.js">`,
          ),
      }),
    );
    await context.route('https://**', (route) => route.abort());
    const p = await context.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    pages.push(p);
    await p.goto('http://localhost:4173/audit-client');
    await p.waitForFunction(() => ME.pid);
    await p.locator('#nick').fill('Player' + i);
  }
  await pages[0].locator('[data-a=create]').click();
  await pages[0].waitForFunction(() => S.game?.status === 'lobby' && S.seats[ME.pid]);
  const code = await pages[0].evaluate(() => S.code);
  for (let i = 1; i < 5; i++) {
    await pages[i].locator('[data-a=homeJoin]').click();
    await pages[i].locator('#joinCode').fill(code);
    await pages[i].locator('[data-a=join]').click();
    await pages[i].waitForFunction(() => S.seats[ME.pid]);
  }
  await pages[0].waitForFunction(() => Object.keys(S.seats).length === 5);
  await pages[0].locator('[data-a=start]').click();
  for (const p of pages) await p.waitForFunction(() => S.mine?.role && S.game?.status === 'play');
  assert.equal(events.filter((e) => e.name === 'room_created').length, 1);
  assert.equal(events.filter((e) => e.name === 'room_joined').length, 4);
  assert.equal(events.filter((e) => e.name === 'game_started').length, 1);

  // Close and restore the host page in its original storage context, preserving private keys.
  await pages[0].close();
  pages[0] = await contexts[0].newPage();
  await pages[0].goto('http://localhost:4173/audit-client#' + code);
  await pages[0].waitForFunction(() => S.master?.roles && S.mine?.role);
  const privateDuringPlay = await Promise.all(
    pages.map((p) => p.evaluate(() => ({ host: isHost(), master: !!S.master, mine: !!S.mine }))),
  );
  assert.ok(
    privateDuringPlay[0].master &&
      privateDuringPlay.every((x) => x.mine) &&
      privateDuringPlay.slice(1).every((x) => !x.master),
  );
  assert.equal(events.filter((e) => e.name === 'game_started').length, 1);
  async function dismiss(p) {
    await p.evaluate(() => {
      S.ov = [];
      render();
    });
  }
  for (const p of pages) await dismiss(p);
  // Three approved quests, all Success, then an actual Assassin pick via UI.
  for (let q = 0; q < 3; q++) {
    for (const p of pages)
      await p.waitForFunction((q) => S.game?.q === q && S.game.phase === 'propose', q);
    const g = await pages[0].evaluate(() => S.game);
    const leader = pages[Number(g.order[g.leader].slice(1))];
    for (const id of g.order.slice(0, g.quests[q].size))
      await leader.locator('[data-pick="' + id + '"]').click();
    await leader.locator('[data-a=propose]').click();
    await leader.locator('[data-a=confirmRun]').click();
    for (const p of pages) await p.waitForFunction(() => S.game.phase === 'vote');
    for (const p of pages) await p.locator('[data-vote="1"]').click();
    for (const p of pages) {
      await p.waitForFunction(() => S.game.phase === 'quest');
      await dismiss(p);
    }
    const team = await pages[0].evaluate(() => S.game.team);
    for (const id of team) {
      const p = pages[Number(id.slice(1))];
      await p.locator('[data-quest="S"]').click();
      await p.locator('[data-a=questSubmit]').click();
    }
    for (const p of pages) {
      await p.waitForFunction((q) => S.game.q > q || S.game.phase === 'assassin', q);
      await dismiss(p);
    }
  }
  const roles = await pages[0].evaluate(() => S.master.roles);
  const assassin =
    pages[
      Number(
        Object.keys(roles)
          .find((id) => roles[id] === 'assassin')
          .slice(1),
      )
    ];
  const merlin = Object.keys(roles).find((id) => roles[id] === 'merlin');
  await assassin.locator('[data-pick="' + merlin + '"]').click();
  await assassin.locator('[data-a=single]').click();
  await assassin.locator('[data-a=confirmRun]').click();
  for (const p of pages) await p.waitForFunction(() => S.game.status === 'end');
  assert.equal(events.filter((e) => e.name === 'game_completed').length, 1);
  for (const p of pages) await dismiss(p);
  await pages[0].locator('[data-a=again]').click();
  await pages[0].locator('[data-a=confirmRun]').click();
  for (const p of pages) await p.waitForFunction(() => S.game.status === 'lobby');
  assert.equal(events.filter((e) => e.name === 'rematch').length, 1);
  const privateBoundaries = await Promise.all(
    pages.map((p) => p.evaluate(() => ({ host: isHost(), master: !!S.master, mine: !!S.mine }))),
  );
  await pages[0].locator('[data-a=copy]').click();
  await pages[0].waitForFunction(
    () => !document.querySelector('#toast').classList.contains('hidden') || S.ui.qrOpen,
  );
  await pages[0].keyboard.press('Escape');
  await pages[0].locator('details.settings-advanced>summary').click();
  await pages[0].locator('[data-set=morgana]').click();
  await pages[0].locator('[data-set=lancelotSwitch]').click();
  await pages[0].locator('[data-a=start]').click();
  for (const p of pages) {
    await p.waitForFunction(() => S.game?.status === 'play' && S.mine?.role);
    await dismiss(p);
  }
  await pages[0].locator('[data-tool=host]').click();
  await pages[0].locator('#hostSuccessor').selectOption('p1');
  await pages[0].locator('[data-a=prepareHostTransfer]').click();
  await pages[0].locator('[data-a=transferHost]').click();
  for (const p of pages) await p.waitForFunction(() => S.game?.host === 'p1');
  await pages[1].waitForFunction(() => !!S.master?.roles);
  assert.equal(await pages[0].evaluate(() => S.master), null);
  assert.equal(events.filter((e) => e.name === 'game_started').length, 2);
  assert.equal(await pages[1].evaluate(() => S.master.lancelotDeck.length), 5);
  assert.equal(await pages[1].evaluate(() => Object.hasOwn(S.game.lancelot, 'deck')), false);
  // Play the first switched-Lancelot quest after handoff and verify the next hidden draw.
  const expanded = await pages[1].evaluate(() => S.game),
    leader = pages[Number(expanded.order[expanded.leader].slice(1))];
  for (const id of expanded.order.slice(0, expanded.quests[0].size))
    await leader.locator('[data-pick="' + id + '"]').click();
  await leader.locator('[data-a=propose]').click();
  await leader.locator('[data-a=confirmRun]').click();
  for (const p of pages) await p.waitForFunction(() => S.game.phase === 'vote');
  for (const p of pages) await p.locator('[data-vote="1"]').click();
  for (const p of pages) {
    await p.waitForFunction(() => S.game.phase === 'quest');
    await dismiss(p);
  }
  for (const id of await pages[1].evaluate(() => S.game.team)) {
    const p = pages[Number(id.slice(1))];
    const card = await p.evaluate(
      () =>
        questChoices(
          S.mine.role,
          S.game.q,
          S.mine.allegiance || side(S.mine.role),
          S.game.settings,
        )[0],
    );
    await p.locator('[data-quest="' + card + '"]').click();
    await p.locator('[data-a=questSubmit]').click();
  }
  for (const p of pages) {
    await p.waitForFunction(() => S.game.q === 1 && S.game.lancelot.draws.length === 2);
    assert.equal(await p.evaluate(() => Object.hasOwn(S.game.lancelot, 'deck')), false);
  }
  await pages[1].reload();
  await pages[1].waitForFunction(() => S.master?.lancelotDeck?.length === 5 && S.game.q === 1);
  const codeAfter = await pages[0].evaluate(() => S.code);
  assert.equal(code, codeAfter);
  console.log(
    JSON.stringify(
      {
        passed: true,
        sessions: 5,
        flow: 'create → 4 joins → atomic deal → host tab reopen → 3 quests → assassination → end → rematch → invitation → Lancelot variant → host transfer → private draw → successor refresh',
        events,
        privateDuringPlay,
        privateBoundaries,
        errors,
        backend: 'shared local simulation; not production Firebase',
      },
      null,
      2,
    ),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
