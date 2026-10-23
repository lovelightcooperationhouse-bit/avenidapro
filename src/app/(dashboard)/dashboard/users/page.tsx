"use client";

import { Check, CheckCircle2, Copy, KeyRound, Link2, Loader2, PlusCircle, Search, ShieldCheck, UserCog, UserPlus, Users, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { modulesFor } from "@/components/layout/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Position } from "@/lib/onboarding";
import { ROLE_CONFIG, ROLE_SCOPE, STAFF_ROLES, type RoleType } from "@/lib/roles";
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

/** Membre de l'annuaire (personnel, professeurs, administration) auquel un compte peut être rattaché. */
type Member = { id: string; full_name: string; function_title: string | null; subjects: string | null; phones: string | null; proposed_role: string | null; profile_id: string | null };

const ROLES = Object.keys(ROLE_CONFIG) as RoleType[];
const WORK_ROLES = ROLES.filter((r) => !["candidat", "eleve", "parent", "client"].includes(r));
const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";

/** Rattache un compte à un membre de l'annuaire : nom, téléphone, fiche RH et rôle validé en une fois. */
const linkMember = (target: string, entry: string, role: RoleType) => createClient().rpc("link_staff_account", { target, entry, p_role: role });

export default function UsersPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"comptes" | "creer" | "roles" | "postes">("comptes");
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [edits, setEdits] = useState<Record<string, { role: RoleType; active: boolean; member: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data }, { data: p }, { data: m }] = await Promise.all([
      supabase.from("profiles").select("id, email, first_name, last_name, phone, role, is_active, student_id, employee_id, avatar_url, created_at").order("created_at", { ascending: false }),
      supabase.from("positions").select("*").order("sort"),
      supabase.from("staff_directory").select("id, full_name, function_title, subjects, phones, proposed_role, profile_id").order("position"),
    ]);
    setProfiles((data ?? []) as Profile[]);
    setPositions((p ?? []) as Position[]);
    setMembers((m ?? []) as Member[]);
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
  const memberOf = useMemo(() => new Map(members.filter((m) => m.profile_id).map((m) => [m.profile_id!, m])), [members]);
  const withoutAccount = members.filter((m) => !m.profile_id);

  if (user?.role !== "directeur_general") {
    return <p className="rounded-2xl bg-red-50 p-6 font-semibold text-[#DC2626]">Seul le Directeur général attribue les rôles.</p>;
  }

  const saveRow = async (p: Profile) => {
    const e = edits[p.id];
    if (!e) return;
    if (p.id === user.id && e.role !== "directeur_general") return setMsg({ ok: false, text: "Vous ne pouvez pas retirer votre propre rôle de Directeur général." });
    setBusy(p.id);
    const linked = memberOf.get(p.id)?.id ?? "";
    const { error } =
      e.member && e.member !== linked
        ? await linkMember(p.id, e.member, e.role)
        : await createClient().rpc("set_user_role", { target: p.id, new_role: e.role, new_student: p.student_id, new_employee: p.employee_id, active: e.active });
    // Rattachement fait : la suspension éventuelle s'applique ensuite
    if (!error && e.member && e.member !== linked && !e.active) await createClient().rpc("set_user_role", { target: p.id, new_role: e.role, new_student: p.student_id, new_employee: p.employee_id, active: false });
    setBusy(null);
    if (error) return setMsg({ ok: false, text: error.message });
    const m = members.find((x) => x.id === e.member);
    setMsg({ ok: true, text: `Enregistré : ${m?.full_name ?? `${p.first_name ?? ""} ${p.last_name ?? p.email}`} · ${ROLE_CONFIG[e.role].label}${e.active ? "" : " (suspendu)"}. La personne est prévenue.` });
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
          <ShieldCheck aria-hidden className="size-6 text-[#E30613]" /> Comptes, rôles et permissions
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Vous seul attribuez les rôles. Chaque membre ne voit ensuite que les pages de son rôle, et ses actions finales vous sont soumises dans « Validations du DG ».
        </p>
      </div>

      <ol className="grid gap-2 text-sm sm:grid-cols-3">
        {[
          ["1. La personne a un compte", "Elle le crée sur le site (« Connexion » → « Créer mon compte ») ou vous le créez dans « Créer un compte »."],
          ["2. Vous choisissez son rôle", "Dans « Comptes » : choisissez le membre de l'annuaire et le rôle, cochez « Actif », puis « Enregistrer »."],
          ["3. Elle travaille", "Elle se reconnecte : son espace de gestion s'ouvre. Elle est prévenue par notification."],
        ].map(([t, d]) => (
          <li key={t} className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="font-bold text-[#0C356A]">{t}</p>
            <p className="text-xs text-slate-600">{d}</p>
          </li>
        ))}
      </ol>

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
          {msg.ok ? <CheckCircle2 aria-hidden className="size-4 shrink-0" /> : <XCircle aria-hidden className="size-4 shrink-0" />} {msg.text}
        </p>
      )}

      {tab === "comptes" && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="relative min-w-[14rem] flex-1">
              <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail, téléphone" aria-label="Rechercher" className={cn(input, "pl-9")} />
            </span>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filtrer par rôle" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
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
            <div className="grid gap-3 lg:grid-cols-2">
              {list.map((p) => {
                const linked = memberOf.get(p.id);
                const e = edits[p.id] ?? { role: p.role, active: p.is_active !== false, member: linked?.id ?? "" };
                const set = (patch: Partial<typeof e>) => setEdits({ ...edits, [p.id]: { ...e, ...patch } });
                const dirty = !!edits[p.id] && (e.role !== p.role || e.active !== (p.is_active !== false) || e.member !== (linked?.id ?? ""));
                const choices = members.filter((m) => !m.profile_id || m.profile_id === p.id);
                return (
                  <article key={p.id} className={cn("flex flex-col gap-3 rounded-3xl border bg-white p-4", dirty ? "border-[#E30613]" : "border-slate-200")}>
                    <div className="flex items-center gap-3">
                      {p.avatar_url?.startsWith("data:") ? (
                        // eslint-disable-next-line @next/next/no-img-element -- photo en data URL
                        <img src={p.avatar_url} alt="" className="h-12 w-10 rounded object-cover" />
                      ) : (
                        <span className="flex h-12 w-10 items-center justify-center rounded bg-slate-100 text-sm font-black text-slate-400">{(p.first_name ?? p.email ?? "?")[0]}</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">{linked?.full_name ?? `${p.first_name ?? ""} ${p.last_name ?? ""}`}</p>
                        <p className="truncate text-xs text-slate-500">
                          {p.email}
                          {linked?.function_title ? ` · ${linked.function_title}` : ""}
                        </p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", p.is_active === false ? "bg-red-50 text-[#DC2626]" : "bg-[#0C356A]/10 text-[#0C356A]")}>
                        {p.is_active === false ? "Suspendu" : ROLE_CONFIG[p.role]?.label}
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                        Rôle
                        <select value={e.role} onChange={(ev) => set({ role: ev.target.value as RoleType })} aria-label={`Rôle de ${p.email}`} className={input}>
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_CONFIG[r].label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {(STAFF_ROLES.includes(e.role) || e.role === "professeur" || linked) && (
                        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                          Membre de l&apos;annuaire
                          <select
                            value={e.member}
                            onChange={(ev) => {
                              const m = members.find((x) => x.id === ev.target.value);
                              set({ member: ev.target.value, ...(m?.proposed_role && !linked ? { role: m.proposed_role as RoleType } : {}) });
                            }}
                            aria-label={`Membre de l'annuaire pour ${p.email}`}
                            className={input}
                          >
                            <option value="">— Aucun —</option>
                            {choices.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.full_name} · {m.function_title ?? "Professeur"}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-bold">
                        <input type="checkbox" checked={e.active} onChange={(ev) => set({ active: ev.target.checked })} className="size-5 accent-[#0C356A]" />
                        {e.active ? "Actif : peut travailler" : "Suspendu : aucun accès"}
                      </label>
                      <button
                        type="button"
                        disabled={!dirty || busy === p.id}
                        onClick={() => saveRow(p)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2 text-sm font-bold text-white disabled:bg-slate-300"
                      >
                        {busy === p.id ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Check aria-hidden className="size-4" />} Enregistrer
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {withoutAccount.length > 0 && (
            <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              <strong>{withoutAccount.length} membre(s) de l&apos;annuaire n&apos;ont pas encore de compte</strong> ({withoutAccount.slice(0, 4).map((m) => m.full_name).join(", ")}
              {withoutAccount.length > 4 ? "…" : ""}). Ouvrez « Créer un compte », choisissez le membre : son nom, son téléphone et son rôle se remplissent.
              <button type="button" onClick={() => setTab("creer")} className="ml-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-300">
                <UserPlus aria-hidden className="size-3.5" /> Créer un compte
              </button>
            </p>
          )}
        </section>
      )}

      {tab === "creer" && <CreateAccount positions={positions} members={withoutAccount} onCreated={load} />}

      {tab === "roles" && <RolesPermissions profiles={profiles ?? []} positions={positions} onChanged={load} />}

      {tab === "postes" && <PositionsEditor positions={positions} onSaved={load} />}
    </div>
  );
}

/**
 * Ce que chaque rôle permet (pages cochées) et qui l'a. Les pages d'un rôle sont fixées pour protéger les données :
 * on donne un accès à quelqu'un en lui attribuant le rôle (sélectionner le membre puis « Attribuer »).
 */
function RolesPermissions({ profiles, positions, onChanged }: { profiles: Profile[]; positions: Position[]; onChanged: () => void }) {
  const [pick, setPick] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const assign = async (role: RoleType, active = true, id = pick[role]) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    setBusy(role);
    const { error } = await createClient().rpc("set_user_role", { target: p.id, new_role: role, new_student: p.student_id, new_employee: p.employee_id, active });
    setBusy(null);
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: `${p.first_name ?? ""} ${p.last_name ?? p.email} : ${ROLE_CONFIG[role].label}${active ? "" : " (suspendu)"}.` });
    setPick({ ...pick, [role]: "" });
    onChanged();
  };

  return (
    <section className="flex flex-col gap-3">
      <p className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">
        Les cases cochées montrent ce que chaque rôle peut ouvrir. Pour autoriser quelqu&apos;un, choisissez-le sous le rôle puis « Attribuer » : il reçoit ces accès et
        est prévenu. Les décisions finales (inscriptions, envoi des bulletins et des cartes…) restent soumises à votre validation.
      </p>
      {msg && <p className={cn("rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#DC2626]")}>{msg.text}</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {WORK_ROLES.map((r) => {
          const c = ROLE_CONFIG[r];
          const who = profiles.filter((p) => p.role === r);
          const others = profiles.filter((p) => p.role !== r && p.role !== "directeur_general");
          const mods = modulesFor(r);
          return (
            <article key={r} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5">
              <p className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-lg font-black text-[#0C356A]">{c.label}</span>
                <span className="rounded-full bg-[#0C356A]/10 px-2 py-0.5 text-[11px] font-bold text-[#0C356A]">{who.length} compte(s)</span>
              </p>
              <p className="text-sm text-slate-700">{ROLE_SCOPE[r]}</p>
              <details className="rounded-2xl bg-slate-50 p-3 text-xs">
                <summary className="cursor-pointer font-bold text-slate-700">Pages autorisées ({mods.reduce((n, m) => n + m.sections.reduce((k, s) => k + s.items.length, 0), 0)})</summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {mods.map((m) => (
                    <div key={m.key}>
                      <p className="font-bold text-[#0C356A]">{m.label}</p>
                      <ul>
                        {m.sections.flatMap((s) => s.items).map((i) => (
                          <li key={i.href} className="flex items-center gap-1 text-slate-600">
                            <Check aria-hidden className="size-3 shrink-0 text-emerald-600" /> {i.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
              <ul className="flex flex-col gap-1 text-sm">
                {who.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 border-b border-slate-100 py-1">
                    <span className="min-w-0 truncate">
                      <strong>
                        {p.first_name} {p.last_name}
                      </strong>{" "}
                      <span className="text-xs text-slate-500">{p.email}</span>
                    </span>
                    {r !== "directeur_general" && (
                      <label className="inline-flex shrink-0 items-center gap-1 text-xs font-bold">
                        <input type="checkbox" checked={p.is_active !== false} disabled={busy === r} onChange={(ev) => assign(r, ev.target.checked, p.id)} className="size-4 accent-[#0C356A]" />
                        Actif
                      </label>
                    )}
                  </li>
                ))}
                {!who.length && <li className="text-xs text-slate-500">Personne n&apos;a encore ce rôle.</li>}
              </ul>
              {r !== "directeur_general" && (
                <div className="flex flex-wrap gap-2">
                  <select value={pick[r] ?? ""} onChange={(e) => setPick({ ...pick, [r]: e.target.value })} aria-label={`Membre à qui attribuer le rôle ${c.label}`} className={cn(input, "min-w-0 flex-1")}>
                    <option value="">Choisir un membre…</option>
                    {others.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} ({ROLE_CONFIG[p.role]?.label})
                      </option>
                    ))}
                  </select>
                  <button type="button" disabled={!pick[r] || busy === r} onClick={() => assign(r)} className="rounded-full bg-[#E30613] px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300">
                    Attribuer
                  </button>
                </div>
              )}
              <p className="text-xs font-semibold text-slate-500">Postes : {positions.filter((p) => p.default_role === r).map((p) => p.label).join(", ") || "—"}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CreateAccount({ positions, members, onCreated }: { positions: Position[]; members: Member[]; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", phone: "", role: "personnel" as RoleType, position: "", member: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; password?: string; email?: string } | null>(null);

  /** Choisir un membre de l'annuaire remplit le nom, le téléphone et le rôle proposé. */
  const pickMember = (id: string) => {
    const m = members.find((x) => x.id === id);
    if (!m) return setForm({ ...form, member: "" });
    const parts = m.full_name.trim().split(/\s+/);
    const isLast = (w: string) => w === w.toUpperCase() && /[A-ZÀ-Ý]{2}/.test(w);
    setForm({
      ...form,
      member: id,
      first_name: parts.filter((w) => !isLast(w)).join(" "),
      last_name: parts.filter(isLast).join(" ") || m.full_name,
      phone: m.phones?.split("/")[0]?.trim() ?? "",
      role: (m.proposed_role as RoleType) ?? form.role,
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const { member, ...body } = form;
    const res = await fetch("/api/admin/comptes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json();
    if (!res.ok) {
      setBusy(false);
      return setResult({ ok: false, text: j.error ?? "Création impossible" });
    }
    // Compte créé : rattaché au membre de l'annuaire (fiche RH, rôle validé)
    const linkErr = member && j.id ? (await linkMember(j.id, member, form.role)).error : null;
    setBusy(false);
    setResult({ ok: true, text: `${j.message}${linkErr ? ` (Rattachement à l'annuaire impossible : ${linkErr.message})` : ""}`, password: j.password, email: j.email });
    setForm({ ...form, email: "", first_name: "", last_name: "", phone: "", member: "" });
    onCreated();
  };

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-600">
        Créez directement les comptes des gestionnaires et du personnel. La personne reçoit un mot de passe provisoire, se connecte sur « Connexion », complète son
        profil et change son mot de passe.
      </p>
      {members.length > 0 && (
        <label className="flex flex-col gap-1 rounded-2xl bg-sky-50 p-3 text-xs font-bold text-sky-900">
          <span className="flex items-center gap-1">
            <Link2 aria-hidden className="size-3.5" /> Membre de l&apos;annuaire (remplit le nom, le téléphone et le rôle)
          </span>
          <select value={form.member} onChange={(e) => pickMember(e.target.value)} className={input}>
            <option value="">— Personne hors annuaire —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} · {m.function_title ?? `Professeur${m.subjects ? ` (${m.subjects})` : ""}`}
              </option>
            ))}
          </select>
        </label>
      )}
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
