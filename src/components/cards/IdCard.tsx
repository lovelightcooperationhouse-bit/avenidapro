"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { siteConfig } from "@/content/site";
import type { CardSettings } from "@/lib/cms-types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type CardVariant = "eleve" | "professeur" | "hotel" | "personnel" | "client";

/** Modèles de cartes : une couleur et un intitulé par catégorie (élèves, professeurs, hôtel, école, clients). */
export const CARD_THEMES: Record<CardVariant, { label: string; dark: string; accent: string; badgeText: string; stripe: [string, string, string]; holder: string }> = {
  eleve: { label: "Carte scolaire", dark: "#0C356A", accent: "#E30613", badgeText: "#FFFFFF", stripe: ["#0C356A", "#FFFFFF", "#E30613"], holder: "de l'élève" },
  professeur: { label: "Carte professeur", dark: "#064E3B", accent: "#D4A017", badgeText: "#064E3B", stripe: ["#064E3B", "#FFFFFF", "#D4A017"], holder: "du professeur" },
  hotel: { label: "Personnel de l'hôtel", dark: "#5B1A2A", accent: "#D4A017", badgeText: "#5B1A2A", stripe: ["#5B1A2A", "#FFFFFF", "#D4A017"], holder: "du membre du personnel" },
  personnel: { label: "Carte de travail", dark: "#1E293B", accent: "#E30613", badgeText: "#FFFFFF", stripe: ["#1E293B", "#FFFFFF", "#E30613"], holder: "du membre du personnel" },
  client: { label: "Carte de fidélité", dark: "#1C1917", accent: "#D4A017", badgeText: "#1C1917", stripe: ["#1C1917", "#D4A017", "#1C1917"], holder: "du client" },
};

export type CardData = {
  type: "eleve" | "personnel" | "client";
  /** Modèle de carte : couleurs et intitulé selon la catégorie de la personne. */
  variant?: CardVariant;
  /** Numéro de la carte (CE26-0001, CT26-0001, CF26-0001). */
  cardNumber?: string | null;
  token: string;
  version: number;
  issuedAt: string;
  validUntil?: string | null;
  name: string;
  photo?: string | null;
  matricule: string;
  /** Classe (élève) ou poste (personnel). */
  line1: string;
  /** Année scolaire (élève) ou département (personnel). */
  line2: string;
  /** Informations détaillées du recto (naissance, sexe, adresse, tuteur…). */
  details?: { label: string; value: string }[];
  /** Contact à prévenir (verso). */
  emergency?: string | null;
  statusLabel?: string;
};

const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Texte par défaut du verso, selon la catégorie. */
export const defaultCardRules = (variant: CardVariant) =>
  `Carte personnelle à présenter sur demande. Scannez le QR code au recto pour vérifier en temps réel la situation ${CARD_THEMES[variant].holder}.` +
  (variant === "client" ? " Présentez-la à la réception pour vos avantages fidélité." : " En cas de perte, prévenez l'administration.");

let settingsCache: Promise<CardSettings> | null = null;
/** Réglages des cartes (« Site web › Cartes »), lus une seule fois par page. */
export function useCardSettings() {
  const [s, setS] = useState<CardSettings>({});
  useEffect(() => {
    settingsCache ??= Promise.resolve(
      createClient()
        .from("site_settings")
        .select("value")
        .eq("key", "cards")
        .maybeSingle()
        .then(({ data }) => (data?.value ?? {}) as CardSettings),
    );
    settingsCache.then(setS);
  }, []);
  return s;
}

