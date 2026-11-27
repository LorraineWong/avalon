import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readGameSource,readPublic} from './helpers/site.mjs';
import {elements} from './helpers/html.mjs';

const source=readGameSource(),context={window:{},URL};
vm.createContext(context);
vm.runInContext(readPublic('assets/js/locales.js'),context);
context.LOCALES=context.window.AvalonLocales;
context.validLanguage=value=>context.LOCALES.languages.some(l=>l.id===value)?value:'en';
context.extra=key=>context.LOCALES.packs[context.LANG].extra[key];
context.S={game:{code:'AB123'},ui:{}};
const events=[];context.recordEvent=(...args)=>events.push(args);
let manual=0;context.renderQRModal=()=>manual++;context.requestAnimationFrame=()=>{};
context.location={origin:'https://playavalonnow.com',pathname:'/',search:'?lang=ru&utm_source=private-nickname&secret=private-role',hash:'#OLD12'};
const messages=[];context.toast=message=>messages.push(message);context.t=()=> 'Copied';
context.ic=name=>'<svg aria-hidden="true" data-icon="'+name+'"></svg>';
vm.runInContext(source.slice(source.indexOf('function roomInviteUrl('),source.indexOf('function renderQRModal(')),context);

for(const {id} of context.LOCALES.languages){
  context.LANG=id;
  {
    const link=new URL(context.roomInviteUrl());
    assert.equal(link.origin,'https://playavalonnow.com');assert.equal(link.pathname,'/');
    assert.equal(link.hash,'#AB123');assert.equal(link.searchParams.get('lang'),id==='en'?null:id);
    assert.deepEqual([...link.searchParams.keys()],id==='en'?[]:['lang']);
    if(id==='en')assert.equal(link.href,'https://playavalonnow.com/#AB123');
    assert.doesNotMatch(link.href,/private-|OLD12/);
    assert.match(link.hash.slice(1).toUpperCase(),/^[A-Z0-9]{4,8}$/,'existing room parser accepts invite');
  }
  let payload;
  context.navigator={share:async data=>{payload=data;}};
  await context.shareRoomInvite();
  assert.equal(messages.pop(),context.extra('inviteShared'));
  assert.equal(payload.title,context.extra('inviteShareTitle'));assert.ok(payload.title.startsWith('🎭 Avalon Online — '));
  assert.equal(payload.text,payload.title+'\n\n'+context.extra('inviteShareText')+'\n');
  assert.ok(payload.text.includes('😈\n\n👇 '),'emoji and paragraph breaks retained');
  assert.doesNotMatch(payload.text,/https?:/,'URL passed once in the url field');
  assert.equal(payload.url,context.roomInviteUrl());
  assert.ok(!payload.title.includes('AB123')&&!payload.text.includes('AB123'),'room code confined to functional invitation URL');
  const buttons=elements(context.roomInviteActions(),'button');
  assert.deepEqual(buttons.map(b=>b['data-a']),['share','copy','qr']);
  assert.ok(buttons[0].class.split(' ').includes('pri'));
  assert.ok(!buttons[1].class.split(' ').includes('pri')&&buttons[1]['aria-label']&&buttons[1].title,'icon copy remains accessible');
  assert.deepEqual(elements(context.roomInviteActions(false),'button').map(b=>b['data-a']),['share','copy'],'QR dialog offers share and copy without recursive QR launcher');
  context.navigator={};
  const fallback=elements(context.roomInviteActions(),'button');
  assert.deepEqual(fallback.map(b=>b['data-a']),['copy','qr']);
  assert.ok(fallback[0].class.split(' ').includes('pri'),'copy is primary when native sharing is unavailable');
}

context.LANG='en';
let copied;
context.navigator={clipboard:{writeText:async text=>{copied=text;}}};
await context.copyRoomInvite();assert.equal(messages.pop(),'Copied');assert.equal(copied,context.roomInviteUrl());
await context.copyRoomCode();assert.equal(messages.pop(),context.extra('roomCodeCopied'));assert.equal(copied,'AB123');assert.equal(events.at(-1)[1].method,'code');
context.navigator.clipboard.writeText=async()=>{throw Error('denied');};
await context.copyRoomInvite();assert.equal(manual,1,'failure opens persistent manual copy');assert.equal(messages.length,0,'failed copy never reports success');
context.navigator={};context.copyRoomInvite();assert.equal(manual,2,'missing clipboard fallback');
for(const name of ['AbortError','NotAllowedError']){
  context.navigator={share:async()=>{throw Object.assign(Error(name),{name});}};
  await context.shareRoomInvite();
  if(name==='AbortError')assert.equal(messages.length,0,'cancel has no success or fallback');
  else assert.equal(manual,3,'share rejection offers manual URL');
}
context.navigator={share(){throw Error('unavailable');}};
context.shareRoomInvite();assert.equal(manual,4,'synchronous share failure');
assert.equal(messages.length,0);
assert.equal(context.LOCALES.packs.en.extra.inviteShareTitle,'🎭 Avalon Online — Join the Game!');
assert.equal(context.LOCALES.packs.en.extra.inviteShareText,'The room is ready! Gather your friends for a game of strategy, deduction, and deception. 😈\n\n👇 Join the room:');
console.log('Invites: nine languages, short URLs, full multiline native payloads, primary share/accessible copy, no-share fallback, clipboard success/failure and native cancellation/failure.');
