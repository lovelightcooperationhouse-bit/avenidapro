/** Calcul des bulletins trimestriels à partir des notes saisies (sur 20) et de l'assiduité. */

export type GradeRow = { student_id: string; subject: string | null; score: number | null; coefficient: number | null; evaluation_type: string | null; appreciation: string | null; teacher_name: string | null };
export type SubjectLine = { subject: string; coefficient: number; average: number; points: number; count: number; appreciation: string; teacher: string };
export type BulletinStudent = { id: string; first_name: string; last_name: string; registration_number: string | null; student_number: string | null; class_name: string | null; program_code: string | null; gender: string | null; birth_date: string | null; birth_place: string | null; nationality: string | null; photo_url: string | null };

export const TERMS: Record<number, string> = { 1: "1er trimestre", 2: "2e trimestre", 3: "3e trimestre" };

/** Période d'un trimestre de l'année scolaire « 2026 - 2027 » (oct.–déc., janv.–mars, avr.–juil.). */
export function termRange(academicYear: string, term: number) {
  const start = parseInt(academicYear.slice(0, 4), 10) || new Date().getFullYear();
  const ranges: Record<number, [string, string]> = {
    1: [`${start}-09-01`, `${start}-12-31`],
    2: [`${start + 1}-01-01`, `${start + 1}-03-31`],
    3: [`${start + 1}-04-01`, `${start + 1}-07-31`],
  };
  return ranges[term] ?? ranges[1];
}

export const mention = (avg: number) => (avg >= 16 ? "Très bien" : avg >= 14 ? "Bien" : avg >= 12 ? "Assez bien" : avg >= 10 ? "Passable" : "Insuffisant");
export const appreciationFor = (avg: number) =>
  avg >= 16 ? "Excellent travail" : avg >= 14 ? "Très bon travail" : avg >= 12 ? "Bon travail" : avg >= 10 ? "Travail satisfaisant" : avg >= 8 ? "Des efforts à fournir" : "Travail insuffisant";
export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Moyenne par matière (moyenne des évaluations) et moyenne générale pondérée par les coefficients. */
export function subjectLines(grades: GradeRow[]): SubjectLine[] {
  const by = new Map<string, GradeRow[]>();
  grades.forEach((g) => {
    if (g.score === null || g.score === undefined || !g.subject) return;
    by.set(g.subject, [...(by.get(g.subject) ?? []), g]);
  });
  return [...by.entries()]
    .map(([subject, rows]) => {
      const average = round2(rows.reduce((a, r) => a + Number(r.score), 0) / rows.length);
      const coefficient = Math.max(1, ...rows.map((r) => Number(r.coefficient ?? 1)));
      const last = rows.find((r) => r.appreciation)?.appreciation;
      return { subject, coefficient, average, points: round2(average * coefficient), count: rows.length, appreciation: last || appreciationFor(average), teacher: rows.find((r) => r.teacher_name)?.teacher_name ?? "" };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject, "fr"));
}

export function generalAverage(lines: SubjectLine[]) {
  const coef = lines.reduce((a, l) => a + l.coefficient, 0);
  const points = lines.reduce((a, l) => a + l.points, 0);
  return { coef, points: round2(points), average: coef ? round2(points / coef) : 0 };
}

/** Rang avec ex æquo : « 1er », « 2e », « 3e ex æquo ». */
export function ranks(averages: { id: string; average: number }[]) {
  const sorted = [...averages].sort((a, b) => b.average - a.average);
  const out = new Map<string, { rank: number; display: string }>();
  sorted.forEach((s) => {
    const rank = sorted.findIndex((x) => x.average === s.average) + 1;
    const tie = sorted.filter((x) => x.average === s.average).length > 1;
    out.set(s.id, { rank, display: `${rank}${rank === 1 ? "er" : "e"}${tie ? " ex æquo" : ""}` });
  });
  return out;
}
