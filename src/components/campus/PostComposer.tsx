"use client";

import { Loader2, Paperclip, Send, X } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatSize, POST_TYPES, postTypesFor, uploadToSpace, type PostType, type Space } from "@/lib/spaces";
import { cn } from "@/lib/utils";

/** Publication par le responsable de la salle (professeur, direction) : annonce, cours, devoir, programme, document. */
export function PostComposer({ space, authorId, defaultType = "annonce", onPosted }: { space: Space; authorId: string; defaultType?: PostType; onPosted: () => void }) {
  const types = postTypesFor(space.kind);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PostType>(types.includes(defaultType) ? defaultType : types[0]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [due, setDue] = useState("");
  const [pinned, setPinned] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setTitle("");
    setBody("");
    setDue("");
    setPinned(false);
    setFiles([]);
    setError("");
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Donnez un titre à votre publication.");
    if (files.some((f) => f.size > 50 * 1024 * 1024)) return setError("Chaque fichier doit faire moins de 50 Mo.");
    setBusy(true);
    setError("");
    try {
      const attachments = [];
      for (const f of files) attachments.push(await uploadToSpace(space.id, "publications", f, f.name));
      const { error: err } = await createClient()
        .from("space_posts")
        .insert({ space_id: space.id, author_id: authorId, type, title: title.trim(), body: body.trim() || null, due_at: type === "devoir" && due ? new Date(due).toISOString() : null, attachments, pinned });
      if (err) throw err;
      reset();
      onPosted();
    } catch {
      setError("Publication impossible. Vérifiez vos fichiers et réessayez.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 bg-white p-5 text-left font-semibold text-slate-500 transition-colors hover:border-vif hover:text-vif"
      >
        <Send aria-hidden className="size-5" />
        Publier dans la salle : annonce, cours, {space.kind === "ecole" ? "devoir, " : "consigne, "}programme ou document…
      </button>
    );
  }

  const field = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-avenida-blue focus:ring-2 focus:ring-avenida-blue/15";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-lg ring-1 ring-slate-900/5 sm:p-6">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Type de publication">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            className={cn("rounded-full px-4 py-1.5 text-sm font-bold ring-1 transition-colors", type === t ? "bg-vif text-white ring-vif" : "bg-white text-slate-600 ring-slate-200 hover:ring-vif")}
          >
            {POST_TYPES[t].label}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
        Titre
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={field} placeholder={type === "devoir" ? "Ex. Fiche technique : sauce béchamel" : "Titre de la publication"} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
        Contenu
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={20000} className={cn(field, "resize-y")} placeholder="Consignes, contenu du cours, informations…" />
      </label>
      <div className="flex flex-wrap items-end gap-4">
        {type === "devoir" && (
          <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
            À rendre avant le
            <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className={field} />
          </label>
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-avenida-blue-50 px-4 py-3 text-sm font-bold text-avenida-blue hover:bg-avenida-blue-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-avenida-blue">
          <Paperclip aria-hidden className="size-4" />
          Joindre des fichiers (PDF, images, vidéos…)
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              setFiles((x) => [...x, ...Array.from(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="size-4 accent-[#E30613]" />
          Épingler en haut
        </label>
      </div>
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pr-1 pl-3 text-xs font-semibold text-slate-700">
              {f.name} · {formatSize(f.size)}
              <button type="button" aria-label={`Retirer ${f.name}`} onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="flex size-6 items-center justify-center rounded-full hover:bg-white">
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-vif">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={reset} className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">
          Annuler
        </button>
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-vif px-6 py-2.5 text-sm font-bold text-white hover:bg-vif-fonce disabled:opacity-60">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
          Publier
        </button>
      </div>
    </form>
  );
}
