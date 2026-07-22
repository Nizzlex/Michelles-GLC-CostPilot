const CACHE="glc-organizer-v30-links";
const FILES=[
  "./",
  "index.html",
  "styles.css",
  "v3-additions.css",
  "app.js",
  "v3-links.js",
  "manifest.webmanifest",
  "mercedes-logo.jpg",
  "glc.jpg",
  "family-ghent.jpg",
  "family-provence.jpg",
  "family-winter.jpg",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
