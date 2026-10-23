import { ChevronRight, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteImage } from "@/content/site";
import { getSettings } from "@/lib/cms";
import { Container } from "./Section";

type Crumb = { label: string; href?: string };

/**
 * Bandeau d'en-tête des pages intérieures : photo animée, voile bleu nuit, motif Avenida,
 * fil d'Ariane, sur-titre, titre (h1) et introduction.
 */
export async function PageHeader({
  pageKey,
  title: baseTitle,
  description: baseDescription,
  eyebrow: baseEyebrow,
  image: baseImage,
  focus = "center",
  breadcrumbs,
  children,
}: {
  /** Clé de la page : son en-tête est modifiable dans « Gestion globale du site › En-têtes des pages ». */
  pageKey?: string;
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  image: SiteImage;
  /** Cadrage de la photo (object-position). */
  focus?: string;
  /** Fil d'Ariane (l'accueil est ajouté automatiquement). */
  breadcrumbs: Crumb[];
  children?: ReactNode;
}) {
  const o = pageKey ? (await getSettings()).page_headers?.[pageKey] : undefined;
  const eyebrow = o?.eyebrow || baseEyebrow;
  const description = o?.description || baseDescription;
  const image = o?.image ? { src: o.image, alt: "" } : baseImage;
  // Titre modifié : le texte entre [crochets] est mis en valeur comme sur le site
  const title = o?.title
    ? o.title.split(/\[([^\]]+)\]/).map((part, i) =>
        i % 2 ? (
          <span key={i} className="font-elegant text-vif-clair italic">
            {part}
          </span>
        ) : (
          part
        ),
      )
    : baseTitle;
  return (
    <header className="relative isolate overflow-hidden bg-nuit text-white">
      <Image src={image.src} alt="" fill priority sizes="100vw" style={{ objectPosition: focus }} className="site-kenburns-slow -z-20 object-cover opacity-70" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(var(--nuit))_0%,rgb(var(--nuit)/0.9)_40%,rgb(var(--nuit)/0.35)_100%)]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-nuit/80 to-transparent" />
      <div aria-hidden className="bg-avenida-pattern absolute inset-y-0 left-0 -z-10 w-24 opacity-20 [mask-image:linear-gradient(90deg,black,transparent)] sm:w-40" />

      <Container className="flex min-h-[21rem] flex-col justify-end gap-5 py-14 sm:min-h-[25rem] sm:py-20 lg:min-h-[30rem]">
        <nav aria-label="Fil d'Ariane">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/75">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-white">
                <Home aria-hidden className="size-3.5" />
                Accueil
              </Link>
            </li>
            {breadcrumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <ChevronRight aria-hidden className="size-3.5 text-vif-clair" />
                {c.href ? (
                  <Link href={c.href} className="hover:text-white">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-semibold text-white">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {eyebrow && (
          <p className="site-rise inline-flex w-fit items-center gap-2.5 rounded-full border border-white/20 bg-white/10 py-1.5 pr-4 pl-2 text-xs font-bold tracking-[0.18em] uppercase backdrop-blur-md sm:text-sm">
            <span aria-hidden className="size-2.5 rounded-full bg-vif" />
            {eyebrow}
          </p>
        )}
        <h1 className="site-rise max-w-4xl font-display text-[2.6rem] leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">{title}</h1>
        {description && <p className="site-rise max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">{description}</p>}
        {children}
      </Container>

      {/* Liseré tricolore vers le contenu */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 flex h-1.5">
        <span className="flex-1 bg-avenida-blue" />
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-vif" />
      </span>
    </header>
  );
}
