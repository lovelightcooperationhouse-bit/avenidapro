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
  uploaded_documents?: Record<
    string,
    {
      key?: string;
      id?: string;
      name: string;
      size: number;
      formattedSize: string;
      type: string;
      dataUrl?: string;
      category?: string;
      uploadedAt?: string;
    }
  >;
  id_card_or_passport_url?: string;
  id_card_number?: string;
  address?: string;
  city?: string;
  phone_secondary?: string;
  previous_school?: string;
  last_diploma?: string;
  last_class?: string;
  average_last_year?: string;
  transfer_reason?: string;
  year_level?: string;
  specialty?: string;
  parent_father_name?: string;
  parent_father_phone?: string;
  parent_father_profession?: string;
  parent_mother_name?: string;
  parent_mother_phone?: string;
  parent_mother_profession?: string;
  tutor_name?: string;
  tutor_phone?: string;
  tutor_profession?: string;
  tutor_relation?: string;
  blood_group?: string;
  allergies?: string;
  medical_notes?: string;
  payment_method?: string;
  registration_fee?: number;
  installments_count?: number;
  payment_installments?: Array<{
    id: string;
    receipt_reference: string;
    amount: number;
    date: string;
    designation: string;
    payment_method: string;
    remaining_after: number;
  }>;
  notes?: string;
  raw_data?: Record<string, any>;
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
  guest_phone?: string;
  guest_id_card?: string;
  check_in_date?: string;
  check_out_date?: string;
  reservation_id?: string;
  paid_amount?: number;
  total_amount?: number;
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
  proof_file_name?: string;
  proof_file_url?: string;
  proof_file_size?: string;
}

export interface AbsenceTicket {
  id: string;
  ticket_number: number;
  student_id?: string;
  student_name: string;
  student_matricule?: string;
  class_name: string;
  ticket_type?: "absence" | "permission" | "dispense";
  start_date: string;
  end_date: string;
  date?: string;
  reason: string;
  is_authorized: boolean;
  parent_justified: boolean;
  is_justified?: boolean;
  visa_vie_scolaire: boolean;
}

export interface LateTicket {
  id: string;
  ticket_number: number;
  student_id?: string;
  student_name: string;
  student_matricule?: string;
  class_name: string;
  duration_minutes: number;
  minutes_late?: number;
  time_arrived?: string;
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
  uploaded_documents?: Record<
    string,
    {
      key?: string;
      id?: string;
      name: string;
      size: number;
      formattedSize: string;
      type: string;
      dataUrl?: string;
      uploadedAt?: string;
      label?: string;
      category?: string;
    }
  >;
  id_card_or_passport_url?: string;
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

export interface SubjectGrade {
  id: string;
  subject_code: string;
  subject_name: string;
  category: "Pôle Pratique & Professionnel" | "Pôle Gestion & Technologie" | "Pôle Langues & Général";
  coefficient: number;
  score: number; // Note sur 20
  teacher_name: string;
  teacher_comment: string;
  class_min?: number;
  class_avg?: number;
  class_max?: number;
  subject_rank?: number;
}

export interface StudentReportCard {
  id: string;
  bulletin_number: string; // ex: "BUL-2025-BTS1-01"
  student_id: string;
  student_name: string;
  student_matricule: string;
  student_number?: string;
  gender: "M" | "F";
  birth_date: string;
  birth_place: string;
  nationality: string;
  photo_url?: string;
  class_name: string;
  program_code: DiplomeCode;
  academic_year: string;
  period: "Semestre 1" | "Semestre 2" | "Trimestre 1" | "Trimestre 2" | "Trimestre 3" | "Session Annuelle";
  total_students: number;
  subjects: SubjectGrade[];
  total_coefficients: number;
  total_points: number; // Somme des (score * coefficient)
  general_average: number; // total_points / total_coefficients (sur 20)
  class_general_average: number;
  class_highest_average: number;
  class_lowest_average: number;
  rank: number; // 1, 2, 3...
  rank_display: string; // "1er", "2ème"...
  appreciation_mention: "Très Bien" | "Bien" | "Assez Bien" | "Passable" | "Insuffisant" | "Médiocre";
  council_decision: string; // Félicitations, Tableau d'honneur, Admis, etc.
  absences_unjustified: number;
  absences_justified: number;
  lates_count: number;
  conduct_appreciation: string;
  principal_teacher_name: string;
  principal_teacher_comment: string;
  director_comment: string;
  issue_date: string;
}

export interface HotelReservation {
  id: string;
  booking_ref: string; // ex: "RES-2026-089"
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_id_card?: string;
  customer_nationality?: string;
  room_number: string;
  room_type: string;
  check_in: string;
  check_out: string;
  nights_count: number;
  nightly_rate: number;
  total_price: number;
  deposit_paid: number;
  payment_status: "réglé" | "acompte" | "en_attente";
  status: "réservée" | "payée" | "confirmée" | "en_cours" | "terminée" | "annulée";
  payment_method?: "Espèces" | "Stripe" | "Mobile Money" | "Virement" | "Carte Bancaire";
  cashier_name?: string;
  notes?: string;
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
  address?: string;
  notes?: string;
  total_stays: number;
  total_spent: number;
  balance?: number; // Solde débiteur ou reste à régler
  active_room_number?: string;
  active_reservation_id?: string;
  is_vip: boolean;
  created_at: string;
  id_card_document?: {
    name: string;
    size: number;
    formattedSize: string;
    type: string;
    dataUrl?: string;
  };
  uploaded_documents?: Record<
    string,
    {
      key?: string;
      id?: string;
      name: string;
      size: number;
      formattedSize: string;
      type: string;
      dataUrl?: string;
      uploadedAt?: string;
      category?: string;
    }
  >;
  stay_history?: Array<{
    id: string;
    booking_ref: string;
    room_number: string;
    check_in: string;
    check_out: string;
    total_amount: number;
    paid_amount: number;
    status: string;
  }>;
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
  receipt_document_url?: string;
  receipt_document_name?: string;
  receipt_document_size?: string;
}

