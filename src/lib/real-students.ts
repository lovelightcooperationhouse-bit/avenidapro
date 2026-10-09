import { Student } from "@/types";

// =========================================================================
// BASE DE DONNÉES OFFICIELLE DES ÉLÈVES — HÔTEL ÉCOLE AVENIDA LOMÉ
// Réduite rigoureusement à 2 entrées de test pour des statistiques propres
// =========================================================================

// Quartiers représentatifs de Lomé pour les adresses
export const LOME_NEIGHBORHOODS = [
  "Dékon",
  "Tokoin Habitat",
  "Bè-Kpota",
  "Hedzranawoé",
  "Adidogomé",
  "Agoè-Assiyéyé",
  "Kodjoviakopé",
  "Nyékonakpoè",
  "Totsi",
  "Kégué",
  "Amoutivé",
  "Agbalépédogan",
];

// -------------------------------------------------------------------------
// PROMOTION OFFICIELLE : 2 ÉLÈVES DE TEST (1 Fille, 1 Garçon)
// -------------------------------------------------------------------------
export const STUDENTS_2024_2025: Student[] = [
  {
    id: "std-801avn-24",
    registration_number: "801AVN-24",
    student_number: "ETU-2024-00801",
    last_name: "AFOLEHO",
    first_name: "Essi",
    gender: "F",
    birth_date: "2005-04-12",
    birth_place: "Lomé",
    nationality: "Togolaise",
    residence_neighborhood: "Dékon",
    phone: "+228 90 11 22 33",
    email: "e.afoleho@ecole-avenida.tg",
    boarder_status: "externe",
    emergency_contact_name: "AFOLEHO Koffi",
    emergency_contact_phone: "+228 90 11 22 00",
    program_code: "BTS",
    class_name: "BTS1 - Restauration",
    academic_year: "2024 - 2025",
    status: "actif",
    photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    total_fee: 420000,
    paid_fee: 420000,
    remaining_fee: 0,
  },
  {
    id: "std-802avn-24",
    registration_number: "802AVN-24",
    student_number: "ETU-2024-00802",
    last_name: "AGBAHEY",
    first_name: "Toundé Jean Chrysotome",
    gender: "M",
    birth_date: "2004-11-20",
    birth_place: "Aného",
    nationality: "Togolaise",
    residence_neighborhood: "Tokoin Habitat",
    phone: "+228 91 22 33 44",
    email: "t.agbahey@ecole-avenida.tg",
    boarder_status: "externe",
    emergency_contact_name: "AGBAHEY Michel",
    emergency_contact_phone: "+228 91 22 33 00",
    program_code: "BTS",
    class_name: "BTS1 - Restauration",
    academic_year: "2024 - 2025",
    status: "actif",
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    total_fee: 420000,
    paid_fee: 350000,
    remaining_fee: 70000,
  },
];

export const STUDENTS_2025_2026_BTS: Student[] = STUDENTS_2024_2025.map((s) => ({
  ...s,
  academic_year: "2025 - 2026",
}));

export const STUDENTS_2025_2026_MAI: Student[] = [];
export const STUDENTS_2025_2026_CAP1: Student[] = [];

export const STUDENTS_2026_2027: Student[] = STUDENTS_2024_2025.map((s) => ({
  ...s,
  academic_year: "2026 - 2027",
}));

// Table consolidée contenant strictement les 2 dossiers d'élèves
export const ALL_REAL_STUDENTS: Student[] = STUDENTS_2024_2025;
