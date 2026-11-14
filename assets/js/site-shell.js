window.AvalonShell = (() => {
  const registry=window.AvalonLocales;
  const pack=lang=>registry?.packs[lang];
  const locale=lang=>registry?.languages.find(x=>x.id===lang);
  const currentLanguage=()=>registry?.languages.find(x=>x.tag===document.documentElement.lang)?.id || (document.documentElement.lang.startsWith('zh')?'zh':'en');
  const systemTheme=window.matchMedia('(prefers-color-scheme: dark)');
  let preference=null;
  try { const saved=JSON.parse(localStorage.getItem('lwav.theme')||'null'); if(saved==='light'||saved==='dark') preference=saved; } catch {}
  const theme=()=>preference || (systemTheme.matches?'dark':'light');
  function themeLabel(lang){return pack(lang)?.extra.darkMode || (lang==='zh'?'深色模式':'Dark mode');}
  function themeTitle(lang,dark){return pack(lang)?.extra[dark?'lightMode':'switchDark'] || (lang==='zh'?(dark?'切换浅色模式':'切换深色模式'):(dark?'Switch to light mode':'Switch to dark mode'));}
  function applyTheme(){
    const dark=theme()==='dark';
    document.documentElement.dataset.theme=theme();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#18212b':'#f6f3eb');
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
      const lang=currentLanguage();
      button.setAttribute('aria-pressed',String(dark));
      button.setAttribute('aria-label',themeLabel(lang));
      button.title=themeTitle(lang,dark);
    });
  }
  function themeControl(lang){
    const dark=theme()==='dark', title=themeTitle(lang,dark);
    return '<button type="button" class="theme-toggle" data-theme-toggle aria-label="'+themeLabel(lang)+'" aria-pressed="'+dark+'" title="'+title+'"><svg class="theme-sun" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg><svg class="theme-moon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20.5 14.5A9 9 0 0 1 9.5 3.5a9 9 0 1 0 11 11Z"/></svg></button>';
  }
  applyTheme();
  systemTheme.addEventListener('change',()=>{if(!preference) applyTheme();});
  window.addEventListener('storage',event=>{if(event.key==='lwav.theme'||event.key===null){try { const saved=JSON.parse(localStorage.getItem('lwav.theme')||'null'); preference=['light','dark'].includes(saved)?saved:null; } catch {preference=null;} applyTheme();}});
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-theme-toggle]')){
      preference=theme()==='dark'?'light':'dark';
      try {localStorage.setItem('lwav.theme',JSON.stringify(preference));} catch {}
      applyTheme();
      return;
    }
    const opener=event.target.closest('[data-mobile-menu]');
    if(opener) openMenu(opener);
  });
  const languages=registry?.languages || [{id:'zh',label:'简中',name:'简体中文',tag:'zh-CN'},{id:'en',label:'EN',name:'English',tag:'en'}];
  const languageFlags={en:'🇬🇧',zh:'🇨🇳','zh-TW':'🇹🇼',ru:'🇷🇺',es:'🇪🇸',pt:'🇵🇹',vi:'🇻🇳'};
  function languageControl(lang,id=''){
    const label=pack(lang)?.extra.language || 'Language / 语言';
    return '<label class="language-picker compact-language" title="'+label+'"><select '+(id?'id="'+id+'"':'data-site-language')+' aria-label="'+label+'">'+languages.map(x=>'<option value="'+x.id+'" aria-label="'+x.name+'" lang="'+x.tag+'"'+(lang===x.id?' selected':'')+'>'+languageFlags[x.id]+' '+(lang===x.id?x.label:x.name)+'</option>').join('')+'</select></label>';
  }
  const words={zh:['首页','玩法指南','隐私政策','使用条款与声明','阿瓦隆 · 在线版','免费非官方粉丝项目。请支持正版桌游。'],en:['Home','How to Play','Privacy Policy','Terms & Notices','Avalon · Online','Free unofficial fan project. Please support the official board game.']};
  const menuWords={
    en:['Menu','Close menu','Appearance','Project credits','Links open in a new tab so your room stays open.'],
    zh:['菜单','关闭菜单','外观','制作说明','链接会在新标签页打开，保留当前房间。'],
    'zh-TW':['選單','關閉選單','外觀','製作說明','連結會在新分頁開啟，保留目前房間。'],
    ru:['Меню','Закрыть меню','Оформление','О проекте','Ссылки открываются в новой вкладке; комната останется открытой.'],
    es:['Menú','Cerrar menú','Apariencia','Créditos','Los enlaces se abren en otra pestaña para mantener tu sala abierta.'],
    pt:['Menu','Fechar menu','Aparência','Créditos','Os links abrem noutra aba para manter a sala aberta.'],
    vi:['Trình đơn','Đóng trình đơn','Giao diện','Thông tin dự án','Liên kết mở trong thẻ mới để giữ phòng hiện tại.']
  };
  const menuIcon='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  function menuControl(lang,base,current='',inRoom=false){
    const w=menuWords[lang]||menuWords.en;
    const open=Boolean(document.getElementById?.('av-mobile-menu')?.open);
    return '<button type="button" id="site-menu-toggle" class="mobile-menu-toggle" data-mobile-menu data-menu-lang="'+lang+'" data-menu-base="'+base+'" data-menu-current="'+current+'" data-menu-room="'+inRoom+'" aria-label="'+w[0]+'" aria-haspopup="dialog" aria-expanded="'+open+'">'+menuIcon+'</button>';
  }
  function openMenu(opener){
    const lang=opener.dataset.menuLang,base=opener.dataset.menuBase,current=opener.dataset.menuCurrent;
    const inRoom=opener.dataset.menuRoom==='true',w=menuWords[lang]||menuWords.en;
    let dialog=document.getElementById('av-mobile-menu');
    if(!dialog){
      dialog=document.createElement('dialog');
      dialog.id='av-mobile-menu'; dialog.className='mobile-menu';
      dialog.setAttribute('aria-labelledby','av-mobile-menu-title');
      document.body.append(dialog);
      dialog.addEventListener('close',()=>{
        document.documentElement.classList.remove('menu-open');
        document.querySelectorAll('[data-mobile-menu]').forEach(button=>button.setAttribute('aria-expanded','false'));
        document.querySelector(window.innerWidth>600?'.av-brand':'[data-mobile-menu]')?.focus();
      });
      dialog.addEventListener('keydown',event=>{
        event.stopPropagation();
        if(event.key!=='Tab') return;
        const items=[...dialog.querySelectorAll('button,a[href]')].filter(item=>!item.disabled&&item.getClientRects().length);
        const first=items[0],last=items[items.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      });
      dialog.addEventListener('click',event=>{
        const rect=dialog.getBoundingClientRect();
        if(event.target.closest('[data-menu-dismiss],a') || (event.target===dialog && (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom))) dialog.close();
      });
    }
    dialog.innerHTML='<div class="mobile-menu-head"><h2 id="av-mobile-menu-title">'+w[0]+'</h2><button type="button" data-menu-dismiss aria-label="'+w[1]+'" autofocus><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><nav aria-label="'+w[0]+'">'+links(lang,base,current)+projectLink(lang,base,current)+'<a href="'+base+'unofficial-notice/#project-credits">'+w[3]+'</a><a href="https://github.com/LorraineWong/avalon" target="_blank" rel="noopener noreferrer">GitHub</a></nav><div class="mobile-menu-theme"><span>'+w[2]+'</span>'+themeControl(lang)+'</div>'+(inRoom?'<p class="mobile-menu-hint">'+w[4]+'</p>':'');
    if(inRoom) dialog.querySelectorAll('a').forEach(link=>{link.target='_blank';link.rel='noopener noreferrer';});
    opener.setAttribute('aria-expanded','true');
    opener.setAttribute('aria-controls',dialog.id);
    dialog.showModal();
    document.documentElement.classList.add('menu-open');
  }
  window.addEventListener('resize',()=>{if(window.innerWidth>600) document.getElementById('av-mobile-menu')?.close();});
  function links(lang,base,current){const w=pack(lang)?.shell || words[lang]||words.en;return ['',(locale(lang)?.route || (lang==='zh'?'zh-cn':'en'))+'/','privacy/','unofficial-notice/'].map((url,i)=>'<a href="'+base+url+'"'+(['home','guide','privacy','legal'][i]===current?' aria-current="page"':'')+'>'+w[i]+'</a>').join('');}
  function header(lang,base,current,status=''){const w=pack(lang)?.shell || words[lang]||words.en;return '<header class="av-header"><a class="av-brand" href="'+base+'"><span class="av-mark"><img src="'+base+'assets/brand-mark.svg" alt="" width="40" height="40"></span><span><b>AVALON</b><small>'+w[4]+'</small></span></a><nav class="av-nav" aria-label="Main navigation">'+links(lang,base,current)+'</nav><div class="av-controls">'+status+themeControl(lang)+languageControl(lang)+menuControl(lang,base,current)+'</div></header>';}
  function projectLink(lang,base,current=''){return window.AvalonProject?'<a href="'+base+'support/"'+(current==='support'?' aria-current="page"':'')+'>'+window.AvalonProject.title(lang)+'</a>':'';}
  function footer(lang,base){const w=pack(lang)?.shell || words[lang]||words.en;return '<footer class="av-footer"><div><strong>AVALON ONLINE</strong><p>'+w[5]+'</p></div><nav aria-label="Footer">'+links(lang,base,'')+projectLink(lang,base)+'<a href="https://github.com/LorraineWong/avalon" target="_blank" rel="noopener noreferrer">GitHub</a></nav></footer>';}
  return {header,footer,languages,themeControl,languageControl,menuControl};
})();
