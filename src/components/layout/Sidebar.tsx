"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  CalendarCheck,
  CreditCard,
  BedDouble,
  CalendarDays,
  UserCheck,
  Briefcase,
  Wallet,
  Boxes,
  TrendingUp,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  X,
  Building,
} from "lucide-react";
import { AvenidaLogo } from "@/components/shared/AvenidaLogo";
import { useSchoolYear } from "@/context/SchoolYearContext";
import { useAuth } from "@/context/AuthContext";
import { useMobileNav } from "@/context/MobileNavContext";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  allowedRoles?: string[];
}

interface NavSection {
  title: string;
  color: "blue" | "red" | "emerald" | "amber" | "indigo" | "neutral";
  items: NavItem[];
  allowedRoles?: string[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { selectedYearLabel } = useSchoolYear();
  const { user, logout } = useAuth();
  const { isOpen, close } = useMobileNav();

  const userRole = user?.role || "directeur_general";

  // Navigation Réorganisée et Hiérarchisée par Pôles Métiers
  const allSections: NavSection[] = [
    {
      title: "PILOTAGE & VUE GLOBALE",
      color: "neutral",
      allowedRoles: [
        "directeur_general",
        "directeur_pedagogique",
        "comptable",
        "ressources_humaines",
        "responsable_hotel",
      ],
      items: [
        {
          label: "Tableau de Bord",
          href: "/dashboard",
          icon: LayoutDashboard,
          allowedRoles: [
            "directeur_general",
            "directeur_pedagogique",
            "comptable",
            "ressources_humaines",
            "responsable_hotel",
          ],
        },
      ],
    },
    {
      title: "PÔLE ACADÉMIQUE & SCOLARITÉ",
      color: "blue",
      allowedRoles: ["directeur_general", "directeur_pedagogique"],
      items: [
        {
          label: "Dossiers des Élèves",
          href: "/dashboard/students",
          icon: Users,
          badge: "152 élèves",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          allowedRoles: ["directeur_general", "directeur_pedagogique"],
        },
        {
          label: "Filières & Diplômes",
          href: "/dashboard/programs",
          icon: GraduationCap,
          badge: "CFA, CAP, BT",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          allowedRoles: ["directeur_general", "directeur_pedagogique"],
        },
        {
          label: "Vie Scolaire & Pointages",
          href: "/dashboard/attendance",
          icon: CalendarCheck,
          badge: "Absences/Retards",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          allowedRoles: ["directeur_general", "directeur_pedagogique"],
        },
        {
          label: "Bulletins & Notes",
          href: "/dashboard/grades",
          icon: BookOpen,
          badge: "Rangs & PDF",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          allowedRoles: ["directeur_general", "directeur_pedagogique"],
        },
      ],
    },
    {
      title: "PÔLE HÔTELLERIE & HÉBERGEMENT",
      color: "red",
      allowedRoles: ["directeur_general", "responsable_hotel"],
      items: [
        {
          label: "Plan des Chambres",
          href: "/dashboard/hotel",
          icon: BedDouble,
          badge: "8 ch.",
          badgeColor: "bg-red-100 text-red-800 border-red-200",
          allowedRoles: ["directeur_general", "responsable_hotel"],
        },
        {
          label: "Réservations & Séjours",
          href: "/dashboard/reservations",
          icon: CalendarDays,
          badge: "Réservé/Payé",
          badgeColor: "bg-red-100 text-red-800 border-red-200",
          allowedRoles: ["directeur_general", "responsable_hotel"],
        },
        {
          label: "Fichier Clients Hôtel",
          href: "/dashboard/customers",
          icon: UserCheck,
          allowedRoles: ["directeur_general", "responsable_hotel"],
        },
      ],
    },
    {
      title: "COMPTABILITÉ & TRÉSORERIE",
      color: "emerald",
      allowedRoles: ["directeur_general", "comptable"],
      items: [
        {
          label: "Caisse Écolages Lomé",
          href: "/dashboard/payments",
          icon: CreditCard,
          badge: "#AV2022",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          allowedRoles: ["directeur_general", "comptable"],
        },
        {
          label: "Trésorerie & Dépenses",
          href: "/dashboard/finances",
          icon: TrendingUp,
          badge: "Flux J/S/M",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          allowedRoles: ["directeur_general", "comptable"],
        },
        {
          label: "Rapports d'Activité & Bilans",
          href: "/dashboard/reports",
          icon: FileText,
          badge: "Bilans",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          allowedRoles: ["directeur_general", "comptable"],
        },
      ],
    },
    {
      title: "RESSOURCES HUMAINES & STOCKS",
      color: "amber",
      allowedRoles: ["directeur_general", "ressources_humaines", "comptable"],
      items: [
        {
          label: "Personnel & Formateurs",
          href: "/dashboard/employees",
          icon: Briefcase,
          badge: "18 pers.",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
          allowedRoles: ["directeur_general", "ressources_humaines"],
        },
        {
          label: "Livre de Paie & Salaires",
          href: "/dashboard/salaries",
          icon: Wallet,
          badge: "F CFA",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
          allowedRoles: ["directeur_general", "ressources_humaines", "comptable"],
        },
        {
          label: "Économat & Stocks",
          href: "/dashboard/inventory",
          icon: Boxes,
          allowedRoles: ["directeur_general", "comptable"],
        },
      ],
    },
    {
      title: "ADMINISTRATION & CONTRÔLE",
      color: "indigo",
      allowedRoles: ["directeur_general"],
      items: [
        {
          label: "Gestion des Accès & Rôles",
          href: "/dashboard/users",
          icon: ShieldCheck,
          allowedRoles: ["directeur_general"],
        },
        {
          label: "Paramètres de l'Établissement",
          href: "/dashboard/settings",
          icon: Settings,
          allowedRoles: ["directeur_general"],
        },
      ],
    },
  ];

  // Filtrage strict par rôle utilisateur
  const visibleSections = allSections
    .filter(
      (sec) =>
        userRole === "directeur_general" ||
        (sec.allowedRoles && sec.allowedRoles.includes(userRole))
    )
    .map((sec) => ({
      ...sec,
      items: sec.items.filter(
        (item) =>
          userRole === "directeur_general" ||
          (item.allowedRoles && item.allowedRoles.includes(userRole))
      ),
    }))
    .filter((sec) => sec.items.length > 0);

  // Fonction de rendu de contenu réutilisable (desktop + tiroir mobile)
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Brand Header with Official Logo */}
      <div className="p-4 border-b border-slate-200 bg-white shadow-xs shrink-0">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={() => isMobile && close()}
            className="block hover:scale-[1.01] transition-transform duration-200"
          >
            <AvenidaLogo size="md" showText={true} />
          </Link>

