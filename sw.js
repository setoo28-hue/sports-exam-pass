const C='sd-v2';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(
  caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())
)});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  const isHTML = e.request.mode==='navigate' || (e.request.headers.get('accept')||'').includes('text/html')
    || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if(isHTML){
    // 항상 네트워크 우선: 새 배포가 바로 반영되고, 오프라인일 때만 캐시 사용
    e.respondWith(fetch(e.request).then(res=>{
      const cl=res.clone(); caches.open(C).then(c=>c.put(e.request,cl)); return res;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
      const cl=res.clone(); caches.open(C).then(c=>c.put(e.request,cl)); return res;
    })));
  }
});
