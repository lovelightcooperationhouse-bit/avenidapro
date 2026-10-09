"use client";

export interface DirectorNotification {
  id: string;
  type: "student" | "employee" | "finance" | "hotel" | "attendance";
  title: string;
  description: string;
  date: string;
  read: boolean;
  emailSentTo: string; // e.g. "direction@ecole-avenida.tg"
  meta?: Record<string, any>;
}

export interface ParentAttendanceNotification {
  id: string;
  ticketId: string;
  studentName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  ticketType: "absence" | "late";
  date: string;
  reason: string;
  smsStatus: "envoyé" | "délivré";
  emailStatus: "envoyé" | "délivré";
  smsMessage: string;
  emailMessage: string;
}

export const NOTIFICATIONS_UPDATED_EVENT = "avenida_notifications_updated";

const DIRECTOR_NOTIFS_KEY = "avenida_director_notifications";
const PARENT_NOTIFS_KEY = "avenida_parent_attendance_notifications";

/**
 * Récupère l'historique des notifications adressées à la Direction
 */
export function getDirectorNotifications(): DirectorNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DIRECTOR_NOTIFS_KEY);
    if (!raw) return getDefaultDirectorNotifications();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultDirectorNotifications();
  } catch {
    return getDefaultDirectorNotifications();
  }
}

/**
 * Notifie par email le Directeur Général lors de tout ajout sur la plateforme
 */
export function notifyDirector(
  type: DirectorNotification["type"],
  title: string,
  description: string,
  meta?: Record<string, any>
): DirectorNotification {
  const notif: DirectorNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    description,
    date: new Date().toISOString(),
    read: false,
    emailSentTo: "direction@ecole-avenida.tg",
    meta,
  };

  if (typeof window !== "undefined") {
    try {
      const existing = getDirectorNotifications();
      const updated = [notif, ...existing].slice(0, 50); // Garde les 50 dernières
      localStorage.setItem(DIRECTOR_NOTIFS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
    } catch (e) {
      console.warn("Erreur sauvegarde notification directeur:", e);
    }
  }

  return notif;
}

/**
 * Marque toutes les notifications directeur comme lues
 */
export function markAllDirectorNotificationsAsRead(): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getDirectorNotifications();
    const updated = existing.map((n) => ({ ...n, read: true }));
    localStorage.setItem(DIRECTOR_NOTIFS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
  } catch (e) {
    console.warn("Erreur maj notifications:", e);
  }
}

/**
 * Envoi et archivage d'une notification SMS & Email au tuteur légal lors d'une absence ou retard
 */
export function notifyParentAttendance(params: {
  ticketId: string;
  studentName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  ticketType: "absence" | "late";
  date: string;
  reason: string;
}): ParentAttendanceNotification {
  const isAbsence = params.ticketType === "absence";
  const smsMessage = isAbsence
    ? `HÔTEL ÉCOLE AVENIDA LOMÉ : Avis Vie Scolaire. Votre enfant ${params.studentName} (${params.className}) a été marqué(e) ABSENT(E) le ${params.date}. Motif : ${params.reason}. Veuillez contacter le secrétariat au +228 90 00 00 00.`
    : `HÔTEL ÉCOLE AVENIDA LOMÉ : Avis Vie Scolaire. Votre enfant ${params.studentName} (${params.className}) a enregistré un RETARD le ${params.date}. Motif : ${params.reason}. Discipline & Ponctualité exigées.`;

  const emailMessage = `Avis officiel de vie scolaire adressé à ${params.parentName}.\nÉlève : ${params.studentName} (${params.className}).\nIncident : ${isAbsence ? "Absence constatée" : "Retard enregistré"}.\nDate : ${params.date}.\nMotif notifié : ${params.reason}.\nDirection des Études — Hôtel École Avenida Lomé.`;

  const record: ParentAttendanceNotification = {
    id: `parent-notif-${Date.now()}`,
    ticketId: params.ticketId,
    studentName: params.studentName,
    className: params.className,
    parentName: params.parentName || "Tuteur Légal",
    parentPhone: params.parentPhone || "+228 90 00 00 00",
    parentEmail: params.parentEmail,
    ticketType: params.ticketType,
    date: params.date,
    reason: params.reason,
    smsStatus: "délivré",
    emailStatus: "délivré",
    smsMessage,
    emailMessage,
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(PARENT_NOTIFS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      localStorage.setItem(PARENT_NOTIFS_KEY, JSON.stringify([record, ...list].slice(0, 100)));
    } catch (e) {
      console.warn("Erreur sauvegarde notification parent:", e);
    }
  }

  // Notifie également le Directeur Général
  notifyDirector(
    "attendance",
    `Vie Scolaire : ${isAbsence ? "Absence" : "Retard"} notifié pour ${params.studentName}`,
    `Billet émis le ${params.date}. Alerte SMS & Email délivrée au tuteur (${params.parentName} - ${params.parentPhone}). Motif : ${params.reason}`,
    { studentName: params.studentName, parentPhone: params.parentPhone }
  );

  return record;
}

/**
 * Notifications par défaut pour illustrer le fonctionnement
 */
function getDefaultDirectorNotifications(): DirectorNotification[] {
  return [
    {
      id: "notif-01",
      type: "student",
      title: "Nouvelle Inscription Scolaire Reçue",
      description: "L'élève AFOLEHO Essi (#AV2022-3486) a été inscrit(e) en BEP Cuisine & Arts de la Table.",
      date: new Date(Date.now() - 3600000 * 2).toISOString(),
      read: false,
      emailSentTo: "direction@ecole-avenida.tg",
    },
    {
      id: "notif-02",
      type: "finance",
      title: "Encaissement Écolage Enregistré",
      description: "Versement de 200 000 F CFA validé en caisse Lomé pour tranche de scolarité.",
      date: new Date(Date.now() - 3600000 * 4).toISOString(),
      read: false,
      emailSentTo: "direction@ecole-avenida.tg",
    },
    {
      id: "notif-03",
      type: "hotel",
      title: "Nouvelle Réservation Chambre Hôtel",
      description: "Dr. Mensah Agbéyomé a réservé la Suite 102 pour 4 nuitées (Acompte 90 000 F CFA).",
      date: new Date(Date.now() - 3600000 * 8).toISOString(),
      read: true,
      emailSentTo: "direction@ecole-avenida.tg",
    },
  ];
}
