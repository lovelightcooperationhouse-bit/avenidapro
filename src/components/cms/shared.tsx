"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useState } from "react";
import type { CmsMedia } from "@/lib/cms-types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0C356A] focus:ring-2 focus:ring-[#0C356A]/15";
export const label = "flex flex-col gap-1 text-xs font-bold text-slate-600";

/** Téléverse un fichier dans le stockage public du site et renvoie son adresse. */
export async function uploadSiteFile(file: File, folder: string) {
  const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-60);
  const path = `${folder}/${Date.now()}-${safe}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("site").upload(path, file, { contentType: file.type || undefined, cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from("site").getPublicUrl(path).data.publicUrl;
}

/** Régénère le site public après une modification. */
export const publishSite = () => fetch("/api/site/revalider", { method: "POST" }).catch(() => {});

/** Sélection et aperçu d'images (une seule ou une galerie). */
export function MediaPicker({ value, onChange, multiple, folder, accept = "image/*", hint }: { value: CmsMedia[]; onChange: (m: CmsMedia[]) => void; multiple?: boolean; folder: string; accept?: string; hint?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      const urls: CmsMedia[] = [];
      for (const f of Array.from(files)) {
        if (f.size > 50 * 1024 * 1024) throw new Error(`${f.name} dépasse 50 Mo`);
        urls.push({ url: await uploadSiteFile(f, folder), alt: "" });
      }
      onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {value.map((m, i) => (
          <div key={m.url + i} className="relative">
            {/\.(mp4|webm|mov)$/i.test(m.url) ? (
              <video src={m.url} className="h-20 w-28 rounded-lg object-cover ring-1 ring-slate-200" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- aperçu
              <img src={m.url} alt="" className="h-20 w-28 rounded-lg object-cover ring-1 ring-slate-200" />
            )}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Retirer" className="absolute -top-2 -right-2 rounded-full bg-white p-1 text-slate-600 shadow ring-1 ring-slate-200 hover:text-[#DC2626]">
              <X aria-hidden className="size-3.5" />
            </button>
            {multiple && (
              <input
                value={m.alt ?? ""}
                onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                placeholder="Légende"
                aria-label="Légende de l'image"
                className="mt-1 w-28 rounded border border-slate-200 px-1.5 py-0.5 text-[11px]"
              />
            )}
          </div>
        ))}
        {(multiple || value.length === 0) && (
          <label className={cn("flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-[11px] font-bold text-slate-500 hover:border-[#0C356A] hover:text-[#0C356A]")}>
            {busy ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <ImagePlus aria-hidden className="size-5" />}
            {multiple ? "Ajouter" : "Choisir"}
            <input type="file" accept={accept} multiple={multiple} className="sr-only" onChange={(e) => add(e.target.files)} />
          </label>
        )}
      </div>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
      {error && <p className="text-xs font-semibold text-[#DC2626]">{error}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#E30613]" />
      {children}
    </label>
  );
}
