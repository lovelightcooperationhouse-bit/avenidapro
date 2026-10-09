"use client";

import {
  MOCK_STUDENTS,
  MOCK_EMPLOYEES,
  MOCK_CUSTOMERS,
  MOCK_FINANCES,
  MOCK_ROOMS,
  MOCK_RECEIPTS,
} from "@/lib/mock-data";
import {
  Student,
  Employee,
  HotelCustomer,
  FinancialEntry,
  HotelRoom,
  PaymentReceipt,
} from "@/types";
import { createClient } from "@/lib/supabase/client";

export const AVENIDA_DATA_UPDATED_EVENT = "avenida_data_updated";

/**
 * Notifie tous les écouteurs de l'application que les données ont été mises à jour
 */
export function broadcastDataChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AVENIDA_DATA_UPDATED_EVENT));
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

export async function saveAndSyncStudent(student: Student): Promise<Student[]> {
  const current = getStoredStudents();
  const filtered = current.filter((s) => s.id !== student.id && s.registration_number !== student.registration_number);
  const updatedList = [student, ...filtered];

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("avenida_custom_students", JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Storage plein", e);
    }
  }

  // Synchronisation Supabase en arrière-plan
  try {
    const supabase = createClient();
    await supabase.from("students").upsert(
      {
        registration_number: student.registration_number,
        student_number: student.student_number || student.registration_number,
        first_name: student.first_name,
        last_name: student.last_name,
        gender: student.gender,
        birth_date: student.birth_date,
        birth_place: student.birth_place,
        nationality: student.nationality,
        residence_neighborhood: student.residence_neighborhood,
        phone: student.phone,
        email: student.email,
        boarder_status: student.boarder_status || "externe",
        emergency_contact_name: student.emergency_contact_name,
        emergency_contact_phone: student.emergency_contact_phone,
        photo_url: student.photo_url,
        status: student.status || "actif",
      },
      { onConflict: "registration_number" }
    );
  } catch (err) {
    console.warn("Sync Supabase élève non bloquante:", err);
  }

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

export async function saveAndSyncEmployee(employee: Employee): Promise<Employee[]> {
  const current = getStoredEmployees();
  const filtered = current.filter((e) => e.id !== employee.id && e.matricule !== employee.matricule);
  const updatedList = [employee, ...filtered];

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("avenida_custom_employees", JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Storage plein", e);
    }
  }

  // Synchronisation Supabase en arrière-plan
  try {
    const supabase = createClient();
    await supabase.from("employees").upsert(
      {
        matricule: employee.matricule,
        first_name: employee.first_name,
        last_name: employee.last_name,
        position: employee.role_title,
        contract_type: employee.contract_type,
        base_salary: employee.base_salary,
        hire_date: employee.hire_date,
        status: employee.status === "inactif" ? "sorti" : "actif",
      },
      { onConflict: "matricule" }
    );
  } catch (err) {
    console.warn("Sync Supabase employé non bloquante:", err);
  }

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

export async function saveAndSyncCustomer(customer: HotelCustomer): Promise<HotelCustomer[]> {
  const current = getStoredCustomers();
  const filtered = current.filter((c) => c.id !== customer.id);
  const updatedList = [customer, ...filtered];

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("avenida_custom_customers", JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Storage plein", e);
    }
  }

  // Synchronisation Supabase en arrière-plan
  try {
    const supabase = createClient();
    const parts = customer.full_name.trim().split(" ");
    const firstName = parts[0] || "Client";
    const lastName = parts.slice(1).join(" ") || "Avenida";

    await supabase.from("hotel_customers").upsert(
      {
        first_name: firstName,
        last_name: lastName,
        email: customer.email,
        phone: customer.phone,
        nationality: customer.nationality,
        id_card_or_passport: customer.id_card_or_passport,
      },
      { onConflict: "phone" }
    );
  } catch (err) {
    console.warn("Sync Supabase client hôtel non bloquante:", err);
  }

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

export async function saveAndSyncFinance(entry: FinancialEntry): Promise<FinancialEntry[]> {
  const current = getStoredFinances();
  const filtered = current.filter((f) => f.id !== entry.id);
  const updatedList = [entry, ...filtered];

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("avenida_custom_finances", JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Storage plein", e);
    }
  }

  broadcastDataChange();
  return updatedList;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CHAMBRES & HÉBERGEMENT
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

export function saveAndSyncRoom(room: HotelRoom): HotelRoom[] {
  const current = getStoredRooms();
  const updatedList = current.map((r) => (r.id === room.id ? room : r));

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("avenida_custom_rooms", JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Storage plein", e);
    }
  }

  broadcastDataChange();
  return updatedList;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ENCAISSEMENTS & REÇUS D'ÉCOLAGE
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
  const filtered = current.filter((r) => r.id !== receipt.id);
  const updatedList = [receipt, ...filtered];

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("avenida_custom_receipts", JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Storage plein", e);
    }
  }

  // Synchronisation Supabase en arrière-plan
  try {
    const supabase = createClient();
    await supabase.from("fee_payments").upsert(
      {
        receipt_number: receipt.reference,
        amount: receipt.amount_paid,
        payment_method: receipt.payment_method,
        depositor_name: receipt.depositor_name,
        depositor_id_card: receipt.depositor_id_card,
        depositor_role: receipt.depositor_role,
        site: receipt.site || "LOMÉ",
        status: "validé",
      },
      { onConflict: "receipt_number" }
    );
  } catch (err) {
    console.warn("Sync Supabase encaissement non bloquante:", err);
  }

  broadcastDataChange();
  return updatedList;
}
