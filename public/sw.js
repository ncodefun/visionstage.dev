const OFFLINE_VERSION = 1			/// change to erase old cache
const CACHE_NAME = "offline"
const CACHED_URLS = [
  // '/',
	'/index.html',
  '/app.js',
	'/app.css',
	'/vision-stage.min.js',
	'/vision-stage.css',
	'/z-console.js',
  '/manifest.json',
	'/_assets/images/icons.svg',
	'/_assets/images/app-icons/android-chrome-192x192.png',
	'/_assets/images/textures/paper-opaque-8bit.png',
	'/_components/button-select.js',
	'/_components/button-select.css',
]

//new Request('/offline.html', {cache: 'reload'}),

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open( CACHE_NAME)
    	await cache.addAll( CACHED_URLS)
      // Setting {cache: 'reload'} in the new request will ensure that the
      // response isn't fulfilled from the HTTP cache i.e., it will be from
      // the network.
      //await cache.add( new Request( OFFLINE_URL, { cache: "reload" }))
    })()
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload if it's supported.
      // See https://developers.google.com/web/updates/2017/02/navigation-preload
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable()
      }
    })()
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  // We only want to call event.respondWith() if this is a navigation request
  // for an HTML page.
  //if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's supported.
          const preloadResponse = await event.preloadResponse
          if (preloadResponse) {
            return preloadResponse
          }

          // Always try the network first.
          const networkResponse = await fetch( event.request)
					//console.log('networkResponse:', networkResponse)
          return networkResponse
        }
				catch (error) {
          // catch is only triggered if an exception is thrown, which is likely
          // due to a network error (= offline).
          // If fetch() returns a valid HTTP response with a response code in
          // the 4xx or 5xx range, the catch() will NOT be called.
					let implicit = /\/[^\.]+$/.test( event.request.url) // no dot in last seg (file name)
					let ask = implicit ? '/index.html' : event.request
          // console.log("Fetch failed. ask:", ask)
          const cache = await caches.open( CACHE_NAME)
          const cachedResponse = await cache.match( ask)
          return cachedResponse
        }
      })()
    )
  //}
})