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
  const link = (href, text, cls='') => '<a'+(cls?' class="'+cls+'"':'')+' href="'+escape(href)+'" target="_blank" rel="noopener noreferrer">'+escape(text)+'</a>';
  function render(lang) {
    const c=copy[lang] || copy.en;
    const credits=window.AvalonLocales?.credits[lang] || window.AvalonLocales?.credits.en;
    const github=externalURL(config.github,['github.com']);
    const linkedin=externalURL(config.linkedin,['www.linkedin.com','linkedin.com']);
    const support=externalURL(config.support);
    return '<h1>'+escape(c.title)+'</h1><p>'+escape(c.byline)+'</p><h2>'+escape(c.storyTitle)+'</h2><p>'+escape(c.story)+'</p><h2>'+escape(c.supportTitle)+'</h2><p>'+escape(c.support)+'</p><p>'+escape(c.free)+'</p>'+
      (support?'<p>'+link(support,c.pay,'button')+'</p><p>'+escape(c.payment)+'</p>':'<p class="notice">'+escape(c.pending)+'</p>')+
      '<h2>'+escape(c.contact)+'</h2><p class="project-contact">'+(github?link(github,'GitHub'):'')+(linkedin?' · '+link(linkedin,'LinkedIn'):'')+'</p><p>'+escape(c.security)+'</p><p>'+link('https://github.com/LorraineWong/avalon/security/advisories/new',c.report)+'</p>'+
      (credits?'<h2>'+escape(credits.title)+'</h2><p>'+escape(credits.text)+'</p>':'')+'<p class="notice">'+escape(c.notice)+'</p>';
  }
  return {title:lang=>(copy[lang] || copy.en).title, render};
})();
