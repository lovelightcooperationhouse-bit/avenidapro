"use client";

import { ArrowLeft, BookOpen, ClipboardCheck, ListChecks, Megaphone, MessagesSquare, UserMinus, UserPlus, Users, Video } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { roleConfig } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import type { Person, PostType, Space, SpacePost, Submission } from "@/lib/spaces";
import { cn } from "@/lib/utils";
import { AssignmentPanel } from "./AssignmentPanel";
import { LivePanel } from "./LivePanel";
import { PostComposer } from "./PostComposer";
import { PostFeed } from "./PostFeed";
import { SpaceChat } from "./SpaceChat";

type Tab = "fil" | "cours" | "devoirs" | "programme" | "discussion" | "visio" | "membres";

/** Salle d'un espace : fil d'annonces, cours et documents, devoirs, programme, discussion, visio et membres. */
export function SpaceRoom({ spaceId }: { spaceId: string }) {
  const { user } = useAuth();
  const [space, setSpace] = useState<Space | null | undefined>(undefined);
  const [myRole, setMyRole] = useState<"responsable" | "membre" | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [posts, setPosts] = useState<SpacePost[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tab, setTab] = useState<Tab>("fil");
  const [liveRoom, setLiveRoom] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("space_posts").select("*").eq("space_id", spaceId).order("created_at", { ascending: false });
    const list = (data ?? []) as SpacePost[];
    setPosts(list);
    const devoirs = list.filter((p) => p.type === "devoir").map((p) => p.id);
    if (devoirs.length) {
      const { data: subs } = await supabase.from("assignment_submissions").select("*").in("post_id", devoirs);
      setSubmissions((subs ?? []) as Submission[]);
    }
  }, [spaceId]);

  const loadPeople = useCallback(async () => {
    const { data } = await createClient().rpc("space_people", { sid: spaceId });
    setPeople((data ?? []) as Person[]);
  }, [spaceId]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      const [{ data: s }, { data: role }] = await Promise.all([supabase.from("spaces").select("*").eq("id", spaceId).maybeSingle(), supabase.rpc("space_role", { sid: spaceId })]);
      setSpace((s as Space) ?? null);
      setMyRole((role as "responsable" | "membre" | null) ?? null);
    })();
    loadPeople();
    loadPosts();
    const channel = supabase
      .channel(`posts-${spaceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "space_posts", filter: `space_id=eq.${spaceId}` }, () => loadPosts())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, spaceId, loadPosts, loadPeople]);

  const peopleById = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people]);

  if (!user || space === undefined) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  if (!space || !myRole) {
    return (
      <p className="rounded-3xl bg-amber-50 p-6 text-amber-900 ring-1 ring-amber-200">
        Cette salle n&apos;existe pas ou vous n&apos;en êtes pas membre. Chaque filière et chaque service a sa propre salle.
      </p>
    );
  }

  const isResponsable = myRole === "responsable";
  const byType = (types: PostType[]) => posts.filter((p) => types.includes(p.type));
  const tabs: { key: Tab; label: string; icon: typeof Megaphone; count?: number }[] = [
    { key: "fil", label: space.kind === "ecole" ? "Annonces" : "Annonces & consignes", icon: Megaphone, count: byType(["annonce", "consigne"]).length },
    { key: "cours", label: space.kind === "ecole" ? "Cours & documents" : "Documents", icon: BookOpen, count: byType(["cours", "document"]).length },
    ...(space.kind === "ecole" ? [{ key: "devoirs" as Tab, label: "Devoirs", icon: ClipboardCheck, count: byType(["devoir"]).length }] : []),
    { key: "programme", label: "Programme", icon: ListChecks, count: byType(["programme"]).length },
    { key: "discussion", label: "Discussion", icon: MessagesSquare },
    { key: "visio", label: space.kind === "ecole" ? "Cours en direct" : "Réunions", icon: Video },
    { key: "membres", label: "Membres", icon: Users, count: people.length },
  ];

  const defaultType: Record<Tab, PostType> = { fil: "annonce", cours: "cours", devoirs: "devoir", programme: "programme", discussion: "annonce", visio: "annonce", membres: "annonce" };
  const composer = isResponsable && ["fil", "cours", "devoirs", "programme"].includes(tab) && (
    <PostComposer key={tab} space={space} authorId={user.id} defaultType={defaultType[tab]} onPosted={loadPosts} />
  );

  const feed = (types: PostType[], empty: string) => (
    <PostFeed
      posts={byType(types)}
      people={peopleById}
      canManage={isResponsable}
      currentUserId={user.id}
      empty={empty}
      onChanged={loadPosts}
      footer={(p) =>
        p.type === "devoir" ? (
          <AssignmentPanel
            post={p}
            submissions={submissions.filter((s) => s.post_id === p.id && (isResponsable || s.student_id === user.id))}
            people={peopleById}
            isResponsable={isResponsable}
            userId={user.id}
            onChanged={loadPosts}
          />
        ) : null
      }
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/espace/${space.kind}`} className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-avenida-blue hover:text-vif">
        <ArrowLeft aria-hidden className="size-4" />
        {space.kind === "ecole" ? "Espace École" : "Espace Hôtel"}
      </Link>

      <header className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg sm:p-8" style={{ background: `linear-gradient(120deg, #06152E, ${space.color ?? "#0C356A"})` }}>
        <div aria-hidden className="bg-avenida-pattern absolute inset-0 opacity-10" />
        <p className="relative text-xs font-bold tracking-[0.2em] text-white/70 uppercase">{space.kind === "ecole" ? `Filière ${space.program_code}` : "Service de l'hôtel"}</p>
        <h1 className="relative mt-1 font-display text-3xl font-extrabold sm:text-4xl">{space.name}</h1>
        <p className="relative mt-2 text-sm text-white/80">
          Vous êtes <strong>{isResponsable ? "responsable" : "membre"}</strong> de cette salle · {people.length} participant(s)
        </p>
      </header>

      <nav aria-label="Rubriques de la salle" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn("flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors", tab === t.key ? "bg-vif text-white shadow-lg shadow-vif/25" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-vif")}
          >
            <t.icon aria-hidden className="size-4" />
            {t.label}
            {t.count ? <span className={cn("rounded-full px-1.5 text-[11px]", tab === t.key ? "bg-white/25" : "bg-slate-100")}>{t.count}</span> : null}
          </button>
        ))}
      </nav>

      {composer}

      {tab === "fil" && feed(["annonce", "consigne"], "Aucune annonce pour le moment.")}
      {tab === "cours" && feed(["cours", "document"], space.kind === "ecole" ? "Aucun cours publié pour le moment." : "Aucun document pour le moment.")}
      {tab === "devoirs" && feed(["devoir"], "Aucun devoir pour le moment.")}
      {tab === "programme" && feed(["programme"], "Le programme n'a pas encore été publié.")}
      {tab === "discussion" && (
        <SpaceChat
          space={space}
          userId={user.id}
          people={peopleById}
          isResponsable={isResponsable}
          onJoinLive={(room) => {
            setLiveRoom(room);
            setTab("visio");
          }}
        />
      )}
      {tab === "visio" && <LivePanel space={space} userId={user.id} userName={user.fullName} isResponsable={isResponsable} people={peopleById} joinRoom={liveRoom} onJoin={setLiveRoom} />}
      {tab === "membres" && <Members space={space} people={people} canManage={["directeur_general", "directeur_pedagogique", "responsable_hotel"].includes(user.role)} onChanged={loadPeople} />}
    </div>
  );
}

