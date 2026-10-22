"use client";

import { CheckCircle2, Loader2, Mail, Paperclip, Send, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { blobToBase64 } from "@/lib/pdf";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Log = { id: string; created_at: string; subject: string; recipients: string[]; status: string; attachments: string[] };

/** Envoie un e-mail depuis la gestion (pièces jointes possibles) ; renvoie le statut. */
export async function sendEmail(opts: { to: string[]; subject: string; message: string; files?: File[]; contextType?: string; contextId?: string; link?: string }) {
  const attachments = await Promise.all((opts.files ?? []).map(async (f) => ({ filename: f.name, content: await blobToBase64(f) })));
  const res = await fetch("/api/email/envoyer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: opts.to, subject: opts.subject, message: opts.message, attachments, contextType: opts.contextType, contextId: opts.contextId, link: opts.link }),
  });
  const j = (await res.json().catch(() => ({}))) as { status?: string; error?: string | null };
  return { ok: j.status === "envoye", status: j.status ?? "echec", error: j.error ?? (res.ok ? null : "Envoi impossible") };
}

/**
 * Fenêtre « Répondre par e-mail » : destinataire(s), objet, message, pièces jointes,
 * et historique des e-mails déjà envoyés pour ce dossier.
 */
export function EmailComposer({
  to,
  subject,
  message = "",
  contextType,
  contextId,
  link,
  onClose,
  onSent,
}: {
  to: string[];
  subject: string;
  message?: string;
  contextType: string;
  contextId: string;
  link?: string;
  onClose: () => void;
  onSent?: () => void;
}) {
  const [form, setForm] = useState({ to: to.filter(Boolean).join(", "), subject, message });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);

  const loadLogs = useCallback(async () => {
    const { data } = await createClient().from("email_logs").select("id, created_at, subject, recipients, status, attachments").eq("context_type", contextType).eq("context_id", contextId).order("created_at", { ascending: false });
    setLogs((data ?? []) as Log[]);
  }, [contextType, contextId]);
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const send = async () => {
    setBusy(true);
    setResult(null);
    const r = await sendEmail({ to: form.to.split(/[,;\s]+/).filter(Boolean), subject: form.subject, message: form.message, files, contextType, contextId, link });
    setBusy(false);
    setResult(r.ok ? { ok: true, text: "E-mail envoyé." } : { ok: false, text: r.status === "non_configure" ? "E-mail enregistré mais non envoyé : la clé du service d'envoi (Resend) n'est pas encore configurée." : r.error ?? "Envoi impossible." });
    loadLogs();
    if (r.ok) {
      setFiles([]);
      onSent?.();
    }
  };

  const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0C356A]";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" role="dialog" aria-label="Répondre par e-mail" onClick={onClose}>
      <div className="flex max-h-[92dvh] w-full max-w-xl flex-col gap-3 overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0C356A]">
            <Mail aria-hidden className="size-5 text-[#E30613]" /> Répondre par e-mail
          </h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-1.5 hover:bg-slate-100">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          À (séparez plusieurs adresses par une virgule)
          <input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Objet
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Message
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={8} className={input} />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:text-[#E30613]">
            <Paperclip aria-hidden className="size-4" /> Joindre un document
            <input type="file" multiple className="sr-only" onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])].slice(0, 5))} />
          </label>
          {files.map((f, i) => (
            <span key={f.name + i} className="inline-flex items-center gap-1 rounded-full bg-[#0C356A]/10 px-3 py-1 text-xs font-semibold text-[#0C356A]">
              {f.name}
              <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Retirer ${f.name}`}>
                <X aria-hidden className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
        {result && (
          <p role="status" className={cn("flex items-center gap-2 rounded-xl p-3 text-sm font-semibold", result.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900")}>
            {result.ok ? <CheckCircle2 aria-hidden className="size-4" /> : <XCircle aria-hidden className="size-4" />} {result.text}
          </p>
        )}
        <button type="button" onClick={send} disabled={busy || !form.to.trim() || !form.subject.trim() || !form.message.trim()} className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#E30613] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />} Envoyer
        </button>
        {logs.length > 0 && (
          <section className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">E-mails déjà envoyés</p>
            <ul className="flex flex-col gap-1.5 text-xs">
              {logs.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 font-bold", l.status === "envoye" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>{l.status === "envoye" ? "Envoyé" : l.status === "non_configure" ? "En attente" : "Échec"}</span>
                  <span className="text-slate-500">{new Date(l.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
                  <span className="font-semibold text-slate-700">{l.subject}</span>
                  <span className="text-slate-500">→ {l.recipients.join(", ")}</span>
                  {l.attachments.length > 0 && <span className="text-slate-500">· {l.attachments.length} PJ</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
