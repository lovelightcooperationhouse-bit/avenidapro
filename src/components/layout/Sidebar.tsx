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
  Compass,
  Activity,
  Layers,
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
  color: "cyan" | "blue" | "red" | "emerald" | "amber" | "indigo" | "neutral";
  icon?: any;
  items: NavItem[];
  allowedRoles?: string[];
}

const SECTION_THEMES: Record<
  string,
  {
    text: string;
    dot: string;
    badge: string;
    line: string;
    iconColor: string;
    iconBg: string;
    border: string;
    activeBorder: string;
    activeBg: string;
    activeText: string;
  }
> = {
  cyan: {
    text: "text-cyan-100",
    dot: "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] ring-2 ring-cyan-400/40",
    badge: "bg-gradient-to-r from-cyan-500/30 via-cyan-600/20 to-sky-950/40 border-cyan-400/70 shadow-[0_0_14px_rgba(6,182,212,0.3)]",
    line: "from-cyan-400/90 via-cyan-500/40 to-transparent",
    iconColor: "text-cyan-300",
    iconBg: "bg-cyan-500/25 border-cyan-400/50",
    border: "border-cyan-400/60",
    activeBorder: "border-cyan-400",
    activeBg: "bg-cyan-500/20",
    activeText: "text-cyan-200",
  },
  blue: {
    text: "text-sky-100",
    dot: "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,1)] ring-2 ring-sky-400/40",
    badge: "bg-gradient-to-r from-blue-500/35 via-indigo-600/25 to-sky-950/40 border-sky-400/70 shadow-[0_0_14px_rgba(56,189,248,0.3)]",
    line: "from-sky-400/90 via-sky-500/40 to-transparent",
    iconColor: "text-sky-300",
    iconBg: "bg-sky-500/25 border-sky-400/50",
    border: "border-sky-400/60",
    activeBorder: "border-sky-400",
    activeBg: "bg-sky-500/20",
    activeText: "text-sky-200",
  },
  red: {
    text: "text-rose-100",
    dot: "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,1)] ring-2 ring-rose-400/40",
    badge: "bg-gradient-to-r from-rose-500/35 via-red-600/25 to-rose-950/40 border-rose-400/70 shadow-[0_0_14px_rgba(251,113,133,0.3)]",
    line: "from-rose-400/90 via-rose-500/40 to-transparent",
    iconColor: "text-rose-300",
    iconBg: "bg-rose-500/25 border-rose-400/50",
    border: "border-rose-400/60",
    activeBorder: "border-rose-400",
    activeBg: "bg-rose-500/20",
    activeText: "text-rose-200",
  },
  emerald: {
    text: "text-emerald-100",
    dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] ring-2 ring-emerald-400/40",
    badge: "bg-gradient-to-r from-emerald-500/35 via-teal-600/25 to-emerald-950/40 border-emerald-400/70 shadow-[0_0_14px_rgba(52,211,153,0.3)]",
    line: "from-emerald-400/90 via-emerald-500/40 to-transparent",
    iconColor: "text-emerald-300",
    iconBg: "bg-emerald-500/25 border-emerald-400/50",
    border: "border-emerald-400/60",
    activeBorder: "border-emerald-400",
    activeBg: "bg-emerald-500/20",
    activeText: "text-emerald-200",
  },
  amber: {
    text: "text-amber-100",
    dot: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)] ring-2 ring-amber-400/40",
    badge: "bg-gradient-to-r from-amber-500/35 via-orange-600/25 to-amber-950/40 border-amber-400/70 shadow-[0_0_14px_rgba(251,191,36,0.3)]",
    line: "from-amber-400/90 via-amber-500/40 to-transparent",
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/25 border-amber-400/50",
    border: "border-amber-400/60",
    activeBorder: "border-amber-400",
    activeBg: "bg-amber-500/20",
    activeText: "text-amber-200",
  },
  indigo: {
    text: "text-violet-100",
    dot: "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,1)] ring-2 ring-violet-400/40",
    badge: "bg-gradient-to-r from-violet-500/35 via-purple-600/25 to-violet-950/40 border-violet-400/70 shadow-[0_0_14px_rgba(167,139,250,0.3)]",
    line: "from-violet-400/90 via-violet-500/40 to-transparent",
    iconColor: "text-violet-300",
    iconBg: "bg-violet-500/25 border-violet-400/50",
    border: "border-violet-400/60",
    activeBorder: "border-violet-400",
    activeBg: "bg-violet-500/20",
    activeText: "text-violet-200",
  },
  neutral: {
    text: "text-slate-100",
    dot: "bg-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.9)] ring-2 ring-slate-400/40",
    badge: "bg-slate-400/20 border-slate-400/40",
    line: "from-slate-300/50 via-slate-400/20 to-transparent",
    iconColor: "text-slate-200",
    iconBg: "bg-slate-500/25 border-slate-400/40",
    border: "border-slate-400/50",
    activeBorder: "border-slate-300",
    activeBg: "bg-slate-500/20",
    activeText: "text-slate-100",
  },
};

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
      color: "cyan",
      icon: Compass,
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
      icon: GraduationCap,
      allowedRoles: ["directeur_general", "directeur_pedagogique"],
      items: [
        {
          label: "Dossiers des Élèves",
          href: "/dashboard/students",
          icon: Users,
          allowedRoles: ["directeur_general", "directeur_pedagogique"],
        },
        {
          label: "Filières & Diplômes",
          href: "/dashboard/programs",
          icon: GraduationCap,
          badge: "CFA·CAP·BEP·BT·BTS",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          allowedRoles: ["directeur_general", "directeur_pedagogique"],
        },
        {
          label: "Vie Scolaire & Pointages",
          href: "/dashboard/attendance",
          icon: CalendarCheck,
          allowedRoles: ["directeur_general", "directeur_pedagogique"],
        },
        {
          label: "Bulletins & Notes",
          href: "/dashboard/grades",
          icon: BookOpen,
          allowedRoles: ["directeur_general", "directeur_pedagogique"],
        },
      ],
    },
    {
      title: "PÔLE HÔTELLERIE & HÉBERGEMENT",
      color: "red",
      icon: BedDouble,
      allowedRoles: ["directeur_general", "responsable_hotel"],
      items: [
        {
          label: "Plan des Chambres",
          href: "/dashboard/hotel",
          icon: BedDouble,
          allowedRoles: ["directeur_general", "responsable_hotel"],
        },
        {
          label: "Réservations & Séjours",
          href: "/dashboard/reservations",
          icon: CalendarDays,
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
      icon: CreditCard,
      allowedRoles: ["directeur_general", "comptable"],
      items: [
        {
          label: "Caisse Écolages Lomé",
          href: "/dashboard/payments",
          icon: CreditCard,
          allowedRoles: ["directeur_general", "comptable"],
        },
        {
          label: "Trésorerie & Dépenses",
          href: "/dashboard/finances",
          icon: TrendingUp,
          allowedRoles: ["directeur_general", "comptable"],
        },
        {
          label: "Rapports d'Activité & Bilans",
          href: "/dashboard/reports",
          icon: FileText,
          allowedRoles: ["directeur_general", "comptable"],
        },
      ],
    },
    {
      title: "RESSOURCES HUMAINES & STOCKS",
      color: "amber",
      icon: Briefcase,
      allowedRoles: ["directeur_general", "ressources_humaines", "comptable"],
      items: [
        {
          label: "Personnel & Formateurs",
          href: "/dashboard/employees",
          icon: Briefcase,
          allowedRoles: ["directeur_general", "ressources_humaines"],
        },
        {
          label: "Livre de Paie & Salaires",
          href: "/dashboard/salaries",
          icon: Wallet,
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
      icon: ShieldCheck,
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

      {/* Navigation List — Aérée, Élégante & Lisible avec Couleurs Distinctes par Pôle */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 text-xs sidebar-scrollbar">
        {visibleSections.map((sec, idx) => {
          const theme = SECTION_THEMES[sec.color] || SECTION_THEMES.neutral;
          const SectionIcon = sec.icon;

          return (
            <div key={idx} className="space-y-1.5">
              {/* Grand Titre de Section Différencié par Couleur, Esthétique & Bien Visible */}
              <div className="px-1 pt-3 pb-1 flex items-center justify-between gap-2">
                <div
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl ${theme.badge} border shadow-md backdrop-blur-xs min-w-0 transition-transform duration-150 hover:scale-[1.01]`}
                >
                  {SectionIcon && (
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${theme.iconBg} border`}
                    >
                      <SectionIcon className={`w-3 h-3 ${theme.iconColor}`} />
                    </div>
                  )}
                  <span className={`w-2 h-2 rounded-full ${theme.dot} shrink-0 animate-pulse`} />
                  <span
                    className={`text-[10px] font-black tracking-wider uppercase ${theme.text} font-sans truncate drop-shadow-sm`}
                  >
                    {sec.title}
                  </span>
                </div>
                <div className={`h-[1.5px] flex-1 bg-gradient-to-r ${theme.line} ml-1 rounded-full shadow-xs`} />
              </div>

              {/* Menu Items avec espacement confortable */}
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => isMobile && close()}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all duration-150 ease-out active:scale-[0.99] ${
                        isActive
                          ? `bg-white/15 text-white font-bold border-l-[3.5px] ${theme.activeBorder} shadow-xs`
                          : "text-blue-100/75 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 ${
                            isActive
                              ? `${theme.activeBg} ${theme.activeText}`
                              : "bg-white/5 text-blue-200/70 group-hover:bg-white/15 group-hover:text-white"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {item.badge && (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border transition-all ${
                              isActive
                                ? "bg-white/20 text-white border-white/30"
                                : "bg-white/10 text-blue-200/80 border-white/10 group-hover:text-white"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} shadow-xs`}></span>
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
      <div className="p-3 border-t border-white/10 bg-[#06182e] shrink-0">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${
                  user?.avatarColor || "from-[#DC2626] to-[#991B1B]"
                } text-white font-black text-xs flex items-center justify-center shadow-md ring-2 ring-white/20 shrink-0`}
              >
                {user?.initials || "HA"}
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-bold text-white leading-tight truncate">
                  {user?.fullName || "M. Hope d'Almeida"}
                </span>
                <span className="text-[10px] text-amber-300 font-semibold truncate">
                  {user?.roleLabel || "Directeur Général"}
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Déconnexion sécurisée"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#DC2626] hover:shadow-md transition-all duration-150 cursor-pointer shrink-0 ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-blue-200/80">
            <span className="truncate max-w-[140px]" title={user?.department}>
              {user?.department || "Direction Générale & Stratégique"}
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
