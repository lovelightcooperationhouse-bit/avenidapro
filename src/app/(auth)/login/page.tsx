"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { AvenidaLogo } from "@/components/shared/AvenidaLogo";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identity, setIdentity] = useState("directeur");
  const [password, setPassword] = useState("avenida");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    setTimeout(() => {
      const res = login(identity, password);
      setLoading(false);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setErrorMessage(res.message || "Identifiants invalides.");
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C356A] via-[#164E87] to-[#072042] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-10 shadow-2xl border-2 border-slate-100 space-y-6 relative overflow-hidden">
        {/* Top Tricolore Bar: Bleu, Blanc, Rouge */}
        <div className="absolute top-0 left-0 right-0 h-2 flex">
          <div className="w-1/3 bg-[#0C356A]" />
          <div className="w-1/3 bg-slate-200" />
          <div className="w-1/3 bg-[#DC2626]" />
        </div>

        {/* Brand Header with Official Logo */}
        <div className="text-center flex flex-col items-center space-y-2 pt-2">
          <Link href="/">
            <AvenidaLogo size="lg" showText={true} />
          </Link>
          <div className="pt-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-[#0C356A] px-3 py-1 rounded-full border border-blue-200">
              Portail d&apos;Authentification Sécurisé
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Identifiant ou Email Professionnel</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="ex: directeur, pedagogie, comptable..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] text-slate-900 font-semibold"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">Mot de Passe</label>
              <span className="text-[10px] text-slate-400">avenida</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 focus:border-[#0C356A] text-slate-900 font-semibold"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0C356A] hover:bg-[#164E87] text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer group"
          >
            <span>{loading ? "Vérification des accréditations..." : "Accéder à l'Espace Attribué"}</span>
            <ArrowRight className="w-4 h-4 text-red-300 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <Link href="/" className="text-[#0C356A] font-bold hover:underline">
            ← Page d&apos;accueil & Hero
          </Link>
          <span>Lomé - TOGO</span>
        </div>
      </div>
    </div>
  );
}
