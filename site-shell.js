window.AvalonShell = (() => {
  const systemTheme=window.matchMedia('(prefers-color-scheme: dark)');
  let preference=null;
  try { const saved=JSON.parse(localStorage.getItem('lwav.theme')||'null'); if(saved==='light'||saved==='dark') preference=saved; } catch {}
  const theme=()=>preference || (systemTheme.matches?'dark':'light');
  function themeLabel(lang){return lang==='zh'?'深色模式':'Dark mode';}
  function applyTheme(){
    const dark=theme()==='dark';
    document.documentElement.dataset.theme=theme();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#18212b':'#f6f3eb');
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
      const lang=document.documentElement.lang.startsWith('zh')?'zh':'en';
      button.setAttribute('aria-pressed',String(dark));
      button.setAttribute('aria-label',themeLabel(lang));
      button.title=lang==='zh'?(dark?'切换浅色模式':'切换深色模式'):(dark?'Switch to light mode':'Switch to dark mode');
    });
  }
  function themeControl(lang){
    const dark=theme()==='dark', title=lang==='zh'?(dark?'切换浅色模式':'切换深色模式'):(dark?'Switch to light mode':'Switch to dark mode');
    return '<button type="button" class="theme-toggle" data-theme-toggle aria-label="'+themeLabel(lang)+'" aria-pressed="'+dark+'" title="'+title+'"><svg class="theme-sun" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg><svg class="theme-moon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20.5 14.5A9 9 0 0 1 9.5 3.5a9 9 0 1 0 11 11Z"/></svg></button>';
  }
  applyTheme();
  systemTheme.addEventListener('change',()=>{if(!preference) applyTheme();});
  window.addEventListener('storage',event=>{if(event.key==='lwav.theme'||event.key===null){try { const saved=JSON.parse(localStorage.getItem('lwav.theme')||'null'); preference=['light','dark'].includes(saved)?saved:null; } catch {preference=null;} applyTheme();}});
  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-theme-toggle]')) return;
    preference=theme()==='dark'?'light':'dark';
    try {localStorage.setItem('lwav.theme',JSON.stringify(preference));} catch {}
    applyTheme();
  });
  const languages=[{id:'zh',label:'简体中文'},{id:'en',label:'English'}];
  const words={zh:['首页','玩法指南','隐私政策','使用条款与声明','阿瓦隆 · 在线版','免费非官方粉丝项目。请支持正版桌游。'],en:['Home','How to Play','Privacy Policy','Terms & Notices','Avalon · Online','Free unofficial fan project. Please support the official board game.']};
  function links(lang,base,current){const w=words[lang]||words.en;return ['',lang==='zh'?'zh-cn/':'en/','privacy/','unofficial-notice/'].map((url,i)=>'<a href="'+base+url+'"'+(['home','guide','privacy','legal'][i]===current?' aria-current="page"':'')+'>'+w[i]+'</a>').join('');}
  function header(lang,base,current,status=''){const w=words[lang]||words.en;return '<header class="av-header"><a class="av-brand" href="'+base+'"><span class="av-mark"><img src="'+base+'assets/brand-mark.svg" alt="" width="40" height="40"></span><span><b>AVALON</b><small>'+w[4]+'</small></span></a><nav class="av-nav" aria-label="Main navigation">'+links(lang,base,current)+'</nav><div class="av-controls">'+status+themeControl(lang)+'<select data-site-language aria-label="Language / 语言">'+languages.map(x=>'<option value="'+x.id+'"'+(lang===x.id?' selected':'')+'>'+x.label+'</option>').join('')+'</select></div></header>';}
  function footer(lang,base){const w=words[lang]||words.en;return '<footer class="av-footer"><div><strong>AVALON ONLINE</strong><p>'+w[5]+'</p></div><nav aria-label="Footer">'+links(lang,base,'')+'<a href="https://github.com/LorraineWong/avalon" target="_blank" rel="noopener noreferrer">GitHub</a></nav></footer>';}
  return {header,footer,languages,themeControl};
})();

// Use the project title in the hero; retain the original game name only in prose.
if(typeof MutationObserver!=='undefined') new MutationObserver(()=>{const hero=document.querySelector('.hero');if(!hero)return;const title=hero.querySelector('h1'),eyebrow=hero.querySelector('.eyebrow');const zh=document.documentElement.lang.startsWith('zh');const lead=hero.querySelector('.hero-lead');const copy=zh?'免费、非官方的粉丝项目，在浏览器里与朋友游玩 The Resistance: Avalon。':'A free, unofficial fan-made way to play The Resistance: Avalon online.';if(lead&&lead.textContent!==copy)lead.textContent=copy;if(title&&title.textContent!=='Avalon Online')title.textContent='Avalon Online';if(eyebrow&&eyebrow.textContent!==(zh?'阿瓦隆在线版':'UNOFFICIAL FAN PROJECT'))eyebrow.textContent=zh?'阿瓦隆在线版':'UNOFFICIAL FAN PROJECT';}).observe(document.documentElement,{childList:true,subtree:true});
