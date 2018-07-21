const cacheName = 'restaurant-cache';

//self.importScripts('node_modules/idb/lib/idb.js');

const filesToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/img/1.jpg',
    '/img/2.jpg',
    '/img/3.jpg',
    '/img/4.jpg',
    '/img/5.jpg',
    '/img/6.jpg',
    '/img/7.jpg',
    '/img/8.jpg',
    '/img/9.jpg',
    '/img/10.jpg'
];

self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Installed');
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll(filesToCache);
        })
    );
});


// update our cache and delete Old ones;
self.addEventListener('activate', function (e) {
    console.log('[ServiceWorker] Activated ');
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== cacheName) {
                    // console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});


self.addEventListener('fetch', (event) => {
    // console.log(event.request);
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                // console.log('Found in cache:', event.request.url);
                return response;
            }
            // console.log('Network request for ', event.request.url);
            return fetch(event.request).then(networkResponse => {
                if (networkResponse.status === 404) {
                    // console.log(networkResponse.status);
                    return;
                }
                return caches.open(cacheName).then(cache => {
                    cache.put(event.request.url, networkResponse.clone());
                    // console.log('Fetched and cached', event.request.url);
                    return networkResponse;
                })
            })
        }).catch(error => {
            console.log('Error:', error);
            return;
        })
    );
});
