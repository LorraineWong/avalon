import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { elements } from './helpers/html.mjs';

const root=new URL('../',import.meta.url);
const projectSource=readFileSync(new URL('assets/js/project.js',root),'utf8');
const localeSource=readFileSync(new URL('assets/js/locales.js',root),'utf8');
function project(source=projectSource){
  const context={window:{},URL};
  vm.runInNewContext(localeSource,context);
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
  assert.equal(links.length,3,id+' no payment link before activation');
  assert.doesNotMatch(html,/mailto:|<iframe|<script|<form/i,id+' no email, payment embed or form');
  assert.match(html,/Claude Code/);assert.match(html,/OpenAI Codex/);assert.match(html,/GPT/);
}
assert.equal(window.AvalonProject.title('unknown'),window.AvalonProject.title('en'));
for(const url of ['javascript:alert(1)','http://example.com','https://user:pass@example.com','not a URL']){
  const invalid=project(projectSource.replace("support: ''","support: "+JSON.stringify(url))).AvalonProject.render('en');
  assert.equal(elements(invalid,'a').length,3,'unsafe payment URL must stay hidden');
}
const enabled=project(projectSource.replace("support: ''",`support: 'https://example.com/support?note=%22%3E%3Cscript%3E'`)).AvalonProject.render('en');
assert.equal(elements(enabled,'a').length,4,'approved HTTPS payment page can be enabled');
assert.ok(elements(enabled,'a').some(l=>l.href.startsWith('https://example.com/')));
assert.match(enabled,/external payment provider/);
const page=readFileSync(new URL('support/index.html',root),'utf8');
assert.match(page,/Financial support is not open yet/,'static fallback matches pending payment state');
for(const file of ['assets/js/site-shell.js','assets/js/app.js'])assert.match(readFileSync(new URL(file,root),'utf8'),/support\//,file+' discovers support route');
console.log('Project page: seven languages, approved social links, pending payment state, safe external URLs and static fallback.');
