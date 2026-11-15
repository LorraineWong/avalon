/* Shared quick reference: static pages and room cards use the same concise copy. */
window.AvalonGuide = (() => {
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const copy=lang=>window.AvalonLocales.guide[lang]||window.AvalonLocales.guide.en;
  function modules(lang,{base='../',settings=null,n=5,variant='public'}={}){
    const c=copy(lang), room=variant==='room';
    const indexes=settings?[0,1,2].filter(i=>i===0?settings.lady&&n>=7:i===1?settings.excalibur:settings.lancelot):[0,1,2];
    if(!indexes.length)return '<p class="guide-secondary">'+escape(c.none)+'</p>';
    const art=i=>i===2?'<span class="'+(room?'guide-art':'module-art')+' module-pair" aria-hidden="true">'+['lancelot-good','lancelot-evil'].map(name=>'<img src="'+base+'assets/roles/'+name+'.webp" width="768" height="1024" alt="" loading="lazy">').join('')+'</span>':'<img class="'+(room?'guide-art':'module-art')+'" src="'+base+'assets/modules/'+['lady-of-the-lake','excalibur'][i]+'.webp" width="600" height="800" alt="" loading="lazy">';
    const cards=indexes.map(i=>{
      const id='module-'+['lady','excalibur','lancelots'][i];
      if(room)return '<div class="role-guide neutral module-reference" id="'+id+'">'+art(i)+'<span><b>'+escape(c.names[i])+'</b><br><span class="module-meta">'+escape(c.meta[i])+'</span><br><span class="muted">'+escape(c.body[i])+'</span></span></div>';
      return '<article class="character-card neutral module-reference" id="'+id+'">'+art(i)+'<div class="character-copy"><span class="character-alignment module-meta">'+escape(c.meta[i])+'</span><h3>'+escape(c.names[i])+'</h3><p>'+escape(c.body[i])+'</p></div></article>';
    }).join('');
    return '<section class="guide-modules'+(room?'':' guide-camp')+'" id="modules"><h3>'+escape(c.title)+'</h3>'+(settings?'':'<p class="guide-secondary">'+escape(c.intro)+'</p>')+'<div class="'+(room?'rgrid':'role-list')+'">'+cards+'</div>'+'</section>';
  }
  const players=lang=>{const c=copy(lang);return '<div class="guide-player-summary"><p>'+escape(c.players)+'</p></div>';};
  return {copy,modules,players};
})();
