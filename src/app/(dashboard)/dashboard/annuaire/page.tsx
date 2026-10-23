"use client";

import {
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  ScrollText,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PhoneLinks, WriteLink } from "@/components/annuaire/PhoneLinks";
import { REGLEMENT_VERSION } from "@/content/reglement";
import { useAuth } from "@/context/AuthContext";
import { pingNotifications } from "@/lib/notify";
import { ROLE_CONFIG } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Entry = {
  id: string;
  full_name: string;
  function_title: string | null;
  subjects: string | null;
  phones: string | null;
  position: number;
  show_public: boolean;
  proposed_role: string | null;
  role_status: "propose" | "valide" | "refuse";
  role_note: string | null;
  profile_id: string | null;
  employee_id: string | null;
  validated_at: string | null;
};
type Tab = "annuaire" | "roles" | "reglement";

const STAFF_ROLES = [
  "directeur_general",
  "directeur_pedagogique",
  "comptable",
  "ressources_humaines",
  "responsable_hotel",
  "gestionnaire_site",
  "personnel",
  "professeur",
] as const;
const STATUS = {
  propose: {
    label: "En attente du DG",
    tone: "bg-amber-100 text-amber-800",
    icon: Clock,
  },
  valide: {
    label: "Validé",
    tone: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle2,
  },
  refuse: { label: "Refusé", tone: "bg-red-100 text-red-700", icon: X },
};

/** Annuaire de l'établissement, rôles proposés selon les postes (validation du DG) et suivi des signatures du règlement. */
export default function AnnuaireAdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("annuaire");
  const [rows, setRows] = useState<Entry[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from("staff_directory")
      .select("*")
      .order("position")
      .order("full_name");
    setRows((data ?? []) as Entry[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (!user) return null;
  const isDG = user.role === "directeur_general";
  const pending = rows?.filter((r) => r.role_status === "propose").length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#E30613] uppercase">
          <UsersRound aria-hidden className="size-4" /> Administration
        </p>
        <h1 className="text-2xl font-black text-[#0C356A]">
          Annuaire, rôles et règlement
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          L&apos;annuaire (avec téléphones) est consultable par les élèves,
          parents et personnel dans leur espace ; le site public n&apos;affiche
          que les noms, fonctions et matières.
        </p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Rubriques">
        {(
          [
            ["annuaire", `Annuaire (${rows?.length ?? 0})`, UsersRound],
            [
              "roles",
              `Rôles proposés${pending ? ` · ${pending} en attente` : ""}`,
              ShieldCheck,
            ],
            ["reglement", "Règlement : signatures", ScrollText],
          ] as const
        ).map(([k, l, Icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-1",
              tab === k
                ? "bg-[#0C356A] text-white ring-[#0C356A]"
                : "bg-white text-slate-600 ring-slate-200 hover:text-[#E30613]",
            )}
          >
            <Icon aria-hidden className="size-4" /> {l}
          </button>
        ))}
      </nav>
      {!rows ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
      ) : tab === "annuaire" ? (
        <Directory rows={rows} onChange={load} />
      ) : tab === "roles" ? (
        <Roles rows={rows} isDG={isDG} onChange={load} />
      ) : (
        <Signatures />
      )}
    </div>
  );
}

