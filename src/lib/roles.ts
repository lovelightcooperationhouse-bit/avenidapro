/**
 * Rôles de la plateforme et périmètre de chacun.
 * Le rôle d'un compte est stocké dans public.profiles.role et protégé côté base (RLS) :
 * cette table ne sert qu'à l'affichage et à la navigation.
 */

export type RoleType =
  | "directeur_general"
  | "directeur_pedagogique"
  | "comptable"
  | "ressources_humaines"
  | "responsable_hotel"
  | "personnel"
  | "professeur"
  | "eleve"
  | "parent"
  | "candidat";

/** Rôles qui travaillent dans l'espace de gestion (/dashboard). Les autres ont leur espace personnel (/espace). */
export const STAFF_ROLES: RoleType[] = [
  "directeur_general",
  "directeur_pedagogique",
  "comptable",
  "ressources_humaines",
  "responsable_hotel",
  "personnel",
];

export const isStaffRole = (role: string | null | undefined): role is RoleType => STAFF_ROLES.includes(role as RoleType);

export type RoleConfig = {
  label: string;
  description: string;
  department: string;
  avatarColor: string;
  /** Page d'accueil après connexion. */
  home: "/dashboard" | "/espace";
  /** Pages de l'espace de gestion accessibles (le Directeur Général accède à tout). */
  allowedPaths: string[];
};

export const ROLE_CONFIG: Record<RoleType, RoleConfig> = {
  directeur_general: {
    label: "Directeur Général",
    description: "Contrôle total : école, hôtel, finances, personnel, comptes et rapports consolidés.",
    department: "Direction Générale",
    avatarColor: "from-[#DC2626] to-[#991B1B]",
    home: "/dashboard",
    allowedPaths: ["/dashboard"],
  },
  directeur_pedagogique: {
    label: "Directeur Pédagogique",
    description: "Dossiers des élèves, inscriptions, filières, absences, retards, notes et écolages.",
    department: "Direction des Études",
    avatarColor: "from-[#0C356A] to-[#1E4D82]",
    home: "/dashboard",
    allowedPaths: ["/dashboard", "/dashboard/admissions", "/dashboard/students", "/dashboard/programs", "/dashboard/attendance", "/dashboard/grades", "/dashboard/payments", "/dashboard/demandes", "/dashboard/messages", "/dashboard/alertes", "/dashboard/correspondance", "/dashboard/cartes", "/dashboard/recherche", "/dashboard/economat"],
  },
  comptable: {
    label: "Comptabilité",
    description: "Comptes de l'école et de l'hôtel : écolages, séjours, entrées et sorties, salaires.",
    department: "Service Financier",
    avatarColor: "from-emerald-600 to-teal-800",
    home: "/dashboard",
    allowedPaths: ["/dashboard", "/dashboard/payments", "/dashboard/finances", "/dashboard/salaries", "/dashboard/reports", "/dashboard/inventory", "/dashboard/messages", "/dashboard/alertes", "/dashboard/economat", "/dashboard/recherche"],
  },
  ressources_humaines: {
    label: "Ressources Humaines",
    description: "Professeurs et personnel de l'hôtel : profils, contrats et salaires.",
    department: "Ressources Humaines",
    avatarColor: "from-amber-600 to-orange-700",
    home: "/dashboard",
    allowedPaths: ["/dashboard", "/dashboard/employees", "/dashboard/salaries", "/dashboard/messages", "/dashboard/alertes", "/dashboard/cartes", "/dashboard/recherche"],
  },
  responsable_hotel: {
    label: "Responsable Hôtel",
    description: "Chambres, réservations et fichier clients de l'hôtel.",
    department: "Hébergement & Réception",
    avatarColor: "from-rose-600 to-red-800",
    home: "/dashboard",
    allowedPaths: ["/dashboard", "/dashboard/hotel", "/dashboard/reservations", "/dashboard/customers", "/dashboard/demandes", "/dashboard/messages", "/dashboard/alertes", "/dashboard/economat", "/dashboard/recherche"],
  },
  personnel: {
    label: "Personnel",
    description: "Opérations courantes de l'hôtel et de l'économat.",
    department: "Personnel Avenida",
    avatarColor: "from-slate-600 to-slate-800",
    home: "/dashboard",
    allowedPaths: ["/dashboard", "/dashboard/hotel", "/dashboard/reservations", "/dashboard/inventory", "/dashboard/demandes", "/dashboard/messages"],
  },
  professeur: {
    label: "Professeur",
    description: "Classes attribuées, suivi des élèves, notes et échanges avec les familles.",
    department: "Corps enseignant",
    avatarColor: "from-[#0C356A] to-[#DC2626]",
    home: "/espace",
    allowedPaths: [],
  },
  eleve: {
    label: "Élève",
    description: "Mon dossier, mes notes, mes absences, mes paiements et mes messages.",
    department: "Scolarité",
    avatarColor: "from-[#0C356A] to-[#3D82C0]",
    home: "/espace",
    allowedPaths: [],
  },
  parent: {
    label: "Parent d'élève",
    description: "Suivi de la scolarité de mes enfants et échanges avec l'école.",
    department: "Familles",
    avatarColor: "from-[#B91C1C] to-[#DC2626]",
    home: "/espace",
    allowedPaths: [],
  },
  candidat: {
    label: "Candidat",
    description: "Ma pré-inscription, mes pièces et le suivi de mon dossier.",
    department: "Admissions",
    avatarColor: "from-slate-500 to-slate-700",
    home: "/espace",
    allowedPaths: [],
  },
};

export const roleConfig = (role: string | null | undefined): RoleConfig =>
  ROLE_CONFIG[role && role in ROLE_CONFIG ? (role as RoleType) : "candidat"];
