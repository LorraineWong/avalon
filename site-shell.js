window.AvalonShell = (() => {
  const languages=[{id:'zh',label:'简体中文'},{id:'en',label:'English'}];
  const words={zh:['首页','玩法指南','隐私政策','使用条款与声明','阿瓦隆 · 在线版','免费非官方粉丝项目。请支持正版桌游。'],en:['Home','How to play','Privacy Policy','Terms & Notices','Avalon · Online','Free unofficial fan project. Please support the official board game.']};
  function links(lang,base,current){const w=words[lang]||words.en;return ['',lang==='zh'?'zh-cn/':'en/','privacy/','unofficial-notice/'].map((url,i)=>'<a href="'+base+url+'"'+(['home','guide','privacy','legal'][i]===current?' aria-current="page"':'')+'>'+w[i]+'</a>').join('');}
  function header(lang,base,current,status=''){const w=words[lang]||words.en;return '<header class="av-header"><a class="av-brand" href="'+base+'"><span class="av-mark">V</span><span><b>AVALON</b><small>'+w[4]+'</small></span></a><nav class="av-nav" aria-label="Main navigation">'+links(lang,base,current)+'</nav><div class="av-controls">'+status+'<select data-site-language aria-label="Language / 语言">'+languages.map(x=>'<option value="'+x.id+'"'+(lang===x.id?' selected':'')+'>'+x.label+'</option>').join('')+'</select></div></header>';}
  function footer(lang,base){const w=words[lang]||words.en;return '<footer class="av-footer"><div><strong>AVALON ONLINE</strong><p>'+w[5]+'</p></div><nav aria-label="Footer">'+links(lang,base,'')+'<a href="https://github.com/LorraineWong/avalon" target="_blank" rel="noopener noreferrer">GitHub</a></nav></footer>';}
  return {header,footer,languages};
})();