function Directory({
  rows,
  onChange,
}: {
  rows: Entry[];
  onChange: () => void;
}) {
  const [edit, setEdit] = useState<Partial<Entry> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!edit?.full_name?.trim()) return setError("Le nom est obligatoire.");
    setBusy(true);
    const row = {
      full_name: edit.full_name.trim(),
      function_title: edit.function_title?.trim() || null,
      subjects: edit.subjects?.trim() || null,
      phones: edit.phones?.trim() || null,
      position: Number(edit.position ?? 100),
      show_public: edit.show_public ?? true,
      proposed_role: edit.proposed_role || null,
      updated_at: new Date().toISOString(),
    };
    const supabase = createClient();
    const { error: e } = edit.id
      ? await supabase.from("staff_directory").update(row).eq("id", edit.id)
      : await supabase.from("staff_directory").insert(row);
    setBusy(false);
    if (e) return setError(e.message);
    setEdit(null);
    setError("");
    onChange();
  };

  const remove = async (r: Entry) => {
    if (!window.confirm(`Retirer ${r.full_name} de l'annuaire ?`)) return;
    await createClient().from("staff_directory").delete().eq("id", r.id);
    onChange();
  };

  const input =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0C356A]";
  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() =>
          setEdit({
            show_public: true,
            position: 100,
            proposed_role: "professeur",
          })
        }
        className="inline-flex items-center gap-2 self-start rounded-full bg-[#E30613] px-4 py-2 text-sm font-bold text-white"
      >
        <Plus aria-hidden className="size-4" /> Ajouter une personne
      </button>
      {rows.some((r) => !r.employee_id) && (
        <button
          type="button"
          onClick={async () => {
            if (!window.confirm("Créer la fiche RH (matricule, poste, téléphone) de chaque personne de l'annuaire qui n'en a pas ? Contrats, salaires et dates d'embauche resteront à compléter.")) return;
            const { data, error: e } = await createClient().rpc("create_employees_from_directory");
            setError(e ? e.message : "");
            if (!e) window.alert(`${data} fiche(s) RH créée(s). Complétez-les dans « Personnel & professeurs » ; les cartes de travail peuvent maintenant être émises.`);
            onChange();
          }}
          className="inline-flex items-center gap-2 self-start rounded-full bg-[#0C356A] px-4 py-2 text-sm font-bold text-white"
        >
          <UserPlus aria-hidden className="size-4" /> Créer les fiches RH manquantes ({rows.filter((r) => !r.employee_id).length})
        </button>
      )}
      {error && !edit && <p className="text-sm font-semibold text-[#B8000F]">{error}</p>}
      {edit && (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["full_name", "Nom et prénoms"],
              ["function_title", "Fonction (administration)"],
              ["subjects", "Matière(s) enseignée(s)"],
              ["phones", "Téléphone(s) — séparés par /"],
            ] as const
          ).map(([k, l]) => (
            <label
              key={k}
              className="flex flex-col gap-1 text-xs font-bold text-slate-600"
            >
              {l}
              <input
                value={String(edit[k] ?? "")}
                onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
                className={input}
              />
            </label>
          ))}
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            Ordre d&apos;affichage
            <input
              type="number"
              value={edit.position ?? 100}
              onChange={(e) =>
                setEdit({ ...edit, position: Number(e.target.value) })
              }
              className={input}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            Rôle proposé dans la gestion
            <select
              value={edit.proposed_role ?? ""}
              onChange={(e) =>
                setEdit({ ...edit, proposed_role: e.target.value })
              }
              className={input}
            >
              <option value="">Aucun accès</option>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_CONFIG[r].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={edit.show_public ?? true}
              onChange={(e) =>
                setEdit({ ...edit, show_public: e.target.checked })
              }
              className="size-4 accent-[#E30613]"
            />
            Afficher sur le site public (sans téléphone)
          </label>
          {error && (
            <p className="text-sm font-semibold text-[#B8000F] sm:col-span-2">
              {error}
            </p>
          )}
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-[#0C356A] px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : (
                <Check aria-hidden className="size-4" />
              )}{" "}
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setEdit(null)}
              className="rounded-full px-5 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
            <tr>
              <th className="p-3">Nom</th>
              <th className="p-3">Fonction / matière(s)</th>
              <th className="p-3">Téléphone(s)</th>
              <th className="p-3">Site</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-900">{r.full_name}</td>
                <td className="p-3">
                  {r.function_title && (
                    <p className="text-xs font-bold text-[#E30613] uppercase">
                      {r.function_title}
                    </p>
                  )}
                  {r.subjects && <p className="text-slate-600">{r.subjects}</p>}
                </td>
                <td className="p-3">
                  <PhoneLinks phones={r.phones} />
                  <span className="mt-1 block">
                    <WriteLink profileId={r.profile_id} name={r.full_name} />
                  </span>
                </td>
                <td className="p-3 text-xs">
                  {r.show_public ? "Visible" : "Masqué"}
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEdit(r)}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#0C356A] hover:bg-slate-100"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r)}
                      aria-label={`Retirer ${r.full_name}`}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Roles({
  rows,
  isDG,
  onChange,
}: {
  rows: Entry[];
  isDG: boolean;
  onChange: () => void;
}) {
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const list = useMemo(
    () => rows.filter((r) => r.proposed_role || r.role_status !== "propose"),
    [rows],
  );

  const decide = async (r: Entry, ok: boolean) => {
    setBusy(r.id);
    setMsg(null);
    const supabase = createClient();
    const role = roles[r.id] ?? r.proposed_role ?? "";
    let profileId = r.profile_id;
    let created = "";
    const email = emails[r.id]?.trim();
    if (ok && !profileId && email) {
      const parts = r.full_name.split(" ");
      const last =
        parts
          .filter((p) => p === p.toUpperCase() && /[A-Z]/.test(p))
          .join(" ") ||
        parts.at(-1) ||
        r.full_name;
      const first = parts.filter((p) => !last.split(" ").includes(p)).join(" ");
      const res = await fetch("/api/admin/comptes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: first,
          last_name: last,
          role,
          phone: r.phones?.split("/")[0]?.trim(),
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setBusy(null);
        return setMsg({
          ok: false,
          text: j.error ?? "Création du compte impossible",
        });
      }
      created = j.password
        ? ` Identifiants : ${j.email} / ${j.password} (à transmettre, une seule fois).`
        : ` ${j.message}`;
      const { data: p } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();
      profileId = p?.id ?? null;
      if (profileId)
        await supabase
          .from("staff_directory")
          .update({ profile_id: profileId })
          .eq("id", r.id);
    }
    const { error } = await supabase.rpc("decide_staff_role", {
      entry: r.id,
      ok,
      p_role: role || null,
      note: null,
    });
    setBusy(null);
    pingNotifications();
    setMsg(
      error
        ? { ok: false, text: error.message }
        : {
            ok: true,
            text: `${r.full_name} : rôle ${ok ? "validé" : "refusé"}.${created}`,
          },
    );
    onChange();
  };

  const input =
    "rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs";
  return (
    <section className="flex flex-col gap-3">
      <p className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">
        Rôles proposés selon les postes et les matières.{" "}
        {isDG
          ? "Vous pouvez changer le rôle avant de valider. Avec une adresse e-mail, le compte est créé et le rôle appliqué immédiatement. La personne a déjà un compte ? Rattachez-la dans « Comptes, rôles & postes »."
          : "Seul le Directeur général valide ces rôles."}
      </p>
      {msg && (
        <p
          className={cn(
            "rounded-xl p-3 text-sm font-semibold",
            msg.ok
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-[#B8000F]",
          )}
        >
          {msg.text}
        </p>
      )}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[60rem] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
            <tr>
              <th className="p-3">Personne</th>
              <th className="p-3">Rôle proposé</th>
              <th className="p-3">Pourquoi</th>
              <th className="p-3">Statut</th>
              {isDG && <th className="p-3">Compte (e-mail)</th>}
              {isDG && <th className="sticky right-0 bg-slate-50 p-3 text-right">Décision</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((r) => {
              const st = STATUS[r.role_status];
              return (
                <tr key={r.id} className="align-top">
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{r.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {r.function_title ?? r.subjects}
                    </p>
                  </td>
                  <td className="p-3">
                    {isDG && r.role_status !== "valide" ? (
                      <select
                        value={roles[r.id] ?? r.proposed_role ?? ""}
                        onChange={(e) =>
                          setRoles({ ...roles, [r.id]: e.target.value })
                        }
                        className={input}
                      >
                        {STAFF_ROLES.map((x) => (
                          <option key={x} value={x}>
                            {ROLE_CONFIG[x].label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-semibold">
                        {r.proposed_role
                          ? ROLE_CONFIG[
                              r.proposed_role as keyof typeof ROLE_CONFIG
                            ]?.label
                          : "—"}
                      </span>
                    )}
                  </td>
                  <td className="max-w-xs p-3 text-xs text-slate-600">
                    {r.role_note}
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
                        st.tone,
                      )}
                    >
                      <st.icon aria-hidden className="size-3.5" /> {st.label}
                    </span>
                    {r.profile_id && (
                      <p className="mt-1 text-[11px] text-emerald-700">
                        Compte rattaché
                      </p>
                    )}
                  </td>
                  {isDG && (
                    <td className="p-3">
                      {r.profile_id ? (
                        <span className="text-xs text-slate-500">—</span>
                      ) : (
                        <input
                          value={emails[r.id] ?? ""}
                          onChange={(e) =>
                            setEmails({ ...emails, [r.id]: e.target.value })
                          }
                          placeholder="adresse@e-mail (facultatif)"
                          aria-label={`E-mail de ${r.full_name}`}
                          className={cn(input, "w-48")}
                        />
                      )}
                    </td>
                  )}
                  {isDG && (
                    <td className="sticky right-0 bg-white p-3 shadow-[-10px_0_12px_-10px_rgba(15,23,42,0.25)]">
                      {r.role_status !== "valide" && (
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            disabled={busy === r.id}
                            onClick={() => decide(r, true)}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                          >
                            {busy === r.id ? (
                              <Loader2
                                aria-hidden
                                className="size-3.5 animate-spin"
                              />
                            ) : emails[r.id] ? (
                              <UserPlus aria-hidden className="size-3.5" />
                            ) : (
                              <Check aria-hidden className="size-3.5" />
                            )}{" "}
                            Valider
                          </button>
                          {r.role_status !== "refuse" && (
                            <button
                              type="button"
                              disabled={busy === r.id}
                              onClick={() => decide(r, false)}
                              className="rounded-full px-3 py-1.5 text-xs font-bold text-red-600 ring-1 ring-red-200"
                            >
                              Refuser
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Signatures() {
  const [rows, setRows] = useState<
    | {
        id: string;
        name: string;
        cls: string;
        eleve: string | null;
        parent: string | null;
      }[]
    | null
  >(null);
  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("students")
        .select("id, first_name, last_name, class_name")
        .eq("is_archived", false)
        .order("last_name"),
      supabase
        .from("reglement_acceptances")
        .select("student_id, signer_role, signer_name, accepted_at")
        .eq("version", REGLEMENT_VERSION),
    ]).then(([{ data: st }, { data: acc }]) => {
      const sig = (id: string, role: string) => {
        const a = (acc ?? []).find(
          (x) => x.student_id === id && x.signer_role === role,
        );
        return a
          ? `${a.signer_name} · ${new Date(a.accepted_at).toLocaleDateString("fr-FR")}`
          : null;
      };
      setRows(
        (st ?? []).map((s) => ({
          id: s.id,
          name: `${String(s.last_name).toUpperCase()} ${s.first_name}`,
          cls: s.class_name ?? "",
          eleve: sig(s.id, "eleve"),
          parent: sig(s.id, "parent"),
        })),
      );
    });
  }, []);
  if (!rows)
    return <Loader2 aria-label="Chargement" className="size-6 animate-spin" />;
  const cell = (v: string | null) =>
    v ? (
      <span className="text-xs font-semibold text-emerald-700">✓ {v}</span>
    ) : (
      <span className="text-xs font-semibold text-amber-700">En attente</span>
    );
  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-slate-600">
        Chaque élève inscrit et ses parents reçoivent automatiquement le
        règlement (version {REGLEMENT_VERSION}) par e-mail et dans leur espace,
        où ils signent leur engagement.{" "}
        <Link
          href="/reglement"
          target="_blank"
          className="font-bold text-[#0C356A] hover:text-[#E30613]"
        >
          Voir le règlement
        </Link>
      </p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
            <tr>
              <th className="p-3">Élève</th>
              <th className="p-3">Classe</th>
              <th className="p-3">Signature de l&apos;élève</th>
              <th className="p-3">Signature du parent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-3 font-bold">
                  <Link
                    href={`/dashboard/eleves/${r.id}`}
                    className="hover:text-[#E30613]"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className="p-3 text-slate-600">{r.cls}</td>
                <td className="p-3">{cell(r.eleve)}</td>
                <td className="p-3">{cell(r.parent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">
            Aucun élève inscrit.
          </p>
        )}
      </div>
    </section>
  );
}
