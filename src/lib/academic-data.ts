// ============================================================
// DONNÉES ACADÉMIQUES CENTRALISÉES — Hôtel École Avenida Lomé
// ============================================================

/** Année scolaire avec label, valeur, et statut */
export interface AcademicYear {
  value: string;       // ex: "2026-2027"
  label: string;       // ex: "2026 - 2027"
  status: "passée" | "en_cours" | "à_venir";
}

/**
 * Génère dynamiquement les années scolaires disponibles.
 * Inclut 2 années passées, l'année en cours, et 3 années à venir.
 */
export function getAcademicYears(): AcademicYear[] {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  // L'année scolaire commence en septembre (mois 8)
  // Si on est entre janvier et août, l'année scolaire en cours a commencé l'année précédente
  const schoolStartYear = currentMonth >= 8 ? currentYear : currentYear - 1;

  const years: AcademicYear[] = [];

  // 2 années passées + année en cours + 3 années à venir = 6 années
  for (let offset = -2; offset <= 3; offset++) {
    const startYear = schoolStartYear + offset;
    const endYear = startYear + 1;
    const value = `${startYear}-${endYear}`;
    const label = `${startYear} - ${endYear}`;

    let status: AcademicYear["status"];
    if (offset < 0) status = "passée";
    else if (offset === 0) status = "en_cours";
    else status = "à_venir";

    years.push({ value, label, status });
  }

  return years;
}

/** Retourne l'année scolaire en cours par défaut */
export function getCurrentAcademicYear(): string {
  const years = getAcademicYears();
  const current = years.find((y) => y.status === "en_cours");
  return current?.value || years[0].value;
}

// ============================================================
// PROGRAMMES, NIVEAUX & CLASSES
// ============================================================

export type DiplomeCode = "CFA" | "CAP" | "BEP" | "BT" | "BTS";

export interface AcademicDepartment {
  id: string;
  name: string;
  shortName: string;
  code: "arts_culinaires" | "hebergement" | "restauration" | "management";
  description: string;
  icon: string;
  badgeColor: string;
  headOfDepartment: string;
  associatedSpecialties: string[];
}

export const ACADEMIC_DEPARTMENTS: AcademicDepartment[] = [
  {
    id: "dept_culinaire",
    code: "arts_culinaires",
    name: "Département Arts Culinaires & Métiers de Bouche",
    shortName: "Arts Culinaires",
    description: "Cuisine gastronomique, pâtisserie fine, boulangerie et boucherie/charcuterie.",
    icon: "UtensilsCrossed",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    headOfDepartment: "Chef M. Koffi (Maître Cuisinier)",
    associatedSpecialties: [
      "Cuisine",
      "Pâtisserie",
      "Cuisine / Pâtisserie",
      "Boucherie / Charcuterie",
    ],
  },
  {
    id: "dept_hebergement",
    code: "hebergement",
    name: "Département Hébergement & Accueil Hôtelier",
    shortName: "Hébergement & Accueil",
    description: "Réception hôtel, conciergerie, gouvernance d'étage et service lingerie/buanderie.",
    icon: "BedDouble",
    badgeColor: "bg-blue-100 text-[#0C356A] border-blue-300",
    headOfDepartment: "Mme. Akofa (Gouvernante Générale)",
    associatedSpecialties: [
      "Hébergement",
      "Réception / Étage",
      "Lingerie / Buanderie",
    ],
  },
  {
    id: "dept_restauration",
    code: "restauration",
    name: "Département Restauration & Arts de la Table",
    shortName: "Restauration & Salle",
    description: "Service de salle, bar contemporain, mixologie, œnologie et sommellerie.",
    icon: "Wine",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    headOfDepartment: "M. Mensah (Maître d'Hôtel)",
    associatedSpecialties: [
      "Restauration",
      "Restaurant / Bar",
      "Sommellerie",
    ],
  },
  {
    id: "dept_management",
    code: "management",
    name: "Département Management, Gestion & Tourisme",
    shortName: "Management & Tourisme",
    description: "Gestion hôtelière avancée, yield management, économie du tourisme et marketing.",
    icon: "Briefcase",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    headOfDepartment: "Dr. Lawson (Directeur des Études)",
    associatedSpecialties: [
      "Gestion Hôtelière",
      "Tourisme & Loisirs",
      "Management Hôtelier",
    ],
  },
];

