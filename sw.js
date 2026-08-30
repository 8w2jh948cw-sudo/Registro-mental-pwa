const CACHE='registro-v21-0.4.16';
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
  './v04c10.js?v=0.4.6',
  './v04c11.js?v=0.4.4',
  './v04c12.js?v=0.4.5',
  './v04c13.js?v=0.4.6',
  './v04c14.js?v=0.4.7',
  './v04c15.js?v=0.4.14',
  './v04c16.js?v=0.4.11',
  './v04c17.js?v=0.4.16',
  './v04demo.js?v=0.4.1',
  './v04tabbar.js?v=0.4.2',
  './v04navicons.js?v=0.4.10',
  './manifest.webmanifest?v=0.4.0',
  './tabbar-lab.html',
  './tabbar-editor.html'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;const network=()=>fetch(event.request,url.pathname.endsWith('/v04navicons.js')?{cache:'reload'}:undefined);event.respondWith(network().then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))))});