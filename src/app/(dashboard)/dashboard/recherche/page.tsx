"use client";

import { FileText, IdCard as IdCardIcon, Loader2, Printer, Search, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { IdCard } from "@/components/cards/IdCard";
import { AttendanceView } from "@/components/espace/AttendanceView";
import { StudentFile } from "@/components/espace/StudentFile";
import { useAuth } from "@/context/AuthContext";
import { employeeCardData, issueCard, studentCardData, type CardRow, type EmployeeRow, type StudentRow, STUDENT_CARD_COLS, EMPLOYEE_CARD_COLS } from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const STUDENT_COLS = STUDENT_CARD_COLS;
const EMPLOYEE_COLS = EMPLOYEE_CARD_COLS;

type Hit = { kind: "eleve"; row: StudentRow & { phone?: string | null } } | { kind: "personnel"; row: EmployeeRow & { phone?: string | null; email?: string | null; contract_type?: string | null; hire_date?: string | null } };

/** Recherche universelle par matricule, nom ou téléphone : fiche 360° de l'élève ou du salarié. */
function SearchPanel() {
  const params = useSearchParams();
  const { user } = useAuth();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [selected, setSelected] = useState<Hit | null>(null);
  const [card, setCard] = useState<CardRow | null>(null);
  const [busy, setBusy] = useState(false);

  const search = useCallback(async (term: string) => {
    const t = term.trim();
    if (t.length < 2) return setHits(null);
    const supabase = createClient();
    const like = `%${t.replace(/[%_,()]/g, " ")}%`;
    const [{ data: s }, { data: e }] = await Promise.all([
      supabase.from("students").select(STUDENT_COLS).or(`registration_number.ilike.${like},student_number.ilike.${like},first_name.ilike.${like},last_name.ilike.${like},phone.ilike.${like}`).limit(20),
      supabase.from("employees").select(EMPLOYEE_COLS).or(`matricule.ilike.${like},first_name.ilike.${like},last_name.ilike.${like},phone.ilike.${like}`).limit(10),
    ]);
    const list: Hit[] = [...(s ?? []).map((row) => ({ kind: "eleve" as const, row: row as StudentRow })), ...(e ?? []).map((row) => ({ kind: "personnel" as const, row: row as EmployeeRow }))];
    setHits(list);
    // Un seul résultat ou matricule exact : ouverture directe
    const exact = list.find((h) => (h.kind === "eleve" ? [h.row.registration_number, h.row.student_number] : [h.row.matricule]).some((m) => m?.toLowerCase() === t.toLowerCase()));
    if (exact || list.length === 1) setSelected(exact ?? list[0]);
  }, []);

  useEffect(() => {
    const initial = params.get("q");
    if (initial) search(initial);
  }, [params, search]);

  const loadCard = useCallback(async (h: Hit | null) => {
    if (!h) return setCard(null);
    const { data } = await createClient()
      .from("id_cards")
      .select("*")
      .eq(h.kind === "eleve" ? "student_id" : "employee_id", h.row.id)
      .maybeSingle<CardRow>();
    setCard(data ?? null);
  }, []);

  useEffect(() => {
    loadCard(selected);
  }, [selected, loadCard]);

  const issue = async (regenerate = false) => {
    if (!selected || !user) return;
    setBusy(true);
    await issueCard({ type: selected.kind, id: selected.row.id }, user.id, regenerate);
    await loadCard(selected);
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#0C356A]">Recherche par matricule</h1>
        <p className="mt-1 text-sm text-slate-600">Matricule, nom, prénom ou téléphone : toutes les informations de l&apos;élève ou du salarié en un écran.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSelected(null);
          search(q);
        }}
        className="flex gap-2"
      >
        <label className="relative flex-1">
          <span className="sr-only">Rechercher</span>
          <Search aria-hidden className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder="Ex. 807AVN-26, CAP26-0001, Kossi, 90 11 22 33…" className="w-full rounded-2xl border border-slate-200 bg-white py-4 pr-4 pl-12 font-mono text-base outline-none focus:border-[#0C356A] focus:ring-2 focus:ring-[#0C356A]/15" />
        </label>
        <button type="submit" className="rounded-2xl bg-[#0C356A] px-6 font-bold text-white hover:bg-[#072042]">
          Rechercher
        </button>
      </form>

      {hits && !selected && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hits.length === 0 && <li className="text-sm text-slate-500">Aucun résultat.</li>}
          {hits.map((h) => (
            <li key={`${h.kind}-${h.row.id}`}>
              <button type="button" onClick={() => setSelected(h)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-[#0C356A]">
                <UserRound aria-hidden className="size-8 shrink-0 text-slate-300" />
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-900">
                    {h.row.last_name.toUpperCase()} {h.row.first_name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {h.kind === "eleve" ? `${h.row.registration_number} · ${h.row.class_name ?? ""}` : `${h.row.matricule ?? "—"} · ${h.row.role_title ?? h.row.position ?? "Personnel"}`}
                  </span>
                </span>
                <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold", h.kind === "eleve" ? "bg-blue-50 text-[#0C356A]" : "bg-amber-50 text-amber-800")}>{h.kind === "eleve" ? "Élève" : "Personnel"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            {hits && hits.length > 1 && (
              <button type="button" onClick={() => setSelected(null)} className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                ← {hits.length} résultats
              </button>
            )}
            {selected.kind === "eleve" && (
              <Link href={`/impression/fiche/${selected.row.id}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-xl bg-[#0C356A] px-3 py-2 text-sm font-bold text-white">
                <FileText aria-hidden className="size-4" /> Fiche d&apos;inscription
              </Link>
            )}
            <button type="button" disabled={busy} onClick={() => issue(false)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#DC2626] px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
              {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Sparkles aria-hidden className="size-4" />}
              {card ? "Actualiser la carte" : "Émettre la carte"}
            </button>
            {card && (
              <Link href={`/impression/cartes?type=${selected.kind}&ids=${selected.row.id}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                <Printer aria-hidden className="size-4" /> Imprimer la carte
              </Link>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
            <div className="flex flex-col gap-6">
              {selected.kind === "eleve" ? (
                <>
                  <StudentFile studentId={selected.row.id} />
                  <AttendanceView studentId={selected.row.id} />
                </>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Fiche du personnel</p>
                  <h2 className="text-2xl font-black text-[#0C356A]">
                    {selected.row.last_name.toUpperCase()} {selected.row.first_name}
                  </h2>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    {[
                      ["Matricule", selected.row.matricule],
                      ["Poste", selected.row.role_title ?? selected.row.position],
                      ["Département", selected.row.department ?? selected.row.sector],
                      ["Statut", selected.row.status],
                      ["Contrat", selected.row.contract_type],
                      ["Embauche", selected.row.hire_date ? new Date(selected.row.hire_date).toLocaleDateString("fr-FR") : null],
                      ["Téléphone", selected.row.phone],
                      ["E-mail", selected.row.email],
                    ].map(([k, val]) => (
                      <div key={k as string}>
                        <dt className="text-xs font-bold text-slate-500">{k}</dt>
                        <dd className="font-semibold text-slate-800">{val ?? "—"}</dd>
                      </div>
                    ))}
                  </dl>
                  <Link href="/dashboard/employees" className="mt-4 inline-block text-sm font-bold text-[#DC2626] hover:underline">
                    Ouvrir le dossier RH complet (CV, contrat, documents) →
                  </Link>
                </div>
              )}
            </div>
            <aside className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm font-black text-[#0C356A]">
                <IdCardIcon aria-hidden className="size-4" /> Carte
              </p>
              {card && !card.revoked ? (
                <IdCard data={selected.kind === "eleve" ? studentCardData(selected.row, card) : employeeCardData(selected.row, card)} side="front" />
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">{card?.revoked ? "Carte révoquée." : "Aucune carte émise."}</p>
              )}
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Loader2 aria-label="Chargement" className="size-6 animate-spin" />}>
      <SearchPanel />
    </Suspense>
  );
}