/** Lien de vérification encodé dans le QR code. */
export const verifyUrl = (token: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/verifier/${token}`;

/**
 * Carte au format 9 × 5,5 cm. Recto : photo, identité complète, matricule, QR code de vérification.
 * Verso : établissement, contact d'urgence, validité, règles d'usage et signature.
 */
export function IdCard({ data, side = "both", className, settings }: { data: CardData; side?: "front" | "back" | "both"; className?: string; settings?: CardSettings }) {
  const [qr, setQr] = useState<string | null>(null);
  const loaded = useCardSettings();
  const cs = settings ?? loaded;

  useEffect(() => {
    QRCode.toDataURL(verifyUrl(data.token), { margin: 1, width: 300, errorCorrectionLevel: "M", color: { dark: "#06152E", light: "#FFFFFF" } }).then(setQr);
  }, [data.token]);

  const variant: CardVariant = data.variant ?? (data.type === "client" ? "client" : data.type === "eleve" ? "eleve" : "personnel");
  const theme = CARD_THEMES[variant];
  const isClient = data.type === "client";
  const photoOk = data.photo && !data.photo.includes("default.png");
  const accentText = theme.accent === "#D4A017" ? theme.dark : theme.accent;
  const validity = data.validUntil ? new Date(data.validUntil).toLocaleDateString("fr-FR") : "Durée du contrat";

  const stripe = (cls: string) => (
    <span aria-hidden className={cn("flex", cls)}>
      {theme.stripe.map((c, i) => (
        <span key={i} className="flex-1" style={{ background: c }} />
      ))}
    </span>
  );

  const front = (
    <div className="id-card relative flex aspect-[90/55] w-full max-w-[26rem] flex-col overflow-hidden rounded-2xl bg-white text-[#06152E] shadow-xl ring-1 ring-slate-900/10 print:shadow-none">
      {/* Bandeau */}
      <div className="relative flex items-center gap-2 px-3 py-1.5 text-white" style={{ background: theme.dark }}>
        <div aria-hidden className="bg-avenida-pattern absolute inset-0 opacity-15" />
        {/* eslint-disable-next-line @next/next/no-img-element -- rendu imprimable, image locale */}
        <img src="/logoavenida.jpg" alt="" className="relative size-7 rounded bg-white object-contain" />
        <div className="relative leading-none">
          <p className="font-serif text-[8px] font-bold tracking-wider">HÔTEL ÉCOLE</p>
          <p className="font-serif text-[13px] font-extrabold tracking-wider text-[#FF5A63]">AVENIDA</p>
        </div>
        <p className="relative ml-auto rounded-full px-2.5 py-0.5 text-[8px] font-extrabold tracking-widest uppercase" style={{ background: theme.accent, color: theme.badgeText }}>
          {theme.label}
        </p>
      </div>
      {stripe("h-[3px]")}

      <div className="flex min-h-0 flex-1 gap-2.5 px-2.5 pt-2 pb-1.5">
        {/* Photo + situation */}
        <div className="flex w-[24%] shrink-0 flex-col gap-1">
          <div className="aspect-[3/4] overflow-hidden rounded-md bg-slate-100 ring-2" style={{ ["--tw-ring-color" as string]: `${theme.dark}55` }}>
            {photoOk ? (
              // eslint-disable-next-line @next/next/no-img-element -- photo stockée en data URL
              <img src={data.photo!} alt={`Photo de ${data.name}`} className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center font-display text-xl font-extrabold text-slate-300">{initials(data.name)}</span>
            )}
          </div>
        </div>

        {/* Identité */}
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate font-display text-[13px] leading-tight font-extrabold uppercase">{data.name}</p>
          <p className="truncate text-[9px] font-bold" style={{ color: accentText }}>
            {data.line1}
          </p>
          <p className="truncate text-[8px] font-semibold text-slate-500">{data.line2}</p>
          {data.details && data.details.length > 0 && (
            <dl className="mt-1 grid grid-cols-2 gap-x-2 gap-y-[2px]">
              {data.details.slice(0, 4).map((d) => (
                <div key={d.label} className="min-w-0">
                  <dt className="text-[5.5px] font-bold tracking-wider text-slate-400 uppercase">{d.label}</dt>
                  <dd className="truncate text-[7.5px] leading-tight font-bold text-slate-800">{d.value || "—"}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-auto flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[6px] font-bold tracking-widest text-slate-400 uppercase">{isClient ? "N° de fidélité" : "Matricule"}</p>
              <p className="font-mono text-[12px] leading-none font-extrabold tracking-wider" style={{ color: theme.dark }}>
                {data.matricule}
              </p>
              <p className="mt-0.5 text-[6.5px] font-semibold text-slate-500">
                {data.cardNumber && !isClient ? `Carte ${data.cardNumber} · ` : ""}valable jusqu&apos;au {validity}
              </p>
            </div>
            <div className="aspect-square w-[27%] min-w-14 shrink-0 rounded-md bg-white p-0.5 ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- QR code généré en data URL */}
              {qr ? <img src={qr} alt="QR code de vérification" className="size-full" /> : <span className="block size-full animate-pulse bg-slate-100" />}
            </div>
          </div>
        </div>
      </div>
      {stripe("h-1")}
    </div>
  );

  const back = (
    <div className="id-card relative flex aspect-[90/55] w-full max-w-[26rem] flex-col overflow-hidden rounded-2xl text-white shadow-xl print:shadow-none" style={{ background: theme.dark }}>
      <div aria-hidden className="bg-avenida-pattern absolute inset-0 opacity-10" />
      {/* Filigrane du logo */}
      {/* eslint-disable-next-line @next/next/no-img-element -- filigrane */}
      <img src="/logoavenida.jpg" alt="" aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-24 -translate-y-1/2 rounded-2xl opacity-[0.08] grayscale" />

      <div className="relative flex items-center gap-2 border-b border-white/15 px-3.5 py-2">
        <p className="font-serif text-[11px] font-extrabold tracking-[0.15em]">
          HÔTEL ÉCOLE <span className="text-[#FF5A63]">AVENIDA</span>
        </p>
        <p className="ml-auto text-[7px] font-bold tracking-widest text-white/75 uppercase">{cs.motto || siteConfig.motto}</p>
      </div>

      <div className="relative grid flex-1 grid-cols-2 gap-3 px-3.5 py-2 text-[8px] leading-snug">
        <div className="flex flex-col gap-1.5">
          {data.emergency && (
            <div>
              <p className="text-[6.5px] font-bold tracking-widest text-white/60 uppercase">En cas d&apos;urgence</p>
              <p className="font-bold text-white">{data.emergency}</p>
            </div>
          )}
          <div>
            <p className="text-[6.5px] font-bold tracking-widest text-white/60 uppercase">Validité</p>
            <p className="font-bold text-white">Jusqu&apos;au {validity}</p>
          </div>
          {data.cardNumber && (
            <div>
              <p className="text-[6.5px] font-bold tracking-widest text-white/60 uppercase">N° de carte</p>
              <p className="font-mono font-bold text-white">{data.cardNumber}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div>
            <p className="text-[6.5px] font-bold tracking-widest text-white/60 uppercase">Établissement</p>
            {cs.address ? (
              <p className="whitespace-pre-line text-white">{cs.address}</p>
            ) : (
              <>
                <p className="text-white">{siteConfig.address.street}</p>
                <p className="text-white">
                  {siteConfig.address.district}, {siteConfig.address.city}
                </p>
              </>
            )}
          </div>
          <div>
            <p className="text-[6.5px] font-bold tracking-widest text-white/60 uppercase">Contact</p>
            <p className="text-white">{cs.phone || siteConfig.phones[0].display}</p>
            <p className="truncate text-white">{cs.email || siteConfig.email}</p>
          </div>
        </div>
      </div>

      <div className="relative flex items-end gap-3 px-3.5 pb-2.5">
        <p className="flex-1 rounded-lg bg-white/12 p-1.5 text-[6.8px] leading-snug text-white/90" style={{ background: "rgb(255 255 255 / 0.1)" }}>
          {cs.rules?.[variant] || defaultCardRules(variant)}
        </p>
        <div className="w-[26%] text-center">
          <div className="h-5 border-b border-white/50" />
          <p className="mt-0.5 text-[6.5px] font-bold text-white/80">{cs.signatureTitle || "La Direction"}</p>
        </div>
      </div>
      {stripe("h-1")}
    </div>
  );

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row", className)}>
      {side !== "back" && front}
      {side !== "front" && back}
    </div>
  );
}
