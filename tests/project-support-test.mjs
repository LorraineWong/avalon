import {readPublic} from './helpers/site.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { elements } from './helpers/html.mjs';

const root=new URL('../',import.meta.url);
const projectSource=readPublic('assets/js/project.js');
const localeSource=readPublic('assets/js/locales.js');
function project(source=projectSource){
  const context={window:{},URL};
  vm.runInNewContext(localeSource,context);
  vm.runInNewContext(readPublic('assets/js/project-copy.js'),context);
  vm.runInNewContext(source,context);
  return context.window;
}
const window=project();
for(const {id} of window.AvalonLocales.languages){
  const html=window.AvalonProject.render(id);
  assert.ok(window.AvalonProject.title(id).trim(),id+' title');
  assert.equal(elements(html,'h1').length,1,id+' single page heading');
  assert.equal(elements(html,'h2').length,4,id+' story/support/contact/credits');
  const links=elements(html,'a');
  assert.ok(links.some(l=>l.href==='https://github.com/LorraineWong'),id+' approved GitHub profile');
  assert.ok(links.some(l=>l.href==='https://www.linkedin.com/in/lorrainewongyiting/'),id+' approved LinkedIn profile');
  assert.ok(links.some(l=>l.href.endsWith('/security/advisories/new')),id+' private reporting');
  assert.ok(links.every(l=>l.target==='_blank'&&l.rel==='noopener noreferrer'),id+' external links');
  assert.equal(links.length,4,id+' verified payment link is active');
  assert.doesNotMatch(html,/mailto:|<iframe|<script|<form/i,id+' no email, payment embed or form');
  assert.match(html,/Claude Code/);assert.match(html,/OpenAI Codex/);assert.match(html,/GPT/);
}
assert.equal(window.AvalonProject.title('unknown'),window.AvalonProject.title('en'));
for(const url of ['javascript:alert(1)','http://example.com','https://user:pass@example.com','not a URL']){
  const invalid=project(projectSource.replace("support: 'https://ko-fi.com/lorrainewong'","support: "+JSON.stringify(url))).AvalonProject.render('en');
  assert.equal(elements(invalid,'a').length,3,'unsafe payment URL must stay hidden');
}
const enabled=project(projectSource.replace("support: 'https://ko-fi.com/lorrainewong'",`support: 'https://example.com/support?note=%22%3E%3Cscript%3E'`)).AvalonProject.render('en');
assert.equal(elements(enabled,'a').length,4,'approved HTTPS payment page can be enabled');
assert.ok(elements(enabled,'a').some(l=>l.href.startsWith('https://example.com/')));
assert.match(enabled,/external payment provider/);
const page=readPublic('support/index.html');
assert.match(page,/https:\/\/ko-fi\.com\/lorrainewong/,'static fallback links the approved support page');
for(const file of ['assets/js/site-shell.js','assets/js/app.js'])assert.match(readPublic(file),/support\//,file+' discovers support route');
console.log('Project page: seven languages, approved social links, pending payment state, safe external URLs and static fallback.');
