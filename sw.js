const CACHE     = 'apps-studio-v18';
const IMG_CACHE = 'apps-studio-img-v2'; // Image-এর আলাদা cache
const IMG_MAX   = 200; // সর্বোচ্চ কতটা image cache হবে

const STATIC = [
    '/index.html','/search.html','/request.html','/toplist.html',
    '/app.html','/download.html','/categories.html','/news.html',
    '/about.html','/privacy.html','/404.html',
    '/style.css','/script.js','/firebase-config.js'
];

// ===== INSTALL =====
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(c =>
            c.addAll(STATIC).catch(() => {}) // fail হলেও install চলবে
        )
    );
    self.skipWaiting();
});

// ===== ACTIVATE =====
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE && k !== IMG_CACHE)
                    .map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// ===== FETCH =====
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    // Skip non-GET requests
    if (e.request.method !== 'GET') return;

    // ১. Firebase/Firestore → bypass (always network)
    if (url.hostname.includes('firebase') ||
        url.hostname.includes('firebaseio') ||
        url.hostname.includes('firestore') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('profitablecpmrate') ||
        url.hostname.includes('highperformanceformat') ||
        url.hostname.includes('effectivegatecpm')) {
        return;
    }

    // ২. Images → Cache first + background update (Stale-While-Revalidate)
    if (e.request.destination === 'image' ||
        url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i)) {
        e.respondWith(
            caches.open(IMG_CACHE).then(imgCache =>
                imgCache.match(e.request).then(cached => {
                    const fetchPromise = fetch(e.request)
                        .then(res => {
                            if (res.ok && res.status === 200) {
                                imgCache.put(e.request, res.clone());
                                // Cache size limit — পুরানো entries সরাও
                                trimCache(IMG_CACHE, IMG_MAX);
                            }
                            return res;
                        })
                        .catch(() => cached || new Response('', {status: 404}));
                    // Cache থাকলে সাথে সাথে দেখাও
                    return cached || fetchPromise;
                })
            )
        );
        return;
    }

    // ৩. CDN (Font Awesome, Google Fonts) → Cache first
    if (url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('cdn.jsdelivr.net')) {
        e.respondWith(
            caches.match(e.request).then(cached => cached ||
                fetch(e.request).then(res => {
                    if (res.ok) {
                        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
                    }
                    return res;
                })
            )
        );
        return;
    }

    // ৪. HTML pages → Network first, cache fallback (BFCache-এর সাথে compatible)
    if (e.request.destination === 'document') {
        e.respondWith(
            fetch(e.request)
                .then(res => {
                    if (res.ok) {
                        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
                    }
                    return res;
                })
                .catch(() => caches.match(e.request) || caches.match('/index.html'))
        );
        return;
    }

    // ৫. CSS, JS → Stale-While-Revalidate
    if (e.request.destination === 'style' || e.request.destination === 'script') {
        e.respondWith(
            caches.open(CACHE).then(c =>
                c.match(e.request).then(cached => {
                    const fetchPromise = fetch(e.request).then(res => {
                        if (res.ok) c.put(e.request, res.clone());
                        return res;
                    }).catch(() => cached);
                    return cached || fetchPromise;
                })
            )
        );
        return;
    }

    // ৬. বাকি সব → Network first
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});

// ===== CACHE TRIM (image cache size limit) =====
async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys  = await cache.keys();
    if (keys.length > maxItems) {
        // পুরানো গুলো সরাও
        const toDelete = keys.slice(0, keys.length - maxItems);
        await Promise.all(toDelete.map(k => cache.delete(k)));
    }
}
