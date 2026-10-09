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
import { ALL_REAL_STUDENTS } from "@/lib/real-students";

// =========================================================================
// FILIÈRES & DIPLÔMES DE L'ÉCOLE AVENIDA
// =========================================================================
export const MOCK_PROGRAMS: Program[] = [
  {
    id: "prog-1",
    code: "CFA",
    name: "Certificat de Fin d'Apprentissage (CFA)",
    duration_years: 1,
    entry_level: "Primaire / Collège",
    annual_tuition: 260000,
    registration_fee: 10000,
    supplies_fee: 45000,
    specialties: ["Cuisine", "Pâtisserie"],
  },
  {
    id: "prog-2",
    code: "CAP",
    name: "Certificat d'Aptitude Professionnelle (CAP)",
    duration_years: 2,
    entry_level: "4ème ou 3ème",
    annual_tuition: 260000,
    registration_fee: 10000,
    supplies_fee: 75000,
    specialties: ["Cuisine / Pâtisserie", "Restaurant / Bar", "Réception / Étage"],
  },
  {
    id: "prog-3",
    code: "BEP",
    name: "Brevet d'Études Professionnelles (BEP)",
    duration_years: 2,
    entry_level: "BEPC",
    annual_tuition: 330000,
    registration_fee: 10000,
    supplies_fee: 75000,
    specialties: ["Cuisine / Pâtisserie", "Restaurant / Bar"],
  },
  {
    id: "prog-4",
    code: "BT",
    name: "Brevet de Technicien (BT)",
    duration_years: 3,
    entry_level: "BEPC",
    annual_tuition: 330000,
    registration_fee: 10000,
    supplies_fee: 75000,
    specialties: ["Restauration", "Hébergement"],
  },
  {
    id: "prog-5",
    code: "BTS",
    name: "Brevet de Technicien Supérieur (BTS)",
    duration_years: 2,
    entry_level: "BAC ou BT",
    annual_tuition: 420000,
    registration_fee: 20000,
    supplies_fee: 75000,
    specialties: ["Restauration", "Hébergement"],
  },
];

// =========================================================================
// 1. DOSSIERS SCOLAIRES (2 ÉLÈVES DE TEST)
// =========================================================================
export const MOCK_STUDENTS: Student[] = ALL_REAL_STUDENTS;

// =========================================================================
// 2. REÇUS DE CAISSE SCOLAIRE (2 REÇUS)
// =========================================================================
export const MOCK_RECEIPTS: PaymentReceipt[] = [
  {
    id: "rec-1",
    reference: "#AV2022-3486",
    student_name: "AFOLEHO Essi",
    student_matricule: "801AVN-24",
    class_name: "BTS1 - Restauration",
    designation: "Frais d'inscription & Scolarité T1",
    amount_paid: 200000,
    total_due: 420000,
    remaining_due: 220000,
    depositor_name: "AFOLEHO Koffi",
    depositor_id_card: "TG-LOM-2022-8941",
    depositor_phone: "90112233",
    depositor_role: "Parent",
    payment_method: "Espèces",
    site: "LOMÉ",
    date: "2024-10-24 09:43:54",
    cashier_name: "BOURAIMA RAOUDHATOU",
  },
  {
    id: "rec-2",
    reference: "#AV2022-3487",
    student_name: "AGBAHEY Toundé Jean Chrysotome",
    student_matricule: "802AVN-24",
    class_name: "BTS1 - Restauration",
    designation: "Frais de scolarité (Tranche 1)",
    amount_paid: 200000,
    total_due: 420000,
    remaining_due: 220000,
    depositor_name: "AGBAHEY Michel",
    depositor_id_card: "TG-LOM-2022-4120",
    depositor_phone: "91223344",
    depositor_role: "Tuteur",
    payment_method: "Espèces",
    site: "LOMÉ",
    date: "2024-10-26 10:29:59",
    cashier_name: "BOURAIMA RAOUDHATOU",
  },
];

// =========================================================================
// 3. CHAMBRES DE L'HÔTEL AVENIDA (2 CHAMBRES DE TEST)
// =========================================================================
export const MOCK_ROOMS: HotelRoom[] = [
  {
    id: "rm-101",
    room_number: "101",
    floor: 1,
    room_type: "Chambre Standard Découverte",
    price_per_night: 25000,
    status: "disponible",
  },
  {
    id: "rm-102",
    room_number: "102",
    floor: 1,
    room_type: "Suite Junior Avenida",
    price_per_night: 45000,
    status: "occupée",
    current_guest: "Dr. Mensah Agbéyomé",
  },
];

