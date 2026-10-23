import {
  Archive,
  BarChart3,
  LayoutTemplate,
  Menu as MenuIcon,
  Newspaper,
  Palette,
  PanelTop,
  Phone,
  Rows3,
  BedDouble,
  BellRing,
  Boxes,
  Briefcase,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  ClipboardSignature,
  ConciergeBell,
  FileSpreadsheet,
  Globe,
  GraduationCap,
  Home,
  IdCard,
  UsersRound,
  Images,
  Inbox,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  MonitorPlay,
  PiggyBank,
  ScanSearch,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { RoleType } from "@/lib/roles";

export type NavItem = { label: string; href: string; icon: LucideIcon; roles: RoleType[]; hint?: string };
export type NavSection = { title?: string; items: NavItem[] };
export type NavModule = { key: string; label: string; icon: LucideIcon; accent: string; sections: NavSection[] };

const DG: RoleType = "directeur_general";
const DP: RoleType = "directeur_pedagogique";
const CPT: RoleType = "comptable";
const RH: RoleType = "ressources_humaines";
const HOT: RoleType = "responsable_hotel";
const PER: RoleType = "personnel";
const WEB: RoleType = "gestionnaire_site";
const MANAGERS: RoleType[] = [DG, DP, CPT, RH, HOT];
const STAFF: RoleType[] = [...MANAGERS, WEB, PER];
const SITE: RoleType[] = [DG, WEB];

/**
 * Navigation de l'espace de gestion : un module par département (menu horizontal),
 * ses pages dans le menu vertical. Chaque page indique les rôles qui y ont accès.
 */
export const MODULES: NavModule[] = [
  {
    key: "accueil",
    label: "Accueil",
    icon: LayoutDashboard,
    accent: "#0C356A",
    sections: [
      {
        items: [
          { label: "Tableau de bord", href: "/dashboard", icon: Home, roles: STAFF, hint: "Vue d'ensemble du jour" },
          { label: "Recherche par matricule", href: "/dashboard/recherche", icon: ScanSearch, roles: MANAGERS, hint: "Dossier complet d'un élève ou salarié" },
          { label: "Validations du DG", href: "/dashboard/validations", icon: ShieldCheck, roles: STAFF, hint: "Actions soumises au contrôle du Directeur général" },
          { label: "Pilotage & rapports", href: "/dashboard/pilotage", icon: BarChart3, roles: [DG], hint: "Statistiques jour, semaine, mois" },
          { label: "Archives", href: "/dashboard/archives", icon: Archive, roles: MANAGERS, hint: "Dossiers vérifiés et conservés" },
          { label: "Guide d'utilisation", href: "/dashboard/guide", icon: LifeBuoy, roles: STAFF, hint: "Qui fait quoi, et comment" },
        ],
      },
    ],
  },
  {
    key: "ecole",
    label: "École",
    icon: GraduationCap,
    accent: "#0C356A",
    sections: [
      {
        title: "Inscriptions",
        items: [
          { label: "Pré-inscriptions", href: "/dashboard/admissions", icon: ClipboardList, roles: [DG, DP], hint: "Dossiers du site à valider" },
          { label: "Élèves par filière", href: "/dashboard/eleves", icon: GraduationCap, roles: [DG, DP, CPT], hint: "Inscrits, classes, situation" },
          { label: "Dossiers élèves et parents", href: "/dashboard/adhesions?scope=ecole", icon: ClipboardSignature, roles: [DG, DP], hint: "Profils à examiner et valider" },
        ],
      },
      {
        title: "Vie scolaire",
        items: [
          { label: "Correspondance & permissions", href: "/dashboard/correspondance", icon: ClipboardCheck, roles: [DG, DP], hint: "Appel, absences, retards, permissions" },
          { label: "Notes & bulletins", href: "/dashboard/notes", icon: FileSpreadsheet, roles: [DG, DP], hint: "Saisie des notes, bulletins avec QR" },
          { label: "Filières & classes", href: "/dashboard/programs", icon: Landmark, roles: [DG, DP], hint: "CFA, CAP, BEP, BT, BTS" },
          { label: "Cartes scolaires", href: "/dashboard/cartes", icon: IdCard, roles: [DG, DP], hint: "Élèves : émission, QR, impression" },
          { label: "Annuaire, rôles et règlement", href: "/dashboard/annuaire", icon: UsersRound, roles: [DG, DP, RH], hint: "Administration, professeurs, signatures" },
          { label: "Espace École (en ligne)", href: "/espace/ecole", icon: MonitorPlay, roles: [DG, DP], hint: "Cours, devoirs, visio" },
        ],
      },
    ],
  },
  {
    key: "finances",
    label: "Écolage & finances",
    icon: Wallet,
    accent: "#0C356A",
    sections: [
      {
        title: "Trésorerie de l'école",
        items: [
          { label: "Écolage", href: "/dashboard/ecolage", icon: Wallet, roles: [DG, CPT, DP], hint: "Acomptes, reste à payer, reçus" },
          { label: "Finances & dépenses", href: "/dashboard/finances", icon: PiggyBank, roles: [DG, CPT], hint: "Recettes et dépenses" },
          { label: "Salaires", href: "/dashboard/salaries", icon: Briefcase, roles: [DG, CPT, RH], hint: "Paie du personnel" },
        ],
      },
      {
        title: "Gestion",
        items: [
          { label: "Économat & budget", href: "/dashboard/economat", icon: Boxes, roles: [DG, DP, CPT, HOT], hint: "Stock cuisine, budgets" },
          { label: "Rapports financiers", href: "/dashboard/reports", icon: BarChart3, roles: [DG], hint: "États et exports" },
        ],
      },
    ],
  },
  {
    key: "hotel",
    label: "Hôtel",
    icon: BedDouble,
    accent: "#0C356A",
    sections: [
      {
        title: "Exploitation",
        items: [
          { label: "Chambres & occupation", href: "/dashboard/hotel", icon: BedDouble, roles: [DG, HOT, PER], hint: "Plan des chambres" },
          { label: "Réservations", href: "/dashboard/reservations", icon: ConciergeBell, roles: [DG, HOT, PER], hint: "Arrivées, départs" },
          { label: "Demandes du site", href: "/dashboard/demandes", icon: Inbox, roles: [DG, DP, HOT, PER], hint: "Réservations et contacts en ligne" },
          { label: "Stock hôtel", href: "/dashboard/inventory", icon: Boxes, roles: [DG, CPT, PER], hint: "Produits et mouvements" },
        ],
      },
      {
        title: "Clients",
        items: [
          { label: "Clients", href: "/dashboard/customers", icon: Users, roles: [DG, HOT], hint: "Fichier clients" },
          { label: "Cartes de fidélité", href: "/dashboard/cartes?type=client", icon: Star, roles: [DG, HOT], hint: "Numéros et niveaux" },
          { label: "Dossiers des clients", href: "/dashboard/adhesions?scope=hotel", icon: ClipboardSignature, roles: [DG, HOT], hint: "Profils clients à examiner" },
          { label: "Espace Hôtel (équipes)", href: "/espace/hotel", icon: MonitorPlay, roles: [DG, HOT, PER], hint: "Consignes par service" },
        ],
      },
    ],
  },
  {
    key: "personnel",
    label: "Personnel",
    icon: Briefcase,
    accent: "#0C356A",
    sections: [
      {
        items: [
          { label: "Personnel & professeurs", href: "/dashboard/employees", icon: Users, roles: [DG, RH], hint: "Dossiers RH, contrats" },
          { label: "Recrutements", href: "/dashboard/adhesions?scope=rh", icon: ClipboardSignature, roles: [DG, RH], hint: "Candidatures, dossiers du personnel" },
          { label: "Salaires", href: "/dashboard/salaries", icon: Wallet, roles: [DG, RH, CPT], hint: "Paie, bulletins de salaire" },
          { label: "Cartes de travail", href: "/dashboard/cartes?type=personnel", icon: IdCard, roles: [DG, RH], hint: "Personnel de l'hôtel et de l'école" },
        ],
      },
    ],
  },
  {
    key: "communication",
    label: "Communication",
    icon: MessageSquare,
    accent: "#0C356A",
    sections: [
      {
        items: [
          { label: "Discussions & appels", href: "/discussions", icon: MessageSquare, roles: STAFF, hint: "Messages, vocaux, appels" },
          { label: "Réunions (visio)", href: "/reunions", icon: CalendarClock, roles: STAFF, hint: "Planifier, rejoindre" },
          { label: "Alertes & annonces", href: "/dashboard/alertes", icon: BellRing, roles: MANAGERS, hint: "Espace, e-mail, SMS" },
        ],
      },
    ],
  },
  {
    key: "site",
    label: "Gestion globale du site",
    icon: Globe,
    accent: "#0C356A",
    sections: [
      {
        title: "Suivi",
        items: [
          { label: "Vue d'ensemble", href: "/dashboard/site?tab=statistiques", icon: BarChart3, roles: SITE, hint: "Visites, pages, par jour" },
          { label: "Lettre d'information", href: "/dashboard/site?tab=abonnes", icon: Inbox, roles: SITE, hint: "Abonnés, export" },
        ],
      },
      {
        title: "Contenus",
        items: [
          { label: "Publications", href: "/dashboard/site?tab=publications", icon: Newspaper, roles: SITE, hint: "Articles, annonces, photos, vidéos" },
          { label: "Menus et sous-menus", href: "/dashboard/site?tab=menus", icon: MenuIcon, roles: SITE, hint: "Ajouter, renommer, ordonner" },
          { label: "Pages et sections", href: "/dashboard/site?tab=pages", icon: LayoutTemplate, roles: SITE, hint: "Textes, images, vidéos" },
          { label: "Sections de l'accueil", href: "/dashboard/site?tab=accueil", icon: Rows3, roles: SITE, hint: "Afficher ou masquer" },
          { label: "En-têtes des pages", href: "/dashboard/site?tab=entetes", icon: LayoutTemplate, roles: SITE, hint: "Titre, texte, photo de chaque page" },
          { label: "Pied de page", href: "/dashboard/site?tab=pied", icon: LayoutTemplate, roles: SITE, hint: "Présentation et liens" },
          { label: "Images du site", href: "/dashboard/site?tab=images", icon: Images, roles: SITE, hint: "Façades, chambres, restaurant, élèves" },
          { label: "Diaporama et bandeau", href: "/dashboard/site?tab=entete", icon: PanelTop, roles: SITE, hint: "Héros de l'accueil" },
        ],
      },
      {
        title: "Apparence",
        items: [
          { label: "Coordonnées et réseaux", href: "/dashboard/site?tab=coordonnees", icon: Phone, roles: SITE, hint: "Pied de page, WhatsApp, TikTok" },
          { label: "Couleurs", href: "/dashboard/site?tab=couleurs", icon: Palette, roles: SITE, hint: "Couleurs du site" },
          { label: "Modèle des cartes", href: "/dashboard/site?tab=cartes", icon: IdCard, roles: SITE, hint: "Verso, signature, contact" },
        ],
      },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    icon: ShieldCheck,
    accent: "#0C356A",
    sections: [
      {
        items: [
          { label: "Comptes, rôles & postes", href: "/dashboard/users", icon: ShieldCheck, roles: [DG], hint: "Attribuer les rôles" },
          { label: "Paramètres", href: "/dashboard/settings", icon: Settings, roles: [DG], hint: "Établissement" },
        ],
      },
    ],
  },
];

/** Modules et pages visibles pour un rôle (les modules vides sont masqués). */
export function modulesFor(role: RoleType | undefined): NavModule[] {
  if (!role) return [];
  return MODULES.map((m) => ({ ...m, sections: m.sections.map((s) => ({ ...s, items: s.items.filter((i) => i.roles.includes(role)) })).filter((s) => s.items.length) })).filter((m) => m.sections.length);
}

const pathOf = (href: string) => href.split(/[?#]/)[0];

/** Page active : correspondance la plus précise avec l'adresse (paramètre de type inclus pour les cartes). */
export function isItemActive(href: string, pathname: string, search: string) {
  const [p, q] = href.split("?");
  if (p === "/dashboard") return pathname === "/dashboard";
  if (!(pathname === p || pathname.startsWith(`${p}/`))) return false;
  if (q) return search.includes(q);
  return !(p === "/dashboard/cartes" && /type=(client|personnel)/.test(search));
}

/** Module correspondant à la page affichée. */
export function moduleForPath(modules: NavModule[], pathname: string, search: string): NavModule | undefined {
  return (
    modules.find((m) => m.sections.some((s) => s.items.some((i) => i.href.includes("?") && isItemActive(i.href, pathname, search)))) ??
    modules.find((m) => m.sections.some((s) => s.items.some((i) => isItemActive(i.href, pathname, search)))) ??
    modules.find((m) => m.sections.some((s) => s.items.some((i) => pathOf(i.href) !== "/dashboard" && pathname.startsWith(pathOf(i.href)))))
  );
}

/** Toutes les adresses de gestion autorisées pour un rôle (contrôle d'accès des pages). */
export function allowedDashboardPaths(role: RoleType | undefined) {
  return [...new Set(modulesFor(role).flatMap((m) => m.sections.flatMap((s) => s.items.map((i) => pathOf(i.href)))))];
}
