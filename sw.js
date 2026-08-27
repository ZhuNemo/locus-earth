const APP_CACHE_NAME = 'locus-earth-app-cache-v2';       // 应用缓存（小，包含界面更新）
const CESIUM_CACHE_NAME = 'locus-earth-cesium-cache-v2'; // Cesium引擎缓存（大）

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
  self.skipWaiting(); // 强制新 SW 立即接管
  event.waitUntil(
    caches.open(APP_CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 清理旧版本的缓存（v1），只保留 v2
          if (cacheName !== APP_CACHE_NAME && cacheName !== CESIUM_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const requestURL = new URL(event.request.url);

  if (requestURL.origin === location.origin && urlsToCache.some(url => requestURL.pathname.includes(url))) {
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
    return;
  }

  const isCesiumEngine = 
    requestURL.hostname.includes('cesium.com') || 
    (requestURL.hostname.includes('unpkg.com') && requestURL.pathname.includes('/cesium')) ||
    (requestURL.hostname.includes('cdnjs.cloudflare.com') && requestURL.pathname.includes('/cesium'));

  const isEngineFile = /\.(js|wasm|data|json)$/.test(requestURL.pathname);

  if (isCesiumEngine && isEngineFile) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        
        // 🚨 关键修复1：使用 waitUntil 确保缓存写入完成
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // 🚨 关键修复2：使用 networkResponse.ok（包含200、204等）代替 === 200，兼容304
            if (networkResponse && networkResponse.ok) {
              const clone = networkResponse.clone();
              caches.open(CESIUM_CACHE_NAME).then(cache => cache.put(event.request, clone));
            } else {
              console.log('Cesium 跳过缓存，状态码:', networkResponse.status);
            }
            return networkResponse;
          })
          .catch(err => {
            console.error('Cesium 跨域请求失败:', err, requestURL);
            throw err;
          });

        event.waitUntil(fetchPromise);
        return fetchPromise;
      })
    );
    return;
  }

  event.respondWith(fetch(event.request));
});