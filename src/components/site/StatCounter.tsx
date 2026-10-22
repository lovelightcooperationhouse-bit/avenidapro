"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Décélération « easeOutExpo » : démarrage rapide, arrivée douce. */
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * Chiffre clé animé de 0 à `value` quand il entre dans l'écran.
 * Valeur finale immédiate si l'utilisateur a demandé à réduire les animations ;
 * les lecteurs d'écran lisent toujours la valeur finale.
 */
export function StatCounter({ value, label, suffix = "", duration = 1800, className }: { value: number; label: string; suffix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          setDisplay(Math.round(easeOutExpo(progress) * value));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { rootMargin: "0px 0px -15% 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <div ref={ref} className={cn("flex flex-col items-center gap-2 text-center", className)}>
      <p className="font-display text-6xl font-extrabold tabular-nums text-white sm:text-7xl">
        <span aria-hidden>
          {display}
          <span className="text-vif-clair">{suffix}</span>
        </span>
        <span className="sr-only">
          {value}
          {suffix}
        </span>
      </p>
      <span aria-hidden className="flex h-1 w-12 overflow-hidden rounded-full">
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-vif" />
      </span>
      <p className="max-w-[13rem] text-sm font-semibold text-white/80">{label}</p>
    </div>
  );
}
