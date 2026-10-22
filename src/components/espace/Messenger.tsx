"use client";

import { ArrowLeft, MessageSquarePlus, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { roleConfig } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Contact = { id: string; full_name: string; role: string; context: string };
type Message = { id: string; sender_id: string; recipient_id: string; subject: string | null; body: string; created_at: string; read_at: string | null };

const time = (d: string) =>
  new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Messagerie interne. Les contacts proposés et les messages visibles sont filtrés par la base :
 * un parent écrit aux professeurs de son enfant et à l'administration, un professeur à ses élèves et à leurs parents, etc.
 */
export function Messenger() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [names, setNames] = useState<Record<string, { name: string; role: string }>>({});
  const [active, setActive] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.rpc("my_contacts"),
      supabase.from("messages").select("*").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at"),
    ]);
    const list = (c ?? []) as Contact[];
    setContacts(list);
    setMessages((m ?? []) as Message[]);

    // Noms des correspondants (contacts + personnes qui nous ont écrit)
    const map: Record<string, { name: string; role: string }> = {};
    list.forEach((x) => (map[x.id] = { name: x.full_name, role: x.role }));
    const unknown = [...new Set((m ?? []).flatMap((x: Message) => [x.sender_id, x.recipient_id]))].filter((id) => id !== user.id && !map[id]);
    if (unknown.length) {
      const { data: p } = await supabase.from("profiles").select("id, first_name, last_name, email, role").in("id", unknown);
      (p ?? []).forEach((x) => (map[x.id] = { name: [x.first_name, x.last_name].filter(Boolean).join(" ") || x.email, role: x.role }));
    }
    setNames(map);
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`messages-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  // Conversations : dernier message par correspondant
  const threads = useMemo(() => {
    if (!user) return [];
    const byPeer = new Map<string, { last: Message; unread: number }>();
    messages.forEach((m) => {
      const peer = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const t = byPeer.get(peer) ?? { last: m, unread: 0 };
      t.last = m;
      if (m.recipient_id === user.id && !m.read_at) t.unread += 1;
      byPeer.set(peer, t);
    });
    return [...byPeer.entries()].sort((a, b) => b[1].last.created_at.localeCompare(a[1].last.created_at));
  }, [messages, user]);

  const thread = useMemo(
    () => (active && user ? messages.filter((m) => (m.sender_id === active && m.recipient_id === user.id) || (m.sender_id === user.id && m.recipient_id === active)) : []),
    [messages, active, user]
  );

  // Marque comme lus les messages reçus de la conversation ouverte
  useEffect(() => {
    if (!active || !user) return;
    const unread = thread.filter((m) => m.recipient_id === user.id && !m.read_at).map((m) => m.id);
    endRef.current?.scrollIntoView({ block: "end" });
    if (!unread.length) return;
    createClient()
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unread)
      .then(() => setMessages((all) => all.map((m) => (unread.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m))));
  }, [active, thread, user]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !active || !draft.trim()) return;
    setError("");
    const { data, error: err } = await createClient()
      .from("messages")
      .insert({ sender_id: user.id, recipient_id: active, body: draft.trim() })
      .select()
      .single();
    if (err) return setError("Message non envoyé : vous ne pouvez pas écrire à cette personne.");
    setMessages((all) => [...all, data as Message]);
    setDraft("");
  };

  if (!user) return null;
  const peerName = (id: string) => names[id]?.name ?? "Correspondant";
  const peerRole = (id: string) => roleConfig(names[id]?.role).label;

  return (
    <div className="grid min-h-[34rem] overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5 md:grid-cols-[20rem_1fr]">
      {/* Liste des conversations */}
      <aside className={cn("flex flex-col border-r border-slate-100", active || composing ? "hidden md:flex" : "flex")}>
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="font-display text-lg font-bold text-avenida-blue">Conversations</h2>
          <button
            type="button"
            onClick={() => {
              setComposing(true);
              setActive(null);
            }}
            className="flex items-center gap-1.5 rounded-full bg-avenida-red px-3 py-1.5 text-xs font-bold text-white hover:bg-avenida-red-700"
          >
            <MessageSquarePlus aria-hidden className="size-4" />
            Nouveau
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {threads.length === 0 && <li className="p-5 text-sm text-slate-500">Aucune conversation. Cliquez sur « Nouveau » pour écrire.</li>}
          {threads.map(([peer, t]) => (
            <li key={peer}>
              <button
                type="button"
                onClick={() => {
                  setActive(peer);
                  setComposing(false);
                }}
                className={cn("flex w-full flex-col gap-0.5 border-b border-slate-50 p-4 text-left hover:bg-slate-50", active === peer && "bg-avenida-blue-50")}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-bold text-slate-800">{peerName(peer)}</span>
                  {t.unread > 0 && <span className="rounded-full bg-avenida-red px-2 py-0.5 text-[10px] font-bold text-white">{t.unread}</span>}
                </span>
                <span className="text-[11px] font-semibold text-avenida-red">{peerRole(peer)}</span>
                <span className="truncate text-xs text-slate-500">{t.last.body}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Nouveau message : choix du destinataire */}
      {composing && !active && (
        <section className="flex flex-col p-5">
          <button type="button" onClick={() => setComposing(false)} className="mb-4 flex w-fit items-center gap-1 text-sm font-bold text-avenida-red md:hidden">
            <ArrowLeft aria-hidden className="size-4" /> Retour
          </button>
          <h2 className="font-display text-lg font-bold text-avenida-blue">À qui voulez-vous écrire ?</h2>
          {contacts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Aucun contact disponible pour le moment.</p>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {contacts.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActive(c.id);
                      setComposing(false);
                    }}
                    className="flex w-full flex-col rounded-2xl border border-slate-200 p-4 text-left transition-colors hover:border-avenida-red hover:bg-red-50/40"
                  >
                    <span className="font-bold text-slate-800">{c.full_name}</span>
                    <span className="text-xs font-semibold text-avenida-red">{roleConfig(c.role).label}</span>
                    <span className="text-xs text-slate-500">{c.context}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Fil de discussion */}
      {active && (
        <section className="flex flex-col">
          <header className="flex items-center gap-3 border-b border-slate-100 p-4">
            <button type="button" onClick={() => setActive(null)} aria-label="Retour aux conversations" className="md:hidden">
              <ArrowLeft aria-hidden className="size-5 text-avenida-red" />
            </button>
            <div>
              <p className="font-bold text-avenida-blue">{peerName(active)}</p>
              <p className="text-xs font-semibold text-avenida-red">{peerRole(active)}</p>
            </div>
          </header>
          <div className="flex max-h-[28rem] flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4">
            {thread.length === 0 && <p className="m-auto text-sm text-slate-500">Écrivez le premier message.</p>}
            {thread.map((m) => {
              const mine = m.sender_id === user.id;
              return (
                <div key={m.id} className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm", mine ? "self-end rounded-br-md bg-avenida-blue text-white" : "self-start rounded-bl-md bg-white text-slate-800")}>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={cn("mt-1 text-[10px]", mine ? "text-white/60" : "text-slate-400")}>
                    {time(m.created_at)}
                    {mine && m.read_at ? " · Lu" : ""}
                  </p>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-100 p-3">
            <label htmlFor="message-draft" className="sr-only">
              Votre message
            </label>
            <textarea
              id="message-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={2}
              maxLength={5000}
              placeholder="Écrire un message…"
              className="flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-avenida-blue focus:ring-2 focus:ring-avenida-blue/15"
            />
            <button type="submit" aria-label="Envoyer" disabled={!draft.trim()} className="flex size-11 items-center justify-center rounded-full bg-avenida-red text-white hover:bg-avenida-red-700 disabled:opacity-40">
              <Send aria-hidden className="size-4" />
            </button>
          </form>
          {error && <p role="alert" className="px-4 pb-3 text-xs font-semibold text-avenida-red">{error}</p>}
        </section>
      )}

      {!active && !composing && (
        <div className="hidden items-center justify-center p-10 text-center text-slate-500 md:flex">Sélectionnez une conversation ou écrivez un nouveau message.</div>
      )}
    </div>
  );
}
