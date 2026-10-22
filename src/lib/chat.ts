import { createClient } from "@/lib/supabase/client";

export type Conversation = {
  id: string;
  kind: "direct" | "groupe";
  title: string | null;
  avatar: string | null;
  last_message: string | null;
  last_message_at: string;
  unread: number;
  members: number;
  other_id: string | null;
  other_name: string | null;
  other_role: string | null;
  other_avatar: string | null;
  my_role: "admin" | "membre";
  muted: boolean;
};

export type ChatAttachment = { path?: string; name?: string; size?: number; mime?: string; duration?: number; video?: boolean; call_id?: string; room?: string; status?: string };

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  kind: "text" | "image" | "audio" | "video" | "file" | "call" | "meeting" | "system";
  body: string | null;
  attachment: ChatAttachment | null;
  reply_to: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

export type Person = { id: string; full_name: string; role: string; avatar: string | null; member_role?: string; last_read_at?: string; context?: string };

export const conversationName = (c: Pick<Conversation, "kind" | "title" | "other_name">) => (c.kind === "groupe" ? (c.title ?? "Groupe") : (c.other_name ?? "Discussion"));

/** Envoie une pièce jointe dans le dossier de la conversation (accès réservé à ses membres). */
export async function uploadChatFile(conversationId: string, file: Blob, name: string) {
  const safe = name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-60);
  const path = `${conversationId}/${Date.now()}-${safe}`;
  const { error } = await createClient().storage.from("discussions").upload(path, file, { contentType: file.type || undefined });
  if (error) throw error;
  return path;
}

/** Serveurs pour établir les appels (STUN public ; TURN facultatif via variables d'environnement). */
export function iceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
  const turn = process.env.NEXT_PUBLIC_TURN_URL;
  if (turn) servers.push({ urls: turn.split(","), username: process.env.NEXT_PUBLIC_TURN_USERNAME, credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL });
  return servers;
}

/** Salle de visioconférence (Jitsi Meet) pour les appels de groupe et les réunions. */
export function jitsiUrl(room: string, displayName: string, opts: { audioOnly?: boolean } = {}) {
  const cfg = [
    "config.prejoinPageEnabled=false",
    "config.disableDeepLinking=true",
    `config.startWithVideoMuted=${opts.audioOnly ? "true" : "false"}`,
    `userInfo.displayName=${encodeURIComponent(JSON.stringify(displayName))}`,
    "interfaceConfig.SHOW_JITSI_WATERMARK=false",
  ].join("&");
  return `https://meet.jit.si/${encodeURIComponent(room)}#${cfg}`;
}

export const newRoom = (prefix: string) => `Avenida-${prefix}-${crypto.randomUUID().slice(0, 13)}`;

export function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
