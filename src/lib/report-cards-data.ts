import { StudentReportCard, SubjectGrade, DiplomeCode } from "@/types";
import { ALL_REAL_STUDENTS } from "@/lib/real-students";

// =========================================================================
// MATIÈRES ET PROGRAMMES OFFICIELS DE FORMATION — AVENIDA LOMÉ
// =========================================================================

export interface CurriculumSubject {
  code: string;
  name: string;
  category: "Pôle Pratique & Professionnel" | "Pôle Gestion & Technologie" | "Pôle Langues & Général";
  coefficient: number;
  teacher_name: string;
}

export const CURRICULUM_BY_PROGRAM: Record<DiplomeCode, CurriculumSubject[]> = {
  BTS: [
    {
      code: "BTS-PRAT",
      name: "Travaux Pratiques Cuisine & Gastronomie",
      category: "Pôle Pratique & Professionnel",
      coefficient: 4,
      teacher_name: "Chef KOUASSI Mawuli",
    },
    {
      code: "BTS-TECH",
      name: "Technologie Culinaire & Hygiène HACCP",
      category: "Pôle Pratique & Professionnel",
      coefficient: 3,
      teacher_name: "Chef KOUASSI Mawuli",
    },
    {
      code: "BTS-GEST",
      name: "Gestion Hôtelière & Logiciels PMS",
      category: "Pôle Gestion & Technologie",
      coefficient: 3,
      teacher_name: "Mme AGBOBLI Amivi Sylvie",
    },
    {
      code: "BTS-SERV",
      name: "Service en Salle, Bar & Sommellerie",
      category: "Pôle Pratique & Professionnel",
      coefficient: 3,
      teacher_name: "Mme TCHALLA Essi Nadia",
    },
    {
      code: "BTS-PAT",
      name: "Pâtisserie Fine & Desserts de Restaurant",
      category: "Pôle Pratique & Professionnel",
      coefficient: 2,
      teacher_name: "M. LAWSON Boèvi Éric",
    },
    {
      code: "BTS-ANG",
      name: "Anglais Professionnel Hôtelier & Tourisme",
      category: "Pôle Langues & Général",
      coefficient: 2,
      teacher_name: "M. ADANLETE Koffi Jean",
    },
    {
      code: "BTS-ECO",
      name: "Économie Touristique & Droit Hôtelier",
      category: "Pôle Gestion & Technologie",
      coefficient: 2,
      teacher_name: "Mme AGBOBLI Amivi Sylvie",
    },
    {
      code: "BTS-COM",
      name: "Communication & Expression Professionnelle",
      category: "Pôle Langues & Général",
      coefficient: 1,
      teacher_name: "M. ADANLETE Koffi Jean",
    },
  ],
  CAP: [
    {
      code: "CAP-CUIS",
      name: "Pratique Culinaire & Cuissons de Base",
      category: "Pôle Pratique & Professionnel",
      coefficient: 4,
      teacher_name: "Chef KOUASSI Mawuli",
    },
    {
      code: "CAP-PAT",
      name: "Pâtisserie & Viennoiserie",
      category: "Pôle Pratique & Professionnel",
      coefficient: 3,
      teacher_name: "M. LAWSON Boèvi Éric",
    },
    {
      code: "CAP-HYG",
      name: "Hygiène, Santé & Sécurité Alimentaire",
      category: "Pôle Gestion & Technologie",
      coefficient: 2,
      teacher_name: "Chef KOUASSI Mawuli",
    },
    {
      code: "CAP-SAL",
      name: "Service en Salle & Dressage des Tables",
      category: "Pôle Pratique & Professionnel",
      coefficient: 2,
      teacher_name: "Mme TCHALLA Essi Nadia",
    },
    {
      code: "CAP-FRA",
      name: "Français & Vocabulaire de Restauration",
      category: "Pôle Langues & Général",
      coefficient: 2,
      teacher_name: "M. ADANLETE Koffi Jean",
    },
    {
      code: "CAP-MATH",
      name: "Mathématiques Appliquées & Facturation",
      category: "Pôle Gestion & Technologie",
      coefficient: 2,
      teacher_name: "Mme AGBOBLI Amivi Sylvie",
    },
    {
      code: "CAP-ANG",
      name: "Anglais Pratique d'Accueil",
      category: "Pôle Langues & Général",
      coefficient: 1,
      teacher_name: "M. ADANLETE Koffi Jean",
    },
  ],
  BEP: [
    {
      code: "BEP-PRAT",
      name: "Travaux Pratiques Cuisine & Traiteur",
      category: "Pôle Pratique & Professionnel",
      coefficient: 4,
      teacher_name: "Chef KOUASSI Mawuli",
    },
    {
      code: "BEP-REST",
      name: "Technologie Restaurant & Bar",
      category: "Pôle Pratique & Professionnel",
      coefficient: 3,
      teacher_name: "Mme TCHALLA Essi Nadia",
    },
    {
      code: "BEP-GEST",
      name: "Gestion des Approvisionnements & Caisse",
      category: "Pôle Gestion & Technologie",
      coefficient: 2,
      teacher_name: "Mme AGBOBLI Amivi Sylvie",
    },
    {
      code: "BEP-SCI",
      name: "Sciences Appliquées à l'Alimentation",
      category: "Pôle Gestion & Technologie",
      coefficient: 2,
      teacher_name: "Chef KOUASSI Mawuli",
    },
    {
      code: "BEP-ANG",
      name: "Anglais Professionnel Hôtelier",
      category: "Pôle Langues & Général",
      coefficient: 2,
      teacher_name: "M. ADANLETE Koffi Jean",
    },
    {
      code: "BEP-FRA",
      name: "Français & Correspondance Hôtelière",
      category: "Pôle Langues & Général",
      coefficient: 2,
      teacher_name: "M. ADANLETE Koffi Jean",
    },
  ],
  BT: [
    {
      code: "BT-REST",
      name: "Technique Culinaire Supérieure & Banqueting",
      category: "Pôle Pratique & Professionnel",
      coefficient: 4,
      teacher_name: "Chef KOUASSI Mawuli",
    },
    {
      code: "BT-HEB",
      name: "Technologie d'Hébergement & Réception",
      category: "Pôle Pratique & Professionnel",
      coefficient: 3,
      teacher_name: "M. MENSAH Yao Richard",
    },
    {
      code: "BT-GEST",
      name: "Contrôle de Gestion & Économat",
      category: "Pôle Gestion & Technologie",
      coefficient: 3,
      teacher_name: "Mme AGBOBLI Amivi Sylvie",
    },
    {
      code: "BT-ANG",
      name: "Anglais de Communication Hôtelière",
      category: "Pôle Langues & Général",
      coefficient: 2,
      teacher_name: "M. ADANLETE Koffi Jean",
    },
    {
      code: "BT-INF",
      name: "Informatique & Outils de Réservation",
      category: "Pôle Gestion & Technologie",
      coefficient: 2,
      teacher_name: "Mme AGBOBLI Amivi Sylvie",
    },
  ],
  CFA: [
    {
      code: "CFA-CUIS",
      name: "Pratique Apprentissage Cuisine & Commis",
      category: "Pôle Pratique & Professionnel",
      coefficient: 5,
      teacher_name: "Chef KOUASSI Mawuli",
    },
    {
      code: "CFA-PAT",
      name: "Bases de la Pâtisserie & Entremets",
      category: "Pôle Pratique & Professionnel",
      coefficient: 3,
      teacher_name: "M. LAWSON Boèvi Éric",
    },
    {
      code: "CFA-HYG",
      name: "Propreté & Nettoyage en Cuisine",
      category: "Pôle Gestion & Technologie",
      coefficient: 2,
      teacher_name: "Chef KOUASSI Mawuli",
    },
    {
      code: "CFA-CALC",
      name: "Calculs Professionnels & Dosages",
      category: "Pôle Gestion & Technologie",
      coefficient: 2,
      teacher_name: "Mme AGBOBLI Amivi Sylvie",
    },
    {
      code: "CFA-FRA",
      name: "Vocabulaire Culinaire & Expression",
      category: "Pôle Langues & Général",
      coefficient: 2,
      teacher_name: "M. ADANLETE Koffi Jean",
    },
  ],
};

