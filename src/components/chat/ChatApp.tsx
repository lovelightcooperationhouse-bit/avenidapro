"use client";

import { ArrowLeft, CalendarClock, Loader2, MessageSquarePlus, Search, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { conversationName, newRoom, timeLabel, type Conversation } from "@/lib/chat";
import { ROLE_CONFIG, type RoleType } from "@/lib/roles";
import { pushConversation } from "@/lib/push-client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { CallOverlay, JitsiRoom } from "./CallOverlay";
import { ChatThread } from "./ChatThread";

type Contact = { id: string; full_name: string; role: string; context: string };
type ActiveCall = { kind: "p2p"; callId: string; messageId?: string; video: boolean; mode: "sortant" | "entrant"; conv: Conversation } | { kind: "salle"; room: string; video: boolean; title: string };

const roleLabel = (r?: string | null) => (r ? (ROLE_CONFIG[r as RoleType]?.label ?? r) : "");

/** Messagerie de la plateforme : discussions privées, groupes de travail, messages vocaux, appels audio et vidéo. */
export function ChatApp() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [convs, setConvs] = useState<Conversation[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(params.get("c"));
  const [q, setQ] = useState("");
  const [dialog, setDialog] = useState<null | "direct" | "groupe">(null);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [call, setCall] = useState<ActiveCall | null>(null);
  const reloadTimer = useRef<number | undefined>(undefined);

  const load = useCallback(async () => {
    const { data } = await createClient().rpc("my_conversations");
    setConvs((data ?? []) as Conversation[]);
  }, []);
  const reload = useCallback(() => {
    window.clearTimeout(reloadTimer.current);
    reloadTimer.current = window.setTimeout(load, 300);
  }, [load]);

  useEffect(() => {
    load();
    if (!user) return;
    const supabase = createClient();
    // Nouveaux messages dans n'importe quelle discussion → liste à jour
    const list = supabase
      .channel(`discussions-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_messages" }, reload)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_members", filter: `profile_id=eq.${user.id}` }, reload)
      .subscribe();
    // Présence : qui est en ligne
    const presence = supabase.channel("presence-avenida", { config: { presence: { key: user.id } } });
    presence
      .on("presence", { event: "sync" }, () => setOnline(new Set(Object.keys(presence.presenceState()))))
      .subscribe((s) => {
        if (s === "SUBSCRIBED") presence.track({ at: Date.now() });
      });
    return () => {
      supabase.removeChannel(list);
      supabase.removeChannel(presence);
    };
  }, [user, load, reload]);

  // Appel entrant accepté depuis la sonnerie (paramètres d'adresse)
  useEffect(() => {
    const c = params.get("c");
    if (c) setActiveId(c);
    const appel = params.get("appel");
    if (!appel || !convs) return;
    const conv = convs.find((x) => x.id === c);
    const salle = params.get("salle");
    if (salle) setCall({ kind: "salle", room: salle, video: params.get("video") === "1", title: conv ? conversationName(conv) : "Appel de groupe" });
    else if (conv) setCall({ kind: "p2p", callId: appel, video: params.get("video") === "1", mode: "entrant", conv });
    router.replace(`/discussions?c=${c}`);
  }, [params, convs, router]);

  // Depuis l'annuaire : « Écrire » ouvre (ou crée) la discussion privée avec la personne
  useEffect(() => {
    const avec = params.get("avec");
    if (!avec || !user || avec === user.id) return;
    createClient()
      .rpc("start_direct", { other: avec })
      .then(({ data, error }) => {
        if (error || !data) return;
        load();
        setActiveId(String(data));
        router.replace(`/discussions?c=${data}`);
      });
  }, [params, user, load, router]);

  const active = convs?.find((c) => c.id === activeId) ?? null;
  const filtered = useMemo(() => (convs ?? []).filter((c) => conversationName(c).toLowerCase().includes(q.toLowerCase())), [convs, q]);
  const unreadTotal = (convs ?? []).reduce((a, c) => a + c.unread, 0);

  useEffect(() => {
    document.title = unreadTotal ? `(${unreadTotal}) Discussions · Avenida` : "Discussions · Avenida";
  }, [unreadTotal]);

  const open = (id: string) => {
    setActiveId(id);
    router.replace(`/discussions?c=${id}`);
  };

  const startCall = async (video: boolean) => {
    if (!active || !user) return;
    const supabase = createClient();
    const callId = crypto.randomUUID();
    if (active.kind === "groupe") {
      const room = newRoom("groupe");
      await supabase.from("conversation_messages").insert({ conversation_id: active.id, sender_id: user.id, kind: "call", attachment: { video, call_id: callId, room } });
      pushConversation({ conversationId: active.id, kind: "call", video, callId, room });
      setCall({ kind: "salle", room, video, title: conversationName(active) });
      return;
    }
    const { data } = await supabase.from("conversation_messages").insert({ conversation_id: active.id, sender_id: user.id, kind: "call", attachment: { video, call_id: callId } }).select("id").single();
    // Sonnerie sur le téléphone du correspondant, même application fermée
    pushConversation({ conversationId: active.id, kind: "call", video, callId });
    setCall({ kind: "p2p", callId, messageId: data?.id, video, mode: "sortant", conv: active });
  };

  if (!user) return null;
  const me = { id: user.id, name: user.fullName };

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-white md:rounded-2xl md:shadow-xl md:ring-1 md:ring-slate-900/5">
      {/* Liste des discussions */}
      <aside className={cn("flex w-full flex-col border-r border-slate-200 md:w-[22rem] md:shrink-0", active && "hidden md:flex")}>
        <header className="flex items-center justify-between gap-2 bg-[#0C356A] px-4 py-3 text-white">
          <Link href={user.home} aria-label="Retour à mon espace" className="rounded-full p-1.5 hover:bg-white/10">
            <ArrowLeft aria-hidden className="size-5" />
          </Link>
          <p className="flex-1 text-lg font-bold">Discussions</p>
          <Link href="/reunions" aria-label="Réunions" title="Réunions" className="rounded-full p-2 hover:bg-white/10">
            <CalendarClock aria-hidden className="size-5" />
          </Link>
          <button type="button" onClick={() => setDialog("groupe")} aria-label="Nouveau groupe" title="Nouveau groupe" className="rounded-full p-2 hover:bg-white/10">
            <Users aria-hidden className="size-5" />
          </button>
          <button type="button" onClick={() => setDialog("direct")} aria-label="Nouvelle discussion" title="Nouvelle discussion" className="rounded-full p-2 hover:bg-white/10">
            <MessageSquarePlus aria-hidden className="size-5" />
          </button>
        </header>
        <div className="border-b border-slate-100 p-2">
          <span className="relative block">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une discussion" aria-label="Rechercher une discussion" className="w-full rounded-xl bg-slate-100 py-2 pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-[#0C356A]/20" />
          </span>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {convs === null ? (
            <Loader2 aria-label="Chargement" className="mx-auto mt-10 size-6 animate-spin text-[#0C356A]" />
          ) : filtered.length === 0 ? (
            <li className="p-6 text-center text-sm text-slate-500">
              Aucune discussion.{" "}
              <button type="button" onClick={() => setDialog("direct")} className="font-bold text-[#E30613]">
                Commencer
              </button>
            </li>
          ) : (
            filtered.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => open(c.id)} className={cn("flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-slate-50", c.id === activeId && "bg-slate-100")}>
                  <Avatar name={conversationName(c)} src={c.kind === "groupe" ? c.avatar : c.other_avatar} group={c.kind === "groupe"} online={!!c.other_id && online.has(c.other_id)} />
                  <span className="min-w-0 flex-1 border-b border-slate-100 pb-3">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-bold text-slate-900">{conversationName(c)}</span>
                      <span className={cn("shrink-0 text-xs", c.unread ? "font-bold text-emerald-600" : "text-slate-400")}>{timeLabel(c.last_message_at)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-slate-500">{c.last_message ?? (c.kind === "groupe" ? `${c.members} membres` : roleLabel(c.other_role))}</span>
                      {c.unread > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      {/* Conversation */}
      {active ? (
        <ChatThread key={active.id} conv={active} me={me} online={online} onBack={() => { setActiveId(null); router.replace("/discussions"); }} onCall={startCall} onChanged={reload} />
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center gap-3 bg-slate-50 p-10 text-center md:flex">
          <span className="flex size-20 items-center justify-center rounded-full bg-[#0C356A] text-white">
            <MessageSquarePlus aria-hidden className="size-9" />
          </span>
          <p className="text-xl font-bold text-[#0C356A]">Discussions Avenida</p>
          <p className="max-w-sm text-sm text-slate-500">Écrivez, envoyez photos, vidéos, documents et messages vocaux, appelez en audio ou en vidéo, créez des groupes de travail.</p>
        </div>
      )}

      {dialog && <NewChat mode={dialog} onClose={() => setDialog(null)} onOpen={(id) => { setDialog(null); load().then(() => open(id)); }} canGroup={!["candidat", "client"].includes(user.role)} />}

      {call?.kind === "p2p" && (
        <CallOverlay
          callId={call.callId}
          messageId={call.messageId}
          video={call.video}
          mode={call.mode}
          peerName={conversationName(call.conv)}
          peerAvatar={call.conv.other_avatar}
          onClose={() => setCall(null)}
        />
      )}
      {call?.kind === "salle" && <JitsiRoom room={call.room} name={user.fullName} audioOnly={!call.video} title={call.title} onClose={() => setCall(null)} />}
    </div>
  );
}

function NewChat({ mode, onClose, onOpen, canGroup }: { mode: "direct" | "groupe"; onClose: () => void; onOpen: (id: string) => void; canGroup: boolean }) {
  const [tab, setTab] = useState(mode);
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    createClient()
      .rpc("my_contacts")
      .then(({ data }) => setContacts((data ?? []) as Contact[]));
  }, []);

  const list = (contacts ?? []).filter((c) => `${c.full_name} ${c.context} ${roleLabel(c.role)}`.toLowerCase().includes(q.toLowerCase()));

  const direct = async (id: string) => {
    setBusy(true);
    const { data, error: err } = await createClient().rpc("start_direct", { other: id });
    setBusy(false);
    if (err) return setError(err.message);
    onOpen(data as string);
  };

  const group = async () => {
    if (!title.trim()) return setError("Donnez un nom au groupe.");
    if (!picked.length) return setError("Choisissez au moins un membre.");
    setBusy(true);
    const { data, error: err } = await createClient().rpc("create_group", { p_title: title, p_description: description, p_members: picked });
    setBusy(false);
    if (err) return setError(err.message);
    onOpen(data as string);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white md:inset-auto md:top-4 md:left-4 md:h-[calc(100%-2rem)] md:w-[24rem] md:rounded-2xl md:shadow-2xl md:ring-1 md:ring-slate-200">
      <header className="flex items-center gap-3 bg-[#0C356A] px-4 py-3 text-white md:rounded-t-2xl">
        <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-1.5 hover:bg-white/10">
          <X aria-hidden className="size-5" />
        </button>
        <p className="font-bold">{tab === "direct" ? "Nouvelle discussion" : "Nouveau groupe de travail"}</p>
      </header>
      {canGroup && (
        <div className="grid grid-cols-2 border-b border-slate-200 text-sm font-bold">
          {(["direct", "groupe"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn("py-2.5", tab === t ? "border-b-2 border-[#E30613] text-[#E30613]" : "text-slate-500")}>
              {t === "direct" ? "Discussion privée" : "Groupe"}
            </button>
          ))}
        </div>
      )}
      {tab === "groupe" && (
        <div className="flex flex-col gap-2 border-b border-slate-100 p-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nom du groupe (ex. Équipe cuisine)" aria-label="Nom du groupe" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (facultatif)" aria-label="Description" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
      )}
      <div className="p-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un contact" aria-label="Rechercher un contact" className="w-full rounded-xl bg-slate-100 px-3 py-2 text-sm outline-none" />
      </div>
      {error && <p className="mx-3 rounded-lg bg-red-50 p-2 text-xs font-semibold text-[#DC2626]">{error}</p>}
      <ul className="flex-1 overflow-y-auto">
        {contacts === null ? (
          <Loader2 aria-label="Chargement" className="mx-auto mt-6 size-6 animate-spin" />
        ) : list.length === 0 ? (
          <li className="p-6 text-center text-sm text-slate-500">Aucun contact disponible.</li>
        ) : (
          list.map((c) => (
            <li key={c.id}>
              {tab === "direct" ? (
                <button type="button" disabled={busy} onClick={() => direct(c.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50">
                  <Avatar name={c.full_name} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{c.full_name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {roleLabel(c.role)} · {c.context}
                    </span>
                  </span>
                </button>
              ) : (
                <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
                  <input type="checkbox" checked={picked.includes(c.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, c.id] : picked.filter((x) => x !== c.id))} className="size-4 accent-[#E30613]" />
                  <Avatar name={c.full_name} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{c.full_name}</span>
                    <span className="block truncate text-xs text-slate-500">{roleLabel(c.role)}</span>
                  </span>
                </label>
              )}
            </li>
          ))
        )}
      </ul>
      {tab === "groupe" && (
        <button type="button" disabled={busy} onClick={group} className="m-3 rounded-full bg-[#E30613] py-3 text-sm font-bold text-white disabled:opacity-60">
          Créer le groupe ({picked.length} membre{picked.length > 1 ? "s" : ""})
        </button>
      )}
    </div>
  );
}
