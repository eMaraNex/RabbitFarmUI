const CACHE_NAME = 'sungura-master-v2';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// Helper function to check if request should be cached
function shouldCache(request) {
    if (request.method !== 'GET') {
        return false;
    }

    if (!request.url.startsWith('http')) {
        return false;
    }

    const url = new URL(request.url);
    if (url.pathname.includes('/api/') ||
        url.pathname.includes('/_next/static/chunks/') ||
        url.pathname.includes('sockjs-node') ||
        url.pathname.includes('hot-update')) {
        return false;
    }

    return true;
}

// Safe cache operation with retry
async function safeCachePut(cacheName, request, response) {
    try {
        const cache = await caches.open(cacheName);
        await cache.put(request, response);
        return true;
    } catch (error) {
        // If caching fails, try to clean up old cache and retry once
        try {
            await caches.delete(cacheName);
            const newCache = await caches.open(cacheName);
            await newCache.put(request, response);
            return true;
        } catch (retryError) {
            return false;
        }
    }
}

// Safe cache match with fallback
async function safeCacheMatch(request) {
    try {
        return await caches.match(request);
    } catch (error) {
        return null;
    }
}

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                await cache.addAll(urlsToCache);
                await self.skipWaiting();
            } catch (error) {
                // If initial caching fails, still proceed but cache individual files
                try {
                    const cache = await caches.open(CACHE_NAME);
                    for (const url of urlsToCache) {
                        try {
                            await cache.add(url);
                        } catch (individualError) {
                            // Skip files that fail to cache
                            continue;
                        }
                    }
                    await self.skipWaiting();
                } catch (fallbackError) {
                    // Even if everything fails, still activate the service worker
                    await self.skipWaiting();
                }
            }
        })()
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            try {
                const cacheNames = await caches.keys();
                await Promise.allSettled(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
                await self.clients.claim();
            } catch (error) {
                // If cleanup fails, still claim clients
                await self.clients.claim();
            }
        })()
    );
});

// Fetch event with robust error handling
self.addEventListener('fetch', (event) => {
    if (!shouldCache(event.request)) {
        return;
    }

    if (event.request.destination === 'document') {
        event.respondWith(
            (async () => {
                try {
                    // Try network first
                    const networkResponse = await fetch(event.request);

                    // If successful, try to cache it
                    if (networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        safeCachePut(CACHE_NAME, event.request, responseClone);
                    }

                    return networkResponse;
                } catch (networkError) {
                    // Network failed, try cache
                    const cachedResponse = await safeCacheMatch(event.request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Try offline page
                    const offlineResponse = await safeCacheMatch(OFFLINE_URL);
                    if (offlineResponse) {
                        return offlineResponse;
                    }

                    // Last resort - basic offline response
                    return new Response(
                        '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
                        {
                            status: 200,
                            headers: { 'Content-Type': 'text/html' }
                        }
                    );
                }
            })()
        );
    } else {
        event.respondWith(
            (async () => {
                // Try cache first for assets
                const cachedResponse = await safeCacheMatch(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                try {
                    // Try network
                    const networkResponse = await fetch(event.request);

                    // Cache successful responses
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        safeCachePut(CACHE_NAME, event.request, responseToCache);
                    }

                    return networkResponse;
                } catch (networkError) {
                    // For assets, return a basic error response or try to serve a fallback
                    if (event.request.destination === 'image') {
                        // Return a simple 1x1 transparent image for failed images
                        return new Response(
                            new Uint8Array([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 255, 255, 255, 0, 0, 0, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59]),
                            { headers: { 'Content-Type': 'image/gif' } }
                        );
                    }

                    // For other assets, return empty response
                    return new Response('', { status: 204 });
                }
            })()
        );
    }
});

// Handle push notifications with error recovery
self.addEventListener('push', (event) => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            }
        };

        event.waitUntil(
            (async () => {
                try {
                    await self.registration.showNotification('Sungura Master', options);
                } catch (error) {
                    // Fallback notification with minimal options
                    try {
                        await self.registration.showNotification('Sungura Master', {
                            body: event.data.text()
                        });
                    } catch (fallbackError) {
                        // Notification completely failed - could log to analytics or ignore
                    }
                }
            })()
        );
    }
});