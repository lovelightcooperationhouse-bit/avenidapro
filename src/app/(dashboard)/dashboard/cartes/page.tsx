"use client";

import { Ban, Eye, IdCard as IdCardIcon, Loader2, Printer, RefreshCw, Search, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IdCard } from "@/components/cards/IdCard";
import { useAuth } from "@/context/AuthContext";
import { employeeCardData, issueCard, paymentOk, studentCardData, type CardRow, type EmployeeRow, type StudentRow } from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { pingNotifications } from "@/lib/notify";

const STUDENT_COLS = "id, first_name, last_name, photo_url, registration_number, student_number, class_name, program_code, academic_year, status, total_fee, paid_fee, remaining_fee";
const EMPLOYEE_COLS = "id, first_name, last_name, photo_url, matricule, role_title, position, department, sector, status";

/** Cartes scolaires et cartes de travail : émission, mise à jour, régénération du QR, révocation et impression par lot. */
export default function CardsAdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"eleve" | "personnel">("eleve");
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
    const [{ data: s }, { data: e }, { data: c }] = await Promise.all([
      supabase.from("students").select(STUDENT_COLS).eq("is_archived", false).order("last_name"),
      supabase.from("employees").select(EMPLOYEE_COLS).order("last_name"),
      supabase.from("id_cards").select("*"),
    ]);
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

  const cardOf = (id: string) => cards.find((c) => (tab === "eleve" ? c.student_id : c.employee_id) === id);
  const groups = useMemo(
    () => (tab === "eleve" ? [...new Set(students.map((s) => s.class_name ?? "Sans classe"))] : [...new Set(employees.map((e) => e.department ?? e.sector ?? "Sans département"))]).sort(),
    [tab, students, employees]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (tab === "eleve") {
      return students
        .filter((s) => group === "tous" || (s.class_name ?? "Sans classe") === group)
        .filter((s) => !q || `${s.first_name} ${s.last_name} ${s.registration_number} ${s.student_number}`.toLowerCase().includes(q))
        .map((s) => ({ id: s.id, name: `${s.last_name.toUpperCase()} ${s.first_name}`, sub: s.class_name ?? "—", matricule: s.registration_number ?? "—", ok: paymentOk(s) }));
    }
    return employees
      .filter((e) => group === "tous" || (e.department ?? e.sector ?? "Sans département") === group)
      .filter((e) => !q || `${e.first_name} ${e.last_name} ${e.matricule}`.toLowerCase().includes(q))
      .map((e) => ({ id: e.id, name: `${e.last_name.toUpperCase()} ${e.first_name}`, sub: e.role_title ?? e.position ?? "—", matricule: e.matricule ?? "—", ok: undefined as boolean | undefined }));
  }, [tab, students, employees, group, query]);

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
    const e = employees.find((x) => x.id === preview);
    return e ? employeeCardData(e, card) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, cards, students, employees, tab]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#0C356A]">Cartes scolaires & cartes de travail</h1>
        <p className="mt-1 text-sm text-slate-600">
          Photo, matricule et QR code de vérification. Le QR affiche en temps réel la validité, la scolarité et l&apos;assiduité. Actualisez une carte après chaque changement de dossier.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "eleve" as const, label: `Élèves (${students.length})` },
          { key: "personnel" as const, label: `Personnel & professeurs (${employees.length})` },
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
              <th className="p-3">{tab === "eleve" ? "Élève" : "Salarié"}</th>
              <th className="p-3">Matricule</th>
              {tab === "eleve" && <th className="p-3">Scolarité</th>}
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
                  {tab === "eleve" && (
                    <td className="p-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", r.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{r.ok ? "À jour" : "En attente"}</span>
                    </td>
                  )}
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
