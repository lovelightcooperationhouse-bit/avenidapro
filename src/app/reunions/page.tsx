"use client";

import { ArrowLeft, CalendarClock, CalendarPlus, Copy, Loader2, Trash2, Users, Video } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/chat/Avatar";
import { JitsiRoom } from "@/components/chat/CallOverlay";
import { useAuth } from "@/context/AuthContext";
import { newRoom, type Conversation } from "@/lib/chat";
import { pingNotifications } from "@/lib/notify";
import { ROLE_CONFIG, type RoleType } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Meeting = { id: string; title: string; description: string | null; room: string; starts_at: string; duration_min: number; host_id: string | null; conversation_id: string | null; status: string };
type Contact = { id: string; full_name: string; role: string; context: string };
const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0C356A]";

function Reunions() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [room, setRoom] = useState<{ room: string; title: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const canHost = !!user && !["candidat", "client", "eleve", "parent"].includes(user.role);

  const load = useCallback(async () => {
    const { data } = await createClient().from("meetings").select("*").neq("status", "annulee").order("starts_at", { ascending: true });
    setMeetings((data ?? []) as Meeting[]);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/connexion?suite=/reunions");
    if (user) load();
  }, [isLoading, user, router, load]);

  useEffect(() => {
    const salle = params.get("salle");
    if (salle) setRoom({ room: salle, title: "Réunion Avenida" });
  }, [params]);

  if (!user) return <Loader2 aria-label="Chargement" className="mx-auto mt-20 size-8 animate-spin" />;

  const now = Date.now();
  const upcoming = (meetings ?? []).filter((m) => new Date(m.starts_at).getTime() + m.duration_min * 60_000 > now && m.status !== "terminee");
  const past = (meetings ?? []).filter((m) => !upcoming.includes(m)).reverse().slice(0, 20);

  const instant = async () => {
    const r = newRoom("reunion");
    const { data } = await createClient()
      .from("meetings")
      .insert({ title: `Réunion de ${user.fullName.split(" ")[0]}`, room: r, host_id: user.id, status: "en_cours", duration_min: 60 })
      .select()
      .single();
    if (data) {
      await navigator.clipboard?.writeText(`${window.location.origin}/reunions?salle=${r}`).catch(() => {});
      setRoom({ room: r, title: data.title });
      load();
    }
  };

  const join = async (m: Meeting) => {
    if (m.host_id === user.id && m.status === "prevue") await createClient().from("meetings").update({ status: "en_cours" }).eq("id", m.id);
    setRoom({ room: m.room, title: m.title });
  };

  const end = async (m: Meeting) => {
    await createClient().from("meetings").update({ status: "terminee" }).eq("id", m.id);
    load();
  };
  const cancel = async (m: Meeting) => {
    if (!window.confirm("Annuler cette réunion ?")) return;
    await createClient().from("meetings").update({ status: "annulee" }).eq("id", m.id);
    load();
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-[#0C356A] px-4 py-3 text-white" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <Link href={user.home} aria-label="Retour" className="rounded-full p-1.5 hover:bg-white/10">
          <ArrowLeft aria-hidden className="size-5" />
        </Link>
        <p className="flex-1 text-lg font-bold">Réunions</p>
        <Link href="/discussions" className="rounded-full px-3 py-1.5 text-sm font-bold hover:bg-white/10">
          Discussions
        </Link>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
        {canHost && (
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={instant} className="flex items-center gap-4 rounded-3xl bg-[#E30613] p-5 text-left text-white shadow-lg">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15">
                <Video aria-hidden className="size-7" />
              </span>
              <span>
                <span className="block text-lg font-bold">Réunion immédiate</span>
                <span className="text-sm text-white/80">Démarre maintenant, lien copié pour inviter</span>
              </span>
            </button>
            <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-4 rounded-3xl bg-[#0C356A] p-5 text-left text-white shadow-lg">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15">
                <CalendarPlus aria-hidden className="size-7" />
              </span>
              <span>
                <span className="block text-lg font-bold">Planifier une réunion</span>
                <span className="text-sm text-white/80">Date, participants, invitation automatique</span>
              </span>
            </button>
          </div>
        )}

        {creating && <Planner onDone={() => { setCreating(false); load(); }} />}

        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0C356A]">
            <CalendarClock aria-hidden className="size-5" /> À venir et en cours
          </h2>
          {meetings === null ? (
            <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
          ) : upcoming.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">Aucune réunion prévue.</p>
          ) : (
            upcoming.map((m) => {
              const live = m.status === "en_cours" || new Date(m.starts_at).getTime() <= now;
              return (
                <article key={m.id} className={cn("flex flex-wrap items-center gap-4 rounded-3xl bg-white p-5 ring-1", params.get("id") === m.id ? "ring-2 ring-[#E30613]" : "ring-slate-200")}>
                  <div className="flex size-14 flex-col items-center justify-center rounded-2xl bg-slate-100 text-[#0C356A]">
                    <span className="text-lg leading-none font-black">{new Date(m.starts_at).getDate()}</span>
                    <span className="text-[10px] font-bold uppercase">{new Date(m.starts_at).toLocaleDateString("fr-FR", { month: "short" })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-bold text-slate-900">
                      {m.title}
                      {live && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-[#DC2626]">● EN DIRECT</span>}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(m.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {m.duration_min} min{m.description ? ` · ${m.description}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/reunions?salle=${m.room}`)} aria-label="Copier le lien" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                      <Copy aria-hidden className="size-4" />
                    </button>
                    {m.host_id === user.id && (
                      <>
                        {live && (
                          <button type="button" onClick={() => end(m)} className="rounded-full px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                            Terminer
                          </button>
                        )}
                        <button type="button" onClick={() => cancel(m)} aria-label="Annuler la réunion" className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-[#DC2626]">
                          <Trash2 aria-hidden className="size-4" />
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => join(m)} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white">
                      <Video aria-hidden className="size-4" /> {m.host_id === user.id && !live ? "Démarrer" : "Rejoindre"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {past.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold tracking-wide text-slate-500 uppercase">Réunions passées</h2>
            <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
              {past.map((m) => (
                <li key={m.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-700">{m.title}</span>
                  <span className="text-slate-500">{new Date(m.starts_at).toLocaleDateString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="rounded-2xl bg-white p-4 text-xs leading-relaxed text-slate-500 ring-1 ring-slate-200">
          Les réunions utilisent une salle de visioconférence sécurisée (Jitsi Meet) : vidéo, son, partage d&apos;écran, discussion et lever la main. La première
          personne qui ouvre la salle peut être invitée à se connecter (compte Google) pour en devenir modératrice.
        </p>
      </main>

      {room && <JitsiRoom room={room.room} name={user.fullName} title={room.title} onClose={() => { setRoom(null); router.replace("/reunions"); }} />}
    </div>
  );
}

function Planner({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", description: "", date: new Date(Date.now() + 3600_000).toISOString().slice(0, 16), duration: 60, group: "" });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Conversation[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("my_contacts").then(({ data }) => setContacts((data ?? []) as Contact[]));
    supabase.rpc("my_conversations").then(({ data }) => setGroups(((data ?? []) as Conversation[]).filter((c) => c.kind === "groupe")));
  }, []);

  if (!user) return null;
  const list = contacts.filter((c) => !roleFilter || c.role === roleFilter);

  const save = async () => {
    if (!form.title.trim()) return setError("Titre obligatoire.");
    setBusy(true);
    const supabase = createClient();
    const room = newRoom("reunion");
    const { data: m, error: err } = await supabase
      .from("meetings")
      .insert({ title: form.title.trim(), description: form.description.trim() || null, room, starts_at: new Date(form.date).toISOString(), duration_min: form.duration, host_id: user.id, conversation_id: form.group || null })
      .select()
      .single();
    if (err || !m) {
      setBusy(false);
      return setError(err?.message ?? "Création impossible");
    }
    // Participants : contacts choisis + membres du groupe choisi
    let ids = [...picked];
    if (form.group) {
      const { data: people } = await supabase.rpc("conversation_people", { cid: form.group });
      ids = [...new Set([...ids, ...((people ?? []) as { id: string }[]).map((p) => p.id)])];
      await supabase.from("conversation_messages").insert({
        conversation_id: form.group,
        sender_id: user.id,
        kind: "meeting",
        body: new Date(form.date).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" }),
        attachment: { room, name: form.title.trim() },
      });
    }
    ids = ids.filter((id) => id !== user.id);
    if (ids.length) await supabase.from("meeting_participants").insert(ids.map((profile_id) => ({ meeting_id: m.id, profile_id })));
    pingNotifications();
    setBusy(false);
    onDone();
  };

  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-white p-5 ring-2 ring-[#0C356A]/15">
      <h2 className="text-lg font-black text-[#0C356A]">Planifier une réunion</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre (ex. Conseil pédagogique)" aria-label="Titre" className={cn(input, "sm:col-span-2")} />
        <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label="Date et heure" className={input} />
        <select value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} aria-label="Durée" className={input}>
          {[15, 30, 45, 60, 90, 120, 180].map((d) => (
            <option key={d} value={d}>
              {d} minutes
            </option>
          ))}
        </select>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ordre du jour" aria-label="Ordre du jour" rows={2} className={cn(input, "sm:col-span-2")} />
        <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} aria-label="Inviter un groupe" className={cn(input, "sm:col-span-2")}>
          <option value="">Inviter un groupe de travail (facultatif)</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title} ({g.members} membres)
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Users aria-hidden className="size-4" /> Participants ({picked.length})
        </p>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filtrer par rôle" className="rounded-lg border border-slate-200 px-2 py-1 text-xs">
          <option value="">Tous les rôles</option>
          {(Object.keys(ROLE_CONFIG) as RoleType[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_CONFIG[r].label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setPicked([...new Set([...picked, ...list.map((c) => c.id)])])} className="text-xs font-bold text-[#0C356A]">
          Tout sélectionner
        </button>
        <button type="button" onClick={() => setPicked([])} className="text-xs font-bold text-slate-500">
          Effacer
        </button>
      </div>
      <ul className="grid max-h-64 gap-1 overflow-y-auto sm:grid-cols-2">
        {list.map((c) => (
          <li key={c.id}>
            <label className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50">
              <input type="checkbox" checked={picked.includes(c.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, c.id] : picked.filter((x) => x !== c.id))} className="accent-[#E30613]" />
              <Avatar name={c.full_name} size="sm" />
              <span className="min-w-0 text-sm">
                <span className="block truncate font-semibold">{c.full_name}</span>
                <span className="block truncate text-xs text-slate-500">{ROLE_CONFIG[c.role as RoleType]?.label ?? c.role}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm font-semibold text-[#DC2626]">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <CalendarPlus aria-hidden className="size-4" />} Planifier et inviter
        </button>
        <button type="button" onClick={onDone} className="rounded-full px-4 py-2 text-sm font-bold text-slate-600">
          Annuler
        </button>
      </div>
    </section>
  );
}

export default function ReunionsPage() {
  return (
    <Suspense fallback={<Loader2 aria-label="Chargement" className="mx-auto mt-20 size-8 animate-spin" />}>
      <Reunions />
    </Suspense>
  );
}