// =========================================================================
// 4. ABSENCES & RETARDS (2 ENTRÉES CHACUN)
// =========================================================================
export const MOCK_ABSENCES: AbsenceTicket[] = [
  {
    id: "abs-1",
    ticket_number: 1,
    student_name: "AFOLEHO Essi",
    class_name: "BTS1 - Restauration",
    start_date: "2025-01-14 à 08:00",
    end_date: "2025-01-15 à 12:00",
    reason: "Rendez-vous médical pour certificat d'aptitude",
    is_authorized: true,
    parent_justified: true,
    visa_vie_scolaire: true,
  },
  {
    id: "abs-2",
    ticket_number: 2,
    student_name: "AGBAHEY Toundé Jean Chrysotome",
    class_name: "BTS1 - Restauration",
    start_date: "2025-01-20 à 07:30",
    end_date: "2025-01-20 à 14:30",
    reason: "Problème de transport intra-urbain",
    is_authorized: false,
    parent_justified: false,
    visa_vie_scolaire: false,
  },
];

export const MOCK_LATES: LateTicket[] = [
  {
    id: "lat-1",
    ticket_number: 1,
    student_name: "AGBAHEY Toundé Jean Chrysotome",
    class_name: "BTS1 - Restauration",
    duration_minutes: 25,
    reason: "Pluie battante et embouteillages Lomé",
    destination: "classe",
    visa_vie_scolaire: true,
    date: "2025-01-22 07:55",
  },
  {
    id: "lat-2",
    ticket_number: 2,
    student_name: "AFOLEHO Essi",
    class_name: "BTS1 - Restauration",
    duration_minutes: 15,
    reason: "Retard transport scolaire",
    destination: "classe",
    visa_vie_scolaire: true,
    date: "2025-01-23 07:45",
  },
];

// =========================================================================
// 5. COLLABORATEURS : 2 PROFESSEURS ÉCOLE + 2 PERSONNEL RH / HÔTEL
// =========================================================================
export const MOCK_EMPLOYEES: Employee[] = [
  // --- 2 PROFESSEURS & FORMATEURS ÉCOLE ---
  {
    id: "emp-ens-01",
    matricule: "AVN-ENS-001",
    first_name: "Mawuli Mensah",
    last_name: "KOUASSI",
    gender: "M",
    birth_date: "1982-04-12",
    nationality: "Togolaise",
    phone: "+228 90 12 34 56",
    email: "m.kouassi@avenida-lome.tg",
    neighborhood: "Tokoin Habitat",
    sector: "ecole",
    role_title: "Chef Exécutif & Formateur Principal Cuisine",
    department: "Pédagogie & Arts Culinaires",
    specialty: "Cuisine Gastronomique & Africaine",
    contract_type: "CDI",
    hire_date: "2021-09-01",
    contract_duration: "Indéterminée (CDI)",
    base_salary: 380000,
    cnss_number: "TG-CNSS-884120",
    highest_degree: "Brevet de Maîtrise Culinaire (Ferrandi / Lomé)",
    experience_years: 16,
    cv_summary: "16 années d'expérience en restauration gastronomique et formation hôtelière.",
    status: "actif",
  },
  {
    id: "emp-ens-02",
    matricule: "AVN-ENS-002",
    first_name: "Amivi Sylvie",
    last_name: "AGBOBLI",
    gender: "F",
    birth_date: "1986-09-23",
    nationality: "Togolaise",
    phone: "+228 91 45 67 89",
    email: "s.agbobli@avenida-lome.tg",
    neighborhood: "Dékon",
    sector: "ecole",
    role_title: "Professeure de Gestion & Économie Hôtelière",
    department: "Pédagogie & Sciences de Gestion",
    specialty: "Yield Management & Droit Hôtelier",
    contract_type: "CDI",
    hire_date: "2022-10-15",
    contract_duration: "Indéterminée (CDI)",
    base_salary: 320000,
    cnss_number: "TG-CNSS-741982",
    highest_degree: "Master en Management du Tourisme & de l'Hôtellerie",
    experience_years: 11,
    cv_summary: "Spécialiste de la gestion financière des structures d'hébergement.",
    status: "actif",
  },

  // --- 2 PERSONNEL OPÉRATIONNEL & RH HÔTEL AVENIDA ---
  {
    id: "emp-hot-01",
    matricule: "AVN-HOT-001",
    first_name: "Yao Richard",
    last_name: "MENSAH",
    gender: "M",
    birth_date: "1985-03-14",
    nationality: "Togolaise",
    phone: "+228 90 55 44 33",
    email: "r.mensah@avenida-lome.tg",
    neighborhood: "Kodjoviakopé",
    sector: "hotel",
    role_title: "Chef de Réception & Responsable Front Desk",
    department: "Hébergement & Accueil",
    specialty: "Logiciels PMS, Accueil VIP & Check-in",
    contract_type: "CDI",
    hire_date: "2022-06-01",
    contract_duration: "Indéterminée (CDI)",
    base_salary: 280000,
    cnss_number: "TG-CNSS-332901",
    highest_degree: "Licence Professionnelle Management Hôtelier",
    experience_years: 12,
    cv_summary: "12 ans en gestion de réception et conciergerie hôtelière.",
    status: "actif",
  },
  {
    id: "emp-hot-02",
    matricule: "AVN-HOT-002",
    first_name: "Ablamba Reine",
    last_name: "LAWSON",
    gender: "F",
    birth_date: "1983-08-19",
    nationality: "Togolaise",
    phone: "+228 91 22 33 44",
    email: "r.lawson@avenida-lome.tg",
    neighborhood: "Tokoin Doumasséssé",
    sector: "hotel",
    role_title: "Gouvernante Générale de l'Hôtel",
    department: "Hébergement & Étages",
    specialty: "Hygiène hospitalière, Gestion Lingerie & Contrôle Qualité",
    contract_type: "CDI",
    hire_date: "2021-03-15",
    contract_duration: "Indéterminée (CDI)",
    base_salary: 260000,
    cnss_number: "TG-CNSS-219401",
    highest_degree: "BTS Hôtellerie - Option Hébergement",
    experience_years: 14,
    cv_summary: "Supervise la propreté, la lingerie et le tutorat des élèves en pratique.",
    status: "actif",
  },
];

