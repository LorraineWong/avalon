/* Public project story and optional external contact/support links.
 * Only edit these URLs after the maintainer supplies the exact account URLs.
 * Never put payment credentials, email addresses or donor data in this file. */
window.AvalonProject = (() => {
  const config = {
    github: 'https://github.com/LorraineWong',
    linkedin: 'https://www.linkedin.com/in/lorrainewongyiting/',
    support: 'https://ko-fi.com/lorrainewong'
  };
  const copy = PROJECT_COPY;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function externalURL(value, hosts) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password && (!hosts || hosts.includes(url.hostname)) ? url.href : '';
    } catch { return ''; }
  }
  const link = (href, text, cls='') => '<a'+(cls?' class="'+cls+'"':'')+' href="'+escape(href)+'" target="_blank" rel="noopener noreferrer">'+(window.AvalonShell?.socialIcon(href.includes('github.com')?'github':href.includes('linkedin.com')?'linkedin':'heart')||'')+escape(text)+'</a>';
  function render(lang) {
    const c=copy[lang] || copy.en;
    const credits=window.AvalonLocales?.credits[lang] || window.AvalonLocales?.credits.en;
    const github=externalURL(config.github,['github.com']);
    const linkedin=externalURL(config.linkedin,['www.linkedin.com','linkedin.com']);
    const support=externalURL(config.support);
    return '<header class="project-intro"><h1>'+escape(c.title)+'</h1><p>'+escape(c.story)+'</p><nav class="project-contact" aria-label="'+escape(c.contact)+'">'+(github?link(github,'GitHub'):'')+(linkedin?link(linkedin,'LinkedIn'):'')+'</nav></header>'+
      '<section class="project-support-simple" aria-labelledby="support-title"><h2 id="support-title">'+escape(c.supportTitle)+'</h2><p>'+escape(c.support)+'</p>'+
      (support?'<p class="support-action">'+link(support,c.pay,'button')+'</p>':'<p>'+escape(c.pending)+'</p>')+
      '<p class="project-small">'+escape(c.free)+'</p><p class="project-small">'+escape(c.other)+'</p>'+
      (support?'<details class="project-details"><summary>'+escape(c.paymentTitle)+'</summary><p>'+escape(c.payment)+'</p></details>':'')+'</section>'+
      '<nav class="project-feedback" aria-label="'+escape(c.contact)+'">'+link('https://github.com/LorraineWong/avalon/issues',c.feedback,'text-action')+link('https://github.com/LorraineWong/avalon/security/advisories/new',c.report,'text-action')+'</nav>'+
      (credits?'<details class="project-details project-credits-simple"><summary>'+escape(credits.title)+'</summary><p>'+escape(credits.text)+'</p><p>'+escape(c.notice)+'</p></details>':'<p class="project-small">'+escape(c.notice)+'</p>');

  }
  return {title:lang=>(copy[lang] || copy.en).title, render};
})();
