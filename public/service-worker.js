// Nome do cache atual
const CACHE_NAME = 'carlach-detailing-v1';

// Lista de arquivos para armazenar em cache
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  // Adicione outros recursos estáticos que deseja armazenar em cache
];

// Instala o Service Worker e armazena em cache os recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativa o Service Worker e remove caches antigos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estratégia de cache: Network First, fallback para cache
self.addEventListener('fetch', (event) => {
  // Ignora requisições de navegadores (extensões, etc.)
  if (!(event.request.url.indexOf('http') === 0)) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Verifica se a resposta é válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clona a resposta
        const responseToCache = response.clone();

        // Armazena a resposta em cache
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Se a rede falhar, tenta buscar do cache
        return caches.match(event.request)
          .then((response) => {
            // Retorna a resposta do cache ou uma página de fallback
            return response || caches.match('/offline.html');
          });
      })
  );
});

// Atualização em segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-appointments') {
    console.log('Sincronizando agendamentos...');
    // Implemente a lógica de sincronização aqui
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'Carlach Detailing';
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: 'carlach-notification'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
