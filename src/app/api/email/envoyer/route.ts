import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Attachment = { filename: string; content: string };

const ALLOWED = ["directeur_general", "directeur_pedagogique", "comptable", "ressources_humaines", "responsable_hotel", "gestionnaire_site", "personnel"];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/**
 * Envoi d'un e-mail par l'administration (réponse à une demande, décision, document) :
 * mise en page Avenida, pièces jointes, historique dans email_logs.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role, first_name, last_name").eq("id", user.id).maybeSingle();
  if (!ALLOWED.includes(me?.role ?? "")) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { to?: string[]; subject?: string; message?: string; attachments?: Attachment[]; contextType?: string; contextId?: string; link?: string };
  const to = [...new Set((body.to ?? []).map((e) => e.trim().toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)))];
  if (!to.length) return NextResponse.json({ error: "Aucune adresse e-mail valide" }, { status: 400 });
  if (!body.subject?.trim() || !body.message?.trim()) return NextResponse.json({ error: "Objet et message obligatoires" }, { status: 400 });
  const attachments = (body.attachments ?? []).slice(0, 5);
  const size = attachments.reduce((a, f) => a + f.content.length * 0.75, 0);
  if (size > 3.5 * 1024 * 1024) return NextResponse.json({ error: "Pièces jointes trop lourdes (3,5 Mo au total)" }, { status: 400 });

  const site = process.env.NEXT_PUBLIC_APP_URL || "https://www.hotelecoleavenida.net";
  const signer = [me?.first_name, me?.last_name].filter(Boolean).join(" ");
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden">
    <tr><td style="background:#06152E;padding:20px 24px;color:#fff;font-size:18px;font-weight:bold;letter-spacing:1px">HÔTEL ÉCOLE <span style="color:#FF3B47">AVENIDA</span></td></tr>
    <tr><td style="height:4px;background:#E30613"></td></tr>
    <tr><td style="padding:28px 24px;line-height:1.6;font-size:15px">${esc(body.message.trim()).replace(/\n/g, "<br>")}
      ${body.link ? `<p style="margin:24px 0 0"><a href="${site}${esc(body.link)}" style="display:inline-block;background:#E30613;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">Ouvrir mon espace</a></p>` : ""}
      ${attachments.length ? `<p style="margin:20px 0 0;font-size:13px;color:#475569">Pièce(s) jointe(s) : ${attachments.map((a) => esc(a.filename)).join(", ")}</p>` : ""}
      <p style="margin:24px 0 0">${signer ? esc(signer) + "<br>" : ""}Hôtel École Avenida</p>
    </td></tr>
    <tr><td style="padding:16px 24px;background:#f8fafc;font-size:12px;color:#64748b">Hôtel École Avenida · 30, rue d'Almeida Léopold, Cocoteraie, Lomé · Travail – Discipline – Excellence<br>${site}</td></tr>
  </table></td></tr></table></body></html>`;

  const resendKey = process.env.RESEND_API_KEY;
  let status: "envoye" | "echec" | "non_configure" = "non_configure";
  let error: string | null = "RESEND_API_KEY non configurée sur le serveur";
  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM_EMAIL || "Hôtel École Avenida <onboarding@resend.dev>",
        to,
        reply_to: process.env.NOTIFY_REPLY_TO || undefined,
        subject: body.subject.trim(),
        html,
        attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })),
      }),
    });
    status = res.ok ? "envoye" : "echec";
    error = res.ok ? null : `Refusé par le service d'envoi (${res.status}) : ${(await res.text()).slice(0, 200)}`;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    await createAdmin(url, serviceKey, { auth: { persistSession: false } })
      .from("email_logs")
      .insert({ sent_by: user.id, recipients: to, subject: body.subject.trim(), body: body.message.trim(), attachments: attachments.map((a) => a.filename), context_type: body.contextType ?? null, context_id: body.contextId ?? null, status, error });
  }

  return NextResponse.json({ status, error, to }, { status: status === "echec" ? 502 : 200 });
}
