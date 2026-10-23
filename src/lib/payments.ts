import { createClient as createAdmin, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Paiement en ligne des réservations de l'hôtel.
 *   Carte bancaire : Stripe Checkout (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
 *   Mixx by Yas (T-Money) et Moov Money (Flooz) : PayGate Global (PAYGATE_AUTH_TOKEN)
 * Un paiement n'est jamais validé sur la seule parole du navigateur : le serveur interroge le prestataire
 * (statut de la session Stripe, statut PayGate) avant d'enregistrer l'encaissement.
 */
export type OnlineMethod = "carte" | "yas" | "moov";

export const onlineMethods = (): Record<OnlineMethod, boolean> => ({
  carte: !!process.env.STRIPE_SECRET_KEY,
  yas: !!process.env.PAYGATE_AUTH_TOKEN,
  moov: !!process.env.PAYGATE_AUTH_TOKEN,
});

export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createAdmin(url, key, { auth: { persistSession: false } }) : null;
}

type Reservation = { id: string; booking_ref: string; token: string; room_type: string | null; room_number: string | null; customer_email: string | null; customer_phone: string | null; total_price: number; deposit_paid: number | null; status: string; hold_until: string | null; room_uuid: string | null; check_in: string; check_out: string };

/** Démarre un paiement en ligne et renvoie l'adresse de la page de paiement du prestataire. */
export async function startPayment(token: string, method: OnlineMethod, origin: string): Promise<{ url: string } | { error: string }> {
  const admin = adminClient();
  if (!admin) return { error: "Paiement en ligne indisponible (configuration du serveur)." };
  if (!onlineMethods()[method]) return { error: "Ce moyen de paiement n'est pas encore activé. Choisissez le paiement à l'arrivée ou un autre moyen." };

  const { data: v } = await admin.from("reservations").select("id, booking_ref, token, room_type, room_number, customer_email, customer_phone, total_price, deposit_paid, status, hold_until, room_uuid, check_in, check_out").eq("token", token).maybeSingle<Reservation>();
  if (!v) return { error: "Réservation introuvable." };
  if (v.status === "annulée") return { error: "Cette réservation est annulée." };
  const due = Number(v.total_price) - Number(v.deposit_paid ?? 0);
  if (due <= 0) return { error: "Cette réservation est déjà soldée." };

  // Délai de paiement dépassé : la chambre doit être encore libre, puis elle est de nouveau bloquée pendant le paiement
  if (v.status === "paiement_en_cours" && v.hold_until && new Date(v.hold_until) < new Date() && v.room_uuid) {
    const { data: free } = await admin.rpc("room_is_free", { rid: v.room_uuid, d_in: v.check_in, d_out: v.check_out, except_res: v.id });
    if (!free) return { error: "Le délai de paiement est dépassé et la chambre a été réservée entre-temps. Contactez la réception." };
  }
  const { data: conf } = await admin.rpc("loyalty_conf");
  const hold = new Date(Date.now() + Number((conf as { holdMinutes?: number } | null)?.holdMinutes ?? 30) * 60_000).toISOString();
  if (v.status !== "confirmée" && v.status !== "réservée") await admin.from("reservations").update({ status: "paiement_en_cours", hold_until: hold }).eq("id", v.id);

  const identifier = `${v.booking_ref}-${Date.now().toString(36).toUpperCase()}`;
  const provider = method === "carte" ? "stripe" : "paygate";
  const { error: insErr } = await admin.from("reservation_payments").insert({ reservation_id: v.id, provider, method, amount: due, identifier, status: "en_cours" });
  if (insErr) return { error: insErr.message };
  const back = `${origin}/api/reservations/retour?id=${encodeURIComponent(identifier)}`;
  const label = `Réservation ${v.booking_ref} · ${v.room_type ?? "Chambre"} ${v.room_number ?? ""}`.trim();

  if (provider === "stripe") {
    const form = new URLSearchParams({
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "xof",
      "line_items[0][price_data][unit_amount]": String(due), // le franc CFA n'a pas de centimes
      "line_items[0][price_data][product_data][name]": label,
      success_url: back,
      cancel_url: `${origin}/reservation/${v.token}?paiement=annule`,
      client_reference_id: identifier,
      "metadata[identifier]": identifier,
      "metadata[booking_ref]": v.booking_ref,
      locale: "fr",
    });
    if (v.customer_email) form.set("customer_email", v.customer_email);
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const s = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!res.ok || !s.url) {
      await admin.from("reservation_payments").update({ status: "echoue", raw: s }).eq("identifier", identifier);
      return { error: `Paiement par carte indisponible : ${s.error?.message ?? "erreur du prestataire"}` };
    }
    await admin.from("reservation_payments").update({ provider_ref: s.id }).eq("identifier", identifier);
    return { url: s.url };
  }

  // PayGate Global : page de paiement Mixx by Yas (T-Money) ou Moov Money (Flooz)
  const q = new URLSearchParams({ token: process.env.PAYGATE_AUTH_TOKEN!, amount: String(due), description: label, identifier, url: back });
  const phone = (v.customer_phone ?? "").replace(/\D/g, "").replace(/^228/, "");
  if (phone.length === 8) q.set("phone", phone);
  return { url: `https://paygateglobal.com/v1/page?${q}` };
}

