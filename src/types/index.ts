export type UserRole =
  | "super_admin"
  | "direction"
  | "administration"
  | "responsable_pedagogique"
  | "responsable_financier"
  | "responsable_hotel"
  | "ressources_humaines"
  | "professeur"
  | "personnel_hotel"
  | "comptable"
  | "eleve";

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  site: string;
}

export type DiplomeCode = "CFA" | "CAP" | "BEP" | "BT" | "BTS";

export interface Program {
  id: string;
  code: DiplomeCode;
  name: string;
  duration_years: number;
  entry_level: string;
  annual_tuition: number;
  registration_fee: number;
  supplies_fee: number;
  specialties: string[];
}

export interface Student {
  id: string;
  registration_number: string; // e.g. "814AVN-24"
  student_number: string;
  first_name: string;
  last_name: string;
  gender: "M" | "F";
  birth_date: string;
  birth_place: string;
  nationality: string;
  residence_neighborhood: string;
  phone: string;
  email: string;
  boarder_status: "interne" | "externe";
  emergency_contact_name: string;
  emergency_contact_phone: string;
  program_code: DiplomeCode;
  class_name: string;
  academic_year: string;
  status: "actif" | "abandon" | "diplômé" | "exclu";
  photo_url: string;
  total_fee: number;
  paid_fee: number;
  remaining_fee: number;
}

export type RoomStatus =
  | "disponible"
  | "occupée"
  | "réservée"
  | "nettoyage"
  | "maintenance"
  | "hors_service";

export interface HotelRoom {
  id: string;
  room_number: string;
  floor: number;
  room_type: string;
  price_per_night: number;
  status: RoomStatus;
  current_guest?: string;
}

export interface PaymentReceipt {
  id: string;
  reference: string; // e.g. "#AV2022-3486"
  student_name: string;
  student_matricule: string;
  class_name: string;
  designation: string;
  amount_paid: number;
  total_due: number;
  remaining_due: number;
  depositor_name: string;
  depositor_id_card: string;
  depositor_phone: string;
  depositor_role: string;
  payment_method: "Espèces" | "Stripe" | "Mobile Money" | "Virement";
  site: string;
  date: string;
  cashier_name: string;
}

export interface AbsenceTicket {
  id: string;
  ticket_number: number;
  student_name: string;
  class_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  is_authorized: boolean;
  parent_justified: boolean;
  visa_vie_scolaire: boolean;
}

export interface LateTicket {
  id: string;
  ticket_number: number;
  student_name: string;
  class_name: string;
  duration_minutes: number;
  reason: string;
  destination: "classe" | "permanence";
  visa_vie_scolaire: boolean;
  date: string;
}

export type EmployeeSector = "ecole" | "hotel";

export interface Employee {
  id: string;
  matricule: string; // ex: "AVN-ENS-001" or "AVN-HOT-002"
  first_name: string;
  last_name: string;
  gender: "M" | "F";
  birth_date: string;
  nationality: string;
  phone: string;
  email: string;
  neighborhood: string; // ex: "Tokoin", "Dékon", "Bè", "Agoè"
  photo_url?: string;
  sector: EmployeeSector; // "ecole" pour Professeurs / Formateurs, "hotel" pour Personnel Hôtel
  role_title: string; // ex: "Chef Instructeur Cuisine", "Professeur Gestion Hôtelière", "Réceptionniste en Chef", "Gouvernante Générale"
  department: string; // ex: "Pédagogie & Arts Culinaires", "Hébergement & Réception", "Administration", "Restauration"
  specialty?: string; // ex: "Cuisine Française & Africaine", "Pâtisserie Fine", "Œnologie & Bar", "Gestion Hôtelière"
  contract_type: "CDI" | "CDD" | "Vacation" | "Stage Professionnel";
  hire_date: string; // Date de recrutement / reçu le
  contract_duration: string; // ex: "Indéterminée (CDI)", "12 mois (Renouvelable)", "6 mois", "Volume horaire (20h/sem)"
  contract_end_date?: string; // Date de fin de contrat pour CDD/Vacations
  base_salary: number; // en F CFA
  cnss_number?: string;
  cv_summary: string; // Parcours professionnel résumé
  highest_degree: string; // Diplôme le plus élevé (ex: "Master Management Hôtelier", "BTS Cuisine & Arts de la Table", "Licence Pro Tourisme")
  experience_years: number;
  status: "actif" | "congé" | "formation" | "inactif";
}

export interface GradeRecord {
  id: string;
  student_name: string;
  student_matricule: string;
  class_name: string;
  subject: string;
  evaluation_type: "Devoir Écrit" | "Pratique Cuisine" | "Pratique Hôtel" | "Examen Blanc";
  score: number; // sur 20
  coefficient: number;
  date: string;
  teacher_name: string;
  appreciation: string;
}

export interface HotelReservation {
  id: string;
  booking_ref: string; // ex: "RES-2026-089"
  customer_name: string;
  customer_phone: string;
  room_number: string;
  room_type: string;
  check_in: string;
  check_out: string;
  nights_count: number;
  nightly_rate: number;
  total_price: number;
  deposit_paid: number;
  payment_status: "réglé" | "acompte" | "en_attente";
  status: "confirmée" | "en_cours" | "terminée" | "annulée";
}

export interface HotelCustomer {
  id: string;
  code: string; // ex: "CLT-0042"
  full_name: string;
  company?: string;
  phone: string;
  email: string;
  nationality: string;
  id_card_or_passport: string;
  total_stays: number;
  total_spent: number;
  is_vip: boolean;
  created_at: string;
}

export interface SalaryRecord {
  id: string;
  slip_ref: string; // ex: "PAY-2026-10-04"
  employee_id: string;
  employee_name: string;
  employee_matricule: string;
  sector: EmployeeSector;
  role_title: string;
  period_month: string; // ex: "Octobre 2026"
  base_salary: number;
  bonuses: number;
  cnss_deduction: number;
  net_payable: number;
  payment_method: "Virement Bancaire" | "Chèque" | "Espèces" | "T-Money / Flooz";
  payment_date: string;
  status: "payé" | "validé" | "en_attente";
}

export interface InventoryItem {
  id: string;
  code: string; // ex: "STK-CUIS-012"
  name: string;
  category: "Cuisine & Épicerie" | "Boissons & Bar" | "Lingerie & Produits d'Entretien" | "Fournitures Scolaires & Bureautique";
  quantity: number;
  unit: string; // "kg", "carton", "bouteille", "lot", "pièce"
  min_alert_threshold: number;
  unit_price: number;
  supplier: string;
  last_restock_date: string;
  location: string; // "Économat Principal", "Cave Hôtel", "Magasin Cuisine"
}

export interface FinancialEntry {
  id: string;
  reference: string; // ex: "FIN-2026-102"
  type: "recette" | "depense";
  category: "Écolages Scolaires" | "Hébergement Hôtel" | "Restauration & Bar" | "Approvisionnement Cuisine" | "Électricité CEET" | "Eau TdE" | "Maintenance & Travaux" | "Salaires & Charges";
  description: string;
  amount: number;
  date: string;
  recorded_by: string;
  payment_mode: "Espèces" | "Chèque" | "Virement" | "Mobile Money";
  receipt_number?: string;
}

