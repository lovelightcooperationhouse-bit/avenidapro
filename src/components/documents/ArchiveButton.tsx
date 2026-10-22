"use client";

import { Archive, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { archiveRecord, archivedAt, type ArchiveKind, type SourceFile } from "@/lib/archives";

/** « Vérifier et archiver » : copie les pièces dans les archives et garde une trace du dossier vérifié. */
export function ArchiveButton({
  kind,
  title,
  ownerName,
  reference,
  refType,
  refId,
  files = [],
  data,
  makeBlobs,
}: {
  kind: ArchiveKind;
  title: string;
  ownerName?: string;
  reference?: string;
  refType: string;
  refId: string;
  files?: (SourceFile & { label?: string })[];
  data?: Record<string, unknown>;
  /** Documents générés à joindre (ex. carte ou bulletin en PDF). */
  makeBlobs?: () => Promise<{ name: string; blob: Blob; label?: string }[]>;
}) {
  const { user } = useAuth();
  const [at, setAt] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    archivedAt(refType, refId).then(setAt);
  }, [refType, refId]);

  const run = async () => {
    if (!window.confirm(`Confirmer : toutes les pièces de « ${title} » ont été vérifiées. Archiver le dossier ?`)) return;
    setBusy(true);
    setError("");
    const blobs = makeBlobs ? await makeBlobs() : [];
    const r = await archiveRecord({ kind, title, ownerName, reference, refType, refId, files, blobs, data, userId: user?.id });
    setBusy(false);
    if (r.error) return setError(r.error.message);
    setAt(new Date().toISOString());
  };

  if (at === undefined) return null;
  if (at)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
        <CheckCircle2 aria-hidden className="size-4" /> Vérifié et archivé le {new Date(at).toLocaleDateString("fr-FR")}
      </span>
    );
  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" onClick={run} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-[#0C356A] px-4 py-2 text-sm font-bold text-white hover:bg-[#E30613] disabled:opacity-60">
        {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Archive aria-hidden className="size-4" />} Vérifier et archiver
      </button>
      {error && <span className="text-xs font-semibold text-[#B8000F]">{error}</span>}
    </span>
  );
}