// =========================================================================
// MOTEUR DE CALCUL DES MOYENNES, MENTIONS ET CLASSEMENTS
// =========================================================================

export function getMentionAndDecision(average: number): {
  mention: StudentReportCard["appreciation_mention"];
  decision: string;
} {
  if (average >= 16) {
    return {
      mention: "Très Bien",
      decision: "Félicitations du Conseil de Classe",
    };
  }
  if (average >= 14) {
    return {
      mention: "Bien",
      decision: "Tableau d'Honneur accordé",
    };
  }
  if (average >= 12) {
    return {
      mention: "Assez Bien",
      decision: "Encouragements du Conseil de Classe",
    };
  }
  if (average >= 10) {
    return {
      mention: "Passable",
      decision: "Admis(e) — Poursuite régulière",
    };
  }
  if (average >= 8.5) {
    return {
      mention: "Insuffisant",
      decision: "Avertissement de travail — Soutien pédagogique requis",
    };
  }
  return {
    mention: "Médiocre",
    decision: "Blâme de travail — Risque sérieux de redoublement",
  };
}

export function formatRank(rank: number, gender: "M" | "F" = "M"): string {
  if (rank === 1) {
    return gender === "F" ? "1ère" : "1er";
  }
  return `${rank}ème`;
}

/**
 * Calcule et synchronise les classements de tous les bulletins d'une classe pour une période donnée.
 * Classe automatiquement toutes les moyennes par ordre décroissant (du 1er au dernier).
 */