          {isMobile && (
            <button
              onClick={close}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Fermer le menu"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] text-[#0C356A] bg-blue-50/90 border border-blue-200/80 rounded-xl px-2.5 py-1.5 font-bold shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Site : <strong className="text-[#DC2626]">LOMÉ</strong></span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 truncate max-w-[120px]">{selectedYearLabel}</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 text-xs sidebar-scrollbar">
        {visibleSections.map((sec, idx) => {
          const headerThemes = {
            blue: {
              container: "bg-gradient-to-r from-[#113B6B] to-[#0D2D52] border-blue-400/30 text-blue-100 shadow-sm",
              badge: "bg-blue-500/30 text-cyan-200 border-blue-300/40",
              dot: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse",
              badgeText: "ÉCOLE",
              textColor: "text-white font-black",
            },
            red: {
              container: "bg-gradient-to-r from-[#7F1D1D]/90 to-[#450A0A]/90 border-red-500/30 text-red-100 shadow-sm",
              badge: "bg-red-500/30 text-rose-200 border-red-300/40",
              dot: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse",
              badgeText: "HÔTEL",
              textColor: "text-white font-black",
            },
            emerald: {
              container: "bg-gradient-to-r from-emerald-950/80 to-slate-900/80 border-emerald-500/30 text-emerald-100 shadow-sm",
              badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
              dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse",
              badgeText: "FINANCES",
              textColor: "text-emerald-100 font-extrabold",
            },
            amber: {
              container: "bg-gradient-to-r from-amber-950/70 to-slate-900/80 border-amber-500/30 text-amber-100 shadow-sm",
              badge: "bg-amber-500/20 text-amber-300 border-amber-400/30",
              dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse",
              badgeText: "RH & STOCKS",
              textColor: "text-amber-100 font-extrabold",
            },
            indigo: {
              container: "bg-gradient-to-r from-indigo-950/70 to-slate-900/80 border-indigo-500/30 text-indigo-100 shadow-sm",
              badge: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
              dot: "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)] animate-pulse",
              badgeText: "SYSTÈME",
              textColor: "text-indigo-100 font-extrabold",
            },
            neutral: {
              container: "bg-white/10 border-white/20 text-slate-100",
              badge: "bg-white/20 text-white border-white/30",
              dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]",
              badgeText: "PILOTAGE",
              textColor: "text-slate-100 font-extrabold",
            },
          }[sec.color];

          return (
            <div key={idx} className="space-y-1.5">
              {/* Grand Titre de Section Mis en Valeur */}
              <div
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl border backdrop-blur-xs transition-all duration-200 ${headerThemes.container}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${headerThemes.dot}`} />
                  <span className={`text-[10.5px] tracking-wider uppercase font-sans ${headerThemes.textColor}`}>
                    {sec.title}
                  </span>
                </div>
                <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${headerThemes.badge}`}>
                  {headerThemes.badgeText}
                </span>
              </div>

              {/* Menu Items */}
              <div className="space-y-1 pt-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  const activeClasses =
                    sec.color === "red"
                      ? "bg-[#DC2626] text-white border-l-4 border-white font-bold shadow-lg shadow-red-950/40 translate-x-1 ring-1 ring-white/20"
                      : sec.color === "blue"
                      ? "bg-gradient-to-r from-[#1E4D82] to-[#143B66] text-white border-l-4 border-amber-400 font-bold shadow-md shadow-black/25 translate-x-1 ring-1 ring-white/15"
                      : sec.color === "emerald"
                      ? "bg-emerald-700 text-white border-l-4 border-amber-400 font-bold shadow-md translate-x-1"
                      : sec.color === "amber"
                      ? "bg-amber-700 text-white border-l-4 border-white font-bold shadow-md translate-x-1"
                      : sec.color === "indigo"
                      ? "bg-indigo-800 text-white border-l-4 border-amber-400 font-bold shadow-md translate-x-1"
                      : "bg-[#164E87] text-white border-l-4 border-blue-300 font-bold shadow-inner translate-x-1";

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => isMobile && close()}
                      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-[12px] transition-all duration-200 ease-out active:scale-[0.98] ${
                        isActive
                          ? activeClasses
                          : "text-blue-100/80 hover:text-white hover:bg-white/10 hover:translate-x-1 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
                            isActive
                              ? sec.color === "red"
                                ? "bg-white/20 text-white"
                                : "bg-white/15 text-white"
                              : "bg-white/5 text-blue-200/90 group-hover:bg-white/15 group-hover:text-amber-300 group-hover:scale-105"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-3" />
                        </div>
                        <span className="truncate transition-transform duration-200 group-hover:translate-x-0.5">
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border transition-transform duration-200 group-hover:scale-105 shadow-2xs ${
                              item.badgeColor || "bg-white/20 text-white border-white/30"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Footer Card with Dynamic Auth Session & Logout */}
      <div className="p-3 border-t border-[#164E87]/80 bg-[#061B36] shrink-0">
        <div className="p-2.5 rounded-xl bg-[#0C356A]/90 border border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-xl bg-gradient-to-br ${
                  user?.avatarColor || "from-[#DC2626] to-[#991B1B]"
                } text-white font-black text-xs flex items-center justify-center shadow-md ring-2 ring-white/20 shrink-0`}
              >
                {user?.initials || "DG"}
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-bold text-white leading-tight truncate">
                  {user?.fullName || "Direction Générale"}
                </span>
                <span className="text-[10px] text-amber-300 font-semibold truncate">
                  {user?.roleLabel || "Directeur Général"}
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Déconnexion sécurisée"
              className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-[#DC2626] hover:shadow-md hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer shrink-0 ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-blue-200/80">
            <span className="truncate max-w-[140px]" title={user?.department}>
              {user?.department || "Direction Générale"}
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Connecté
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (Visible sur écrans lg et supérieurs) */}
      <aside className="hidden lg:flex w-72 bg-gradient-to-b from-[#0C356A] via-[#0A2E5C] to-[#072042] text-slate-100 flex-col border-r border-[#164E87]/80 h-screen sticky top-0 select-none z-30 shadow-2xl shrink-0">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. MOBILE & TABLET DRAWER (Affiché lors du clic sur le hamburger en mode mobile) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop sombre flouté */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
            onClick={close}
            aria-hidden="true"
          />

          {/* Tiroir coulissant */}
          <aside className="relative z-50 w-72 sm:w-80 bg-gradient-to-b from-[#0C356A] via-[#0A2E5C] to-[#072042] text-slate-100 flex flex-col border-r border-[#164E87]/80 h-full shadow-2xl select-none animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
