const CACHE = 'michies-glc-v5-3-mobility';
const CORE = [
  './',
  './index.html',
  './styles.css?v=5.3',
  './app.js?v=5.3',
  './manifest-v52.webmanifest',
  './michie-hero-v52.jpg',
  './icon-192-v52.png',
  './icon-512-v52.png',
  './favicon-v52.png',
  './glc.jpg',
  './family-winter.jpg',
  './family-summer.jpg',
  './family-city.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const isPage = event.request.mode === 'navigate';
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => isPage
        ? caches.match('./index.html')
        : caches.match(event.request)
      )
  );
});
