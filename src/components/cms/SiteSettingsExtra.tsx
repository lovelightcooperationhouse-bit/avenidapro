"use client";

import { Download, Eye, EyeOff, Loader2, Palette, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { siteConfig } from "@/content/site";
import { HOME_SECTIONS, type CmsSettings, type ContactSetting, type ThemeSetting } from "@/lib/cms-types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { input, label, publishSite } from "./shared";

/** Lecture des réglages du site (clé → valeur). */
function useSettings() {
  const [s, setS] = useState<CmsSettings | null>(null);
  useEffect(() => {
    createClient()
      .from("site_settings")
      .select("key, value")
      .then(({ data }) => setS(Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as CmsSettings));
  }, []);
  return [s, setS] as const;
}

async function saveKeys(entries: Record<string, unknown>) {
  const rows = Object.entries(entries).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
  const { error } = await createClient().from("site_settings").upsert(rows);
  await publishSite();
  return error;
}

function SaveBar({ busy, msg, onSave, extra }: { busy: boolean; msg: string; onSave: () => void; extra?: React.ReactNode }) {
  return (
    <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200">
      <button type="button" onClick={onSave} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />} Enregistrer et publier
      </button>
      {extra}
      {msg && <p className="text-sm font-semibold text-emerald-700">{msg}</p>}
    </div>
  );
}

const SOCIALS = [
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["youtube", "YouTube"],
  ["linkedin", "LinkedIn"],
  ["whatsapp", "WhatsApp (lien wa.me/…)"],
] as const;

/** Coordonnées (barre du haut, pied de page, contact, WhatsApp) et réseaux sociaux. */
export function ContactEditor() {
  const [s, setS] = useSettings();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!s) return <Loader2 aria-label="Chargement" className="size-6 animate-spin" />;
  const c: ContactSetting = s.contact ?? {};
  const set = (p: Partial<ContactSetting>) => setS({ ...s, contact: { ...c, ...p } });
  const field = (k: keyof ContactSetting, l: string, ph: string) => (
    <label className={label}>
      {l}
      <input value={(c[k] as string) ?? ""} onChange={(e) => set({ [k]: e.target.value })} placeholder={ph} className={input} />
    </label>
  );

  const save = async () => {
    setBusy(true);
    const error = await saveKeys({ contact: s.contact ?? {}, socials: s.socials ?? {} });
    setBusy(false);
    setMsg(error ? "Erreur : " + error.message : "Coordonnées et réseaux publiés sur le site.");
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="font-black text-[#0C356A]">Coordonnées affichées sur le site</h3>
        <p className="text-sm text-slate-600">Laissez un champ vide pour garder la valeur actuelle (indiquée en gris).</p>
        <label className={label}>
          Téléphones (un par ligne)
          <textarea value={(c.phones ?? []).join("\n")} onChange={(e) => set({ phones: e.target.value.split("\n") })} rows={3} placeholder={siteConfig.phones.map((p) => p.display).join("\n")} className={input} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("email", "E-mail", siteConfig.email)}
          {field("whatsapp", "Numéro WhatsApp (bouton du site)", siteConfig.whatsapp)}
          {field("street", "Adresse (rue)", siteConfig.address.street)}
          {field("district", "Quartier / repère", siteConfig.address.district)}
          {field("postal", "Boîte postale", siteConfig.address.postal)}
          {field("city", "Ville", siteConfig.address.city)}
          {field("hours", "Horaires du bureau", siteConfig.officeHours)}
          {field("website", "Site web", siteConfig.website)}
        </div>
        {field("mapsUrl", "Lien Google Maps (localisation)", "https://maps.google.com/…")}
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="font-black text-[#0C356A]">Réseaux sociaux (barre du haut, pied de page, contact)</h3>
        <p className="text-sm text-slate-600">Une adresse vide masque l&apos;icône du réseau.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIALS.map(([k, l]) => (
            <label key={k} className={label}>
              {l}
              <input value={s.socials?.[k] ?? ""} onChange={(e) => setS({ ...s, socials: { ...s.socials, [k]: e.target.value } })} placeholder={siteConfig.socials[k] || "https://…"} className={input} />
            </label>
          ))}
        </div>
      </section>
      <SaveBar busy={busy} msg={msg} onSave={save} />
    </div>
  );
}

const DEFAULT_THEME: Required<ThemeSetting> = { blue: "#0C356A", vif: "#E30613", or: "#F2B705", nuit: "#06152E" };
const PRESETS: { name: string; theme: Required<ThemeSetting> }[] = [
  { name: "Avenida (d'origine)", theme: DEFAULT_THEME },
  { name: "Bleu royal", theme: { blue: "#1D3E8A", vif: "#D62839", or: "#F4B400", nuit: "#0B1A3A" } },
  { name: "Vert élégance", theme: { blue: "#0F5132", vif: "#C1121F", or: "#E9B949", nuit: "#08281A" } },
  { name: "Bordeaux", theme: { blue: "#5B1A2A", vif: "#B3122E", or: "#D4A017", nuit: "#2A0C14" } },
];

