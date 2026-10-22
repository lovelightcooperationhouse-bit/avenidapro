import { ChevronRight, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteImage } from "@/content/site";
import { Container } from "./Section";

type Crumb = { label: string; href?: string };

/**
 * Bandeau d'en-tête des pages intérieures : photo, voile bleu,
 * fil d'Ariane, titre (h1) et introduction.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  image,
  breadcrumbs,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  image: SiteImage;
  /** Fil d'Ariane (l'accueil est ajouté automatiquement). */
  breadcrumbs: Crumb[];
  children?: ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden bg-avenida-blue-950 text-white">
      <Image src={image.src} alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-50 site-kenburns-slow" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-avenida-blue-950 via-avenida-blue-950/85 to-avenida-blue-950/30" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-avenida-blue-950/80 to-transparent" />

      <Container className="flex min-h-[19rem] flex-col justify-end gap-5 py-12 sm:min-h-[22rem] sm:py-16 lg:min-h-[26rem]">
        <nav aria-label="Fil d'Ariane">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/75">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-red-300">
                <Home aria-hidden className="size-3.5" />
                Accueil
              </Link>
            </li>
            {breadcrumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <ChevronRight aria-hidden className="size-3.5 text-white/40" />
                {c.href ? (
                  <Link href={c.href} className="hover:text-red-300">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-white">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {eyebrow && (
          <p className="flex items-center gap-3 text-sm font-bold tracking-widest text-red-300 uppercase">
            <span aria-hidden className="h-0.5 w-8 rounded-full bg-current" />
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-4xl font-display text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="max-w-2xl text-lg leading-relaxed text-white/85">{description}</p>}
        {children}
      </Container>

      {/* Liseré tricolore vers le contenu */}
      <svg aria-hidden viewBox="0 0 1440 40" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-6 w-full text-white sm:h-10">
        <path d="M0 40V22c240-28 480-28 720-6s480 22 720-6v30z" fill="currentColor" />
        <path d="M0 22c240-28 480-28 720-6s480 22 720-6" fill="none" stroke="#DC2626" strokeWidth="3" />
      </svg>
    </header>
  );
}
