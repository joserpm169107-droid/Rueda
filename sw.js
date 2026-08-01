const CACHE_NAME='sobre-ruedas-v290';
const APP_SHELL=[
  './','./index.html','./conductor.html','./admin.html',
  './manifest.webmanifest','./conductor.webmanifest',
  './icon-96.png','./icon-180.png','./icon-192.png','./icon-512.png',
  './logo-oficial.jpg','./logo-completo.jpg','./logo-login.jpg','./brand-logo.jpg',
  './v270.css','./v270.js','./v280.css','./v280.js','./v290.css','./v290.js',
  './admin-v270.css','./admin-v270.js','./admin-v280.css','./admin-v280.js','./admin-v290.css','./admin-v290.js','./assets/brand-mark.svg','./assets/brand-wordmark.svg','./assets/moto.svg'
];
self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{
      const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));return response;
    }).catch(()=>caches.match(request).then(match=>match||caches.match(url.pathname.includes('conductor')?'./conductor.html':url.pathname.includes('admin')?'./admin.html':'./index.html'))));
    return;
  }
  event.respondWith(fetch(request).then(response=>{
    if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()));return response;
  }).catch(()=>caches.match(request)));
});
