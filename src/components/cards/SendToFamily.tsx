"use client";

import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { blobToBase64, elementToPdf } from "@/lib/pdf";
import { createClient } from "@/lib/supabase/client";

/**
 * Envoi d'un document de l'élève (fiche d'inscription, fiche de situation) en PDF :
 * par e-mail à l'élève et au tuteur, et dans « Mes documents » de leurs espaces.
 */
export function SendToFamily({ studentId, elementId, docType, title }: { studentId: string; elementId: string; docType: "fiche" | "situation" | "bulletin"; title?: string }) {
  const [emails, setEmails] = useState({ student: "", guardian: "", other: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    createClient()
      .from("students")
      .select("email, guardian_email")
      .eq("id", studentId)
      .maybeSingle()
      .then(({ data }) => data && setEmails({ student: data.email ?? "", guardian: data.guardian_email ?? "", other: "" }));
  }, [studentId]);

  const send = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await createClient().from("students").update({ email: emails.student.trim() || null, guardian_email: emails.guardian.trim() || null }).eq("id", studentId);
      const el = document.getElementById(elementId);
      if (!el) throw new Error("Document non chargé");
      const pdf = await blobToBase64((await elementToPdf(el)).output("blob"));
      const res = await fetch("/api/fiche/envoyer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, pdf, docType, title, emails: emails.other.split(/[,;\s]+/).filter(Boolean) }) });
      const j = await res.json();
      if (!res.ok) return setMsg({ ok: false, text: j.error ?? "Envoi impossible" });
      setMsg({ ok: !j.mailError, text: `Déposé dans ${j.delivered} espace(s) en ligne. ` + (j.mailed ? `E-mail envoyé à : ${j.emails.join(", ")}.` : j.mailError ? `${j.mailError}.` : "Aucune adresse e-mail renseignée.") });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Envoi impossible" });
    } finally {
      setBusy(false);
    }
  };

  const field = "rounded-lg border border-slate-200 px-3 py-2 text-sm";
  return (
    <div className="mx-auto mb-4 flex max-w-[210mm] flex-col gap-2 rounded-2xl bg-white p-3 shadow print:hidden">
      <p className="text-sm font-bold text-[#0C356A]">Envoyer à l&apos;élève et au tuteur (e-mail + espace en ligne)</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <input value={emails.student} onChange={(e) => setEmails({ ...emails, student: e.target.value })} placeholder="E-mail de l'élève" aria-label="E-mail de l'élève" className={field} />
        <input value={emails.guardian} onChange={(e) => setEmails({ ...emails, guardian: e.target.value })} placeholder="E-mail du tuteur" aria-label="E-mail du tuteur" className={field} />
        <input value={emails.other} onChange={(e) => setEmails({ ...emails, other: e.target.value })} placeholder="Autre(s) adresse(s)" aria-label="Autres adresses" className={field} />
      </div>
      <button type="button" onClick={send} disabled={busy} className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Mail aria-hidden className="size-4" />} Envoyer
      </button>
      {msg && (
        <p role="status" className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
          {msg.ok ? <CheckCircle2 aria-hidden className="size-4" /> : <XCircle aria-hidden className="size-4" />} {msg.text}
        </p>
      )}
    </div>
  );
}
