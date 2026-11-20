const C = 'sd-v6';
const CORE = ['./', './index.html', './qb.json', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(CORE).catch(() => {})));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const isHTML = e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html')
    || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (isHTML || url.pathname.endsWith('/qb.json')) {
    // 네트워크 우선: 새 배포·새 문항이 바로 반영되고, 오프라인일 때만 캐시 사용
    e.respondWith(fetch(e.request).then(res => {
      const cl = res.clone();
      caches.open(C).then(c => c.put(e.request, cl));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
    return;
  }
  // 그림·아이콘 등 정적 자원: 캐시 우선 + 백그라운드 갱신
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(res => {
      const cl = res.clone();
      caches.open(C).then(c => c.put(e.request, cl));
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
