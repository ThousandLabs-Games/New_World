/* New World — service worker : hors ligne + mises à jour automatiques */
const CACHE="newworld-v5", ASSETS=["./","index.html","manifest.json","icon.svg","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith("newworld-")&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;
  if(r.mode==="navigate"){ // réseau d'abord (mises à jour), copie locale si hors ligne ou lent
    const good=res=>res&&res.ok&&!res.redirected&&res.type==="basic";
    const net=fetch(r).then(res=>{if(good(res)){const cp=res.clone();caches.open(CACHE).then(c=>c.put("index.html",cp));}return res;});
    e.respondWith(new Promise(done=>{let sent=false;const send=x=>{if(!sent&&x){sent=true;done(x);}};const cached=()=>caches.match("index.html");
      const t=setTimeout(()=>cached().then(send),3000);
      net.then(res=>{clearTimeout(t);good(res)?send(res):cached().then(m=>send(m||res));}).catch(()=>{clearTimeout(t);cached().then(m=>send(m||new Response("Hors ligne",{status:503})));});}));
    return;}
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok&&res.type==="basic"){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}return res;})));
});
