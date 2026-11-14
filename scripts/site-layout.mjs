import {readdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export const repositoryRoot=fileURLToPath(new URL('../',import.meta.url));
export const languages=['en','zh-cn','zh-tw','ru','es','pt','vi'];
export const entries=[
 ['site/index.html','index.html'],['site/assets','assets'],['site/vendor','vendor'],['site/config','config'],
 ...['locales','game-base','project-copy','policy-copy'].map(name=>['site/language/'+name+'.js','assets/js/'+name+'.js']),
 ...languages.map(lang=>['site/language/'+lang,lang]),
 ...['privacy','unofficial-notice','support'].map(page=>['site/pages/'+page,page]),
 ['site/pwa/service-worker.js','service-worker.js'],['site/pwa/manifest.webmanifest','manifest.webmanifest'],
 ['site/meta/robots.txt','robots.txt'],['site/meta/sitemap.xml','sitemap.xml'],['dev','dev'],
 ['docs/README.md','docs/README.md'],['docs/licenses','docs/licenses'],['docs/screenshots','docs/screenshots'],
 ...['development','game','operations','policies'].flatMap(group=>readdirSync(path.join(repositoryRoot,'docs',group)).filter(name=>name.endsWith('.md')).map(name=>['docs/'+group+'/'+name,'docs/'+name])),
 ...['README.md','README.zh-CN.md','CONTRIBUTING.md','AGENTS.md','CLAUDE.md','LICENSE','NOTICE'].map(name=>[name,name])
];
if(existsSync(path.join(repositoryRoot,'site/meta/CNAME')))entries.push(['site/meta/CNAME','CNAME']);
export function sourceForPublic(publicPath){
 const clean=publicPath.replace(/^\.\//,'').replace(/\/$/,'');
 const match=entries.filter(([,dest])=>clean===dest||clean.startsWith(dest+'/')).sort((a,b)=>b[1].length-a[1].length)[0];
 if(!match)throw Error('Unmapped public path: '+publicPath);
 return path.join(repositoryRoot,match[0],clean.slice(match[1].length));
}
export function publicForSource(source){
 const clean=path.relative(repositoryRoot,source).split(path.sep).join('/');
 const match=entries.filter(([origin])=>clean===origin||clean.startsWith(origin+'/')).sort((a,b)=>b[0].length-a[0].length)[0];
 return match?match[1]+clean.slice(match[0].length):null;
}
