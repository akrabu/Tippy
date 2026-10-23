const CACHE = 'tipsy-v0.1.2-007';
const ASSETS = ['./','./index.html','./styles.css?v=0.1.2-007','./app.mjs?v=0.1.2-007','./calc.mjs','./install.mjs','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',(event)=>{event.waitUntil(caches.open(CACHE).then((cache)=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',(event)=>{event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key.startsWith('tipsy-')&&key!==CACHE).map((key)=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',(event)=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  const appRoot=new URL('./',self.location.href);
  const appIndex=new URL('./index.html',self.location.href);
  if(event.request.mode==='navigate'&&(url.pathname===appRoot.pathname||url.pathname===appIndex.pathname)){
    event.respondWith(fetch(event.request).then((response)=>{
      if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw new Error('App page unavailable');
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE).then((cache)=>cache.put('./index.html',copy)));
      return response;
    }).catch(async()=>await caches.match('./index.html')||Response.error()));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached)=>cached||fetch(event.request)));
});
