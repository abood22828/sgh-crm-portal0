// Service Worker for SGH Public App (Patients & Visitors)
// مستقل تماماً عن Service Worker لوحة التحكم الإدارية (sw-admin.js)
const CACHE_NAME = 'sgh-public-v1';
const RUNTIME_CACHE = 'sgh-public-runtime-v1';
const OFFLINE_URL = '/offline';

// الملفات الأساسية للتطبيق العام
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

// ===== Install Event =====
self.addEventListener('install', (event) => {
  console.log('[SW-Public] Installing public service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW-Public] Precaching public app shell');
        return Promise.allSettled(
          PRECACHE_URLS.map(url => cache.add(url).catch(err => {
            console.warn('[SW-Public] Could not cache:', url, err.message);
          }))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ===== Activate Event =====
self.addEventListener('activate', (event) => {
  console.log('[SW-Public] Activating public service worker...');
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Only delete caches that belong to public app (sgh-public-*)
      return cacheNames.filter((cacheName) =>
        cacheName.startsWith('sgh-public-') && !currentCaches.includes(cacheName)
      );
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        console.log('[SW-Public] Deleting old cache:', cacheToDelete);
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// ===== Fetch Event =====
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip admin/dashboard requests - handled by sw-admin.js exclusively
  // IMPORTANT: Do NOT cache or intercept any /admin or /dashboard routes
  if (event.request.url.includes('/dashboard') || event.request.url.includes('/admin')) {
    return;
  }

  // Skip API requests (always fetch fresh)
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

  // Network-first for navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
  );
});

// ===== Push Notifications (Public App) =====
self.addEventListener('push', (event) => {
  console.log('[SW-Public] Push notification received');

  let data = { title: 'المستشفى السعودي الألماني', body: 'إشعار جديد', url: '/', type: 'general' };
  try {
    if (event.data) {
      data = { ...data, ...JSON.parse(event.data.text()) };
    }
  } catch (e) {
    data.body = event.data ? event.data.text() : 'إشعار جديد';
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: `sgh-public-${data.type || 'notification'}`,
    requireInteraction: false,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'فتح', icon: '/icon-72x72.png' },
      { action: 'close', title: 'إغلاق' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'المستشفى السعودي الألماني', options)
  );
});

// ===== Notification Click =====
self.addEventListener('notificationclick', (event) => {
  console.log('[SW-Public] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const targetUrl = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (!client.url.includes('/dashboard') && !client.url.includes('/admin') && 'focus' in client) {
              client.navigate(targetUrl);
              return client.focus();
            }
          }
          return clients.openWindow(targetUrl);
        })
    );
  }
});

// ===== Background Sync =====
self.addEventListener('sync', (event) => {
  console.log('[SW-Public] Background sync triggered:', event.tag);
  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  }
});

async function syncAppointments() {
  try {
    console.log('[SW-Public] Syncing appointments...');
    const clientList = await clients.matchAll({ type: 'window' });
    clientList.forEach(client => {
      if (!client.url.includes('/dashboard') && !client.url.includes('/admin')) {
        client.postMessage({ type: 'SYNC_COMPLETE' });
      }
    });
  } catch (error) {
    console.error('[SW-Public] Sync failed:', error);
  }
}

// ===== Message Event =====
self.addEventListener('message', (event) => {
  console.log('[SW-Public] Message received:', event.data);

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_NAME, app: 'public' });
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('sgh-public-')).map(k => caches.delete(k)))
    ).then(() => {
      event.ports[0]?.postMessage({ success: true });
    });
  }
});
