import type { Metadata } from "next";
import {
  AnnouncementBar,
  SiteContentProvider,
} from "@/components/site/SiteContent";
import { Newsletter } from "@/components/site/Newsletter";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SupportDock } from "@/components/site/SupportDock";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TopBar } from "@/components/site/TopBar";
import { getMenu, getSettings } from "@/lib/cms";

export const metadata: Metadata = {
  title: {
    default: "Hôtel École Avenida — Hôtellerie, Restauration, Tourisme à Lomé",
    template: "%s · Hôtel École Avenida",
  },
  description:
    "Hôtel École Avenida, Lomé (Togo) : formations CFA, CAP, BEP, BT et BTS en cuisine, restaurant, réception et hébergement. Cours du jour et du soir, internat, hôtel d'application.",
};

/** Gabarit des pages publiques : top bar, header collant, contenu, footer (menu et réglages modifiables par le DG). */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  return (
    <SiteContentProvider menu={menu} settings={settings}>
      <div id="top" className="flex min-h-dvh flex-col bg-white text-slate-900">
        {/* Lien d'évitement : premier élément focusable */}
        <a
          href="#main"
          className="sr-only z-50 rounded-xl bg-vif px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Aller au contenu
        </a>
        <AnnouncementBar />
        <TopBar />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Newsletter />
      <SiteFooter />
      <SupportDock />
      </div>
    </SiteContentProvider>
  );
}
