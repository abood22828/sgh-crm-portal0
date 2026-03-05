// Service Worker for SGH Admin Dashboard PWA
// مستقل تماماً عن Service Worker التطبيق العام
const CACHE_NAME = 'sgh-admin-v2';
const RUNTIME_CACHE = 'sgh-admin-runtime-v2';
const OFFLINE_URL = '/admin/offline';

// الملفات الأساسية لتطبيق الإدارة
// NOTE: لا تُضف favicon.ico هنا - قد يُعيد redirect إلى CDN خارجي ويُسبب CORS error
// NOTE: لا تُضف ملفات من CDN خارجي - يجب أن تكون جميع الملفات من نفس الـ origin
const PRECACHE_URLS = [
  '/admin',
  '/manifest-admin.json',
  '/icon-admin-192x192.png',
  '/icon-admin-512x512.png',
  '/apple-touch-icon.png',
];

// ===== Install Event =====
self.addEventListener('install', (event) => {
  console.log('[SW-Admin] Installing admin service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW-Admin] Precaching admin app shell');
        // Try to cache each URL individually to avoid failing on missing files
        return Promise.allSettled(
          PRECACHE_URLS.map(url =>
            // Use no-cors for cross-origin resources if needed
            fetch(url, { mode: 'same-origin' })
              .then(response => {
                if (!response.ok && response.type !== 'opaque') {
                  throw new Error(`HTTP ${response.status} for ${url}`);
                }
                return cache.put(url, response);
              })
              .catch(err => {
                console.warn('[SW-Admin] Could not cache:', url, err.message);
              })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ===== Activate Event =====
self.addEventListener('activate', (event) => {
  console.log('[SW-Admin] Activating admin service worker...');
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Only delete caches that belong to admin (sgh-admin-*)
      return cacheNames.filter((cacheName) =>
        cacheName.startsWith('sgh-admin-') && !currentCaches.includes(cacheName)
      );
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        console.log('[SW-Admin] Deleting old cache:', cacheToDelete);
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// ===== Fetch Event =====
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests entirely - don't try to cache external CDN resources
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests (always fetch fresh for admin)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline - Admin' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Network-first for admin navigation (always fresh data)
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
              return caches.match('/admin');
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

// ===== Push Notifications (Admin-specific) =====
self.addEventListener('push', (event) => {
  console.log('[SW-Admin] Admin push notification received');

  let data = { title: 'لوحة تحكم SGH', body: 'إشعار جديد', url: '/admin', type: 'general' };
  try {
    if (event.data) {
      data = { ...data, ...JSON.parse(event.data.text()) };
    }
  } catch (e) {
    data.body = event.data ? event.data.text() : 'إشعار جديد';
  }

  const options = {
    body: data.body,
    icon: '/icon-admin-192x192.png',
    badge: '/icon-admin-72x72.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: `sgh-admin-${data.type || 'notification'}`,
    requireInteraction: true,
    data: { url: data.url || '/admin' },
    actions: [
      { action: 'open', title: 'فتح', icon: '/icon-admin-72x72.png' },
      { action: 'close', title: 'إغلاق' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'لوحة تحكم SGH', options)
  );
});

// ===== Notification Click =====
self.addEventListener('notificationclick', (event) => {
  console.log('[SW-Admin] Admin notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const targetUrl = event.notification.data?.url || '/admin';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Focus existing admin window if open
          for (const client of clientList) {
            if ((client.url.includes('/admin') || client.url.includes('/dashboard')) && 'focus' in client) {
              client.navigate(targetUrl);
              return client.focus();
            }
          }
          // Open new window
          return clients.openWindow(targetUrl);
        })
    );
  }
});

// ===== Message Event =====
self.addEventListener('message', (event) => {
  console.log('[SW-Admin] Message received:', event.data);

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_NAME, app: 'admin' });
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('sgh-admin-')).map(k => caches.delete(k)))
    ).then(() => {
      event.ports[0]?.postMessage({ success: true });
    });
  }
});

// ===== Background Sync =====
self.addEventListener('sync', (event) => {
  console.log('[SW-Admin] Background sync triggered:', event.tag);
  if (event.tag === 'sync-admin-data') {
    event.waitUntil(syncAdminData());
  }
});

async function syncAdminData() {
  try {
    console.log('[SW-Admin] Syncing admin data...');
    // Notify all admin clients that sync is complete
    const clientList = await clients.matchAll({ type: 'window' });
    clientList.forEach(client => {
      if (client.url.includes('/admin') || client.url.includes('/dashboard')) {
        client.postMessage({ type: 'SYNC_COMPLETE' });
      }
    });
  } catch (error) {
    console.error('[SW-Admin] Sync failed:', error);
  }
}
