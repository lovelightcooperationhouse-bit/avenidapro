"use client";

import { ExternalLink, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { faq as defaultFaq, hotelServices, rooms as defaultRooms } from "@/content/site";
import { SECTION_TEXTS } from "@/content/section-texts";
import { BUILTIN_PAGES } from "@/lib/cms-types";
import { cn } from "@/lib/utils";
import { input, label } from "./shared";
import { SaveBar, saveKeys, useSettings } from "./SiteSettingsExtra";

type Tab = "sections" | "chambres" | "services" | "faq";

/**
 * Textes des pages : titres et introductions de chaque section, chambres et services de l'hôtel,
 * questions fréquentes. Un champ vide garde le texte d'origine ; « Enregistrer et publier » met le site à jour.
 */
export function PageTextsEditor() {
  const [s, setS] = useSettings();
  const [tab, setTab] = useState<Tab>("sections");
  const [page, setPage] = useState("accueil");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Une section peut apparaître sur plusieurs pages (même identifiant) : elle se modifie une seule fois
  const sections = useMemo(() => {
    const seen = new Map<string, { id: string; eyebrow: string; title: string; description: string; pages: string[] }>();
    SECTION_TEXTS.forEach((x) => {
      const e = seen.get(x.id) ?? { id: x.id, eyebrow: x.eyebrow, title: x.title, description: x.description, pages: [] };
      e.pages.push(x.pageLabel);
      seen.set(x.id, e);
    });
    return SECTION_TEXTS.filter((x) => x.page === page).map((x) => seen.get(x.id)!).filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i);
  }, [page]);

  if (!s) return null;
  const texts = s.section_texts ?? {};
  const setText = (id: string, p: Record<string, string>) => setS({ ...s, section_texts: { ...texts, [id]: { ...texts[id], ...p } } });
  const pages = BUILTIN_PAGES.filter((p) => SECTION_TEXTS.some((x) => x.page === p.key));
  const roomList = s.rooms?.length ? s.rooms : defaultRooms.map((r) => ({ name: r.name, text: r.text }));
  const serviceList = s.hotel_services?.length ? s.hotel_services : hotelServices;
  const faqList = s.faq?.length ? s.faq : defaultFaq;

  const save = async () => {
    setBusy(true);
    const error = await saveKeys({ section_texts: texts, rooms: s.rooms ?? [], hotel_services: s.hotel_services ?? [], faq: s.faq ?? [] });
    setBusy(false);
    setMsg(error ? error.message : "Textes publiés : ils s'affichent immédiatement sur le site.");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["sections", "Titres et textes des sections"],
            ["chambres", "Chambres"],
            ["services", "Services de l'hôtel"],
            ["faq", "Questions fréquentes"],
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={cn("rounded-full px-4 py-2 text-sm font-bold ring-1", tab === k ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200")}>
            {l}
          </button>
        ))}
      </div>

      {tab === "sections" && (
        <>
          <p className="text-sm text-slate-600">
            Chaque section du site commence par un sur-titre, un titre et une introduction. Un champ vide garde le texte d&apos;origine (affiché en gris). Dans le titre, mettez
            entre [crochets] le mot à mettre en valeur.
          </p>
          <div className="flex flex-wrap gap-2">
            {pages.map((p) => (
              <button key={p.key} type="button" onClick={() => setPage(p.key)} className={cn("rounded-full px-3 py-1.5 text-xs font-bold ring-1", page === p.key ? "bg-[#E30613] text-white ring-[#E30613]" : "bg-white text-slate-600 ring-slate-200")}>
                {p.label}
              </button>
            ))}
            <a href={BUILTIN_PAGES.find((p) => p.key === page)?.href ?? "/"} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold text-[#0C356A] hover:text-[#E30613]">
              <ExternalLink aria-hidden className="size-4" /> Voir la page
            </a>
          </div>
          <ul className="flex flex-col gap-3">
            {sections.map((x) => {
              const t = texts[x.id] ?? {};
              return (
                <li key={x.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-3">
                  <label className={label}>
                    Sur-titre
                    <input value={t.eyebrow ?? ""} placeholder={x.eyebrow} onChange={(e) => setText(x.id, { eyebrow: e.target.value })} className={input} />
                  </label>
                  <label className={label}>
                    Titre
                    <input value={t.title ?? ""} placeholder={x.title || "Titre"} onChange={(e) => setText(x.id, { title: e.target.value })} className={input} />
                  </label>
                  <label className={label}>
                    Introduction
                    <textarea rows={2} value={t.description ?? ""} placeholder={x.description || "(aucune)"} onChange={(e) => setText(x.id, { description: e.target.value })} className={input} />
                  </label>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 lg:col-span-3">
                    {x.pages.length > 1 && <span>Section présente sur : {x.pages.join(", ")} (modifiée partout)</span>}
                    {(t.eyebrow || t.title || t.description) && (
                      <button type="button" onClick={() => setS({ ...s, section_texts: { ...texts, [x.id]: {} } })} className="inline-flex items-center gap-1 font-bold hover:text-[#E30613]">
                        <RotateCcw aria-hidden className="size-3.5" /> Rétablir le texte d&apos;origine
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === "chambres" && (
        <ListEditor
          intro="Les quatre catégories de chambres de la page L'Hôtel (les photos se changent dans « Images du site »)."
          items={roomList.map((r) => ({ a: r.name, b: r.text }))}
          labels={["Nom de la chambre", "Description"]}
          fixed
          onChange={(l) => setS({ ...s, rooms: l.map((x) => ({ name: x.a, text: x.b })) })}
          onReset={() => setS({ ...s, rooms: [] })}
        />
      )}
      {tab === "services" && (
        <ListEditor
          intro="Les trois services présentés sur la page L'Hôtel : accueil, restaurant, bar."
          items={serviceList.map((r) => ({ a: r.title, b: r.text }))}
          labels={["Titre", "Description"]}
          fixed
          onChange={(l) => setS({ ...s, hotel_services: l.map((x) => ({ title: x.a, text: x.b })) })}
          onReset={() => setS({ ...s, hotel_services: [] })}
        />
      )}
      {tab === "faq" && (
        <ListEditor
          intro="Les questions fréquentes de la page d'accueil : ajoutez, modifiez ou retirez des questions."
          items={faqList.map((r) => ({ a: r.q, b: r.a }))}
          labels={["Question", "Réponse"]}
          onChange={(l) => setS({ ...s, faq: l.map((x) => ({ q: x.a, a: x.b })) })}
          onReset={() => setS({ ...s, faq: [] })}
        />
      )}
      <SaveBar busy={busy} msg={msg} onSave={save} />
    </div>
  );
}

function ListEditor({ intro, items, labels, fixed, onChange, onReset }: { intro: string; items: { a: string; b: string }[]; labels: [string, string]; fixed?: boolean; onChange: (l: { a: string; b: string }[]) => void; onReset: () => void }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-slate-600">{intro}</p>
      {items.map((it, i) => (
        <div key={i} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_2fr_auto]">
          <label className={label}>
            {labels[0]}
            <input value={it.a} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} className={input} />
          </label>
          <label className={label}>
            {labels[1]}
            <textarea rows={2} value={it.b} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, b: e.target.value } : x)))} className={input} />
          </label>
          {!fixed && (
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Retirer" className="self-center rounded-lg p-2 text-red-600 hover:bg-red-50">
              <Trash2 aria-hidden className="size-4" />
            </button>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        {!fixed && (
          <button type="button" onClick={() => onChange([...items, { a: "Nouvelle question", b: "Réponse" }])} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0C356A] hover:text-[#E30613]">
            <Plus aria-hidden className="size-4" /> Ajouter
          </button>
        )}
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#E30613]">
          <RotateCcw aria-hidden className="size-4" /> Rétablir les textes d&apos;origine
        </button>
      </div>
    </section>
  );
}
