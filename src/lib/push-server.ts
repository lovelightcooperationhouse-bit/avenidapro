import type { SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";

export type PushPayload = { title: string; body?: string; url?: string; tag?: string; call?: boolean };

let configured: boolean | null = null;

/** Prépare l'envoi (clés VAPID) ; false si les variables ne sont pas configurées. */
export function pushReady() {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (configured = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:avenidahotel1994@gmail.com", pub, priv);
  return (configured = true);
}

/**
 * Envoie une notification push à tous les appareils des membres indiqués.
 * Les abonnements expirés (appareil désinstallé, autorisation retirée) sont supprimés.
 */
export async function sendPush(admin: SupabaseClient, profileIds: string[], payload: PushPayload) {
  if (!pushReady() || !profileIds.length) return 0;
  const { data: subs } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").in("profile_id", profileIds);
  let sent = 0;
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: payload.call ? 60 : 86_400, urgency: payload.call ? "high" : "normal" });
        sent += 1;
        await admin.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", s.id);
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await admin.from("push_subscriptions").delete().eq("id", s.id);
      }
    })
  );
  return sent;
}
