"use client";

import { Download, Eye, Loader2, Printer } from "lucide-react";
import { useState } from "react";
import { ArchiveButton } from "@/components/documents/ArchiveButton";
import type { ArchiveKind } from "@/lib/archives";
import { elementToPdf } from "@/lib/pdf";

/**
 * Barre d'actions d'un document imprimable : aperçu PDF, téléchargement, impression,
 * et archivage (le PDF généré est conservé dans les archives).
 */
export function DocumentToolbar({
  elementId,
  fileName,
  archive,
}: {
  elementId: string;
  fileName: string;
  archive?: { kind: ArchiveKind; title: string; ownerName?: string; reference?: string; refType: string; refId: string };
}) {
  const [busy, setBusy] = useState(false);
  const makePdf = async () => {
    const el = document.getElementById(elementId);
    if (!el) throw new Error("Document non chargé");
    return elementToPdf(el);
  };
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  const btn = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold";
  return (
    <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow print:hidden">
      <button type="button" disabled={busy} onClick={() => run(async () => void window.open(URL.createObjectURL((await makePdf()).output("blob")), "_blank"))} className={`${btn} text-[#0C356A] ring-1 ring-slate-200 hover:text-[#E30613]`}>
        {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Eye aria-hidden className="size-4" />} Aperçu PDF
      </button>
      <button type="button" disabled={busy} onClick={() => run(async () => void (await makePdf()).save(`${fileName}.pdf`))} className={`${btn} bg-[#0C356A] text-white hover:bg-[#E30613]`}>
        <Download aria-hidden className="size-4" /> Télécharger le PDF
      </button>
      <button type="button" onClick={() => window.print()} className={`${btn} bg-[#E30613] text-white`}>
        <Printer aria-hidden className="size-4" /> Imprimer
      </button>
      {archive && (
        <span className="ml-auto">
          <ArchiveButton {...archive} makeBlobs={async () => [{ name: `${fileName}.pdf`, blob: (await makePdf()).output("blob"), label: archive.title }]} />
        </span>
      )}
    </div>
  );
}
