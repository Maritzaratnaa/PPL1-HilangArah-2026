// Dummy service worker to trigger PWA install prompt
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
});

self.addEventListener('fetch', (event) => {
  // Do nothing, just pass the request through
  // This is required to satisfy the PWA install criteria
});
