const CACHE_NAME = 'guangqing-temple-v1.0.0';
const urlsToCache = [
  './index-enhanced.html',
  './manifest.json',
  'https://unpkg.com/vue@3.3.4/dist/vue.global.js',
  'https://unpkg.com/element-plus@2.3.8/dist/index.css',
  'https://unpkg.com/element-plus@2.3.8/dist/index.full.js',
  'https://unpkg.com/@element-plus/icons-vue@2.1.0/dist/index.iife.min.js',
  'https://unpkg.com/echarts@5.4.3/dist/echarts.min.js',
  'https://unpkg.com/dayjs@1.11.9/dayjs.min.js'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 攔截網路請求
self.addEventListener('fetch', event => {
  // 過濾不支援的協議
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // 過濾 chrome-extension 和其他不支援的協議
  if (event.request.url.startsWith('chrome-extension://') ||
      event.request.url.startsWith('moz-extension://') ||
      event.request.url.startsWith('safari-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在快取中找到，返回快取版本
        if (response) {
          return response;
        }

        // 否則從網路獲取
        return fetch(event.request).then(response => {
          // 檢查是否為有效回應
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 複製回應
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              // 再次檢查 URL 協議
              if (event.request.url.startsWith('http')) {
                cache.put(event.request, responseToCache);
              }
            })
            .catch(error => {
              console.warn('快取儲存失敗:', error);
            });

          return response;
        }).catch(error => {
          console.warn('網路請求失敗:', error);
          // 返回離線頁面或預設回應
          return new Response('離線模式', {
            status: 200,
            statusText: 'OK',
            headers: new Headers({
              'Content-Type': 'text/html; charset=utf-8'
            })
          });
        });
      })
  );
});

// 更新 Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 推送通知支援
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '您有新的提醒',
    icon: './icon.svg',
    badge: './icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看詳情',
        icon: './icon.svg'
      },
      {
        action: 'close',
        title: '關閉',
        icon: './icon.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('廣清宮記帳提醒', options)
  );
});

// 處理通知點擊
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    // 打開應用
    event.waitUntil(
      clients.openWindow('./index-enhanced.html')
    );
  }
});