/** Interroge le prestataire ; si le paiement est confirmé, l'enregistre (une seule fois). */
export async function verifyPayment(identifier: string): Promise<{ ok: boolean; token?: string; pending?: boolean; fresh?: boolean; error?: string }> {
  const admin = adminClient();
  if (!admin) return { ok: false, error: "configuration" };
  const { data: pay } = await admin.from("reservation_payments").select("id, provider, amount, status, provider_ref, reservations(token)").eq("identifier", identifier).maybeSingle();
  if (!pay) return { ok: false, error: "Paiement inconnu" };
  const token = (pay.reservations as unknown as { token: string } | null)?.token;
  if (pay.status === "reussi") return { ok: true, token };

  let paid = false;
  let ref: string | null = null;
  let details: unknown = null;
  if (pay.provider === "stripe" && pay.provider_ref) {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${pay.provider_ref}`, { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } });
    const s = (await res.json()) as { payment_status?: string; amount_total?: number; payment_intent?: string };
    paid = res.ok && s.payment_status === "paid" && Number(s.amount_total) >= Number(pay.amount);
    ref = s.payment_intent ?? pay.provider_ref;
    details = s;
  } else if (pay.provider === "paygate") {
    const res = await fetch("https://paygateglobal.com/api/v2/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth_token: process.env.PAYGATE_AUTH_TOKEN, identifier }),
    });
    const s = (await res.json().catch(() => ({}))) as { status?: number; tx_reference?: string; payment_reference?: string; payment_method?: string };
    paid = res.ok && Number(s.status) === 0; // 0 = paiement réussi, 2 = en cours, 4 = expiré, 6 = annulé
    ref = s.payment_reference ?? s.tx_reference ?? null;
    details = s;
    if (res.ok && (Number(s.status) === 4 || Number(s.status) === 6)) await admin.from("reservation_payments").update({ status: "echoue", raw: s }).eq("id", pay.id);
    if (!paid) return { ok: false, token, pending: Number(s.status) === 2 };
  }
  if (!paid) return { ok: false, token };
  const { data: applied, error } = await admin.rpc("apply_online_payment", { ident: identifier, pref: ref, details });
  if (error) return { ok: false, token, error: error.message };
  const fresh = !(applied as { already?: boolean } | null)?.already;
  if (fresh && token) await emailPaid(admin, token);
  return { ok: true, token, fresh };
}

/** Reçu mis à jour envoyé au client après un paiement confirmé. */
async function emailPaid(admin: SupabaseClient, token: string) {
  const { data: v } = await admin.from("reservations").select("booking_ref, customer_name, customer_email, total_price, deposit_paid").eq("token", token).maybeSingle();
  if (!v) return;
  const rest = Number(v.total_price) - Number(v.deposit_paid ?? 0);
  const site = process.env.NEXT_PUBLIC_APP_URL || "https://www.hotelecoleavenida.net";
  await sendBookingEmail(
    v.customer_email,
    v.customer_name,
    rest > 0 ? `Paiement reçu · réservation ${v.booking_ref}` : `Réservation ${v.booking_ref} soldée`,
    rest > 0 ? `Nous avons bien reçu votre paiement. Reste à régler : ${rest.toLocaleString("fr-FR")} F CFA.` : "Votre paiement est confirmé : votre chambre vous est réservée. Présentez ce reçu à la réception à votre arrivée.",
    `${site}/reservation/${token}`,
  );
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** E-mail au client (avec ou sans compte) : lien vers son reçu de réservation. */
export async function sendBookingEmail(to: string | null, name: string, subject: string, text: string, link: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to || to.endsWith("@ecole-avenida.tg")) return false;
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
    <tr><td style="background:#06152E;padding:20px 24px;color:#fff;font-size:18px;font-weight:bold;letter-spacing:1px">HÔTEL ÉCOLE <span style="color:#FF3B47">AVENIDA</span></td></tr>
    <tr><td style="height:4px;background:#E30613"></td></tr>
    <tr><td style="padding:28px 24px;line-height:1.6">
      <p style="margin:0 0 12px">Bonjour ${esc(name)},</p>
      <h1 style="margin:0 0 12px;font-size:20px;color:#0C356A">${esc(subject)}</h1>
      <p style="margin:0 0 24px">${esc(text).split("\n").join("<br>")}</p>
      <a href="${link}" style="display:inline-block;background:#E30613;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">Voir mon reçu de réservation</a>
    </td></tr>
    <tr><td style="padding:16px 24px;background:#f8fafc;font-size:12px;color:#64748b">Hôtel École Avenida · 30, rue d'Almeida Léopold, Cocoteraie, Lomé · +228 22 21 46 72</td></tr>
  </table></td></tr></table></body></html>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.NOTIFY_FROM_EMAIL || "Hôtel École Avenida <onboarding@resend.dev>", to: [to], subject, html }),
  }).catch(() => null);
  return !!res?.ok;
}
