"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { CARD_THEMES, defaultCardRules, IdCard, type CardData, type CardVariant } from "@/components/cards/IdCard";
import { IMAGE_SLOTS, images, siteConfig } from "@/content/site";
import type { CardSettings } from "@/lib/cms-types";
import { cn } from "@/lib/utils";
import { input, label, MediaPicker } from "./shared";
import { SaveBar, saveKeys, useSettings } from "./SiteSettingsExtra";

/** Toutes les images fixes du site (façades, chambres, restaurant, élèves…) : remplacer, légender ou rétablir. */
export function ImagesEditor() {
  const [s, setS] = useSettings();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!s) return null;
  const over = s.images ?? {};
  const set = (key: string, v: { src: string; alt?: string } | null) => {
    const next = { ...over };
    if (v) next[key] = v;
    else delete next[key];
    setS({ ...s, images: next });
  };

  const save = async () => {
    setBusy(true);
    const error = await saveKeys({ images: over });
    setBusy(false);
    setMsg(error ? error.message : "Images publiées sur le site.");
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        Chaque image est utilisée aux endroits indiqués. Choisissez une nouvelle photo pour la remplacer partout ; « Rétablir » remet la photo d&apos;origine. Les images des
        sections et publications se modifient dans leurs onglets.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {IMAGE_SLOTS.map((slot) => {
          const o = over[slot.key];
          const current = o?.src ? o : images[slot.key];
          return (
            <li key={slot.key} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu */}
              <img src={current.src} alt="" className="aspect-[16/10] w-full rounded-xl object-cover ring-1 ring-slate-200" />
              <div>
                <p className="font-bold text-[#0C356A]">{slot.label}</p>
                <p className="text-xs text-slate-500">{slot.where}</p>
              </div>
              <MediaPicker value={[]} onChange={(m) => m[0] && set(slot.key, { src: m[0].url, alt: o?.alt })} folder="images" hint="JPG, PNG ou WebP, de préférence en largeur (paysage)." />
              <label className={label}>
                Description (pour l&apos;accessibilité et Google)
                <input value={o?.alt ?? ""} placeholder={images[slot.key].alt} onChange={(e) => set(slot.key, { src: current.src, alt: e.target.value })} className={input} />
              </label>
              {o && (
                <button type="button" onClick={() => set(slot.key, null)} className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-slate-500 hover:text-[#E30613]">
                  <RotateCcw aria-hidden className="size-3.5" /> Rétablir la photo d&apos;origine
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <SaveBar busy={busy} msg={msg} onSave={save} />
    </div>
  );
}

const SAMPLE: CardData = {
  type: "eleve",
  token: "apercu",
  version: 1,
  issuedAt: new Date().toISOString(),
  validUntil: `${new Date().getFullYear() + 1}-07-31`,
  name: "KOFFI Ama Délali",
  matricule: "BTS26-0001",
  cardNumber: "CE26-0001",
  line1: "BTS 1 · Hôtellerie",
  line2: "Année scolaire 2026-2027",
  details: [
    { label: "Né(e) le", value: "12/03/2008 à Lomé" },
    { label: "Sexe", value: "Féminin" },
    { label: "Adresse", value: "Bè Kpota, Lomé" },
    { label: "Tuteur", value: "Kossi Koffi · +228 90 00 00 00" },
  ],
  guardian: "Kossi Koffi · +228 90 00 00 00",
  emergency: "Afi Mensah · +228 91 00 00 00",
};

/** Textes communs des cartes (verso, signature, contact) avec aperçu en direct, par catégorie. */
export function CardsEditor() {
  const [s, setS] = useSettings();
  const [variant, setVariant] = useState<CardVariant>("eleve");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!s) return null;
  const c: CardSettings = s.cards ?? {};
  const set = (p: Partial<CardSettings>) => setS({ ...s, cards: { ...c, ...p } });

  const save = async () => {
    setBusy(true);
    const error = await saveKeys({ cards: c });
    setBusy(false);
    setMsg(error ? error.message : "Réglages des cartes enregistrés : ils s'appliquent à toutes les cartes affichées et imprimées.");
  };

  const sample: CardData = { ...SAMPLE, variant, type: variant === "client" ? "client" : variant === "eleve" ? "eleve" : "personnel" };
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-600">
        Ces éléments composent toutes les cartes. Les informations propres à chaque personne (nom, photo, naissance, adresse, tuteur…) se modifient dans
        « Cartes scolaires » avec le bouton « Modifier », avant l&apos;émission ou l&apos;impression.
      </p>
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
          <label className={label}>
            Devise (verso)
            <input value={c.motto ?? ""} placeholder={siteConfig.motto} onChange={(e) => set({ motto: e.target.value })} className={input} />
          </label>
          <label className={label}>
            Titre du signataire (verso)
            <input value={c.signatureTitle ?? ""} placeholder="Directeur pédagogique (élèves) · La Direction (autres)" onChange={(e) => set({ signatureTitle: e.target.value })} className={input} />
          </label>
          <label className={label}>
            Nom du signataire (vide = aucun nom)
            <input value={c.signatoryName ?? ""} placeholder="Kodjo Messan DOGLO (cartes scolaires)" onChange={(e) => set({ signatoryName: e.target.value })} className={input} />
          </label>
          <div className={label}>
            Signature scannée (image sur fond blanc ou transparent)
            <MediaPicker value={c.signatureImage ? [{ url: c.signatureImage }] : []} onChange={(m) => set({ signatureImage: m[0]?.url ?? "" })} folder="cartes" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>
              Téléphone affiché
              <input value={c.phone ?? ""} placeholder={siteConfig.phones[0].display} onChange={(e) => set({ phone: e.target.value })} className={input} />
            </label>
            <label className={label}>
              E-mail affiché
              <input value={c.email ?? ""} placeholder={siteConfig.email} onChange={(e) => set({ email: e.target.value })} className={input} />
            </label>
          </div>
          <label className={label}>
            Adresse de l&apos;établissement
            <textarea rows={2} value={c.address ?? ""} placeholder={`${siteConfig.address.street}\n${siteConfig.address.district}, ${siteConfig.address.city}`} onChange={(e) => set({ address: e.target.value })} className={input} />
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            {(Object.keys(CARD_THEMES) as CardVariant[]).map((v) => (
              <button key={v} type="button" onClick={() => setVariant(v)} className={cn("rounded-full px-3 py-1.5 text-xs font-bold ring-1", variant === v ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200")}>
                {CARD_THEMES[v].label}
              </button>
            ))}
          </div>
          <label className={label}>
            Texte du verso · {CARD_THEMES[variant].label}
            <textarea rows={3} value={c.rules?.[variant] ?? ""} placeholder={defaultCardRules(variant)} onChange={(e) => set({ rules: { ...c.rules, [variant]: e.target.value } })} className={input} />
          </label>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-slate-500 uppercase">Aperçu</p>
          <IdCard data={sample} settings={c} className="sm:flex-col" />
        </div>
      </div>
      <SaveBar busy={busy} msg={msg} onSave={save} />
    </div>
  );
}
