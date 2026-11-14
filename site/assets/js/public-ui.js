/* Shared navigation and language preference for every public content page. */
(() => {
  const path=location.pathname, base=new URL('../',location.href);
  const kind=path.includes('/support/')?'support':path.includes('/privacy/')?'privacy':path.includes('/unofficial-notice/')?'legal':'guide';
  const registry=window.AvalonLocales;
  const labels={zh:['首页','玩法指南','隐私政策','使用条款与声明'],en:['Home','How to play','Privacy Policy','Terms & Notices']};
  let saved; try { saved=JSON.parse(localStorage.getItem('lwav.lang')||'null'); } catch {}
  let lang=kind==='guide'?(registry.languages.find(x=>path.endsWith('/'+x.route+'/')||path.endsWith('/'+x.route+'/index.html'))?.id || 'en'):(registry.languages.some(x=>x.id===saved)?saved:'en');
  const originals=document.querySelector('main').innerHTML;
  const english={privacy:`<h1>Privacy notice</h1><p>Updated 14 November 2026. Avalon Online is a free, unofficial fan project. No email address or real name is required.</p><h2>Data used to run a game</h2><p>Firebase Anonymous Authentication and Realtime Database process an anonymous user ID, your chosen nickname, room membership, online presence, public game state, and encrypted role and action payloads. Do not enter sensitive information.</p><h2>Browser storage</h2><p>Your decryption private key, nickname, language, display theme, last room code, and private deduction notes stay in this browser’s localStorage. Notes are not uploaded or shared with the host. Anyone using this browser may see them. Clear notes in the game or delete this site’s browser data.</p><h2>Retention</h2><p>New rooms carry a 72-hour expiry marker; completed games use a 24-hour marker. The host client removes expired rooms when it reconnects. Old data may also be removed during maintenance. These markers do not guarantee scheduled deletion or archival.</p><h2>Third parties and tracking</h2><p>The site has no advertising trackers and does not sell player data. Firebase and the font provider may process necessary network information such as IP addresses under their policies.</p><h2>Security and contact</h2><p>Roles and actions are encrypted, but the host browser remains trusted to run the game. This does not protect against a compromised host or modified client. Report privacy or security concerns privately through the repository’s Security → Report a vulnerability feature. Do not post room data in public issues.</p><h2>Services, storage and policy updates</h2><p>Realtime Database is hosted in Asia Southeast (asia-southeast1). Fonts are served by Google Fonts (fonts.googleapis.com and fonts.gstatic.com). These providers may process IP addresses and necessary service data under their own policies.</p><p>The application code contains no analytics or advertising trackers and does not itself set cookies. Site preferences and notes use localStorage; Firebase may additionally use browser storage for authentication. This statement does not guarantee that hosting or third-party services never use cookies.</p><p>This policy may be updated; the last-updated date reflects changes. For private security reports use GitHub Security.</p>`,legal:`<h1>Unofficial project notice</h1><p>Updated 14 November 2026.</p><p>Avalon Online is a free fan project. It is not affiliated with, authorized by, sponsored, or endorsed by the designers, publishers, or other rights holders of The Resistance: Avalon.</p><h2>Names and intellectual property</h2><p>Game names, characters, and settings belong to their respective owners. This project does not claim ownership of them or provide an official replacement licence.</p><h2>Original materials</h2><p>The code and interface were developed for this project; site images were generated with GPT. No official card artwork is used.</p><h2>Free play and voluntary support</h2><p>Core gameplay is free. Optional voluntary support only helps cover site and development costs; it does not unlock gameplay or sell or license the original game’s content.</p><h2>Support the official game</h2><p>Please support the original board game and its creators.</p><h2>Rights-holder contact</h2><p>Rights holders may contact the maintainer through the project’s GitHub repository to raise concerns about names, descriptions, or materials.</p><h2>Availability and age</h2><p>Intended for users aged 13 and over. The service may be changed, paused or discontinued at any time.</p><h2>No warranty and limitation of liability</h2><p>The service is provided “as is” and “as available”, without warranties of any kind, express or implied, to the extent permitted by applicable law. To that extent, the project maintainers are not liable for losses or damages arising from use of, or inability to use, the service. Nothing excludes rights or liability that cannot legally be excluded.</p><h2>Optional donations</h2><p>If enabled, donations are voluntary, unlock no features and cover hosting and development costs only. Payments are processed by Ko-fi and its payment providers. Payment and refund terms are shown by the provider and remain subject to applicable law.</p><h2>Contact</h2><p>Rights holders may contact the project through GitHub. No licence to third-party game names, artwork or concepts is granted.</p>`};
  function render(){
    const l=registry.packs[lang]?.shell || labels[lang];
    // A shared guide URL also establishes the language for linked public pages.
    try {localStorage.setItem('lwav.lang',JSON.stringify(lang));} catch {}
    const oldNav=document.querySelector('body>nav, body>.av-header');
    oldNav.outerHTML=AvalonShell.header(lang,base.href,kind);
    document.querySelector('[data-site-language]').onchange=e=>{lang=e.target.value;try{localStorage.setItem('lwav.lang',JSON.stringify(lang));}catch{}if(kind==='guide')location.href=new URL(registry.languages.find(x=>x.id===lang).route+'/',base).href;else render();};
    if(kind==='support'){
      document.querySelector('main').innerHTML=window.AvalonProject.render(lang);
      document.title=window.AvalonProject.title(lang)+' | Avalon Online';
    } else if(kind!=='guide'){
      document.querySelector('main').innerHTML=registry.packs[lang]?.policies?.[kind] || (lang==='en'?english[kind]:originals);
      document.querySelector('main h1').textContent=l[kind==='privacy'?2:3];
      if(kind==='legal'&&!registry.packs[lang]?.policies) document.querySelector('main').insertAdjacentHTML('beforeend',lang==='en'?'<h2>Using the service</h2><p>Use a game nickname and treat other players respectfully. Do not interfere with other rooms, exploit vulnerabilities, or share another player’s private information. The service depends on network connectivity and may be interrupted for maintenance.</p>':'<h2>使用服务</h2><p>请使用游戏昵称、尊重其他玩家，不干扰其他房间、不利用漏洞，也不分享他人的私人资料。服务依赖网络连接，维护期间可能中断。</p>');
      if(kind==='legal'){
        document.querySelector('#project-credits')?.remove();
        const credits=registry.credits[lang]||registry.credits.en;
        document.querySelector('main').insertAdjacentHTML('beforeend','<section id="project-credits"><h2>'+credits.title+'</h2><p>'+credits.text+'</p></section>');
      }
      if(kind==='privacy'){document.querySelector('#privacy-additions')?.remove();document.querySelector('main').insertAdjacentHTML('beforeend','<section id="privacy-additions">'+(window.AvalonPrivacyAdditions?.[lang]||'')+'</section>');}
      document.title=l[kind==='privacy'?2:3]+' | Avalon Online';
    }
    document.documentElement.lang=registry.languages.find(x=>x.id===lang).tag;
    document.querySelector('footer').outerHTML=AvalonShell.footer(lang,base.href);
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
