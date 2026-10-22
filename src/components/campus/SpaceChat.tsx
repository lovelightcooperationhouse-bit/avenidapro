"use client";

import { ImageIcon, Loader2, Mic, Paperclip, Send, Square, Trash2, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { roleConfig } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { timeAgo, uploadToSpace, type Person, type Space, type SpaceMessage } from "@/lib/spaces";
import { cn } from "@/lib/utils";
import { AttachmentView } from "./AttachmentView";

/**
 * Discussion de la salle en temps réel : texte, photos, fichiers et messages vocaux.
 * Réservée aux membres de la salle (contrôle par la base).
 */
export function SpaceChat({ space, userId, people, isResponsable, onJoinLive }: { space: Space; userId: string; people: Record<string, Person>; isResponsable: boolean; onJoinLive: (room: string) => void }) {
  const [messages, setMessages] = useState<SpaceMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await createClient().from("space_messages").select("*").eq("space_id", space.id).order("created_at", { ascending: false }).limit(200);
    setMessages(((data ?? []) as SpaceMessage[]).reverse());
  }, [space.id]);

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`salle-${space.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "space_messages", filter: `space_id=eq.${space.id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [space.id, load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  const send = async (kind: SpaceMessage["kind"], body: string | null, file?: File | Blob, name?: string) => {
    setBusy(true);
    setError("");
    try {
      const attachment = file ? await uploadToSpace(space.id, "discussion", file, name ?? "fichier") : null;
      const { error: err } = await createClient().from("space_messages").insert({ space_id: space.id, sender_id: userId, kind, body, attachment });
      if (err) throw err;
      load();
    } catch {
      setError("Envoi impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const sendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    await send("text", text);
  };

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size > 0) await send("audio", null, blob, `vocal-${new Date().toISOString().slice(11, 19).replace(/:/g, "")}.${(rec.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm"}`);
      };
      recorder.current = rec;
      rec.start();
      setSeconds(0);
      setRecording(true);
    } catch {
      setError("Micro inaccessible : autorisez l'accès au micro dans votre navigateur.");
    }
  };

  const stopRecording = () => {
    recorder.current?.stop();
    setRecording(false);
  };

  const remove = async (m: SpaceMessage) => {
    const supabase = createClient();
    if (m.attachment?.path) await supabase.storage.from("espaces").remove([m.attachment.path]);
    await supabase.from("space_messages").delete().eq("id", m.id);
    load();
  };

  return (
    <div className="flex h-[38rem] flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5">
      <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,#F0F5FA,white_60%)] p-4 sm:p-5">
        {messages.length === 0 && <p className="mt-20 text-center text-slate-500">Aucun message. Lancez la discussion de la salle !</p>}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          const who = people[m.sender_id];
          if (m.kind === "live") {
            return (
              <div key={m.id} className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-2xl bg-nuit p-4 text-center text-white">
                <Video aria-hidden className="size-6 text-vif-clair" />
                <p className="text-sm">
                  <strong>{who?.full_name ?? "Le professeur"}</strong> a lancé un direct : {m.body}
                </p>
                <button type="button" onClick={() => m.attachment?.room && onJoinLive(m.attachment.room)} className="rounded-full bg-vif px-4 py-1.5 text-sm font-bold hover:bg-vif-fonce">
                  Rejoindre
                </button>
                <span className="text-[11px] text-white/60">{timeAgo(m.created_at)}</span>
              </div>
            );
          }
          return (
            <div key={m.id} className={cn("group flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]", mine ? "ml-auto items-end" : "items-start")}>
              {!mine && (
                <span className="px-1 text-[11px] font-bold text-slate-500">
                  {who?.full_name ?? "Membre"}
                  {who && who.space_role === "responsable" && <span className="ml-1 text-vif">· {roleConfig(who.role).label}</span>}
                </span>
              )}
              <div className={cn("rounded-2xl px-3.5 py-2.5 text-sm shadow-sm", mine ? "rounded-br-md bg-avenida-blue text-white" : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-100")}>
                {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                {m.attachment && (
                  <div className={m.body ? "mt-2" : ""}>
                    <AttachmentView file={m.attachment} compact inverted={mine} />
                  </div>
                )}
              </div>
              <span className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
                {timeAgo(m.created_at)}
                {(mine || isResponsable) && (
                  <button type="button" onClick={() => remove(m)} aria-label="Supprimer le message" className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100">
                    <Trash2 aria-hidden className="size-3.5 hover:text-vif" />
                  </button>
                )}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && <p role="alert" className="bg-red-50 px-4 py-2 text-xs font-semibold text-vif">{error}</p>}

      <form onSubmit={sendText} className="flex items-end gap-2 border-t border-slate-100 p-3">
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-avenida-blue hover:bg-avenida-blue-50 has-[:focus-visible]:ring-2" title="Envoyer une photo">
          <ImageIcon aria-hidden className="size-5" />
          <span className="sr-only">Envoyer une photo</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) send("image", null, f, f.name);
              e.target.value = "";
            }}
          />
        </label>
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-avenida-blue hover:bg-avenida-blue-50 has-[:focus-visible]:ring-2" title="Envoyer un fichier">
          <Paperclip aria-hidden className="size-5" />
          <span className="sr-only">Envoyer un fichier</span>
          <input
            type="file"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) send(f.type.startsWith("image/") ? "image" : "file", null, f, f.name);
              e.target.value = "";
            }}
          />
        </label>
        {recording ? (
          <div className="flex h-11 flex-1 items-center gap-3 rounded-full bg-red-50 px-4 text-sm font-bold text-vif">
            <span className="site-pulse-dot size-2.5 rounded-full bg-vif" />
            Enregistrement… {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </div>
        ) : (
          <>
            <label htmlFor={`chat-${space.id}`} className="sr-only">
              Votre message
            </label>
            <textarea
              id={`chat-${space.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              maxLength={4000}
              placeholder="Écrire à la salle…"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-avenida-blue"
            />
          </>
        )}
        {draft.trim() && !recording ? (
          <button type="submit" disabled={busy} aria-label="Envoyer" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-vif text-white hover:bg-vif-fonce disabled:opacity-50">
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={busy}
            aria-label={recording ? "Arrêter et envoyer le message vocal" : "Enregistrer un message vocal"}
            className={cn("flex size-11 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50", recording ? "bg-avenida-blue" : "bg-vif hover:bg-vif-fonce")}
          >
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : recording ? <Square aria-hidden className="size-4 fill-current" /> : <Mic aria-hidden className="size-5" />}
          </button>
        )}
      </form>
    </div>
  );
}
