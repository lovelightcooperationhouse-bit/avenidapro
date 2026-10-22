"use client";

import { CheckCircle2, FileSpreadsheet, Loader2, Printer, Save, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSchoolYear } from "@/context/SchoolYearContext";
import { TERMS, generalAverage, mention, ranks, round2, subjectLines, termRange, type BulletinStudent, type GradeRow } from "@/lib/bulletins";
import { pingNotifications } from "@/lib/notify";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const SUBJECTS = ["Cuisine (pratique)", "Technologie culinaire", "Pâtisserie", "Service et commercialisation", "Hébergement", "Réception", "Hygiène et sécurité", "Gestion", "Français", "Anglais", "Mathématiques", "Droit et législation", "Environnement économique", "Éducation civique"];
const TYPES = ["Devoir", "Interrogation", "Composition", "Travaux pratiques", "Oral"];
const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0C356A]";
const yearLabel = (v: string) => v.replace("-", " - ");

type Card = { id: string; student_id: string; student_name: string | null; general_average: number | null; rank_display: string | null; published: boolean; bulletin_number: string | null };

export default function NotesPage() {
  const { selectedYear } = useSchoolYear();
  const year = yearLabel(selectedYear);
  const [tab, setTab] = useState<"saisie" | "bulletins">("saisie");
  const [classes, setClasses] = useState<string[]>([]);
  const [cls, setCls] = useState("");
  const [term, setTerm] = useState(1);

  useEffect(() => {
    createClient()
      .from("students")
      .select("class_name")
      .eq("status", "actif")
      .then(({ data }) => {
        const list = [...new Set((data ?? []).map((d) => d.class_name).filter(Boolean) as string[])].sort();
        setClasses(list);
        setCls((c) => c || list[0] || "");
      });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
          <FileSpreadsheet aria-hidden className="size-6 text-[#E30613]" /> Notes et bulletins
        </h1>
        <p className="mt-1 text-sm text-slate-600">Saisissez les évaluations par classe et par matière ; les bulletins se calculent automatiquement (moyennes, coefficients, rang, assiduité) avec un QR code de vérification.</p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(["saisie", "bulletins"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-lg px-4 py-2 text-sm font-bold", tab === t ? "bg-white text-[#0C356A] shadow-sm" : "text-slate-500 hover:text-[#E30613]")}>
              {t === "saisie" ? "Saisie des notes" : "Bulletins"}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Classe
          <select value={cls} onChange={(e) => setCls(e.target.value)} className={input}>
            {classes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Trimestre
          <select value={term} onChange={(e) => setTerm(Number(e.target.value))} className={input}>
            {[1, 2, 3].map((t) => (
              <option key={t} value={t}>
                {TERMS[t]}
              </option>
            ))}
          </select>
        </label>
        <p className="pb-2 text-sm font-semibold text-slate-600">Année {year}</p>
      </div>

      {!cls ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Aucune classe : les élèves inscrits définitivement apparaissent ici.</p>
      ) : tab === "saisie" ? (
        <Entry key={`${cls}-${term}-${year}`} cls={cls} term={term} year={year} />
      ) : (
        <Bulletins key={`${cls}-${term}-${year}`} cls={cls} term={term} year={year} />
      )}
    </div>
  );
}

function Entry({ cls, term, year }: { cls: string; term: number; year: string }) {
  const { user } = useAuth();
  const [students, setStudents] = useState<BulletinStudent[]>([]);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [form, setForm] = useState({ subject: SUBJECTS[0], type: TYPES[0], coefficient: "2", date: new Date().toISOString().slice(0, 10) });
  const [scores, setScores] = useState<Record<string, { score: string; appreciation: string }>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: s } = await supabase.from("students").select("id, first_name, last_name, registration_number, student_number, class_name, program_code, gender, birth_date, birth_place, nationality, photo_url").eq("class_name", cls).eq("status", "actif").order("last_name");
    const list = (s ?? []) as BulletinStudent[];
    setStudents(list);
    if (!list.length) return setGrades([]);
    const { data: g } = await supabase.from("grades").select("student_id, subject, score, coefficient, evaluation_type, appreciation, teacher_name").in("student_id", list.map((x) => x.id)).eq("term", term).eq("academic_year", year);
    setGrades((g ?? []) as GradeRow[]);
  }, [cls, term, year]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const rows = students
      .filter((s) => scores[s.id]?.score.trim())
      .map((s) => ({
        student_id: s.id,
        student_name: `${s.last_name} ${s.first_name}`,
        student_matricule: s.registration_number,
        class_name: cls,
        subject: form.subject,
        evaluation_type: form.type,
        coefficient: Number(form.coefficient) || 1,
        score: Math.min(20, Math.max(0, Number(scores[s.id].score.replace(",", ".")))),
        appreciation: scores[s.id].appreciation.trim() || null,
        date: form.date,
        teacher_name: user?.fullName ?? null,
        term,
        academic_year: year,
      }));
    if (!rows.length) return setMsg("Saisissez au moins une note.");
    if (rows.some((r) => Number.isNaN(r.score))) return setMsg("Une note n'est pas un nombre valide.");
    setBusy(true);
    const { error } = await createClient().from("grades").insert(rows);
    setBusy(false);
    if (error) return setMsg("Enregistrement impossible : " + error.message);
    setMsg(`${rows.length} note(s) enregistrée(s) en ${form.subject} (${form.type}).`);
    setScores({});
    load();
  };

  const summary = useMemo(() => {
    const m = new Map<string, number>();
    grades.forEach((g) => g.subject && m.set(`${g.subject} · ${g.evaluation_type ?? ""}`, (m.get(`${g.subject} · ${g.evaluation_type ?? ""}`) ?? 0) + 1));
    return [...m.entries()];
  }, [grades]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600 sm:col-span-2">
            Matière
            <input list="matieres" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={input} />
            <datalist id="matieres">
              {SUBJECTS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            Évaluation
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={input}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            Coefficient de la matière
            <input type="number" min={1} max={10} value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: e.target.value })} className={input} />
          </label>
        </div>
        {students.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun élève actif dans cette classe.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-2">Élève</th>
                  <th className="px-3 py-2">Note /20</th>
                  <th className="px-3 py-2">Appréciation (facultatif)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <span className="block font-bold text-slate-800">
                        {s.last_name} {s.first_name}
                      </span>
                      <span className="font-mono text-xs text-[#E30613]">{s.registration_number}</span>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        inputMode="decimal"
                        value={scores[s.id]?.score ?? ""}
                        onChange={(e) => setScores({ ...scores, [s.id]: { score: e.target.value, appreciation: scores[s.id]?.appreciation ?? "" } })}
                        aria-label={`Note de ${s.first_name}`}
                        placeholder="—"
                        className={cn(input, "w-20 text-center font-bold")}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={scores[s.id]?.appreciation ?? ""}
                        onChange={(e) => setScores({ ...scores, [s.id]: { score: scores[s.id]?.score ?? "", appreciation: e.target.value } })}
                        aria-label={`Appréciation de ${s.first_name}`}
                        className={input}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {msg && <p className="text-sm font-semibold text-emerald-700">{msg}</p>}
        <button type="button" onClick={save} disabled={busy || !students.length} className="inline-flex items-center gap-2 self-start rounded-full bg-[#E30613] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />} Enregistrer les notes
        </button>
      </section>
      <aside className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Évaluations saisies ce trimestre</p>
        {summary.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune note pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {summary.map(([k, n]) => (
              <li key={k} className="flex justify-between gap-2">
                <span className="text-slate-700">{k}</span>
                <span className="font-bold text-[#0C356A]">{n}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function Bulletins({ cls, term, year }: { cls: string; term: number; year: string }) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data } = await createClient().from("report_cards").select("id, student_id, student_name, general_average, rank_display, published, bulletin_number").eq("class_name", cls).eq("term", term).eq("academic_year", year).order("general_average", { ascending: false });
    setCards((data ?? []) as Card[]);
  }, [cls, term, year]);
  useEffect(() => {
    load();
  }, [load]);

  /** Calcule (ou recalcule) les bulletins de la classe à partir des notes et de l'assiduité. */
  const generate = async () => {
    setBusy(true);
    setMsg("");
    const supabase = createClient();
    const { data: s } = await supabase.from("students").select("id, first_name, last_name, registration_number, student_number, class_name, program_code, gender, birth_date, birth_place, nationality, photo_url").eq("class_name", cls).eq("status", "actif");
    const students = (s ?? []) as BulletinStudent[];
    const ids = students.map((x) => x.id);
    if (!ids.length) {
      setBusy(false);
      return setMsg("Aucun élève dans cette classe.");
    }
    const [from, to] = termRange(year, term);
    const [{ data: g }, { data: att }] = await Promise.all([
      supabase.from("grades").select("student_id, subject, score, coefficient, evaluation_type, appreciation, teacher_name").in("student_id", ids).eq("term", term).eq("academic_year", year),
      supabase.from("student_attendance").select("student_id, status").in("student_id", ids).gte("date", from).lte("date", to).neq("status", "present"),
    ]);
    const all = (g ?? []) as GradeRow[];
    const computed = students.map((st) => {
      const lines = subjectLines(all.filter((x) => x.student_id === st.id));
      return { st, lines, ...generalAverage(lines) };
    });
    const withGrades = computed.filter((c) => c.lines.length);
    if (!withGrades.length) {
      setBusy(false);
      return setMsg("Aucune note saisie pour ce trimestre : saisissez d'abord les notes.");
    }
    const r = ranks(withGrades.map((c) => ({ id: c.st.id, average: c.average })));
    const avgs = withGrades.map((c) => c.average);
    const classAvg = round2(avgs.reduce((a, b) => a + b, 0) / avgs.length);
    const rows = withGrades.map((c) => {
      const mine = (att ?? []).filter((a) => a.student_id === c.st.id);
      const unjust = mine.filter((a) => a.status === "absent").length;
      const late = mine.filter((a) => a.status === "retard").length;
      return {
        student_id: c.st.id,
        student_name: `${c.st.last_name.toUpperCase()} ${c.st.first_name}`,
        student_matricule: c.st.registration_number,
        student_number: c.st.student_number,
        class_name: cls,
        program_code: c.st.program_code,
        academic_year: year,
        term,
        period: TERMS[term],
        gender: c.st.gender,
        birth_date: c.st.birth_date,
        birth_place: c.st.birth_place,
        nationality: c.st.nationality,
        photo_url: c.st.photo_url,
        subjects_data: c.lines,
        total_coefficients: c.coef,
        total_points: c.points,
        general_average: c.average,
        rank: r.get(c.st.id)?.rank ?? null,
        rank_display: r.get(c.st.id)?.display ?? null,
        total_students: withGrades.length,
        class_general_average: classAvg,
        class_highest_average: Math.max(...avgs),
        class_lowest_average: Math.min(...avgs),
        absences_unjustified: unjust,
        absences_justified: mine.filter((a) => a.status === "permission").length,
        lates_count: late,
        mention: mention(c.average),
        conduct_appreciation: unjust + late === 0 ? "Très bonne" : unjust + late <= 3 ? "Bonne" : "À améliorer",
        council_decision: c.average >= 10 ? "Travail satisfaisant, continuez ainsi." : "Résultats insuffisants : des efforts sont attendus.",
        bulletin_number: `BUL-${year.slice(2, 4)}${term}-${c.st.registration_number ?? c.st.id.slice(0, 6)}`,
        issue_date: new Date().toISOString().slice(0, 10),
      };
    });
    const { error } = await supabase.from("report_cards").upsert(rows, { onConflict: "student_id,academic_year,term" });
    setBusy(false);
    setMsg(error ? "Génération impossible : " + error.message : `${rows.length} bulletin(s) calculé(s). Vérifiez-les puis publiez-les pour les familles.`);
    load();
  };

  const publish = async (ids: string[]) => {
    await createClient().from("report_cards").update({ published: true }).in("id", ids);
    pingNotifications();
    setMsg(`${ids.length} bulletin(s) publié(s) : élèves et parents sont prévenus.`);
    load();
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={generate} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#0C356A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#E30613] disabled:opacity-60">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Sparkles aria-hidden className="size-4" />} Calculer les bulletins de la classe
        </button>
        {cards && cards.some((c) => !c.published) && (
          <button type="button" onClick={() => publish(cards.filter((c) => !c.published).map((c) => c.id))} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white">
            <Send aria-hidden className="size-4" /> Publier pour les familles
          </button>
        )}
      </div>
      {msg && <p className="text-sm font-semibold text-emerald-700">{msg}</p>}
      {cards === null ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
      ) : cards.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun bulletin pour ce trimestre. Saisissez les notes puis cliquez sur « Calculer les bulletins ».</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">Rang</th>
                <th className="px-3 py-2">Élève</th>
                <th className="px-3 py-2 text-right">Moyenne</th>
                <th className="px-3 py-2">État</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-bold text-[#0C356A]">{c.rank_display}</td>
                  <td className="px-3 py-2 font-semibold">{c.student_name}</td>
                  <td className={cn("px-3 py-2 text-right font-black", Number(c.general_average) < 10 ? "text-[#E30613]" : "text-[#0C356A]")}>{Number(c.general_average).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    {c.published ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 aria-hidden className="size-3.5" /> Publié
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">À vérifier</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/impression/bulletin/${c.id}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[#0C356A] ring-1 ring-slate-200 hover:text-[#E30613]">
                      <Printer aria-hidden className="size-3.5" /> Voir / imprimer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
