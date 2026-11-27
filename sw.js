/* 떠날지도 서비스 워커: 앱 화면은 오프라인에서도 열리게 캐시, 데이터(영상·환율·날씨)는 항상 네트워크 */
const CACHE = 'trip-reels-v18';
const SHELL = ['./', './index.html', './style.css', './app.js', './data.js', './photos.js', './spotinfo.js', './data-en.js', './data-en-spots.js', './data-en-places.js', './lang.js', './config.js', './icon.svg', './icon-192.png', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // 앱 파일: 네트워크 우선(최신 반영), 실패하면 캐시
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
