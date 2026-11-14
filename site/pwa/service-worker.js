const CACHE = 'avalon-shell-v26';
const SHELL = [
  './config/app-check.js?v=26', './assets/js/app-check.js?v=26', './vendor/firebase-app-check-compat.js',
  './assets/js/policy-copy.js?v=26', './assets/js/locales.js?v=26', './assets/js/game-base.js?v=26', './assets/js/project-copy.js?v=26', './assets/js/project.js?v=26',
  './support/', './support/index.html', './assets/js/public-ui.js?v=26', './assets/css/landing.css?v=26',
  './assets/brand-mark.svg', './assets/css/theme.css?v=26', './assets/js/site-shell.js?v=26', './assets/css/site-shell.css?v=26', './assets/css/style.css?v=26', './assets/js/app.js?v=26',
  './', './index.html', './assets/css/style.css', './assets/js/app.js', './manifest.webmanifest', './assets/app-icon.svg', './assets/player-avatars.webp',
  './vendor/firebase-app-compat.js', './vendor/firebase-auth-compat.js', './vendor/firebase-database-compat.js', './vendor/qrcode.min.js',
  './assets/roles/merlin.webp', './assets/roles/morgana.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('avalon-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

function remember(request, response, event){
  if(response.ok){
    const copy=response.clone();
    event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return;

  if(request.mode === 'navigate'){
    event.respondWith(fetch(request).then(response => remember(request,response,event)).catch(async()=>{
      const hit=await caches.match(request);
      if(hit) return hit;
      const home=new URL('./',self.location.href);
      if(url.pathname===home.pathname || url.pathname===new URL('index.html',home).pathname) return caches.match(new URL('index.html',home).href);
      // Do not render root-relative game assets under an uncached nested URL.
      return Response.redirect(home.href,302);
    }));
    return;
  }

  if(request.destination === 'image'){
    event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => remember(request,response,event))));
    return;
  }

  event.respondWith(fetch(request).then(response => remember(request,response,event)).catch(()=>caches.match(request)));
});
