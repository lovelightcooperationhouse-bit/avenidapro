import type { Metadata } from "next";
import {
  AnnouncementBar,
  SiteContentProvider,
} from "@/components/site/SiteContent";
import { Newsletter } from "@/components/site/Newsletter";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SupportDock } from "@/components/site/SupportDock";
import { VisitTracker } from "@/components/site/VisitTracker";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TopBar } from "@/components/site/TopBar";
import { getMenu, getSettings } from "@/lib/cms";
import { structuredData } from "@/lib/seo";
import { mergeContact, themeCss } from "@/lib/site-contact";

export const metadata: Metadata = {
  title: {
    default: "Hôtel École Avenida — Hôtel Avenida et École Avenida à Lomé (Togo)",
    template: "%s · Hôtel École Avenida",
  },
  description:
    "Site officiel de l'Hôtel École Avenida, Lomé (Togo) : l'École Avenida forme aux métiers de l'hôtellerie, de la restauration et du tourisme (CFA, CAP, BEP, BT, BTS) ; l'Hôtel Avenida accueille vos séjours, réservation et paiement en ligne.",
};

/** Gabarit des pages publiques : top bar, header collant, contenu, footer (menu et réglages modifiables par le DG). */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  const contact = mergeContact(settings.contact);
  const theme = themeCss(settings.theme);
  return (
    <SiteContentProvider menu={menu} settings={settings}>
      {/* Couleurs personnalisées dans « Site web → Couleurs » */}
      {theme && <style dangerouslySetInnerHTML={{ __html: theme }} />}
      {/* Fiche de l'établissement pour les moteurs de recherche (schema.org) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(contact)).replace(/</g, "\\u003c") }} />
      <div id="top" className="flex min-h-dvh flex-col bg-white text-slate-900">
        {/* Lien d'évitement : premier élément focusable */}
        <a
          href="#main"
          className="sr-only z-50 rounded-xl bg-vif px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Aller au contenu
        </a>
        <AnnouncementBar />
        <TopBar contact={contact} />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Newsletter />
        <SiteFooter contact={contact} footer={settings.footer} />
        <SupportDock />
        <VisitTracker />
      </div>
    </SiteContentProvider>
  );
}