/**
 * Détermine automatiquement le département académique d'une spécialité
 */
export function getDepartmentForSpecialty(specialty?: string): AcademicDepartment {
  if (!specialty) return ACADEMIC_DEPARTMENTS[0];
  const specLower = specialty.toLowerCase().trim();

  if (specLower.includes("cuis") || specLower.includes("pâtiss") || specLower.includes("patiss") || specLower.includes("bouch")) {
    return ACADEMIC_DEPARTMENTS[0];
  }
  if (specLower.includes("héberg") || specLower.includes("heberg") || specLower.includes("récept") || specLower.includes("recept") || specLower.includes("étage") || specLower.includes("etage") || specLower.includes("linge")) {
    return ACADEMIC_DEPARTMENTS[1];
  }
  if (specLower.includes("restau") || specLower.includes("bar") || specLower.includes("service") || specLower.includes("sommel")) {
    return ACADEMIC_DEPARTMENTS[2];
  }
  if (specLower.includes("gest") || specLower.includes("touris") || specLower.includes("manag")) {
    return ACADEMIC_DEPARTMENTS[3];
  }

  return ACADEMIC_DEPARTMENTS[0];
}

export interface ProgramLevel {
  code: DiplomeCode;
  name: string;
  fullName: string;
  durationYears: number;
  entryLevel: string;
  annualTuition: number;
  registrationFee: number;
  suppliesFee: number;
  boardingFee: number;      // Frais internat annuel
  boardingDeposit: number;  // Caution internat
  yearLevels: string[];     // ex: ["CFA1"] ou ["BT1","BT2","BT3"]
  specialties: string[];
}

/** Catalogue complet des formations Avenida */
export const PROGRAMS: ProgramLevel[] = [
  {
    code: "CFA",
    name: "CFA",
    fullName: "Certificat de Fin d'Apprentissage (CFA)",
    durationYears: 1,
    entryLevel: "Primaire / Collège",
    annualTuition: 260000,
    registrationFee: 10000,
    suppliesFee: 45000,
    boardingFee: 300000,
    boardingDeposit: 50000,
    yearLevels: ["CFA1"],
    specialties: [
      "Cuisine",
      "Pâtisserie",
    ],
  },
  {
    code: "CAP",
    name: "CAP",
    fullName: "Certificat d'Aptitude Professionnelle (CAP)",
    durationYears: 2,
    entryLevel: "4ème ou 3ème (Collège)",
    annualTuition: 260000,
    registrationFee: 10000,
    suppliesFee: 75000,
    boardingFee: 300000,
    boardingDeposit: 50000,
    yearLevels: ["CAP1", "CAP2"],
    specialties: [
      "Cuisine / Pâtisserie",
      "Restaurant / Bar",
      "Réception / Étage",
      "Boucherie / Charcuterie",
      "Lingerie / Buanderie",
    ],
  },
  {
    code: "BEP",
    name: "BEP",
    fullName: "Brevet d'Études Professionnelles (BEP)",
    durationYears: 2,
    entryLevel: "BEPC",
    annualTuition: 330000,
    registrationFee: 10000,
    suppliesFee: 75000,
    boardingFee: 300000,
    boardingDeposit: 50000,
    yearLevels: ["BEP1", "BEP2"],
    specialties: [
      "Cuisine / Pâtisserie",
      "Restaurant / Bar",
      "Réception / Étage",
    ],
  },
  {
    code: "BT",
    name: "BT",
    fullName: "Brevet de Technicien (BT)",
    durationYears: 3,
    entryLevel: "BEPC",
    annualTuition: 330000,
    registrationFee: 10000,
    suppliesFee: 75000,
    boardingFee: 300000,
    boardingDeposit: 50000,
    yearLevels: ["BT1", "BT2", "BT3"],
    specialties: [
      "Restauration",
      "Hébergement",
    ],
  },
  {
    code: "BTS",
    name: "BTS",
    fullName: "Brevet de Technicien Supérieur (BTS)",
    durationYears: 2,
    entryLevel: "BAC ou BT",
    annualTuition: 420000,
    registrationFee: 20000,
    suppliesFee: 75000,
    boardingFee: 350000,
    boardingDeposit: 60000,
    yearLevels: ["BTS1", "BTS2"],
    specialties: [
      "Restauration",
      "Hébergement",
    ],
  },
];

