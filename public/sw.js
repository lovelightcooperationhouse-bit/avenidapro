/* Service worker Avenida : installation comme application, fonctionnement hors connexion de base. */
const VERSION = "avenida-v2";
const OFFLINE = "/hors-ligne.html";
const PRECACHE = [OFFLINE, "/icons/icon-192.png", "/icons/icon-512.png", "/logoavenida.jpg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, visio… : jamais mis en cache

  // Pages : réseau d'abord, page hors connexion sinon
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }

  // Fichiers statiques versionnés de Next.js, icônes et images du site : cache d'abord
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/site/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
  }
});

/* Notifications push : affichage (même site fermé) et ouverture de la bonne page au clic */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Avenida", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Hôtel École Avenida";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      renotify: !!data.call,
      requireInteraction: !!data.call,
      vibrate: data.call ? [400, 200, 400, 200, 400, 200, 400] : [200],
      data: { url: data.url || "/espace/notifications" },
      actions: data.call ? [{ action: "repondre", title: "Répondre" }] : [],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/espace", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && "focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
