// ReviewPulse PWA Service Worker — Lady's Era
const CACHE_VERSION = 'ladys-era-v5'
const STATIC_CACHE = `ladys-era-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `ladys-era-dynamic-${CACHE_VERSION}`

const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/ladys-era-logo.png',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-512x512-maskable.png',
  '/icons/apple-touch-icon.png',
]

// Install Event: Pre-cache static shell & offline fallback
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS)
      })
      .catch((err) => {
        console.warn('[SW] Pre-cache error:', err)
      })
  )
})

// Activate Event: Clear ALL outdated caches (including old rp-* caches) immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch Strategy:
// CRITICAL RULES FOR HIGH PERFORMANCE:
// 1. Never intercept non-GET requests (POST, PUT, PATCH, DELETE must go straight to network)
// 2. Never intercept cross-origin requests (Supabase, Google Reviews, analytics)
// 3. Never intercept API or Auth routes (/api/*, /auth/*)
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  // Only handle same-origin requests (DO NOT intercept Supabase or third-party origins)
  if (url.origin !== self.location.origin) {
    return
  }

  // Bypass API, auth, and telemetry routes completely
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/_next/webpack-hmr')
  ) {
    return
  }

  // Handle Navigation Requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(async () => {
          // Check dynamic cache first
          const cachedResponse = await caches.match(request)
          if (cachedResponse) {
            return cachedResponse
          }
          // Fall back to offline page
          const offlinePage = await caches.match('/offline')
          return (
            offlinePage ||
            new Response('You are currently offline. Please check your connection.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            })
          )
        })
    )
    return
  }

  // Handle Static Assets (_next/static, /icons/, images, fonts)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  ) {
    // Network-First with cache fallback so fresh bundles and assets load immediately
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone()
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, clone)
            })
          }
          return networkResponse
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Default: Network with Cache Fallback for static GETs
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

// Web Push Notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json()
      const title = data.title || 'ReviewPulse'
      const options = {
        body: data.body || 'New guest feedback received!',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/favicon-32x32.png',
        vibrate: [100, 50, 100],
        data: {
          url: data.url || '/dashboard',
        },
      }
      event.waitUntil(self.registration.showNotification(title, options))
    } catch {
      event.waitUntil(
        self.registration.showNotification('ReviewPulse', {
          body: event.data.text(),
          icon: '/icons/icon-192x192.png',
        })
      )
    }
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

// Message handler for manual skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
