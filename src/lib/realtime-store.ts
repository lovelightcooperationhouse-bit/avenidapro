"use client";

import {
  MOCK_STUDENTS,
  MOCK_EMPLOYEES,
  MOCK_CUSTOMERS,
  MOCK_FINANCES,
  MOCK_ROOMS,
  MOCK_RECEIPTS,
  MOCK_RESERVATIONS,
  MOCK_ABSENCES,
  MOCK_LATES,
  MOCK_SALARIES,
  MOCK_INVENTORY,
  MOCK_GRADES,
} from "@/lib/mock-data";
import {
  Student,
  Employee,
  HotelCustomer,
  FinancialEntry,
  HotelRoom,
  RoomStatus,
  PaymentReceipt,
  HotelReservation,
  DiplomeCode,
  AbsenceTicket,
  LateTicket,
  SalaryRecord,
  InventoryItem,
  GradeRecord,
} from "@/types";
import { createClient } from "@/lib/supabase/client";
import { notifyDirector } from "@/lib/notifications";

export const AVENIDA_DATA_UPDATED_EVENT = "avenida_data_updated";

/**
 * Notifie tous les écouteurs de l'application que les données ont été mises à jour
 */
export function broadcastDataChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AVENIDA_DATA_UPDATED_EVENT));
  }
}

/**
 * Sauvegarde sécurisée dans le localStorage avec gestion du quota
 */
