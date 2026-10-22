"use client";

import { BedDouble, Bell, CalendarClock, LifeBuoy, ClipboardCheck, FileText, FolderOpen, Megaphone, GraduationCap, Home, IdCard, KeyRound, LayoutDashboard, LogOut, MessageSquare, UserRound } from "lucide-react";
import { NotificationBell } from "@/components/espace/NotificationBell";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { SiteLogo } from "@/components/site/SiteLogo";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

/** Pages accessibles avant la validation du dossier. */
const OPEN_TO_NEW = ["/espace/guide", "/espace/profil", "/espace/mot-de-passe", "/espace/notifications", "/espace/messages", "/espace/documents"];

/** Gabarit de l'espace personnel (élève, parent, professeur, candidat). */
export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/espace/mot-de-passe") router.replace("/connexion");
    // Nouveau membre : il complète d'abord son profil (statut, photo, informations, pièces)
    if (!isLoading && user?.role === "candidat" && !OPEN_TO_NEW.some((p) => pathname.startsWith(p))) router.replace("/espace/profil");
  }, [isLoading, user, pathname, router]);

  if (isLoading || (!user && pathname !== "/espace/mot-de-passe")) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <div className="size-10 animate-spin rounded-full border-4 border-avenida-blue border-t-transparent" aria-label="Chargement" />
      </div>
    );
  }

  // Rubriques selon le rôle : École pour élèves et enseignants, Hôtel pour le personnel, correspondance et carte pour les familles
  const role = user?.role;
  const nav = [
    { href: "/espace", label: "Mon espace", icon: Home, show: role !== "candidat" },
    { href: "/espace/ecole", label: "Espace École", icon: GraduationCap, show: ["eleve", "professeur", "directeur_pedagogique", "directeur_general"].includes(role ?? "") },
    { href: "/espace/hotel", label: "Espace Hôtel", icon: BedDouble, show: ["personnel", "responsable_hotel", "directeur_general"].includes(role ?? "") },
    { href: "/espace/correspondance", label: "Correspondance", icon: ClipboardCheck, show: ["eleve", "parent", "professeur"].includes(role ?? "") },
    { href: "/espace/fiche", label: "Fiche d'inscription", icon: FileText, show: ["eleve", "parent"].includes(role ?? "") },
    { href: "/espace/carte", label: role === "eleve" || role === "parent" ? "Carte scolaire" : "Carte de travail", icon: IdCard, show: role !== "candidat" && role !== "client" },
    { href: "/espace/documents", label: "Mes documents", icon: FolderOpen, show: true },
    { href: "/espace/annonces", label: "Annonces", icon: Megaphone, show: role !== "candidat" },
    { href: "/espace/notifications", label: "Notifications", icon: Bell, show: true },
    { href: "/discussions", label: "Discussions", icon: MessageSquare, show: true },
    { href: "/reunions", label: "Réunions", icon: CalendarClock, show: role !== "candidat" },
    { href: "/espace/profil", label: role === "candidat" ? "Compléter mon profil" : "Mon profil", icon: UserRound, show: true },
    { href: "/espace/mot-de-passe", label: "Mot de passe", icon: KeyRound, show: true },
    { href: "/espace/guide", label: "Guide", icon: LifeBuoy, show: true },
  ].filter((n) => n.show);

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <SiteLogo />
          {user && (
            <div className="flex items-center gap-3">
              {user.home === "/dashboard" && (
                <Link href="/dashboard" className="hidden items-center gap-2 rounded-full border-2 border-avenida-blue/15 px-4 py-2 text-sm font-bold text-avenida-blue hover:bg-avenida-blue-50 sm:inline-flex">
                  <LayoutDashboard aria-hidden className="size-4" />
                  Espace de gestion
                </Link>
              )}
              <NotificationBell />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-avenida-blue">{user.fullName}</p>
                <p className="text-xs font-semibold text-vif">{user.roleLabel}</p>
              </div>
              <span className={cn("flex size-11 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white", user.avatarColor)}>{user.initials}</span>
              <button
                type="button"
                onClick={() => logout()}
                aria-label="Se déconnecter"
                className="flex size-10 items-center justify-center rounded-full text-slate-500 hover:bg-red-50 hover:text-vif"
              >
                <LogOut aria-hidden className="size-5" />
              </button>
            </div>
          )}
        </div>
        {user && (
          <nav aria-label="Espace personnel" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
            {nav.map((n) => {
              const active = n.href === "/espace" ? pathname === n.href : pathname.startsWith(n.href) || (n.href === "/espace/ecole" && pathname.startsWith("/espace/salle"));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 border-b-[3px] px-3 py-3 text-sm font-bold transition-colors",
                    active ? "border-vif text-vif" : "border-transparent text-slate-600 hover:text-avenida-blue"
                  )}
                >
                  <n.icon aria-hidden className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
