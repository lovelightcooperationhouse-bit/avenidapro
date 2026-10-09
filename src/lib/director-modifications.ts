"use client";

import { Student, Employee, HotelCustomer } from "@/types";
import {
  getStoredStudents,
  saveAndSyncStudent,
  getStoredEmployees,
  saveAndSyncEmployee,
  getStoredCustomers,
  saveAndSyncCustomer,
  broadcastDataChange,
} from "@/lib/realtime-store";
import { notifyDirector } from "@/lib/notifications";

export type EntityType = "student" | "employee" | "customer";

export interface ModificationRequest {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  entity_name: string;
  entity_code?: string;
  requested_by: string;
  requested_at: string;
  status: "en_attente_directeur" | "approuve" | "rejete";
  proposed_changes: Record<string, any>;
  previous_data: Record<string, any>;
  director_notes?: string;
  approved_by?: string;
  approved_at?: string;
}

export const MODIFICATIONS_UPDATED_EVENT = "avenida_modifications_updated";
export const DIRECTOR_SECURITY_PIN = "avenida"; // Code PIN d'habilitation du Directeur Général

function broadcastModifications() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MODIFICATIONS_UPDATED_EVENT));
  }
}

export function getAllModifications(): ModificationRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("avenida_modifications_requests");
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn("Erreur lecture demandes de modifications:", e);
    return [];
  }
}

export function getPendingModifications(): ModificationRequest[] {
  return getAllModifications().filter((m) => m.status === "en_attente_directeur");
}

function saveModifications(list: ModificationRequest[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("avenida_modifications_requests", JSON.stringify(list));
    broadcastModifications();
  } catch (e) {
    console.error("Erreur sauvegarde demandes de modifications:", e);
  }
}

export function verifyDirectorPin(pin: string): boolean {
  if (!pin) return false;
  return pin.trim().toLowerCase() === DIRECTOR_SECURITY_PIN.toLowerCase();
}

/**
 * Soumet une demande de modification qui sera en attente d'approbation par le Directeur Général
 */
export function requestEntityModification(params: {
  entity_type: EntityType;
  entity_id: string;
  entity_name: string;
  entity_code?: string;
  previous_data: Record<string, any>;
  proposed_changes: Record<string, any>;
  requested_by?: string;
}): ModificationRequest {
  const list = getAllModifications();
  const newReq: ModificationRequest = {
    id: `mod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    entity_name: params.entity_name,
    entity_code: params.entity_code,
    requested_by: params.requested_by || "Opérateur / Personnel",
    requested_at: new Date().toISOString(),
    status: "en_attente_directeur",
    proposed_changes: params.proposed_changes,
    previous_data: params.previous_data,
  };

  const updated = [newReq, ...list];
  saveModifications(updated);

  const typeLabels = {
    student: "Élève",
    employee: "Professeur / Collaborateur",
    customer: "Client Hôtel",
  };

  notifyDirector(
    params.entity_type === "customer" ? "hotel" : "student",
    `Demande de Modification Requise : ${params.entity_name}`,
    `Type: ${typeLabels[params.entity_type]} • Soumis par: ${newReq.requested_by} • En attente de votre visa hiérarchique.`
  );

  return newReq;
}

/**
 * Applique immédiatement les modifications si le Directeur Général valide directement (sur le champ ou via son rôle)
 */
export async function applyImmediateDirectorModification(params: {
  entity_type: EntityType;
  entity_id: string;
  entity_name: string;
  entity_code?: string;
  previous_data: Record<string, any>;
  proposed_changes: Record<string, any>;
  director_name?: string;
  director_notes?: string;
}): Promise<void> {
  const director = params.director_name || "M. Hope d'Almeida (Directeur Général)";

  // 1. Appliquer les modifications selon le type
  if (params.entity_type === "student") {
    const students = getStoredStudents();
    const current = students.find((s) => s.id === params.entity_id || s.registration_number === params.entity_id);
    if (current) {
      const merged: Student = { ...current, ...params.proposed_changes };
      await saveAndSyncStudent(merged);
    }
  } else if (params.entity_type === "employee") {
    const employees = getStoredEmployees();
    const current = employees.find((e) => e.id === params.entity_id || e.matricule === params.entity_id);
    if (current) {
      const merged: Employee = { ...current, ...params.proposed_changes };
      await saveAndSyncEmployee(merged);
    }
  } else if (params.entity_type === "customer") {
    const customers = getStoredCustomers();
    const current = customers.find((c) => c.id === params.entity_id || c.code === params.entity_id);
    if (current) {
      const merged: HotelCustomer = { ...current, ...params.proposed_changes };
      await saveAndSyncCustomer(merged);
    }
  }

  // 2. Enregistrer l'historique de visa du Directeur
  const list = getAllModifications();
  const logReq: ModificationRequest = {
    id: `mod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    entity_name: params.entity_name,
    entity_code: params.entity_code,
    requested_by: director,
    requested_at: new Date().toISOString(),
    status: "approuve",
    proposed_changes: params.proposed_changes,
    previous_data: params.previous_data,
    director_notes: params.director_notes || "Modification validée et appliquée avec visa de la Direction Générale.",
    approved_by: director,
    approved_at: new Date().toISOString(),
  };

  saveModifications([logReq, ...list]);
  broadcastDataChange();
}

/**
 * Approuve une demande de modification en attente et l'applique immédiatement à la base
 */
export async function approveModificationRequest(
  requestId: string,
  directorName = "M. Hope d'Almeida (Directeur Général)",
  notes?: string
): Promise<void> {
  const list = getAllModifications();
  const target = list.find((m) => m.id === requestId);
  if (!target) return;

  // Appliquer les données
  if (target.entity_type === "student") {
    const students = getStoredStudents();
    const current = students.find((s) => s.id === target.entity_id || s.registration_number === target.entity_id);
    if (current) {
      const merged: Student = { ...current, ...target.proposed_changes };
      await saveAndSyncStudent(merged);
    }
  } else if (target.entity_type === "employee") {
    const employees = getStoredEmployees();
    const current = employees.find((e) => e.id === target.entity_id || e.matricule === target.entity_id);
    if (current) {
      const merged: Employee = { ...current, ...target.proposed_changes };
      await saveAndSyncEmployee(merged);
    }
  } else if (target.entity_type === "customer") {
    const customers = getStoredCustomers();
    const current = customers.find((c) => c.id === target.entity_id || c.code === target.entity_id);
    if (current) {
      const merged: HotelCustomer = { ...current, ...target.proposed_changes };
      await saveAndSyncCustomer(merged);
    }
  }

  // Mettre à jour le statut
  const updated = list.map((m) =>
    m.id === requestId
      ? {
          ...m,
          status: "approuve" as const,
          approved_by: directorName,
          approved_at: new Date().toISOString(),
          director_notes: notes || "Visa accordé par le Directeur Général.",
        }
      : m
  );

  saveModifications(updated);
  broadcastDataChange();
}

/**
 * Rejette une demande de modification
 */
export async function rejectModificationRequest(
  requestId: string,
  directorName = "M. Hope d'Almeida (Directeur Général)",
  reason = "Demande non conforme aux directives de la Direction Générale."
): Promise<void> {
  const list = getAllModifications();
  const updated = list.map((m) =>
    m.id === requestId
      ? {
          ...m,
          status: "rejete" as const,
          approved_by: directorName,
          approved_at: new Date().toISOString(),
          director_notes: reason,
        }
      : m
  );

  saveModifications(updated);
  broadcastModifications();
}
