"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { siteConfig } from "@/content/site";
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
  paymentOk?: boolean;
  statusLabel?: string;
};

const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Lien de vérification encodé dans le QR code. */
export const verifyUrl = (token: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/verifier/${token}`;

/**
 * Carte scolaire / carte de travail au format 9 × 5,5 cm : recto avec photo, matricule et QR code,
 * verso avec coordonnées de l'école. Le QR renvoie vers la situation en temps réel de la personne.
 */
export function IdCard({ data, side = "both", className }: { data: CardData; side?: "front" | "back" | "both"; className?: string }) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(verifyUrl(data.token), { margin: 1, width: 300, errorCorrectionLevel: "M", color: { dark: "#06152E", light: "#FFFFFF" } }).then(setQr);
  }, [data.token]);

  const theme = CARD_THEMES[data.variant ?? (data.type === "client" ? "client" : data.type === "eleve" ? "eleve" : "personnel")];
  const isClient = data.type === "client";
  const photoOk = data.photo && !data.photo.includes("default.png");

  const front = (
    <div className="id-card relative flex aspect-[90/55] w-full max-w-[26rem] flex-col overflow-hidden rounded-2xl bg-white text-[#06152E] shadow-xl ring-1 ring-slate-900/10 print:shadow-none">
      {/* Bandeau */}
      <div className="relative flex items-center gap-2 px-3 py-2 text-white" style={{ background: theme.dark }}>
        <div aria-hidden className="bg-avenida-pattern absolute inset-0 opacity-15" />
        {/* eslint-disable-next-line @next/next/no-img-element -- rendu imprimable, image locale */}
        <img src="/logoavenida.jpg" alt="" className="relative size-8 rounded bg-white object-contain" />
        <div className="relative leading-none">
          <p className="font-serif text-[9px] font-bold tracking-wider">HÔTEL ÉCOLE</p>
          <p className="font-serif text-sm font-extrabold tracking-wider text-[#FF3B47]">AVENIDA</p>
        </div>
        <p className="relative ml-auto rounded-full px-2 py-0.5 text-[8px] font-extrabold tracking-widest uppercase" style={{ background: theme.accent, color: theme.badgeText }}>
          {theme.label}
        </p>
      </div>
      <span aria-hidden className="flex h-[3px]">
        {theme.stripe.map((c, i) => (
          <span key={i} className="flex-1" style={{ background: c }} />
        ))}
      </span>

      <div className="flex flex-1 gap-3 p-3">
        <div className="flex w-[27%] shrink-0 flex-col gap-1.5">
          <div className="aspect-[3/4] overflow-hidden rounded-lg bg-slate-100 ring-2 ring-[#0C356A]/20">
            {photoOk ? (
              // eslint-disable-next-line @next/next/no-img-element -- photo stockée en data URL
              <img src={data.photo!} alt={`Photo de ${data.name}`} className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center font-display text-2xl font-extrabold text-[#0C356A]/40">{initials(data.name)}</span>
            )}
          </div>
          {data.paymentOk !== undefined && (
            <span className={cn("rounded px-1 py-0.5 text-center text-[7px] font-extrabold uppercase", data.paymentOk ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-[#B8000F]")}>
              {data.paymentOk ? "Scolarité à jour" : "Paiement en attente"}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate font-display text-[15px] leading-tight font-extrabold uppercase">{data.name}</p>
          <p className="mt-0.5 truncate text-[10px] font-bold" style={{ color: theme.accent === "#D4A017" ? theme.dark : theme.accent }}>
            {data.line1}
          </p>
          <p className="truncate text-[9px] text-slate-500">{data.line2}</p>
          <div className="mt-auto flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[7px] font-bold tracking-widest text-slate-400 uppercase">{isClient ? "N° de fidélité" : "Matricule"}</p>
              <p className="font-mono text-[13px] font-extrabold tracking-wider">{data.matricule}</p>
              {data.cardNumber && !isClient && <p className="font-mono text-[8px] font-bold text-slate-500">Carte n° {data.cardNumber}</p>}
              <p className="text-[7px] text-slate-400">
                V{data.version} · {new Date(data.issuedAt).toLocaleDateString("fr-FR")}
                {data.validUntil ? ` · valable jusqu'au ${new Date(data.validUntil).toLocaleDateString("fr-FR")}` : ""}
              </p>
            </div>
            <div className="aspect-square w-[30%] min-w-16 shrink-0 self-end rounded-md bg-white p-0.5 ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- QR code généré en data URL */}
              {qr ? <img src={qr} alt="QR code de vérification" className="size-full" /> : <span className="block size-full animate-pulse bg-slate-100" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const back = (
    <div className="id-card relative flex aspect-[90/55] w-full max-w-[26rem] flex-col justify-between overflow-hidden rounded-2xl p-4 text-white shadow-xl print:shadow-none" style={{ background: theme.dark }}>
      <div aria-hidden className="bg-avenida-pattern absolute inset-0 opacity-10" />
      <div className="relative">
        <p className="font-serif text-xs font-bold tracking-widest">HÔTEL ÉCOLE AVENIDA</p>
        <p className="text-[8px] tracking-widest text-white/70 uppercase">{siteConfig.motto}</p>
      </div>
      <div className="relative text-[8px] leading-relaxed text-white/85">
        <p>
          {siteConfig.address.street}, {siteConfig.address.district}
        </p>
        <p>
          {siteConfig.address.postal} {siteConfig.address.city} – {siteConfig.address.country}
        </p>
        <p>Tél. {siteConfig.phones.map((p) => p.display).join(" · ")}</p>
      </div>
      <div className="relative rounded-lg bg-white/10 p-2 text-[7.5px] leading-snug text-white/85">
        Cette carte est personnelle. Elle doit être présentée à l&apos;entrée et sur demande. Scannez le QR code pour vérifier sa validité et la situation
        {` ${theme.holder}`} en temps réel.{isClient ? " Présentez-la à la réception pour bénéficier de vos avantages fidélité." : ""} En cas de perte, prévenez immédiatement l&apos;administration.
      </div>
      <span aria-hidden className="absolute inset-x-0 bottom-0 flex h-1">
        {theme.stripe.map((c, i) => (
          <span key={i} className="flex-1" style={{ background: c }} />
        ))}
      </span>
    </div>
  );

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row", className)}>
      {side !== "back" && front}
      {side !== "front" && back}
    </div>
  );
}
