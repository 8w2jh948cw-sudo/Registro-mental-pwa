const CACHE='registro-v34-0.4.26';
const FILES=[
  './',
  './index.html',
  './styles.css?v=0.4.0',
  './enhancements.css?v=0.4.0',
  './v04.css?v=0.4.0',
  './v04c1.js?v=0.4.0',
  './v04c2.js?v=0.4.0',
  './v04c3.js?v=0.4.0',
  './v04c4.js?v=0.4.0',
  './v04c5.js?v=0.4.0',
  './v04c6.js?v=0.4.0',
  './v04c7.js?v=0.4.0',
  './v04c8.js?v=0.4.0',
  './v04c9.js?v=0.4.0',
  './v04c10.js?v=0.4.19',
  './v04c10.js?v=0.4.25',
  './v04c11.js?v=0.4.25',
  './v04c12.js?v=0.4.25',
  './v04c13.js?v=0.4.25',
  './v04c14.js?v=0.4.25',
  './v04c15.js?v=0.4.25',
  './v04c16.js?v=0.4.25',
  './v04c18.js?v=0.4.25',
  './v04c19.js?v=0.4.25',
  './v04c20.js?v=0.4.25',
  './v04c21.js?v=0.4.25',
  './v04c22.js?v=0.4.25',
  './v04c23.js?v=0.4.25',
  './v04c24.js?v=0.4.25',
  './v04c25.js?v=0.4.25',
  './v04c26.js?v=0.4.26',
  './v04demo.js?v=0.4.25',
  './v04tabbar.js?v=0.4.2',
  './v04navicons.js?v=0.4.10',
  './v04navicons.js?v=0.4.26',
  './manifest.webmanifest?v=0.4.0',
  './tabbar-lab.html',
  './tabbar-editor.html',
  './dev-editor.html'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  const isStatic=['script','style','font','image'].includes(request.destination)||/\.(?:js|css|webmanifest)$/i.test(url.pathname);
  if(isStatic){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE),cached=await cache.match(request);
      if(cached)return cached;
      try{const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response}catch{return new Response('Offline',{status:503,statusText:'Offline'})}
    })());
    return;
  }

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    let cached=await cache.match(request);
    if(!cached&&request.mode==='navigate'){
      const path=url.pathname.split('/').pop();
      if(path==='tabbar-lab.html')cached=await cache.match('./tabbar-lab.html');
      else if(path==='tabbar-editor.html')cached=await cache.match('./tabbar-editor.html');
      else cached=await cache.match('./index.html');
    }
    const refresh=fetch(request,{cache:'no-cache'}).then(async response=>{if(response&&response.ok)await cache.put(request,response.clone());return response}).catch(()=>null);
    if(cached){event.waitUntil(refresh);return cached}
    const network=await refresh;
    if(network)return network;
    return (await cache.match('./index.html'))||new Response('Offline',{status:503,statusText:'Offline'});
  })());
});
