"use client";

import { CheckCircle2, Download, Eye, Loader2, Mail, Printer, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EnrollmentSheet } from "@/components/cards/EnrollmentSheet";
import { blobToBase64, elementToPdf } from "@/lib/pdf";
import { createClient } from "@/lib/supabase/client";

/** Fiche d'inscription A4 : imprimer, télécharger en PDF, envoyer par e-mail et dans les espaces de l'élève et du tuteur. */
export default function PrintEnrollmentPage() {
  const { id } = useParams<{ id: string }>();
  const [emails, setEmails] = useState({ student: "", guardian: "", other: "" });
  const [name, setName] = useState("fiche");
  const [busy, setBusy] = useState<null | "pdf" | "send">(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    createClient()
      .from("students")
      .select("email, guardian_email, registration_number, last_name")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setEmails({ student: data.email ?? "", guardian: data.guardian_email ?? "", other: "" });
        setName(`Fiche-inscription-${data.registration_number ?? data.last_name}`);
      });
  }, [id]);

  const makePdf = async () => {
    const el = document.getElementById("avenida-official-student-enrollment");
    if (!el) throw new Error("Fiche non chargée");
    return elementToPdf(el);
  };

  const download = async () => {
    setBusy("pdf");
    try {
      (await makePdf()).save(`${name}.pdf`);
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    setBusy("send");
    setMsg(null);
    try {
      const supabase = createClient();
      // E-mail du tuteur corrigé ici → enregistré sur la fiche de l'élève
      await supabase.from("students").update({ email: emails.student.trim() || null, guardian_email: emails.guardian.trim() || null }).eq("id", id);
      const pdf = await blobToBase64((await makePdf()).output("blob"));
      const res = await fetch("/api/fiche/envoyer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: id, pdf, emails: emails.other.split(/[,;\s]+/).filter(Boolean) }) });
      const j = await res.json();
      if (!res.ok) return setMsg({ ok: false, text: j.error ?? "Envoi impossible" });
      setMsg({
        ok: !j.mailError,
        text:
          `Fiche déposée dans ${j.delivered} espace(s) en ligne. ` +
          (j.mailed ? `E-mail envoyé à : ${j.emails.join(", ")}.` : j.mailError ? `${j.mailError}.` : "Aucune adresse e-mail renseignée."),
      });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Envoi impossible" });
    } finally {
      setBusy(null);
    }
  };

  const field = "rounded-lg border border-slate-200 px-3 py-2 text-sm";

  return (
    <div className="min-h-dvh bg-slate-100 p-4 sm:p-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] flex-col gap-3 rounded-2xl bg-white p-4 shadow print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto font-bold text-[#0C356A]">Fiche d&apos;inscription définitive (A4)</p>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200">
            <Printer aria-hidden className="size-4" /> Imprimer
          </button>
          <button
            type="button"
            onClick={async () => {
              setBusy("pdf");
              try {
                window.open(URL.createObjectURL((await makePdf()).output("blob")), "_blank");
              } finally {
                setBusy(null);
              }
            }}
            disabled={!!busy}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200"
          >
            <Eye aria-hidden className="size-4" /> Aperçu PDF
          </button>
                    <button type="button" onClick={download} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full bg-[#0C356A] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            {busy === "pdf" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Download aria-hidden className="size-4" />} Télécharger le PDF
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <input value={emails.student} onChange={(e) => setEmails({ ...emails, student: e.target.value })} placeholder="E-mail de l'élève" aria-label="E-mail de l'élève" className={field} />
          <input value={emails.guardian} onChange={(e) => setEmails({ ...emails, guardian: e.target.value })} placeholder="E-mail du tuteur" aria-label="E-mail du tuteur" className={field} />
          <input value={emails.other} onChange={(e) => setEmails({ ...emails, other: e.target.value })} placeholder="Autre(s) adresse(s)" aria-label="Autres adresses" className={field} />
        </div>
        <button type="button" onClick={send} disabled={!!busy} className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy === "send" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Mail aria-hidden className="size-4" />} Envoyer par e-mail et dans les espaces
        </button>
        {msg && (
          <p role="status" className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
            {msg.ok ? <CheckCircle2 aria-hidden className="size-4" /> : <XCircle aria-hidden className="size-4" />} {msg.text}
          </p>
        )}
      </div>
      <EnrollmentSheet studentId={id} />
    </div>
  );
}
