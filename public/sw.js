/* 全职法师阅读站 service worker: shell + visited chapters offline. */
const VERSION = 'qfs-v1'
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './mofan-hero.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(VERSION).then(cache => cache.put(new URL('./index.html', self.location).href, copy))
          return response
        })
        .catch(() => caches.match(new URL('./index.html', self.location).href)),
    )
    return
  }

  if (url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(VERSION).then(cache => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request)),
    )
    return
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(VERSION).then(cache => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
