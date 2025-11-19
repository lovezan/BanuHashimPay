// Service Worker override for caching strategy
self.addEventListener('install', (event) => {
    console.log('[PWA] Service Worker installing...');
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    console.log('[PWA] Service Worker activating...');
    event.waitUntil(clients.claim());
  });
  
  self.addEventListener('fetch', (event) => {
    // Let next-pwa handle caching
  });
  