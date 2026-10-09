"use client";

import {
  MOCK_STUDENTS,
  MOCK_EMPLOYEES,
  MOCK_CUSTOMERS,
  MOCK_FINANCES,
  MOCK_ROOMS,
  MOCK_RECEIPTS,
  MOCK_RESERVATIONS,
} from "@/lib/mock-data";
import {
  Student,
  Employee,
  HotelCustomer,
  FinancialEntry,
  HotelRoom,
  PaymentReceipt,
  HotelReservation,
  DiplomeCode,
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
    const customMatricules = new Set(parsed.map((s) => s.registration_number));
    const mocks = MOCK_STUDENTS.filter((m) => !customMatricules.has(m.registration_number));
    return [...parsed, ...mocks];
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
    }));

    // Fusionner les élèves distants avec les locaux existants
    const current = getStoredStudents();
    const remoteMatricules = new Set(remoteStudents.map((s) => s.registration_number));
    const merged = [
      ...remoteStudents,
      ...current.filter((s) => !remoteMatricules.has(s.registration_number)),
    ];

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
      status: row.status === "sorti" ? "inactif" : "actif",
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
        hire_date: employee.hire_date,
        status: employee.status === "inactif" ? "sorti" : "actif",
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
    const customIds = new Set(parsed.map((r) => r.id));
    const mocks = MOCK_ROOMS.filter((m) => !customIds.has(m.id));
    return [...parsed, ...mocks];
  } catch (err) {
    console.warn("Erreur lecture chambres locales:", err);
    return MOCK_ROOMS;
  }
}

export async function saveAndSyncRoom(room: HotelRoom): Promise<HotelRoom[]> {
  const current = getStoredRooms();
  const updatedList = current.map((r) => (r.id === room.id ? room : r));

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
    const customIds = new Set(parsed.map((r) => r.id));
    const mocks = MOCK_RECEIPTS.filter((m) => !customIds.has(m.id));
    return [...parsed, ...mocks];
  } catch (err) {
    console.warn("Erreur lecture reçus locaux:", err);
    return MOCK_RECEIPTS;
  }
}

export async function saveAndSyncReceipt(receipt: PaymentReceipt): Promise<PaymentReceipt[]> {
  const current = getStoredReceipts();
  const filtered = current.filter((r) => r.id !== receipt.id && r.reference !== receipt.reference);
  const updatedList = [receipt, ...filtered];

  safeSetStorage("avenida_custom_receipts", updatedList);

  // Synchronisation Supabase en arrière-plan
  try {
    const supabase = createClient();
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

  broadcastDataChange();
  return updatedList;
}
