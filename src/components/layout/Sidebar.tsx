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
  Sparkles,
  Shield,
} from "lucide-react";
import { AvenidaLogo } from "@/components/shared/AvenidaLogo";
import { useSchoolYear } from "@/context/SchoolYearContext";
import { useAuth } from "@/context/AuthContext";

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
  color: "blue" | "red" | "neutral" | "emerald";
  items: NavItem[];
  allowedRoles?: string[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { selectedYearLabel } = useSchoolYear();
  const { user, logout } = useAuth();

  const userRole = user?.role || "directeur_general";

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
      title: "ESPACE ÉCOLE & FORMATION",
      color: "blue",
      allowedRoles: ["directeur_general", "directeur_pedagogique"],
      items: [
        {
          label: "Dossiers Élèves",
          href: "/dashboard/students",
          icon: Users,
          badge: "152 inscrits",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          allowedRoles: ["directeur_general", "directeur_pedagogique"],
        },
        {
          label: "Diplômes (CFA, CAP, BT...)",
          href: "/dashboard/programs",
          icon: GraduationCap,
          allowedRoles: ["directeur_general", "directeur_pedagogique"],
        },
        {
          label: "Vie Scolaire (Absences/Retards)",
          href: "/dashboard/attendance",
          icon: CalendarCheck,
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
        {
          label: "Statut Écolages (#AV2022)",
          href: "/dashboard/payments",
          icon: CreditCard,
          badge: "Situation",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          allowedRoles: ["directeur_general", "directeur_pedagogique"],
        },
      ],
    },
    {
      title: "ESPACE HÔTEL & CLIENTS",
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
          label: "Réservations & Reçus",
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
      title: "GESTION DU PERSONNEL & RH",
      color: "neutral",
      allowedRoles: ["directeur_general", "ressources_humaines"],
      items: [
        {
          label: "Personnel & Professeurs",
          href: "/dashboard/employees",
          icon: Briefcase,
          badge: "École & Hôtel",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
          allowedRoles: ["directeur_general", "ressources_humaines"],
        },
        {
          label: "Salaires & Paie (F CFA)",
          href: "/dashboard/salaries",
          icon: Wallet,
          allowedRoles: ["directeur_general", "ressources_humaines"],
        },
      ],
    },
    {
      title: "COMPTABILITÉ & TRÉSORERIE",
      color: "emerald",
      allowedRoles: ["directeur_general", "comptable"],
      items: [
        {
          label: "Caisse Écolages (#AV2022)",
          href: "/dashboard/payments",
          icon: CreditCard,
          badge: "Paiements",
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
          label: "Salaires & Paie (F CFA)",
          href: "/dashboard/salaries",
          icon: Wallet,
          allowedRoles: ["directeur_general", "comptable"],
        },
        {
          label: "Économat & Stocks",
          href: "/dashboard/inventory",
          icon: Boxes,
          allowedRoles: ["directeur_general", "comptable"],
        },
        {
          label: "Rapports Financiers & Activité",
          href: "/dashboard/reports",
          icon: FileText,
          allowedRoles: ["directeur_general", "comptable"],
        },
      ],
    },
    {
      title: "ADMINISTRATION SYSTÈME",
      color: "neutral",
      allowedRoles: ["directeur_general"],
      items: [
        {
          label: "Utilisateurs & Droits",
          href: "/dashboard/users",
          icon: ShieldCheck,
          allowedRoles: ["directeur_general"],
        },
        {
          label: "Paramètres Avenida",
          href: "/dashboard/settings",
          icon: Settings,
          allowedRoles: ["directeur_general"],
        },
      ],
    },
  ];

  // Filter sections and items based on role
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

  return (
    <aside className="w-72 bg-gradient-to-b from-[#0C356A] via-[#0A2E5C] to-[#072042] text-slate-100 flex flex-col border-r border-[#164E87]/80 h-screen sticky top-0 select-none z-30 shadow-2xl transition-all">
      {/* Brand Header with Official Logo */}
      <div className="p-4 border-b border-slate-200 bg-white shadow-xs">
        <Link href="/dashboard" className="block hover:scale-[1.01] transition-transform duration-200">
          <AvenidaLogo size="md" showText={true} />
        </Link>
        <div className="mt-3 flex items-center justify-between text-[10px] text-[#0C356A] bg-blue-50/90 border border-blue-200/80 rounded-xl px-2.5 py-1.5 font-bold shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Site : <strong className="text-[#DC2626]">LOMÉ</strong></span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">{selectedYearLabel}</span>
        </div>
      </div>

      {/* Navigation List with Strict Role Separation */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 text-xs sidebar-scrollbar">
        {visibleSections.map((sec, idx) => {
          const headerThemes = {
            blue: {
              container: "bg-gradient-to-r from-[#113B6B] to-[#0D2D52] border-blue-400/40 text-blue-100 shadow-md",
              badge: "bg-blue-500/30 text-cyan-200 border-blue-300/40",
              dot: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse",
              badgeText: "ÉCOLE",
              textColor: "text-white font-black",
            },
            red: {
              container: "bg-gradient-to-r from-[#7F1D1D]/90 to-[#450A0A]/90 border-red-500/40 text-red-100 shadow-md",
              badge: "bg-red-500/30 text-rose-200 border-red-300/40",
              dot: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse",
              badgeText: "HÔTEL",
              textColor: "text-white font-black",
            },
            emerald: {
              container: "bg-gradient-to-r from-emerald-950/80 to-slate-900/80 border-emerald-500/30 text-emerald-100 shadow-md",
              badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
              dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse",
              badgeText: "FINANCES",
              textColor: "text-emerald-100 font-extrabold",
            },
            neutral: {
              container: idx === 0
                ? "bg-white/10 border-white/20 text-slate-100"
                : "bg-slate-900/80 border-indigo-500/30 text-indigo-100",
              badge: idx === 0
                ? "bg-white/20 text-white border-white/30"
                : "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
              dot: idx === 0
                ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                : "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]",
              badgeText: idx === 0 ? "VUE D'ENSEMBLE" : "GESTION",
              textColor: "text-slate-100 font-extrabold",
            },
          }[sec.color];

          return (
            <div key={idx} className="space-y-2">
              {/* Grand Titre de Section Mis en Valeur */}
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-xl border backdrop-blur-xs transition-all duration-200 ${headerThemes.container}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${headerThemes.dot}`} />
                  <span className={`text-[11px] tracking-wider uppercase font-sans ${headerThemes.textColor}`}>
                    {sec.title}
                  </span>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${headerThemes.badge}`}>
                  {headerThemes.badgeText}
                </span>
              </div>

              {/* Menu Items */}
              <div className="space-y-2.5">
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
                      : "bg-[#164E87] text-white border-l-4 border-blue-300 font-bold shadow-inner translate-x-1";

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center justify-between px-3 py-3 rounded-xl font-medium text-[12.5px] transition-all duration-200 ease-out active:scale-[0.98] ${
                        isActive
                          ? activeClasses
                          : "text-blue-100/80 hover:text-white hover:bg-white/10 hover:translate-x-1.5 hover:shadow-md hover:shadow-black/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
                            isActive
                              ? sec.color === "red"
                                ? "bg-white/20 text-white"
                                : "bg-white/15 text-white"
                              : "bg-white/5 text-blue-200/90 group-hover:bg-white/15 group-hover:text-amber-300 group-hover:scale-110"
                          }`}
                        >
                          <Icon className="w-4 h-4 transition-transform duration-200 group-hover:rotate-3" />
                        </div>
                        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold border transition-transform duration-200 group-hover:scale-105 shadow-2xs ${
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
      <div className="p-3 border-t border-[#164E87]/80 bg-[#061B36]">
        <div className="p-2.5 rounded-xl bg-[#0C356A]/90 border border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${
                  user?.avatarColor || "from-[#DC2626] to-[#991B1B]"
                } text-white font-black text-xs flex items-center justify-center shadow-md ring-2 ring-white/20`}
              >
                {user?.initials || "DG"}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white leading-tight">
                  {user?.fullName || "Direction Générale"}
                </span>
                <span className="text-[10px] text-amber-300 font-semibold">
                  {user?.roleLabel || "Directeur Général"}
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Déconnexion sécurisée"
              className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-[#DC2626] hover:shadow-md hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-blue-200/80">
            <span className="truncate max-w-[170px]" title={user?.department}>
              {user?.department || "Direction Générale"}
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Connecté
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
