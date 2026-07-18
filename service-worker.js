// Minimal service worker for FarmLens — enables "Add to Home Screen" / install
// on Android, and caches the app shell so it still opens without a connection.
// (Weather and any AI features still need internet to actually fetch data.)

const CACHE_NAME = 'farmlens-v1';
const APP_SHELL = ['./farmlens.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n !== CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  // Only handle same-origin app-shell requests; let API/weather calls go straight to the network.
  if(event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      return cached || fetch(event.request).then(function(response){
        return caches.open(CACHE_NAME).then(function(cache){
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(function(){ return cached; });
    })
  );
});
