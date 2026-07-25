const CACHE='glc-organizer-v7-1-2';
const ASSETS=[
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './hero-photo.jpg',
  './vehicle-photo.jpg',
  './icon-180.png',
  './icon-512.png'
];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(ASSETS.map(a=>c.add(a)))));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;

  const url=new URL(e.request.url);

  // API-Antworten niemals aus dem PWA-Cache holen.
  if(url.hostname.includes('tankerkoenig.de')){
    e.respondWith(fetch(e.request,{cache:'no-store'}));
    return;
  }

  // App-Dateien: Netzwerk zuerst, Cache nur als Offline-Fallback.
  e.respondWith(
    fetch(e.request)
      .then(r=>{
        const copy=r.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
        return r;
      })
      .catch(()=>caches.match(e.request))
  );
});
