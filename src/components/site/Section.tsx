import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  default: "bg-white text-slate-900",
  muted: "bg-slate-50 text-slate-900",
  blue: "bg-avenida-blue-950 text-white",
  // Bleu nuit avec le motif losange du tissu Avenida
  night: "relative isolate bg-nuit text-white before:absolute before:inset-0 before:-z-10 before:bg-avenida-pattern before:opacity-[0.06] before:content-['']",
  // Dégradé tricolore bleu → rouge (bandeau d'appel final)
  flag: "bg-[image:linear-gradient(120deg,#06152E_0%,#0C356A_45%,#E30613_100%)] text-white",
} as const;

const widths = {
  narrow: "max-w-3xl",
  default: "max-w-7xl",
  wide: "max-w-[96rem]",
};

type SectionProps = ComponentProps<"section"> & {
  /** Couleur de fond de la section. */
  tone?: keyof typeof tones;
  /** Largeur maximale du contenu. */
  width?: keyof typeof widths;
  /** Classes appliquées au conteneur interne. */
  containerClassName?: string;
};

/**
 * Bloc de page standard : espacement vertical généreux, conteneur centré
 * et marges latérales responsive (16 px sur mobile).
 */
export function Section({ tone = "default", width = "default", className, containerClassName, children, ...props }: SectionProps) {
  return (
    <section className={cn("py-16 sm:py-24", tones[tone], className)} {...props}>
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", widths[width], containerClassName)}>{children}</div>
    </section>
  );
}

/** Conteneur centré seul (header, footer…). */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}
