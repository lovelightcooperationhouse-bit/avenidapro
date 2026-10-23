import { enqueue, isNetworkError } from "@/lib/offline-queue";
import { createClient } from "@/lib/supabase/client";

/** Notes gardées sur l'appareil faute de réseau : elles partiront au retour de la connexion. */
export class OfflineSaved extends Error {
  constructor(public count: number) {
    super(`Hors connexion : ${count} note(s) enregistrée(s) sur cet appareil. Elles seront envoyées et les bulletins recalculés dès le retour du réseau.`);
  }
}
import { MARK_CLASS, MARK_COMPO, SEMESTERS, assiduite, computeClass, conductFor, distinctionFor, maquetteFor, round2, semesterRange, appreciation, type BulletinExtras, type BulletinStudent, type GradeRow, type MaquetteSubject } from "@/lib/bulletins";

export const STUDENT_COLS = "id, first_name, last_name, registration_number, student_number, class_name, program_code, gender, birth_date, birth_place, nationality, photo_url";

/** Élèves actifs d'une classe, maquette de leur filière et notes du semestre. */
export async function loadClass(cls: string, semester: number, year: string) {
  const supabase = createClient();
  const [{ data: s }, { data: m }] = await Promise.all([
    supabase.from("students").select(STUDENT_COLS).eq("class_name", cls).eq("status", "actif").order("last_name"),
    supabase.from("bulletin_subjects").select("*"),
  ]);
  const students = (s ?? []) as BulletinStudent[];
  const program = students.find((x) => x.program_code)?.program_code ?? null;
  const maquette = maquetteFor((m ?? []) as MaquetteSubject[], program);
  const { data: g } = students.length
    ? await supabase.from("grades").select("student_id, subject, score, coefficient, evaluation_type, appreciation, teacher_name").in("student_id", students.map((x) => x.id)).eq("term", semester).eq("academic_year", year)
    : { data: [] };
  return { students, program, maquette, grades: (g ?? []) as GradeRow[] };
}

/** Enregistre (ou efface) les notes de classe et de composition ; une note vide supprime la note existante. */
export async function saveMarks(
  rows: { student: BulletinStudent; subject: string; coefficient: number; teacher: string | null; classMark: string; compoMark: string }[],
  cls: string,
  semester: number,
  year: string,
) {
  const supabase = createClient();
  const upserts: Record<string, unknown>[] = [];
  const deletes: { student_id: string; subject: string; type: string }[] = [];
  for (const r of rows) {
    for (const [type, raw] of [
      [MARK_CLASS, r.classMark],
      [MARK_COMPO, r.compoMark],
    ] as const) {
      const v = raw.trim().replace(",", ".");
      if (!v) {
        deletes.push({ student_id: r.student.id, subject: r.subject, type });
        continue;
      }
      const score = Number(v);
      if (Number.isNaN(score) || score < 0 || score > 20) throw new Error(`Note invalide pour ${r.student.first_name} ${r.student.last_name} (${r.subject}) : « ${raw} ». Saisissez une note entre 0 et 20.`);
      upserts.push({
        student_id: r.student.id,
        student_name: `${r.student.last_name} ${r.student.first_name}`,
        student_matricule: r.student.registration_number,
        class_name: cls,
        subject: r.subject,
        evaluation_type: type,
        coefficient: r.coefficient,
        score: round2(score),
        teacher_name: r.teacher,
        term: semester,
        academic_year: year,
        date: new Date().toISOString().slice(0, 10),
      });
    }
  }
  // Sans réseau : les notes sont gardées sur l'appareil et envoyées au retour de la connexion (bulletins recalculés ensuite)
  const keepOffline = () => {
    const recalc = { cls, semester, year };
    if (upserts.length) enqueue({ label: `Notes ${cls} (${upserts.length})`, table: "grades", kind: "upsert", rows: upserts, onConflict: "student_id,academic_year,term,subject,evaluation_type", recalc });
    for (const d of deletes) enqueue({ label: `Note effacée ${cls}`, table: "grades", kind: "delete", match: { student_id: d.student_id, academic_year: year, term: semester, subject: d.subject, evaluation_type: d.type }, recalc });
    throw new OfflineSaved(upserts.length);
  };
  if (typeof navigator !== "undefined" && !navigator.onLine) keepOffline();
  if (upserts.length) {
    const { error } = await supabase.from("grades").upsert(upserts, { onConflict: "student_id,academic_year,term,subject,evaluation_type" });
    if (error && isNetworkError(error)) keepOffline();
    if (error) throw new Error(error.message);
  }
  for (const d of deletes) {
    await supabase.from("grades").delete().eq("student_id", d.student_id).eq("academic_year", year).eq("term", semester).eq("subject", d.subject).eq("evaluation_type", d.type);
  }
  return upserts.length;
}

type Existing = { id: string; student_id: string; published: boolean; revision: number; signed_at: string | null; signed_by_name: string | null; sent_at: string | null; general_average: number | null; rank_display: string | null; subjects_data: unknown; raw_data: { extras?: BulletinExtras } | null };

