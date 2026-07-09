const CACHE_VERSION = "lifegrid-sw-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("lifegrid-sw-") && cacheName !== CACHE_VERSION)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("push", (event) => {
  const fallbackPayload = {
    title: "LifeGrid",
    body: "A LifeGrid update is ready.",
    url: "/notifications"
  };

  const payload = event.data ? safeParsePushPayload(event.data, fallbackPayload) : fallbackPayload;
  const notificationTitle = payload.title || fallbackPayload.title;
  const notificationOptions = {
    body: payload.body || payload.message || fallbackPayload.body,
    icon: "/icons/lifegrid-icon.svg",
    badge: "/favicon.svg",
    data: {
      url: payload.url || payload.targetHref || fallbackPayload.url
    }
  };

  event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "/notifications", self.location.origin);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const matchingClient = clientList.find((client) => {
        try {
          return new URL(client.url).origin === targetUrl.origin;
        } catch {
          return false;
        }
      });

      if (matchingClient) {
        return matchingClient.focus().then((client) => client.navigate(targetUrl.href));
      }

      return self.clients.openWindow(targetUrl.href);
    })
  );
});

function safeParsePushPayload(pushData, fallbackPayload) {
  try {
    return pushData.json();
  } catch {
    try {
      return { ...fallbackPayload, body: pushData.text() };
    } catch {
      return fallbackPayload;
    }
  }
}
