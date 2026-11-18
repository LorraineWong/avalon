/* Read-only public-site health check. No browser, Firebase SDK, credentials or player data. */
import {readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const origin='https://playavalonnow.com/';
const languages=[['en','en'],['zh-cn','zh-CN'],['zh-tw','zh-TW'],['ru','ru'],['es','es'],['pt','pt'],['vi','vi'],['ja','ja'],['ko','ko']];
const families=['how-to-play','about','privacy-policy','terms'];
export const publicRoutes=['',...families.flatMap(f=>languages.map(([route])=>f+'/'+route+'/'))];
const source=file=>readFileSync(new URL('../'+file,import.meta.url));
const requireCheck=(ok,message)=>{if(!ok)throw Error(message);};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function tags(html,name){
  const clean=html.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
  return [...clean.matchAll(new RegExp('<'+name+'\\b[^>]*>','gi'))].map(([tag])=>Object.fromEntries([...tag.matchAll(/\s([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(([,key,a,b])=>[key.toLowerCase(),a??b])));
}
function pageCheck(route,html,headers,version){
  const links=tags(html,'link'),meta=tags(html,'meta');
  const get=name=>meta.find(m=>m.name===name||m.property===name)?.content;
  const canonical=links.filter(l=>l.rel==='canonical');
  requireCheck(canonical.length===1&&canonical[0].href===origin+route,'canonical differs');
  requireCheck(!/noindex|none/i.test((get('robots')||'')+' '+(headers.get('x-robots-tag')||'')),'public page is noindex');
  const titles=[...html.matchAll(/<title>([^<]+)<\/title>/g)];
  requireCheck(titles.length===1&&titles[0][1].trim()&&get('description')?.trim(),'title/description missing');
  requireCheck(get('og:title')===titles[0][1]&&get('twitter:title')===titles[0][1],'social title differs');
  requireCheck(get('og:description')===get('description')&&get('twitter:description')===get('description'),'social description differs');
  requireCheck(get('og:url')===origin+route&&get('og:site_name')==='PlayAvalonNow','social URL/brand differs');
  for(const key of ['og:image','twitter:image'])requireCheck(get(key)===origin+'assets/social-preview.png?v='+version,'social image differs');
  requireCheck(get('twitter:card')==='summary_large_image'&&get('og:image:width')==='1200'&&get('og:image:height')==='630','social card dimensions/type differ');
  const family=route.split('/')[0],lang=route?languages.find(([id])=>id===route.split('/')[1])?.[1]:'en';
  requireCheck(tags(html,'html')[0]?.lang===lang,'HTML language differs');
  const expected=route?[...languages.map(([id,tag])=>[tag,origin+family+'/'+id+'/']),['x-default',origin+family+'/en/']]:[['en',origin],['x-default',origin]];
  const actual=links.filter(l=>l.rel==='alternate'&&l.hreflang);
  requireCheck(actual.length===expected.length&&expected.every(([tag,url])=>actual.filter(l=>l.hreflang===tag&&l.href===url).length===1),'language alternates differ');
  const versions=[...html.matchAll(/\?v=(\d+)/g)].map(m=>m[1]);
  requireCheck(versions.length>0&&versions.every(v=>v===version),'page asset version differs');
  requireCheck(links.some(l=>l.rel==='icon')&&links.some(l=>l.rel==='apple-touch-icon'),'icons missing');
  const icons=links.filter(l=>l.rel==='icon');
  requireCheck(icons[0]?.type==='image/png'&&icons[0]?.sizes==='96x96'&&new URL(icons[0].href,origin+route).href===origin+'assets/favicon-96.png','primary icon must be fixed 96px PNG');
  requireCheck(icons.every(l=>{const u=new URL(l.href,origin+route);return u.origin===new URL(origin).origin&&!u.search&&!u.hash;}),'icon URLs must be stable');
  for(const size of [48,96,192])requireCheck(icons.some(l=>l.type==='image/png'&&l.sizes===size+'x'+size&&new URL(l.href,origin+route).href===origin+'assets/favicon-'+size+'.png'),'PNG icon size missing: '+size);
  if(!route){
    requireCheck(get('description')==='Play Avalon online for free with 5–10 players. Create a private room, invite your friends and enjoy social deduction in your browser. No signup or download.','home player-count wording differs');
    const data=[...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
    const game=data.find(d=>d['@type']==='VideoGame'),site=data.find(d=>d['@type']==='WebSite');
    requireCheck(site?.name==='PlayAvalonNow'&&site.url===origin&&game?.url===origin&&game.isAccessibleForFree===true&&game.numberOfPlayers?.minValue===5&&game.numberOfPlayers?.maxValue===10&&game.inLanguage?.length===9,'structured data differs');
  }
}

export async function checkPublicSite({fetcher=fetch,attempts=3,retryMs=5000,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),concurrency=4}={}){
  const version=source('site/pwa/service-worker.js').toString().match(/avalon-shell-v(\d+)/)[1];
  const checks=[];
  function add(url,validate,status=200){checks.push({url,validate,status});}
  function html(route){add(origin+route,async r=>{requireCheck(/text\/html/i.test(r.headers.get('content-type')||''),'HTML content type differs');pageCheck(route,await r.text(),r.headers,version);});}
  publicRoutes.forEach(html);
  add(origin+'?lang=zh&utm_source=healthcheck',async r=>pageCheck('',await r.text(),r.headers,version));
  add(origin+'robots.txt',async r=>{const text=await r.text();requireCheck(/^User-agent:\s*\*/mi.test(text)&&/^Sitemap:\s*https:\/\/playavalonnow.com\/sitemap.xml\s*$/mi.test(text),'robots sitemap/agent differs');requireCheck(!/^Disallow:\s*\/\s*$/mi.test(text),'robots blocks root');});
  add(origin+'sitemap.xml',async r=>{const urls=[...((await r.text()).matchAll(/<loc>([^<]+)<\/loc>/g))].map(m=>m[1]);requireCheck(urls.length===publicRoutes.length&&new Set(urls).size===urls.length&&publicRoutes.every(route=>urls.includes(origin+route)),'sitemap URL set differs');});
  for(const file of ['ui-preview.html','social-preview.html','render-stability.html'])add(origin+'dev/'+file,async r=>{requireCheck(tags(await r.text(),'meta').some(m=>m.name==='robots'&&/\bnoindex\b/i.test(m.content)),'developer page lacks noindex');});
  const assets=[
    ['service-worker.js','site/pwa/service-worker.js','javascript'],
    ['assets/js/app.js?v='+version,'site/assets/js/app.js','javascript'],
    ['assets/js/locales.js?v='+version,'site/language/locales.js','javascript'],
    ['assets/css/style.css?v='+version,'site/assets/css/style.css','text/css'],
    ['assets/css/theme.css?v='+version,'site/assets/css/theme.css','text/css'],
    ['assets/css/site-shell.css?v='+version,'site/assets/css/site-shell.css','text/css'],
    ['assets/brand-mark-light.svg?v='+version,'site/assets/brand-mark-light.svg','image/svg+xml'],
    ['assets/brand-mark-dark.svg?v='+version,'site/assets/brand-mark-dark.svg','image/svg+xml'],
    ['assets/brand-mark.svg','site/assets/brand-mark.svg','image/svg+xml'],
    ['assets/roles/merlin.webp','site/assets/roles/merlin.webp','image/webp'],
    ['assets/roles/morgana.webp','site/assets/roles/morgana.webp','image/webp'],
    ['assets/social-preview.png?v='+version,'site/assets/social-preview.png','image/png'],
    ['assets/favicon-48.png','site/assets/favicon-48.png','image/png'],
    ['assets/favicon-96.png','site/assets/favicon-96.png','image/png'],
    ['assets/favicon-192.png','site/assets/favicon-192.png','image/png'],
    ['assets/apple-touch-icon.png','site/assets/apple-touch-icon.png','image/png'],
    ['assets/pwa-192.png','site/assets/pwa-192.png','image/png'],
    ['assets/pwa-512.png','site/assets/pwa-512.png','image/png'],
    ['assets/pwa-maskable-512.png','site/assets/pwa-maskable-512.png','image/png'],
    ['favicon.ico','site/meta/favicon.ico','image/'],
    ['manifest.webmanifest','site/pwa/manifest.webmanifest','json']
  ];
  for(const [url,file,type] of assets)add(origin+url,async r=>{requireCheck((r.headers.get('content-type')||'').includes(type),'asset content type differs');requireCheck(digest(new Uint8Array(await r.arrayBuffer()))===digest(source(file)),'published asset differs from checked commit');});
  for(const [old,prefix] of [['https://www.playavalonnow.com/',''],['https://lorrainewong.github.io/','avalon/'],['https://avalon.lorrainewong.dev/','']])for(const route of ['', 'how-to-play/en/?utm_source=healthcheck'])add(old+prefix+route,async r=>requireCheck(r.headers.get('location')===origin+route,'redirect target/path/query differs'),301);
  add('http://playavalonnow.com/',async r=>requireCheck(r.headers.get('location')===origin,'HTTPS redirect differs'),301);
  add(origin+'__public-site-check-not-found__/',async()=>{},404);
  const results=[];let cursor=0;
  await Promise.all(Array.from({length:concurrency},async()=>{while(cursor<checks.length){
    const {url,validate,status}=checks[cursor++];let lastError='';
    for(let attempt=1;attempt<=attempts;attempt++){
      try{
        const response=await fetcher(url,{method:'GET',redirect:'manual',credentials:'omit',signal:AbortSignal.timeout(15000),headers:{'User-Agent':'PlayAvalonNow-Public-Healthcheck/1.0','Cache-Control':'no-cache'}});
        try{
          requireCheck(response.status===status,'expected HTTP '+status+', received '+response.status);
          await validate(response);
        }finally{await response.body?.cancel().catch(()=>{});}
        results.push({url,ok:true,attempts:attempt});lastError='';break;
      }catch(error){lastError=error instanceof Error?error.message:'request failed';if(attempt<attempts)await sleep(retryMs);}
    }
    if(lastError)results.push({url,ok:false,attempts,error:lastError});
  }}));
  results.sort((a,b)=>a.url.localeCompare(b.url));
  return {checkedAt:new Date().toISOString(),origin,version,ok:results.every(r=>r.ok),total:results.length,failed:results.filter(r=>!r.ok).length,results};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const report=await checkPublicSite();
  const json=JSON.stringify(report,null,2)+'\n';
  if(process.env.PUBLIC_CHECK_REPORT)writeFileSync(process.env.PUBLIC_CHECK_REPORT,json);
  const summary='Public site check: '+(report.ok?'PASS':'FAIL')+' — '+(report.total-report.failed)+'/'+report.total+' checks, expected v'+report.version+'.\n'+report.results.filter(r=>!r.ok).map(r=>'- '+r.url+': '+r.error).join('\n');
  console.log(summary);
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
  if(!report.ok)process.exitCode=1;
}