/** Couleurs du site public : bleu principal, rouge d'accent, or, fond sombre. */
export function ThemeEditor() {
  const [s, setS] = useSettings();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!s) return <Loader2 aria-label="Chargement" className="size-6 animate-spin" />;
  const t = { ...DEFAULT_THEME, ...(s.theme ?? {}) };
  const setT = (p: Partial<ThemeSetting>) => setS({ ...s, theme: { ...t, ...p } });

  const save = async () => {
    setBusy(true);
    const error = await saveKeys({ theme: s.theme ?? {} });
    setBusy(false);
    setMsg(error ? "Erreur : " + error.message : "Couleurs appliquées au site public.");
  };

  const colors: [keyof ThemeSetting, string, string][] = [
    ["blue", "Couleur principale", "Menus, titres, boutons secondaires"],
    ["vif", "Couleur d'accent", "Boutons d'action, liens actifs, mots mis en valeur"],
    ["or", "Couleur dorée", "Encadré de la rentrée, badges"],
    ["nuit", "Fond sombre", "Héros, bandeaux, pied de page"],
  ];

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="flex items-center gap-2 font-black text-[#0C356A]">
          <Palette aria-hidden className="size-5" /> Couleurs du site public
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {colors.map(([k, l, hint]) => (
            <label key={k} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <input type="color" value={t[k]} onChange={(e) => setT({ [k]: e.target.value })} className="size-12 cursor-pointer rounded-lg border-0 bg-transparent" aria-label={l} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-800">{l}</span>
                <span className="block text-xs text-slate-500">{hint}</span>
              </span>
              <input value={t[k]} onChange={(e) => setT({ [k]: e.target.value })} className={cn(input, "w-28 font-mono uppercase")} aria-label={`${l} (code)`} />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.name} type="button" onClick={() => setS({ ...s, theme: p.theme })} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:ring-[#E30613]">
              <span className="flex">
                {Object.values(p.theme).map((c) => (
                  <span key={c} className="size-3.5 rounded-full ring-1 ring-white" style={{ background: c }} />
                ))}
              </span>
              {p.name}
            </button>
          ))}
        </div>
        {/* Aperçu */}
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: t.nuit }}>
            <span className="font-serif font-extrabold tracking-wider">
              HÔTEL ÉCOLE <span style={{ color: t.vif }}>AVENIDA</span>
            </span>
            <span className="rounded-xl px-3 py-1 text-xs font-bold" style={{ background: t.or, color: t.nuit }}>
              Prochaine rentrée
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-white p-4">
            <span className="font-bold" style={{ color: t.blue }}>
              Menu · L&apos;École · Admissions
            </span>
            <span className="rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: t.vif }}>
              Pré-inscription
            </span>
            <span className="rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: t.blue }}>
              Bouton
            </span>
          </div>
        </div>
      </section>
      <SaveBar
        busy={busy}
        msg={msg}
        onSave={save}
        extra={
          <button type="button" onClick={() => setS({ ...s, theme: DEFAULT_THEME })} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-slate-600 hover:text-[#E30613]">
            <RotateCcw aria-hidden className="size-4" /> Couleurs d&apos;origine
          </button>
        }
      />
    </div>
  );
}

/** Sections intégrées de la page d'accueil : afficher ou masquer. */
export function HomeSectionsEditor() {
  const [s, setS] = useSettings();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!s) return <Loader2 aria-label="Chargement" className="size-6 animate-spin" />;
  const hidden = new Set(s.home_hidden ?? []);
  const toggle = (k: string) => {
    const h = new Set(hidden);
    if (h.has(k)) h.delete(k);
    else h.add(k);
    setS({ ...s, home_hidden: [...h] });
  };
  const save = async () => {
    setBusy(true);
    const error = await saveKeys({ home_hidden: s.home_hidden ?? [] });
    setBusy(false);
    setMsg(error ? "Erreur : " + error.message : "Page d'accueil mise à jour.");
  };
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        Masquez une section de l&apos;accueil sans la supprimer (elle peut être réaffichée à tout moment). Pour ajouter vos propres sections (texte, images, vidéo, galerie), utilisez
        « Pages et sections ».
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {HOME_SECTIONS.map((sec) => {
          const off = hidden.has(sec.key);
          return (
            <li key={sec.key}>
              <button type="button" onClick={() => toggle(sec.key)} aria-pressed={!off} className={cn("flex w-full items-center gap-3 rounded-2xl border p-4 text-left", off ? "border-slate-200 bg-slate-50 text-slate-400" : "border-[#0C356A]/30 bg-white text-slate-800")}>
                {off ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5 text-[#0C356A]" />}
                <span className="flex-1 font-bold">{sec.label}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", off ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-800")}>{off ? "Masquée" : "Affichée"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <SaveBar busy={busy} msg={msg} onSave={save} />
    </div>
  );
}

type Subscriber = { id: string; email: string; full_name: string | null; interests: string[]; created_at: string; unsubscribed_at: string | null };

/** Abonnés à la lettre d'information : liste et export. */
export function SubscribersList() {
  const [rows, setRows] = useState<Subscriber[] | null>(null);
  useEffect(() => {
    createClient()
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as Subscriber[]));
  }, []);
  if (!rows) return <Loader2 aria-label="Chargement" className="size-6 animate-spin" />;

  const exportCsv = () => {
    const csv = ["E-mail;Prénom;Sujets;Inscrit le", ...rows.map((r) => [r.email, r.full_name ?? "", r.interests.join(", "), new Date(r.created_at).toLocaleDateString("fr-FR")].join(";"))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "abonnes-lettre-avenida.csv";
    a.click();
  };

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-black text-[#0C356A]">{rows.length} abonné(s) à la lettre d&apos;information</h3>
        <button type="button" onClick={exportCsv} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-full bg-[#0C356A] px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
          <Download aria-hidden className="size-4" /> Exporter (Excel / CSV)
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun abonné pour le moment : le formulaire « Restez informé(e) » est en bas de chaque page du site.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">E-mail</th>
                <th className="px-3 py-2">Prénom</th>
                <th className="px-3 py-2">Sujets</th>
                <th className="px-3 py-2">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-semibold">{r.email}</td>
                  <td className="px-3 py-2">{r.full_name}</td>
                  <td className="px-3 py-2 text-slate-600">{r.interests.join(", ")}</td>
                  <td className="px-3 py-2">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
