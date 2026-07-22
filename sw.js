const CACHE='sobre-ruedas-v170';
const CORE=['./','./index.html','./manifest.webmanifest','./icon.svg','./brand-logo.jpg','./logo-completo.jpg','./logo-login.jpg','./logo-oficial.jpg','./icon-96.png','./icon-180.png','./icon-192.png','./icon-512.png','./icon-1024.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put('./index.html',c));return r}).catch(()=>caches.match('./index.html')));return}e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
