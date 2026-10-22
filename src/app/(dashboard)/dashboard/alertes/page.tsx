"use client";

import { BellRing, CheckCircle2, Loader2, Mail, MessageSquareText, Search, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_CONFIG, type RoleType } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { pingNotifications } from "@/lib/notify";
import { cn } from "@/lib/utils";

type Audience = "tous" | "role" | "filiere" | "classe" | "personne";
type Priority = "info" | "important" | "urgent";
type Alert = { id: string; audience: Audience; target: string | null; title: string; body: string | null; priority: Priority; by_email: boolean; by_sms: boolean; recipients: number; created_at: string };
type Person = { id: string; first_name: string | null; last_name: string | null; email: string | null; role: string };

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "tous", label: "Tout l'établissement" },
  { value: "role", label: "Un rôle (parents, professeurs…)" },
  { value: "filiere", label: "Une filière (élèves + parents)" },
  { value: "classe", label: "Une classe (élèves + parents)" },
  { value: "personne", label: "Une personne" },
];

const PRIORITIES: { value: Priority; label: string; tone: string }[] = [
  { value: "info", label: "Information", tone: "bg-sky-50 text-sky-800 ring-sky-200" },
  { value: "important", label: "Important", tone: "bg-amber-50 text-amber-800 ring-amber-200" },
  { value: "urgent", label: "Urgent", tone: "bg-red-50 text-[#DC2626] ring-red-200" },
];

