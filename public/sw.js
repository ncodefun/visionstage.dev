const CACHE_NAME = 'my-cache-v2'
// This is the list of URLs to be cached by your Progressive Web App.
const CACHED_URLS = [
  '/',
	'/index.html',
  '/app.js',
	'/app.css',
  '/manifest.json',
	'/vision-stage/vision-stage.min.js',
	'/vision-stage/vision-stage.css',
	'/vision-stage/z-console.js',
  '/_components/vs-selector.js',
  '/_components/vs-selector.css',
  '/_components/vs-slider.js',
  '/_components/vs-slider.css',
  '/_components/vs-number-input.js',
  '/_components/vs-number-input.css'
]

// Open cache on install.
self.addEventListener('install', event => {
  event.waitUntil( async function() {
    const cache = await caches.open( CACHE_NAME)
    await cache.addAll( CACHED_URLS)
  }())
})

// Cache and update with stale-while-revalidate policy. (caviat: we don't have the latest version on refresh, just the latest in cache)
self.addEventListener('fetch', event => {
  const { request } = event
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return
  }

  event.respondWith( async function () {
    const cache = await caches.open( CACHE_NAME)

    const cachedResponsePromise = await cache.match( request)
    const networkResponsePromise = fetch( request)
    console.log('Fetch:', request.url)
    if (request.url.startsWith( self.location.origin)) {
      event.waitUntil( async function () {
        const networkResponse = await networkResponsePromise
        console.warn('updating cache...')
        await cache.put( request, networkResponse.clone())
      }())
    }

    return cachedResponsePromise || networkResponsePromise
  }())
})

// Clean up caches other than current.
self.addEventListener('activate', event => {
  event.waitUntil(async function () {
    const cacheNames = await caches.keys()

    await Promise.all(
      cacheNames.filter((cacheName) => {
        const deleteThisCache = cacheName !== CACHE_NAME

        return deleteThisCache
      }).map(cacheName => caches.delete(cacheName))
    )
  }())
})