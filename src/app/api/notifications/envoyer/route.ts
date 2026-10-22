import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { pushReady, sendPush } from "@/lib/push-server";
import { createClient } from "@/lib/supabase/server";

/**
 * Envoi des notifications en attente par e-mail (Resend) et SMS (Africa's Talking).
 * - Appelé après chaque action qui notifie (appel, permission, carte…) et par une tâche planifiée.
 * - Sans clé de fournisseur, les notifications restent « en attente » et partiront dès la configuration.
 *
 * Variables d'environnement (Vercel) :
 *   SUPABASE_SERVICE_ROLE_KEY            obligatoire pour lire les adresses des destinataires
 *   RESEND_API_KEY, NOTIFY_FROM_EMAIL    e-mails (ex. « Hôtel École Avenida <notifications@hotelecoleavenida.net> »)
 *   SMS, au choix (Twilio prioritaire si configuré) :
 *     TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_MESSAGING_SERVICE_SID ou TWILIO_FROM (numéro ou nom d'expéditeur)
 *     AFRICASTALKING_USERNAME, AFRICASTALKING_API_KEY, AFRICASTALKING_SENDER_ID (facultatif)
 *   CRON_SECRET                          autorise l'appel par la tâche planifiée
 */
export async function POST(request: NextRequest) {
  // Appel autorisé : utilisateur connecté (déclenchement après une action) ou tâche planifiée
  const cron = request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` && !!process.env.CRON_SECRET;
  if (!cron) {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json(await dispatch());
}

export const GET = POST;

async function dispatch() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const sendSms = smsSender();
  if (!url || !serviceKey) return { email: "non configuré", sms: "non configuré", reason: "SUPABASE_SERVICE_ROLE_KEY manquant" };

  const admin = createAdmin(url, serviceKey, { auth: { persistSession: false } });
  const site = process.env.NEXT_PUBLIC_APP_URL || "https://www.hotelecoleavenida.net";
  const result = { emails: 0, sms: 0, push: 0, emailProvider: !!resendKey, smsProvider: sendSms?.provider ?? false, pushProvider: pushReady() };

  // Notifications push (téléphone, ordinateur), même site fermé
  if (pushReady()) {
    const { data } = await admin.from("notifications").select("id, profile_id, title, body, link").eq("push_status", "pending").order("created_at").limit(100);
    for (const n of data ?? []) {
      const sent = await sendPush(admin, [n.profile_id], { title: n.title, body: n.body ?? undefined, url: n.link ?? "/espace/notifications", tag: n.id });
      await admin.from("notifications").update({ push_status: sent ? "sent" : "skipped" }).eq("id", n.id);
      result.push += sent;
    }
  }

  if (resendKey) {
    const { data } = await admin.from("notifications").select("id, title, body, link, profiles(email, first_name)").eq("email_status", "pending").order("created_at").limit(50);
    for (const n of data ?? []) {
      const p = n.profiles as unknown as { email: string | null; first_name: string | null } | null;
      if (!p?.email || p.email.endsWith("@ecole-avenida.tg")) {
        // Adresses internes de démonstration : pas d'envoi réel
        await admin.from("notifications").update({ email_status: "skipped" }).eq("id", n.id);
        continue;
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.NOTIFY_FROM_EMAIL || "Hôtel École Avenida <onboarding@resend.dev>",
          to: [p.email],
          subject: n.title,
          html: emailHtml(p.first_name, n.title, n.body, n.link ? `${site}${n.link}` : site),
        }),
      });
      await admin.from("notifications").update({ email_status: res.ok ? "sent" : "failed" }).eq("id", n.id);
      if (res.ok) result.emails += 1;
    }
  }

  if (sendSms) {
    const { data } = await admin.from("notifications").select("id, title, body, profiles(phone)").eq("sms_status", "pending").in("kind", ["presence", "permission", "paiement", "carte", "alerte"]).order("created_at").limit(50);
    for (const n of data ?? []) {
      const phone = (n.profiles as unknown as { phone: string | null } | null)?.phone?.replace(/[^\d+]/g, "");
      if (!phone || phone.length < 8) {
        await admin.from("notifications").update({ sms_status: "skipped" }).eq("id", n.id);
        continue;
      }
      const to = phone.startsWith("+") ? phone : `+228${phone}`;
      const res = await sendSms.send(to, `AVENIDA : ${n.title}. ${n.body ?? ""}`.slice(0, 300));
      await admin.from("notifications").update({ sms_status: res.ok ? "sent" : "failed" }).eq("id", n.id);
      if (res.ok) result.sms += 1;
    }
  }
  return result;
}

/** Fournisseur SMS configuré : Twilio en priorité, sinon Africa's Talking ; null si aucun. */
function smsSender() {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: tok, TWILIO_MESSAGING_SERVICE_SID: service, TWILIO_FROM: from } = process.env;
  if (sid && tok && (service || from)) {
    return {
      provider: "twilio",
      send: (to: string, message: string) => {
        const form = new URLSearchParams({ To: to, Body: message });
        if (service) form.set("MessagingServiceSid", service);
        else form.set("From", from!);
        return fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: "POST",
          headers: { Authorization: `Basic ${Buffer.from(`${sid}:${tok}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: form,
        });
      },
    };
  }
  const { AFRICASTALKING_USERNAME: atUser, AFRICASTALKING_API_KEY: atKey, AFRICASTALKING_SENDER_ID: atFrom } = process.env;
  if (atUser && atKey) {
    return {
      provider: "africastalking",
      send: (to: string, message: string) => {
        const form = new URLSearchParams({ username: atUser, to, message });
        if (atFrom) form.set("from", atFrom);
        return fetch("https://api.africastalking.com/version1/messaging", {
          method: "POST",
          headers: { apiKey: atKey, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
          body: form,
        });
      },
    };
  }
  return null;
}

const esc = (s: string | null) => (s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function emailHtml(name: string | null, title: string, body: string | null, link: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
    <tr><td style="background:#06152E;padding:20px 24px;color:#fff;font-size:18px;font-weight:bold;letter-spacing:1px">HÔTEL ÉCOLE <span style="color:#FF3B47">AVENIDA</span></td></tr>
    <tr><td style="height:4px;background:linear-gradient(90deg,#0C356A 33%,#ffffff 33%,#ffffff 66%,#E30613 66%)"></td></tr>
    <tr><td style="padding:28px 24px">
      <p style="margin:0 0 12px">Bonjour${name ? ` ${esc(name)}` : ""},</p>
      <h1 style="margin:0 0 12px;font-size:20px;color:#0C356A">${esc(title)}</h1>
      <p style="margin:0 0 24px;line-height:1.6">${esc(body)}</p>
      <a href="${link}" style="display:inline-block;background:#E30613;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">Ouvrir mon espace</a>
    </td></tr>
    <tr><td style="padding:16px 24px;background:#f8fafc;font-size:12px;color:#64748b">Hôtel École Avenida · 30, rue d'Almeida Léopold, Cocoteraie, Lomé · Travail – Discipline – Excellence</td></tr>
  </table></td></tr></table></body></html>`;
}