const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0C356A] focus:ring-2 focus:ring-[#0C356A]/15";
const roleLabel = (r: string) => ROLE_CONFIG[r as RoleType]?.label ?? r;

/** Alertes et annonces de l'administration vers les espaces, par e-mail et par SMS. */
export default function AlertesPage() {
  const { user } = useAuth();
  const isDG = user?.role === "directeur_general";
  const [audience, setAudience] = useState<Audience>("role");
  const [target, setTarget] = useState("parent");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [priority, setPriority] = useState<Priority>("info");
  const [byEmail, setByEmail] = useState(true);
  const [bySms, setBySms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [history, setHistory] = useState<Alert[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: a }, { data: s }] = await Promise.all([
      supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("students").select("program_code, class_name").eq("status", "actif"),
    ]);
    setHistory((a ?? []) as Alert[]);
    setPrograms([...new Set((s ?? []).map((x) => x.program_code).filter(Boolean) as string[])].sort());
    setClasses([...new Set((s ?? []).map((x) => x.class_name).filter(Boolean) as string[])].sort());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Recherche d'un destinataire par nom ou e-mail
  useEffect(() => {
    if (audience !== "personne" || query.trim().length < 2) {
      setPeople([]);
      return;
    }
    const q = query.trim().replace(/[%,()]/g, " ");
    const id = window.setTimeout(async () => {
      const { data } = await createClient()
        .from("profiles")
        .select("id, first_name, last_name, email, role")
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(8);
      setPeople((data ?? []) as Person[]);
    }, 250);
    return () => window.clearTimeout(id);
  }, [audience, query]);

  const changeAudience = (a: Audience) => {
    setAudience(a);
    setTarget(a === "role" ? "parent" : a === "filiere" ? (programs[0] ?? "") : a === "classe" ? (classes[0] ?? "") : "");
    setQuery("");
  };

  const targetLabel = useMemo(() => {
    if (audience === "tous") return "tout l'établissement";
    if (audience === "role") return `tous les comptes « ${roleLabel(target)} »`;
    if (audience === "filiere") return `élèves et parents de la filière ${target}`;
    if (audience === "classe") return `élèves et parents de la classe ${target}`;
    return target ? query : "—";
  }, [audience, target, query]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!title.trim()) return setMsg({ ok: false, text: "Indiquez un titre." });
    if (audience !== "tous" && !target) return setMsg({ ok: false, text: "Choisissez les destinataires." });
    if (!window.confirm(`Envoyer cette alerte à ${targetLabel} ?`)) return;
    setBusy(true);
    const { data, error } = await createClient().rpc("send_alert", {
      p_audience: audience,
      p_target: audience === "tous" ? null : target,
      p_title: title,
      p_body: body,
      p_link: link,
      p_priority: priority,
      p_email: byEmail,
      p_sms: bySms,
    });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    pingNotifications();
    setMsg({ ok: true, text: `Alerte envoyée à ${data} destinataire(s).` });
    setTitle("");
    setBody("");
    setLink("");
    load();
  };

  const describe = (a: Alert) =>
    a.audience === "tous" ? "Tout l'établissement" : a.audience === "role" ? roleLabel(a.target ?? "") : a.audience === "personne" ? "Une personne" : `${a.audience === "filiere" ? "Filière" : "Classe"} ${a.target}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
          <BellRing aria-hidden className="size-6 text-[#E30613]" />
          Alertes & annonces
        </h1>
        <p className="mt-1 text-sm text-slate-600">Prévenez les élèves, les parents, les professeurs ou le personnel : dans leur espace (cloche), par e-mail et par SMS.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <form onSubmit={send} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-[#0C356A]">Nouvelle alerte</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
              Destinataires
              <select value={audience} onChange={(e) => changeAudience(e.target.value as Audience)} className={field}>
                {AUDIENCES.filter((a) => a.value !== "tous" || isDG).map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>

            {audience === "role" && (
              <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                Rôle
                <select value={target} onChange={(e) => setTarget(e.target.value)} className={field}>
                  {(Object.keys(ROLE_CONFIG) as RoleType[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {(audience === "filiere" || audience === "classe") && (
              <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                {audience === "filiere" ? "Filière" : "Classe"}
                <select value={target} onChange={(e) => setTarget(e.target.value)} className={field}>
                  {(audience === "filiere" ? programs : classes).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}
            {audience === "personne" && (
              <div className="relative flex flex-col gap-1 text-xs font-bold text-slate-600">
                <label htmlFor="alerte-personne">Personne</label>
                <span className="relative">
                  <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="alerte-personne"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setTarget("");
                    }}
                    placeholder="Nom ou e-mail"
                    className={cn(field, "pl-9")}
                  />
                </span>
                {people.length > 0 && !target && (
                  <ul className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {people.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setTarget(p.id);
                            setQuery(`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || (p.email ?? ""));
                          }}
                          className="flex w-full flex-col px-3 py-2 text-left hover:bg-slate-50"
                        >
                          <span className="text-sm font-bold text-slate-800">
                            {p.first_name} {p.last_name}
                          </span>
                          <span className="text-xs font-normal text-slate-500">
                            {roleLabel(p.role)} · {p.email}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-1 text-xs font-bold text-slate-600">Priorité</legend>
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={priority === p.value}
                onClick={() => setPriority(p.value)}
                className={cn("rounded-full px-4 py-1.5 text-xs font-bold ring-1", priority === p.value ? p.tone : "text-slate-500 ring-slate-200 hover:ring-slate-400")}
              >
                {p.label}
              </button>
            ))}
          </fieldset>

          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            Titre
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ex. Réunion des parents samedi à 9 h" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            Message
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={1500} placeholder="Détails, lieu, consignes…" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            Lien à ouvrir (facultatif)
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/espace/ecole" className={field} />
          </label>

          <fieldset className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
            <legend className="sr-only">Canaux d&apos;envoi</legend>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <BellRing aria-hidden className="size-4 text-[#0C356A]" />
              Espace en ligne (toujours)
            </p>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={byEmail} onChange={(e) => setByEmail(e.target.checked)} className="size-4 accent-[#E30613]" />
              <Mail aria-hidden className="size-4 text-[#0C356A]" />
              E-mail
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={bySms} onChange={(e) => setBySms(e.target.checked)} className="size-4 accent-[#E30613]" />
              <MessageSquareText aria-hidden className="size-4 text-[#0C356A]" />
              SMS (au numéro du profil)
            </label>
          </fieldset>

          {msg && (
            <p role={msg.ok ? "status" : "alert"} className={cn("flex items-center gap-2 rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#DC2626]")}>
              {msg.ok && <CheckCircle2 aria-hidden className="size-4" />}
              {msg.text}
            </p>
          )}

          <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E30613] px-6 py-3 text-sm font-bold text-white hover:bg-[#B8000F] disabled:opacity-60">
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
            Envoyer l&apos;alerte
          </button>
        </form>

        <section aria-labelledby="historique" className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6">
          <h2 id="historique" className="text-lg font-black text-[#0C356A]">
            Alertes envoyées
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune alerte envoyée pour le moment.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {history.map((a) => {
                const p = PRIORITIES.find((x) => x.value === a.priority)!;
                return (
                  <li key={a.id} className="flex flex-col gap-1 py-3">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold ring-1", p.tone)}>{p.label}</span>
                      <span className="font-bold text-slate-800">{a.title}</span>
                    </p>
                    {a.body && <p className="line-clamp-2 text-sm text-slate-600">{a.body}</p>}
                    <p className="text-xs text-slate-500">
                      {describe(a)} · {a.recipients} destinataire(s) · espace{a.by_email ? " + e-mail" : ""}
                      {a.by_sms ? " + SMS" : ""} · {new Date(a.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
