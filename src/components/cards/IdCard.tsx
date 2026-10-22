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
  // Couleurs du logo : bleu nuit et rouge Avenida
  eleve: { label: "Carte scolaire", dark: "#1B1652", accent: "#E31B3A", badgeText: "#FFFFFF", stripe: ["#1B1652", "#FFFFFF", "#E31B3A"], holder: "de l'élève" },
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

  const isStudent = data.type === "eleve";
  const lineLabel = isStudent ? "Filière & année" : isClient ? "Fidélité" : "Fonction";
  const signTitle = cs.signatureTitle || (variant === "eleve" ? "Directeur pédagogique" : "La Direction");
  const signName = cs.signatoryName ?? (variant === "eleve" ? "Kodjo Messan DOGLO" : "");
  const brandAccent = theme.accent === "#D4A017" ? "#F2C94C" : "#FF4D5E";
  const line2 = (data.line2 ?? "").replace(/^Année scolaire\s*/i, "").replace(/\s*-\s*/g, "-");
  // Le cadre porte le conteneur : toutes les tailles sont en % de la largeur de la carte (cqw),
  // lisibles à l'écran comme à l'impression (90 mm).
  const frame = (content: React.ReactNode) => (
    <div className="id-card w-full max-w-[30rem]" style={{ containerType: "inline-size" }}>
      {content}
    </div>
  );
  const shell = "relative flex aspect-[90/55] w-full flex-col overflow-hidden rounded-[3.5cqw] shadow-xl print:shadow-none";
  const label = "text-[2.2cqw] leading-none font-extrabold tracking-wide uppercase";

  const front = frame(
    <div className={cn(shell, "bg-white text-slate-900")} style={{ border: `1cqw solid ${theme.dark}` }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_55%,rgba(12,22,80,0.05)_70%,transparent_85%)]" />
      {/* En-tête : logo, établissement, catégorie, puce */}
      <div className="relative flex shrink-0 items-center gap-[1.8cqw] px-[3.5cqw] pt-[2.2cqw]">
        {/* eslint-disable-next-line @next/next/no-img-element -- rendu imprimable, image locale */}
        <img src="/logo-avenida.png" alt="" className="h-[8cqw] w-[8cqw] object-contain" />
        <div className="leading-none">
          <p className="font-serif text-[2.4cqw] font-bold tracking-[0.08em]" style={{ color: theme.dark }}>
            HÔTEL ÉCOLE
          </p>
          <p className="font-serif text-[3.9cqw] font-extrabold tracking-[0.06em]" style={{ color: accentText }}>
            AVENIDA
          </p>
        </div>
        <p className="ml-[1cqw] self-start rounded-full px-[1.8cqw] py-[0.5cqw] text-[1.9cqw] font-extrabold tracking-wider whitespace-nowrap text-white uppercase" style={{ background: theme.dark }}>
          {theme.label}
        </p>
        <span aria-hidden className="ml-auto grid h-[7.5cqw] w-[10cqw] grid-cols-3 gap-[0.4cqw] rounded-[1.2cqw] bg-[linear-gradient(135deg,#F6E7A6,#D4AF37_45%,#B8912B)] p-[0.9cqw] shadow-inner">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="rounded-[0.3cqw] border border-[#9C7A1E]/50" />
          ))}
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 gap-[3cqw] px-[3.5cqw] pt-[1.8cqw] pb-[2cqw]">
        {/* Photo d'identité */}
        <div className="w-[24cqw] shrink-0">
          <div className="aspect-[3/4] overflow-hidden rounded-[1cqw] bg-slate-100 p-[0.5cqw] shadow-md ring-[0.4cqw] ring-slate-300">
            {photoOk ? (
              // eslint-disable-next-line @next/next/no-img-element -- photo stockée en data URL
              <img src={data.photo!} alt={`Photo de ${data.name}`} className="size-full rounded-[0.6cqw] object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center font-display text-[7cqw] font-extrabold text-slate-300">{initials(data.name)}</span>
            )}
          </div>
        </div>

        {/* Identité */}
        <div className="flex min-w-0 flex-1 flex-col [&>*]:shrink-0">
          <p className={label} style={{ color: theme.dark }}>
            Nom et prénoms
          </p>
          <p className="truncate font-display text-[4.3cqw] leading-[1.2] font-extrabold uppercase" style={{ color: theme.dark }}>
            {data.name}
          </p>
          <p className={cn(label, "mt-[1cqw]")} style={{ color: theme.dark }}>
            {lineLabel}
          </p>
          <p className="truncate text-[3cqw] leading-[1.25] font-extrabold" style={{ color: accentText }}>
            {data.line1}
            {line2 ? ` / ${line2}` : ""}
          </p>
          {data.details && data.details.length > 0 && (
            <dl className="mt-[1.2cqw] grid grid-cols-[1.5fr_1fr] gap-x-[2cqw] gap-y-[0.9cqw]">
              {data.details.slice(0, 4).map((d) => (
                <div key={d.label} className="min-w-0">
                  <dt className={label} style={{ color: theme.dark }}>
                    {d.label}
                  </dt>
                  <dd className="truncate text-[2.6cqw] leading-[1.3] font-bold text-slate-800">{d.value || "—"}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-auto flex items-end gap-[2.5cqw]">
            <div className="aspect-square w-[12cqw] shrink-0 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- QR code généré en data URL */}
              {qr ? <img src={qr} alt="QR code de vérification" className="size-full" /> : <span className="block size-full animate-pulse bg-slate-100" />}
            </div>
            <div className="min-w-0">
              <p className="text-[2.6cqw] leading-none font-extrabold uppercase" style={{ color: theme.dark }}>
                {isClient ? "N° de fidélité" : "Matricule"}
              </p>
              <p className="font-display text-[5.4cqw] leading-[1.15] font-extrabold tracking-wide whitespace-nowrap" style={{ color: theme.dark }}>
                {data.matricule}
              </p>
              <p className="text-[2.1cqw] leading-tight font-semibold whitespace-nowrap text-slate-600">
                {data.cardNumber && !isClient ? `Carte ${data.cardNumber} · ` : ""}valable jusqu&apos;au {validity}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
  );

  const back = frame(
    <div className={cn(shell, "p-[1.4cqw] text-white")} style={{ background: theme.dark }}>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2.5cqw] border-[0.4cqw] border-white/70">
        <div aria-hidden className="bg-avenida-pattern absolute inset-0 opacity-[0.07]" />
        {/* eslint-disable-next-line @next/next/no-img-element -- filigrane */}
        <img src="/logo-avenida.png" alt="" aria-hidden className="pointer-events-none absolute top-[24%] left-[38%] w-[22cqw] opacity-[0.06] grayscale" />

        <div className="relative flex shrink-0 items-center gap-[2cqw] border-b border-white/30 px-[3cqw] py-[1.6cqw]">
          <p className="font-serif text-[3.6cqw] font-extrabold tracking-[0.05em] whitespace-nowrap">
            HÔTEL ÉCOLE <span style={{ color: brandAccent }}>AVENIDA</span>
          </p>
          <p className="ml-auto text-[2.4cqw] font-extrabold tracking-wide whitespace-nowrap uppercase">{(cs.motto || siteConfig.motto).replace(/\s*[–-]\s*/g, " · ")}</p>
        </div>

        <div className="relative grid min-h-0 flex-1 grid-cols-2 gap-x-[3.5cqw] px-[3cqw] pt-[1.8cqw]">
          <div className="flex min-w-0 flex-col gap-[2.2cqw]">
            <div>
              <p className="text-[3.1cqw] leading-tight font-extrabold uppercase">Établissement</p>
              {cs.address ? (
                <p className="text-[2.8cqw] leading-snug whitespace-pre-line text-white/90">{cs.address}</p>
              ) : (
                <p className="text-[2.8cqw] leading-snug text-white/90">
                  {siteConfig.address.street}
                  <br />
                  {siteConfig.address.district}, {siteConfig.address.city}
                </p>
              )}
            </div>
            <div>
              <p className="text-[3.1cqw] leading-tight font-extrabold uppercase">Contact</p>
              <p className="text-[2.8cqw] leading-snug text-white/90">
                Tél : <strong className="text-white">{cs.phone || siteConfig.phones[0].display}</strong>
              </p>
              <p className="truncate text-[2.8cqw] leading-snug text-white/90">{cs.email || siteConfig.email}</p>
            </div>
            <p className="text-[2.9cqw] font-extrabold whitespace-nowrap">
              <span style={{ color: brandAccent }}>VALIDITÉ :</span> jusqu&apos;au {validity}
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-[1.4cqw]">
            <div>
              <p className="text-[3.1cqw] leading-tight font-extrabold uppercase">Administration</p>
              <p className="text-[2.8cqw] leading-snug text-white/90">En cas de perte, contactez :</p>
              {data.emergency && (
                <p className="truncate text-[2.8cqw] leading-snug">
                  <span className="text-white/75">{isStudent ? "Tuteur" : "Urgence"} :</span> <strong>{data.emergency}</strong>
                </p>
              )}
              {data.cardNumber && (
                <p className="text-[2.8cqw] leading-snug">
                  <span className="text-white/75">N° de carte :</span> <strong>{data.cardNumber}</strong>
                </p>
              )}
            </div>
            <div className="rounded-[1.4cqw] bg-white px-[2cqw] py-[1cqw] text-center" style={{ color: theme.dark }}>
              <p className="text-[2.5cqw] leading-tight font-extrabold uppercase">{signTitle}</p>
              {signName && <p className="text-[2.8cqw] leading-tight font-bold">{signName}</p>}
              {cs.signatureImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- signature scannée
                <img src={cs.signatureImage} alt="Signature" className="mx-auto h-[7cqw] object-contain" />
              ) : (
                <div className="mx-auto mt-[5.5cqw] mb-[0.5cqw] w-3/4 border-b border-slate-400" />
              )}
            </div>
          </div>
        </div>
        <p className="relative shrink-0 px-[3cqw] pt-[1cqw] pb-[1.4cqw] text-[2.2cqw] leading-snug text-white/85">{cs.rules?.[variant] || defaultCardRules(variant)}</p>
      </div>
    </div>,
  );

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row", className)}>
      {side !== "back" && front}
      {side !== "front" && back}
    </div>
  );
}
