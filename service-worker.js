const CACHE='michies-glc-v5-1';
const ASSETS=['./','./index.html','./styles.css?v=5.1','./app.js?v=5.1','./manifest.webmanifest','./michie-hero.jpg?v=5.1','./icon-192.png?v=5.1','./icon-512.png?v=5.1','./favicon.png?v=5.1','./glc.jpg','./family-winter.jpg','./family-summer.jpg','./family-city.jpg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html'))))});
