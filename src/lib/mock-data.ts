/**
 * Données de démonstration supprimées : toutes les pages lisent uniquement les données réelles de la base.
 * Les listes restent exportées (vides) pour la compatibilité des anciens écrans.
 */
import {
  Program,
  Student,
  HotelRoom,
  PaymentReceipt,
  AbsenceTicket,
  LateTicket,
  Employee,
  GradeRecord,
  HotelReservation,
  HotelCustomer,
  SalaryRecord,
  InventoryItem,
  FinancialEntry,
} from "@/types";

// =========================================================================
// FILIÈRES & DIPLÔMES DE L'ÉCOLE AVENIDA
// =========================================================================
export const MOCK_PROGRAMS: Program[] = [];

// =========================================================================
// 1. DOSSIERS SCOLAIRES (2 ÉLÈVES DE TEST)
// =========================================================================
export const MOCK_STUDENTS: Student[] = [];

// =========================================================================
// 2. REÇUS DE CAISSE SCOLAIRE (2 REÇUS)
// =========================================================================
export const MOCK_RECEIPTS: PaymentReceipt[] = [];

// =========================================================================
// 3. CHAMBRES DE L'HÔTEL AVENIDA (2 CHAMBRES DE TEST)
// =========================================================================
export const MOCK_ROOMS: HotelRoom[] = [];

// =========================================================================
// 4. ABSENCES & RETARDS (2 ENTRÉES CHACUN)
// =========================================================================
export const MOCK_ABSENCES: AbsenceTicket[] = [];

export const MOCK_LATES: LateTicket[] = [];

// =========================================================================
// 5. COLLABORATEURS : 2 PROFESSEURS ÉCOLE + 2 PERSONNEL RH / HÔTEL
// =========================================================================
export const MOCK_EMPLOYEES: Employee[] = [];

// =========================================================================
// 6. NOTES & ÉVALUATIONS PÉDAGOGIQUES (2 ÉVALUATIONS)
// =========================================================================
export const MOCK_GRADES: GradeRecord[] = [];

// =========================================================================
// 7. RÉSERVATIONS DE SÉJOURS HÔTEL AVENIDA (2 RÉSERVATIONS)
// =========================================================================
export const MOCK_RESERVATIONS: HotelReservation[] = [];

// =========================================================================
// 8. FICHIER CLIENTS HÔTEL AVENIDA (2 CLIENTS)
// =========================================================================
export const MOCK_CUSTOMERS: HotelCustomer[] = [];

// =========================================================================
// 9. SALAIRES & PAIE F CFA (2 BULLETINS DE SALAIRE)
// =========================================================================
export const MOCK_SALARIES: SalaryRecord[] = [];

// =========================================================================
// 10. ÉCONOMAT & STOCKS (2 ARTICLES)
// =========================================================================
export const MOCK_INVENTORY: InventoryItem[] = [];

// =========================================================================
// 11. TRÉSORERIE & FINANCES (2 ÉCRITURES)
// =========================================================================
export const MOCK_FINANCES: FinancialEntry[] = [];
