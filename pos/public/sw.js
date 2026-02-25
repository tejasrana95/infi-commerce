// POS Service Worker
// Version: 1.0.0
// Optimized for Point of Sale operations with offline support

const CACHE_NAME = 'pos-cache-v1';
const RUNTIME_CACHE = 'pos-runtime-v1';
const IMAGE_CACHE = 'pos-images-v1';

// Assets to cache on install (app shell)
const PRECACHE_ASSETS = [
    '/',
    '/offline',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    const currentCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE];

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => !currentCaches.includes(cacheName))
                        .map((cacheName) => caches.delete(cacheName))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - handle requests with appropriate strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome extensions and non-http protocols
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip Next.js HMR and development requests
    if (
        url.pathname.includes('_next/webpack-hmr') ||
        url.pathname.includes('__nextjs') ||
        url.search.includes('_rsc=')
    ) {
        return;
    }

    // API requests - Network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Product images - Stale while revalidate
    if (url.pathname.includes('/uploads/') || url.pathname.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
        event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
        return;
    }

    // Static assets - Cache first
    if (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)
    ) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // HTML pages - Network first with offline fallback
    event.respondWith(networkFirstWithOfflineFallback(request));
});

// Network First Strategy
async function networkFirstStrategy(request) {
    try {
        const response = await fetch(request);

        if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        throw error;
    }
}

// Cache First Strategy
async function cacheFirstStrategy(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);

        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        return new Response('Offline', { status: 503 });
    }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => {
        // Return null for the background fetch promise if it fails
        return null;
    });

    // Return cached response immediately if it exists, otherwise wait for network
    if (cached) {
        return cached;
    }

    // If not in cache, wait for network or return offline response
    const response = await fetchPromise;
    return response || new Response('Offline', { status: 503 });
}

// Network First with Offline Fallback
async function networkFirstWithOfflineFallback(request) {
    try {
        const response = await fetch(request);

        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }

        // Return offline page
        return caches.match('/offline');
    }
}

// Background sync for offline orders
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOfflineOrders());
    }
});

async function syncOfflineOrders() {
    // This will be triggered when connection is restored
    // Implementation will work with IndexedDB queue
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
        client.postMessage({
            type: 'SYNC_ORDERS',
            status: 'started'
        });
    });
}

// Push notifications (for order alerts)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'POS Notification';
    const options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: data.url || '/',
        vibrate: [100, 50, 100],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data || '/')
    );
});

// Message handler for cache management
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }

    if (event.data && event.data.type === 'CACHE_PRODUCTS') {
        event.waitUntil(cacheProductImages(event.data.products));
    }
});

// Cache product images for offline use
async function cacheProductImages(products) {
    if (!products || !Array.isArray(products)) return;

    const cache = await caches.open(IMAGE_CACHE);
    const imageUrls = products
        .filter(p => p.images && p.images.length > 0)
        .map(p => p.images[0])
        .slice(0, 100); // Limit to first 100 products

    await Promise.all(
        imageUrls.map(async (url) => {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                }
            } catch (e) {
                // Ignore failed images
            }
        })
    );
}
