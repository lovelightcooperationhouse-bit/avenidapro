"use client";

import { useState } from "react";
import {
  Search,
  Bell,
  Calendar,
  GraduationCap,
  BedDouble,
  PlusCircle,
  Clock,
  ChevronDown,
  Menu,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSchoolYear } from "@/context/SchoolYearContext";
import { useAuth } from "@/context/AuthContext";
import { useMobileNav } from "@/context/MobileNavContext";

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { toggle: toggleMobileNav } = useMobileNav();
  const {
    selectedYear,
    selectedYearLabel,
    availableYears,
    setSelectedYear,
    currentDateTime,
  } = useSchoolYear();

  const isSchool =
    pathname.includes("students") ||
    pathname.includes("programs") ||
    pathname.includes("attendance") ||
    pathname.includes("grades");

  const isHotel =
    pathname.includes("hotel") ||
    pathname.includes("reservations") ||
    pathname.includes("customers");

  // Formatage de la date/heure en français
  const formattedDate = currentDateTime.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = currentDateTime.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const canSeeSchool =
    !user ||
    user.role === "directeur_general" ||
    user.role === "directeur_pedagogique";

  const canSeeHotel =
    !user ||
    user.role === "directeur_general" ||
    user.role === "responsable_hotel";

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs gap-2">
      {/* Left: Mobile Drawer Toggle + Brand Mark */}
      <div className="flex items-center gap-2 lg:hidden shrink-0">
        <button
          onClick={toggleMobileNav}
          className="p-2 -ml-1 rounded-xl text-slate-700 hover:text-[#0C356A] hover:bg-slate-100 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20"
          aria-label="Ouvrir le menu de navigation"
          title="Ouvrir le menu"
        >
          <Menu className="w-5 h-5 text-[#0C356A]" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-amber-400 bg-white p-0.5 shrink-0 shadow-2xs">
            <img src="/logoavenida.jpg" alt="Avenida" className="w-full h-full object-contain" />
          </div>
          <span className="font-serif font-black text-xs text-[#0C356A] tracking-tight hidden sm:inline">
            AVENIDA
          </span>
        </Link>
      </div>

      {/* Global Search Bar */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher élève, chambre, reçu, matricule..."
            className="w-full pl-9 pr-3 sm:pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] text-slate-900 placeholder-slate-400 transition-all"
          />
          <kbd className="hidden md:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Center / Navigation Space Badges (Desktop) */}
      <div className="hidden xl:flex items-center gap-2 shrink-0">
        {canSeeSchool && (
          <Link
            href="/dashboard/students"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 group ${
              isSchool
                ? "bg-[#0C356A] text-white shadow-sm ring-1 ring-[#0C356A]/20"
                : "bg-blue-50/80 text-[#0C356A] hover:bg-blue-100 hover:-translate-y-0.5 hover:shadow-xs active:scale-95"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
            <span>Espace École</span>
          </Link>
        )}

        {canSeeHotel && (
          <Link
            href="/dashboard/hotel"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 group ${
              isHotel
                ? "bg-[#DC2626] text-white shadow-sm ring-1 ring-[#DC2626]/20"
                : "bg-red-50/80 text-[#DC2626] hover:bg-red-100 hover:-translate-y-0.5 hover:shadow-xs active:scale-95"
            }`}
          >
            <BedDouble className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
            <span>Espace Hôtel</span>
          </Link>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Active Session & Site Badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="text-slate-600 font-medium hidden md:inline">Site :</span>
          <span className="font-bold text-[#0C356A]">LOMÉ</span>
        </div>

        {/* SÉLECTEUR ANNÉE SCOLAIRE DYNAMIQUE */}
        <div className="hidden md:flex items-center gap-1.5 relative">
          <div className="flex items-center gap-1.5 bg-blue-50/90 border border-blue-200/80 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#0C356A] shadow-2xs hover:bg-blue-50 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-[#0C356A] shrink-0" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#0C356A] focus:outline-none cursor-pointer appearance-none pr-3"
            >
              {availableYears.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                  {year.status === "en_cours" ? " ●" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-[#0C356A]/60 -ml-2 pointer-events-none" />
          </div>
        </div>

        {/* DATE & HEURE EN TEMPS RÉEL (Grand Écran) */}
        <div className="hidden 2xl:flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200/60 px-3 py-1.5 rounded-xl text-[10px] font-semibold text-emerald-800 shadow-2xs">
          <Clock className="w-3 h-3 text-emerald-600" />
          <span>{formattedDate}</span>
          <span className="text-emerald-400">|</span>
          <span className="font-bold">{formattedTime}</span>
        </div>

        {/* Quick Caisse Action Button */}
        {user?.role === "comptable" || user?.role === "directeur_general" ? (
          <Link
            href="/dashboard/payments"
            className="flex items-center gap-1 bg-[#DC2626] hover:bg-[#b91c1c] text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold shadow-sm shadow-red-900/20 active:scale-95 transition-all duration-200 group"
          >
            <PlusCircle className="w-3.5 h-3.5 text-white transition-transform duration-300 group-hover:rotate-90" />
            <span className="hidden sm:inline">Caisse</span>
          </Link>
        ) : null}

        {/* User Pill / Avatar */}
        <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-200">
          <div
            title={`${user?.fullName || "Utilisateur"} (${user?.roleLabel || "Directeur Général"})`}
            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${
              user?.avatarColor || "from-[#0C356A] to-[#1E4D82]"
            } text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-xs hover:scale-105 transition-transform shrink-0`}
          >
            {user?.initials || "DG"}
          </div>
          <div className="hidden lg:flex flex-col text-left max-w-[140px]">
            <span className="text-xs font-bold text-slate-900 leading-tight truncate">
              {user?.fullName || "Utilisateur"}
            </span>
            <span className="text-[10px] text-blue-700 font-bold truncate">
              {user?.roleLabel || "Directeur Général"}
            </span>
          </div>

          {/* Quick Logout Button */}
          <button
            onClick={() => logout()}
            title="Déconnexion"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
