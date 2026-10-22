"use client";

import { Download, Eye, FileText, Inbox, Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { sendEmail } from "@/components/email/EmailComposer";
import { formatSize, signedUrl } from "@/lib/spaces";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type MemberDocument = {
  id: string;
  profile_id: string;
  category: string;
  title: string;
  path: string;
  mime: string | null;
  size: number | null;
  direction: "depose" | "envoye";
  note: string | null;
  read_at: string | null;
  created_at: string;
};

export const DOC_CATEGORIES: { value: string; label: string }[] = [
  { value: "fiche", label: "Fiche d'inscription" },
  { value: "carte", label: "Carte" },
  { value: "attestation", label: "Attestation / certificat" },
  { value: "recu", label: "Reçu de paiement" },
  { value: "bulletin", label: "Bulletin de notes" },
  { value: "contrat", label: "Contrat / document RH" },
  { value: "courrier", label: "Courrier / convocation" },
  { value: "piece", label: "Pièce justificative" },
  { value: "autre", label: "Autre" },
];
const catLabel = (c: string) => DOC_CATEGORIES.find((x) => x.value === c)?.label ?? c;

/** Dépose un fichier dans le classeur d'un membre (bucket privé « documents/{profil}/… »). */
export async function addMemberDocument(opts: { profileId: string; file: File; title: string; category: string; direction: "depose" | "envoye"; sentBy: string; note?: string }) {
  const supabase = createClient();
  const safe = opts.file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-60);
  const path = `${opts.profileId}/${opts.direction === "envoye" ? "recus" : "deposes"}/${Date.now()}-${safe}`;
  const up = await supabase.storage.from("documents").upload(path, opts.file, { contentType: opts.file.type || undefined });
  if (up.error) return up.error;
  const { error } = await supabase.from("member_documents").insert({
    profile_id: opts.profileId,
    category: opts.category,
    title: opts.title.trim() || opts.file.name,
    path,
    mime: opts.file.type,
    size: opts.file.size,
    direction: opts.direction,
    sent_by: opts.sentBy,
    note: opts.note?.trim() || null,
  });
  return error;
}

/**
 * Classeur d'un membre : documents envoyés par l'administration et pièces déposées.
 * `mode="membre"` (son propre espace) ou `mode="admin"` (envoi de documents au membre).
 */
