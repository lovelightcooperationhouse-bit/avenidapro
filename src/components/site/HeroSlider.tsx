"use client";

import { ArrowRight, BedDouble, ChevronLeft, ChevronRight, GraduationCap, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { heroSlides as slides } from "@/content/site";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./ButtonLink";

const DURATION = 7000;

/**
 * Diaporama plein écran de l'accueil : fondu enchaîné + effet Ken Burns,
 * mots du titre qui apparaissent un à un, barre de progression,
 * pause au survol, flèches clavier et balayage tactile.
 */
export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length), []);

  // Défilement automatique (désactivé si « réduire les animations », en pause au survol)
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
      className="relative isolate flex min-h-[calc(100svh-7rem)] items-center overflow-hidden bg-avenida-blue-950 text-white sm:min-h-[44rem] lg:min-h-[calc(100svh-8rem)]"
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
      {/* Photos : fondu enchaîné + effet Ken Burns */}
      {slides.map((s, i) => (
        <div
          key={s.image.src}
          aria-hidden={i !== index}
          className={cn("absolute inset-0 -z-20 transition-opacity duration-[1400ms] ease-out", i === index ? "opacity-100" : "opacity-0")}
        >
          <Image
            src={s.image.src}
            alt={i === index ? s.image.alt : ""}
            fill
            priority={i === 0}
            sizes="100vw"
            className={cn("object-cover", i === index && "site-kenburns", i % 2 === 1 && "origin-top-right")}
          />
        </div>
      ))}

      {/* Voiles bleus pour la lisibilité du texte */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-avenida-blue-950/95 via-avenida-blue-950/70 to-avenida-blue-950/20" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-avenida-blue-950/90 to-transparent" />

      {/* Cadre incliné du monogramme HA, en filigrane */}
      <svg aria-hidden viewBox="0 0 400 400" className="pointer-events-none absolute -right-20 bottom-10 -z-10 w-[26rem] opacity-30 lg:right-10 lg:w-[34rem] lg:opacity-40">
        <g className="site-frame-in">
          <rect x="70" y="50" width="260" height="300" rx="10" fill="none" stroke="#3D82C0" strokeWidth="14" transform="rotate(-8 200 200)" />
          <rect x="95" y="80" width="210" height="245" rx="6" fill="none" stroke="#DC2626" strokeWidth="6" transform="rotate(-8 200 200)" />
        </g>
      </svg>

      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl" aria-live={autoplay ? "off" : "polite"}>
          <div key={index} aria-roledescription="diapositive" aria-label={`${index + 1} sur ${slides.length}`}>
            <p className="site-rise mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-widest text-red-300 uppercase backdrop-blur-sm sm:text-sm">
              <span aria-hidden className="size-1.5 rounded-full bg-avenida-red" />
              {slide.eyebrow}
            </p>

            <h1 className="font-display text-[2.35rem] leading-[1.08] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              {slide.title.map((part, p) => (
                <span key={p} className={cn(p === 1 && "font-serif text-red-400")}>
                  {part.split(" ").map((w) => {
                    const k = wordIndex++;
                    return (
                      <span key={k} className="site-word inline-block" style={{ animationDelay: `${k * 60}ms` }}>
                        {w}&nbsp;
                      </span>
                    );
                  })}
                </span>
              ))}
            </h1>

            <p className="site-rise mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl" style={{ animationDelay: "350ms" }}>
              {slide.subtitle}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href="/admissions">
              <GraduationCap aria-hidden />
              S&apos;inscrire
            </ButtonLink>
            <ButtonLink href="/hotel#reserver" variant="white">
              <BedDouble aria-hidden />
              Réserver une chambre
            </ButtonLink>
            <ButtonLink href="/ecole" variant="ghost" className="px-2">
              Nos formations
              <ArrowRight aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Commandes du carrousel */}
      <div className="absolute inset-x-0 bottom-0 pb-6 sm:pb-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-2 sm:max-w-md">
            {slides.map((s, i) => (
              <button
                key={s.image.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Afficher la diapositive ${i + 1} : ${s.eyebrow}`}
                aria-current={i === index ? "true" : undefined}
                className="group relative h-6 flex-1"
              >
                <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/25 transition-colors group-hover:bg-white/40">
                  {i === index && (
                    <span
                      key={`${index}-${autoplay}`}
                      className="block h-full rounded-full bg-avenida-red"
                      style={autoplay ? { animation: `site-progress ${DURATION}ms linear both` } : { width: "100%" }}
                    />
                  )}
                  {i < index && <span className="block h-full w-full rounded-full bg-white/60" />}
                </span>
              </button>
            ))}
            <span className="ml-2 hidden font-display text-sm font-semibold tabular-nums text-white/80 sm:inline">
              {String(index + 1).padStart(2, "0")}
              <span className="text-white/40"> / {String(slides.length).padStart(2, "0")}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[
              { label: paused ? "Reprendre le défilement" : "Mettre en pause le défilement", onClick: () => setPaused((p) => !p), icon: paused ? Play : Pause, small: true },
              { label: "Diapositive précédente", onClick: () => go(-1), icon: ChevronLeft },
              { label: "Diapositive suivante", onClick: () => go(1), icon: ChevronRight },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={b.onClick}
                aria-label={b.label}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white hover:text-avenida-blue",
                  !b.small && "sm:size-12"
                )}
              >
                <b.icon aria-hidden className={b.small ? "size-4" : "size-5"} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
