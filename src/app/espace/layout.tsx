"use client";

import { Home, KeyRound, LayoutDashboard, LogOut, MessageSquare, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { SiteLogo } from "@/components/site/SiteLogo";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

/** Gabarit de l'espace personnel (élève, parent, professeur, candidat). */
export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/espace/mot-de-passe") router.replace("/connexion");
  }, [isLoading, user, pathname, router]);

  if (isLoading || (!user && pathname !== "/espace/mot-de-passe")) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <div className="size-10 animate-spin rounded-full border-4 border-avenida-blue border-t-transparent" aria-label="Chargement" />
      </div>
    );
  }

  const nav = [
    { href: "/espace", label: "Mon espace", icon: Home },
    { href: "/espace/messages", label: "Messages", icon: MessageSquare },
    { href: "/espace/profil", label: "Mon profil", icon: UserRound },
    { href: "/espace/mot-de-passe", label: "Mot de passe", icon: KeyRound },
  ];

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
              const active = pathname === n.href;
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
