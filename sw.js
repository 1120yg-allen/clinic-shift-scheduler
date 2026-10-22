/*
 * Service Worker：讓網站可以安裝成 App，並在沒有網路時還能打開畫面。
 * - 只處理同一個網站的檔案（程式、樣式、圖示）。
 * - Supabase 的 API、字型、外部套件都不經過這裡，所以排班資料永遠是最新的，不會被快取。
 * - 更新程式後，把 VERSION 加 1，使用者下次開啟就會換成新版。
 */
const VERSION = 'v1';
const CACHE = 'clinic-shift-' + VERSION;
const SHELL = [
  './', 'index.html', 'styles.css', 'config.js', 'manifest.webmanifest',
  'src/app.js', 'src/platform.js', 'src/adapters/local.js', 'src/adapters/supabase.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('clinic-shift-') === 0 && k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // 外部資源與 API 不處理
  var networkFirst = req.mode === 'navigate' || url.pathname.slice(-10) === '/config.js';
  if (networkFirst) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match('index.html'); }); })
    );
    return;
  }
  // 其他檔案：先給快取，同時在背景更新
  e.respondWith(
    caches.match(req).then(function (cached) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return cached; });
      return cached || net;
    })
  );
});
