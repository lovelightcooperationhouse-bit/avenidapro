"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatSize, signedUrl, type Attachment } from "@/lib/spaces";
import { cn } from "@/lib/utils";

/** Affiche une pièce jointe privée : image en vignette, audio lisible, autre fichier en lien de téléchargement. */
export function AttachmentView({ file, compact = false, inverted = false }: { file: Attachment; compact?: boolean; inverted?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    signedUrl(file.path).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [file.path]);

  if (file.type.startsWith("image/")) {
    return url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- lien signé temporaire, non optimisable */}
        <img src={url} alt={file.name} className={cn("w-full object-cover", compact ? "max-h-60" : "max-h-96")} />
      </a>
    ) : (
      <div className="flex h-40 items-center justify-center rounded-xl bg-slate-100">
        <Loader2 aria-hidden className="size-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (file.type.startsWith("audio/")) {
    return url ? <audio controls src={url} className="h-10 w-64 max-w-full" /> : <Loader2 aria-hidden className="size-5 animate-spin text-slate-400" />;
  }

  if (file.type.startsWith("video/")) {
    return url ? <video controls src={url} className="max-h-96 w-full rounded-xl bg-black" /> : <Loader2 aria-hidden className="size-5 animate-spin text-slate-400" />;
  }

  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!url}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        inverted ? "bg-white/10 hover:bg-white/20" : "border border-slate-200 bg-white hover:border-vif"
      )}
    >
      <FileText aria-hidden className={cn("size-5 shrink-0", inverted ? "text-white" : "text-vif")} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{file.name}</span>
        <span className={cn("text-xs", inverted ? "text-white/70" : "text-slate-500")}>{formatSize(file.size)}</span>
      </span>
      <Download aria-hidden className="size-4 shrink-0" />
    </a>
  );
}
