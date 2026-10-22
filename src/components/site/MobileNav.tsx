"use client";

import { ChevronDown, LayoutDashboard, Mail, Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isActivePath, siteConfig } from "@/content/site";
import { useSiteNav } from "./SiteContent";
import { cn } from "@/lib/utils";

/** Menu burger (< 1024 px) : panneau latéral avec rubriques dépliables et contacts. */
export function MobileNav() {
  const pathname = usePathname();
  const mainNav = useSiteNav();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloque le défilement de la page et ferme avec Échap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="flex size-11 items-center justify-center rounded-full border border-slate-200 text-avenida-blue transition-colors hover:bg-avenida-blue-50"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)} className="site-fade-in absolute inset-0 bg-avenida-blue-950/60 backdrop-blur-sm" />
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="site-slide-in absolute inset-y-0 right-0 flex w-[min(22rem,90vw)] flex-col overflow-y-auto bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <span className="font-serif text-lg font-extrabold tracking-wider text-vif">AVENIDA</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="flex size-10 items-center justify-center rounded-full text-avenida-blue hover:bg-avenida-blue-50"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <nav aria-label="Menu principal" className="flex-1 px-3 py-4">
              <ul className="flex flex-col gap-1">
                {mainNav.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const isExpanded = expanded === item.href;
                  return (
                    <li key={item.href}>
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className={cn(
                            "flex-1 rounded-xl px-3 py-3 font-display text-base font-bold",
                            active ? "bg-avenida-blue-50 text-vif" : "text-avenida-blue hover:bg-slate-50"
                          )}
                        >
                          {item.label}
                        </Link>
                        {item.children && (
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            aria-label={`Sous-menu ${item.label}`}
                            onClick={() => setExpanded(isExpanded ? null : item.href)}
                            className="flex size-11 items-center justify-center rounded-xl text-avenida-blue hover:bg-slate-50"
                          >
                            <ChevronDown aria-hidden className={cn("size-5 transition-transform", isExpanded && "rotate-180")} />
                          </button>
                        )}
                      </div>
                      {item.children && isExpanded && (
                        <ul className="mt-1 mb-2 ml-3 flex flex-col gap-0.5 border-l-2 border-vif/30 pl-3">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link href={child.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-vif">
                                <child.icon aria-hidden className="size-4 text-vif" />
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex flex-col gap-3 border-t border-slate-100 p-5">
              <Link href="/preinscription" className="flex h-12 items-center justify-center rounded-full bg-vif font-bold text-white">
                Pré-inscription en ligne
              </Link>
              <Link href="/connexion" className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-avenida-blue/15 font-bold text-avenida-blue">
                <LayoutDashboard aria-hidden className="size-4" />
                Mon espace
              </Link>
              <a href={`tel:${siteConfig.phones[0].e164}`} className="flex items-center gap-2 text-sm text-slate-600">
                <Phone aria-hidden className="size-4 text-vif" />
                {siteConfig.phones[0].display}
              </a>
              <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-2 text-sm break-all text-slate-600">
                <Mail aria-hidden className="size-4 shrink-0 text-vif" />
                {siteConfig.email}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
