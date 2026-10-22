"use client";

import { Download, ExternalLink, FileText, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ViewableFile = { bucket: string; path: string; name: string; label?: string };

/** Lien signé temporaire vers un fichier privé (5 minutes). */
export async function fileUrl(f: ViewableFile, download = false) {
  const { data } = await createClient().storage.from(f.bucket).createSignedUrl(f.path, 300, download ? { download: f.name } : undefined);
  return data?.signedUrl ?? null;
}

/** Télécharge directement un fichier privé. */
export async function downloadFile(f: ViewableFile) {
  const url = await fileUrl(f, true);
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = f.name;
  a.click();
}

/** Aperçu d'un document (photo, PDF) avant de le télécharger ou de l'archiver. */
export function DocumentViewer({ file, onClose }: { file: ViewableFile; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const kind = /\.(png|jpe?g|webp|gif)$/i.test(file.name) ? "image" : /\.pdf$/i.test(file.name) ? "pdf" : "autre";

  useEffect(() => {
    fileUrl(file).then(setUrl);
  }, [file]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900/80 p-2 sm:p-6" role="dialog" aria-label={`Aperçu : ${file.label ?? file.name}`} onClick={onClose}>
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <FileText aria-hidden className="size-5 text-[#0C356A]" />
          <p className="min-w-0 flex-1 truncate font-bold text-slate-800">
            {file.label && <span className="text-[#E30613]">{file.label} · </span>}
            {file.name}
          </p>
          <button type="button" onClick={() => downloadFile(file)} className="inline-flex items-center gap-1.5 rounded-full bg-[#0C356A] px-4 py-2 text-sm font-bold text-white">
            <Download aria-hidden className="size-4" /> Télécharger
          </button>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200">
              <ExternalLink aria-hidden className="size-4" /> Ouvrir
            </a>
          )}
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-2 hover:bg-slate-100">
            <X aria-hidden className="size-5" />
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-100">
          {!url ? (
            <Loader2 aria-label="Chargement" className="size-8 animate-spin text-[#0C356A]" />
          ) : kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- document privé (lien signé)
            <img src={url} alt={file.name} className="max-h-full max-w-full object-contain" />
          ) : kind === "pdf" ? (
            <iframe src={url} title={file.name} className="size-full border-0" />
          ) : (
            <p className="p-8 text-center text-sm text-slate-600">Aperçu indisponible pour ce type de fichier. Utilisez « Télécharger ».</p>
          )}
        </div>
      </div>
    </div>
  );
}
