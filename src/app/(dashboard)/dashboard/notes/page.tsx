"use client";

import { BookOpenCheck, FileSpreadsheet, ListOrdered, Loader2, Pencil, Plus, Printer, RefreshCw, Save, Send, Signature, Trash2, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DocumentToolbar } from "@/components/cards/DocumentToolbar";
import { situationStatus } from "@/components/cards/SituationSheet";
import { reglementSignataire } from "@/content/reglement";
import { useAuth } from "@/context/AuthContext";
import { useSchoolYear } from "@/context/SchoolYearContext";
import { GROUPS, MARK_CLASS, MARK_COMPO, SANCTIONS, SEMESTERS, appreciation, maquetteFor, round2, type BulletinExtras, type BulletinStudent, type GradeRow, type MaquetteSubject, type SubjectGroup } from "@/lib/bulletins";
import { loadClass, recalcClass, saveMarks } from "@/lib/bulletins-sync";
import { pingNotifications } from "@/lib/notify";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0C356A]";
const markInput = "w-20 rounded-lg border border-slate-200 bg-amber-50 px-2 py-1.5 text-center text-sm font-bold outline-none focus:border-[#0C356A] focus:bg-white";
const yearLabel = (v: string) => v.replace("-", " - ");
const f2 = (n: number | null | undefined) => (n === null || n === undefined ? "—" : Number(n).toFixed(2).replace(".", ","));
const avgOf = (a: string, b: string) => {
  const n = [a, b].map((x) => x.trim().replace(",", ".")).filter(Boolean).map(Number).filter((x) => !Number.isNaN(x));
  return n.length ? round2(n.reduce((s, x) => s + x, 0) / n.length) : null;
};

type Tab = "maquette" | "saisie" | "bulletins" | "resultats";

/** Notes et bulletins sur le modèle officiel : matières et coefficients, saisie, calcul automatique, signature, résultats. */
export default function NotesPage() {
  const { selectedYear } = useSchoolYear();
  const year = yearLabel(selectedYear);
  const [tab, setTab] = useState<Tab>("saisie");
  const [classes, setClasses] = useState<{ name: string; program: string | null }[]>([]);
  const [cls, setCls] = useState("");
  const [semester, setSemester] = useState(1);

  useEffect(() => {
    createClient()
      .from("students")
      .select("class_name, program_code")
      .eq("status", "actif")
      .then(({ data }) => {
        const map = new Map<string, string | null>();
        (data ?? []).forEach((d) => d.class_name && map.set(d.class_name, d.program_code));
        const list = [...map.entries()].map(([name, program]) => ({ name, program })).sort((a, b) => a.name.localeCompare(b.name, "fr"));
        setClasses(list);
        setCls((c) => c || list[0]?.name || "");
      });
  }, []);

  const TABS: { k: Tab; label: string; icon: typeof FileSpreadsheet }[] = [
    { k: "maquette", label: "Matières et coefficients", icon: BookOpenCheck },
    { k: "saisie", label: "Saisie des notes", icon: Pencil },
    { k: "bulletins", label: "Bulletins", icon: FileSpreadsheet },
    { k: "resultats", label: "Résultats et classements", icon: Trophy },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
          <FileSpreadsheet aria-hidden className="size-6 text-[#E30613]" /> Notes et bulletins
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Modèle officiel : note de classe et note de composition par matière. Moyennes, produits, rangs, classement, appréciations et distinctions se calculent automatiquement.
          Rien n&apos;est envoyé automatiquement : après vérification, décision du conseil et signature du Directeur pédagogique, vous décidez de l&apos;envoi (espace, e-mail).
        </p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Étapes">
        {TABS.map((t, i) => (
          <button key={t.k} type="button" onClick={() => setTab(t.k)} className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-1", tab === t.k ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200 hover:text-[#E30613]")}>
            <span className="text-xs opacity-70">{i + 1}.</span> <t.icon aria-hidden className="size-4" /> {t.label}
          </button>
        ))}
      </nav>

      {tab !== "maquette" && (
        <div className="flex flex-wrap items-end gap-3">
          {tab !== "resultats" && (
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
              Classe
              <select value={cls} onChange={(e) => setCls(e.target.value)} className={input}>
                {classes.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            Semestre
            <select value={semester} onChange={(e) => setSemester(Number(e.target.value))} className={input}>
              {[1, 2].map((t) => (
                <option key={t} value={t}>
                  {SEMESTERS[t]}
                </option>
              ))}
            </select>
          </label>
          <p className="pb-2 text-sm font-semibold text-slate-600">Année {year}</p>
        </div>
      )}

      {tab === "maquette" ? (
        <Maquette programs={[...new Set(classes.map((c) => c.program).filter(Boolean) as string[])]} />
      ) : tab === "resultats" ? (
        <Results key={`${semester}-${year}`} semester={semester} year={year} />
      ) : !cls ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Aucune classe : les élèves inscrits définitivement apparaissent ici, classés par filière.</p>
      ) : tab === "saisie" ? (
        <Entry key={`${cls}-${semester}-${year}`} cls={cls} semester={semester} year={year} />
      ) : (
        <Bulletins key={`${cls}-${semester}-${year}`} cls={cls} semester={semester} year={year} />
      )}
    </div>
  );
}

