"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SchoolYearProvider } from "@/context/SchoolYearContext";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { AvenidaLogo } from "@/components/shared/AvenidaLogo";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, canAccessPath } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="animate-bounce mb-4">
          <AvenidaLogo size="lg" showText={false} />
        </div>
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-white tracking-wide">
          HÔTEL ÉCOLE AVENIDA LOMÉ
        </h2>
        <p className="text-xs text-blue-200 mt-1">
          Vérification des accréditations de sécurité...
        </p>
      </div>
    );
  }

  // Not authenticated: will redirect, return null or gate message
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/40">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white">Accès Réservé & Verrouillé</h2>
        <p className="text-sm text-slate-300 mt-2 max-w-md">
          L'accès au tableau de bord Avenida nécessite une authentification stricte. Redirection vers le portail de connexion...
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl transition-all"
        >
          Retour à la page d'identification
        </Link>
      </div>
    );
  }

  // Check role-based permission for current route
  const isAllowed = canAccessPath(pathname);

  // Fallback target path if user visits a forbidden route
  const defaultAllowedPath =
    user.role === "directeur_pedagogique"
      ? "/dashboard/students"
      : user.role === "comptable"
      ? "/dashboard/finances"
      : user.role === "ressources_humaines"
      ? "/dashboard/employees"
      : user.role === "responsable_hotel"
      ? "/dashboard/hotel"
      : "/dashboard";

  return (
    <SchoolYearProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            {!isAllowed ? (
              <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center max-w-2xl mx-auto my-12">
                <div className="w-16 h-16 rounded-full bg-red-100 text-[#DC2626] flex items-center justify-center mx-auto mb-4 border border-red-200">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-bold text-[#DC2626] uppercase tracking-wider">
                  Accès Restreint par Prérogatives
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-3">
                  Rubrique non attribuée à votre profil
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Conformément à la politique de séparation stricte des rôles de l'Hôtel École Avenida, votre compte{" "}
                  <strong className="text-slate-900 font-bold">{user.fullName}</strong> ({user.roleLabel}) ne dispose pas des droits d'accès à cette section.
                </p>
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-left">
                  <p className="font-bold text-slate-700 mb-1">Vos prérogatives autorisées :</p>
                  <p className="italic text-slate-600">{user.roleDescription}</p>
                </div>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Link
                    href={defaultAllowedPath}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0C356A] hover:bg-[#082447] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retourner à mon espace autorisé</span>
                  </Link>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </SchoolYearProvider>
  );
}
