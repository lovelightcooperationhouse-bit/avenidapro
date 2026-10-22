"use client";

import { Ban, CheckCircle2, Eye, IdCard as IdCardIcon, Loader2, Printer, RefreshCw, Search, Send, Sparkles, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { IdCard } from "@/components/cards/IdCard";
import { useAuth } from "@/context/AuthContext";
import { customerCardData, employeeCardData, issueCard, CARD_REVIEW, loyaltyLevel, studentCardData, type CardRow, type CustomerRow, type EmployeeRow, type StudentRow, STUDENT_CARD_COLS, EMPLOYEE_CARD_COLS } from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { pingNotifications } from "@/lib/notify";

const STUDENT_COLS = STUDENT_CARD_COLS;
const EMPLOYEE_COLS = EMPLOYEE_CARD_COLS;

/** Cartes scolaires et cartes de travail : émission, mise à jour, régénération du QR, révocation et impression par lot. */
function CardsAdmin() {
  const params = useSearchParams();
  const { user } = useAuth();
  const [tab, setTab] = useState<"eleve" | "personnel" | "client">("eleve");
  // Onglet choisi depuis le menu (?type=personnel / client)
  useEffect(() => {
    const t = params.get("type");
    setTab(t === "personnel" || t === "client" ? t : "eleve");
  }, [params]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [newClient, setNewClient] = useState({ first_name: "", last_name: "", phone: "", email: "", nationality: "" });
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [group, setGroup] = useState("tous");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: s }, { data: e }, { data: c }, { data: cu }] = await Promise.all([
      supabase.from("students").select(STUDENT_COLS).eq("is_archived", false).order("last_name"),
      supabase.from("employees").select(EMPLOYEE_COLS).order("last_name"),
      supabase.from("id_cards").select("*"),
      supabase.from("hotel_customers").select("id, first_name, last_name, full_name, phone, email, nationality, total_stays, total_spent, is_vip, loyalty_points").order("last_name"),
    ]);
    setCustomers((cu ?? []) as CustomerRow[]);
    setStudents((s ?? []) as StudentRow[]);
    setEmployees((e ?? []) as EmployeeRow[]);
    setCards((c ?? []) as CardRow[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelected(new Set());
    setGroup("tous");
  }, [tab]);

  const cardOf = (id: string) => cards.find((c) => (tab === "eleve" ? c.student_id : tab === "client" ? c.customer_id : c.employee_id) === id);
  const groups = useMemo(
    () =>
      (tab === "eleve"
        ? [...new Set(students.map((s) => s.class_name ?? "Sans classe"))]
        : tab === "client"
          ? ["Classique", "Argent", "Or"]
          : [...new Set(employees.map((e) => e.department ?? e.sector ?? "Sans département"))]
      ).sort(),
    [tab, students, employees]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (tab === "eleve") {
      return students
        .filter((s) => group === "tous" || (s.class_name ?? "Sans classe") === group)
        .filter((s) => !q || `${s.first_name} ${s.last_name} ${s.registration_number} ${s.student_number}`.toLowerCase().includes(q))
        .map((s) => ({ id: s.id, name: `${s.last_name.toUpperCase()} ${s.first_name}`, sub: s.class_name ?? "—", matricule: s.registration_number ?? "—" }));
    }
    if (tab === "client") {
      return customers
        .filter((c) => group === "tous" || loyaltyLevel(c) === group)
        .filter((c) => !q || `${c.first_name} ${c.last_name} ${c.phone} ${c.email}`.toLowerCase().includes(q))
        .map((c) => ({ id: c.id, name: `${c.last_name.toUpperCase()} ${c.first_name}`, sub: `${loyaltyLevel(c)} · ${c.total_stays ?? 0} séjour(s) · ${c.phone ?? ""}`, matricule: cards.find((x) => x.customer_id === c.id)?.card_number ?? "—" }));
    }
    return employees
      .filter((e) => group === "tous" || (e.department ?? e.sector ?? "Sans département") === group)
      .filter((e) => !q || `${e.first_name} ${e.last_name} ${e.matricule}`.toLowerCase().includes(q))
      .map((e) => ({ id: e.id, name: `${e.last_name.toUpperCase()} ${e.first_name}`, sub: e.role_title ?? e.position ?? "—", matricule: e.matricule ?? "—" }));
  }, [tab, students, employees, customers, cards, group, query]);

  const run = async (ids: string[], regenerate = false) => {
    if (!user || !ids.length) return;
    setBusy(true);
    setMessage("");
    let errors = 0;
    for (const id of ids) {
      const { error } = await issueCard({ type: tab, id }, user.id, regenerate);
      if (error) errors += 1;
    }
    setBusy(false);
    pingNotifications();
    setMessage(errors ? `${ids.length - errors} carte(s) traitée(s), ${errors} erreur(s).` : `${ids.length} carte(s) ${regenerate ? "régénérée(s) (nouveau QR)" : "émise(s) / actualisée(s)"}. Les titulaires et familles sont notifiés.`);
    load();
  };

  const revoke = async (id: string) => {
    const card = cardOf(id);
    if (!card || !window.confirm("Révoquer cette carte ? Le QR code ne sera plus valide.")) return;
    await createClient().from("id_cards").update({ revoked: true }).eq("id", card.id);
    load();
  };

  const review = async (id: string, validate: boolean) => {
    const card = cardOf(id);
    if (!card) return;
    const supabase = createClient();
    let res;
    if (validate) res = await supabase.rpc("validate_card", { card: card.id });
    else {
      const msg = window.prompt("Message joint pour le titulaire (facultatif) :", "Merci de vérifier les informations de votre carte.");
      if (msg === null) return;
      res = await supabase.rpc("request_card_review", { card: card.id, message: msg });
    }
    setMessage(res.error ? res.error.message : validate ? "Carte validée : envoyée dans l'espace du titulaire, avec notification." : "Carte envoyée pour vérification au titulaire.");
    pingNotifications();
    load();
  };

  const print = (ids: string[]) => {
    const withCards = ids.filter((id) => cardOf(id) && !cardOf(id)!.revoked);
    if (!withCards.length) return setMessage("Aucune carte émise dans la sélection : émettez-les d'abord.");
    window.open(`/impression/cartes?type=${tab}&ids=${withCards.join(",")}`, "_blank");
  };

  const previewData = useMemo(() => {
    if (!preview) return null;
    const card = cardOf(preview);
    if (!card) return null;
    if (tab === "eleve") {
      const s = students.find((x) => x.id === preview);
      return s ? studentCardData(s, card) : null;
    }
    if (tab === "client") {
      const cu = customers.find((x) => x.id === preview);
      return cu ? customerCardData(cu, card) : null;
    }
    const e = employees.find((x) => x.id === preview);
    return e ? employeeCardData(e, card) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, cards, students, employees, tab]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#0C356A]">Cartes : élèves, personnel et fidélité</h1>
        <p className="mt-1 text-sm text-slate-600">
          Photo, matricule et QR code de vérification. Le QR affiche en temps réel la validité, la scolarité et l&apos;assiduité. Actualisez une carte après chaque changement de dossier.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "eleve" as const, label: `Élèves (${students.length})` },
          { key: "personnel" as const, label: `Personnel & professeurs (${employees.length})` },
          { key: "client" as const, label: `Clients de l'hôtel · fidélité (${customers.length})` },
        ].map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("rounded-xl px-4 py-2.5 text-sm font-bold ring-1", tab === t.key ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200")}>
            {t.label}
          </button>
        ))}
        <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label={tab === "eleve" ? "Classe" : "Département"} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold">
          <option value="tous">{tab === "eleve" ? "Toutes les classes" : "Tous les départements"}</option>
          {groups.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <label className="relative ml-auto w-full sm:w-64">
          <span className="sr-only">Rechercher</span>
          <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom ou matricule" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm" />
        </label>
      </div>

      {tab === "client" && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newClient.first_name.trim() || !newClient.last_name.trim()) return setMessage("Nom et prénom du client obligatoires.");
            const { data, error } = await createClient()
              .from("hotel_customers")
              .insert({ ...newClient, last_name: newClient.last_name.toUpperCase(), full_name: `${newClient.first_name} ${newClient.last_name.toUpperCase()}` })
              .select("id")
              .single();
            if (error || !data) return setMessage("Création du client impossible : " + (error?.message ?? ""));
            if (user) await issueCard({ type: "client", id: data.id }, user.id);
            setNewClient({ first_name: "", last_name: "", phone: "", email: "", nationality: "" });
            setMessage("Client enregistré, carte de fidélité émise.");
            load();
          }}
          className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-6"
        >
          <p className="text-sm font-bold text-[#0C356A] sm:col-span-6">Nouveau client fidélité</p>
          {(
            [
              ["last_name", "Nom"],
              ["first_name", "Prénom"],
              ["phone", "Téléphone"],
              ["email", "E-mail"],
              ["nationality", "Nationalité"],
            ] as const
          ).map(([k, l]) => (
            <input key={k} value={newClient[k]} onChange={(e) => setNewClient({ ...newClient, [k]: e.target.value })} placeholder={l} aria-label={l} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          ))}
          <button type="submit" className="rounded-lg bg-[#E30613] px-3 py-2 text-sm font-bold text-white">
            Créer + carte
          </button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <span className="text-sm font-bold text-slate-600">{selected.size} sélectionné(s)</span>
        <button type="button" disabled={busy || !selected.size} onClick={() => run([...selected])} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C356A] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
          <Sparkles aria-hidden className="size-4" /> Émettre / actualiser
        </button>
        <button type="button" disabled={busy || !selected.size} onClick={() => print([...selected])} className="inline-flex items-center gap-1.5 rounded-lg bg-[#DC2626] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
          <Printer aria-hidden className="size-4" /> Imprimer la sélection
        </button>
        <button type="button" disabled={busy || !rows.length} onClick={() => run(rows.filter((r) => !cardOf(r.id)).map((r) => r.id))} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40">
          <IdCardIcon aria-hidden className="size-4" /> Émettre toutes les cartes manquantes ({rows.filter((r) => !cardOf(r.id)).length})
        </button>
        {busy && <Loader2 aria-hidden className="size-4 animate-spin text-slate-500" />}
        {message && <p className="w-full text-sm font-semibold text-emerald-700">{message}</p>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  aria-label="Tout sélectionner"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))}
                  className="size-4"
                />
              </th>
              <th className="p-3">{tab === "eleve" ? "Élève" : tab === "client" ? "Client" : "Salarié"}</th>
              <th className="p-3">{tab === "client" ? "N° de carte" : "Matricule"}</th>
              <th className="p-3">Vérification</th>
              <th className="p-3">Carte</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const card = cardOf(r.id);
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      aria-label={`Sélectionner ${r.name}`}
                      checked={selected.has(r.id)}
                      onChange={() =>
                        setSelected((s) => {
                          const n = new Set(s);
                          if (n.has(r.id)) n.delete(r.id);
                          else n.add(r.id);
                          return n;
                        })
                      }
                      className="size-4"
                    />
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.sub}</p>
                  </td>
                  <td className="p-3 font-mono font-bold">{r.matricule}</td>
                  <td className="p-3">
                    {card && !card.revoked ? (
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", CARD_REVIEW[card.review_status ?? "envoyee"]?.tone)} title={card.review_note ?? undefined}>
                        {CARD_REVIEW[card.review_status ?? "envoyee"]?.label}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    {!card ? (
                      <span className="text-xs font-semibold text-slate-400">Non émise</span>
                    ) : card.revoked ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">Révoquée</span>
                    ) : (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#0C356A]">V{card.version} · {new Date(card.issued_at).toLocaleDateString("fr-FR")}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" title={card ? "Actualiser la carte" : "Émettre la carte"} onClick={() => run([r.id])} className="rounded-lg p-2 text-[#0C356A] hover:bg-blue-50">
                        <Sparkles aria-hidden className="size-4" />
                        <span className="sr-only">{card ? "Actualiser" : "Émettre"}</span>
                      </button>
                      {card && (
                        <>
                          <button type="button" title="Envoyer au titulaire pour vérification" onClick={() => review(r.id, false)} className="rounded-lg p-2 text-sky-700 hover:bg-sky-50">
                            <Send aria-hidden className="size-4" />
                            <span className="sr-only">Envoyer pour vérification</span>
                          </button>
                          <button type="button" title="Valider et envoyer la carte" onClick={() => review(r.id, true)} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50">
                            <CheckCircle2 aria-hidden className="size-4" />
                            <span className="sr-only">Valider</span>
                          </button>
                          <button type="button" title="Aperçu" onClick={() => setPreview(r.id)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                            <Eye aria-hidden className="size-4" />
                            <span className="sr-only">Aperçu</span>
                          </button>
                          <button type="button" title="Régénérer le QR code (carte perdue)" onClick={() => run([r.id], true)} className="rounded-lg p-2 text-amber-700 hover:bg-amber-50">
                            <RefreshCw aria-hidden className="size-4" />
                            <span className="sr-only">Régénérer</span>
                          </button>
                          <button type="button" title="Révoquer" onClick={() => revoke(r.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                            <Ban aria-hidden className="size-4" />
                            <span className="sr-only">Révoquer</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Aucune personne pour ce filtre.</p>}
      </div>

      {previewData && (
        <div role="dialog" aria-modal="true" aria-label="Aperçu de la carte" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setPreview(null)}>
          <div className="relative max-h-full overflow-auto rounded-3xl bg-slate-100 p-6" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreview(null)} aria-label="Fermer" className="absolute top-3 right-3 rounded-full p-2 hover:bg-white">
              <X aria-hidden className="size-5" />
            </button>
            <IdCard data={previewData} className="mt-6" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CardsAdminPage() {
  return (
    <Suspense fallback={<Loader2 aria-label="Chargement" className="size-6 animate-spin" />}>
      <CardsAdmin />
    </Suspense>
  );
}
