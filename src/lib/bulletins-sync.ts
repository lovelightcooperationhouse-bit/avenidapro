import { createClient } from "@/lib/supabase/client";
import { MARK_CLASS, MARK_COMPO, SEMESTERS, computeClass, distinctionFor, maquetteFor, round2, semesterRange, appreciation, type BulletinExtras, type BulletinStudent, type GradeRow, type MaquetteSubject } from "@/lib/bulletins";

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
  if (upserts.length) {
    const { error } = await supabase.from("grades").upsert(upserts, { onConflict: "student_id,academic_year,term,subject,evaluation_type" });
    if (error) throw new Error(error.message);
  }
  for (const d of deletes) {
    await supabase.from("grades").delete().eq("student_id", d.student_id).eq("academic_year", year).eq("term", semester).eq("subject", d.subject).eq("evaluation_type", d.type);
  }
  return upserts.length;
}

type Existing = { id: string; student_id: string; published: boolean; revision: number; general_average: number | null; rank_display: string | null; subjects_data: unknown; raw_data: { extras?: BulletinExtras } | null };

/**
 * Calcule (ou recalcule) tous les bulletins d'une classe pour un semestre : moyennes, produits, rangs,
 * classement, distinctions et assiduité. Les données saisies à la main (sanctions, distinction, remarque)
 * sont conservées. Un bulletin déjà publié dont le résultat change devient « rectifié » (famille prévenue).
 */
export async function recalcClass(cls: string, semester: number, year: string) {
  const supabase = createClient();
  const { students, program, maquette, grades } = await loadClass(cls, semester, year);
  if (!students.length) return { count: 0, rectified: 0 };
  const ids = students.map((x) => x.id);
  const [from, to] = semesterRange(year, semester);
  const [{ data: att }, { data: ex }] = await Promise.all([
    supabase.from("student_attendance").select("student_id, status").in("student_id", ids).gte("date", from).lte("date", to).neq("status", "present"),
    supabase.from("report_cards").select("id, student_id, published, revision, general_average, rank_display, subjects_data, raw_data").in("student_id", ids).eq("term", semester).eq("academic_year", year),
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
    const unjust = mine.filter((a) => a.status === "absent").length;
    const changed = !!old && (Number(old.general_average) !== c.average || old.rank_display !== (c.rank?.display ?? null) || JSON.stringify(old.subjects_data) !== JSON.stringify(c.lines));
    if (old?.published && changed) rectified += 1;
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
      absences_justified: mine.filter((a) => a.status === "permission").length,
      lates_count: mine.filter((a) => a.status === "retard").length,
      mention: appreciation(c.average),
      conduct_appreciation: extras.sanctions?.blame_conduite || extras.sanctions?.avertissement_conduite ? "À améliorer" : unjust <= 2 ? "Bonne" : "À surveiller",
      director_comment: extras.remark ?? null,
      bulletin_number: `BUL-${year.slice(2, 4)}S${semester}-${c.student.registration_number ?? c.student.id.slice(0, 6)}`,
      issue_date: new Date().toISOString().slice(0, 10),
      raw_data: { ...(old?.raw_data ?? {}), extras, model: "avenida-semestre" },
      revision: (old?.revision ?? 0) + (old?.published && changed ? 1 : 0),
    };
  });
  const { error } = await supabase.from("report_cards").upsert(rows, { onConflict: "student_id,academic_year,term" });
  if (error) throw new Error(error.message);
  // Élèves sans aucune note : leur ancien bulletin éventuel n'est plus valable
  const without = students.filter((s) => !computed.some((c) => c.student.id === s.id)).map((s) => existing.get(s.id)?.id).filter(Boolean) as string[];
  if (without.length) await supabase.from("report_cards").delete().in("id", without).eq("published", false);
  return { count: rows.length, rectified };
}
