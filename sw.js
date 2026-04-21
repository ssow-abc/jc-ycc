/* ── Service Worker Journal de Caisse YCC v2.0 ── */
const CACHE_NAME = 'caisse-ycc-v2.1';  /* Changer ce numéro à chaque mise à jour */
const ASSETS = [
  './index.html',
  './manifest.json'
];

/* Installation : mettre en cache */
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); /* Prendre le contrôle immédiatement */
});

/* Activation : supprimer TOUS les anciens caches */
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim(); /* Prendre le contrôle de tous les onglets */
});

/* Fetch : réseau d'abord, cache en fallback (network-first) */
self.addEventListener('fetch', function(e){
  /* Ne pas mettre en cache les requêtes POST (sync GAS) */
  if(e.request.method !== 'GET'){
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(function(response){
        /* Mettre à jour le cache avec la nouvelle version */
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(e.request, responseClone);
        });
        return response;
      })
      .catch(function(){
        /* Hors ligne : servir depuis le cache */
        return caches.match(e.request).then(function(cached){
          return cached || caches.match('./index.html');
        });
      })
  );
});
