const CACHE_NAME = 'rewind-v3';
const ASSETS = [
  '/site.webmanifest',
];

function isHtmlRequest(request) {
  const accept = request.headers.get('accept') || '';
  return (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.destination === 'iframe' ||
    accept.includes('text/html')
  );
}

function isCacheableAssetRequest(request) {
  if (request.method !== 'GET') return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (isHtmlRequest(request)) return false;

  return /\.[a-z0-9]+$/i.test(url.pathname);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Always fetch HTML documents directly so auth/FedCM flows are not treated as cacheable assets.
  if (isHtmlRequest(event.request)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for API calls, cache-first for static assets.
  if (event.request.url.includes('supabase')) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (!isCacheableAssetRequest(event.request)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
