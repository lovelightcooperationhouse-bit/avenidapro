"use client";

import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { heroSlides } from "@/content/site";
import type { CmsSettings, HeroSlideSetting } from "@/lib/cms-types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MediaPicker, Toggle, input, label, publishSite } from "./shared";


/** Diapositives d'origine (contenu par défaut du site) : point de départ de l'édition. */
const defaults: HeroSlideSetting[] = heroSlides.map((s) => ({ image: s.image.src, alt: s.image.alt, focus: s.focus, eyebrow: s.eyebrow, title: s.title[0], highlight: s.title[1], titleEnd: s.title[2], subtitle: s.subtitle }));

/** En-tête (diaporama d'accueil, bandeau d'annonce) et pied de page (réseaux sociaux). */
export function SettingsEditor() {
  const [s, setS] = useState<CmsSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    createClient()
      .from("site_settings")
      .select("key, value")
      .then(({ data }) => {
        const v = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as CmsSettings;
        setS({ ...v, hero: v.hero?.length ? v.hero : defaults });
      });
  }, []);

  if (!s) return <Loader2 aria-label="Chargement" className="size-6 animate-spin" />;
  const hero = s.hero ?? [];
  const setHero = (h: HeroSlideSetting[]) => setS({ ...s, hero: h });
  const patchSlide = (i: number, p: Partial<HeroSlideSetting>) => setHero(hero.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const moveSlide = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= hero.length) return;
    const h = [...hero];
    [h[i], h[j]] = [h[j], h[i]];
    setHero(h);
  };

  const save = async () => {
    setBusy(true);
    setMsg("");
    const supabase = createClient();
    const rows = (["hero", "bandeau", "footer"] as const).filter((k) => s[k] !== undefined).map((k) => ({ key: k, value: s[k], updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("site_settings").upsert(rows);
    await publishSite();
    setBusy(false);
    setMsg(error ? "Erreur : " + error.message : "Enregistré : le site est à jour.");
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="font-black text-[#0C356A]">Bandeau d&apos;annonce (tout en haut du site)</h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
          <input value={s.bandeau?.text ?? ""} onChange={(e) => setS({ ...s, bandeau: { visible: s.bandeau?.visible ?? false, href: s.bandeau?.href, text: e.target.value } })} placeholder="Ex. Inscriptions ouvertes pour la rentrée d'octobre !" aria-label="Texte du bandeau" className={input} />
          <input value={s.bandeau?.href ?? ""} onChange={(e) => setS({ ...s, bandeau: { visible: s.bandeau?.visible ?? false, text: s.bandeau?.text ?? "", href: e.target.value } })} placeholder="Lien (ex. /preinscription)" aria-label="Lien du bandeau" className={input} />
        </div>
        <Toggle checked={!!s.bandeau?.visible} onChange={(v) => setS({ ...s, bandeau: { text: s.bandeau?.text ?? "", href: s.bandeau?.href, visible: v } })}>
          Afficher le bandeau
        </Toggle>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="font-black text-[#0C356A]">Diaporama de l&apos;accueil (en-tête)</h3>
        {hero.map((h, i) => (
          <div key={i} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[8rem_1fr]">
            <MediaPicker folder="hero" value={h.image ? [{ url: h.image }] : []} onChange={(m) => patchSlide(i, { image: m[0]?.url ?? "" })} hint="Paysage, 2400 px de large" />
            <div className="grid gap-2 sm:grid-cols-3">
              <input value={h.eyebrow} onChange={(e) => patchSlide(i, { eyebrow: e.target.value })} placeholder="Sur-titre" aria-label="Sur-titre" className={cn(input, "sm:col-span-3")} />
              <input value={h.title} onChange={(e) => patchSlide(i, { title: e.target.value })} placeholder="Titre" aria-label="Titre" className={input} />
              <input value={h.highlight ?? ""} onChange={(e) => patchSlide(i, { highlight: e.target.value })} placeholder="Mots en rouge" aria-label="Mots mis en valeur" className={cn(input, "text-[#E30613]")} />
              <input value={h.titleEnd ?? ""} onChange={(e) => patchSlide(i, { titleEnd: e.target.value })} placeholder="Fin du titre" aria-label="Fin du titre" className={input} />
              <textarea value={h.subtitle} onChange={(e) => patchSlide(i, { subtitle: e.target.value })} rows={2} placeholder="Sous-titre" aria-label="Sous-titre" className={cn(input, "sm:col-span-3")} />
              <div className="flex items-center gap-1 sm:col-span-3">
                <input value={h.focus ?? ""} onChange={(e) => patchSlide(i, { focus: e.target.value })} placeholder="Cadrage (ex. 50% 30%)" aria-label="Cadrage" className={cn(input, "w-44")} />
                <button type="button" onClick={() => moveSlide(i, -1)} aria-label="Monter" className="ml-auto rounded-full p-1.5 hover:bg-white">
                  <ArrowUp aria-hidden className="size-4" />
                </button>
                <button type="button" onClick={() => moveSlide(i, 1)} aria-label="Descendre" className="rounded-full p-1.5 hover:bg-white">
                  <ArrowDown aria-hidden className="size-4" />
                </button>
                <button type="button" onClick={() => setHero(hero.filter((_, j) => j !== i))} aria-label="Supprimer la diapositive" className="rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-[#DC2626]">
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setHero([...hero, { image: "", eyebrow: "", title: "", subtitle: "" }])} className="inline-flex items-center gap-1.5 self-start text-sm font-bold text-[#0C356A]">
          <Plus aria-hidden className="size-4" /> Ajouter une diapositive
        </button>
      </section>


      <div className="sticky bottom-4 flex items-center gap-3 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200">
        <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />} Enregistrer et publier
        </button>
        {msg && <p className="text-sm font-semibold text-emerald-700">{msg}</p>}
      </div>
    </div>
  );
}
