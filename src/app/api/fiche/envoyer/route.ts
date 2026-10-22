import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Envoi de la fiche d'inscription (PDF) :
 * - dans l'espace de l'élève et de ses parents (« Mes documents » + notification) ;
 * - par e-mail à l'élève et au tuteur, fiche en pièce jointe (Resend).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!["directeur_general", "directeur_pedagogique", "comptable"].includes(me?.role ?? "")) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { studentId?: string; pdf?: string; emails?: string[] };
  if (!body.studentId || !body.pdf) return NextResponse.json({ error: "Fiche manquante" }, { status: 400 });
  const pdf = Buffer.from(body.pdf, "base64");
  if (pdf.length > 8 * 1024 * 1024) return NextResponse.json({ error: "Fiche trop lourde" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquant sur le serveur" }, { status: 500 });
  const admin = createAdmin(url, serviceKey, { auth: { persistSession: false } });

  const { data: st } = await admin.from("students").select("id, first_name, last_name, registration_number, email, guardian_email, program_code, class_name").eq("id", body.studentId).maybeSingle();
  if (!st) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
  const fileName = `Fiche-inscription-${st.registration_number ?? st.last_name}.pdf`;

  // 1. Espaces : l'élève (compte rattaché) et ses parents
  const [{ data: student }, { data: parents }] = await Promise.all([
    admin.from("profiles").select("id").eq("student_id", st.id),
    admin.from("parent_students").select("parent_id").eq("student_id", st.id),
  ]);
  const owners = [...new Set([...(student ?? []).map((p) => p.id), ...(parents ?? []).map((p) => p.parent_id)])];
  let delivered = 0;
  for (const owner of owners) {
    const path = `${owner}/recus/${Date.now()}-${fileName}`;
    const up = await admin.storage.from("documents").upload(path, pdf, { contentType: "application/pdf", upsert: true });
    if (up.error) continue;
    await admin.from("member_documents").insert({
      profile_id: owner,
      category: "fiche",
      title: `Fiche d'inscription ${st.registration_number ?? ""}`.trim(),
      path,
      mime: "application/pdf",
      size: pdf.length,
      direction: "envoye",
      sent_by: user.id,
      note: `${st.first_name} ${st.last_name} · ${st.class_name ?? st.program_code ?? ""}`,
    });
    delivered += 1;
  }

  // 2. E-mails (élève + tuteur + adresses ajoutées)
  const emails = [...new Set([st.email, st.guardian_email, ...(body.emails ?? [])].map((e) => e?.trim().toLowerCase()).filter((e): e is string => !!e && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)))];
  const resendKey = process.env.RESEND_API_KEY;
  let mailed = 0;
  let mailError: string | null = resendKey ? null : "RESEND_API_KEY non configurée : e-mails non envoyés";
  if (resendKey && emails.length) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM_EMAIL || "Hôtel École Avenida <onboarding@resend.dev>",
        to: emails,
        subject: `Fiche d'inscription de ${st.first_name} ${st.last_name} – Hôtel École Avenida`,
        html: `<p>Bonjour,</p><p>Veuillez trouver ci-joint la fiche d'inscription définitive de <strong>${st.first_name} ${st.last_name}</strong> (matricule <strong>${st.registration_number ?? ""}</strong>, ${st.class_name ?? st.program_code ?? ""}).</p><p>Elle est également disponible dans l'espace en ligne de l'élève et des parents : <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://www.hotelecoleavenida.net"}/espace/documents">Mes documents</a>.</p><p>Hôtel École Avenida · Travail – Discipline – Excellence</p>`,
        attachments: [{ filename: fileName, content: body.pdf }],
      }),
    });
    if (res.ok) mailed = emails.length;
    else mailError = `Envoi des e-mails refusé (${res.status})`;
  }

  return NextResponse.json({ delivered, mailed, emails, mailError });
}
