/* Named, language-specific static pages. Legacy source routes remain compatible. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
function setMetadata(html,attribute,name,value){
  const tag='<meta '+attribute+'="'+name+'" content="'+value+'" />';
  const existing=new RegExp('<meta\\b[^>]*\\b'+attribute+'="'+name+'"[^>]*>');
  return existing.test(html)?html.replace(existing,()=>tag):html.replace('</head>',tag+'\n</head>');
}
export function writeContentPages(root,out){
  const context={window:{matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}},URL,localStorage:{getItem:()=>null},document:{documentElement:{lang:'en',dataset:{}},querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}}};
  vm.createContext(context);
  for(const name of ['locales','project-copy','policy-copy','policy-pages'])vm.runInContext(readFileSync(path.join(root,'site/language/'+name+'.js'),'utf8'),context);
  vm.runInContext(readFileSync(path.join(root,'site/assets/js/project.js'),'utf8'),context);
  vm.runInContext(readFileSync(path.join(root,'site/assets/js/guide.js'),'utf8'),context);
  vm.runInContext(readFileSync(path.join(root,'site/assets/js/site-shell.js'),'utf8'),context);
  const searchCopy=JSON.parse(readFileSync(path.join(root,'site/language/seo-copy.json'),'utf8'));
  const escape=value=>value.replaceAll('&','&amp;').replaceAll('\"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const {AvalonShell:shell,AvalonLocales:registry,AvalonPolicies:policies,AvalonProject:project,AvalonPrivacyAdditions:additions}=context.window;
  const origin='https://playavalonnow.com/';
  const names={guide:'how-to-play',privacy:'privacy-policy',legal:'terms',support:'about'};
  const items=[];
  for(const language of registry.languages){
    for(const [kind,name] of Object.entries(names)){
      const {id,tag,route}=language;
      const source=kind==='guide'?'site/language/'+route+'/index.html':'site/pages/'+({privacy:'privacy',legal:'unofficial-notice',support:'support'}[kind])+'/index.html';
      let html=readFileSync(path.join(root,source),'utf8');
      const unused=kind==='guide'?['project-copy','project','policy-copy','policy-pages']:kind==='support'?['policy-copy','policy-pages']:['project-copy','project'];
      html=html.replace(/<script\b[^>]*src="[^"]*\/([^/"]+)\.js(?:\?[^"]*)?"[^>]*><\/script>\s*/g,(tag,file)=>unused.includes(file)?'':tag);
      const copy=searchCopy[id]?.[kind];
      if(!copy?.title?.trim()||!copy?.description?.trim())throw Error('Missing search copy: '+id+'/'+kind);
      const title=escape(copy.title+' | PlayAvalonNow'), description=escape(copy.description);
      html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+title+'</title>');
      html=setMetadata(html,'name','description',description);
      if(kind==='guide'){
        const guide=context.window.AvalonGuide;
        html=html.replace('<!-- guide:modules -->',guide.modules(id));
        html=html.replace('<!-- guide:players -->',guide.players(id));
        html=html.replace('<!-- guide:player-note -->',guide.copy(id).hint);
        // Legacy guides remain readable without JS as well as redirect-compatible.
        writeFileSync(path.join(out,route,'index.html'),html);
      }
      const dest=name+'/'+route+'/';
      if(kind!=='guide'){
        let content=kind==='support'?project.render(id):policies.get(id,kind);
        if(kind!=='support')content=content.replace(/<h1>[\s\S]*?<\/h1>/,'<h1>'+escape(registry.packs[id].shell[{privacy:2,legal:3}[kind]])+'</h1>');
        if(kind==='privacy')content+='<section id="privacy-additions">'+additions[id]+'</section>';
        html=html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/,'<main class="wrap legal-main'+(kind==='support'?' project-page':'')+'">'+content+'</main>');
      }
      html=html.replace(/<html lang="[^"]*">/,'<html lang="'+tag+'">');
      html=html.replace(/<link rel="canonical"[^>]*>/,'<link rel="canonical" href="'+origin+dest+'" />');
      const socialTitle=title, socialDescription=description;
      for(const [attribute,name,value] of [
        ['property','og:site_name','PlayAvalonNow'],['property','og:locale',({en:'en_US','zh-CN':'zh_CN','zh-TW':'zh_TW',ru:'ru_RU',es:'es_ES',pt:'pt_PT',vi:'vi_VN',ja:'ja_JP',ko:'ko_KR'}[tag])],['property','og:url',origin+dest],['property','og:title',socialTitle],
        ['property','og:description',socialDescription],['name','twitter:title',socialTitle],
        ['name','twitter:description',socialDescription]
      ])html=setMetadata(html,attribute,name,value);
      html=html.replace(/<link rel="alternate"[^>]*>/g,'');
      html=html.replace('</head>',registry.languages.map(l=>'<link rel="alternate" hreflang="'+l.tag+'" href="'+origin+name+'/'+l.route+'/" />').join('\n')+'\n<link rel="alternate" hreflang="x-default" href="'+origin+name+'/en/" />\n</head>');
      // All source documents live one directory below root; named pages live two below.
      html=html.replace(/((?:href|src)=")\.\.\//g,'$1../../');
      // Static play links keep the current language, even without JavaScript.
      html=html.replace(/href="\.\.\/\.\.\/"/g,'href="../../?lang='+id+'"');
      html=html.replace(/<body>\s*<nav\b[\s\S]*?<\/nav>/,'<body>'+shell.header(id,'../../',kind));
      html=html.replace(/<footer>[\s\S]*?<\/footer>/,shell.footer(id,'../../'));
      const target=path.join(out,dest,'index.html');mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,html);items.push(dest);
    }
  }
  // Page-name roots have a useful default even when typed without a language.
  for(const name of Object.values(names)){
    const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Avalon Online</title><link rel="canonical" href="'+origin+name+'/en/"><meta http-equiv="refresh" content="0;url=en/"></head><body><p><a href="en/">Continue to Avalon Online</a></p><script>let lang="en";try{lang=JSON.parse(localStorage.getItem("lwav.lang"))||"en";}catch{}const routes={en:"en",zh:"zh-cn","zh-TW":"zh-tw",ru:"ru",es:"es",pt:"pt",vi:"vi",ja:"ja",ko:"ko"};location.replace((routes[lang]||"en")+"/"+location.hash);</script></body></html>';
    writeFileSync(path.join(out,name,'index.html'),html);
  }
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+['',...items].map(dest=>'  <url><loc>'+origin+dest+'</loc></url>').join('\n')+'\n</urlset>\n';
  writeFileSync(path.join(out,'sitemap.xml'),xml);
  return items.length+Object.keys(names).length;
}
