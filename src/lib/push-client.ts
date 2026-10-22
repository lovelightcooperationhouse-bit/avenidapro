import { createClient } from "@/lib/supabase/client";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!KEY;

function keyToBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** L'appareil est-il déjà abonné aux notifications push ? */
export async function pushSubscribed() {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  return !!(await reg?.pushManager.getSubscription());
}

/** Demande l'autorisation et enregistre l'appareil pour le membre connecté. */
export async function subscribePush(profileId: string) {
  if (!pushSupported()) return { ok: false, reason: "Navigateur non compatible (sur iPhone : installez d'abord l'application)." };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "Notifications refusées dans le navigateur." };
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(KEY!) }));
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const { error } = await createClient()
    .from("push_subscriptions")
    .upsert({ profile_id: profileId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, user_agent: navigator.userAgent.slice(0, 200) }, { onConflict: "endpoint" });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

/** Désactive les notifications push sur cet appareil. */
export async function unsubscribePush() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await createClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

/** Prévient les autres membres d'une discussion (appel ou message), même application fermée. */
export function pushConversation(body: { conversationId: string; kind: "call" | "message"; video?: boolean; callId?: string; room?: string; preview?: string }) {
  return fetch("/api/push/conversation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
}
