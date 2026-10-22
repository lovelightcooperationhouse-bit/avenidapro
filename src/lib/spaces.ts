import { createClient } from "@/lib/supabase/client";

/** Salles de l'Espace École (une par filière) et de l'Espace Hôtel (une par service). */
export type Space = {
  id: string;
  kind: "ecole" | "hotel";
  name: string;
  program_code: string | null;
  specialty: string | null;
  service: string | null;
  description: string | null;
  color: string | null;
};

export type Attachment = { path: string; name: string; type: string; size: number };

export type PostType = "annonce" | "cours" | "devoir" | "programme" | "document" | "consigne";

export type SpacePost = {
  id: string;
  space_id: string;
  author_id: string;
  type: PostType;
  title: string;
  body: string | null;
  due_at: string | null;
  attachments: Attachment[];
  pinned: boolean;
  created_at: string;
};

export type Submission = {
  id: string;
  post_id: string;
  student_id: string;
  body: string | null;
  attachments: Attachment[];
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
};

export type SpaceMessage = {
  id: string;
  space_id: string;
  sender_id: string;
  kind: "text" | "image" | "audio" | "file" | "live";
  body: string | null;
  attachment: (Attachment & { room?: string }) | null;
  created_at: string;
};

export type LiveSession = { id: string; space_id: string; started_by: string; title: string; room: string; started_at: string; ended_at: string | null };

export type Person = { id: string; full_name: string; role: string; space_role: "responsable" | "membre" };

export const POST_TYPES: Record<PostType, { label: string; plural: string; tone: string }> = {
  annonce: { label: "Annonce", plural: "Annonces", tone: "bg-red-50 text-vif ring-red-200" },
  cours: { label: "Cours", plural: "Cours", tone: "bg-avenida-blue-50 text-avenida-blue ring-avenida-blue-200" },
  devoir: { label: "Devoir", plural: "Devoirs", tone: "bg-amber-50 text-amber-800 ring-amber-200" },
  programme: { label: "Programme", plural: "Programme", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  document: { label: "Document", plural: "Documents", tone: "bg-slate-100 text-slate-700 ring-slate-200" },
  consigne: { label: "Consigne", plural: "Consignes", tone: "bg-violet-50 text-violet-700 ring-violet-200" },
};

/** Types de publication proposés selon l'espace. */
export const postTypesFor = (kind: Space["kind"]): PostType[] =>
  kind === "ecole" ? ["annonce", "cours", "devoir", "programme", "document"] : ["annonce", "consigne", "document", "programme"];

export const formatSize = (n: number) => (n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} Mo` : `${Math.max(1, Math.round(n / 1024))} Ko`);

export const timeAgo = (d: string) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

/** Dépose un fichier dans le stockage privé de la salle et renvoie sa description. */
export async function uploadToSpace(spaceId: string, folder: string, file: File | Blob, name: string): Promise<Attachment> {
  const safe = name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
  const path = `${spaceId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}`;
  const type = file.type || "application/octet-stream";
  const { error } = await createClient().storage.from("espaces").upload(path, file, { contentType: type });
  if (error) throw error;
  return { path, name, type, size: file.size };
}

const urlCache = new Map<string, { url: string; expires: number }>();

/** Lien temporaire (1 h) vers un fichier privé d'une salle. */
export async function signedUrl(path: string, bucket = "espaces"): Promise<string | null> {
  const key = `${bucket}/${path}`;
  const hit = urlCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.url;
  const { data } = await createClient().storage.from(bucket).createSignedUrl(path, 3600);
  if (!data?.signedUrl) return null;
  urlCache.set(key, { url: data.signedUrl, expires: Date.now() + 55 * 60 * 1000 });
  return data.signedUrl;
}

/** Nom de salle de visio difficile à deviner (Jitsi Meet). */
export const newLiveRoom = (space: Space) =>
  `Avenida-${(space.program_code ?? space.service ?? "salle").replace(/\W/g, "")}-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
