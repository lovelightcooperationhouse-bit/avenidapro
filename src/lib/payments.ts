import { createClient as createAdmin, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Paiement en ligne (réservations de l'hôtel, frais d'inscription et écolage de l'école) : PayDunya uniquement.
 *   Clés : PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, PAYDUNYA_TOKEN (PAYDUNYA_SANDBOX=oui pour les essais).
 *   Mixx by Yas (T-Money Togo), Moov Money Togo et carte bancaire, sur la page de paiement PayDunya ;
 *   IPN : /api/paiements/paydunya.
 * Un paiement n'est jamais validé sur la seule parole du navigateur : le serveur confirme la facture
 * auprès de PayDunya (statut, montant, identifiant) avant d'enregistrer l'encaissement.
 */
export type OnlineMethod = "carte" | "yas" | "moov";
export const ONLINE_METHODS: OnlineMethod[] = ["carte", "yas", "moov"];

// Clés lues sans espaces ni retours à la ligne (copier-coller dans Vercel)
const env = (k: string) => (process.env[k] ?? "").trim().replace(/^["']|["']$/g, "");
const paydunya = () => !!env("PAYDUNYA_MASTER_KEY") && !!env("PAYDUNYA_PRIVATE_KEY") && !!env("PAYDUNYA_TOKEN");
const paydunyaSandbox = () => /^(oui|1|true)$/i.test(env("PAYDUNYA_SANDBOX"));
const paydunyaBase = () => `https://app.paydunya.com/${paydunyaSandbox() ? "sandbox-api" : "api"}/v1/checkout-invoice`;
const paydunyaHeaders = () => ({
  "Content-Type": "application/json",
  "PAYDUNYA-MASTER-KEY": env("PAYDUNYA_MASTER_KEY"),
  "PAYDUNYA-PRIVATE-KEY": env("PAYDUNYA_PRIVATE_KEY"),
  "PAYDUNYA-TOKEN": env("PAYDUNYA_TOKEN"),
});
const SITE = () => process.env.NEXT_PUBLIC_APP_URL || "https://www.hotelecoleavenida.net";

/** Diagnostic des clés PayDunya pour le DG : format seulement (jamais la valeur), et réponse de PayDunya en test et en production. */
export async function paydunyaDiagnostic() {
  const shape = (k: string) => {
    const raw = process.env[k] ?? "";
    const v = env(k);
    return { presente: !!raw, longueur: v.length, espaces_retires: raw.length - v.length, type: /^live_/.test(v) ? "production (live_…)" : /^test_/.test(v) ? "test (test_…)" : "sans préfixe live_/test_" };
  };
  const probe = async (mode: "api" | "sandbox-api") => {
    const r = await fetch(`https://app.paydunya.com/${mode}/v1/checkout-invoice/create`, {
      method: "POST",
      headers: paydunyaHeaders(),
      body: JSON.stringify({ invoice: { total_amount: 200, description: "Diagnostic Avenida (non payé)" }, store: { name: "Hôtel École Avenida" } }),
    }).catch(() => null);
    const j = r ? ((await r.json().catch(() => ({}))) as { response_code?: string; response_text?: string }) : {};
    return { code: j.response_code ?? "aucune réponse", message: j.response_code === "00" ? "clés acceptées" : (j.response_text ?? "") };
  };
  return {
    mode_utilise: paydunyaSandbox() ? "test (PAYDUNYA_SANDBOX=oui)" : "production",
    cles: { PAYDUNYA_MASTER_KEY: shape("PAYDUNYA_MASTER_KEY"), PAYDUNYA_PRIVATE_KEY: shape("PAYDUNYA_PRIVATE_KEY"), PAYDUNYA_TOKEN: shape("PAYDUNYA_TOKEN"), PAYDUNYA_SANDBOX: { presente: !!process.env.PAYDUNYA_SANDBOX, valeur: env("PAYDUNYA_SANDBOX") } },
    reponse_paydunya_production: await probe("api"),
    reponse_paydunya_test: await probe("sandbox-api"),
  };
}

/** Moyens de paiement en ligne proposés (tous passent par PayDunya). */
export const onlineMethods = (): Record<OnlineMethod, boolean> => {
  const on = paydunya();
  return { carte: on, yas: on, moov: on };
};

export const paydunyaMasterKey = () => env("PAYDUNYA_MASTER_KEY");

export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createAdmin(url, key, { auth: { persistSession: false } }) : null;
}

type Invoice = {
  amount: number;
  label: string;
  method: OnlineMethod;
  customer: { name: string; email?: string | null; phone?: string | null };
  custom: Record<string, string>;
  returnUrl: string;
  cancelUrl: string;
  origin: string;
};

/** Crée une facture PayDunya et renvoie la page de paiement et son jeton. */
async function paydunyaInvoice(o: Invoice): Promise<{ url: string; token: string } | { error: string; raw: unknown }> {
  const create = (channels?: string[]) =>
    fetch(`${paydunyaBase()}/create`, {
      method: "POST",
      headers: paydunyaHeaders(),
      body: JSON.stringify({
        invoice: {
          total_amount: o.amount,
          description: o.label,
          ...(channels ? { channels } : {}),
          customer: { name: o.customer.name, email: o.customer.email ?? "", phone: (o.customer.phone ?? "").replace(/\D/g, "") },
        },
        store: { name: "Hôtel École Avenida", phone: "+228 22 21 46 72", website_url: "https://www.hotelecoleavenida.net" },
        custom_data: o.custom,
        actions: { cancel_url: o.cancelUrl, return_url: o.returnUrl, callback_url: `${o.origin}/api/paiements/paydunya` },
      }),
    })
      .then((r) => r.json() as Promise<{ response_code?: string; response_text?: string; description?: string; token?: string }>)
      .catch(() => ({}) as { response_code?: string; response_text?: string; description?: string; token?: string });
  // Moyen choisi présélectionné ; si ce canal n'est pas encore ouvert sur le compte (carte en cours de validation), page avec tous les moyens
  const channel = o.method === "yas" ? "t-money-togo" : o.method === "moov" ? "moov-togo" : "card";
  let j = await create([channel]);
  if (j.response_code !== "00") j = await create();
  if (j.response_code !== "00" || !j.response_text?.startsWith("http") || !j.token) return { error: `Paiement en ligne indisponible : ${j.response_text ?? j.description ?? "PayDunya ne répond pas"}`, raw: j };
  return { url: j.response_text, token: j.token };
}

type Confirmation = { paid: boolean; status: string; details: unknown };

/** Confirme une facture PayDunya : payée, du bon montant, pour le bon paiement. */
async function paydunyaConfirm(invoiceToken: string, amount: number, identifier: string): Promise<Confirmation> {
  const res = await fetch(`${paydunyaBase()}/confirm/${encodeURIComponent(invoiceToken)}`, { headers: paydunyaHeaders() }).catch(() => null);
  const st = res ? ((await res.json().catch(() => ({}))) as { response_code?: string; status?: string; invoice?: { total_amount?: number | string }; custom_data?: { identifier?: string } }) : {};
  const status = st.status ?? "";
  const paid = st.response_code === "00" && status === "completed" && Number(st.invoice?.total_amount ?? 0) >= amount && (!st.custom_data?.identifier || st.custom_data.identifier === identifier);
  return { paid, status, details: st };
}

/** Alertes « Paiement reçu » envoyées tout de suite (e-mail, téléphone) à la direction et aux services concernés. */
async function dispatchAlerts() {
  const secret = process.env.CRON_SECRET;
  if (secret) await fetch(`${SITE()}/api/notifications/envoyer`, { method: "POST", headers: { Authorization: `Bearer ${secret}` } }).catch(() => null);
}

// ─── Réservations de l'hôtel ───────────────────────────────────────────────

type Reservation = { id: string; booking_ref: string; token: string; customer_name: string; room_type: string | null; room_number: string | null; customer_email: string | null; customer_phone: string | null; total_price: number; deposit_paid: number | null; status: string; hold_until: string | null; room_uuid: string | null; check_in: string; check_out: string };

/** Démarre le paiement en ligne d'une réservation et renvoie l'adresse de la page de paiement PayDunya. */
export async function startPayment(token: string, method: OnlineMethod, origin: string): Promise<{ url: string } | { error: string }> {
  const admin = adminClient();
  if (!admin) return { error: "Paiement en ligne indisponible (configuration du serveur)." };
  if (!onlineMethods()[method]) return { error: "Le paiement en ligne n'est pas encore activé. Choisissez le paiement à l'arrivée." };

  const { data: v } = await admin.from("reservations").select("id, booking_ref, token, customer_name, room_type, room_number, customer_email, customer_phone, total_price, deposit_paid, status, hold_until, room_uuid, check_in, check_out").eq("token", token).maybeSingle<Reservation>();
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

  // Identifiant unique par tentative (30 caractères au plus, sans caractères spéciaux)
  const identifier = `${v.booking_ref.replace(/[^A-Z0-9]/gi, "")}T${Date.now().toString(36).toUpperCase()}`;
  const { error: insErr } = await admin.from("reservation_payments").insert({ reservation_id: v.id, provider: "paydunya", method, amount: due, identifier, status: "en_cours" });
  if (insErr) return { error: insErr.message };

  const inv = await paydunyaInvoice({
    amount: due,
    label: `Réservation ${v.booking_ref} · ${v.room_type ?? "Chambre"} ${v.room_number ?? ""}`.trim(),
    method,
    customer: { name: v.customer_name, email: v.customer_email, phone: v.customer_phone },
    custom: { identifier, booking_ref: v.booking_ref },
    returnUrl: `${origin}/api/reservations/retour?id=${encodeURIComponent(identifier)}`,
    cancelUrl: `${origin}/reservation/${v.token}?paiement=annule`,
    origin,
  });
  if ("error" in inv) {
    await admin.from("reservation_payments").update({ status: "echoue", raw: inv.raw }).eq("identifier", identifier);
    return { error: inv.error };
  }
  await admin.from("reservation_payments").update({ provider_ref: inv.token }).eq("identifier", identifier);
  return { url: inv.url };
}

/** Interroge PayDunya ; si le paiement de la réservation est confirmé, l'enregistre (une seule fois). */
export async function verifyPayment(identifier: string): Promise<{ ok: boolean; token?: string; pending?: boolean; fresh?: boolean; error?: string }> {
  const admin = adminClient();
  if (!admin) return { ok: false, error: "configuration" };
  const { data: pay } = await admin.from("reservation_payments").select("id, provider, amount, status, provider_ref, reservations(token)").eq("identifier", identifier).maybeSingle();
  if (!pay) return { ok: false, error: "Paiement inconnu" };
  const token = (pay.reservations as unknown as { token: string } | null)?.token;
  if (pay.status === "reussi") return { ok: true, token };
  if (pay.provider !== "paydunya" || !pay.provider_ref) return { ok: false, token };

  const c = await paydunyaConfirm(pay.provider_ref, Number(pay.amount), identifier);
  if (c.status === "cancelled" || c.status === "failed") await admin.from("reservation_payments").update({ status: "echoue", raw: c.details }).eq("id", pay.id);
  if (!c.paid) return { ok: false, token, pending: c.status === "pending" };

  const { data: applied, error } = await admin.rpc("apply_online_payment", { ident: identifier, pref: pay.provider_ref, details: c.details });
  if (error) return { ok: false, token, error: error.message };
  const fresh = !(applied as { already?: boolean } | null)?.already;
  if (fresh && token) {
    await emailPaid(admin, token);
    await dispatchAlerts();
  }
  return { ok: true, token, fresh };
}

/** Reçu mis à jour envoyé au client après un paiement confirmé. */
async function emailPaid(admin: SupabaseClient, token: string) {
  const { data: v } = await admin.from("reservations").select("booking_ref, customer_name, customer_email, total_price, deposit_paid").eq("token", token).maybeSingle();
  if (!v) return;
  const rest = Number(v.total_price) - Number(v.deposit_paid ?? 0);
  await sendBookingEmail(
    v.customer_email,
    v.customer_name,
    rest > 0 ? `Paiement reçu · réservation ${v.booking_ref}` : `Réservation ${v.booking_ref} soldée`,
    rest > 0 ? `Nous avons bien reçu votre paiement. Reste à régler : ${rest.toLocaleString("fr-FR")} F CFA.` : "Votre paiement est confirmé : votre chambre vous est réservée. Présentez ce reçu à la réception à votre arrivée.",
    `${SITE()}/reservation/${token}`,
  );
}

// ─── Frais d'inscription et écolage de l'école ─────────────────────────────

export type SchoolPaymentRequest = { student_id?: string; application_id?: string; amount?: number; designation?: string; option?: string; method: OnlineMethod };

/**
 * Démarre le paiement en ligne de frais scolaires. `supabase` est le client de l'utilisateur connecté :
 * la base vérifie qu'il peut payer pour ce dossier (élève, parent rattaché, candidat admis) et le montant autorisé.
 */
export async function startSchoolPayment(supabase: SupabaseClient, req: SchoolPaymentRequest, origin: string): Promise<{ url: string } | { error: string }> {
  const admin = adminClient();
  if (!admin) return { error: "Paiement en ligne indisponible (configuration du serveur)." };
  if (!onlineMethods()[req.method]) return { error: "Le paiement en ligne n'est pas encore activé : réglez à la caisse de l'école." };
  const { data, error } = await supabase.rpc("prepare_school_payment", { p: req });
  if (error) return { error: error.message };
  const p = data as { identifier: string; amount: number; label: string; payer_name: string; payer_email: string | null; payer_phone: string | null };

  const inv = await paydunyaInvoice({
    amount: Number(p.amount),
    label: p.label,
    method: req.method,
    customer: { name: p.payer_name, email: p.payer_email, phone: p.payer_phone },
    custom: { identifier: p.identifier, kind: "ecole" },
    returnUrl: `${origin}/api/ecolage/retour?id=${encodeURIComponent(p.identifier)}`,
    cancelUrl: `${origin}/espace/paiements?paiement=annule`,
    origin,
  });
  if ("error" in inv) {
    await admin.from("school_payments").update({ status: "echoue", raw: inv.raw }).eq("identifier", p.identifier);
    return { error: inv.error };
  }
  await admin.from("school_payments").update({ provider_ref: inv.token }).eq("identifier", p.identifier);
  return { url: inv.url };
}

/** Interroge PayDunya ; si le paiement scolaire est confirmé, crée le reçu officiel (une seule fois). */
export async function verifySchoolPayment(identifier: string): Promise<{ ok: boolean; pending?: boolean; receipt?: string | null; error?: string }> {
  const admin = adminClient();
  if (!admin) return { ok: false, error: "configuration" };
  const { data: pay } = await admin.from("school_payments").select("id, amount, status, provider_ref, fee_payment_id, payer_email, payer_name, designation").eq("identifier", identifier).maybeSingle();
  if (!pay) return { ok: false, error: "Paiement inconnu" };
  if (pay.status === "reussi") return { ok: true, receipt: pay.fee_payment_id };
  if (!pay.provider_ref) return { ok: false };

  const c = await paydunyaConfirm(pay.provider_ref, Number(pay.amount), identifier);
  if (c.status === "cancelled" || c.status === "failed") await admin.from("school_payments").update({ status: "echoue", raw: c.details }).eq("id", pay.id);
  if (!c.paid) return { ok: false, pending: c.status === "pending" };

  const { data: applied, error } = await admin.rpc("apply_school_payment", { ident: identifier, pref: pay.provider_ref, details: c.details });
  if (error) return { ok: false, error: error.message };
  const a = applied as { already?: boolean; fee_payment_id?: string | null };
  if (!a.already) {
    await sendBookingEmail(
      pay.payer_email,
      pay.payer_name ?? "",
      `Paiement reçu · ${pay.designation}`,
      `Nous avons bien reçu votre paiement de ${Number(pay.amount).toLocaleString("fr-FR")} F CFA (${pay.designation}). Votre reçu officiel et votre situation financière sont à jour dans votre espace.`,
      a.fee_payment_id ? `${SITE()}/impression/recu/${a.fee_payment_id}` : `${SITE()}/espace/paiements`,
      a.fee_payment_id ? "Voir mon reçu" : "Voir mes paiements",
    );
    await dispatchAlerts();
  }
  return { ok: true, receipt: a.fee_payment_id ?? null };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** E-mail au client ou à la famille (avec ou sans compte) : lien vers son reçu. */
export async function sendBookingEmail(to: string | null, name: string, subject: string, text: string, link: string, button = "Voir mon reçu de réservation") {
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
      <a href="${link}" style="display:inline-block;background:#E30613;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${esc(button)}</a>
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
