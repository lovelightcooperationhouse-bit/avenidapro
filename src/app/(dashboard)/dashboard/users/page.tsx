"use client";

import { CheckCircle2, Copy, KeyRound, Loader2, PlusCircle, Search, ShieldCheck, UserCog, Users, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Position } from "@/lib/onboarding";
import { ROLE_CONFIG, STAFF_ROLES, type RoleType } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: RoleType;
  is_active: boolean | null;
  student_id: string | null;
  employee_id: string | null;
  avatar_url: string | null;
  created_at: string;
};

const ROLES = Object.keys(ROLE_CONFIG) as RoleType[];
const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";

/** Ce que chaque rôle gère et qui instruit ses dossiers : affiché au DG pour attribuer les bons rôles. */
const ROLE_SCOPE: Record<RoleType, string> = {
  directeur_general: "Tout le système : attribue les rôles, valide les dossiers, contenu du site, pilotage et rapports, alertes à tout l'établissement.",
  directeur_pedagogique: "École : admissions, élèves, classes, notes, correspondance et permissions, cartes scolaires, Espace École ; avis sur les dossiers élèves, parents, professeurs.",
  comptable: "Finances : paiements, caisse, dépenses, salaires, économat, rapports financiers ; consulte les dossiers élèves et clients.",
  ressources_humaines: "Personnel : dossiers RH, contrats, salaires, cartes de travail ; avis sur les dossiers du personnel, des professeurs et de la direction.",
  responsable_hotel: "Hôtel : réservations, chambres, clients, économat, Espace Hôtel ; avis sur le personnel de l'hôtel et les clients.",
  personnel: "Opérations de son service (réception, restaurant, cuisine, étages…) et Espace Hôtel ; pas d'accès aux décisions.",
  professeur: "Ses classes : Espace École (cours, devoirs, direct), appel et correspondance, notes de ses élèves.",
  eleve: "Son dossier : cours de sa filière, devoirs, notes, paiements, correspondance, carte scolaire, documents.",
  parent: "Ses enfants : suivi scolaire, paiements, présences, demandes de permission, cartes, documents.",
  client: "Ses séjours et demandes de réservation, ses documents.",
  candidat: "Nouveau membre : complète son profil ; aucun accès tant que le DG n'a pas attribué de rôle.",
};

