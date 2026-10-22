"use client";

import { ChevronDown, LogOut, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMobileNav } from "@/context/MobileNavContext";
import { cn } from "@/lib/utils";
import { isItemActive, moduleForPath, modulesFor, type NavModule } from "./navigation";

/** Adresse courante (chemin + paramètres) ; le gabarit place le menu dans un <Suspense>. */
export function useLocationSearch() {
  const pathname = usePathname();
  const params = useSearchParams();
  return { pathname, search: `?${params.toString()}` };
}

function ModuleLinks({ module, pathname, search, onNavigate }: { module: NavModule; pathname: string; search: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      {module.sections.map((s, i) => (
        <div key={s.title ?? i} className="flex flex-col gap-1">
          {s.title && <p className="px-3 pb-1 text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">{s.title}</p>}
          {s.items.map((item) => {
            const active = isItemActive(item.href, pathname, search);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  active ? "bg-white text-[#06152E] shadow-lg" : "text-white/80 hover:bg-[#E30613] hover:text-white"
                )}
              >
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", active ? "text-white" : "bg-white/10")} style={active ? { backgroundColor: "#E30613" } : undefined}>
                  <item.icon aria-hidden className="size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{item.label}</span>
                  {item.hint && <span className={cn("block truncate text-[11px]", active ? "text-slate-500" : "text-white/45")}>{item.hint}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * Menu vertical de l'espace de gestion :
 * - grand écran : pages du module choisi dans le menu horizontal ;
 * - téléphone / tablette : tiroir avec tous les modules dépliables.
 */
export function Sidebar() {
  const { user, logout } = useAuth();
  const { isOpen, close } = useMobileNav();
  const { pathname, search } = useLocationSearch();
  const modules = useMemo(() => modulesFor(user?.role), [user?.role]);
  const current = moduleForPath(modules, pathname, search) ?? modules[0];
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setExpanded(current?.key ?? null);
  }, [current?.key]);

  if (!user || !current) return null;

  const userCard = (
    <div className="flex items-center gap-3 border-t border-white/10 p-4">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white", user.avatarColor)}>{user.initials}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">{user.fullName}</span>
        <span className="block truncate text-[11px] font-semibold text-[#FF6B73]">{user.roleLabel}</span>
      </span>
      <Link href="/espace/profil" aria-label="Mon profil" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">
        <UserRound aria-hidden className="size-4" />
      </Link>
      <button type="button" onClick={() => logout()} aria-label="Se déconnecter" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-[#FF6B73]">
        <LogOut aria-hidden className="size-4" />
      </button>
    </div>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-3 px-5 py-5">
      {/* eslint-disable-next-line @next/next/no-img-element -- logo */}
      <img src="/icons/icon-192.png" alt="" className="size-10 rounded-xl bg-white object-contain p-0.5" />
      <span className="leading-tight">
        <span className="block font-serif text-[11px] font-bold tracking-[0.2em] text-white/70">HÔTEL ÉCOLE</span>
        <span className="block font-serif text-lg font-extrabold tracking-wider text-[#FF3B47]">AVENIDA</span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Grand écran : pages du module actif */}
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col bg-[#06152E] lg:flex">
        {brand}
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-white">
          <current.icon aria-hidden className="size-5" />
          <span className="text-sm font-black tracking-wide uppercase">{current.label}</span>
        </div>
        <nav aria-label={`Pages du module ${current.label}`} className="flex-1 overflow-y-auto px-3 pb-6">
          <ModuleLinks module={current} pathname={pathname} search={search} />
        </nav>
        <span aria-hidden className="flex h-1">
          <span className="flex-1 bg-[#0C356A]" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-[#E30613]" />
        </span>
        {userCard}
      </aside>

      {/* Téléphone et tablette : tiroir avec tous les modules */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fermer le menu" onClick={close} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-[#06152E] shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button type="button" onClick={close} aria-label="Fermer le menu" className="rounded-full p-2 text-white/70 hover:bg-white/10">
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <nav aria-label="Menu de gestion" className="flex-1 overflow-y-auto px-3 pb-6">
              {modules.map((m) => (
                <div key={m.key} className="mb-1">
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === m.key ? null : m.key)}
                    aria-expanded={expanded === m.key}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-white hover:bg-white/5"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
                      <m.icon aria-hidden className="size-4" />
                    </span>
                    <span className="flex-1 text-sm font-black">{m.label}</span>
                    <ChevronDown aria-hidden className={cn("size-4 text-white/50 transition-transform", expanded === m.key && "rotate-180")} />
                  </button>
                  {expanded === m.key && (
                    <div className="mt-1 mb-3 pl-2">
                      <ModuleLinks module={m} pathname={pathname} search={search} onNavigate={close} />
                    </div>
                  )}
                </div>
              ))}
            </nav>
            {userCard}
          </aside>
        </div>
      )}
    </>
  );
}
