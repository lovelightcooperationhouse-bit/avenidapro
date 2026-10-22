"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Fait apparaître son contenu en fondu montant à l'entrée dans l'écran.
 * CSS + IntersectionObserver (pas de bibliothèque). Sans JavaScript ou avec
 * « réduire les animations », le contenu est simplement visible.
 */
export function Reveal({ className, delay = 0, style, ...props }: ComponentProps<"div"> & { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Déjà visible au chargement : pas d'animation (évite un clignotement en haut de page)
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.dataset.reveal = "hidden";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = "shown";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }} className={cn("site-reveal", className)} {...props} />;
}
