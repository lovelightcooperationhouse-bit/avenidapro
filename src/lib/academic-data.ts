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