// =========================================================================
// 6. NOTES & ÉVALUATIONS PÉDAGOGIQUES (2 ÉVALUATIONS)
// =========================================================================
export const MOCK_GRADES: GradeRecord[] = [
  {
    id: "grd-1",
    student_name: "AFOLEHO Essi",
    student_matricule: "801AVN-24",
    class_name: "BTS1 - Restauration",
    subject: "Technologie Culinaire & Pratique",
    evaluation_type: "Pratique Cuisine",
    score: 16.5,
    coefficient: 3,
    date: "2025-01-20",
    teacher_name: "Chef KOUASSI Mawuli",
    appreciation: "Excellente découpe et maîtrise des cuissons. Dressage soigné.",
  },
  {
    id: "grd-2",
    student_name: "AGBAHEY Toundé Jean Chrysotome",
    student_matricule: "802AVN-24",
    class_name: "BTS1 - Restauration",
    subject: "Gestion Hôtelière & PMS",
    evaluation_type: "Devoir Écrit",
    score: 14.0,
    coefficient: 2,
    date: "2025-01-18",
    teacher_name: "Mme AGBOBLI Amivi Sylvie",
    appreciation: "Bonne compréhension des mécanismes de check-in et facturation.",
  },
];

// =========================================================================
// 7. RÉSERVATIONS DE SÉJOURS HÔTEL AVENIDA (2 RÉSERVATIONS)
// =========================================================================
export const MOCK_RESERVATIONS: HotelReservation[] = [
  {
    id: "res-01",
    booking_ref: "RES-2026-089",
    customer_name: "Dr. Mensah Agbéyomé",
    customer_phone: "+228 90 22 11 00",
    room_number: "102",
    room_type: "Suite Junior Avenida",
    check_in: "2026-10-06",
    check_out: "2026-10-10",
    nights_count: 4,
    nightly_rate: 45000,
    total_price: 180000,
    deposit_paid: 90000,
    payment_status: "acompte",
    status: "en_cours",
  },
  {
    id: "res-02",
    booking_ref: "RES-2026-090",
    customer_name: "Mme Clarisse Dupont (Consultante)",
    customer_phone: "+33 6 12 34 56 78",
    room_number: "101",
    room_type: "Chambre Standard Découverte",
    check_in: "2026-10-08",
    check_out: "2026-10-11",
    nights_count: 3,
    nightly_rate: 25000,
    total_price: 75000,
    deposit_paid: 75000,
    payment_status: "réglé",
    status: "confirmée",
  },
];

