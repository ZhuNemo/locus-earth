const CACHE_NAME = 'locus-maps-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
  './apple-touch-icon.png',
  './favicon.ico',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const requestURL = new URL(event.request.url);


  if (requestURL.origin === location.origin && urlsToCache.some(url => requestURL.pathname.includes(url))) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});