/** Liste des participants ; la direction peut ajouter ou retirer des membres (personnel, renforts). */
function Members({ space, people, canManage, onChanged }: { space: Space; people: Person[]; canManage: boolean; onChanged: () => void }) {
  const [candidates, setCandidates] = useState<{ id: string; name: string; role: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [asResponsable, setAsResponsable] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!canManage) return;
    const roles = space.kind === "hotel" ? ["personnel", "responsable_hotel", "professeur"] : ["professeur", "personnel"];
    createClient()
      .from("profiles")
      .select("id, first_name, last_name, email, role")
      .in("role", roles)
      .then(({ data }) => setCandidates((data ?? []).map((p) => ({ id: p.id, name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email, role: p.role }))));
  }, [canManage, space.kind]);

  const add = async () => {
    if (!selected) return;
    const { error } = await createClient().from("space_members").upsert({ space_id: space.id, profile_id: selected, role: asResponsable ? "responsable" : "membre" });
    setMessage(error ? "Ajout impossible." : "Membre ajouté.");
    setSelected("");
    onChanged();
  };

  const remove = async (id: string) => {
    await createClient().from("space_members").delete().eq("space_id", space.id).eq("profile_id", id);
    onChanged();
  };

  return (
    <div className="flex flex-col gap-5">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
          <label className="flex min-w-[14rem] flex-1 flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
            Ajouter un membre
            <select value={selected} onChange={(e) => setSelected(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal">
              <option value="">— Choisir —</option>
              {candidates
                .filter((c) => !people.some((p) => p.id === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({roleConfig(c.role).label})
                  </option>
                ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pb-3 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={asResponsable} onChange={(e) => setAsResponsable(e.target.checked)} className="size-4 accent-[#E30613]" />
            Responsable (peut publier et lancer la visio)
          </label>
          <button type="button" onClick={add} disabled={!selected} className="inline-flex items-center gap-2 rounded-full bg-vif px-5 py-2.5 text-sm font-bold text-white hover:bg-vif-fonce disabled:opacity-50">
            <UserPlus aria-hidden className="size-4" /> Ajouter
          </button>
          {message && <p className="w-full text-sm font-semibold text-avenida-blue">{message}</p>}
          {space.kind === "ecole" && (
            <p className="w-full text-xs text-slate-500">Les élèves de la filière et les professeurs affectés à ses classes sont membres automatiquement.</p>
          )}
        </div>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white", roleConfig(p.role).avatarColor)}>
              {p.full_name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold text-slate-800">{p.full_name}</span>
              <span className={cn("text-xs font-semibold", p.space_role === "responsable" ? "text-vif" : "text-slate-500")}>
                {roleConfig(p.role).label}
                {p.space_role === "responsable" ? " · responsable" : ""}
              </span>
            </span>
            {canManage && p.role !== "eleve" && (
              <button type="button" onClick={() => remove(p.id)} aria-label={`Retirer ${p.full_name}`} className="text-slate-400 hover:text-vif">
                <UserMinus aria-hidden className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
