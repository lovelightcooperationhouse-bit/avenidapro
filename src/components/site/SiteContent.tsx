"use client";

import { Megaphone, X } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useMemo, useState } from "react";
import { mainNav, siteConfig, type NavEntry } from "@/content/site";
import type { CmsMenuItem, CmsSettings } from "@/lib/cms-types";
import { iconByName } from "@/lib/icons";

type Ctx = { nav: NavEntry[]; settings: CmsSettings };
const SiteContentContext = createContext<Ctx>({ nav: mainNav, settings: {} });

/** Fournit au site public le menu et les réglages modifiés dans l'administration (repli : contenu par défaut). */
export function SiteContentProvider({ menu, settings, children }: { menu: CmsMenuItem[]; settings: CmsSettings; children: React.ReactNode }) {
  const nav = useMemo<NavEntry[]>(() => {
    const top = menu.filter((m) => !m.parent_id);
    if (!top.length) return mainNav;
    return top.map((m) => {
      const kids = menu.filter((c) => c.parent_id === m.id);
      return {
        label: m.label,
        href: m.href,
        children: kids.length ? kids.map((c) => ({ label: c.label, href: c.href, description: c.description ?? "", icon: iconByName(c.icon) })) : undefined,
      };
    });
  }, [menu]);
  return <SiteContentContext.Provider value={{ nav, settings }}>{children}</SiteContentContext.Provider>;
}

export const useSiteNav = () => useContext(SiteContentContext).nav;
export const useSiteSettings = () => useContext(SiteContentContext).settings;

/** Réseaux sociaux : ceux saisis dans l'administration remplacent les valeurs par défaut. */
export function useSocials() {
  const s = useSiteSettings().socials ?? {};
  return { ...siteConfig.socials, ...Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined)) } as typeof siteConfig.socials;
}

/** Bandeau d'annonce tout en haut du site (activé depuis l'administration). */
export function AnnouncementBar() {
  const b = useSiteSettings().bandeau;
  const [closed, setClosed] = useState(false);
  if (!b?.visible || !b.text || closed) return null;
  const content = (
    <>
      <Megaphone aria-hidden className="size-4 shrink-0" />
      <span className="font-semibold">{b.text}</span>
    </>
  );
  return (
    <div className="relative bg-vif px-10 py-2 text-center text-sm text-white">
      {b.href ? (
        <Link href={b.href} className="inline-flex items-center gap-2 underline-offset-2 hover:underline">
          {content}
        </Link>
      ) : (
        <span className="inline-flex items-center gap-2">{content}</span>
      )}
      <button type="button" onClick={() => setClosed(true)} aria-label="Fermer l'annonce" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 hover:bg-white/20">
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
