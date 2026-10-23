"use client";

import { BarChart3, ExternalLink, Globe, IdCard, Images, LayoutTemplate, PanelBottom, PanelsTopLeft, Loader2, Mail, Menu, Newspaper, Palette, PanelTop, Phone, Rows3 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CardsEditor, ImagesEditor } from "@/components/cms/ImagesCardsEditor";
import { FooterEditor, PageHeadersEditor } from "@/components/cms/PagesFooterEditor";
import { MenuEditor } from "@/components/cms/MenuEditor";
import { PostsEditor } from "@/components/cms/PostsEditor";
import { SectionsEditor } from "@/components/cms/SectionsEditor";
import { SettingsEditor } from "@/components/cms/SettingsEditor";
import { ContactEditor, HomeSectionsEditor, SubscribersList, ThemeEditor } from "@/components/cms/SiteSettingsExtra";
import { SiteStats } from "@/components/cms/SiteStats";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const SITE_TABS = [
  { key: "statistiques", label: "Vue d'ensemble", icon: BarChart3, hint: "Visites, pages consultées, par jour" },
  { key: "publications", label: "Publications", icon: Newspaper, hint: "Articles, annonces, photos, vidéos" },
  { key: "menus", label: "Menus", icon: Menu, hint: "Menus et sous-menus" },
  { key: "pages", label: "Pages et sections", icon: LayoutTemplate, hint: "Nouvelles pages, sections, images" },
  { key: "accueil", label: "Sections de l'accueil", icon: Rows3, hint: "Afficher ou masquer" },
  { key: "entetes", label: "En-têtes des pages", icon: PanelsTopLeft, hint: "Titre, texte et photo du bandeau de chaque page" },
  { key: "pied", label: "Pied de page", icon: PanelBottom, hint: "Présentation, citation, colonnes de liens" },
  { key: "images", label: "Images du site", icon: Images, hint: "Façades, chambres, restaurant, élèves en action" },
  { key: "entete", label: "Diaporama et bandeau", icon: PanelTop, hint: "Héros, annonce du haut" },
  { key: "coordonnees", label: "Coordonnées et réseaux", icon: Phone, hint: "Pied de page, localisation, WhatsApp, TikTok" },
  { key: "couleurs", label: "Couleurs", icon: Palette, hint: "Apparence du site" },
  { key: "cartes", label: "Cartes", icon: IdCard, hint: "Textes du verso, signature et contact de toutes les cartes" },
  { key: "abonnes", label: "Lettre d'information", icon: Mail, hint: "Abonnés, export" },
] as const;

/** Gestion complète du site public : contenus, apparence et statistiques (DG et gestionnaire du site). */
function SiteAdmin() {
  const { user } = useAuth();
  const params = useSearchParams();
  const tab = SITE_TABS.find((t) => t.key === params.get("tab"))?.key ?? "statistiques";

  if (!user || !["directeur_general", "gestionnaire_site"].includes(user.role)) {
    return <p className="rounded-2xl bg-red-50 p-6 font-semibold text-[#B8000F]">Réservé au Directeur général et au gestionnaire du site.</p>;
  }
  const current = SITE_TABS.find((t) => t.key === tab)!;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#E30613] uppercase">
            <Globe aria-hidden className="size-4" /> Gestion globale du site
          </p>
          <h1 className="text-2xl font-black text-[#0C356A]">{current.label}</h1>
          <p className="mt-1 text-sm text-slate-600">{current.hint}. Modifiez puis « Enregistrer et publier » : le changement prend effet immédiatement sur le site.</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200 hover:text-[#E30613]">
          <ExternalLink aria-hidden className="size-4" /> Voir le site
        </a>
      </div>

      <nav aria-label="Rubriques du site" className="flex flex-wrap gap-2">
        {SITE_TABS.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/site?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn("inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold ring-1 transition-colors", tab === t.key ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200 hover:text-[#E30613] hover:ring-[#E30613]")}
          >
            <t.icon aria-hidden className="size-4" /> {t.label}
          </Link>
        ))}
      </nav>

      {tab === "statistiques" && <SiteStats />}
      {tab === "publications" && <PostsEditor />}
      {tab === "menus" && <MenuEditor />}
      {tab === "pages" && <SectionsEditor />}
      {tab === "accueil" && <HomeSectionsEditor />}
      {tab === "entete" && <SettingsEditor />}
      {tab === "coordonnees" && <ContactEditor />}
      {tab === "couleurs" && <ThemeEditor />}
      {tab === "abonnes" && <SubscribersList />}
      {tab === "images" && <ImagesEditor />}
      {tab === "entetes" && <PageHeadersEditor />}
      {tab === "pied" && <FooterEditor />}
      {tab === "cartes" && <CardsEditor />}
    </div>
  );
}

export default function SiteAdminPage() {
  return (
    <Suspense fallback={<Loader2 aria-label="Chargement" className="size-6 animate-spin" />}>
      <SiteAdmin />
    </Suspense>
  );
}
