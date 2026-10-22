/** Déclenche l'envoi des notifications en attente (e-mail / SMS) après une action ; sans effet si rien n'est configuré. */
export function pingNotifications() {
  if (typeof window === "undefined") return;
  fetch("/api/notifications/envoyer", { method: "POST" }).catch(() => {
    /* l'envoi sera repris par la tâche planifiée */
  });
}
