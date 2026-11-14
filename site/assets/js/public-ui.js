/* Shared navigation and language preference for every public content page. */
(() => {
  const path=location.pathname;
  const named=path.match(/\/(how-to-play|privacy-policy|terms|about)\/(en|zh-cn|zh-tw|ru|es|pt|vi)\/(?:index.html)?$/);
  const base=new URL(named?'../../':'../',location.href);
  const kind=named?({'how-to-play':'guide','privacy-policy':'privacy',terms:'legal',about:'support'}[named[1]]):path.includes('/support/')?'support':path.includes('/privacy/')?'privacy':path.includes('/unofficial-notice/')?'legal':'guide';
  const registry=window.AvalonLocales;
  const labels={zh:['首页','玩法指南','隐私政策','使用条款与声明'],en:['Home','How to play','Privacy Policy','Terms & Notices']};
  let saved; try { saved=JSON.parse(localStorage.getItem('lwav.lang')||'null'); } catch {}
  const languageRoute=named?.[2];
  let lang=languageRoute?registry.languages.find(x=>x.route===languageRoute).id:kind==='guide'?(registry.languages.find(x=>path.endsWith('/'+x.route+'/')||path.endsWith('/'+x.route+'/index.html'))?.id || 'en'):(registry.languages.some(x=>x.id===saved)?saved:'en');
  if(!named){location.replace(new URL(AvalonShell.pagePath(kind,lang)+location.hash,base).href);return;}
  function render(){
    const l=registry.packs[lang]?.shell || labels[lang];
    // A shared guide URL also establishes the language for linked public pages.
    try {localStorage.setItem('lwav.lang',JSON.stringify(lang));} catch {}
    const oldNav=document.querySelector('body>nav, body>.av-header');
    oldNav.outerHTML=AvalonShell.header(lang,base.href,kind);
    document.querySelector('[data-site-language]').onchange=e=>{const next=e.target.value;try{localStorage.setItem('lwav.lang',JSON.stringify(next));}catch{}location.href=new URL(AvalonShell.pagePath(kind,next)+location.hash,base).href;};
    if(kind==='support'){
      document.querySelector('main').innerHTML=window.AvalonProject.render(lang);
      document.querySelector('main').classList.add('project-page');
      document.title=window.AvalonProject.title(lang)+' | Avalon Online';
    } else if(kind!=='guide'){
      document.querySelector('main').innerHTML=window.AvalonPolicies.get(lang,kind);
      document.querySelector('main h1').textContent=l[kind==='privacy'?2:3];
      if(kind==='legal'){
        document.querySelector('#project-credits')?.remove();
        const credits=registry.credits[lang]||registry.credits.en;
        document.querySelector('main').insertAdjacentHTML('beforeend','<section id="project-credits"><h2>'+credits.title+'</h2><p>'+credits.text+'</p></section>');
      }
      if(kind==='privacy'){document.querySelector('#privacy-additions')?.remove();document.querySelector('main').insertAdjacentHTML('beforeend','<section id="privacy-additions">'+(window.AvalonPrivacyAdditions?.[lang]||'')+'</section>');}
      document.title=l[kind==='privacy'?2:3]+' | Avalon Online';
    }
    if(kind==='privacy'||kind==='legal') decoratePolicy();
    document.documentElement.lang=registry.languages.find(x=>x.id===lang).tag;
    document.querySelector('footer').outerHTML=AvalonShell.footer(lang,base.href);
  }
  function decoratePolicy(){
    const main=document.querySelector('main');
    const headings=[...main.querySelectorAll('h2')];
    const nav=document.createElement('nav');nav.className='policy-toc';
    nav.setAttribute('aria-label',registry.packs[lang].shell[kind==='privacy'?2:3]);
    headings.forEach((heading,i)=>{heading.id='section-'+(i+1);const a=document.createElement('a');a.href='#'+heading.id;a.textContent=String(i+1).padStart(2,'0')+' · '+heading.textContent;nav.append(a);});
    main.querySelector('h1').insertAdjacentElement('afterend',nav);
    main.classList.add('policy-page');
  }
  render();
  if(kind==='guide'){
    const bar=document.querySelector('.guide-jump'), links=[...bar.querySelectorAll('.guide-sections a')];
    const sections=links.map(link=>document.querySelector(link.getAttribute('href')));
    let queued=false, active;
    function updateSection(){
      queued=false;
      const edge=bar.getBoundingClientRect().bottom+80;
      let index=0;
      sections.forEach((section,i)=>{if(section?.getBoundingClientRect().top<=edge)index=i;});
      if(scrollY+innerHeight>=document.documentElement.scrollHeight-2)index=links.length-1;
      if(active===index)return; active=index;
      links.forEach((link,i)=>{if(i===index)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
      const selected=links[index], rail=selected.parentElement;
      if(selected.offsetLeft<rail.scrollLeft || selected.offsetLeft+selected.offsetWidth>rail.scrollLeft+rail.clientWidth){
        rail.scrollTo({left:Math.max(0,selected.offsetLeft-rail.offsetLeft-8),behavior:'auto'});
      }
    }
    addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateSection);}},{passive:true});
    addEventListener('resize',updateSection);
    updateSection();
  }
})();