export default function UsersPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"comptes" | "creer" | "roles" | "postes">("comptes");
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [edits, setEdits] = useState<Record<string, { role: RoleType; active: boolean }>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data }, { data: p }] = await Promise.all([
      supabase.from("profiles").select("id, email, first_name, last_name, phone, role, is_active, student_id, employee_id, avatar_url, created_at").order("created_at", { ascending: false }),
      supabase.from("positions").select("*").order("sort"),
    ]);
    setProfiles((data ?? []) as Profile[]);
    setPositions((p ?? []) as Position[]);
    setEdits({});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (profiles ?? []).filter((p) => (!roleFilter || p.role === roleFilter) && (!s || `${p.first_name} ${p.last_name} ${p.email} ${p.phone}`.toLowerCase().includes(s)));
  }, [profiles, q, roleFilter]);
  const counts = useMemo(() => Object.fromEntries(ROLES.map((r) => [r, (profiles ?? []).filter((p) => p.role === r).length])), [profiles]);

  if (user?.role !== "directeur_general") {
    return <p className="rounded-2xl bg-red-50 p-6 font-semibold text-[#DC2626]">Seul le Directeur général attribue les rôles.</p>;
  }

  const saveRow = async (p: Profile) => {
    const e = edits[p.id];
    if (!e) return;
    if (p.id === user.id && e.role !== "directeur_general") return setMsg({ ok: false, text: "Vous ne pouvez pas retirer votre propre rôle de Directeur général." });
    const { error } = await createClient().rpc("set_user_role", { target: p.id, new_role: e.role, new_student: p.student_id, new_employee: p.employee_id, active: e.active });
    if (error) return setMsg({ ok: false, text: error.message });
    setMsg({ ok: true, text: `${p.first_name ?? p.email} : ${ROLE_CONFIG[e.role].label}${e.active ? "" : " (suspendu)"}.` });
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
          <ShieldCheck aria-hidden className="size-6 text-[#E30613]" /> Comptes, rôles et permissions
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Vous seul attribuez les rôles. Chaque membre ne voit ensuite que les pages de son département. Les nouveaux membres complètent leur profil et
          arrivent dans « Dossiers des membres ».
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {(
          [
            ["comptes", "Comptes", Users],
            ["creer", "Créer un compte", PlusCircle],
            ["roles", "Rôles et permissions", KeyRound],
            ["postes", "Postes", UserCog],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-1", tab === k ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200")}
          >
            <Icon aria-hidden className="size-4" /> {label}
          </button>
        ))}
      </div>

      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={cn("flex items-center gap-2 rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#DC2626]")}>
          {msg.ok ? <CheckCircle2 aria-hidden className="size-4" /> : <XCircle aria-hidden className="size-4" />} {msg.text}
        </p>
      )}

      {tab === "comptes" && (
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap gap-2">
            <span className="relative min-w-[14rem] flex-1">
              <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail, téléphone" aria-label="Rechercher" className={cn(input, "pl-9")} />
            </span>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filtrer par rôle" className="rounded-xl border border-slate-200 bg-white px-3 text-sm">
              <option value="">Tous les rôles ({profiles?.length ?? 0})</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_CONFIG[r].label} ({counts[r] ?? 0})
                </option>
              ))}
            </select>
          </div>
          {profiles === null ? (
            <Loader2 aria-label="Chargement" className="size-6 animate-spin text-[#0C356A]" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500 uppercase">
                    <th className="py-2">Membre</th>
                    <th className="py-2">Rôle</th>
                    <th className="py-2">Accès</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => {
                    const e = edits[p.id] ?? { role: p.role, active: p.is_active !== false };
                    const dirty = edits[p.id] && (e.role !== p.role || e.active !== (p.is_active !== false));
                    return (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="py-2">
                          <span className="flex items-center gap-3">
                            {p.avatar_url?.startsWith("data:") ? (
                              // eslint-disable-next-line @next/next/no-img-element -- photo en data URL
                              <img src={p.avatar_url} alt="" className="h-10 w-8 rounded object-cover" />
                            ) : (
                              <span className="h-10 w-8 rounded bg-slate-100" />
                            )}
                            <span>
                              <span className="block font-bold text-slate-800">
                                {p.first_name} {p.last_name}
                              </span>
                              <span className="text-xs text-slate-500">{p.email}</span>
                            </span>
                          </span>
                        </td>
                        <td className="py-2">
                          <select value={e.role} onChange={(ev) => setEdits({ ...edits, [p.id]: { ...e, role: ev.target.value as RoleType } })} aria-label={`Rôle de ${p.email}`} className={cn(input, "max-w-[14rem]")}>
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_CONFIG[r].label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2">
                          <label className="inline-flex items-center gap-2 text-xs font-bold">
                            <input type="checkbox" checked={e.active} onChange={(ev) => setEdits({ ...edits, [p.id]: { ...e, active: ev.target.checked } })} className="size-4 accent-[#0C356A]" />
                            {e.active ? "Actif" : "Suspendu"}
                          </label>
                        </td>
                        <td className="py-2 text-right">
                          <button type="button" disabled={!dirty} onClick={() => saveRow(p)} className="rounded-full bg-[#E30613] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-30">
                            Enregistrer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "creer" && <CreateAccount positions={positions} onCreated={load} />}

      {tab === "roles" && (
        <section className="grid gap-3 md:grid-cols-2">
          {ROLES.map((r) => {
            const c = ROLE_CONFIG[r];
            return (
              <article key={r} className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-5">
                <p className="flex items-center justify-between gap-2">
                  <span className="text-lg font-black text-[#0C356A]">{c.label}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STAFF_ROLES.includes(r) ? "bg-[#0C356A]/10 text-[#0C356A]" : "bg-slate-100 text-slate-600")}>
                    {STAFF_ROLES.includes(r) ? "Espace de gestion" : "Espace personnel"} · {counts[r] ?? 0} compte(s)
                  </span>
                </p>
                <p className="text-sm text-slate-700">{ROLE_SCOPE[r]}</p>
                {c.allowedPaths.length > 1 && (
                  <p className="text-xs text-slate-500">Pages : {c.allowedPaths.filter((x) => x !== "/dashboard").map((x) => x.replace("/dashboard/", "")).join(", ")}</p>
                )}
                <p className="text-xs font-semibold text-slate-500">Postes : {positions.filter((p) => p.default_role === r).map((p) => p.label).join(", ") || "—"}</p>
              </article>
            );
          })}
        </section>
      )}

      {tab === "postes" && <PositionsEditor positions={positions} onSaved={load} />}
    </div>
  );
}

