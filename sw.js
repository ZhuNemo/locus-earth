const APP_CACHE_NAME = 'locus-earth-app-cache-v1';     
const CESIUM_CACHE_NAME = 'locus-earth-cesium-cache-v1'; 

const urlsToCache = [
  './',
  './index.html',
  './settings.html',
  './js/settings.js',
  './css/settings.css',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
  './apple-touch-icon.png',
  './favicon.ico',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const requestURL = new URL(event.request.url);
  
  if (requestURL.origin === location.origin && urlsToCache.some(url => requestURL.pathname.includes(url))) {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
    return;
  }
  
  const isCesiumEngine = 
    requestURL.hostname.includes('cesium.com') || 
    requestURL.hostname.includes('unpkg.com') && requestURL.pathname.includes('/cesium/') ||
    requestURL.hostname.includes('cdnjs.cloudflare.com') && requestURL.pathname.includes('/cesium/');
  
  const isEngineFile = /\.(js|wasm|data)$/.test(requestURL.pathname);
  
  if (isCesiumEngine && isEngineFile) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            const contentLength = clone.headers.get('content-length');
            if (!contentLength || parseInt(contentLength) < 20 * 1024 * 1024) {
              caches.open(CESIUM_CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
          }
          return networkResponse;
        });
      })
    );
    return;
  }
  
  event.respondWith(fetch(event.request));
});