export function DocumentList({ profileId, viewerId, mode }: { profileId: string; viewerId: string; mode: "membre" | "admin" }) {
  const [docs, setDocs] = useState<MemberDocument[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(mode === "admin" ? "courrier" : "piece");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [byEmail, setByEmail] = useState(true);
  const [info, setInfo] = useState("");

  const load = useCallback(async () => {
    const { data } = await createClient().from("member_documents").select("*").eq("profile_id", profileId).order("created_at", { ascending: false });
    setDocs((data ?? []) as MemberDocument[]);
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (d: MemberDocument, download = false) => {
    const url = await signedUrl(d.path, "documents");
    if (!url) return;
    if (mode === "membre" && d.direction === "envoye" && !d.read_at) {
      await createClient().from("member_documents").update({ read_at: new Date().toISOString() }).eq("id", d.id);
      load();
    }
    if (download) {
      const a = document.createElement("a");
      a.href = `${url}&download=${encodeURIComponent(d.title)}`;
      a.click();
    } else window.open(url, "_blank", "noopener,noreferrer");
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!file) return setError("Choisissez un fichier.");
    if (file.size > 20 * 1024 * 1024) return setError("Fichier trop lourd (20 Mo au maximum).");
    setBusy(true);
    const err = await addMemberDocument({ profileId, file, title, category, direction: mode === "admin" ? "envoye" : "depose", sentBy: viewerId, note });
    if (err) {
      setBusy(false);
      return setError("Envoi impossible : " + err.message);
    }
    // Envoi aussi par e-mail au membre (document en pièce jointe s'il fait moins de 3 Mo)
    setInfo("");
    if (mode === "admin" && byEmail) {
      const { data: prof } = await createClient().from("profiles").select("email, first_name").eq("id", profileId).maybeSingle();
      if (prof?.email) {
        const docTitle = title.trim() || file.name;
        const r = await sendEmail({
          to: [prof.email],
          subject: `Nouveau document : ${docTitle} – Hôtel École Avenida`,
          message: `Bonjour ${prof.first_name ?? ""},

L'administration de l'Hôtel École Avenida vous a envoyé un document : « ${docTitle} ».${note.trim() ? `

${note.trim()}` : ""}

${file.size <= 3 * 1024 * 1024 ? "Vous le trouverez en pièce jointe et" : "Vous le trouverez"} dans votre espace, rubrique « Mes documents ».`,
          files: file.size <= 3 * 1024 * 1024 ? [file] : [],
          contextType: "member_document",
          contextId: profileId,
          link: "/espace/documents",
        });
        setInfo(r.ok ? `Document déposé dans l'espace et envoyé par e-mail à ${prof.email}.` : r.status === "non_configure" ? "Document déposé dans l'espace. E-mail non envoyé : service d'envoi (Resend) à configurer." : `Document déposé dans l'espace. E-mail : ${r.error}`);
      }
    }
    setBusy(false);
    setFile(null);
    setTitle("");
    setNote("");
    (e.target as HTMLFormElement).reset();
    load();
  };

  const remove = async (d: MemberDocument) => {
    if (!window.confirm(`Supprimer « ${d.title} » ?`)) return;
    await createClient().storage.from("documents").remove([d.path]);
    await createClient().from("member_documents").delete().eq("id", d.id);
    load();
  };

  const sections = [
    { key: "envoye", title: mode === "admin" ? "Documents envoyés au membre" : "Reçus de l'administration" },
    { key: "depose", title: mode === "admin" ? "Pièces déposées par le membre" : "Mes pièces déposées" },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={send} className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <p className="flex items-center gap-2 text-sm font-bold text-avenida-blue">
          <Upload aria-hidden className="size-4" />
          {mode === "admin" ? "Envoyer un document dans l'espace du membre" : "Déposer un document"}
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input type="file" accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="Fichier" className="text-sm" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (ex. Attestation de scolarité)" aria-label="Titre" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Catégorie" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            {DOC_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {mode === "admin" && <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Message joint (facultatif)" aria-label="Message" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />}
        {mode === "admin" && (
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={byEmail} onChange={(e) => setByEmail(e.target.checked)} className="size-4 accent-[#E30613]" />
            Envoyer aussi par e-mail au membre (document en pièce jointe)
          </label>
        )}
        {info && <p className="text-sm font-semibold text-emerald-700">{info}</p>}
        {error && <p className="text-sm font-semibold text-vif">{error}</p>}
        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-vif px-5 py-2.5 text-sm font-bold text-white hover:bg-vif-fonce disabled:opacity-60">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Upload aria-hidden className="size-4" />}
          {mode === "admin" ? "Envoyer au membre" : "Déposer"}
        </button>
      </form>

      {docs === null ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin text-avenida-blue" />
      ) : (
        sections.map((s) => {
          const list = docs.filter((d) => d.direction === s.key);
          return (
            <section key={s.key} aria-label={s.title}>
              <h3 className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
                {s.title} ({list.length})
              </h3>
              {list.length === 0 ? (
                <p className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  <Inbox aria-hidden className="size-4" /> Aucun document.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
                  {list.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center gap-3 p-3">
                      <FileText aria-hidden className={cn("size-5 shrink-0", !d.read_at && d.direction === "envoye" ? "text-vif" : "text-slate-400")} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-slate-800">
                          {d.title}
                          {mode === "membre" && d.direction === "envoye" && !d.read_at && <span className="ml-2 rounded-full bg-vif px-2 py-0.5 text-[10px] font-bold text-white">Nouveau</span>}
                        </span>
                        <span className="text-xs text-slate-500">
                          {catLabel(d.category)} · {new Date(d.created_at).toLocaleDateString("fr-FR")}
                          {d.size ? ` · ${formatSize(d.size)}` : ""}
                          {d.note ? ` · ${d.note}` : ""}
                        </span>
                      </span>
                      <button type="button" onClick={() => open(d)} aria-label={`Voir ${d.title}`} className="rounded-full p-2 text-avenida-blue hover:bg-avenida-blue-50">
                        <Eye aria-hidden className="size-4" />
                      </button>
                      <button type="button" onClick={() => open(d, true)} aria-label={`Télécharger ${d.title}`} className="rounded-full p-2 text-avenida-blue hover:bg-avenida-blue-50">
                        <Download aria-hidden className="size-4" />
                      </button>
                      {(mode === "admin" || d.direction === "depose") && (
                        <button type="button" onClick={() => remove(d)} aria-label={`Supprimer ${d.title}`} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-vif">
                          <Trash2 aria-hidden className="size-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