function CreateAccount({ positions, onCreated }: { positions: Position[]; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", phone: "", role: "personnel" as RoleType, position: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; password?: string; email?: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/admin/comptes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) return setResult({ ok: false, text: j.error ?? "Création impossible" });
    setResult({ ok: true, text: j.message, password: j.password, email: j.email });
    setForm({ ...form, email: "", first_name: "", last_name: "", phone: "" });
    onCreated();
  };

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-600">
        Créez directement les comptes des gestionnaires et du personnel. La personne reçoit un mot de passe provisoire, complète ensuite son profil (photo,
        informations, pièces) et change son mot de passe.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Prénom
          <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Nom
          <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          E-mail
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Téléphone
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Poste (remplit le rôle)
          <select
            value={form.position}
            onChange={(e) => {
              const p = positions.find((x) => x.code === e.target.value);
              setForm({ ...form, position: e.target.value, role: (p?.default_role as RoleType) ?? form.role });
            }}
            className={input}
          >
            <option value="">— Choisir —</option>
            {positions.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label} ({p.department === "hotel" ? "Hôtel" : p.department === "ecole" ? "École" : "Direction"})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Rôle attribué
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as RoleType })} className={input}>
            {ROLES.filter((r) => r !== "candidat").map((r) => (
              <option key={r} value={r}>
                {ROLE_CONFIG[r].label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{ROLE_SCOPE[form.role]}</p>
      <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#E30613] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <PlusCircle aria-hidden className="size-4" />} Créer le compte
      </button>
      {result && (
        <div role="status" className={cn("rounded-2xl p-4 text-sm", result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-[#DC2626]")}>
          <p className="font-semibold">{result.text}</p>
          {result.password && (
            <p className="mt-2 flex flex-wrap items-center gap-2 font-mono">
              {result.email} · <strong>{result.password}</strong>
              <button type="button" onClick={() => navigator.clipboard.writeText(`${result.email} / ${result.password}`)} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-sans text-xs font-bold">
                <Copy aria-hidden className="size-3.5" /> Copier
              </button>
            </p>
          )}
        </div>
      )}
    </form>
  );
}

function PositionsEditor({ positions, onSaved }: { positions: Position[]; onSaved: () => void }) {
  const [form, setForm] = useState({ code: "", label: "", department: "hotel", service: "", default_role: "personnel" });
  const [error, setError] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_") || form.label.trim().toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "_");
    const { error: err } = await createClient().from("positions").upsert({ ...form, code, sort: 200 });
    if (err) return setError(err.message);
    setForm({ ...form, code: "", label: "", service: "" });
    onSaved();
  };

  const remove = async (code: string) => {
    if (!window.confirm("Supprimer ce poste ?")) return;
    const { error: err } = await createClient().from("positions").delete().eq("code", code);
    if (err) setError("Poste utilisé par des dossiers : impossible de le supprimer.");
    onSaved();
  };

  const groups = (["direction", "ecole", "hotel"] as const).map((d) => ({ d, list: positions.filter((p) => p.department === d) }));

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={add} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-5">
        <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Intitulé du poste" aria-label="Intitulé" className={cn(input, "sm:col-span-2")} />
        <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} aria-label="Département" className={input}>
          <option value="direction">Direction</option>
          <option value="ecole">École</option>
          <option value="hotel">Hôtel</option>
        </select>
        <input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="Service" aria-label="Service" className={input} />
        <select value={form.default_role} onChange={(e) => setForm({ ...form, default_role: e.target.value })} aria-label="Rôle par défaut" className={input}>
          {ROLES.filter((r) => r !== "candidat" && r !== "eleve" && r !== "parent" && r !== "client").map((r) => (
            <option key={r} value={r}>
              {ROLE_CONFIG[r].label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-[#0C356A] px-4 py-2 text-sm font-bold text-white sm:col-span-5 sm:justify-self-start">
          Ajouter le poste
        </button>
        {error && <p className="text-sm font-semibold text-[#DC2626] sm:col-span-5">{error}</p>}
      </form>
      <div className="grid gap-4 lg:grid-cols-3">
        {groups.map(({ d, list }) => (
          <section key={d} className="rounded-3xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 font-black text-[#0C356A]">{d === "direction" ? "Direction" : d === "ecole" ? "École" : "Hôtel"}</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {list.map((p) => (
                <li key={p.code} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <span>
                    <span className="block font-bold text-slate-800">{p.label}</span>
                    <span className="text-xs text-slate-500">
                      {p.service} · rôle {ROLE_CONFIG[p.default_role as RoleType]?.label ?? p.default_role}
                    </span>
                  </span>
                  <button type="button" onClick={() => remove(p.code)} aria-label={`Supprimer ${p.label}`} className="text-xs font-bold text-slate-400 hover:text-[#DC2626]">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