function safeSetStorage(key: string, data: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Quota localStorage atteint pour ${key}, nettoyage des payloads lourds...`, err);
    try {
      // Nettoie les champs lourds tels que les base64 dataUrl (> 50 Ko)
      const sanitized = JSON.parse(
        JSON.stringify(data, (k, v) => {
          if (typeof v === "string" && v.startsWith("data:") && v.length > 50000) {
            return undefined;
          }
          return v;
        })
      );
      localStorage.setItem(key, JSON.stringify(sanitized));
    } catch (cleanErr) {
      console.error(`Impossible d'enregistrer dans localStorage même après nettoyage:`, cleanErr);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ÉLÈVES & SCOLARITÉ
// ─────────────────────────────────────────────────────────────────────────────
export function getStoredStudents(): Student[] {
  if (typeof window === "undefined") return MOCK_STUDENTS;
  try {
    const raw = localStorage.getItem("avenida_custom_students");
    if (!raw) return MOCK_STUDENTS;
    const parsed = JSON.parse(raw) as Student[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_STUDENTS;
    return parsed;
  } catch (err) {
    console.warn("Erreur lecture élèves locaux:", err);
    return MOCK_STUDENTS;
  }
}

export async function syncStudentsFromSupabase(): Promise<Student[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("students").select("*");
    if (error || !data || data.length === 0) return getStoredStudents();

    const remoteStudents: Student[] = data.map((row: any) => ({
      id: row.id,
      registration_number: row.registration_number,
      student_number: row.student_number || row.registration_number,
      first_name: row.first_name,
      last_name: row.last_name,
      gender: row.gender || "M",
      birth_date: row.birth_date || "",
      birth_place: row.birth_place || "",
      nationality: row.nationality || "Togolaise",
      residence_neighborhood: row.residence_neighborhood || "",
      phone: row.phone || "",
      email: row.email || "",
      boarder_status: row.boarder_status || "externe",
      emergency_contact_name: row.emergency_contact_name || "",
      emergency_contact_phone: row.emergency_contact_phone || "",
      program_code: (row.program_code || "BTS") as DiplomeCode,
      class_name: row.class_name || "1ère Année Hôtellerie",
      academic_year: row.academic_year || "2024 - 2025",
      status: row.status || "actif",
      photo_url: row.photo_url || "/avatars/default.png",
      total_fee: Number(row.total_fee) || 370000,
      paid_fee: Number(row.paid_fee) || 0,
      remaining_fee: Number(row.remaining_fee) || 0,
      uploaded_documents: row.uploaded_documents || {},
      id_card_number: row.id_card_number || undefined,
      address: row.address || undefined,
      city: row.city || undefined,
      phone_secondary: row.phone_secondary || undefined,
      previous_school: row.previous_school || undefined,
      last_diploma: row.last_diploma || undefined,
      last_class: row.last_class || undefined,
      average_last_year: row.average_last_year || undefined,
      transfer_reason: row.transfer_reason || undefined,
      year_level: row.year_level || undefined,
      specialty: row.specialty || undefined,
      parent_father_name: row.parent_father_name || undefined,
      parent_father_phone: row.parent_father_phone || undefined,
      parent_father_profession: row.parent_father_profession || undefined,
      parent_mother_name: row.parent_mother_name || undefined,
      parent_mother_phone: row.parent_mother_phone || undefined,
      parent_mother_profession: row.parent_mother_profession || undefined,
      tutor_name: row.tutor_name || undefined,
      tutor_phone: row.tutor_phone || undefined,
      tutor_profession: row.tutor_profession || undefined,
      tutor_relation: row.tutor_relation || undefined,
      blood_group: row.blood_group || undefined,
      allergies: row.allergies || undefined,
      medical_notes: row.medical_notes || undefined,
      payment_method: row.payment_method || undefined,
      registration_fee: Number(row.registration_fee) || 0,
      installments_count: Number(row.installments_count) || 1,
      notes: row.notes || undefined,
      raw_data: row.raw_data || undefined,
    }));

    // Fusionner avec les élèves locaux non-mocks
    const current = getStoredStudents();
    const remoteMatricules = new Set(remoteStudents.map((s) => s.registration_number));
    const nonMockLocal = current.filter(
      (s) =>
        !remoteMatricules.has(s.registration_number) &&
        s.registration_number !== "801AVN-24" &&
        s.registration_number !== "802AVN-24"
    );
    const merged = [...remoteStudents, ...nonMockLocal];

    safeSetStorage("avenida_custom_students", merged);
    broadcastDataChange();
    return merged;
  } catch (err) {
    console.warn("Sync Supabase élèves en lecture échouée (fallback local):", err);
    return getStoredStudents();
  }
}

export async function saveAndSyncStudent(student: Student): Promise<Student[]> {
  const current = getStoredStudents();
  const filtered = current.filter(
    (s) => s.id !== student.id && s.registration_number !== student.registration_number
  );
  const updatedList = [student, ...filtered];

  safeSetStorage("avenida_custom_students", updatedList);

  // Synchronisation Supabase complète
  try {
    const supabase = createClient();
    const payload = {
      registration_number: student.registration_number,
      student_number: student.student_number || student.registration_number,
      first_name: student.first_name,
      last_name: student.last_name,
      gender: student.gender,
      birth_date: student.birth_date || null,
      birth_place: student.birth_place || null,
      nationality: student.nationality || "Togolaise",
      residence_neighborhood: student.residence_neighborhood || null,
      phone: student.phone || null,
      email: student.email || null,
      boarder_status: student.boarder_status || "externe",
      emergency_contact_name: student.emergency_contact_name || null,
      emergency_contact_phone: student.emergency_contact_phone || null,
      program_code: student.program_code || null,
      class_name: student.class_name || null,
      academic_year: student.academic_year || null,
      total_fee: student.total_fee || 0,
      paid_fee: student.paid_fee || 0,
      remaining_fee: student.remaining_fee || 0,
      photo_url: student.photo_url || null,
      status: student.status || "actif",
      uploaded_documents: student.uploaded_documents || {},
      id_card_number: student.id_card_number || null,
      address: student.address || null,
      city: student.city || null,
      phone_secondary: student.phone_secondary || null,
      previous_school: student.previous_school || null,
      last_diploma: student.last_diploma || null,
      last_class: student.last_class || null,
      average_last_year: student.average_last_year || null,
      transfer_reason: student.transfer_reason || null,
      year_level: student.year_level || null,
      specialty: student.specialty || null,
      parent_father_name: student.parent_father_name || null,
      parent_father_phone: student.parent_father_phone || null,
      parent_father_profession: student.parent_father_profession || null,
      parent_mother_name: student.parent_mother_name || null,
      parent_mother_phone: student.parent_mother_phone || null,
      parent_mother_profession: student.parent_mother_profession || null,
      tutor_name: student.tutor_name || null,
      tutor_phone: student.tutor_phone || null,
      tutor_profession: student.tutor_profession || null,
      tutor_relation: student.tutor_relation || null,
      blood_group: student.blood_group || null,
      allergies: student.allergies || null,
      medical_notes: student.medical_notes || null,
      payment_method: student.payment_method || null,
      registration_fee: student.registration_fee || 0,
      installments_count: student.installments_count || 1,
      notes: student.notes || null,
      raw_data: student.raw_data || { ...student },
    };

    const { error } = await supabase
      .from("students")
      .upsert(payload, { onConflict: "registration_number" });

    if (error) {
      console.error("❌ Erreur enregistrement Supabase (élèves) :", error.message);
    } else {
      console.log("✅ Élève synchronisé dans la base Supabase :", student.registration_number);
    }
  } catch (err) {
    console.warn("Sync Supabase élève non bloquante :", err);
  }

  notifyDirector(
    "student",
    `Nouvelle Inscription : ${student.last_name} ${student.first_name}`,
    `Matricule ${student.registration_number} • Filière ${student.program_code || "Hôtellerie"} • Classe ${student.class_name}`
  );

  broadcastDataChange();
  return updatedList;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PERSONNEL & EMPLOYÉS
// ─────────────────────────────────────────────────────────────────────────────
export function getStoredEmployees(): Employee[] {
  if (typeof window === "undefined") return MOCK_EMPLOYEES;
  try {
    const raw = localStorage.getItem("avenida_custom_employees");
    if (!raw) return MOCK_EMPLOYEES;
    const parsed = JSON.parse(raw) as Employee[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_EMPLOYEES;
    const customMatricules = new Set(parsed.map((e) => e.matricule));
    const mocks = MOCK_EMPLOYEES.filter((m) => !customMatricules.has(m.matricule));
    return [...parsed, ...mocks];
  } catch (err) {
    console.warn("Erreur lecture employés locaux:", err);
    return MOCK_EMPLOYEES;
  }
}

export async function syncEmployeesFromSupabase(): Promise<Employee[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("employees").select("*");
    if (error || !data || data.length === 0) return getStoredEmployees();

    const remoteEmployees: Employee[] = data.map((row: any) => ({
      id: row.id,
      matricule: row.matricule,
      first_name: row.first_name,
      last_name: row.last_name,
      gender: row.gender || "M",
      birth_date: row.birth_date || "1990-01-01",
      nationality: row.nationality || "Togolaise",
      phone: row.phone || "",
      email: row.email || "",
      neighborhood: row.neighborhood || "Lomé",
      sector: row.sector || "ecole",
      role_title: row.role_title || row.position || "Formateur",
      department: row.department || "Pédagogie",
      specialty: row.specialty || undefined,
      contract_type: row.contract_type || "CDI",
      hire_date: row.hire_date || "2024-01-01",
      contract_duration: row.contract_duration || "Indéterminée (CDI)",
      contract_end_date: row.contract_end_date || undefined,
      base_salary: Number(row.base_salary) || 200000,
      cnss_number: row.cnss_number || undefined,
      highest_degree: row.highest_degree || "Diplôme d'État",
      experience_years: Number(row.experience_years) || 3,
      cv_summary: row.cv_summary || "",
      photo_url: row.photo_url || undefined,
      uploaded_documents: row.uploaded_documents || {},
      status: row.status === "sorti" ? "inactif" : "actif",
      raw_data: row.raw_data || undefined,
    }));

    const current = getStoredEmployees();
    const remoteMatricules = new Set(remoteEmployees.map((e) => e.matricule));
    const merged = [
      ...remoteEmployees,
      ...current.filter((e) => !remoteMatricules.has(e.matricule)),
    ];

    safeSetStorage("avenida_custom_employees", merged);
    broadcastDataChange();
    return merged;
  } catch (err) {
    console.warn("Sync Supabase employés en lecture échouée:", err);
    return getStoredEmployees();
  }
}

export async function saveAndSyncEmployee(employee: Employee): Promise<Employee[]> {
  const current = getStoredEmployees();
  const filtered = current.filter((e) => e.id !== employee.id && e.matricule !== employee.matricule);
  const updatedList = [employee, ...filtered];

  safeSetStorage("avenida_custom_employees", updatedList);

  // Synchronisation Supabase en arrière-plan
  try {
    const supabase = createClient();
    const { error } = await supabase.from("employees").upsert(
      {
        matricule: employee.matricule,
        first_name: employee.first_name,
        last_name: employee.last_name,
        gender: employee.gender,
        birth_date: employee.birth_date || null,
        nationality: employee.nationality,
        phone: employee.phone,
        email: employee.email,
        neighborhood: employee.neighborhood,
        sector: employee.sector,
        position: employee.role_title,
        role_title: employee.role_title,
        department: employee.department,
        specialty: employee.specialty,
        contract_type: employee.contract_type,
        contract_duration: employee.contract_duration,
        contract_end_date: employee.contract_end_date || null,
        base_salary: employee.base_salary,
        cnss_number: employee.cnss_number,
        highest_degree: employee.highest_degree,
        experience_years: employee.experience_years,
        cv_summary: employee.cv_summary,
        photo_url: employee.photo_url,
        uploaded_documents: employee.uploaded_documents || {},
        hire_date: employee.hire_date,
        status: employee.status === "inactif" ? "sorti" : "actif",
        raw_data: { ...employee },
      },
      { onConflict: "matricule" }
    );
    if (error) console.error("❌ Erreur enregistrement Supabase (employés) :", error.message);
    else console.log("✅ Employé synchronisé dans Supabase :", employee.matricule);
  } catch (err) {
    console.warn("Sync Supabase employé non bloquante:", err);
  }

  notifyDirector(
    "employee",
    `Nouveau Recrutement : ${employee.first_name} ${employee.last_name}`,
    `Poste : ${employee.role_title} • Secteur : ${employee.sector === "ecole" ? "École Hôtelière" : "Hôtel"} • Contrat : ${employee.contract_type}`
  );

  broadcastDataChange();
  return updatedList;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CLIENTS HÔTEL
// ─────────────────────────────────────────────────────────────────────────────
export function getStoredCustomers(): HotelCustomer[] {
  if (typeof window === "undefined") return MOCK_CUSTOMERS;
  try {
    const raw = localStorage.getItem("avenida_custom_customers");
    if (!raw) return MOCK_CUSTOMERS;
    const parsed = JSON.parse(raw) as HotelCustomer[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_CUSTOMERS;
    const customIds = new Set(parsed.map((c) => c.id));
    const mocks = MOCK_CUSTOMERS.filter((m) => !customIds.has(m.id));
    return [...parsed, ...mocks];
  } catch (err) {
    console.warn("Erreur lecture clients locaux:", err);
    return MOCK_CUSTOMERS;
  }
}

export async function syncCustomersFromSupabase(): Promise<HotelCustomer[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("hotel_customers").select("*");
    if (error || !data || data.length === 0) return getStoredCustomers();

    const remoteCustomers: HotelCustomer[] = data.map((row: any) => ({
      id: row.id,
      code: row.code || `CLT-${row.id.slice(0, 4)}`,
      full_name: row.full_name || `${row.first_name} ${row.last_name}`.trim(),
      company: row.company || undefined,
      phone: row.phone || "",
      email: row.email || "",
      nationality: row.nationality || "Togolaise",
      id_card_or_passport: row.id_card_or_passport || "",
      total_stays: Number(row.total_stays) || 1,
      total_spent: Number(row.total_spent) || 0,
      is_vip: Boolean(row.is_vip),
      created_at: row.created_at || new Date().toISOString(),
      id_card_document: row.id_card_document || undefined,
    }));

    const current = getStoredCustomers();
    const remotePhones = new Set(remoteCustomers.map((c) => c.phone));
    const merged = [
      ...remoteCustomers,
      ...current.filter((c) => !remotePhones.has(c.phone)),
    ];

    safeSetStorage("avenida_custom_customers", merged);
    broadcastDataChange();
    return merged;
  } catch (err) {
    console.warn("Sync Supabase clients échouée:", err);
    return getStoredCustomers();
  }
}

export async function saveAndSyncCustomer(customer: HotelCustomer): Promise<HotelCustomer[]> {
  const current = getStoredCustomers();
  const filtered = current.filter((c) => c.id !== customer.id && c.phone !== customer.phone);
  const updatedList = [customer, ...filtered];

  safeSetStorage("avenida_custom_customers", updatedList);

  // Synchronisation Supabase en arrière-plan
  try {
    const supabase = createClient();
    const parts = customer.full_name.trim().split(" ");
    const firstName = parts[0] || "Client";
    const lastName = parts.slice(1).join(" ") || "Avenida";

    const { error } = await supabase.from("hotel_customers").upsert(
      {
        code: customer.code,
        full_name: customer.full_name,
        first_name: firstName,
        last_name: lastName,
        company: customer.company || null,
        email: customer.email || null,
        phone: customer.phone,
        nationality: customer.nationality,
        id_card_or_passport: customer.id_card_or_passport,
        total_stays: customer.total_stays || 1,
        total_spent: customer.total_spent || 0,
        is_vip: customer.is_vip || false,
        id_card_document: customer.id_card_document || null,
        raw_data: { ...customer },
      },
      { onConflict: "phone" }
    );
    if (error) console.error("❌ Erreur enregistrement Supabase (clients) :", error.message);
    else console.log("✅ Client synchronisé dans Supabase :", customer.full_name);
  } catch (err) {
    console.warn("Sync Supabase client hôtel non bloquante:", err);
  }

  notifyDirector(
    "hotel",
    `Fiche Client Enregistrée : ${customer.full_name}`,
    `Code ${customer.code} • ${customer.nationality} • Contact : ${customer.phone}`
  );

  broadcastDataChange();
  return updatedList;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TRÉSORERIE & FINANCES
// ─────────────────────────────────────────────────────────────────────────────
export function getStoredFinances(): FinancialEntry[] {
  if (typeof window === "undefined") return MOCK_FINANCES;
  try {
    const raw = localStorage.getItem("avenida_custom_finances");
    if (!raw) return MOCK_FINANCES;
    const parsed = JSON.parse(raw) as FinancialEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_FINANCES;
    const customIds = new Set(parsed.map((f) => f.id));
    const mocks = MOCK_FINANCES.filter((m) => !customIds.has(m.id));
    return [...parsed, ...mocks];
  } catch (err) {
    console.warn("Erreur lecture finances locales:", err);
    return MOCK_FINANCES;
  }
}

export async function syncFinancesFromSupabase(): Promise<FinancialEntry[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("expenses").select("*");
    if (error || !data || data.length === 0) return getStoredFinances();

    const remoteEntries: FinancialEntry[] = data.map((row: any) => ({
      id: row.id,
      reference: row.reference || `FIN-${row.id.slice(0, 6)}`,
      type: (row.type === "recette" ? "recette" : "depense") as "recette" | "depense",
      category: row.category || "Général",
      description: row.description || "",
      amount: Number(row.amount) || 0,
      date: row.expense_date || new Date().toISOString().split("T")[0],
      recorded_by: row.recorded_by || "Comptable",
      payment_mode: row.payment_method || "Espèces",
      receipt_number: row.receipt_number,
      receipt_document_url: row.receipt_document_url,
      receipt_document_name: row.receipt_document_name || undefined,
      receipt_document_size: row.receipt_document_size || undefined,
    }));

    const current = getStoredFinances();
    const remoteRefs = new Set(remoteEntries.map((f) => f.reference));
    const merged = [
      ...remoteEntries,
      ...current.filter((f) => !remoteRefs.has(f.reference)),
    ];

    safeSetStorage("avenida_custom_finances", merged);
    broadcastDataChange();
    return merged;
  } catch (err) {
    console.warn("Sync Supabase finances échouée:", err);
    return getStoredFinances();
  }
}

export async function saveAndSyncFinance(entry: FinancialEntry): Promise<FinancialEntry[]> {
  const current = getStoredFinances();
  const filtered = current.filter((f) => f.id !== entry.id && f.reference !== entry.reference);
  const updatedList = [entry, ...filtered];

  safeSetStorage("avenida_custom_finances", updatedList);

  // Synchronisation Supabase dans la table expenses
  try {
    const supabase = createClient();
    const { error } = await supabase.from("expenses").upsert(
      {
        reference: entry.reference,
        type: entry.type,
        category: entry.category,
        amount: entry.amount,
        description: entry.description,
        expense_date: entry.date,
        payment_method: entry.payment_mode,
        recorded_by: entry.recorded_by,
        receipt_number: entry.receipt_number || null,
        receipt_document_url: entry.receipt_document_url || null,
        receipt_document_name: entry.receipt_document_name || null,
        receipt_document_size: entry.receipt_document_size || null,
        raw_data: { ...entry },
      },
      { onConflict: "reference" }
    );
    if (error) console.error("❌ Erreur enregistrement Supabase (finances) :", error.message);
    else console.log("✅ Entrée financière synchronisée dans Supabase :", entry.reference);
  } catch (err) {
    console.warn("Sync Supabase finance non bloquante:", err);
  }

  notifyDirector(
    "finance",
    `Flux de Trésorerie : ${entry.type === "recette" ? "Recette" : "Dépense"} (${entry.category})`,
    `${entry.description} • Montant : ${entry.amount.toLocaleString()} F CFA • Réf : ${entry.reference}`
  );

  broadcastDataChange();
  return updatedList;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. RÉSERVATIONS HÔTEL
// ─────────────────────────────────────────────────────────────────────────────
export function getStoredReservations(): HotelReservation[] {
  if (typeof window === "undefined") return MOCK_RESERVATIONS;
  try {
    const raw = localStorage.getItem("avenida_custom_reservations");
    if (!raw) return MOCK_RESERVATIONS;
    const parsed = JSON.parse(raw) as HotelReservation[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_RESERVATIONS;
    const customRefs = new Set(parsed.map((r) => r.booking_ref));
    const mocks = MOCK_RESERVATIONS.filter((m) => !customRefs.has(m.booking_ref));
    return [...parsed, ...mocks];
  } catch (err) {
    console.warn("Erreur lecture réservations locales:", err);
    return MOCK_RESERVATIONS;
  }
}

export async function syncReservationsFromSupabase(): Promise<HotelReservation[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("reservations").select("*");
    if (error || !data || data.length === 0) return getStoredReservations();

    const remoteReservations: HotelReservation[] = data.map((row: any) => ({
      id: row.id,
      booking_ref: row.booking_ref || `RES-${row.id.slice(0, 6)}`,
      customer_name: row.customer_name || "Client Hôtel",
      customer_phone: row.customer_phone || "",
      customer_email: row.customer_email || undefined,
      customer_id_card: row.customer_id_card || undefined,
      customer_nationality: row.customer_nationality || "Togolaise",
      room_number: row.room_number || "101",
      room_type: row.room_type || "Chambre Standard",
      check_in: row.check_in || (row.check_in_date ? row.check_in_date.split("T")[0] : ""),
      check_out: row.check_out || (row.check_out_date ? row.check_out_date.split("T")[0] : ""),
      nights_count: Number(row.nights_count) || 1,
      nightly_rate: Number(row.nightly_rate) || 25000,
      total_price: Number(row.total_price) || 25000,
      deposit_paid: Number(row.deposit_paid || row.advance_amount) || 0,
      payment_status: row.payment_status || "en_attente",
      status: row.status || "confirmée",
      payment_method: row.payment_method || "Espèces",
      cashier_name: row.cashier_name || "Réceptionniste",
      notes: row.notes || "",
    }));

    const current = getStoredReservations();
    const remoteRefs = new Set(remoteReservations.map((r) => r.booking_ref));
    const merged = [
      ...remoteReservations,
      ...current.filter((r) => !remoteRefs.has(r.booking_ref)),
    ];

    safeSetStorage("avenida_custom_reservations", merged);
    broadcastDataChange();
    return merged;
  } catch (err) {
    console.warn("Sync Supabase réservations échouée:", err);
    return getStoredReservations();
  }
}

export async function saveAndSyncReservation(res: HotelReservation): Promise<HotelReservation[]> {
  const current = getStoredReservations();
  const filtered = current.filter((r) => r.id !== res.id && r.booking_ref !== res.booking_ref);
  const updatedList = [res, ...filtered];

  safeSetStorage("avenida_custom_reservations", updatedList);

  // Synchronisation Supabase
  try {
    const supabase = createClient();
    const { error } = await supabase.from("reservations").upsert(
      {
        booking_ref: res.booking_ref,
        customer_name: res.customer_name,
        customer_phone: res.customer_phone,
        customer_email: res.customer_email || null,
        customer_id_card: res.customer_id_card || null,
        customer_nationality: res.customer_nationality || null,
        room_number: res.room_number,
        room_type: res.room_type,
        check_in: res.check_in,
        check_out: res.check_out,
        check_in_date: res.check_in ? new Date(res.check_in).toISOString() : new Date().toISOString(),
        check_out_date: res.check_out ? new Date(res.check_out).toISOString() : new Date().toISOString(),
        nights_count: res.nights_count,
        nightly_rate: res.nightly_rate,
        total_price: res.total_price,
        deposit_paid: res.deposit_paid,
        advance_amount: res.deposit_paid,
        payment_status: res.payment_status,
        status: res.status,
        payment_method: res.payment_method || "Espèces",
        cashier_name: res.cashier_name || null,
        notes: res.notes || null,
      },
      { onConflict: "booking_ref" }
    );
    if (error) console.error("❌ Erreur enregistrement Supabase (réservations) :", error.message);
    else console.log("✅ Réservation synchronisée dans Supabase :", res.booking_ref);
  } catch (err) {
    console.warn("Sync Supabase réservation non bloquante:", err);
  }

  notifyDirector(
    "hotel",
    `Nouvelle Réservation : ${res.customer_name} • Ch. ${res.room_number}`,
    `Réf ${res.booking_ref} • Du ${res.check_in} au ${res.check_out} • Total : ${res.total_price.toLocaleString()} F CFA`
  );

  broadcastDataChange();
  return updatedList;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CHAMBRES & HÉBERGEMENT
// ─────────────────────────────────────────────────────────────────────────────
export function getStoredRooms(): HotelRoom[] {
  if (typeof window === "undefined") return MOCK_ROOMS;
  try {
    const raw = localStorage.getItem("avenida_custom_rooms");
    if (!raw) return MOCK_ROOMS;
    const parsed = JSON.parse(raw) as HotelRoom[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_ROOMS;
    return parsed;
  } catch (err) {
    console.warn("Erreur lecture chambres locales:", err);
    return MOCK_ROOMS;
  }
}

export async function syncRoomsFromSupabase(): Promise<HotelRoom[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("rooms").select("*");
    if (error || !data || data.length === 0) return getStoredRooms();

    const remoteRooms: HotelRoom[] = data.map((row: any) => ({
      id: row.id || `rm-${row.room_number}`,
      room_number: row.room_number,
      floor: Number(row.floor) || 1,
      room_type: row.room_type || "Chambre Standard Découverte",
      price_per_night: Number(row.price_per_night) || 25000,
      status: (row.status || "disponible") as RoomStatus,
      current_guest: row.current_guest || undefined,
    }));

    safeSetStorage("avenida_custom_rooms", remoteRooms);
    broadcastDataChange();
    return remoteRooms;
  } catch (err) {
    console.warn("Sync Supabase chambres échouée:", err);
    return getStoredRooms();
  }
}

export async function saveAndSyncRoom(room: HotelRoom): Promise<HotelRoom[]> {
  const current = getStoredRooms();
  const exists = current.some((r) => r.id === room.id || r.room_number === room.room_number);
  const updatedList = exists
    ? current.map((r) => (r.id === room.id || r.room_number === room.room_number ? room : r))
    : [...current, room];

  safeSetStorage("avenida_custom_rooms", updatedList);

  try {
    const supabase = createClient();
    await supabase.from("rooms").upsert(
      {
        room_number: room.room_number,
        floor: room.floor,
        room_type: room.room_type,
        price_per_night: room.price_per_night,
        status: room.status,
        current_guest: room.current_guest || null,
      },
      { onConflict: "room_number" }
    );
  } catch (err) {
    console.warn("Sync Supabase chambre non bloquante:", err);
  }

  broadcastDataChange();
  return updatedList;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ENCAISSEMENTS & REÇUS D'ÉCOLAGE
// ─────────────────────────────────────────────────────────────────────────────
export function getStoredReceipts(): PaymentReceipt[] {
  if (typeof window === "undefined") return MOCK_RECEIPTS;
  try {
    const raw = localStorage.getItem("avenida_custom_receipts");
    if (!raw) return MOCK_RECEIPTS;
    const parsed = JSON.parse(raw) as PaymentReceipt[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_RECEIPTS;
    return parsed;
  } catch (err) {
    console.warn("Erreur lecture reçus locaux:", err);
    return MOCK_RECEIPTS;
  }
}

export async function syncReceiptsFromSupabase(): Promise<PaymentReceipt[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("fee_payments").select("*");
    if (error || !data || data.length === 0) return getStoredReceipts();

    const remote: PaymentReceipt[] = data.map((row: any) => ({
      id: row.id || `rec-${row.receipt_number}`,
      reference: row.receipt_number,
      student_name: row.student_name,
      student_matricule: row.student_matricule,
      class_name: row.class_name || "BTS",
      designation: row.designation || "Frais d'écolage",
      amount_paid: Number(row.amount) || 0,
      total_due: Number(row.total_due) || 0,
      remaining_due: Number(row.remaining_due) || 0,
      depositor_name: row.depositor_name || "",
      depositor_id_card: row.depositor_id_card || "",
      depositor_phone: row.depositor_phone || "",
      depositor_role: row.depositor_role || "Parent",
      payment_method: row.payment_method || "Espèces",
      site: row.site || "LOMÉ",
      date: row.payment_date || row.created_at || new Date().toISOString().substring(0, 10),
      cashier_name: row.cashier_name || "Caisse Avenida",
    }));

    const current = getStoredReceipts();
    const remoteRefs = new Set(remote.map((r) => r.reference));
    const merged = [...remote, ...current.filter((c) => !remoteRefs.has(c.reference))];
    safeSetStorage("avenida_custom_receipts", merged);
    broadcastDataChange();
    return merged;
  } catch (err) {
    console.warn("Sync Supabase reçus échouée:", err);
    return getStoredReceipts();
  }
}

export async function saveAndSyncReceipt(receipt: PaymentReceipt): Promise<PaymentReceipt[]> {
  const current = getStoredReceipts();
  const filtered = current.filter((r) => r.id !== receipt.id && r.reference !== receipt.reference);
  const updatedList = [receipt, ...filtered];

  safeSetStorage("avenida_custom_receipts", updatedList);

  const supabase = createClient();

  // 1. Synchronisation du reçu dans la table fee_payments de Supabase
  try {
    const { error } = await supabase.from("fee_payments").upsert(
      {
        receipt_number: receipt.reference,
        student_name: receipt.student_name,
        student_matricule: receipt.student_matricule,
        class_name: receipt.class_name,
        designation: receipt.designation,
        amount: receipt.amount_paid,
        total_due: receipt.total_due,
        remaining_due: receipt.remaining_due,
        payment_method: receipt.payment_method,
        depositor_name: receipt.depositor_name,
        depositor_id_card: receipt.depositor_id_card,
        depositor_phone: receipt.depositor_phone,
        depositor_role: receipt.depositor_role,
        cashier_name: receipt.cashier_name,
        site: receipt.site || "LOMÉ",
        status: "validé",
      },
      { onConflict: "receipt_number" }
    );
    if (error) console.error("❌ Erreur enregistrement Supabase (reçus) :", error.message);
    else console.log("✅ Reçu synchronisé dans Supabase :", receipt.reference);
  } catch (err) {
    console.warn("Sync Supabase encaissement non bloquante:", err);
  }

  // 2. DÉDUCTION ET MISE À JOUR AUTOMATIQUE DU STATUT DE L'ÉLÈVE (BASE SUPABASE & LOCALE)
  try {
    const currentStudents = getStoredStudents();
    const studentIndex = currentStudents.findIndex(
      (s) =>
        s.registration_number === receipt.student_matricule ||
        `${s.last_name} ${s.first_name}`.toLowerCase() === receipt.student_name.toLowerCase()
    );

    if (studentIndex !== -1) {
      const targetStudent = currentStudents[studentIndex];
      const prevPaid = Number(targetStudent.paid_fee) || 0;
      const totalDue = Number(targetStudent.total_fee) || (prevPaid + Number(targetStudent.remaining_fee || 0)) || 370000;
      const newPaid = prevPaid + Number(receipt.amount_paid);
      const newRemaining = Math.max(0, totalDue - newPaid);

      const updatedStudent: Student = {
        ...targetStudent,
        paid_fee: newPaid,
        remaining_fee: newRemaining,
      };

      currentStudents[studentIndex] = updatedStudent;
      safeSetStorage("avenida_custom_students", currentStudents);

      // Mise à jour directe dans la table students de Supabase
      const { error: studentUpdateError } = await supabase
        .from("students")
        .update({
          paid_fee: newPaid,
          remaining_fee: newRemaining,
        })
        .eq("registration_number", targetStudent.registration_number);

      if (studentUpdateError) {
        console.error("❌ Erreur déduction écolage élève dans Supabase :", studentUpdateError.message);
      } else {
        console.log(`✅ Écolage déduit dans Supabase pour ${targetStudent.registration_number} : Payé = ${newPaid} F CFA, Reste = ${newRemaining} F CFA`);
      }
    }
  } catch (err) {
    console.warn("Erreur déduction automatique écolage élève :", err);
  }

  // 3. ENREGISTREMENT DU FLUX D'ENTRÉE EN TRÉSORERIE (FINANCES / RECETTES)
  try {
    const newFinanceEntry: FinancialEntry = {
      id: `fin-${Date.now()}`,
      reference: `REC-${receipt.reference.replace(/[^a-zA-Z0-9]/g, "")}`,
      type: "recette",
      category: "Écolages Scolaires",
      amount: receipt.amount_paid,
      description: `Encaissement Scolarité — ${receipt.student_name} (${receipt.student_matricule}) • ${receipt.designation}`,
      date: (receipt.date || new Date().toISOString()).split(" ")[0].split("T")[0],
      recorded_by: receipt.cashier_name || "Caisse Scolaire Lomé",
      payment_mode:
        receipt.payment_method === "Stripe"
          ? "Virement"
          : (receipt.payment_method as "Espèces" | "Mobile Money" | "Virement" | "Chèque") || "Espèces",
      receipt_number: receipt.reference,
    };
    await saveAndSyncFinance(newFinanceEntry);
  } catch (err) {
    console.warn("Erreur synchronisation finance recette automatique:", err);
  }

  // 4. NOTIFICATION DE LA DIRECTION
  notifyDirector(
    "finance",
    `Paiement d'Écolage Reçu : ${receipt.amount_paid.toLocaleString()} F CFA`,
    `Élève : ${receipt.student_name} (${receipt.student_matricule}) • Reste dû : ${receipt.remaining_due.toLocaleString()} F CFA • Réf : ${receipt.reference}`
  );

  broadcastDataChange();
  return updatedList;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. VIE SCOLAIRE : ABSENCES & RETARDS ÉLÈVES
// ─────────────────────────────────────────────────────────────────────────────
export function getStoredAbsences(): AbsenceTicket[] {
  if (typeof window === "undefined") return MOCK_ABSENCES;
  try {
    const raw = localStorage.getItem("avenida_custom_absences");
    if (!raw) return MOCK_ABSENCES;
    const parsed = JSON.parse(raw) as AbsenceTicket[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_ABSENCES;
    return parsed;
  } catch (err) {
    console.warn("Erreur lecture absences locales:", err);
    return MOCK_ABSENCES;
  }
}

export async function syncAbsencesFromSupabase(): Promise<AbsenceTicket[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("student_absences").select("*");
    if (error || !data || data.length === 0) return getStoredAbsences();

    const remote: AbsenceTicket[] = data.map((row: any, i: number) => ({
      id: row.id || `abs-${row.ticket_number || i}`,
      ticket_number: Number(String(row.ticket_number).replace(/\D/g, "")) || i + 1,
      student_name: row.student_name || "Élève",
      class_name: row.class_name || "Formation Hôtelière",
      start_date: row.start_date || new Date().toISOString(),
      end_date: row.end_date || new Date().toISOString(),
      reason: row.reason || "",
      is_authorized: Boolean(row.is_justified),
      parent_justified: Boolean(row.is_justified),
      visa_vie_scolaire: Boolean(row.visa_vie_scolaire),
    }));

    safeSetStorage("avenida_custom_absences", remote);
    broadcastDataChange();
    return remote;
  } catch (err) {
    console.warn("Sync Supabase absences échouée:", err);
    return getStoredAbsences();
  }
}

export async function saveAndSyncAbsence(ticket: AbsenceTicket): Promise<AbsenceTicket[]> {
  const current = getStoredAbsences();
  const filtered = current.filter((a) => a.id !== ticket.id);
  const updatedList = [ticket, ...filtered];

  safeSetStorage("avenida_custom_absences", updatedList);

  // Synchronisation Supabase Cloud
  try {
    const supabase = createClient();
    await supabase.from("student_absences").insert({
      ticket_number: `ABS-${ticket.ticket_number}`,
      student_name: ticket.student_name,
      class_name: ticket.class_name,
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      reason: ticket.reason,
      is_justified: Boolean(ticket.parent_justified),
      visa_vie_scolaire: Boolean(ticket.visa_vie_scolaire),
    });
  } catch (err) {
    console.warn("Sync Supabase absence non bloquante :", err);
  }

  notifyDirector(
    "student",
    `Billet d'Absence Enregistré : ${ticket.student_name}`,
    `Classe : ${ticket.class_name} • Motif : ${ticket.reason} • Justifié : ${ticket.parent_justified ? "Oui" : "Non"}`
  );

  broadcastDataChange();
  return updatedList;
}

export function getStoredLates(): LateTicket[] {
  if (typeof window === "undefined") return MOCK_LATES;
  try {
    const raw = localStorage.getItem("avenida_custom_lates");
    if (!raw) return MOCK_LATES;
    const parsed = JSON.parse(raw) as LateTicket[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_LATES;
    return parsed;
  } catch (err) {
    console.warn("Erreur lecture retards locaux:", err);
    return MOCK_LATES;
  }
}

export async function syncLatesFromSupabase(): Promise<LateTicket[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("student_lates").select("*");
    if (error || !data || data.length === 0) return getStoredLates();

    const remote: LateTicket[] = data.map((row: any, i: number) => ({
      id: row.id || `lat-${row.ticket_number || i}`,
      ticket_number: Number(String(row.ticket_number).replace(/\D/g, "")) || i + 1,
      student_name: row.student_name || "Élève",
      class_name: row.class_name || "Formation Hôtelière",
      duration_minutes: Number(row.duration_minutes) || 15,
      reason: row.reason || "",
      destination: row.orientation || "classe",
      visa_vie_scolaire: true,
      date: row.date || new Date().toISOString(),
    }));

    safeSetStorage("avenida_custom_lates", remote);
    broadcastDataChange();
    return remote;
  } catch (err) {
    console.warn("Sync Supabase retards échouée:", err);
    return getStoredLates();
  }
}

export async function saveAndSyncLate(ticket: LateTicket): Promise<LateTicket[]> {
  const current = getStoredLates();
  const filtered = current.filter((l) => l.id !== ticket.id);
  const updatedList = [ticket, ...filtered];

  safeSetStorage("avenida_custom_lates", updatedList);

  // Synchronisation Supabase Cloud
  try {
    const supabase = createClient();
    await supabase.from("student_lates").insert({
      ticket_number: `RET-${ticket.ticket_number}`,
      student_name: ticket.student_name,
      class_name: ticket.class_name,
      date: new Date().toISOString().split("T")[0],
      duration_minutes: ticket.duration_minutes,
      reason: ticket.reason,
      orientation: ticket.destination || "classe",
    });
  } catch (err) {
    console.warn("Sync Supabase retard non bloquant :", err);
  }

  notifyDirector(
    "student",
    `Billet de Retard : ${ticket.student_name} (${ticket.duration_minutes} min)`,
    `Classe : ${ticket.class_name} • Motif : ${ticket.reason}`
  );

  broadcastDataChange();
  return updatedList;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. SALAIRES & BULLETINS DE PAIE
// ─────────────────────────────────────────────────────────────────────────────

export function getStoredSalaries(): SalaryRecord[] {
  if (typeof window === "undefined") return MOCK_SALARIES;
  try {
    const raw = localStorage.getItem("avenida_custom_salaries");
    if (!raw) return MOCK_SALARIES;
    const parsed = JSON.parse(raw) as SalaryRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_SALARIES;
    const customRefs = new Set(parsed.map((s) => s.slip_ref));
    const mocks = MOCK_SALARIES.filter((m) => !customRefs.has(m.slip_ref));
    return [...parsed, ...mocks];
  } catch (err) {
    console.warn("Erreur lecture salaires locaux:", err);
    return MOCK_SALARIES;
  }
}

export async function syncSalariesFromSupabase(): Promise<SalaryRecord[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("salary_records").select("*");
    if (error || !data || data.length === 0) return getStoredSalaries();

    const remote: SalaryRecord[] = data.map((row: any) => ({
      id: row.id,
      slip_ref: row.slip_ref,
      employee_id: row.employee_id,
      employee_name: row.employee_name,
      employee_matricule: row.employee_matricule || row.matricule || "",
      sector: (row.sector || "ecole") as "ecole" | "hotel",
      role_title: row.role_title || row.position || "",
      period_month: row.period_month || row.pay_period || "",
      base_salary: Number(row.base_salary) || 0,
      bonuses: Number(row.bonuses || row.allowances) || 0,
      cnss_deduction: Number(row.cnss_deduction || row.deductions) || 0,
      net_payable: Number(row.net_payable || row.net_salary) || 0,
      payment_method: row.payment_method || "Virement Bancaire",
      payment_date: row.payment_date || new Date().toISOString().split("T")[0],
      status: (row.status || "payé") as "payé" | "validé" | "en_attente",
    }));

    const current = getStoredSalaries();
    const remoteRefs = new Set(remote.map((s) => s.slip_ref));
    const merged = [...remote, ...current.filter((s) => !remoteRefs.has(s.slip_ref))];
    safeSetStorage("avenida_custom_salaries", merged);
    broadcastDataChange();
    return merged;
  } catch (err) {
    console.warn("Sync Supabase salaires échouée:", err);
    return getStoredSalaries();
  }
}

export async function saveAndSyncSalary(record: SalaryRecord): Promise<SalaryRecord[]> {
  const current = getStoredSalaries();
  const filtered = current.filter((s) => s.id !== record.id && s.slip_ref !== record.slip_ref);
  const updatedList = [record, ...filtered];
  safeSetStorage("avenida_custom_salaries", updatedList);

  try {
    const supabase = createClient();
    const { error } = await supabase.from("salary_records").upsert(
      {
        slip_ref: record.slip_ref,
        employee_id: record.employee_id,
        employee_name: record.employee_name,
        employee_matricule: record.employee_matricule,
        sector: record.sector,
        role_title: record.role_title,
        period_month: record.period_month,
        pay_period: record.period_month,
        base_salary: record.base_salary,
        bonuses: record.bonuses,
        allowances: record.bonuses,
        cnss_deduction: record.cnss_deduction,
        deductions: record.cnss_deduction,
        net_payable: record.net_payable,
        net_salary: record.net_payable,
        payment_method: record.payment_method,
        payment_date: record.payment_date,
        status: record.status,
        period_name: record.period_month,
        raw_data: { ...record },
      },
      { onConflict: "slip_ref" }
    );
    if (error) console.error("❌ Erreur enregistrement Supabase (salaires) :", error.message);
    else console.log("✅ Bulletin de paie synchronisé dans Supabase :", record.slip_ref);
  } catch (err) {
    console.warn("Sync Supabase salaire non bloquante:", err);
  }

  notifyDirector(
    "employee",
    `Bulletin de Paie Émis : ${record.employee_name}`,
    `Réf ${record.slip_ref} • Net versé : ${record.net_payable.toLocaleString()} F CFA • Période : ${record.period_month}`
  );

  broadcastDataChange();
  return updatedList;
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. STOCK & INVENTAIRE
// ─────────────────────────────────────────────────────────────────────────────
export function getStoredInventory(): InventoryItem[] {
  if (typeof window === "undefined") return MOCK_INVENTORY;
  try {
    const raw = localStorage.getItem("avenida_custom_inventory");
    if (!raw) return MOCK_INVENTORY;
    const parsed = JSON.parse(raw) as InventoryItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_INVENTORY;
    return parsed;
  } catch (err) {
    console.warn("Erreur lecture inventaire local:", err);
    return MOCK_INVENTORY;
  }
}

export async function syncInventoryFromSupabase(): Promise<InventoryItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("products").select("*");
    if (error || !data || data.length === 0) return getStoredInventory();

    const remote: InventoryItem[] = data.map((row: any) => ({
      id: row.id,
      code: row.sku || `STK-${row.id.slice(0, 6)}`,
      name: row.name || "",
      category: row.category || "Cuisine & Épicerie",
      quantity: Number(row.current_quantity) || 0,
      unit: row.unit || "pièce",
      min_alert_threshold: Number(row.minimum_stock_alert) || 5,
      unit_price: Number(row.average_cost_price) || 0,
      supplier: row.supplier || "",
      last_restock_date: row.last_restock_date || new Date().toISOString().split("T")[0],
      location: row.location || "Économat Principal",
    }));

    const current = getStoredInventory();
    const remoteCodes = new Set(remote.map((i) => i.code));
    const merged = [...remote, ...current.filter((i) => !remoteCodes.has(i.code))];
    safeSetStorage("avenida_custom_inventory", merged);
    broadcastDataChange();
    return merged;
  } catch (err) {
    console.warn("Sync Supabase inventaire échouée:", err);
    return getStoredInventory();
  }
}

export async function saveAndSyncInventoryItem(item: InventoryItem): Promise<InventoryItem[]> {
  const current = getStoredInventory();
  const exists = current.some((i) => i.id === item.id || i.code === item.code);
  const updatedList = exists
    ? current.map((i) => (i.id === item.id || i.code === item.code ? item : i))
    : [item, ...current];
  safeSetStorage("avenida_custom_inventory", updatedList);

  try {
    const supabase = createClient();
    const { error } = await supabase.from("products").upsert(
      {
        sku: item.code,
        name: item.name,
        category: item.category,
        current_quantity: item.quantity,
        unit: item.unit,
        minimum_stock_alert: item.min_alert_threshold,
        average_cost_price: item.unit_price,
        supplier: item.supplier,
        last_restock_date: item.last_restock_date,
        location: item.location,
        raw_data: { ...item },
      },
      { onConflict: "sku" }
    );
    if (error) console.error("❌ Erreur enregistrement Supabase (produits) :", error.message);
    else console.log("✅ Article inventaire synchronisé dans Supabase (products) :", item.code);
  } catch (err) {
    console.warn("Sync Supabase inventaire non bloquante:", err);
  }

  broadcastDataChange();
  return updatedList;
}

export async function updateInventoryQuantity(
  itemCode: string,
  newQuantity: number
): Promise<InventoryItem[]> {
  const current = getStoredInventory();
  const updatedList = current.map((i) =>
    i.code === itemCode ? { ...i, quantity: newQuantity } : i
  );
  safeSetStorage("avenida_custom_inventory", updatedList);

  try {
    const supabase = createClient();
    await supabase
      .from("products")
      .update({ current_quantity: newQuantity })
      .eq("sku", itemCode);
  } catch (err) {
    console.warn("Sync Supabase mise à jour quantité non bloquante:", err);
  }

  broadcastDataChange();
  return updatedList;
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. NOTES & ÉVALUATIONS INDIVIDUELLES
// ─────────────────────────────────────────────────────────────────────────────
export function getStoredGrades(): GradeRecord[] {
  if (typeof window === "undefined") return MOCK_GRADES;
  try {
    const raw = localStorage.getItem("avenida_custom_grades");
    if (!raw) return MOCK_GRADES;
    const parsed = JSON.parse(raw) as GradeRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_GRADES;
    return parsed;
  } catch (err) {
    console.warn("Erreur lecture notes locales:", err);
    return MOCK_GRADES;
  }
}

export async function syncGradesFromSupabase(): Promise<GradeRecord[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("grades").select("*");
    if (error || !data || data.length === 0) return getStoredGrades();

    const remote: GradeRecord[] = data.map((row: any) => ({
      id: row.id,
      student_name: row.student_name || "Élève Avenida",
      student_matricule: row.student_matricule || "",
      class_name: row.class_name || "Classe",
      subject: row.subject || "Discipline",
      evaluation_type: row.evaluation_type || "Devoir Écrit",
      score: Number(row.score) || 0,
      coefficient: Number(row.coefficient) || 1,
      date: row.date || new Date().toISOString().split("T")[0],
      teacher_name: row.teacher_name || "Formateur",
      appreciation: row.appreciation || row.note || "",
    }));

    const current = getStoredGrades();
    const remoteIds = new Set(remote.map((g) => g.id));
    const merged = [...remote, ...current.filter((c) => !remoteIds.has(c.id))];
    safeSetStorage("avenida_custom_grades", merged);
    broadcastDataChange();
    return merged;
  } catch (err) {
    console.warn("Sync Supabase notes échouée:", err);
    return getStoredGrades();
  }
}

export async function saveAndSyncGrade(grade: GradeRecord): Promise<GradeRecord[]> {
  const current = getStoredGrades();
  const filtered = current.filter((g) => g.id !== grade.id);
  const updatedList = [grade, ...filtered];
  safeSetStorage("avenida_custom_grades", updatedList);

  try {
    const supabase = createClient();
    const { error } = await supabase.from("grades").upsert(
      {
        student_name: grade.student_name,
        student_matricule: grade.student_matricule,
        class_name: grade.class_name,
        subject: grade.subject,
        evaluation_type: grade.evaluation_type,
        score: grade.score,
        coefficient: grade.coefficient,
        date: grade.date,
        teacher_name: grade.teacher_name,
        appreciation: grade.appreciation,
        note: grade.appreciation,
        raw_data: { ...grade },
      }
    );
    if (error) console.error("❌ Erreur enregistrement Supabase (notes) :", error.message);
    else console.log("✅ Note synchronisée dans Supabase :", grade.student_name, grade.score);
  } catch (err) {
    console.warn("Sync Supabase note non bloquante:", err);
  }

  broadcastDataChange();
  return updatedList;
}

