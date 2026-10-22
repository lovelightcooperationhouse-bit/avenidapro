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
  | "client"
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
    allowedPaths: ["/dashboard", "/dashboard/guide", "/dashboard/admissions", "/dashboard/students", "/dashboard/programs", "/dashboard/attendance", "/dashboard/grades", "/dashboard/payments", "/dashboard/demandes", "/dashboard/messages", "/dashboard/alertes", "/dashboard/adhesions", "/dashboard/correspondance", "/dashboard/cartes", "/dashboard/recherche", "/dashboard/economat"],
  },
  comptable: {
    label: "Comptabilité",
    description: "Comptes de l'école et de l'hôtel : écolages, séjours, entrées et sorties, salaires.",
    department: "Service Financier",
    avatarColor: "from-emerald-600 to-teal-800",
    home: "/dashboard",
    allowedPaths: ["/dashboard", "/dashboard/guide", "/dashboard/payments", "/dashboard/finances", "/dashboard/salaries", "/dashboard/reports", "/dashboard/inventory", "/dashboard/messages", "/dashboard/alertes", "/dashboard/adhesions", "/dashboard/economat", "/dashboard/recherche"],
  },
  ressources_humaines: {
    label: "Ressources Humaines",
    description: "Professeurs et personnel de l'hôtel : profils, contrats et salaires.",
    department: "Ressources Humaines",
    avatarColor: "from-amber-600 to-orange-700",
    home: "/dashboard",
    allowedPaths: ["/dashboard", "/dashboard/guide", "/dashboard/employees", "/dashboard/salaries", "/dashboard/messages", "/dashboard/alertes", "/dashboard/adhesions", "/dashboard/cartes", "/dashboard/recherche"],
  },
  responsable_hotel: {
    label: "Responsable Hôtel",
    description: "Chambres, réservations et fichier clients de l'hôtel.",
    department: "Hébergement & Réception",
    avatarColor: "from-rose-600 to-red-800",
    home: "/dashboard",
    allowedPaths: ["/dashboard", "/dashboard/guide", "/dashboard/hotel", "/dashboard/reservations", "/dashboard/customers", "/dashboard/demandes", "/dashboard/messages", "/dashboard/alertes", "/dashboard/adhesions", "/dashboard/economat", "/dashboard/recherche"],
  },
  personnel: {
    label: "Personnel",
    description: "Opérations courantes de l'hôtel et de l'économat.",
    department: "Personnel Avenida",
    avatarColor: "from-slate-600 to-slate-800",
    home: "/dashboard",
    allowedPaths: ["/dashboard", "/dashboard/guide", "/dashboard/hotel", "/dashboard/reservations", "/dashboard/inventory", "/dashboard/demandes", "/dashboard/messages"],
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
  client: {
    label: "Client de l'hôtel",
    description: "Mes séjours, mes demandes de réservation et mes documents.",
    department: "Hôtel Avenida",
    avatarColor: "from-amber-500 to-amber-700",
    home: "/espace",
    allowedPaths: [],
  },
  candidat: {
    label: "Nouveau membre",
    description: "Compléter mon profil et choisir mon statut ; l'administration valide mon accès.",
    department: "Admissions",
    avatarColor: "from-slate-500 to-slate-700",
    home: "/espace",
    allowedPaths: [],
  },
};

export const roleConfig = (role: string | null | undefined): RoleConfig =>
  ROLE_CONFIG[role && role in ROLE_CONFIG ? (role as RoleType) : "candidat"];

/** Ce que chaque rôle gère et qui instruit ses dossiers : affiché au DG pour attribuer les bons rôles. */
export const ROLE_SCOPE: Record<RoleType, string> = {
  directeur_general: "Tout le système : attribue les rôles, valide les dossiers, contenu du site, pilotage et rapports, alertes à tout l'établissement.",
  directeur_pedagogique: "École : admissions, élèves, classes, notes, correspondance et permissions, cartes scolaires, Espace École ; avis sur les dossiers élèves, parents, professeurs.",
  comptable: "Finances : paiements, caisse, dépenses, salaires, économat, rapports financiers ; consulte les dossiers élèves et clients.",
  ressources_humaines: "Personnel : dossiers RH, contrats, salaires, cartes de travail ; avis sur les dossiers du personnel, des professeurs et de la direction.",
  responsable_hotel: "Hôtel : réservations, chambres, clients, économat, Espace Hôtel ; avis sur le personnel de l'hôtel et les clients.",
  personnel: "Opérations de son service (réception, restaurant, cuisine, étages…) et Espace Hôtel ; pas d'accès aux décisions.",
  professeur: "Ses classes : Espace École (cours, devoirs, direct), appel et correspondance, notes de ses élèves.",
  eleve: "Son dossier : cours de sa filière, devoirs, notes, paiements, correspondance, carte scolaire, documents.",
  parent: "Ses enfants : suivi scolaire, paiements, présences, demandes de permission, cartes, documents.",
  client: "Ses séjours et demandes de réservation, ses documents.",
  candidat: "Nouveau membre : complète son profil ; aucun accès tant que le DG n'a pas attribué de rôle.",
};
