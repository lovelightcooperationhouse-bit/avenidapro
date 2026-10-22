import { createClient } from "@/lib/supabase/client";

export type ArchiveKind = "preinscription" | "dossier_membre" | "permission" | "demande_contact" | "reservation" | "carte" | "bulletin" | "recu" | "fiche" | "autre";
export type SourceFile = { bucket: string; path: string; name: string };
export type ArchivedFile = { path: string; name: string; size: number | null; mime: string | null; label?: string };

export const ARCHIVE_KINDS: Record<ArchiveKind, string> = {
  preinscription: "Pré-inscription",
  dossier_membre: "Dossier de membre",
  permission: "Permission",
  demande_contact: "Demande de contact",
  reservation: "Réservation",
  carte: "Carte",
  bulletin: "Bulletin",
  recu: "Reçu",
  fiche: "Fiche d'inscription",
  autre: "Autre",
};

const safe = (s: string) => s.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);

/**
 * Archive un dossier vérifié : les fichiers sont copiés dans le stockage privé « archives »
 * (classés par année / type / dossier) et une fiche d'archive est créée avec les données utiles.
 */
export async function archiveRecord(opts: {
  kind: ArchiveKind;
  title: string;
  ownerName?: string;
  reference?: string;
  refType: string;
  refId: string;
  files?: (SourceFile & { label?: string })[];
  blobs?: { name: string; blob: Blob; label?: string }[];
  data?: Record<string, unknown>;
  notes?: string;
  userId?: string;
}) {
  const supabase = createClient();
  const year = String(new Date().getFullYear());
  const folder = `${year}/${opts.kind}/${opts.refId}`;
  const stored: ArchivedFile[] = [];
  for (const f of opts.files ?? []) {
    const { data } = await supabase.storage.from(f.bucket).download(f.path);
    if (!data) continue;
    const path = `${folder}/${Date.now()}-${safe(f.name)}`;
    const up = await supabase.storage.from("archives").upload(path, data, { contentType: data.type || undefined, upsert: true });
    if (!up.error) stored.push({ path, name: f.name, size: data.size, mime: data.type || null, label: f.label });
  }
  for (const b of opts.blobs ?? []) {
    const path = `${folder}/${Date.now()}-${safe(b.name)}`;
    const up = await supabase.storage.from("archives").upload(path, b.blob, { contentType: b.blob.type || undefined, upsert: true });
    if (!up.error) stored.push({ path, name: b.name, size: b.blob.size, mime: b.blob.type || null, label: b.label });
  }
  const { error } = await supabase.from("archives").insert({
    kind: opts.kind,
    title: opts.title,
    owner_name: opts.ownerName ?? null,
    reference: opts.reference ?? null,
    ref_type: opts.refType,
    ref_id: opts.refId,
    year,
    files: stored,
    data: opts.data ?? {},
    notes: opts.notes ?? null,
    archived_by: opts.userId ?? null,
  });
  return { error, count: stored.length };
}

/** Date d'archivage d'un dossier (null s'il n'est pas archivé). */
export async function archivedAt(refType: string, refId: string) {
  const { data } = await createClient().from("archives").select("created_at").eq("ref_type", refType).eq("ref_id", refId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data?.created_at ?? null;
}
