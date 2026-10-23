import type { ReactNode } from "react";
import { getSettings } from "@/lib/cms";
import { cn } from "@/lib/utils";

type SectionTitleProps = {
  /** Petit sur-titre au-dessus du titre (ex. « Nos formations »). */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  /** Niveau de titre HTML, h2 par défaut. */
  as?: "h1" | "h2" | "h3";
  /** id du titre, pour lier la section via aria-labelledby. */
  id?: string;
  /** Inverse les couleurs pour un fond sombre. */
  inverted?: boolean;
  className?: string;
};

/** Titre de section : sur-titre avec liseré tricolore, grand titre et introduction. */
export async function SectionTitle({ eyebrow: baseEyebrow, title: baseTitle, description: baseDescription, align = "left", as: Heading = "h2", id, inverted = false, className }: SectionTitleProps) {
  const centered = align === "center";
  // Textes modifiés dans « Gestion globale du site › Textes des pages » (par identifiant de section)
  const o = id ? (await getSettings()).section_texts?.[id] : undefined;
  const eyebrow = o?.eyebrow || baseEyebrow;
  const description = o?.description || baseDescription;
  const title = o?.title
    ? o.title.split(/\[([^\]]+)\]/).map((part, i) =>
        i % 2 ? (
          <Accent key={i} inverted={inverted}>
            {part}
          </Accent>
        ) : (
          part
        ),
      )
    : baseTitle;

  return (
    <div className={cn("flex max-w-3xl flex-col gap-4", centered && "mx-auto items-center text-center", className)}>
      {eyebrow && (
        <p className={cn("flex items-center gap-3 text-[0.8rem] font-extrabold tracking-[0.22em] uppercase", inverted ? "text-white" : "text-vif")}>
          <span aria-hidden className="flex h-1 w-10 overflow-hidden rounded-full">
            <span className={cn("flex-1", inverted ? "bg-white" : "bg-avenida-blue")} />
            <span className="flex-1 bg-vif" />
          </span>
          {eyebrow}
        </p>
      )}
      <Heading
        id={id}
        className={cn(
          "font-display text-[2rem] leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]",
          inverted ? "text-white" : "text-avenida-blue-950"
        )}
      >
        {title}
      </Heading>
      {description && <p className={cn("text-lg leading-relaxed", inverted ? "text-white/80" : "text-slate-600")}>{description}</p>}
    </div>
  );
}

/** Mot mis en valeur dans un titre : italique élégant, en rouge vif. */
export function Accent({ children, inverted = false }: { children: ReactNode; inverted?: boolean }) {
  return <span className={cn("font-elegant font-bold italic", inverted ? "text-vif-clair" : "text-vif")}>{children}</span>;
}
