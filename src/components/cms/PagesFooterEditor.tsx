"use client";

import { ExternalLink, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { footerNav, siteConfig } from "@/content/site";
import { HEADER_PAGES, type FooterLink, type FooterSetting } from "@/lib/cms-types";
import { input, label, MediaPicker } from "./shared";
import { SaveBar, saveKeys, useSettings } from "./SiteSettingsExtra";

/** En-tête (bandeau photo) de chaque page : sur-titre, titre, introduction et photo. */
export function PageHeadersEditor() {
  const [s, setS] = useSettings();
  const [page, setPage] = useState<string>(HEADER_PAGES[0].key);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!s) return null;
  const all = s.page_headers ?? {};
  const h = all[page] ?? {};
  const set = (p: Partial<typeof h>) => setS({ ...s, page_headers: { ...all, [page]: { ...h, ...p } } });
  const info = HEADER_PAGES.find((x) => x.key === page)!;

  const save = async () => {
    setBusy(true);
    const error = await saveKeys({ page_headers: all });
    setBusy(false);
    setMsg(error ? error.message : "En-têtes publiés : ils s'affichent immédiatement sur le site.");
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        Chaque page commence par un bandeau photo. Modifiez son sur-titre, son titre, son texte et sa photo ; un champ vide garde le texte d&apos;origine. Dans le titre, mettez
        entre [crochets] le mot à mettre en valeur (ex. « L&apos;hospitalité [Avenida] »). Pour ajouter du contenu sous l&apos;en-tête, utilisez « Pages et sections ».
      </p>
      <div className="flex flex-wrap gap-2">
        {HEADER_PAGES.map((p) => (
          <button key={p.key} type="button" onClick={() => setPage(p.key)} className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${page === p.key ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200"}`}>
            {p.label}
            {all[p.key] && Object.values(all[p.key]).some(Boolean) ? " •" : ""}
          </button>
        ))}
      </div>
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <label className={label}>
            Sur-titre
            <input value={h.eyebrow ?? ""} onChange={(e) => set({ eyebrow: e.target.value })} placeholder="ex. L'Hôtel" className={input} />
          </label>
          <label className={label}>
            Titre principal
            <input value={h.title ?? ""} onChange={(e) => set({ title: e.target.value })} placeholder="ex. L'hospitalité [Avenida]" className={input} />
          </label>
          <label className={label}>
            Texte d&apos;introduction
            <textarea rows={4} value={h.description ?? ""} onChange={(e) => set({ description: e.target.value })} className={input} />
          </label>
          <div className="flex flex-wrap gap-3">
            <a href={info.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0C356A] hover:text-[#E30613]">
              <ExternalLink aria-hidden className="size-4" /> Voir la page
            </a>
            <button type="button" onClick={() => setS({ ...s, page_headers: { ...all, [page]: {} } })} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#E30613]">
              <RotateCcw aria-hidden className="size-4" /> Rétablir l&apos;en-tête d&apos;origine
            </button>
          </div>
        </div>
        <div className={label}>
          Photo du bandeau (paysage)
          <MediaPicker value={h.image ? [{ url: h.image }] : []} onChange={(m) => set({ image: m[0]?.url ?? "" })} folder="entetes" hint="Sans photo choisie, la photo d'origine est conservée." />
        </div>
      </section>
      <SaveBar busy={busy} msg={msg} onSave={save} />
    </div>
  );
}

function LinksEditor({ title, links, defaults, onChange }: { title: string; links: FooterLink[]; defaults: FooterLink[]; onChange: (t: string, l: FooterLink[]) => void }) {
  const list = links.length ? links : defaults;
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
      <label className={label}>
        Titre de la colonne
        <input value={title} onChange={(e) => onChange(e.target.value, list)} className={input} />
      </label>
      {list.map((l, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <input value={l.label} onChange={(e) => onChange(title, list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label="Libellé" className={input} />
          <input value={l.href} onChange={(e) => onChange(title, list.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))} aria-label="Lien" className={input} />
          <button type="button" onClick={() => onChange(title, list.filter((_, j) => j !== i))} aria-label="Retirer" className="rounded-lg p-2 text-red-600 hover:bg-red-50">
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange(title, [...list, { label: "Nouveau lien", href: "/" }])} className="inline-flex items-center gap-1.5 self-start text-sm font-bold text-[#0C356A] hover:text-[#E30613]">
        <Plus aria-hidden className="size-4" /> Ajouter un lien
      </button>
    </div>
  );
}

/** Pied de page : présentation, citation et colonnes de liens. */
export function FooterEditor() {
  const [s, setS] = useSettings();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!s) return null;
  const f: FooterSetting = s.footer ?? {};
  const set = (p: Partial<FooterSetting>) => setS({ ...s, footer: { ...f, ...p } });

  const save = async () => {
    setBusy(true);
    const error = await saveKeys({ footer: f });
    setBusy(false);
    setMsg(error ? error.message : "Pied de page publié.");
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">Coordonnées, réseaux sociaux et carte se modifient dans « Coordonnées et réseaux ». Ici : la présentation, la citation et les deux colonnes de liens.</p>
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:grid-cols-2">
        <label className={label}>
          Texte de présentation
          <textarea rows={4} value={f.about ?? ""} placeholder="Centre de formation aux métiers de l'hôtellerie…" onChange={(e) => set({ about: e.target.value })} className={input} />
        </label>
        <label className={label}>
          Citation
          <input value={f.tagline ?? ""} placeholder={siteConfig.tagline} onChange={(e) => set({ tagline: e.target.value })} className={input} />
        </label>
        <LinksEditor title={f.col1?.title ?? "L'École"} links={f.col1?.links ?? []} defaults={footerNav.school} onChange={(title, links) => set({ col1: { title, links } })} />
        <LinksEditor title={f.col2?.title ?? "L'Hôtel"} links={f.col2?.links ?? []} defaults={footerNav.hotel} onChange={(title, links) => set({ col2: { title, links } })} />
      </section>
      <SaveBar busy={busy} msg={msg} onSave={save} />
    </div>
  );
}
