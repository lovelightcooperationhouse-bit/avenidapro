"use client";

import { ExternalLink, Globe, LayoutTemplate, Menu, Newspaper, PanelTop } from "lucide-react";
import { useState } from "react";
import { MenuEditor } from "@/components/cms/MenuEditor";
import { PostsEditor } from "@/components/cms/PostsEditor";
import { SectionsEditor } from "@/components/cms/SectionsEditor";
import { SettingsEditor } from "@/components/cms/SettingsEditor";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "publications", label: "Publications", icon: Newspaper },
  { key: "menu", label: "Menus et sous-menus", icon: Menu },
  { key: "pages", label: "Pages et sections", icon: LayoutTemplate },
  { key: "entete", label: "En-tête et pied de page", icon: PanelTop },
] as const;

/** Gestion complète du site public par le Directeur général. */
export default function SiteAdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("publications");

  if (user?.role !== "directeur_general") return <p className="rounded-2xl bg-red-50 p-6 font-semibold text-[#DC2626]">Réservé au Directeur général.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
            <Globe aria-hidden className="size-6 text-[#E30613]" /> Site web : contenu
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Publiez articles, annonces, photos et vidéos ; modifiez menus, sous-menus, pages, sections, diaporama et réseaux sociaux. Chaque enregistrement est
            en ligne immédiatement.
          </p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200">
          <ExternalLink aria-hidden className="size-4" /> Voir le site
        </a>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-1", tab === t.key ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200")}
          >
            <t.icon aria-hidden className="size-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "publications" && <PostsEditor />}
      {tab === "menu" && <MenuEditor />}
      {tab === "pages" && <SectionsEditor />}
      {tab === "entete" && <SettingsEditor />}
    </div>
  );
}
