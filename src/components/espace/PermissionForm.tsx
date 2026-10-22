"use client";

import { CheckCircle2, FileUp, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { pingNotifications } from "@/lib/notify";

/** Demande de permission du parent (dates, motif, justificatif obligatoire), traitée par l'administration. */
export function PermissionForm({ studentId, parentId, onSent }: { studentId: string; parentId: string; onSent: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (end < start) return setMessage({ ok: false, text: "La date de fin doit suivre la date de début." });
    if (reason.trim().length < 3) return setMessage({ ok: false, text: "Expliquez le motif de la permission." });
    if (!file) return setMessage({ ok: false, text: "Joignez un justificatif (certificat médical, convocation, attestation…)." });
    if (file.size > 10 * 1024 * 1024) return setMessage({ ok: false, text: "Justificatif trop lourd (10 Mo maximum)." });
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
    const path = `${studentId}/${Date.now()}-${safe}`;
    const up = await supabase.storage.from("justificatifs").upload(path, file, { contentType: file.type });
    if (up.error) {
      setBusy(false);
      return setMessage({ ok: false, text: "Envoi du justificatif impossible (PDF ou image uniquement)." });
    }
    const { error } = await supabase.from("permission_requests").insert({
      student_id: studentId,
      requested_by: parentId,
      start_date: start,
      end_date: end,
      reason: reason.trim(),
      justificatif: { path, name: file.name },
    });
    setBusy(false);
    if (error) return setMessage({ ok: false, text: "La demande n'a pas pu être enregistrée." });
    pingNotifications();
    setReason("");
    setFile(null);
    setMessage({ ok: true, text: "Demande envoyée à l'administration. Vous recevrez la réponse ici et par notification." });
    onSent();
  };

  const field = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-avenida-blue focus:ring-2 focus:ring-avenida-blue/15";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <h3 className="font-display text-lg font-bold text-avenida-blue-950">Demander une permission</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
          Du
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
          Au
          <input type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} className={field} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
        Motif
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={2000} className={`${field} resize-y`} placeholder="Raison de l'absence prévue" />
      </label>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm font-semibold text-avenida-blue hover:border-vif has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-avenida-blue">
        <FileUp aria-hidden className="size-5 text-vif" />
        {file ? file.name : "Justificatif obligatoire (PDF ou photo)"}
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      {message && (
        <p role="status" className={message.ok ? "flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800" : "rounded-xl bg-red-50 p-3 text-sm font-semibold text-vif"}>
          {message.ok && <CheckCircle2 aria-hidden className="size-4" />}
          {message.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-vif font-bold text-white hover:bg-vif-fonce disabled:opacity-60">
        {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
        Envoyer la demande
      </button>
    </form>
  );
}
