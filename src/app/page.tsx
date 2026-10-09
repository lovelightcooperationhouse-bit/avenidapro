"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Building2,
  Phone,
  MapPin,
  ShieldCheck,
  LogOut,
  Sparkles,
  UserPlus,
  Info,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { login, register, logout, isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // État Connexion
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // État Inscription / Activation
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickRedirect = () => {
    router.push("/dashboard");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!identity.trim()) {
      setErrorMessage("Veuillez saisir votre identifiant ou adresse e-mail professionnelle.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Veuillez saisir votre mot de passe.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(identity, password);
      setIsLoading(false);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setErrorMessage(res.message || "Identifiants incorrects. Veuillez réessayer.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || "Erreur de connexion.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!regFirstName.trim() || !regLastName.trim()) {
      setErrorMessage("Veuillez renseigner votre prénom et votre nom.");
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage("Veuillez renseigner votre adresse e-mail professionnelle.");
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
      });
      setIsLoading(false);
      if (res.success) {
        setSuccessMessage("Compte validé avec succès ! Redirection vers votre espace...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setErrorMessage(res.message || "Impossible d'activer ce compte.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || "Erreur lors de l'activation du compte.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-[#DC2626] selection:text-white">
      {/* ═════════════════════ BANDEAU SUPÉRIEUR TRICOLORE ═════════════════════ */}
      <div className="h-1.5 w-full flex">
        <div className="w-1/3 bg-[#0C356A]" />
        <div className="w-1/3 bg-slate-300" />
        <div className="w-1/3 bg-[#DC2626]" />
      </div>

      {/* ═════════════════════ BARRE DE CONTACT OFFICIELLE ═════════════════════ */}
      <div className="bg-[#0C356A] text-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs shadow-md border-b border-blue-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="font-extrabold uppercase tracking-wide text-white text-[10px] sm:text-xs">
              Portail Officiel d&apos;Accès &bull; Hôtel École Avenida Lomé
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-4 text-[11px] sm:text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-100">
              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>30, Rue d&apos;Almeida Leopold, Dékon, Lomé</span>
            </span>
            <span className="hidden sm:inline text-blue-300">|</span>
            <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>+228 90 20 15 15 / 22 21 00 00</span>
            </span>
          </div>
        </div>
      </div>

      {/* ═════════════════════ EN-TÊTE OFFICIEL ═════════════════════ */}
      <header className="bg-white border-b border-slate-200 py-4 sm:py-6 px-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 shadow-md border-2 border-amber-400 flex items-center justify-center shrink-0">
              <img
                src="/logoavenida.jpg"
                alt="Logo Officiel Hôtel École Avenida"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0C356A] uppercase tracking-tight font-serif">
                HÔTEL ÉCOLE <span className="text-[#DC2626]">AVENIDA</span>
              </h1>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mt-0.5">
                « Travail • Discipline • Excellence »
              </p>
            </div>
          </div>

          <div className="hidden md:block text-right">
            <span className="inline-block px-3.5 py-1.5 bg-blue-50 text-[#0C356A] border border-blue-200 rounded-full text-xs font-bold">
              Complexe d&apos;Application Hôtelière & Formation Supérieure
            </span>
          </div>
        </div>
      </header>

      {/* ═════════════════════ CONTENU PRINCIPAL RESPONSIVE ═════════════════════ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">

          {/* ──────────────────────────────────────────────────────────────────────────
              COLONNE 1 : DEVANTURE DE L'ÉTABLISSEMENT AVEC CADRE HARMONIEUX
              ────────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden group">
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                <img
                  src="/avenida_building.jpg"
                  alt="Devanture Officielle de l'Hôtel École Avenida Lomé"
                  className="w-full h-52 sm:h-64 md:h-80 lg:h-[460px] object-cover object-[center_30%] group-hover:scale-102 transition-transform duration-500"
                />

                {/* Bandeau descriptif sur l'image */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-3 sm:p-5 text-white">
                  <p className="font-black text-xs sm:text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Devanture & Campus Officiel de l&apos;Hôtel École Avenida</span>
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                    Architecture Tricolore &bull; Quartier Dékon, Lomé - TOGO
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────────────
              COLONNE 2 : FORMULAIRE DE CONNEXION STRICTEMENT UNIQUE (UTILISATEUR & MDP)
              ────────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 shadow-xl flex flex-col justify-between space-y-5">
            <div>
              {/* Header Formulaire */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0C356A] text-white flex items-center justify-center shadow-md shrink-0">
                    <Lock className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#0C356A]">
                      Portail d&apos;Identification
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      Accès sécurisé pour le personnel administratif et enseignant
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-bold uppercase tracking-wider shrink-0">
                  Accès Protégé
                </span>
              </div>

              {/* Alerte Session déjà active */}
              {isAuthenticated && user && (
                <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-emerald-950 font-bold block">
                        Session active : {user.fullName}
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        Rôle : {user.roleLabel} ({user.department})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleQuickRedirect}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      Ouvrir Tableau de Bord
                    </button>
                    <button
                      type="button"
                      onClick={() => logout()}
                      title="Changer de session"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Messages de Statut */}
              {errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Onglets de Bascule : Connexion vs Activation de Compte */}
              <div className="flex bg-slate-100 p-1 rounded-xl mt-4 border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setActiveTab("login"); setErrorMessage(""); setSuccessMessage(""); }}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "login"
                      ? "bg-white text-[#0C356A] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>S&apos;identifier</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("register"); setErrorMessage(""); setSuccessMessage(""); }}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "register"
                      ? "bg-[#0C356A] text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Activer mon Compte</span>
                </button>
              </div>

              {/* ────────────────── FORMULAIRE 1 : CONNEXION ────────────────── */}
              {activeTab === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0C356A] mb-1.5">
                      Identifiant utilisateur ou Email institutionnel
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={identity}
                        onChange={(e) => setIdentity(e.target.value)}
                        placeholder="Ex: direction@ecole-avenida.tg ou directeur..."
                        autoComplete="username"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm sm:text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[#0C356A]">
                        Mot de passe de session
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Sensible à la casse
                      </span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        autoComplete="current-password"
                        className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm sm:text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] transition-all font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                        title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-[#0C356A] focus:ring-[#0C356A] w-4 h-4 cursor-pointer"
                      />
                      <span>Mémoriser cette session</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Protocole SSL 256-bit
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 bg-[#0C356A] hover:bg-[#082447] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-50 tracking-wide uppercase mt-2 group"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span>S&apos;identifier & Accéder</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ────────────────── FORMULAIRE 2 : ACTIVATION DE COMPTE AUTORISÉ ────────────────── */}
              {activeTab === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5 mt-4">
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Accès sur autorisation préalable :</strong> Saisissez l&apos;adresse e-mail que la Direction Générale vous a attribuée pour activer vos droits et choisir votre mot de passe personnel.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[#0C356A] mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        placeholder="Ex: Koffi"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0C356A] mb-1">
                        Nom de famille
                      </label>
                      <input
                        type="text"
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        placeholder="Ex: Mensah"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0C356A] mb-1">
                      Adresse Email Autorisée par la Direction
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="Ex: prof.culinaire@ecole-avenida.tg..."
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[#0C356A] mb-1">
                        Nouveau Mot de Passe
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 6 caractères"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0C356A] mb-1">
                        Confirmer le Mot de Passe
                      </label>
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Répétez le mot de passe"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 uppercase tracking-wider mt-1 group"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                        <span>Activer mon Compte & Accéder à mon Espace</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Note institutionnelle de sécurité (sans affichage des identifiants/mots de passe) */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Portail sécurisé réservé au personnel habilité de l&apos;établissement</span>
              </div>
              <span className="hidden sm:inline text-slate-400">Site Lomé</span>
            </div>
          </div>
        </div>
      </main>

      {/* ═════════════════════ PIED DE PAGE DISCRET ═════════════════════ */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
            <span className="font-bold text-[#0C356A]">HÔTEL ÉCOLE AVENIDA</span>
            <span>&bull; 30, Rue d&apos;Almeida Leopold, Dékon, Lomé - Togo</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Plateforme Intégrée de Gestion &bull; 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