/**
 * Calcule (ou recalcule) tous les bulletins d'une classe pour un semestre : moyennes, produits, rangs,
 * classement, distinctions et assiduité. Les données saisies à la main (sanctions, distinction, remarque, décision du conseil)
 * sont conservées. Un bulletin signé ou envoyé dont le résultat change redevient « à valider » (rectifié) : il faudra le resigner et le renvoyer.
 */
export async function recalcClass(cls: string, semester: number, year: string) {
  const supabase = createClient();
  const { students, program, maquette, grades } = await loadClass(cls, semester, year);
  if (!students.length) return { count: 0, rectified: 0 };
  const ids = students.map((x) => x.id);
  const [from, to] = semesterRange(year, semester);
  const [{ data: att }, { data: ex }] = await Promise.all([
    supabase.from("student_attendance").select("student_id, status, justified").in("student_id", ids).gte("date", from).lte("date", to).neq("status", "present"),
    supabase.from("report_cards").select("id, student_id, published, revision, signed_at, signed_by_name, sent_at, general_average, rank_display, subjects_data, raw_data").in("student_id", ids).eq("term", semester).eq("academic_year", year),
  ]);
  const existing = new Map(((ex ?? []) as Existing[]).map((e) => [e.student_id, e]));
  const computed = computeClass(students, maquette, grades).filter((c) => c.lines.length);
  if (!computed.length) return { count: 0, rectified: 0 };
  const avgs = computed.map((c) => c.average);
  const classAvg = round2(avgs.reduce((a, b) => a + b, 0) / avgs.length);
  let rectified = 0;

  const rows = computed.map((c) => {
    const old = existing.get(c.student.id);
    const extras: BulletinExtras = { distinctionAuto: true, ...(old?.raw_data?.extras ?? {}) };
    if (extras.distinctionAuto !== false) extras.distinction = distinctionFor(c.average);
    const mine = (att ?? []).filter((a) => a.student_id === c.student.id);
    // Absences non justifiées = absences sans justification vérifiée ; justifiées = permissions + absences justifiées
    const unjust = mine.filter((a) => a.status === "absent" && !a.justified).length;
    const lates = mine.filter((a) => a.status === "retard").length;
    const changed = !!old && (Number(old.general_average) !== c.average || old.rank_display !== (c.rank?.display ?? null) || JSON.stringify(old.subjects_data) !== JSON.stringify(c.lines));
    // Un bulletin signé ou envoyé qui change doit être revalidé, resigné puis renvoyé : rien ne part automatiquement
    const reopen = !!old && changed && (!!old.signed_at || old.published);
    if (reopen) rectified += 1;
    return {
      student_id: c.student.id,
      student_name: `${c.student.last_name.toUpperCase()} ${c.student.first_name}`,
      student_matricule: c.student.registration_number,
      student_number: c.student.student_number,
      class_name: cls,
      program_code: c.student.program_code ?? program,
      academic_year: year,
      term: semester,
      period: SEMESTERS[semester],
      gender: c.student.gender,
      birth_date: c.student.birth_date,
      birth_place: c.student.birth_place,
      nationality: c.student.nationality,
      photo_url: c.student.photo_url,
      subjects_data: c.lines,
      total_coefficients: c.coef,
      total_points: c.points,
      general_average: c.average,
      rank: c.rank?.rank ?? null,
      rank_display: c.rank?.display ?? null,
      total_students: computed.length,
      class_general_average: classAvg,
      class_highest_average: Math.max(...avgs),
      class_lowest_average: Math.min(...avgs),
      absences_unjustified: unjust,
      absences_justified: mine.filter((a) => a.status === "permission" || (a.status === "absent" && a.justified)).length,
      lates_count: lates,
      mention: appreciation(c.average),
      conduct_appreciation: extras.conduct || conductFor(extras, unjust, lates),
      director_comment: extras.remark ?? null,
      bulletin_number: `BUL-${year.slice(2, 4)}S${semester}-${c.student.registration_number ?? c.student.id.slice(0, 6)}`,
      issue_date: new Date().toISOString().slice(0, 10),
      raw_data: { ...(old?.raw_data ?? {}), extras, model: "avenida-semestre", assiduite: assiduite(unjust, lates) },
      revision: (old?.revision ?? 0) + (reopen ? 1 : 0),
      signed_at: reopen ? null : (old?.signed_at ?? null),
      signed_by_name: reopen ? null : (old?.signed_by_name ?? null),
      published: reopen ? false : (old?.published ?? false),
    };
  });
  const { error } = await supabase.from("report_cards").upsert(rows, { onConflict: "student_id,academic_year,term" });
  if (error) throw new Error(error.message);
  // Élèves sans aucune note : leur ancien bulletin éventuel n'est plus valable
  const without = students.filter((s) => !computed.some((c) => c.student.id === s.id)).map((s) => existing.get(s.id)?.id).filter(Boolean) as string[];
  if (without.length) await supabase.from("report_cards").delete().in("id", without).eq("published", false);
  return { count: rows.length, rectified };
}
