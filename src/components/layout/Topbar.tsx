"use client";

import { CalendarDays, ExternalLink, Home, Menu, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { NotificationBell } from "@/components/espace/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { useMobileNav } from "@/context/MobileNavContext";
import { useSchoolYear } from "@/context/SchoolYearContext";
import { cn } from "@/lib/utils";
import { moduleForPath, modulesFor } from "./navigation";
import { useLocationSearch } from "./Sidebar";

/**
 * Barre supérieure : modules (menu horizontal), recherche par matricule, année scolaire,
 * discussions, notifications. Le module choisi affiche ses pages dans le menu vertical.
 */
export function Topbar() {
  const { user } = useAuth();
  const router = useRouter();
  const { toggle } = useMobileNav();
  const { selectedYear, availableYears, setSelectedYear } = useSchoolYear();
  const { pathname, search } = useLocationSearch();
  const modules = useMemo(() => modulesFor(user?.role), [user?.role]);
  const current = moduleForPath(modules, pathname, search) ?? modules[0];
  const [q, setQ] = useState("");

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex h-16 items-center gap-3 px-3 sm:px-5">
        <button type="button" onClick={toggle} aria-label="Ouvrir le menu" className="rounded-xl p-2 text-[#0C356A] hover:bg-slate-100 lg:hidden">
          <Menu aria-hidden className="size-6" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo */}
          <img src="/icons/icon-192.png" alt="Avenida" className="size-9 rounded-lg" />
        </Link>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/dashboard/recherche?q=${encodeURIComponent(q.trim())}`);
          }}
          className="relative hidden max-w-xs flex-1 md:block"
          role="search"
        >
          <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Matricule, nom, téléphone…" aria-label="Recherche par matricule" className="w-full rounded-xl bg-slate-100 py-2.5 pr-3 pl-9 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#0C356A]/20" />
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <label className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-[#0C356A] sm:flex">
            <CalendarDays aria-hidden className="size-4" />
            <span className="sr-only">Année scolaire</span>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent font-bold outline-none">
              {availableYears.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                  {y.status === "en_cours" ? " (en cours)" : ""}
                </option>
              ))}
            </select>
          </label>
          <Link href="/discussions" aria-label="Discussions" title="Discussions" className="rounded-xl p-2.5 text-[#0C356A] hover:bg-slate-100">
            <MessageSquare aria-hidden className="size-5" />
          </Link>
          <NotificationBell />
          <Link href="/" target="_blank" aria-label="Voir le site public" title="Voir le site public" className="hidden rounded-xl p-2.5 text-[#0C356A] hover:bg-slate-100 sm:block">
            <ExternalLink aria-hidden className="size-5" />
          </Link>
          <Link href="/espace" aria-label="Mon espace personnel" title="Mon espace personnel" className="rounded-xl p-2.5 text-[#0C356A] hover:bg-slate-100">
            <Home aria-hidden className="size-5" />
          </Link>
        </div>
      </div>

      {/* Menu horizontal : modules */}
      <nav aria-label="Modules" className="flex gap-1 overflow-x-auto px-3 sm:px-5 [&::-webkit-scrollbar]:hidden">
        {modules.map((m) => {
          const active = m.key === current?.key;
          const first = m.sections[0].items[0];
          return (
            <Link
              key={m.key}
              href={first.href}
              aria-current={active ? "true" : undefined}
              className={cn("flex shrink-0 items-center gap-2 border-b-[3px] px-3 py-2.5 text-sm font-bold whitespace-nowrap transition-colors", active ? "text-[#06152E]" : "border-transparent text-slate-500 hover:text-[#0C356A]")}
              style={active ? { borderColor: "#E30613" } : undefined}
            >
              <m.icon aria-hidden className={cn("size-4", active && "text-[#E30613]")} />
              {m.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
