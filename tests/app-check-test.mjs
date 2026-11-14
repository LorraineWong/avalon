import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readPublic,readGameSource} from './helpers/site.mjs';
const configSource=readPublic('config/app-check.js'),source=readPublic('assets/js/app-check.js');
function boot(host='avalon.lorrainewong.dev',{missing=false,blank=false}={}){
 const calls=[],window={},context={window,location:{hostname:host}};
 vm.runInNewContext(configSource,context);
 if(blank)window.AvalonAppCheckConfig={...window.AvalonAppCheckConfig,siteKey:''};
 vm.runInNewContext(source,context);
 function appCheck(){calls.push('appCheck');return {activate(provider,refresh){calls.push({key:provider.key,refresh});}};}
 appCheck.ReCaptchaEnterpriseProvider=class{constructor(key){this.key=key;}};
 return {calls,window,sdk:missing?{}:{appCheck}};
}
for(const host of ['avalon.lorrainewong.dev','lorrainewong.github.io']){
 const b=boot(host);assert.equal(b.window.AvalonAppCheck.activate(b.sdk),true);
 assert.equal(b.calls[1].key,b.window.AvalonAppCheckConfig.siteKey);assert.equal(b.calls[1].refresh,true);
 assert.equal(b.window.AvalonAppCheck.activate(b.sdk),true);assert.equal(b.calls.length,2,'activate once');
}
for(const host of ['localhost','127.0.0.1','evil.example','preview.workers.dev']){
 const b=boot(host);assert.equal(b.window.AvalonAppCheck.activate(b.sdk),false);assert.equal(b.calls.length,0);
}
const blank=boot(undefined,{blank:true});assert.equal(blank.window.AvalonAppCheck.activate(blank.sdk),false);
const missing=boot(undefined,{missing:true});assert.throws(()=>missing.window.AvalonAppCheck.activate(missing.sdk),/SDK is unavailable/);
const game=readGameSource();
assert.ok(game.indexOf('firebase.initializeApp(FIREBASE_CONFIG)')<game.indexOf('window.AvalonAppCheck.activate(firebase)'));
assert.ok(game.indexOf('window.AvalonAppCheck.activate(firebase)')<game.indexOf('this.auth=firebase.auth()'));
assert.doesNotMatch(source+configSource,/FIREBASE_APPCHECK_DEBUG_TOKEN|debugToken|CustomProvider/);
console.log('App Check: real Enterprise provider, auto-refresh, one-time activation, exact production hosts, no shipped debug bypass, before service access.');
