importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js')

workbox.setConfig({ debug: false })

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || [])

workbox.routing.registerRoute(
  /\/set\/[^/]+\/(flashcards|learn|write|test|match)/,
  new workbox.strategies.NetworkFirst({
    cacheName: 'study-modes',
    plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 86400 })],
  }),
)

workbox.routing.registerRoute(
  /\/api\/sets\//,
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-sets',
    plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 3600 })],
  }),
)

workbox.routing.registerRoute(
  /https:\/\/fonts\.googleapis\.com/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [new workbox.expiration.ExpirationPlugin({ maxAgeSeconds: 86400 * 30 })],
  }),
)