// =========================================================================
// 8. FICHIER CLIENTS HÔTEL AVENIDA (2 CLIENTS)
// =========================================================================
export const MOCK_CUSTOMERS: HotelCustomer[] = [
  {
    id: "clt-01",
    code: "CLT-0042",
    full_name: "Dr. Mensah Agbéyomé",
    company: "Clinique Saint-Joseph Lomé",
    phone: "+228 90 22 11 00",
    email: "agbeyome.mensah@gmail.com",
    nationality: "Togolaise",
    id_card_or_passport: "TG-CNI-084192",
    total_stays: 4,
    total_spent: 420000,
    is_vip: true,
    created_at: "2024-03-12",
  },
  {
    id: "clt-02",
    code: "CLT-0043",
    full_name: "Mme Clarisse Dupont",
    company: "Expertise France / UE",
    phone: "+33 6 12 34 56 78",
    email: "c.dupont@consulting-int.eu",
    nationality: "Française",
    id_card_or_passport: "FR-PASS-22AA90123",
    total_stays: 2,
    total_spent: 270000,
    is_vip: true,
    created_at: "2025-01-10",
  },
];

// =========================================================================
// 9. SALAIRES & PAIE F CFA (2 BULLETINS DE SALAIRE)
// =========================================================================
export const MOCK_SALARIES: SalaryRecord[] = [
  {
    id: "sal-01",
    slip_ref: "PAY-2026-10-01",
    employee_id: "emp-ens-01",
    employee_name: "Mawuli Mensah KOUASSI",
    employee_matricule: "AVN-ENS-001",
    sector: "ecole",
    role_title: "Chef Exécutif & Formateur Cuisine",
    period_month: "Octobre 2026",
    base_salary: 380000,
    bonuses: 35000,
    cnss_deduction: 15200,
    net_payable: 399800,
    payment_method: "Virement Bancaire",
    payment_date: "2026-10-05",
    status: "payé",
  },
  {
    id: "sal-02",
    slip_ref: "PAY-2026-10-02",
    employee_id: "emp-hot-01",
    employee_name: "Yao Richard MENSAH",
    employee_matricule: "AVN-HOT-001",
    sector: "hotel",
    role_title: "Chef de Réception",
    period_month: "Octobre 2026",
    base_salary: 280000,
    bonuses: 15000,
    cnss_deduction: 11200,
    net_payable: 283800,
    payment_method: "Virement Bancaire",
    payment_date: "2026-10-05",
    status: "payé",
  },
];

// =========================================================================
// 10. ÉCONOMAT & STOCKS (2 ARTICLES)
// =========================================================================
export const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "inv-01",
    code: "STK-CUIS-001",
    name: "Farine de Blé Supérieure (Sacs 25kg)",
    category: "Cuisine & Épicerie",
    quantity: 18,
    unit: "sacs",
    min_alert_threshold: 8,
    unit_price: 18500,
    supplier: "Moulins du Togo (Lomé)",
    last_restock_date: "2026-10-02",
    location: "Magasin Cuisine",
  },
  {
    id: "inv-02",
    code: "STK-HOT-001",
    name: "Draps de Lit Percale 100% Coton (Grands Lits)",
    category: "Lingerie & Produits d'Entretien",
    quantity: 35,
    unit: "pièces",
    min_alert_threshold: 15,
    unit_price: 8500,
    supplier: "Textiles Réunis Lomé",
    last_restock_date: "2026-09-15",
    location: "Lingerie Centrale Hôtel",
  },
];

// =========================================================================
// 11. TRÉSORERIE & FINANCES (2 ÉCRITURES)
// =========================================================================
export const MOCK_FINANCES: FinancialEntry[] = [
  {
    id: "fin-01",
    reference: "FIN-2026-101",
    type: "recette",
    category: "Écolages Scolaires",
    description: "Tranche 1 écolage élève AFOLEHO Essi (#AV2022-3486)",
    amount: 200000,
    date: "2026-10-06",
    recorded_by: "Caissier Lomé",
    payment_mode: "Espèces",
    receipt_number: "#AV2022-3486",
  },
  {
    id: "fin-02",
    reference: "FIN-2026-102",
    type: "recette",
    category: "Hébergement Hôtel",
    description: "Acompte séjour Dr. Mensah Suite 102",
    amount: 90000,
    date: "2026-10-06",
    recorded_by: "Réception Avenida",
    payment_mode: "Espèces",
    receipt_number: "#HOT-2026-089",
  },
];
