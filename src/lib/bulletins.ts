/**
 * Bulletins de notes sur le modèle officiel de l'Hôtel École Avenida :
 * pour chaque matière, note de classe et note de composition (sur 20), moyenne, coefficient, produit,
 * rang dans la matière et appréciation ; puis total, moyenne semestrielle, classement et distinctions.
 */

export type SubjectGroup = "generale" | "technologique" | "pratique";
export const GROUPS: { key: SubjectGroup; label: string }[] = [
  { key: "generale", label: "Matières générales" },
  { key: "technologique", label: "Matières technologiques" },
  { key: "pratique", label: "Matières pratiques" },
];

/** Matière de la maquette (par filière, ou commune). */
export type MaquetteSubject = { id: string; program_code: string | null; name: string; grp: SubjectGroup; coefficient: number; position: number; teacher_name: string | null };

/** Types de notes du modèle. */
export const MARK_CLASS = "Classe";
export const MARK_COMPO = "Composition";

export type GradeRow = { student_id: string; subject: string | null; score: number | null; coefficient: number | null; evaluation_type: string | null; appreciation: string | null; teacher_name: string | null };

export type SubjectLine = {
  subject: string;
  group?: SubjectGroup;
  classMark?: number | null;
  compoMark?: number | null;
  coefficient: number;
  average: number;
  points: number;
  rank?: string;
  count: number;
  appreciation: string;
  teacher: string;
};

export type BulletinStudent = {
  id: string;
  first_name: string;
  last_name: string;
  registration_number: string | null;
  student_number: string | null;
  class_name: string | null;
  program_code: string | null;
  gender: string | null;
  birth_date: string | null;
  birth_place: string | null;
  nationality: string | null;
  photo_url: string | null;
};

export const SEMESTERS: Record<number, string> = { 1: "1er semestre", 2: "2e semestre" };

/** Période d'un semestre de l'année « 2026 - 2027 » : septembre–janvier, février–juillet. */
export function semesterRange(academicYear: string, semester: number): [string, string] {
  const start = parseInt(academicYear.slice(0, 4), 10) || new Date().getFullYear();
  return semester === 2 ? [`${start + 1}-02-01`, `${start + 1}-07-31`] : [`${start}-09-01`, `${start + 1}-01-31`];
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Barème d'appréciation du modèle. */
export const appreciation = (avg: number) =>
  avg < 5 ? "Très faible" : avg < 8 ? "Faible" : avg < 10 ? "Médiocre" : avg < 12 ? "Passable" : avg < 14 ? "Assez bien" : avg < 16 ? "Bien" : "Très bien";

/** Distinction proposée automatiquement (modifiable). */
export const distinctionFor = (avg: number) => (avg >= 14 ? "Tableau d'honneur et félicitations" : avg >= 12 ? "Tableau d'honneur" : "");

export const SANCTIONS = [
  { key: "avertissement_travail", label: "Avertissement pour le travail" },
  { key: "blame_travail", label: "Blâme pour le travail" },
  { key: "avertissement_conduite", label: "Avertissement pour la conduite" },
  { key: "blame_conduite", label: "Blâme pour la conduite" },
] as const;
export type SanctionKey = (typeof SANCTIONS)[number]["key"];

/** Données propres à chaque bulletin, saisies par la direction et conservées lors des recalculs. */
export type BulletinExtras = { distinction?: string; distinctionAuto?: boolean; sanctions?: Partial<Record<SanctionKey, boolean>>; remark?: string };

/** Rang avec ex æquo : « 1er », « 2e », « 3e ex æquo ». */
export function ranks(items: { id: string; average: number }[]) {
  const sorted = [...items].sort((a, b) => b.average - a.average);
  const out = new Map<string, { rank: number; display: string }>();
  sorted.forEach((s) => {
    const rank = sorted.findIndex((x) => x.average === s.average) + 1;
    const tie = sorted.filter((x) => x.average === s.average).length > 1;
    out.set(s.id, { rank, display: `${rank}${rank === 1 ? "er" : "e"}${tie ? " ex æquo" : ""}` });
  });
  return out;
}

export type ComputedBulletin = { student: BulletinStudent; lines: SubjectLine[]; coef: number; points: number; average: number; rank: { rank: number; display: string } | null };

/**
 * Calcule les bulletins d'une classe : moyenne de chaque matière (classe + composition), produit,
 * rang par matière, total des coefficients des matières notées, moyenne semestrielle et classement.
 */
export function computeClass(students: BulletinStudent[], maquette: MaquetteSubject[], grades: GradeRow[]): ComputedBulletin[] {
  const mark = (sid: string, subject: string, type: string) => {
    const g = grades.find((x) => x.student_id === sid && x.subject === subject && x.evaluation_type === type && x.score !== null);
    return g ? Number(g.score) : null;
  };
  const base = students.map((st) => {
    const lines: SubjectLine[] = [];
    for (const m of maquette) {
      const c = mark(st.id, m.name, MARK_CLASS);
      const p = mark(st.id, m.name, MARK_COMPO);
      const notes = [c, p].filter((x): x is number => x !== null);
      if (!notes.length) continue;
      const average = round2(notes.reduce((a, b) => a + b, 0) / notes.length);
      lines.push({
        subject: m.name,
        group: m.grp,
        classMark: c,
        compoMark: p,
        coefficient: Number(m.coefficient),
        average,
        points: round2(average * Number(m.coefficient)),
        count: notes.length,
        appreciation: appreciation(average),
        teacher: m.teacher_name ?? grades.find((x) => x.student_id === st.id && x.subject === m.name && x.teacher_name)?.teacher_name ?? "",
      });
    }
    const coef = lines.reduce((a, l) => a + l.coefficient, 0);
    const points = round2(lines.reduce((a, l) => a + l.points, 0));
    return { student: st, lines, coef, points, average: coef ? round2(points / coef) : 0 };
  });

  // Rang dans chaque matière
  for (const m of maquette) {
    const r = ranks(base.flatMap((b) => b.lines.filter((l) => l.subject === m.name).map((l) => ({ id: b.student.id, average: l.average }))));
    base.forEach((b) => b.lines.forEach((l) => l.subject === m.name && (l.rank = r.get(b.student.id)?.display)));
  }
  const graded = base.filter((b) => b.lines.length);
  const general = ranks(graded.map((b) => ({ id: b.student.id, average: b.average })));
  return base.map((b) => ({ ...b, rank: general.get(b.student.id) ?? null }));
}

/** Maquette d'une filière : ses matières propres, sinon la maquette commune. */
export const maquetteFor = (all: MaquetteSubject[], program: string | null) => {
  const own = all.filter((m) => m.program_code && m.program_code === program);
  return (own.length ? own : all.filter((m) => !m.program_code)).sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, "fr"));
};
