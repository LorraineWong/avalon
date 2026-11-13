const CACHE = 'avalon-shell-v17';
const SHELL = [
  './assets/brand-mark.svg', './theme.css?v=17', './site-shell.js?v=17', './site-shell.css?v=17', './style.css?v=17', './app.js?v=17',
  './', './index.html', './style.css', './app.js', './manifest.webmanifest', './assets/app-icon.svg', './assets/player-avatars.webp',
  './vendor/firebase-app-compat.js', './vendor/firebase-auth-compat.js', './vendor/firebase-database-compat.js', './vendor/qrcode.min.js',
  './assets/roles/merlin.webp', './assets/roles/morgana.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return;

  if(request.mode === 'navigate'){
    event.respondWith(fetch(request).then(response => {
      if(response.ok){ const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(request, copy)); } return response;
    }).catch(()=>caches.match(request).then(hit=>hit || caches.match('./index.html'))));
    return;
  }

  if(request.destination === 'image'){
    event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => {
      const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(request, copy)); return response;
    })));
    return;
  }

  event.respondWith(fetch(request).then(response => {
    const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(request, copy)); return response;
  }).catch(()=>caches.match(request)));
});
