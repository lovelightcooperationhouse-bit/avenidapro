"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isActivePath, mainNav } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * Menu horizontal (≥ 1024 px) avec sous-menus enrichis (icône + description).
 * - Souris : ouverture au survol, avec un léger délai de fermeture.
 * - Clavier : le chevron ouvre/ferme, Échap ferme et rend le focus au chevron.
 */
export function DesktopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const navRef = useRef<HTMLElement>(null);

  // Fermeture au changement de page et au clic à l'extérieur
  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const enter = (key: string) => {
    window.clearTimeout(closeTimer.current);
    setOpen(key);
  };
  const leave = () => {
    closeTimer.current = window.setTimeout(() => setOpen(null), 180);
  };

  return (
    <nav ref={navRef} aria-label="Menu principal" className="hidden lg:block">
      <ul className="flex items-center xl:gap-1">
        {mainNav.map((item, index) => {
          const active = isActivePath(pathname, item.href);
          const isOpen = open === item.href;
          const panelId = `submenu-${index}`;

          return (
            <li
              key={item.href}
              className="relative"
              onMouseEnter={item.children ? () => enter(item.href) : undefined}
              onMouseLeave={item.children ? leave : undefined}
              onKeyDown={(e) => {
                if (e.key === "Escape" && isOpen) {
                  setOpen(null);
                  (e.currentTarget.querySelector("button") as HTMLButtonElement | null)?.focus();
                }
              }}
            >
              <div className={cn("group/item relative flex items-center rounded-full transition-colors", isOpen ? "bg-avenida-blue-50" : "hover:bg-avenida-blue-50/70")}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn(
                    "py-2 text-[0.85rem] font-bold whitespace-nowrap transition-colors xl:text-[0.95rem]",
                    item.children ? "pr-0.5 pl-3 xl:pl-4" : "px-3 xl:px-4",
                    active || isOpen ? "text-avenida-red" : "text-avenida-blue hover:text-avenida-red"
                  )}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    aria-label={`Sous-menu ${item.label}`}
                    onClick={() => setOpen(isOpen ? null : item.href)}
                    className={cn(
                      "mr-1 flex size-6 items-center justify-center rounded-full transition-colors xl:mr-1.5",
                      active || isOpen ? "text-avenida-red" : "text-avenida-blue/50 group-hover/item:text-avenida-red"
                    )}
                  >
                    <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-300", isOpen && "rotate-180")} />
                  </button>
                )}
                {/* Repère de la rubrique active */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-3 -bottom-1.5 h-[3px] origin-center rounded-full bg-[image:linear-gradient(90deg,#0C356A,#DC2626)] transition-transform duration-300",
                    active ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </div>

              {item.children && (
                <div id={panelId} hidden={!isOpen} className={cn("site-menu-in absolute top-full z-50 pt-4", index >= mainNav.length - 3 ? "right-0" : "left-0")}>
                  <div className="w-[24rem] overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl">
                    <p className="px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.2em] text-avenida-red uppercase">{item.label}</p>
                    <ul className="flex flex-col gap-0.5">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setOpen(null)}
                            className="group/link flex items-start gap-3.5 rounded-2xl p-3 transition-colors hover:bg-avenida-blue-50"
                          >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-avenida-blue-50 text-avenida-blue transition-all duration-300 group-hover/link:scale-105 group-hover/link:bg-avenida-red group-hover/link:text-white">
                              <child.icon aria-hidden className="size-5" />
                            </span>
                            <span className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1.5 text-sm font-bold text-avenida-blue transition-colors group-hover/link:text-avenida-red">
                                {child.label}
                                <ArrowRight aria-hidden className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-100" />
                              </span>
                              <span className="text-xs leading-snug text-slate-500">{child.description}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
