/* New World — service worker : appli disponible hors ligne, mises à jour automatiques */
const CACHE = 'newworld-v12';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png?v=2', './icon-512.png?v=2', './icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: 'reload'}))))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('newworld-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const good = res => res && res.ok && !res.redirected && res.type === 'basic';
  if (r.mode === 'navigate') {
    const net = fetch(r).then(res => { if (good(res)) { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); } return res; });
    e.waitUntil(net.then(() => {}, () => {}));
    const cached = () => caches.match('./index.html').then(m => m || caches.match('./'));
    e.respondWith(new Promise(done => {
      let sent = false; const send = x => { if (!sent && x) { sent = true; done(x); } };
      const timer = setTimeout(() => cached().then(send), 3000);
      net.then(res => { clearTimeout(timer); good(res) ? send(res) : cached().then(m => send(m || res)); })
         .catch(() => { clearTimeout(timer); cached().then(m => send(m || new Response('Hors ligne', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}}))); });
    }));
    return;
  }
  /* manifeste : réseau d'abord (pour que le navigateur voie toujours la bonne version) */
  if (r.url.includes('manifest')) { e.respondWith(fetch(r).catch(() => caches.match(r))); return; }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (good(res)) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })));
});
