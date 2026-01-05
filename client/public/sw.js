// Service Worker for SGH CRM Portal PWA
const CACHE_NAME = 'sgh-crm-v1';
const RUNTIME_CACHE = 'sgh-runtime-v1';

// Files to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests from caching (always fetch fresh)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // For navigation requests, use network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page if available
              return caches.match('/');
            });
        })
    );
    return;
  }

  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return response;
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'حجز جديد!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'sgh-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'فتح',
        icon: '/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'إغلاق'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('المستشفى السعودي الألماني', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Background sync event (for future use)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered');
  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  }
});

async function syncAppointments() {
  // Placeholder for syncing appointments when back online
  console.log('[SW] Syncing appointments...');
}

// Message event - for communication with clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
