"use client";

import { ArrowRight, BedDouble, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { heroSlides, intakeDates, intakes, type HeroSlide } from "@/content/site";
import type { HeroSlideSetting } from "@/lib/cms-types";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./ButtonLink";

const DURATION = 7000;

/** Jours restants avant la prochaine rentrée (calculé côté navigateur). */
function useNextIntake() {
  const [next, setNext] = useState<{ label: string; days: number; date: string } | null>(null);
  useEffect(() => {
    const now = Date.now();
    const i = intakeDates.findIndex((d) => new Date(`${d}T08:00:00`).getTime() > now);
    if (i >= 0)
      setNext({
        label: intakes[i],
        days: Math.ceil((new Date(`${intakeDates[i]}T08:00:00`).getTime() - now) / 86_400_000),
        date: new Date(`${intakeDates[i]}T08:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
      });
  }, []);
  return next;
}

/**
 * Diaporama plein écran de l'accueil : fondu enchaîné et zoom panoramique sur les visuels Avenida,
 * titre animé mot à mot, cartes flottantes, miniatures avec barre de progression.
 * Pause au survol, flèches clavier, balayage tactile ; immobile si « réduire les animations ».
 */
export function HeroSlider({ custom }: { custom?: HeroSlideSetting[] }) {
  // Diapositives saisies par la direction (administration du site), sinon celles par défaut
  const slides: HeroSlide[] = custom?.length
    ? custom.map((c) => ({
        image: { src: c.image, alt: c.alt ?? c.eyebrow },
        focus: c.focus,
        eyebrow: c.eyebrow,
        title: [c.title, c.highlight ?? "", c.titleEnd ?? ""],
        subtitle: c.subtitle,
      }))
    : heroSlides;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchX = useRef<number | null>(null);
  const next = useNextIntake();

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length), [slides.length]);

  const autoplay = !paused && !hovered && !reduceMotion;
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setTimeout(() => go(1), DURATION);
    return () => window.clearTimeout(id);
  }, [autoplay, index, go]);

  const slide = slides[index];
  let wordIndex = 0;

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="Présentation de l'Hôtel École Avenida"
      className="relative isolate flex min-h-[calc(100svh-7rem)] flex-col overflow-hidden bg-nuit text-white sm:min-h-[46rem] lg:min-h-[calc(100svh-8rem)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {/* Visuels : fondu enchaîné + zoom panoramique */}
      {slides.map((s, i) => (
        <div
          key={s.image.src}
          aria-hidden={i !== index}
          className={cn("absolute inset-0 -z-20 transition-opacity duration-[1600ms] ease-out", i === index ? "opacity-100" : "opacity-0")}
        >
          <Image
            src={s.image.src}
            alt={i === index ? s.image.alt : ""}
            fill
            priority={i === 0}
            sizes="100vw"
            quality={85}
            style={{ objectPosition: s.focus ?? "center" }}
            className={cn("object-cover", i === index && "site-zoom-pan")}
          />
        </div>
      ))}

      {/* Voiles de lisibilité + motif Avenida */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,#06152E_0%,rgb(6_21_46/0.92)_30%,rgb(6_21_46/0.55)_58%,rgb(6_21_46/0.05)_100%)]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-nuit to-transparent" />
      <div aria-hidden className="bg-avenida-pattern absolute inset-y-0 left-0 -z-10 w-24 opacity-20 [mask-image:linear-gradient(90deg,black,transparent)] sm:w-40" />

      <div className="mx-auto flex w-full max-w-7xl flex-1 items-center gap-10 px-4 pt-14 pb-36 sm:px-6 lg:px-8 lg:pb-60 xl:pb-40">
        <div className="max-w-3xl flex-1" aria-live={autoplay ? "off" : "polite"}>
          <div key={index} aria-roledescription="diapositive" aria-label={`${index + 1} sur ${slides.length}`}>
            <p className="site-from-left mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 py-1.5 pr-4 pl-2 text-xs font-bold tracking-[0.18em] uppercase backdrop-blur-md sm:text-sm">
              <span aria-hidden className="size-2.5 rounded-full bg-vif" />
              {slide.eyebrow}
            </p>

            <h1 className="font-display text-[2.6rem] leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-[5.2rem]">
              {slide.title.map((part, p) => (
                <span key={p} className={cn(p === 1 && "font-elegant font-bold text-vif-clair italic")}>
                  {part.split(" ").filter(Boolean).map((w) => {
                    const k = wordIndex++;
                    return (
                      <span key={k} className="site-word inline-block" style={{ animationDelay: `${k * 70}ms` }}>
                        {w}&nbsp;
                      </span>
                    );
                  })}
                </span>
              ))}
            </h1>

            <p className="site-from-left mt-7 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl" style={{ animationDelay: "650ms" }}>
              {slide.subtitle}
            </p>
          </div>

          <div key={`cta-${index}`} className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href="/preinscription" size="xl" className="site-pop" style={{ animationDelay: "900ms" }}>
              <ClipboardList aria-hidden />
              Pré-inscription en ligne
            </ButtonLink>
            <ButtonLink href="/hotel#reserver" variant="glass" size="xl" className="site-pop" style={{ animationDelay: "1050ms" }}>
              <BedDouble aria-hidden />
              Réserver une chambre
            </ButtonLink>
            <ButtonLink href="/ecole" variant="ghost" className="site-pop px-2" style={{ animationDelay: "1200ms" }}>
              Nos formations
              <ArrowRight aria-hidden />
            </ButtonLink>
          </div>

          {/* Rentrée : bien visible sur téléphone et tablette */}
          {next && (
            <Link href="/preinscription" className="site-pop mt-6 inline-flex items-center gap-3 rounded-2xl bg-or px-4 py-3 text-avenida-blue-950 shadow-lg xl:hidden" style={{ animationDelay: "1300ms" }}>
              <CalendarDays aria-hidden className="size-6" />
              <span className="leading-tight">
                <span className="block text-[11px] font-extrabold tracking-widest uppercase">Prochaine rentrée</span>
                <span className="block font-display text-lg font-extrabold">
                  J-{next.days} · {next.date}
                </span>
              </span>
            </Link>
          )}
        </div>

      </div>

      {/* Navigation : miniatures avec progression */}
      <div className="absolute inset-x-0 bottom-0 pb-6 sm:pb-8">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 pr-20 pl-4 sm:pl-6 lg:pl-8 2xl:pr-8">
          <div className="flex flex-1 gap-2 sm:max-w-2xl sm:gap-3">
            {slides.map((s, i) => (
              <button
                key={s.image.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Afficher la diapositive ${i + 1} : ${s.eyebrow}`}
                aria-current={i === index ? "true" : undefined}
                className="group flex flex-1 flex-col gap-2 text-left"
              >
                <span
                  className={cn(
                    "relative hidden h-20 overflow-hidden rounded-xl ring-2 transition-all duration-300 md:block lg:h-24",
                    i === index ? "ring-vif" : "opacity-60 ring-transparent group-hover:opacity-100"
                  )}
                >
                  <Image src={s.image.src} alt="" fill sizes="160px" style={{ objectPosition: s.focus ?? "center" }} className="object-cover" />
                </span>
                <span className="relative h-1 overflow-hidden rounded-full bg-white/25">
                  {i === index && (
                    <span
                      key={`${index}-${autoplay}`}
                      className="block h-full rounded-full bg-vif"
                      style={autoplay ? { animation: `site-progress ${DURATION}ms linear both` } : { width: "100%" }}
                    />
                  )}
                  {i < index && <span className="block h-full w-full rounded-full bg-white/60" />}
                </span>
                <span className={cn("hidden truncate text-[11px] font-bold tracking-wider uppercase lg:block", i === index ? "text-white" : "text-white/50")}>{s.eyebrow}</span>
              </button>
            ))}
          </div>

          {next && (
            <Link
              href="/preinscription"
              className="hidden shrink-0 items-center gap-4 rounded-2xl bg-or px-5 py-3 text-avenida-blue-950 shadow-2xl ring-4 ring-or/30 transition-colors hover:bg-or-clair xl:flex"
            >
              <CalendarDays aria-hidden className="size-8" />
              <span className="leading-tight">
                <span className="block text-[11px] font-extrabold tracking-widest uppercase">Prochaine rentrée</span>
                <span className="block font-display text-3xl font-extrabold">J-{next.days}</span>
                <span className="block text-sm font-bold">{next.date}</span>
              </span>
            </Link>
          )}

          <div className="flex items-center gap-2">
            {[
              { label: paused ? "Reprendre le défilement" : "Mettre en pause le défilement", onClick: () => setPaused((p) => !p), icon: paused ? Play : Pause },
              { label: "Diapositive précédente", onClick: () => go(-1), icon: ChevronLeft },
              { label: "Diapositive suivante", onClick: () => go(1), icon: ChevronRight },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={b.onClick}
                aria-label={b.label}
                className="flex size-11 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition-colors hover:border-vif hover:bg-vif"
              >
                <b.icon aria-hidden className="size-5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
