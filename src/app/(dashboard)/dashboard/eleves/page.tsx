"use client";

import { ClipboardCheck, FileText, GraduationCap, IdCard, Loader2, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formations } from "@/content/site";
import { paymentOk } from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFCFA } from "@/lib/utils";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  registration_number: string | null;
  program_code: string | null;
  specialty: string | null;
  class_name: string | null;
  academic_year: string | null;
  status: string | null;
  boarder_status: string | null;
  total_fee: number | null;
  paid_fee: number | null;
  remaining_fee: number | null;
  phone: string | null;
  tutor_name: string | null;
  tutor_phone: string | null;
};
type Att = { student_id: string; status: string };

/** Élèves inscrits, classés par filière puis par classe, avec leur situation réelle (écolage, présences, carte). */
export default function ElevesPage() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [att, setAtt] = useState<Att[]>([]);
  const [cards, setCards] = useState<Record<string, string>>({});
  const [program, setProgram] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const [{ data: s }, { data: a }, { data: c }] = await Promise.all([
      supabase
        .from("students")
        .select("id, first_name, last_name, photo_url, registration_number, program_code, specialty, class_name, academic_year, status, boarder_status, total_fee, paid_fee, remaining_fee, phone, tutor_name, tutor_phone")
        .order("class_name")
        .order("last_name"),
      supabase.from("student_attendance").select("student_id, status").gte("date", since).neq("status", "present"),
      supabase.from("id_cards").select("student_id, card_number").eq("holder_type", "eleve").eq("revoked", false),
    ]);
    setStudents((s ?? []) as Student[]);
    setAtt((a ?? []) as Att[]);
    setCards(Object.fromEntries((c ?? []).map((x) => [x.student_id, x.card_number])));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => Object.fromEntries(formations.map((f) => [f.code, (students ?? []).filter((s) => s.program_code === f.code).length])), [students]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (students ?? []).filter((s) => (!program || s.program_code === program) && (!t || `${s.first_name} ${s.last_name} ${s.registration_number} ${s.class_name} ${s.phone}`.toLowerCase().includes(t)));
  }, [students, program, q]);
  const classes = useMemo(() => {
    const m = new Map<string, Student[]>();
    list.forEach((s) => m.set(s.class_name ?? "Sans classe", [...(m.get(s.class_name ?? "Sans classe") ?? []), s]));
    return [...m.entries()];
  }, [list]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
          <GraduationCap aria-hidden className="size-6 text-[#E30613]" /> Élèves par filière
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Élèves inscrits définitivement (pré-inscription validée), classés par filière et par classe. L&apos;écolage, les présences et la carte sont à jour en temps réel sur
          chaque matricule.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <button type="button" onClick={() => setProgram("")} className={cn("rounded-2xl border bg-white p-4 text-left", !program ? "border-[#0C356A] ring-2 ring-[#0C356A]/15" : "border-slate-200")}>
          <p className="text-xs font-bold text-slate-500">Toutes les filières</p>
          <p className="text-2xl font-black text-[#0C356A]">{students?.length ?? "…"}</p>
        </button>
        {formations.map((f) => (
          <button key={f.code} type="button" onClick={() => setProgram(f.code)} className={cn("rounded-2xl border bg-white p-4 text-left", program === f.code ? "border-[#E30613] ring-2 ring-red-100" : "border-slate-200")}>
            <p className="truncate text-xs font-bold text-slate-500" title={f.name}>
              {f.code} · {f.duration}
            </p>
            <p className="text-2xl font-black text-[#0C356A]">{counts[f.code] ?? 0}</p>
          </button>
        ))}
      </div>

      <span className="relative">
        <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Matricule, nom, classe, téléphone" aria-label="Rechercher un élève" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-[#0C356A]" />
      </span>

      {students === null ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin text-[#0C356A]" />
      ) : classes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Aucun élève inscrit. Validez les pré-inscriptions dans{" "}
          <Link href="/dashboard/admissions" className="font-bold text-[#E30613]">
            Admissions
          </Link>{" "}
          : chaque inscription définitive crée l&apos;élève ici.
        </p>
      ) : (
        classes.map(([cls, rows]) => (
          <section key={cls} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <h2 className="flex items-center justify-between bg-[#0C356A] px-4 py-2.5 text-sm font-bold text-white">
              {cls} <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs">{rows.length} élève(s)</span>
            </h2>
            <ul className="divide-y divide-slate-100">
              {rows.map((s) => {
                const abs = att.filter((a) => a.student_id === s.id);
                const late = !paymentOk({ total_fee: s.total_fee, paid_fee: s.paid_fee, remaining_fee: s.remaining_fee, academic_year: s.academic_year });
                return (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    {s.photo_url && !s.photo_url.includes("default") ? (
                      // eslint-disable-next-line @next/next/no-img-element -- photo d'identité
                      <img src={s.photo_url} alt="" className="h-12 w-10 rounded object-cover" />
                    ) : (
                      <span className="flex h-12 w-10 items-center justify-center rounded bg-slate-100 text-slate-400">
                        <UserRound aria-hidden className="size-5" />
                      </span>
                    )}
                    <span className="min-w-[12rem] flex-1">
                      <span className="block font-bold text-slate-800">
                        {s.last_name} {s.first_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        <span className="font-mono font-bold text-[#E30613]">{s.registration_number}</span> · {s.specialty} · {s.boarder_status === "interne" ? "Interne" : "Externe"}
                        {cards[s.id] ? ` · carte ${cards[s.id]}` : ""}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5 text-xs font-bold">
                      <span className={cn("rounded-full px-2.5 py-1", (s.remaining_fee ?? 0) <= 0 && s.total_fee ? "bg-emerald-100 text-emerald-800" : late ? "bg-red-100 text-[#B8000F]" : "bg-sky-100 text-sky-800")}>
                        {(s.remaining_fee ?? 0) <= 0 && s.total_fee ? "Écolage soldé" : `Reste ${formatFCFA(Number(s.remaining_fee ?? 0))}`}
                      </span>
                      {abs.length > 0 && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                          {abs.filter((a) => a.status === "absent").length} abs. · {abs.filter((a) => a.status === "retard").length} ret. (30 j)
                        </span>
                      )}
                      {s.status !== "actif" && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{s.status}</span>}
                    </span>
                    <span className="flex gap-1">
                      <Link href={`/dashboard/recherche?q=${encodeURIComponent(s.registration_number ?? s.last_name)}`} title="Dossier complet" aria-label="Dossier complet" className="rounded-full p-2 text-[#0C356A] hover:bg-slate-100">
                        <UserRound aria-hidden className="size-4" />
                      </Link>
                      <Link href={`/impression/fiche/${s.id}`} target="_blank" title="Fiche d'inscription" aria-label="Fiche d'inscription" className="rounded-full p-2 text-[#0C356A] hover:bg-slate-100">
                        <FileText aria-hidden className="size-4" />
                      </Link>
                      <Link href={`/impression/cartes?type=eleve&ids=${s.id}`} target="_blank" title="Carte scolaire" aria-label="Carte scolaire" className="rounded-full p-2 text-[#0C356A] hover:bg-slate-100">
                        <IdCard aria-hidden className="size-4" />
                      </Link>
                      <Link href={`/impression/correspondance?ids=${s.id}`} target="_blank" title="Carte de correspondance" aria-label="Carte de correspondance" className="rounded-full p-2 text-[#0C356A] hover:bg-slate-100">
                        <ClipboardCheck aria-hidden className="size-4" />
                      </Link>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