/* ───────────────────── 1. Matières et coefficients ───────────────────── */

function Maquette({ programs }: { programs: string[] }) {
  const [all, setAll] = useState<MaquetteSubject[] | null>(null);
  const [program, setProgram] = useState<string>("");
  const [teachers, setTeachers] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data }, { data: t }] = await Promise.all([supabase.from("bulletin_subjects").select("*"), supabase.from("staff_directory").select("full_name, subjects").not("subjects", "is", null)]);
    setAll((data ?? []) as MaquetteSubject[]);
    setTeachers((t ?? []).map((x) => x.full_name as string));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (!all) return <Loader2 aria-label="Chargement" className="size-6 animate-spin" />;
  const own = all.filter((m) => (program ? m.program_code === program : !m.program_code));
  const list = program && !own.length ? maquetteFor(all, null) : own.sort((a, b) => a.position - b.position);
  const usesCommon = !!program && !own.length;

  const supabase = createClient();
  const run = async (p: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await p;
    setMsg(error ? error.message : "Enregistré. Recalculez les bulletins concernés pour appliquer les nouveaux coefficients.");
    load();
  };
  const customize = () =>
    run(
      supabase.from("bulletin_subjects").insert(
        maquetteFor(all, null).map((m) => ({ program_code: program, name: m.name, grp: m.grp, coefficient: m.coefficient, position: m.position, teacher_name: m.teacher_name })),
      ),
    );

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Filière
          <select value={program} onChange={(e) => setProgram(e.target.value)} className={input}>
            <option value="">Maquette commune (toutes les filières)</option>
            {programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        {usesCommon && (
          <button type="button" onClick={customize} className="rounded-full bg-[#E30613] px-4 py-2 text-sm font-bold text-white">
            Personnaliser les matières de {program}
          </button>
        )}
      </div>
      <p className="text-sm text-slate-600">
        {usesCommon
          ? `${program} utilise la maquette commune ci-dessous. Personnalisez-la pour avoir des matières ou coefficients propres à cette filière.`
          : "Matières du bulletin, regroupées comme sur le modèle officiel. Le professeur indiqué apparaît sur chaque bulletin."}
      </p>
      <datalist id="profs">
        {teachers.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      {GROUPS.map((g) => (
        <div key={g.key}>
          <p className="mb-2 bg-[#0C356A] px-3 py-1.5 text-xs font-extrabold tracking-wider text-white uppercase">{g.label}</p>
          <ul className="flex flex-col gap-2">
            {list
              .filter((m) => m.grp === g.key)
              .map((m) => (
                <SubjectRow key={m.id} m={m} readOnly={usesCommon} onSave={(patch) => run(supabase.from("bulletin_subjects").update(patch).eq("id", m.id))} onDelete={() => window.confirm(`Retirer « ${m.name} » ?`) && run(supabase.from("bulletin_subjects").delete().eq("id", m.id))} />
              ))}
          </ul>
          {!usesCommon && (
            <button
              type="button"
              onClick={() => {
                const name = window.prompt(`Nouvelle matière (${g.label}) :`);
                if (name?.trim()) run(supabase.from("bulletin_subjects").insert({ program_code: program || null, name: name.trim(), grp: g.key, coefficient: 1, position: 100 + list.length }));
              }}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-[#0C356A] hover:text-[#E30613]"
            >
              <Plus aria-hidden className="size-4" /> Ajouter une matière
            </button>
          )}
        </div>
      ))}
      <p className="text-sm font-bold text-[#0C356A]">Total des coefficients : {list.reduce((a, m) => a + Number(m.coefficient), 0)}</p>
      {msg && <p className="text-sm font-semibold text-emerald-700">{msg}</p>}
    </section>
  );
}

function SubjectRow({ m, readOnly, onSave, onDelete }: { m: MaquetteSubject; readOnly: boolean; onSave: (p: Partial<MaquetteSubject>) => void; onDelete: () => void }) {
  const [v, setV] = useState({ name: m.name, coefficient: String(m.coefficient), teacher_name: m.teacher_name ?? "", grp: m.grp, position: String(m.position) });
  const dirty = v.name !== m.name || Number(v.coefficient) !== Number(m.coefficient) || v.teacher_name !== (m.teacher_name ?? "") || v.grp !== m.grp || Number(v.position) !== m.position;
  return (
    <li className="grid items-center gap-2 rounded-xl bg-slate-50 p-2 sm:grid-cols-[3rem_1fr_6rem_1fr_9rem_auto]">
      <input value={v.position} disabled={readOnly} onChange={(e) => setV({ ...v, position: e.target.value })} aria-label="Ordre" className={cn(input, "text-center")} />
      <input value={v.name} disabled={readOnly} onChange={(e) => setV({ ...v, name: e.target.value })} aria-label="Matière" className={cn(input, "font-semibold")} />
      <label className="flex items-center gap-1 text-xs font-bold text-slate-500">
        Coef
        <input type="number" min={0.5} step={0.5} value={v.coefficient} disabled={readOnly} onChange={(e) => setV({ ...v, coefficient: e.target.value })} className={cn(input, "text-center font-bold")} />
      </label>
      <input list="profs" value={v.teacher_name} disabled={readOnly} onChange={(e) => setV({ ...v, teacher_name: e.target.value })} placeholder="Professeur" aria-label="Professeur" className={input} />
      <select value={v.grp} disabled={readOnly} onChange={(e) => setV({ ...v, grp: e.target.value as SubjectGroup })} aria-label="Groupe" className={input}>
        {GROUPS.map((g) => (
          <option key={g.key} value={g.key}>
            {g.label.replace("Matières ", "")}
          </option>
        ))}
      </select>
      {!readOnly && (
        <span className="flex gap-1">
          <button type="button" disabled={!dirty} onClick={() => onSave({ name: v.name.trim(), coefficient: Number(v.coefficient) || 1, teacher_name: v.teacher_name.trim() || null, grp: v.grp, position: Number(v.position) || 100 })} aria-label="Enregistrer" className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-30">
            <Save aria-hidden className="size-4" />
          </button>
          <button type="button" onClick={onDelete} aria-label="Retirer" className="rounded-lg p-2 text-red-600 hover:bg-red-50">
            <Trash2 aria-hidden className="size-4" />
          </button>
        </span>
      )}
    </li>
  );
}

/* ───────────────────── 2. Saisie des notes ───────────────────── */

function Entry({ cls, semester, year }: { cls: string; semester: number; year: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadClass>> | null>(null);
  const [subject, setSubject] = useState("");
  const [marks, setMarks] = useState<Record<string, { c: string; p: string }>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const d = await loadClass(cls, semester, year);
    setData(d);
    setSubject((s) => s || d.maquette[0]?.name || "");
  }, [cls, semester, year]);
  useEffect(() => {
    load();
  }, [load]);

  // Notes déjà enregistrées pour la matière choisie
  useEffect(() => {
    if (!data || !subject) return;
    const get = (sid: string, t: string) => data.grades.find((g) => g.student_id === sid && g.subject === subject && g.evaluation_type === t)?.score;
    setMarks(Object.fromEntries(data.students.map((s) => [s.id, { c: get(s.id, MARK_CLASS)?.toString() ?? "", p: get(s.id, MARK_COMPO)?.toString() ?? "" }])));
  }, [data, subject]);

  if (!data) return <Loader2 aria-label="Chargement" className="size-6 animate-spin" />;
  const m = data.maquette.find((x) => x.name === subject);
  const filled = (name: string) => new Set(data.grades.filter((g) => g.subject === name).map((g) => g.student_id)).size;

  const save = async () => {
    if (!m) return;
    setBusy(true);
    setMsg(null);
    try {
      const n = await saveMarks(
        data.students.map((s) => ({ student: s, subject: m.name, coefficient: Number(m.coefficient), teacher: m.teacher_name, classMark: marks[s.id]?.c ?? "", compoMark: marks[s.id]?.p ?? "" })),
        cls,
        semester,
        year,
      );
      const r = await recalcClass(cls, semester, year);
      setMsg({ ok: true, text: `${n} note(s) enregistrée(s) en ${m.name}. Bulletins préparés automatiquement (${r.count} élève(s)), sans envoi${r.rectified ? ` · ${r.rectified} bulletin(s) signé(s) à revalider` : ""}.` });
      load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Enregistrement impossible" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_19rem]">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-64 flex-1 flex-col gap-1 text-xs font-bold text-slate-600">
            Matière (filière {data.program ?? "—"})
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className={input}>
              {GROUPS.map((g) => (
                <optgroup key={g.key} label={g.label}>
                  {data.maquette
                    .filter((x) => x.grp === g.key)
                    .map((x) => (
                      <option key={x.id} value={x.name}>
                        {x.name} (coef {x.coefficient})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          {m?.teacher_name && <p className="pb-2 text-sm text-slate-600">Professeur : {m.teacher_name}</p>}
        </div>
        {data.students.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun élève actif dans cette classe.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-2">Élève</th>
                  <th className="px-3 py-2 text-center">Moy. classe /20</th>
                  <th className="px-3 py-2 text-center">Note de compo. /20</th>
                  <th className="px-3 py-2 text-center">Moy. géné.</th>
                  <th className="px-3 py-2">Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s) => {
                  const v = marks[s.id] ?? { c: "", p: "" };
                  const avg = avgOf(v.c, v.p);
                  return (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <span className="block font-bold text-slate-800">
                          {s.last_name} {s.first_name}
                        </span>
                        <span className="font-mono text-xs text-[#E30613]">{s.registration_number}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input inputMode="decimal" value={v.c} onChange={(e) => setMarks({ ...marks, [s.id]: { ...v, c: e.target.value } })} aria-label={`Moyenne de classe de ${s.first_name}`} placeholder="—" className={markInput} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input inputMode="decimal" value={v.p} onChange={(e) => setMarks({ ...marks, [s.id]: { ...v, p: e.target.value } })} aria-label={`Note de composition de ${s.first_name}`} placeholder="—" className={markInput} />
                      </td>
                      <td className={cn("px-3 py-2 text-center font-black", avg !== null && avg < 10 ? "text-[#E30613]" : "text-[#0C356A]")}>{f2(avg)}</td>
                      <td className="px-3 py-2 text-slate-600">{avg !== null ? appreciation(avg) : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-500">Cases jaunes : notes sur 20 (virgule acceptée). Une case vidée efface la note. Moyenne et appréciation se calculent automatiquement.</p>
        {msg && <p className={cn("rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#B8000F]")}>{msg.text}</p>}
        <button type="button" onClick={save} disabled={busy || !data.students.length || !m} className="inline-flex items-center gap-2 self-start rounded-full bg-[#E30613] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />} Enregistrer et recalculer
        </button>
      </section>
      <aside className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Avancement de la saisie</p>
        <ul className="flex flex-col gap-1.5 text-sm">
          {data.maquette.map((x) => {
            const n = filled(x.name);
            const done = n === data.students.length && n > 0;
            return (
              <li key={x.id}>
                <button type="button" onClick={() => setSubject(x.name)} className={cn("flex w-full justify-between gap-2 rounded-lg px-2 py-1 text-left hover:bg-slate-50", subject === x.name && "bg-blue-50")}>
                  <span className="text-slate-700">{x.name}</span>
                  <span className={cn("font-bold", done ? "text-emerald-700" : n ? "text-amber-700" : "text-slate-400")}>
                    {n}/{data.students.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}

/* ───────────────────── 3. Bulletins ───────────────────── */

type Card = {
  id: string;
  student_id: string;
  student_name: string | null;
  general_average: number | null;
  rank_display: string | null;
  total_students: number | null;
  mention: string | null;
  council_decision: string | null;
  published: boolean;
  revision: number;
  signed_by_name: string | null;
  signed_at: string | null;
  sent_at: string | null;
  sent_by_email: boolean;
  raw_data: { extras?: BulletinExtras } | null;
};
type Pay = { id: string; total_fee: number | null; paid_fee: number | null; remaining_fee: number | null; academic_year: string | null };

/** Décision du conseil proposée selon la moyenne (modifiable avant la signature). */
const councilSuggestion = (avg: number, semester: number) =>
  semester === 2
    ? avg >= 10
      ? "Admis(e) en classe supérieure"
      : avg >= 9
        ? "Admission conditionnelle, travail de rattrapage exigé"
        : "Redouble la classe"
    : avg >= 14
      ? "Félicitations du conseil"
      : avg >= 12
        ? "Encouragements du conseil"
        : avg >= 10
          ? "Travail satisfaisant, continuez ainsi"
          : "Résultats insuffisants, des efforts sont exigés";

const stateOf = (c: Card) =>
  c.published
    ? { label: `Envoyé le ${new Date(c.sent_at ?? c.signed_at ?? Date.now()).toLocaleDateString("fr-FR")} · ${c.sent_by_email ? "espace + e-mail" : "espace"}`, tone: "bg-emerald-600 text-white" }
    : c.signed_at
      ? { label: "Signé · prêt à envoyer", tone: "bg-emerald-100 text-emerald-800" }
      : c.revision
        ? { label: "Rectifié · à revalider", tone: "bg-orange-100 text-orange-800" }
        : { label: "Préparé · à vérifier", tone: "bg-amber-100 text-amber-800" };

function Bulletins({ cls, semester, year }: { cls: string; semester: number; year: string }) {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [pays, setPays] = useState<Map<string, Pay>>(new Map());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [fixing, setFixing] = useState<Card | null>(null);
  const [sending, setSending] = useState(false);
  const canSign = user?.role === "directeur_pedagogique" || user?.role === "directeur_general";

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("report_cards")
      .select("id, student_id, student_name, general_average, rank_display, total_students, mention, council_decision, published, revision, signed_by_name, signed_at, sent_at, sent_by_email, raw_data")
      .eq("class_name", cls)
      .eq("term", semester)
      .eq("academic_year", year)
      .order("rank", { ascending: true });
    const list = (data ?? []) as Card[];
    setCards(list);
    if (list.length) {
      const { data: st } = await supabase.from("students").select("id, total_fee, paid_fee, remaining_fee, academic_year").in("id", list.map((c) => c.student_id));
      setPays(new Map(((st ?? []) as Pay[]).map((s) => [s.id, s])));
    }
  }, [cls, semester, year]);
  useEffect(() => {
    load();
  }, [load]);

  const recalc = async () => {
    setBusy(true);
    try {
      const r = await recalcClass(cls, semester, year);
      setMsg(
        r.count
          ? { ok: true, text: `${r.count} bulletin(s) préparé(s) : moyennes, rangs et classement à jour${r.rectified ? ` · ${r.rectified} bulletin(s) modifié(s) à revalider et resigner` : ""}. Rien n'est envoyé aux familles.` }
          : { ok: false, text: "Aucune note saisie pour ce semestre : saisissez d'abord les notes." },
      );
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Calcul impossible" });
    }
    setBusy(false);
    load();
  };

  const chosen = (cards ?? []).filter((c) => selected.has(c.id));
  const toSign = chosen.filter((c) => !c.signed_at);
  const toSend = chosen.filter((c) => c.signed_at);

  /** Étape 3 : décision du conseil et signature officielle du Directeur pédagogique (sans envoi). */
  const sign = async () => {
    if (!user || !toSign.length) return;
    const name = user.role === "directeur_pedagogique" ? user.fullName : reglementSignataire.name;
    if (!window.confirm(`Valider et signer ${toSign.length} bulletin(s) au nom de ${name}, Directeur pédagogique ?\nLes bulletins ne seront PAS envoyés : vous déciderez ensuite de l'envoi.`)) return;
    setBusy(true);
    const supabase = createClient();
    const now = new Date().toISOString();
    const results = await Promise.all(
      toSign.map((c) => supabase.from("report_cards").update({ signed_at: now, signed_by_name: name, council_decision: c.council_decision ?? councilSuggestion(Number(c.general_average), semester) }).eq("id", c.id)),
    );
    setBusy(false);
    const err = results.find((r) => r.error)?.error;
    setMsg(err ? { ok: false, text: err.message } : { ok: true, text: `${toSign.length} bulletin(s) validé(s) et signé(s). Ils sont prêts : envoyez-les quand vous le décidez.` });
    setSelected(new Set());
    load();
  };

  /** Étape 4 : envoi décidé par la direction, dans l'espace de l'élève et du tuteur, avec ou sans e-mail. */
  const send = async (byEmail: boolean) => {
    setSending(false);
    setBusy(true);
    const { data, error } = await createClient().rpc("send_report_cards", { ids: toSend.map((c) => c.id), by_email: byEmail });
    setBusy(false);
    if (!error && byEmail) pingNotifications();
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: `${data} bulletin(s) envoyé(s) dans l'espace de l'élève et du tuteur${byEmail ? ", avec un e-mail" : ""}.` });
    setSelected(new Set());
    load();
  };

  const toggleAll = () => setSelected(selected.size === (cards?.length ?? 0) ? new Set() : new Set((cards ?? []).map((c) => c.id)));

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <ol className="grid gap-2 text-xs sm:grid-cols-4">
        {[
          ["1. Préparé", "Moyennes, rangs, classement calculés"],
          ["2. Vérifié", "Consulter chaque bulletin et la situation de paiement"],
          ["3. Signé", "Décision du conseil et signature du Directeur pédagogique"],
          ["4. Envoyé", "Sur décision : espace de l'élève et du tuteur, e-mail"],
        ].map(([t, d]) => (
          <li key={t} className="rounded-xl bg-slate-50 p-2.5">
            <p className="font-extrabold text-[#0C356A]">{t}</p>
            <p className="text-slate-600">{d}</p>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={recalc} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#0C356A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#E30613] disabled:opacity-60">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <RefreshCw aria-hidden className="size-4" />} Préparer / recalculer la classe
        </button>
        {canSign && (
          <button type="button" onClick={sign} disabled={busy || !toSign.length} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
            <Signature aria-hidden className="size-4" /> Valider et signer ({toSign.length})
          </button>
        )}
        {canSign && (
          <button type="button" onClick={() => setSending(true)} disabled={busy || !toSend.length} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
            <Send aria-hidden className="size-4" /> Envoyer ({toSend.length})
          </button>
        )}
      </div>
      {sending && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#E30613] bg-red-50/40 p-4">
          <p className="font-bold text-[#0C356A]">Envoyer {toSend.length} bulletin(s) signé(s) : comment ?</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => send(true)} className="rounded-full bg-[#E30613] px-4 py-2 text-sm font-bold text-white">
              Espace de l&apos;élève et du tuteur + e-mail
            </button>
            <button type="button" onClick={() => send(false)} className="rounded-full bg-[#0C356A] px-4 py-2 text-sm font-bold text-white">
              Espace seulement (sans e-mail)
            </button>
            <button type="button" onClick={() => setSending(false)} className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
              Annuler
            </button>
          </div>
          <p className="text-xs text-slate-600">Pour envoyer le PDF en pièce jointe à une adresse précise, ouvrez le « Bulletin A4 » de l&apos;élève.</p>
        </div>
      )}
      {msg && <p className={cn("rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900")}>{msg.text}</p>}
      {cards === null ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
      ) : cards.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun bulletin pour ce semestre. Saisissez les notes : les bulletins se préparent automatiquement (sans être envoyés).</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[62rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">
                  <input type="checkbox" aria-label="Tout sélectionner" checked={selected.size === cards.length} onChange={toggleAll} className="size-4" />
                </th>
                <th className="px-3 py-2">Rang</th>
                <th className="px-3 py-2">Élève</th>
                <th className="px-3 py-2 text-right">Moyenne</th>
                <th className="px-3 py-2">Appréciation</th>
                <th className="px-3 py-2">Écolage</th>
                <th className="px-3 py-2">Décision du conseil</th>
                <th className="px-3 py-2">État</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => {
                const p = pays.get(c.student_id);
                const pay = p ? situationStatus(p) : null;
                const st = stateOf(c);
                return (
                  <tr key={c.id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Sélectionner ${c.student_name}`}
                        checked={selected.has(c.id)}
                        onChange={() =>
                          setSelected((s) => {
                            const n = new Set(s);
                            if (n.has(c.id)) n.delete(c.id);
                            else n.add(c.id);
                            return n;
                          })
                        }
                        className="size-4"
                      />
                    </td>
                    <td className="px-3 py-2 font-bold whitespace-nowrap text-[#0C356A]">
                      {c.rank_display} <span className="text-xs font-normal text-slate-500">/ {c.total_students}</span>
                    </td>
                    <td className="px-3 py-2 font-semibold">
                      {c.student_name}
                      {c.raw_data?.extras?.distinction && <span className="block text-xs font-normal text-emerald-700">{c.raw_data.extras.distinction}</span>}
                    </td>
                    <td className={cn("px-3 py-2 text-right font-black", Number(c.general_average) < 10 ? "text-[#E30613]" : "text-[#0C356A]")}>{f2(c.general_average)}</td>
                    <td className="px-3 py-2">{c.mention}</td>
                    <td className="px-3 py-2">
                      {pay && (
                        <Link href={`/impression/situation/${c.student_id}`} target="_blank" title="Fiche de situation financière" className="rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap" style={{ background: pay.bg, color: pay.tone }}>
                          {pay.label}
                        </Link>
                      )}
                    </td>
                    <td className="max-w-[14rem] px-3 py-2 text-xs text-slate-700">{c.council_decision ?? <span className="text-slate-400 italic">{councilSuggestion(Number(c.general_average), semester)} (proposée)</span>}</td>
                    <td className="px-3 py-2">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap", st.tone)}>{st.label}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => setFixing(c)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[#E30613] ring-1 ring-red-200">
                          <Pencil aria-hidden className="size-3.5" /> Corriger
                        </button>
                        <Link href={`/impression/bulletin/${c.id}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap text-[#0C356A] ring-1 ring-slate-200 hover:text-[#E30613]">
                          <Printer aria-hidden className="size-3.5" /> Bulletin A4
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {fixing && (
        <Correction
          card={fixing}
          cls={cls}
          semester={semester}
          year={year}
          onClose={() => setFixing(null)}
          onDone={(t) => {
            setFixing(null);
            setMsg({ ok: true, text: t });
            load();
          }}
        />
      )}
    </section>
  );
}

/** Réclamation ou erreur : toutes les notes de l'élève, distinction, sanctions et remarque ; tout est recalculé ensuite. */
function Correction({ card, cls, semester, year, onClose, onDone }: { card: Card; cls: string; semester: number; year: string; onClose: () => void; onDone: (msg: string) => void }) {
  const [data, setData] = useState<{ student: BulletinStudent; maquette: MaquetteSubject[]; grades: GradeRow[] } | null>(null);
  const [marks, setMarks] = useState<Record<string, { c: string; p: string }>>({});
  const [extras, setExtras] = useState<BulletinExtras>(card.raw_data?.extras ?? { distinctionAuto: true });
  const [council, setCouncil] = useState(card.council_decision ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadClass(cls, semester, year).then((d) => {
      const student = d.students.find((s) => s.id === card.student_id);
      if (!student) return;
      const mine = d.grades.filter((g) => g.student_id === student.id);
      const get = (sub: string, t: string) => mine.find((g) => g.subject === sub && g.evaluation_type === t)?.score?.toString() ?? "";
      setMarks(Object.fromEntries(d.maquette.map((m) => [m.name, { c: get(m.name, MARK_CLASS), p: get(m.name, MARK_COMPO) }])));
      setData({ student, maquette: d.maquette, grades: mine });
    });
  }, [card.student_id, cls, semester, year]);

  const save = async () => {
    if (!data) return;
    setBusy(true);
    setError("");
    try {
      await saveMarks(
        data.maquette.map((m) => ({ student: data.student, subject: m.name, coefficient: Number(m.coefficient), teacher: m.teacher_name, classMark: marks[m.name]?.c ?? "", compoMark: marks[m.name]?.p ?? "" })),
        cls,
        semester,
        year,
      );
      await createClient()
        .from("report_cards")
        .update({ raw_data: { ...(card.raw_data ?? {}), extras }, council_decision: council.trim() || null })
        .eq("id", card.id);
      const r = await recalcClass(cls, semester, year);
      onDone(`Correction enregistrée pour ${card.student_name} : toute la classe est recalculée (moyennes, rangs, classement)${r.rectified ? ` · ${r.rectified} bulletin(s) à revalider et resigner` : ""}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Correction impossible");
      setBusy(false);
    }
  };

  const total = data ? data.maquette.reduce((a, m) => {
      const avg = avgOf(marks[m.name]?.c ?? "", marks[m.name]?.p ?? "");
      return avg === null ? a : { coef: a.coef + Number(m.coefficient), pts: a.pts + avg * Number(m.coefficient) };
    }, { coef: 0, pts: 0 }) : { coef: 0, pts: 0 };

  return (
    <div role="dialog" aria-modal="true" aria-label="Corriger le bulletin" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-6" onClick={onClose}>
      <div className="relative w-full max-w-4xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 rounded-full p-2 hover:bg-slate-100">
          <X aria-hidden className="size-5" />
        </button>
        <h2 className="text-xl font-black text-[#0C356A]">Corriger le bulletin · {card.student_name}</h2>
        <p className="mb-4 text-sm text-slate-600">Réclamation ou erreur de saisie : modifiez les notes, puis enregistrez. Toute la classe est recalculée ; un bulletin déjà signé redevient « à revalider » et devra être resigné puis renvoyé. Rien n'est envoyé automatiquement.</p>
        {!data ? (
          <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-2 py-1.5">Matière</th>
                    <th className="px-2 py-1.5 text-center">Coef</th>
                    <th className="px-2 py-1.5 text-center">Moy. classe</th>
                    <th className="px-2 py-1.5 text-center">Compo.</th>
                    <th className="px-2 py-1.5 text-center">Moy.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.maquette.map((m) => {
                    const v = marks[m.name] ?? { c: "", p: "" };
                    const avg = avgOf(v.c, v.p);
                    return (
                      <tr key={m.id} className="border-t border-slate-100">
                        <td className="px-2 py-1.5 font-semibold">{m.name}</td>
                        <td className="px-2 py-1.5 text-center">{m.coefficient}</td>
                        <td className="px-2 py-1.5 text-center">
                          <input inputMode="decimal" value={v.c} onChange={(e) => setMarks({ ...marks, [m.name]: { ...v, c: e.target.value } })} aria-label={`Moyenne de classe en ${m.name}`} className={markInput} />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <input inputMode="decimal" value={v.p} onChange={(e) => setMarks({ ...marks, [m.name]: { ...v, p: e.target.value } })} aria-label={`Composition en ${m.name}`} className={markInput} />
                        </td>
                        <td className="px-2 py-1.5 text-center font-bold text-[#0C356A]">{f2(avg)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-sm font-bold text-[#0C356A]">Moyenne semestrielle provisoire : {total.coef ? f2(round2(total.pts / total.coef)) : "—"}/20</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
                <legend className="px-1 text-xs font-bold text-slate-600 uppercase">Distinction</legend>
                <select
                  value={extras.distinctionAuto === false ? (extras.distinction ?? "") : "auto"}
                  onChange={(e) => setExtras(e.target.value === "auto" ? { ...extras, distinctionAuto: true } : { ...extras, distinctionAuto: false, distinction: e.target.value })}
                  className={input}
                >
                  <option value="auto">Automatique (≥ 12 : tableau d&apos;honneur, ≥ 14 : félicitations)</option>
                  <option value="">Aucune</option>
                  <option value="Tableau d'honneur">Tableau d&apos;honneur</option>
                  <option value="Tableau d'honneur et félicitations">Tableau d&apos;honneur et félicitations</option>
                </select>
              </fieldset>
              <fieldset className="flex flex-col gap-1.5 rounded-xl border border-slate-200 p-3">
                <legend className="px-1 text-xs font-bold text-slate-600 uppercase">Sanctions</legend>
                {SANCTIONS.map((s) => (
                  <label key={s.key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!extras.sanctions?.[s.key]} onChange={(e) => setExtras({ ...extras, sanctions: { ...extras.sanctions, [s.key]: e.target.checked } })} className="size-4 accent-[#E30613]" />
                    {s.label}
                  </label>
                ))}
              </fieldset>
            </div>
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
              Décision du conseil (vide = proposée automatiquement selon la moyenne)
              <input list="decisions" value={council} onChange={(e) => setCouncil(e.target.value)} className={input} />
              <datalist id="decisions">
                {["Félicitations du conseil", "Encouragements du conseil", "Travail satisfaisant, continuez ainsi", "Résultats insuffisants, des efforts sont exigés", "Admis(e) en classe supérieure", "Admission conditionnelle, travail de rattrapage exigé", "Redouble la classe"].map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
              Observation de la direction (facultatif)
              <input value={extras.remark ?? ""} onChange={(e) => setExtras({ ...extras, remark: e.target.value })} className={input} />
            </label>
            {error && <p className="text-sm font-semibold text-[#B8000F]">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />} Enregistrer la correction et recalculer
              </button>
              <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── 4. Résultats et classements ───────────────────── */

type ResultRow = { id: string; student_name: string | null; class_name: string | null; program_code: string | null; general_average: number | null; rank_display: string | null; total_students: number | null; mention: string | null; published: boolean; raw_data: { extras?: BulletinExtras } | null };

function Results({ semester, year }: { semester: number; year: string }) {
  const [rows, setRows] = useState<ResultRow[] | null>(null);
  const [view, setView] = useState<"filiere" | "classe">("filiere");
  const [scope, setScope] = useState("");

  useEffect(() => {
    createClient()
      .from("report_cards")
      .select("id, student_name, class_name, program_code, general_average, rank_display, total_students, mention, published, raw_data")
      .eq("term", semester)
      .eq("academic_year", year)
      .order("general_average", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as ResultRow[]));
  }, [semester, year]);

  const groups = useMemo(() => [...new Set((rows ?? []).map((r) => (view === "filiere" ? r.program_code : r.class_name) ?? "—"))].sort(), [rows, view]);
  useEffect(() => {
    setScope((s) => (groups.includes(s) ? s : (groups[0] ?? "")));
  }, [groups]);

  if (!rows) return <Loader2 aria-label="Chargement" className="size-6 animate-spin" />;
  if (!rows.length) return <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Aucun résultat pour ce semestre.</p>;

  const list = rows.filter((r) => ((view === "filiere" ? r.program_code : r.class_name) ?? "—") === scope);
  // Classement de la filière (toutes classes confondues) avec ex æquo
  const ranked = list.map((r) => {
    const rank = list.filter((x) => Number(x.general_average) > Number(r.general_average)).length + 1;
    const tie = list.filter((x) => Number(x.general_average) === Number(r.general_average)).length > 1;
    return { ...r, rank: `${rank}${rank === 1 ? "er" : "e"}${tie ? " ex æquo" : ""}` };
  });
  const avgs = list.map((r) => Number(r.general_average));
  const pass = avgs.filter((a) => a >= 10).length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(["filiere", "classe"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className={cn("rounded-lg px-4 py-2 text-sm font-bold", view === v ? "bg-white text-[#0C356A] shadow-sm" : "text-slate-500")}>
              Par {v === "filiere" ? "filière" : "classe"}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          {view === "filiere" ? "Filière" : "Classe"}
          <select value={scope} onChange={(e) => setScope(e.target.value)} className={input}>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="-mx-4 sm:mx-0">
        <DocumentToolbar elementId="avenida-pv-resultats" fileName={`Resultats-${scope}-S${semester}-${year.replace(/\s/g, "")}`} archive={{ kind: "bulletin", title: `Résultats ${scope} · ${SEMESTERS[semester]} ${year}`, refType: "resultats", refId: `${scope}-${semester}-${year}` }} />
        <article id="avenida-pv-resultats" className="mx-auto w-full max-w-[210mm] bg-white p-[8mm] text-[12px] shadow-lg print:shadow-none">
          <header className="flex items-center gap-3 border-b-2 border-[#1B1652] pb-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- document imprimable */}
            <img src="/logo-avenida.png" alt="" className="size-14 object-contain" />
            <div className="flex-1">
              <p className="font-serif text-lg font-extrabold text-[#1B1652]">
                HÔTEL ÉCOLE <span className="text-[#E31B3A]">AVENIDA</span>
              </p>
              <p className="text-xs text-slate-500">Centre de formation hôtelière · Lomé</p>
            </div>
            <ListOrdered aria-hidden className="size-8 text-[#E31B3A]" />
          </header>
          <h2 className="mt-4 text-center text-xl font-black text-[#1B1652] uppercase">Procès-verbal des résultats</h2>
          <p className="text-center text-sm">
            {view === "filiere" ? "Filière" : "Classe"} <strong>{scope}</strong> · {SEMESTERS[semester]} · Année scolaire {year}
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
            {[
              ["Effectif classé", list.length],
              ["Moyenne générale", f2(avgs.length ? round2(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null)],
              ["Plus forte / plus faible", `${f2(Math.max(...avgs))} / ${f2(Math.min(...avgs))}`],
              ["Moyenne ≥ 10", `${pass} (${list.length ? Math.round((pass / list.length) * 100) : 0} %)`],
            ].map(([l, v]) => (
              <div key={String(l)} className="rounded-lg border border-slate-200 p-2">
                <p className="font-bold text-slate-500">{l}</p>
                <p className="text-sm font-black text-[#1B1652]">{v}</p>
              </div>
            ))}
          </div>
          <table className="mt-4 w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#1B1652] text-white">
                <th className="border border-[#1B1652] px-2 py-1">Rang</th>
                <th className="border border-[#1B1652] px-2 py-1">Nom et prénoms</th>
                {view === "filiere" && <th className="border border-[#1B1652] px-2 py-1">Classe</th>}
                <th className="border border-[#1B1652] px-2 py-1 text-center">Moyenne</th>
                <th className="border border-[#1B1652] px-2 py-1">Appréciation</th>
                <th className="border border-[#1B1652] px-2 py-1">Distinction</th>
                {view === "filiere" && <th className="border border-[#1B1652] px-2 py-1">Rang classe</th>}
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr key={r.id} className="odd:bg-slate-50">
                  <td className="border border-slate-300 px-2 py-1 font-bold">{view === "filiere" ? r.rank : r.rank_display}</td>
                  <td className="border border-slate-300 px-2 py-1 font-semibold">
                    <Link href={`/impression/bulletin/${r.id}`} target="_blank" className="hover:text-[#E31B3A]">
                      {r.student_name}
                    </Link>
                  </td>
                  {view === "filiere" && <td className="border border-slate-300 px-2 py-1">{r.class_name}</td>}
                  <td className={cn("border border-slate-300 px-2 py-1 text-center font-black", Number(r.general_average) < 10 ? "text-[#E31B3A]" : "text-[#1B1652]")}>{f2(r.general_average)}</td>
                  <td className="border border-slate-300 px-2 py-1">{r.mention}</td>
                  <td className="border border-slate-300 px-2 py-1 text-xs">{r.raw_data?.extras?.distinction}</td>
                  {view === "filiere" && (
                    <td className="border border-slate-300 px-2 py-1 text-xs">
                      {r.rank_display} / {r.total_students}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between text-sm">
            <p>Fait à Lomé, le {new Date().toLocaleDateString("fr-FR")}</p>
            <div className="text-center">
              <p className="font-bold uppercase">Le Directeur pédagogique</p>
              <p className="mt-10 font-semibold">{reglementSignataire.name}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
