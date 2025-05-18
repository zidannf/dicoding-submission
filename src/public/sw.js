importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js'
);

if (typeof workbox !== 'undefined') {
  console.log('Workbox berhasil dimuat!');
  
  const { registerRoute } = workbox.routing;
  const { StaleWhileRevalidate } = workbox.strategies;

  registerRoute(
    ({ request, url }) => {
      const baseUrl = new URL('https://story-api.dicoding.dev/v1');
      return baseUrl.origin === url.origin && request.destination === 'image';
    },
    new StaleWhileRevalidate({
      cacheName: 'story-api-images'
    })
  );
} else {
  console.log('Workbox gagal dimuat!');
}

// Pastikan versi cache unik agar aktivasi baru selalu terjadi
const CACHE_NAME = 'stories-app-cache-v2'; // Ubah versi cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Log untuk debugging
console.log('Service Worker initialized with cache:', CACHE_NAME);

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return Promise.allSettled(
        STATIC_ASSETS.map(url => 
          cache.add(url).catch(error => {
            console.warn(`Failed to cache ${url}: ${error.message}`);
            return null;
          })
        )
      ).then(() => {
        console.log('Static assets cached successfully');
      });
    })
  );
  self.skipWaiting();
  console.log('skipWaiting called - new worker will activate soon');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('Found caches:', cacheNames);
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log(`Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('Service Worker activated and old caches deleted');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch(error => {
              console.warn('Failed to cache response:', error);
            });

          return response;
        })
        .catch((error) => {
          console.error('Fetch failed:', error);
         
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
         
          if (event.request.destination === 'image') {
            return caches.match('/favicon.png');
          }
          
          throw error;
        });
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Default title', options: { body: 'Default body' } };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Push event data error:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, data.options)
  );
});

self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.message, event.filename, event.lineno);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});