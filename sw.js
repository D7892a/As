/* ============================================
   Service Worker — تشغيل النظام بدون إنترنت
   ============================================ */

const CACHE = 'iq-cashier-v3';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/db.js', './js/auth.js', './js/ui.js', './js/pos.js', './js/sections.js',
    './js/offers.js', './js/tables.js', './js/kitchen.js', './js/finance.js',
    './js/inventory.js', './js/users.js', './js/admin.js', './js/reports.js',
    './js/settings.js', './js/delivery.js', './js/reservations.js',
    './js/suppliers.js', './js/payroll.js', './js/dashboard.js',
    './js/qrmenu.js', './js/power.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE)
            .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;

    // شبكة أولاً للمستندات، مع رجوع للكاش عند انقطاع الاتصال
    if (req.mode === 'navigate') {
        e.respondWith(
            fetch(req).catch(() => caches.match('./index.html'))
        );
        return;
    }

    // كاش أولاً لباقي الملفات
    e.respondWith(
        caches.match(req).then(hit => hit || fetch(req).then(res => {
            const copy = res.clone();
            if (res.ok && new URL(req.url).origin === location.origin) {
                caches.open(CACHE).then(c => c.put(req, copy));
            }
            return res;
        }).catch(() => hit))
    );
});
