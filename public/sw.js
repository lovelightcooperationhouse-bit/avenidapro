/*
 * Service worker Avenida : installation comme application et fonctionnement hors connexion.
 * - Pages déjà ouvertes : disponibles hors connexion (réseau d'abord, copie locale sinon).
 * - Données lues (élèves, notes, paiements…) : dernière version consultable hors connexion.
 * - Les enregistrements demandent le réseau ; la copie locale est effacée à la déconnexion.
 */
const VERSION = "avenida-v4";
const PAGES = "avenida-pages";
const DATA = "avenida-data";
const OFFLINE = "/hors-ligne.html";
const PRECACHE = [OFFLINE, "/icons/icon-192.png", "/icons/icon-512.png", "/logo-avenida.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![VERSION, PAGES, DATA].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Lectures de la base (Supabase REST) : réseau d'abord, dernière réponse connue hors connexion
  if (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/rest/v1/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(DATA).then((c) => c.put(req.url, copy));
          }
          return res;
        })
        .catch(() => caches.open(DATA).then((c) => c.match(req.url)).then((hit) => hit || Response.json([], { headers: { "x-avenida-offline": "1" } })))
    );
    return;
  }
  if (url.origin !== self.location.origin) return; // Authentification, visio, fichiers : jamais mis en cache

  // Pages : réseau d'abord ; hors connexion, la dernière version de la page, sinon la page d'information
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && !url.pathname.startsWith("/api/")) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(() => caches.open(PAGES).then((c) => c.match(url.pathname)).then((hit) => hit || caches.match(OFFLINE)))
    );
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

/* Déconnexion : les copies locales des pages et des données sont effacées */
self.addEventListener("message", (event) => {
  if (event.data === "avenida-clear-data") {
    event.waitUntil(Promise.all([caches.delete(DATA), caches.delete(PAGES)]));
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
