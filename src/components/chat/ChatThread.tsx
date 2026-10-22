"use client";

import { ArrowLeft, Check, CheckCheck, CornerUpLeft, Download, FileText, Info, Loader2, LogOut, Mic, Paperclip, Phone, PhoneIncoming, PhoneMissed, Send, Smile, Square, Trash2, UserPlus, Users, Video, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { conversationName, dayLabel, uploadChatFile, type ChatMessage, type Conversation, type Person } from "@/lib/chat";
import { ROLE_CONFIG, type RoleType } from "@/lib/roles";
import { formatSize, signedUrl } from "@/lib/spaces";
import { pushConversation } from "@/lib/push-client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

const EMOJIS = ["😀", "😂", "😍", "🙏", "👍", "👏", "🎉", "❤️", "😢", "😮", "🔥", "✅", "📌", "🍽️", "👨‍🍳", "📚"];
const roleLabel = (r?: string | null) => (r ? (ROLE_CONFIG[r as RoleType]?.label ?? r) : "");

/** Média privé d'une discussion (lien signé temporaire). */
function useSigned(path?: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (path) signedUrl(path, "discussions").then(setUrl);
  }, [path]);
  return url;
}

function MediaContent({ m, mine }: { m: ChatMessage; mine: boolean }) {
  const a = m.attachment ?? {};
  const url = useSigned(a.path);
  if (m.kind === "image")
    return url ? (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element -- pièce jointe privée */}
        <img src={url} alt={a.name ?? "Photo"} className="max-h-72 w-full rounded-xl object-cover" />
      </a>
    ) : (
      <span className="block h-40 w-56 animate-pulse rounded-xl bg-black/10" />
    );
  if (m.kind === "video") return url ? <video src={url} controls preload="metadata" className="max-h-72 w-full rounded-xl" /> : <span className="block h-40 w-56 animate-pulse rounded-xl bg-black/10" />;
  if (m.kind === "audio")
    return (
      <span className="flex items-center gap-2">
        <Mic aria-hidden className={cn("size-4 shrink-0", mine ? "text-white/70" : "text-[#0C356A]")} />
        {url ? <audio src={url} controls preload="metadata" className="h-9 max-w-[15rem]" /> : <Loader2 aria-hidden className="size-4 animate-spin" />}
      </span>
    );
  if (m.kind === "file")
    return (
      <a href={url ?? "#"} target="_blank" rel="noopener noreferrer" download={a.name} className={cn("flex items-center gap-3 rounded-xl p-2", mine ? "bg-white/10" : "bg-slate-100")}>
        <FileText aria-hidden className="size-8 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{a.name}</span>
          <span className="text-xs opacity-70">{a.size ? formatSize(a.size) : ""}</span>
        </span>
        <Download aria-hidden className="ml-auto size-4 shrink-0" />
      </a>
    );
  return null;
}

