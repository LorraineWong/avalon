import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readGameSource,readPublic} from './helpers/site.mjs';

const source=readGameSource(),context={window:{},URL};
vm.createContext(context);
vm.runInContext(readPublic('assets/js/locales.js'),context);
context.LOCALES=context.window.AvalonLocales;
context.validLanguage=value=>context.LOCALES.languages.some(l=>l.id===value)?value:'en';
context.extra=key=>context.LOCALES.packs[context.LANG].extra[key];
context.S={game:{code:'AB123'}};
context.location={origin:'https://playavalonnow.com',pathname:'/',search:'?lang=ru&utm_source=private-nickname&secret=private-role',hash:'#OLD12'};
const messages=[];context.toast=message=>messages.push(message);context.t=()=> 'Copied';
vm.runInContext(source.slice(source.indexOf('function roomInviteUrl('),source.indexOf('function renderQRModal(')),context);

for(const {id} of context.LOCALES.languages){
  context.LANG=id;
  for(const [method,medium] of Object.entries({copy:'copy_link',share:'native_share',qr:'qr_code'})){
    const link=new URL(context.roomInviteUrl(method));
    assert.equal(link.origin,'https://playavalonnow.com');assert.equal(link.pathname,'/');
    assert.equal(link.hash,'#AB123');assert.equal(link.searchParams.get('lang'),id);
    assert.deepEqual([...link.searchParams.keys()],['lang','utm_source','utm_medium','utm_campaign']);
    assert.equal(link.searchParams.get('utm_source'),'invite');assert.equal(link.searchParams.get('utm_medium'),medium);
    assert.equal(link.searchParams.get('utm_campaign'),'room_invite');
    assert.doesNotMatch(link.href,/private-|OLD12/);
    assert.match(link.hash.slice(1).toUpperCase(),/^[A-Z0-9]{4,8}$/,'existing room parser accepts invite');
  }
  let payload;
  context.navigator={share:async data=>{payload=data;}};
  await context.shareRoomInvite();
  assert.equal(payload.title,context.extra('inviteShareTitle'));assert.ok(payload.title.includes('PlayAvalonNow'));
  assert.equal(payload.text,context.extra('inviteShareText'));assert.ok(payload.text.includes('5–10'));
  assert.ok(!payload.title.includes('AB123')&&!payload.text.includes('AB123'),'room code confined to functional invitation URL');
}

context.LANG='en';
let copied;
context.navigator={clipboard:{writeText:async text=>{copied=text;}}};
await context.copyRoomInvite();assert.equal(messages.pop(),'Copied');assert.equal(copied,context.roomInviteUrl('copy'));
context.navigator.clipboard.writeText=async()=>{throw Error('denied');};
await context.copyRoomInvite();assert.equal(messages.pop(),context.roomInviteUrl('copy'),'failure offers manual URL, never a success message');
context.navigator={};context.copyRoomInvite();assert.equal(messages.pop(),context.roomInviteUrl('copy'),'missing clipboard fallback');
for(const name of ['AbortError','NotAllowedError']){
  context.navigator={share:async()=>{throw Object.assign(Error(name),{name});}};
  await context.shareRoomInvite();
  if(name==='AbortError')assert.equal(messages.length,0,'cancel has no success or fallback');
  else assert.equal(messages.pop(),context.roomInviteUrl('share'),'share rejection offers manual URL');
}
context.navigator={share(){throw Error('unavailable');}};
context.shareRoomInvite();assert.equal(messages.pop(),context.roomInviteUrl('share'),'synchronous share failure');
assert.equal(messages.length,0);
console.log('Invites: nine languages, controlled channel URLs, hash routing, localized native payloads, clipboard success/failure and native cancellation/failure.');
