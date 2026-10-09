"use client";

import { useState } from "react";
import {
  Search,
  Calendar,
  GraduationCap,
  BedDouble,
  PlusCircle,
  Clock,
  ChevronDown,
  Menu,
  LogOut,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  ShieldCheck,
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

  const isConsolidated = pathname === "/dashboard";

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

  const canAccessAdmin =
    !user ||
    user.role === "directeur_general" ||
    (user.role as any) === "super_admin" ||
    (user.role as any) === "direction" ||
    (user.role as any) === "administration" ||
    user.email === "direction@ecole-avenida.tg";

  return (
    <header className="sticky top-0 z-20 bg-white shadow-xs">
      {/* =========================================================================
          NIVEAU 1 : MENUS PRINCIPAUX & UTILITAIRES (Recherche, Lomé, Année, Profil)
          ========================================================================= */}
      <div className="h-16 border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between gap-2 bg-white">
        {/* Gauche : Drawer mobile & Logo Avenida */}
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

        {/* Barre de Recherche Globale */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher élève, chambre, reçu, matricule..."
              className="w-full pl-9 pr-3 sm:pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] text-slate-900 placeholder-slate-400 transition-all font-medium"
            />
            <kbd className="hidden md:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Contrôles Utilitaires Droite */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Badge Site Officiel Lomé */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="text-slate-600 font-medium hidden md:inline">Site :</span>
            <span className="font-bold text-[#0C356A]">LOMÉ</span>
          </div>

          {/* Sélecteur Dynamique d'Année Scolaire */}
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

          {/* Horloge & Date Temps Réel */}
          <div className="hidden 2xl:flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200/60 px-3 py-1.5 rounded-xl text-[10px] font-semibold text-emerald-800 shadow-2xs">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>{formattedDate}</span>
            <span className="text-emerald-400">|</span>
            <span className="font-bold">{formattedTime}</span>
          </div>

          {/* Bouton Rapide Caisse */}
          {user?.role === "comptable" || user?.role === "directeur_general" || !user ? (
            <Link
              href="/dashboard/payments"
              className="flex items-center gap-1 bg-[#DC2626] hover:bg-[#b91c1c] text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold shadow-sm shadow-red-900/20 active:scale-95 transition-all duration-200 group"
            >
              <PlusCircle className="w-3.5 h-3.5 text-white transition-transform duration-300 group-hover:rotate-90" />
              <span className="hidden sm:inline">Caisse</span>
            </Link>
          ) : null}

          {/* Bouton Rapide Administrateur & Rôles (pour Direction / Super Admin) */}
          {canAccessAdmin && (
            <Link
              href="/dashboard/users"
              title="Gestion des Comptes, Rôles et Autorisations Administrateur"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                pathname === "/dashboard/users"
                  ? "bg-indigo-900 text-white border-indigo-900 shadow-sm"
                  : "bg-indigo-50/90 hover:bg-indigo-100 text-indigo-950 border-indigo-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline">Admin & Rôles</span>
            </Link>
          )}

          {/* Profil Utilisateur & Déconnexion */}
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

            <button
              onClick={() => logout()}
              title="Déconnexion"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          NIVEAU 2 : TOUT JUSTE EN BAS DES AUTRES MENUS — GRANDS BOUTONS DES ESPACES
          ESPACE ÉCOLE (BLEU) & ESPACE HÔTEL (ROUGE) — VISIBLES EN GROS & ANIMÉS
          ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-100/90 via-white to-slate-100/90 border-b border-slate-200/90 px-3 sm:px-6 py-2 sm:py-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Label d'orientation visuelle */}
          <div className="hidden xl:flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-500 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
            <span>Navigation par Pôle :</span>
          </div>

          {/* Grille des Grands Boutons d'Espaces */}
          <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-3 max-w-4xl">
            {/* BOUTON 1 : ESPACE ÉCOLE (VISIBLE EN GROS & ANIMÉ) */}
            {canSeeSchool && (
              <Link
                href="/dashboard/students"
                className={`relative group overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 flex items-center justify-between gap-3 border-2 ${
                  isSchool
                    ? "bg-gradient-to-r from-[#0C356A] via-[#12427f] to-[#08254A] text-white border-[#0C356A] shadow-md shadow-blue-900/30 glow-active-school scale-[1.01]"
                    : "bg-white hover:bg-blue-50/80 text-[#0C356A] border-blue-200 hover:border-[#0C356A] hover:shadow-md hover:-translate-y-0.5 active:scale-98"
                }`}
              >
                {/* Rayon de brillance lumineuse animé au survol */}
                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none -translate-x-full group-hover:animate-shimmer-pass" />

                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {/* Icône avec micro-interaction rotation & échelle */}
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                      isSchool
                        ? "bg-white/20 text-white shadow-inner"
                        : "bg-blue-100 text-[#0C356A] group-hover:bg-[#0C356A] group-hover:text-white"
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  {/* Titres & descriptions en gros caractères */}
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-black text-xs sm:text-sm md:text-base tracking-wide uppercase leading-tight truncate">
                        ESPACE ÉCOLE
                      </span>
                      {isSchool && (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] sm:text-xs font-semibold truncate ${
                        isSchool ? "text-blue-200" : "text-slate-500 group-hover:text-[#0C356A]"
                      }`}
                    >
                      Pôle Académique
                    </p>
                  </div>
                </div>

                {/* Badge d'état droit */}
                <div className="hidden md:flex flex-col items-end shrink-0">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isSchool
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                        : "bg-blue-100 text-[#0C356A] border-blue-200"
                    }`}
                  >
                    {isSchool ? "Pôle Actif" : "Accéder"}
                  </span>
                </div>
              </Link>
            )}

            {/* BOUTON 2 : ESPACE HÔTEL (VISIBLE EN GROS & ANIMÉ) */}
            {canSeeHotel && (
              <Link
                href="/dashboard/hotel"
                className={`relative group overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 flex items-center justify-between gap-3 border-2 ${
                  isHotel
                    ? "bg-gradient-to-r from-[#DC2626] via-[#b91c1c] to-[#7f1d1d] text-white border-[#DC2626] shadow-md shadow-red-900/30 glow-active-hotel scale-[1.01]"
                    : "bg-white hover:bg-red-50/80 text-[#DC2626] border-red-200 hover:border-[#DC2626] hover:shadow-md hover:-translate-y-0.5 active:scale-98"
                }`}
              >
                {/* Rayon de brillance lumineuse animé au survol */}
                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none -translate-x-full group-hover:animate-shimmer-pass" />

                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {/* Icône avec micro-interaction rotation & échelle */}
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                      isHotel
                        ? "bg-white/20 text-white shadow-inner"
                        : "bg-red-100 text-[#DC2626] group-hover:bg-[#DC2626] group-hover:text-white"
                    }`}
                  >
                    <BedDouble className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  {/* Titres & descriptions en gros caractères */}
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-black text-xs sm:text-sm md:text-base tracking-wide uppercase leading-tight truncate">
                        ESPACE HÔTEL
                      </span>
                      {isHotel && (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] sm:text-xs font-semibold truncate ${
                        isHotel ? "text-red-200" : "text-slate-500 group-hover:text-[#DC2626]"
                      }`}
                    >
                      Pôle Hébergement
                    </p>
                  </div>
                </div>

                {/* Badge d'état droit */}
                <div className="hidden md:flex flex-col items-end shrink-0">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isHotel
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                        : "bg-red-100 text-[#DC2626] border-red-200"
                    }`}
                  >
                    {isHotel ? "Pôle Actif" : "Accéder"}
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Boutons Rapides : Vue Globale & Admin/Rôles */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all duration-200 border ${
                isConsolidated
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Vue Globale</span>
            </Link>

            {canAccessAdmin && (
              <Link
                href="/dashboard/users"
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all duration-200 border ${
                  pathname === "/dashboard/users"
                    ? "bg-indigo-900 text-white border-indigo-900 shadow-md"
                    : "bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-50"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                <span>Admin & Rôles</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
