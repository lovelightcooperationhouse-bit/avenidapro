"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, PRESET_USERS } from "@/context/AuthContext";
import {
  Lock,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Building2,
  Phone,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();

  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickRedirect = () => {
    router.push("/dashboard");
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!identity.trim()) {
      setErrorMessage("Veuillez renseigner votre identifiant ou adresse e-mail.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Veuillez renseigner votre mot de passe.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(identity, password);
      setIsLoading(false);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setErrorMessage(res.message || "Identifiants incorrects.");
      }
    }, 350);
  };

  const handleSelectPreset = (preset: typeof PRESET_USERS[0]) => {
    setIdentity(preset.username);
    setPassword("avenida");
    setErrorMessage("");
    setIsLoading(true);
    setTimeout(() => {
      const res = login(preset.username, "avenida");
      setIsLoading(false);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setErrorMessage(res.message || "Erreur de connexion.");
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-[#DC2626] selection:text-white">
      {/* ═════════════════════ BANDEAU SUPÉRIEUR TRICOLORE ═════════════════════ */}
      <div className="h-1.5 w-full flex">
        <div className="w-1/3 bg-[#0C356A]" />
        <div className="w-1/3 bg-slate-300" />
        <div className="w-1/3 bg-[#DC2626]" />
      </div>

      {/* ═════════════════════ BARRE UNIQUE DE CONTACT (SANS RÉTÉPITIONS) ═════════════════════ */}
      <div className="bg-[#0C356A] text-white px-4 py-2.5 text-xs shadow-md border-b border-blue-900">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-extrabold uppercase tracking-wide text-white text-[11px] sm:text-xs">
              Portail Officiel d&apos;Accès &bull; Hôtel École Avenida
            </span>
          </div>

          {/* Contact unique : Adresse + Téléphone (affiché une seule fois) */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-100">
              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>30, Rue d&apos;Almeida Leopold, Dékon, Lomé - Togo</span>
            </span>
            <span className="hidden sm:inline text-blue-300">|</span>
            <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>+228 90 20 15 15 / +228 22 21 00 00</span>
            </span>
          </div>
        </div>
      </div>

      {/* ═════════════════════ EN-TÊTE ÉLÉGANTE : TITRE BLEU SUR FOND BLANC ═════════════════════ */}
      <header className="bg-white border-b border-slate-200 py-6 px-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md border-2 border-amber-400 flex items-center justify-center shrink-0">
              <img
                src="/logoavenida.jpg"
                alt="Logo Officiel Hôtel École Avenida"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0C356A] uppercase tracking-tight font-serif">
                HÔTEL ÉCOLE <span className="text-[#DC2626]">AVENIDA</span>
              </h1>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mt-0.5">
                « Travail • Discipline • Excellence »
              </p>
            </div>
          </div>

          <div className="text-right hidden md:block">
            <span className="inline-block px-3.5 py-1 bg-blue-50 text-[#0C356A] border border-blue-200 rounded-full text-xs font-bold">
              Complexe d&apos;Application Hôtelière & Formation Technique
            </span>
          </div>
        </div>
      </header>

      {/* ═════════════════════ CONTENU PRINCIPAL : ARCHITECTURE EN 2 COLONNES SUR FOND CLAIR ═════════════════════ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* ──────────────────────────────────────────────────────────────────────────
              COLONNE GAUCHE (6 cols) : PHOTO DE LA DEVANTURE DE L'ÉCOLE BIEN VISIBLE
              ────────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-xl overflow-hidden group">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                <img
                  src="/avenida_building.jpg"
                  alt="Devanture Officielle et Bâtiment de l'Hôtel École Avenida Lomé"
                  className="w-full h-[420px] sm:h-[480px] object-cover object-[center_30%] group-hover:scale-102 transition-transform duration-500"
                />

                {/* Bandeau descriptif discret sur l'image */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-4 text-white">
                  <p className="font-black text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    Devanture Officielle de l&apos;Hôtel École Avenida
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Architecture Tricolore Officielle &bull; Quartier Dékon, Lomé Togo
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────────────
              COLONNE DROITE (6 cols) : FORMULAIRE ET ACCÈS RÔLES (FOND BLANC & TITRE BLEU)
              ────────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-6">
            <div>
              {/* Header Formulaire : Titre Bleu */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0C356A] text-white flex items-center justify-center shadow-md">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#0C356A]">
                      Espace d&apos;Identification
                    </h2>
                    <p className="text-xs text-slate-500">
                      Veuillez saisir vos identifiants pour ouvrir votre session
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                  Accès Protégé
                </span>
              </div>

              {/* Message d'erreur */}
              {errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Formulaire de Connexion */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-[#0C356A] mb-1.5">
                    Identifiant utilisateur ou Email institutionnel
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identity}
                      onChange={(e) => setIdentity(e.target.value)}
                      placeholder="ex: directeur, pedagogie, comptable..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] transition-all font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#0C356A]">
                      Mot de passe
                    </label>
                    <span className="text-[11px] text-amber-700 font-mono">
                      Mot de passe démo : <strong>avenida</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] transition-all font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-[#0C356A] hover:bg-[#082447] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-50 tracking-wide uppercase"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>S&apos;identifier & Accéder au Tableau de Bord</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* ══════ BOUTONS D'ACCÈS RAPIDE 1-CLIC PAR RÔLE ══════ */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <p className="text-[11px] font-black text-[#0C356A] uppercase tracking-wider flex items-center justify-between">
                <span>Accès Rapide par Profil (1 Clic = Connexion Immédiate) :</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_USERS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/70 hover:border-[#0C356A]/40 text-xs flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-95 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${preset.avatarColor} text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}
                      >
                        {preset.initials}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 text-xs leading-tight group-hover:text-[#0C356A] transition-colors">
                          {preset.roleLabel}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          Login: <span className="font-mono font-semibold text-slate-700">{preset.username}</span>
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C356A] group-hover:translate-x-1 transition-all shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Session déjà ouverte */}
            {isAuthenticated && user && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-900 text-xs">
                    Session active : <strong>{user.fullName}</strong> ({user.roleLabel})
                  </span>
                </div>
                <button
                  onClick={handleQuickRedirect}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs transition-all cursor-pointer"
                >
                  Ouvrir le Tableau de Bord
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ═════════════════════ PIED DE PAGE DISCRET ═════════════════════ */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
            <span className="font-bold text-[#0C356A]">HÔTEL ÉCOLE AVENIDA</span>
            <span>&bull; 30, Rue d&apos;Almeida Leopold, Dékon, Lomé - Togo</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Plateforme Numérique Officielle &bull; 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