export function calculateClassRankings(cards: StudentReportCard[]): StudentReportCard[] {
  if (cards.length === 0) return [];

  // Grouper par classe et période
  const groups: Record<string, StudentReportCard[]> = {};
  cards.forEach((card) => {
    const key = `${card.class_name}__${card.period}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  });

  const updatedCards: StudentReportCard[] = [];

  Object.values(groups).forEach((classCards) => {
    const totalStudents = classCards.length;

    // Calculer les totaux de chaque élève d'abord
    const scoredCards = classCards.map((card) => {
      const totalCoeffs = card.subjects.reduce((sum, s) => sum + s.coefficient, 0);
      const totalPoints = card.subjects.reduce(
        (sum, s) => sum + Number((s.score * s.coefficient).toFixed(2)),
        0
      );
      const genAvg = Number((totalPoints / (totalCoeffs || 1)).toFixed(2));
      const { mention, decision } = getMentionAndDecision(genAvg);

      return {
        ...card,
        total_students: totalStudents,
        total_coefficients: totalCoeffs,
        total_points: Number(totalPoints.toFixed(2)),
        general_average: genAvg,
        appreciation_mention: mention,
        council_decision: decision,
      };
    });

    // Trier par moyenne générale décroissante
    scoredCards.sort((a, b) => b.general_average - a.general_average);

    const averages = scoredCards.map((c) => c.general_average);
    const classHighest = Math.max(...averages);
    const classLowest = Math.min(...averages);
    const classAvg = Number(
      (averages.reduce((sum, a) => sum + a, 0) / (averages.length || 1)).toFixed(2)
    );

    // Statistiques par matière
    const subjectStats: Record<string, { min: number; max: number; avg: number; scores: { id: string; score: number }[] }> = {};
    scoredCards.forEach((c) => {
      c.subjects.forEach((sub) => {
        if (!subjectStats[sub.subject_code]) {
          subjectStats[sub.subject_code] = { min: 20, max: 0, avg: 0, scores: [] };
        }
        subjectStats[sub.subject_code].scores.push({ id: c.id, score: sub.score });
      });
    });

    Object.keys(subjectStats).forEach((code) => {
      const sc = subjectStats[code].scores.map((s) => s.score);
      subjectStats[code].min = Math.min(...sc);
      subjectStats[code].max = Math.max(...sc);
      subjectStats[code].avg = Number(
        (sc.reduce((acc, v) => acc + v, 0) / (sc.length || 1)).toFixed(2)
      );
      // Trier pour obtenir les rangs par matière
      subjectStats[code].scores.sort((a, b) => b.score - a.score);
    });

    // Attribuer les rangs généraux et mettre à jour les statistiques de matière
    let currentRank = 1;
    scoredCards.forEach((c, idx) => {
      if (idx > 0 && c.general_average < scoredCards[idx - 1].general_average) {
        currentRank = idx + 1;
      }

      c.rank = currentRank;
      c.rank_display = formatRank(currentRank, c.gender);
      c.class_general_average = classAvg;
      c.class_highest_average = classHighest;
      c.class_lowest_average = classLowest;

      c.subjects = c.subjects.map((sub) => {
        const stats = subjectStats[sub.subject_code];
        let subRank = 1;
        if (stats) {
          const matchIdx = stats.scores.findIndex((s) => s.id === c.id);
          subRank = matchIdx >= 0 ? matchIdx + 1 : 1;
        }
        return {
          ...sub,
          class_min: stats ? stats.min : sub.score,
          class_max: stats ? stats.max : sub.score,
          class_avg: stats ? stats.avg : sub.score,
          subject_rank: subRank,
        };
      });

      updatedCards.push(c);
    });
  });

  return updatedCards;
}

// =========================================================================
// DONNÉES INITIALES RÉALISTES POUR BTS1 - RESTAURATION & CAP
// =========================================================================

function generateDefaultBTSCards(): StudentReportCard[] {
  const btsStudents = ALL_REAL_STUDENTS.slice(0, 2);

  const curriculum = CURRICULUM_BY_PROGRAM.BTS;

  // 2 Profils de notes prédéfinis pour les 2 élèves de test
  const scoreProfiles = [
    [17.5, 16.0, 17.0, 16.5, 17.0, 16.0, 15.5, 16.0], // 1ère (~16.5)
    [15.0, 14.5, 15.0, 14.0, 14.5, 15.0, 13.5, 14.0], // 2ème (~14.4)
  ];

  const rawCards: StudentReportCard[] = btsStudents.map((st, i) => {
    const profile = scoreProfiles[i] || [12, 12, 12, 12, 12, 12, 12, 12];
    const comments = [
      "Excellent travail, maîtrise exemplaire des techniques culinaires et dressage raffiné.",
      "Très bon niveau d'assimilation, participation active et rigueur dans les préparations.",
      "Bon travail d'ensemble, régulier et sérieux. Continuer sur cette lancée.",
      "Résultats satisfaisants. Bon investissement pratique, approfondir la gestion théorique.",
      "Ensemble convenable. Veiller à la rapidité d'exécution et au respect strict des fiches techniques.",
      "Travail sérieux mais des progrès sont encore possibles en gestion des coûts.",
      "Niveau moyen. Doit faire preuve de plus d'assurance et d'autonomie au poste.",
      "Résultats justes. Accentuer les révisions et la pratique en service.",
    ];

    const subjects: SubjectGrade[] = curriculum.map((cur, sIdx) => ({
      id: `sub-${st.id}-${cur.code}`,
      subject_code: cur.code,
      subject_name: cur.name,
      category: cur.category,
      coefficient: cur.coefficient,
      score: profile[sIdx] || 12,
      teacher_name: cur.teacher_name,
      teacher_comment: comments[sIdx % comments.length],
    }));

    const totalCoeffs = subjects.reduce((sum, s) => sum + s.coefficient, 0);
    const totalPoints = subjects.reduce((sum, s) => sum + s.score * s.coefficient, 0);
    const genAvg = Number((totalPoints / totalCoeffs).toFixed(2));
    const { mention, decision } = getMentionAndDecision(genAvg);

    return {
      id: `rep-${st.id}`,
      bulletin_number: `BUL-2025-BTS1-${String(i + 1).padStart(2, "0")}`,
      student_id: st.id,
      student_name: `${st.last_name} ${st.first_name}`,
      student_matricule: st.registration_number,
      student_number: st.student_number,
      gender: st.gender,
      birth_date: st.birth_date,
      birth_place: st.birth_place,
      nationality: st.nationality,
      photo_url: st.photo_url,
      class_name: st.class_name || "BTS1 - Restauration",
      program_code: "BTS",
      academic_year: "2024 - 2025",
      period: "Semestre 1",
      total_students: btsStudents.length,
      subjects: subjects,
      total_coefficients: totalCoeffs,
      total_points: totalPoints,
      general_average: genAvg,
      class_general_average: 12.8,
      class_highest_average: 16.5,
      class_lowest_average: 8.1,
      rank: i + 1,
      rank_display: formatRank(i + 1, st.gender),
      appreciation_mention: mention,
      council_decision: decision,
      absences_unjustified: i % 3 === 0 ? 0 : i % 2,
      absences_justified: i % 2 === 0 ? 0 : 2,
      lates_count: i % 4 === 0 ? 1 : 0,
      conduct_appreciation: "Conduite et discipline exemplaires au restaurant d'application.",
      principal_teacher_name: "Chef KOUASSI Mawuli",
      principal_teacher_comment:
        genAvg >= 14
          ? "Trimestre remarquable ! Élève exemplaire, rigoureux et passionné par les arts de la table."
          : genAvg >= 10
          ? "Trimestre satisfaisant. Bon potentiel professionnel qui s'exprime lors des travaux pratiques."
          : "Doit redoubler d'efforts et de concentration pour valider les compétences requises.",
      director_comment:
        genAvg >= 14
          ? "Félicitations de la Direction Générale Avenida. Poursuivez dans cette voie d'excellence."
          : "Encouragements de la Direction. Travaillez avec régularité.",
      issue_date: "Lomé, le 28 Janvier 2025",
    };
  });

  return calculateClassRankings(rawCards);
}

// Initialise et retourne les bulletins avec classement
export const INITIAL_REPORT_CARDS: StudentReportCard[] = generateDefaultBTSCards();

// =========================================================================
// GESTION DU STOCKAGE LOCAL (PERSISTENCE)
// =========================================================================

const STORAGE_KEY = "avenida_report_cards_v3";

export function getReportCardsFromStorage(): StudentReportCard[] {
  if (typeof window === "undefined") return INITIAL_REPORT_CARDS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REPORT_CARDS));
      return INITIAL_REPORT_CARDS;
    }
    const parsed = JSON.parse(data);
    const limited = Array.isArray(parsed) && parsed.length > 2 ? parsed.slice(0, 2) : parsed;
    return calculateClassRankings(limited);
  } catch (err) {
    console.error("Erreur lecture local storage report cards:", err);
    return INITIAL_REPORT_CARDS;
  }
}

export function saveReportCardsToStorage(cards: StudentReportCard[]): void {
  if (typeof window === "undefined") return;
  try {
    const ranked = calculateClassRankings(cards);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ranked));
  } catch (err) {
    console.error("Erreur sauvegarde report cards:", err);
  }
}

export function upsertReportCard(card: StudentReportCard): StudentReportCard[] {
  const current = getReportCardsFromStorage();
  const index = current.findIndex(
    (c) =>
      c.id === card.id ||
      (c.student_matricule === card.student_matricule &&
        c.period === card.period &&
        c.academic_year === card.academic_year)
  );

  let updated: StudentReportCard[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...card, id: current[index].id };
  } else {
    updated = [card, ...current];
  }

  const ranked = calculateClassRankings(updated);
  saveReportCardsToStorage(ranked);
  return ranked;
}

export function createBlankReportCardForStudent(
  studentId: string,
  period: StudentReportCard["period"] = "Semestre 1",
  academicYear: string = "2024 - 2025"
): StudentReportCard {
  const st = ALL_REAL_STUDENTS.find((s) => s.id === studentId) || ALL_REAL_STUDENTS[0];
  const progCode = (st.program_code || "BTS") as DiplomeCode;
  const curriculum = CURRICULUM_BY_PROGRAM[progCode] || CURRICULUM_BY_PROGRAM.BTS;

  const subjects: SubjectGrade[] = curriculum.map((c) => ({
    id: `sub-${st.id}-${c.code}-${Date.now()}`,
    subject_code: c.code,
    subject_name: c.name,
    category: c.category,
    coefficient: c.coefficient,
    score: 12,
    teacher_name: c.teacher_name,
    teacher_comment: "Travail régulier.",
  }));

  const totalCoeffs = subjects.reduce((sum, s) => sum + s.coefficient, 0);
  const totalPoints = subjects.reduce((sum, s) => sum + s.score * s.coefficient, 0);
  const genAvg = Number((totalPoints / totalCoeffs).toFixed(2));
  const { mention, decision } = getMentionAndDecision(genAvg);

  return {
    id: `rep-${st.id}-${Date.now()}`,
    bulletin_number: `BUL-${academicYear.split(" ")[0]}-${st.program_code}-${Math.floor(
      10 + Math.random() * 90
    )}`,
    student_id: st.id,
    student_name: `${st.last_name} ${st.first_name}`,
    student_matricule: st.registration_number,
    student_number: st.student_number,
    gender: st.gender,
    birth_date: st.birth_date,
    birth_place: st.birth_place,
    nationality: st.nationality,
    photo_url: st.photo_url,
    class_name: st.class_name,
    program_code: progCode,
    academic_year: academicYear,
    period: period,
    total_students: 1,
    subjects: subjects,
    total_coefficients: totalCoeffs,
    total_points: totalPoints,
    general_average: genAvg,
    class_general_average: genAvg,
    class_highest_average: genAvg,
    class_lowest_average: genAvg,
    rank: 1,
    rank_display: formatRank(1, st.gender),
    appreciation_mention: mention,
    council_decision: decision,
    absences_unjustified: 0,
    absences_justified: 0,
    lates_count: 0,
    conduct_appreciation: "Bonne tenue en cours et aux travaux pratiques.",
    principal_teacher_name: "Chef KOUASSI Mawuli",
    principal_teacher_comment: "Bon travail d'ensemble.",
    director_comment: "Encouragements du conseil de classe.",
    issue_date: `Lomé, le ${new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
  };
}