export function ChatThread({
  conv,
  me,
  online,
  onBack,
  onCall,
  onChanged,
}: {
  conv: Conversation;
  me: { id: string; name: string };
  online: Set<string>;
  onBack: () => void;
  onCall: (video: boolean) => void;
  onChanged: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [text, setText] = useState("");
  const [reply, setReply] = useState<ChatMessage | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rec, setRec] = useState<{ recorder: MediaRecorder; started: number } | null>(null);
  const [recSec, setRecSec] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const channel = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const typingSent = useRef(0);
  const typingTimer = useRef<number | undefined>(undefined);
  const name = conversationName(conv);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data }, { data: p }] = await Promise.all([
      supabase.from("conversation_messages").select("*").eq("conversation_id", conv.id).order("created_at", { ascending: false }).limit(200),
      supabase.rpc("conversation_people", { cid: conv.id }),
    ]);
    setMessages(((data ?? []) as ChatMessage[]).reverse());
    setPeople((p ?? []) as Person[]);
  }, [conv.id]);

  const markRead = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    await createClient().from("conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conv.id).eq("profile_id", me.id);
    onChanged();
  }, [conv.id, me.id, onChanged]);

  useEffect(() => {
    load();
    markRead();
    const supabase = createClient();
    const ch = supabase
      .channel(`conv-${conv.id}`, { config: { broadcast: { self: false } } })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_messages", filter: `conversation_id=eq.${conv.id}` }, ({ eventType, new: m }) => {
        const msg = m as ChatMessage;
        setMessages((list) => {
          if (!list) return list;
          if (eventType === "INSERT") return list.some((x) => x.id === msg.id) ? list : [...list, msg];
          return list.map((x) => (x.id === msg.id ? msg : x));
        });
        if (eventType === "INSERT" && msg.sender_id !== me.id) markRead();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversation_members", filter: `conversation_id=eq.${conv.id}` }, ({ new: m }) => {
        const row = m as { profile_id: string; last_read_at: string };
        setPeople((ps) => ps.map((p) => (p.id === row.profile_id ? { ...p, last_read_at: row.last_read_at } : p)));
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        setTyping(payload.name);
        window.clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => setTyping(null), 3000);
      })
      .subscribe();
    channel.current = ch;
    const onVisible = () => markRead();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      supabase.removeChannel(ch);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [conv.id, load, markRead, me.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  useEffect(() => {
    if (!rec) return;
    const id = window.setInterval(() => setRecSec(Math.round((Date.now() - rec.started) / 1000)), 500);
    return () => window.clearInterval(id);
  }, [rec]);

  const others = people.filter((p) => p.id !== me.id);
  const readBy = (m: ChatMessage) => others.length > 0 && others.every((p) => p.last_read_at && p.last_read_at >= m.created_at);
  const byId = useMemo(() => Object.fromEntries((messages ?? []).map((m) => [m.id, m])), [messages]);
  const personName = (id: string | null) => (id === me.id ? "Vous" : (people.find((p) => p.id === id)?.full_name ?? "Membre"));

  const post = async (row: Partial<ChatMessage>) => {
    const { data, error } = await createClient()
      .from("conversation_messages")
      .insert({ conversation_id: conv.id, sender_id: me.id, reply_to: reply?.id ?? null, ...row })
      .select()
      .single();
    if (!error && data) {
      setMessages((l) => (l && !l.some((x) => x.id === data.id) ? [...l, data as ChatMessage] : l));
      const m = data as ChatMessage;
      pushConversation({ conversationId: conv.id, kind: "message", preview: m.kind === "text" ? (m.body ?? "") : m.kind === "image" ? "📷 Photo" : m.kind === "audio" ? "🎤 Message vocal" : m.kind === "video" ? "🎬 Vidéo" : "📎 Fichier" });
    }
    setReply(null);
    onChanged();
    return data as ChatMessage | null;
  };

  const sendText = async () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    await post({ kind: "text", body });
  };

  const sendFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    for (const f of Array.from(files)) {
      if (f.size > 50 * 1024 * 1024) continue;
      try {
        const path = await uploadChatFile(conv.id, f, f.name);
        const kind = f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "audio" : "file";
        await post({ kind, attachment: { path, name: f.name, size: f.size, mime: f.type } });
      } catch {
        /* fichier ignoré */
      }
    }
    setUploading(false);
  };

  const startRecording = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const r = new MediaRecorder(s, { mimeType: mime });
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = async () => {
        s.getTracks().forEach((t) => t.stop());
        if ((r as MediaRecorder & { cancelled?: boolean }).cancelled) return;
        const blob = new Blob(chunks, { type: mime });
        setUploading(true);
        try {
          const path = await uploadChatFile(conv.id, blob, `vocal.${mime.includes("webm") ? "webm" : "m4a"}`);
          await post({ kind: "audio", attachment: { path, name: "Message vocal", size: blob.size, mime } });
        } finally {
          setUploading(false);
        }
      };
      r.start();
      setRec({ recorder: r, started: Date.now() });
      setRecSec(0);
    } catch {
      alert("Micro inaccessible : autorisez le micro dans votre navigateur.");
    }
  };
  const stopRecording = (cancel = false) => {
    if (!rec) return;
    (rec.recorder as MediaRecorder & { cancelled?: boolean }).cancelled = cancel;
    rec.recorder.stop();
    setRec(null);
  };

  const onType = (v: string) => {
    setText(v);
    if (Date.now() - typingSent.current > 2000) {
      typingSent.current = Date.now();
      channel.current?.send({ type: "broadcast", event: "typing", payload: { name: me.name.split(" ")[0] } });
    }
  };

  const remove = async (m: ChatMessage) => {
    if (!window.confirm("Supprimer ce message pour tout le monde ?")) return;
    await createClient().from("conversation_messages").update({ deleted_at: new Date().toISOString(), body: null, attachment: null }).eq("id", m.id);
  };

  const status = typing
    ? `${conv.kind === "groupe" ? typing + " " : ""}écrit…`
    : conv.kind === "direct"
      ? conv.other_id && online.has(conv.other_id)
        ? "en ligne"
        : roleLabel(conv.other_role)
      : `${people.length} membres`;

  let lastDay = "";

  return (
    <div className="flex h-full min-h-0 flex-1">
      <section className="flex min-w-0 flex-1 flex-col bg-[#EFEAE2] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><path d=%22M20 4l16 16-16 16L4 20z%22 fill=%22none%22 stroke=%22%230C356A%22 stroke-opacity=%220.05%22/></svg>')]">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2.5">
          <button type="button" onClick={onBack} aria-label="Retour aux discussions" className="rounded-full p-2 hover:bg-slate-100 md:hidden">
            <ArrowLeft aria-hidden className="size-5" />
          </button>
          <button type="button" onClick={() => setShowInfo((s) => !s)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <Avatar name={name} src={conv.kind === "groupe" ? conv.avatar : conv.other_avatar} group={conv.kind === "groupe"} online={!!conv.other_id && online.has(conv.other_id)} size="sm" />
            <span className="min-w-0">
              <span className="block truncate font-bold text-slate-900">{name}</span>
              <span className={cn("block truncate text-xs", typing || (conv.other_id && online.has(conv.other_id)) ? "text-emerald-600" : "text-slate-500")}>{status}</span>
            </span>
          </button>
          <button type="button" onClick={() => onCall(false)} aria-label="Appel audio" className="rounded-full p-2.5 text-[#0C356A] hover:bg-slate-100">
            <Phone aria-hidden className="size-5" />
          </button>
          <button type="button" onClick={() => onCall(true)} aria-label="Appel vidéo" className="rounded-full p-2.5 text-[#0C356A] hover:bg-slate-100">
            <Video aria-hidden className="size-5" />
          </button>
          <button type="button" onClick={() => setShowInfo((s) => !s)} aria-label="Informations" className="hidden rounded-full p-2.5 text-[#0C356A] hover:bg-slate-100 sm:block">
            <Info aria-hidden className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-8">
          {messages === null ? (
            <Loader2 aria-label="Chargement" className="mx-auto size-6 animate-spin text-[#0C356A]" />
          ) : messages.length === 0 ? (
            <p className="mx-auto mt-10 max-w-xs rounded-xl bg-[#FFF5C4] p-3 text-center text-xs text-slate-700">Aucun message. Dites bonjour 👋 — les messages sont réservés aux membres de cette discussion.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {messages.map((m) => {
                const day = dayLabel(m.created_at);
                const showDay = day !== lastDay;
                lastDay = day;
                const mine = m.sender_id === me.id;
                const quoted = m.reply_to ? byId[m.reply_to] : null;
                const time = new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                return (
                  <li key={m.id} className="flex flex-col">
                    {showDay && <span className="mx-auto my-3 rounded-lg bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">{day}</span>}
                    {m.kind === "system" ? (
                      <span className="mx-auto my-1 rounded-lg bg-[#FFF5C4] px-3 py-1 text-center text-xs text-slate-700">{m.body}</span>
                    ) : (
                      <div className={cn("group flex max-w-[85%] items-end gap-1 sm:max-w-[70%]", mine ? "self-end" : "self-start")}>
                        {mine && !m.deleted_at && (
                          <span className="hidden gap-0.5 group-hover:flex">
                            <button type="button" onClick={() => remove(m)} aria-label="Supprimer" className="rounded-full p-1 text-slate-400 hover:text-[#DC2626]">
                              <Trash2 aria-hidden className="size-3.5" />
                            </button>
                          </span>
                        )}
                        <div className={cn("relative rounded-2xl px-3 py-2 shadow-sm", mine ? "rounded-br-sm bg-[#0C356A] text-white" : "rounded-bl-sm bg-white text-slate-900")}>
                          {conv.kind === "groupe" && !mine && <p className="mb-0.5 text-xs font-bold text-[#E30613]">{personName(m.sender_id)}</p>}
                          {quoted && (
                            <p className={cn("mb-1 border-l-4 px-2 py-1 text-xs", mine ? "border-white/50 bg-white/10" : "border-[#E30613] bg-slate-100")}>
                              <span className="block font-bold">{personName(quoted.sender_id)}</span>
                              <span className="line-clamp-2 opacity-80">{quoted.body ?? quoted.attachment?.name ?? "Pièce jointe"}</span>
                            </p>
                          )}
                          {m.deleted_at ? (
                            <p className="text-sm italic opacity-70">Message supprimé</p>
                          ) : m.kind === "call" ? (
                            <p className="flex items-center gap-2 text-sm">
                              {m.attachment?.status === "manque" || m.attachment?.status === "refuse" ? <PhoneMissed aria-hidden className="size-4 text-[#FF3B47]" /> : <PhoneIncoming aria-hidden className="size-4" />}
                              {m.attachment?.video ? "Appel vidéo" : "Appel audio"}
                              {m.attachment?.status === "termine" && m.attachment.duration ? ` · ${Math.floor(m.attachment.duration / 60)} min ${m.attachment.duration % 60} s` : ""}
                              {m.attachment?.status === "manque" ? " manqué" : m.attachment?.status === "refuse" ? " refusé" : ""}
                              <button type="button" onClick={() => onCall(!!m.attachment?.video)} className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold">
                                Rappeler
                              </button>
                            </p>
                          ) : m.kind === "meeting" ? (
                            <p className="flex flex-col gap-1 text-sm">
                              <span className="font-bold">🗓️ {m.attachment?.name ?? "Réunion"}</span>
                              <span className="opacity-80">{m.body}</span>
                              <a href={`/reunions?salle=${encodeURIComponent(m.attachment?.room ?? "")}`} className="self-start rounded-full bg-[#E30613] px-3 py-1 text-xs font-bold text-white">
                                Rejoindre
                              </a>
                            </p>
                          ) : (
                            <>
                              <MediaContent m={m} mine={mine} />
                              {m.body && <p className="text-[15px] leading-snug break-words whitespace-pre-wrap">{m.body}</p>}
                            </>
                          )}
                          <span className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", mine ? "text-white/70" : "text-slate-400")}>
                            {time}
                            {mine && (readBy(m) ? <CheckCheck aria-label="Lu" className="size-3.5 text-sky-300" /> : <Check aria-label="Envoyé" className="size-3.5" />)}
                          </span>
                        </div>
                        {!mine && !m.deleted_at && (
                          <button type="button" onClick={() => setReply(m)} aria-label="Répondre" className="hidden rounded-full p-1 text-slate-400 group-hover:block hover:text-[#0C356A]">
                            <CornerUpLeft aria-hidden className="size-3.5" />
                          </button>
                        )}
                        {mine && !m.deleted_at && (
                          <button type="button" onClick={() => setReply(m)} aria-label="Répondre" className="order-first hidden rounded-full p-1 text-slate-400 group-hover:block hover:text-[#0C356A]">
                            <CornerUpLeft aria-hidden className="size-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
          <div ref={endRef} />
        </div>

        {reply && (
          <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-2 text-sm">
            <CornerUpLeft aria-hidden className="size-4 text-[#E30613]" />
            <span className="min-w-0 flex-1 truncate">
              <strong>{personName(reply.sender_id)}</strong> : {reply.body ?? reply.attachment?.name ?? "Pièce jointe"}
            </span>
            <button type="button" onClick={() => setReply(null)} aria-label="Annuler la réponse" className="rounded-full p-1 hover:bg-slate-100">
              <X aria-hidden className="size-4" />
            </button>
          </div>
        )}

        {showEmoji && (
          <div className="flex flex-wrap gap-1 border-t border-slate-200 bg-white px-3 py-2">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setText((t) => t + e)} className="rounded-lg p-1.5 text-xl hover:bg-slate-100">
                {e}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 bg-[#F0F2F5] px-2 py-2 sm:px-4" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
          {rec ? (
            <div className="flex flex-1 items-center gap-3 rounded-full bg-white px-4 py-3">
              <span className="size-3 animate-pulse rounded-full bg-[#E30613]" />
              <span className="font-mono text-sm">
                {String(Math.floor(recSec / 60)).padStart(2, "0")}:{String(recSec % 60).padStart(2, "0")}
              </span>
              <span className="flex-1 text-sm text-slate-500">Enregistrement…</span>
              <button type="button" onClick={() => stopRecording(true)} aria-label="Annuler l'enregistrement" className="rounded-full p-1 text-slate-500 hover:text-[#DC2626]">
                <Trash2 aria-hidden className="size-5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-1 items-end gap-1 rounded-3xl bg-white px-2 py-1">
              <button type="button" onClick={() => setShowEmoji((s) => !s)} aria-label="Émojis" className="rounded-full p-2 text-slate-500 hover:text-[#0C356A]">
                <Smile aria-hidden className="size-5" />
              </button>
              <textarea
                value={text}
                onChange={(e) => onType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 768px)").matches) {
                    e.preventDefault();
                    sendText();
                  }
                }}
                rows={1}
                placeholder="Écrire un message"
                aria-label="Message"
                className="max-h-32 min-h-[2.5rem] flex-1 resize-none bg-transparent py-2 text-[15px] outline-none"
              />
              <label className="cursor-pointer rounded-full p-2 text-slate-500 hover:text-[#0C356A]" aria-label="Joindre une photo, une vidéo ou un fichier">
                {uploading ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <Paperclip aria-hidden className="size-5" />}
                <input type="file" multiple className="sr-only" onChange={(e) => sendFiles(e.target.files)} />
              </label>
            </div>
          )}
          {text.trim() ? (
            <button type="button" onClick={sendText} aria-label="Envoyer" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#E30613] text-white shadow">
              <Send aria-hidden className="size-5" />
            </button>
          ) : rec ? (
            <button type="button" onClick={() => stopRecording(false)} aria-label="Envoyer le message vocal" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#E30613] text-white shadow">
              <Send aria-hidden className="size-5" />
            </button>
          ) : (
            <button type="button" onClick={startRecording} aria-label="Enregistrer un message vocal" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#0C356A] text-white shadow">
              <Mic aria-hidden className="size-5" />
            </button>
          )}
        </div>
      </section>

      {showInfo && <InfoPanel conv={conv} people={people} me={me} online={online} onClose={() => setShowInfo(false)} onChanged={() => { load(); onChanged(); }} />}
    </div>
  );
}

function InfoPanel({ conv, people, me, online, onClose, onChanged }: { conv: Conversation; people: Person[]; me: { id: string }; online: Set<string>; onClose: () => void; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [contacts, setContacts] = useState<Person[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const isAdmin = conv.my_role === "admin";

  useEffect(() => {
    if (!adding) return;
    createClient()
      .rpc("my_contacts")
      .then(({ data }) => setContacts(((data ?? []) as { id: string; full_name: string; role: string; context: string }[]).map((c) => ({ id: c.id, full_name: c.full_name, role: c.role, avatar: null, context: c.context }))));
  }, [adding]);

  const add = async () => {
    await createClient().rpc("add_group_members", { cid: conv.id, p_members: picked });
    setAdding(false);
    setPicked([]);
    onChanged();
  };
  const leave = async () => {
    if (!window.confirm("Quitter ce groupe ?")) return;
    await createClient().from("conversation_members").delete().eq("conversation_id", conv.id).eq("profile_id", me.id);
    window.location.href = "/discussions";
  };

  const list = contacts.filter((c) => !people.some((p) => p.id === c.id) && c.full_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <aside className="absolute inset-0 z-20 flex w-full flex-col border-l border-slate-200 bg-white md:static md:w-80">
      <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-1.5 hover:bg-slate-100">
          <X aria-hidden className="size-5" />
        </button>
        <p className="font-bold">{conv.kind === "groupe" ? "Infos du groupe" : "Infos du contact"}</p>
      </header>
      <div className="flex flex-col items-center gap-2 border-b border-slate-100 p-6 text-center">
        <Avatar name={conversationName(conv)} src={conv.kind === "groupe" ? conv.avatar : conv.other_avatar} group={conv.kind === "groupe"} size="lg" />
        <p className="text-lg font-bold">{conversationName(conv)}</p>
        <p className="text-sm text-slate-500">{conv.kind === "groupe" ? `Groupe · ${people.length} membres` : roleLabel(conv.other_role)}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wide text-slate-500 uppercase">
          <Users aria-hidden className="size-4" /> Membres
        </p>
        <ul className="flex flex-col gap-2">
          {people.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <Avatar name={p.full_name} src={p.avatar} online={online.has(p.id)} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{p.id === me.id ? "Vous" : p.full_name}</span>
                <span className="text-xs text-slate-500">{roleLabel(p.role)}</span>
              </span>
              {p.member_role === "admin" && conv.kind === "groupe" && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Admin</span>}
            </li>
          ))}
        </ul>
        {conv.kind === "groupe" && isAdmin && !adding && (
          <button type="button" onClick={() => setAdding(true)} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0C356A]">
            <UserPlus aria-hidden className="size-4" /> Ajouter des membres
          </button>
        )}
        {adding && (
          <div className="mt-4 flex flex-col gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" aria-label="Rechercher un contact" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <ul className="max-h-60 overflow-y-auto">
              {list.map((c) => (
                <li key={c.id}>
                  <label className="flex items-center gap-2 py-1.5 text-sm">
                    <input type="checkbox" checked={picked.includes(c.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, c.id] : picked.filter((x) => x !== c.id))} className="accent-[#E30613]" />
                    {c.full_name} <span className="text-xs text-slate-400">{roleLabel(c.role)}</span>
                  </label>
                </li>
              ))}
            </ul>
            <button type="button" disabled={!picked.length} onClick={add} className="rounded-full bg-[#E30613] px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
              Ajouter ({picked.length})
            </button>
          </div>
        )}
      </div>
      {conv.kind === "groupe" && (
        <button type="button" onClick={leave} className="m-4 inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-[#DC2626]">
          <LogOut aria-hidden className="size-4" /> Quitter le groupe
        </button>
      )}
    </aside>
  );
}
