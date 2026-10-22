"use client";

import { ArrowRight, CalendarClock, Check, ClipboardList, GraduationCap, Wallet } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { formatCFA, formations, type SiteImage } from "@/content/site";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./ButtonLink";

/** Explorateur des 5 diplômes : onglets (CFA → BTS) et fiche détaillée avec photo. */
/** `imageMap` : images remplacées depuis la gestion du site (clé = image d'origine). */
export function FormationExplorer({ imageMap }: { imageMap?: Record<string, SiteImage> }) {
  const [active, setActive] = useState(1);
  const f = formations[active];

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Diplômes" className="flex gap-2 overflow-x-auto pb-1">
        {formations.map((x, i) => (
          <button
            key={x.code}
            type="button"
            role="tab"
            id={`tab-${x.code}`}
            aria-selected={i === active}
            aria-controls={`panel-${x.code}`}
            onClick={() => setActive(i)}
            className={cn(
              "flex min-w-[7.5rem] flex-1 flex-col items-start rounded-2xl border-2 px-5 py-3 text-left transition-all duration-300",
              i === active ? "border-vif bg-vif text-white shadow-lg shadow-vif/30" : "border-white/15 bg-white/5 text-white hover:border-white/40"
            )}
          >
            <span className="font-display text-2xl font-extrabold">{x.code}</span>
            <span className={cn("text-xs font-semibold", i === active ? "text-white/90" : "text-white/60")}>{x.duration}</span>
          </button>
        ))}
      </div>

      <div
        key={f.code}
        role="tabpanel"
        id={`panel-${f.code}`}
        aria-labelledby={`tab-${f.code}`}
        className="site-rise grid overflow-hidden rounded-[2rem] bg-white text-slate-900 shadow-2xl lg:grid-cols-[1.05fr_1fr]"
      >
        <div className="relative min-h-72 lg:min-h-full">
          <Image src={(imageMap?.[f.image.src] ?? f.image).src} alt={(imageMap?.[f.image.src] ?? f.image).alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-nuit/80 via-nuit/10 to-transparent" />
          <div className="absolute bottom-0 left-0 p-7 text-white">
            <p className="font-display text-6xl font-extrabold">{f.code}</p>
            <p className="font-elegant text-xl italic">{f.name}</p>
          </div>
        </div>
        <div className="flex flex-col gap-6 p-7 sm:p-10">
          <p className="text-lg leading-relaxed text-slate-700">{f.pitch}</p>
          <dl className="grid grid-cols-2 gap-4">
            {[
              { icon: GraduationCap, label: "Recrutement", value: f.level },
              { icon: CalendarClock, label: "Durée", value: f.duration },
              { icon: ClipboardList, label: "Inscription", value: formatCFA(f.registration) },
              { icon: Wallet, label: "Scolarité / an", value: formatCFA(f.tuition) },
            ].map((d) => (
              <div key={d.label} className="rounded-2xl bg-slate-50 p-4">
                <dt className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase">
                  <d.icon aria-hidden className="size-4 text-vif" />
                  {d.label}
                </dt>
                <dd className="mt-1 font-display text-lg font-extrabold text-avenida-blue-950">{d.value}</dd>
              </div>
            ))}
          </dl>
          <div>
            <p className="mb-3 text-xs font-extrabold tracking-[0.2em] text-vif uppercase">Spécialités</p>
            <ul className="flex flex-wrap gap-2">
              {f.specialties.map((s) => (
                <li key={s} className="flex items-center gap-1.5 rounded-full bg-avenida-blue-50 px-3.5 py-1.5 text-sm font-bold text-avenida-blue">
                  <Check aria-hidden className="size-3.5 text-vif" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-auto flex flex-wrap gap-3">
            <ButtonLink href={`/preinscription?formation=${f.code}`}>
              Je candidate en {f.code}
              <ArrowRight aria-hidden />
            </ButtonLink>
            <ButtonLink href="/admissions#tarifs" variant="outline">
              Frais et paiement
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