/** Génère le nom complet de la classe: ex "BEP1 - Cuisine / Pâtisserie" */
export function buildClassName(yearLevel: string, specialty: string): string {
  return `${yearLevel} - ${specialty}`;
}

/** Retrouve un programme par son code */
export function getProgramByCode(code: DiplomeCode): ProgramLevel | undefined {
  return PROGRAMS.find((p) => p.code === code);
}

/** Calcul automatique du total des frais pour un élève */
export function calculateTotalFees(
  code: DiplomeCode,
  boarderStatus: "interne" | "externe"
): { registration: number; tuition: number; supplies: number; boarding: number; boardingDeposit: number; total: number } {
  const prog = getProgramByCode(code);
  if (!prog) return { registration: 0, tuition: 0, supplies: 0, boarding: 0, boardingDeposit: 0, total: 0 };

  const registration = prog.registrationFee;
  const tuition = prog.annualTuition;
  const supplies = prog.suppliesFee;
  const boarding = boarderStatus === "interne" ? prog.boardingFee : 0;
  const boardingDeposit = boarderStatus === "interne" ? prog.boardingDeposit : 0;

  return {
    registration,
    tuition,
    supplies,
    boarding,
    boardingDeposit,
    total: registration + tuition + supplies + boarding + boardingDeposit,
  };
}

// ============================================================
// NATIONALITÉS COURANTES (Afrique de l'Ouest)
// ============================================================
export const NATIONALITIES = [
  "Togolaise",
  "Béninoise",
  "Ghanéenne",
  "Nigériane",
  "Burkinabè",
  "Ivoirienne",
  "Nigérienne",
  "Sénégalaise",
  "Malienne",
  "Guinéenne",
  "Camerounaise",
  "Gabonaise",
  "Congolaise",
  "Française",
  "Autre",
];

// ============================================================
// QUARTIERS & VILLES (Lomé et environs)
// ============================================================
export const NEIGHBORHOODS = [
  "Adidogomé",
  "Agoè",
  "Agoè-Nyivé",
  "Akodessewa",
  "Aného",
  "Atakpamé",
  "Baguida",
  "Bè",
  "Bè-Kpota",
  "Bè-Klikamé",
  "Cacaveli",
  "Djidjolé",
  "Hédzranawoé",
  "Kégué",
  "Kodjoviakopé",
  "Kpalimé",
  "Lomé Centre",
  "Nyékonakpoé",
  "Tokoin",
  "Totsi",
  "Tsévié",
  "Autre",
];

/** Génération automatique du matricule */
export function generateMatricule(sequence: number, year: string): string {
  const yearSuffix = year.split("-")[0].slice(-2); // "2026-2027" → "26"
  return `${String(sequence).padStart(3, "0")}AVN-${yearSuffix}`;
}

/** Génération du numéro étudiant */
export function generateStudentNumber(sequence: number, year: string): string {
  const startYear = year.split("-")[0]; // "2026-2027" → "2026"
  return `ETU-${startYear}-${String(sequence).padStart(5, "0")}`;
}

/** Calcule dynamiquement le prochain numéro de séquence pour un nouvel élève */
export function getNextStudentSequence(existingMatricules: string[]): number {
  let maxSeq = 800;
  for (const mat of existingMatricules) {
    if (!mat) continue;
    const match = mat.match(/^(\d+)AVN/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  return maxSeq + 1;
}

