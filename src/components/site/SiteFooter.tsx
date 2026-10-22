import { ArrowUp, Globe, Mail, MapPin, Navigation, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { footerNav, siteConfig } from "@/content/site";
import { Container } from "./Section";
import { SiteLogo } from "./SiteLogo";
import { SocialLinks } from "./SocialLinks";

function FooterColumn({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="mb-5 flex items-center gap-2 font-display text-sm font-extrabold tracking-[0.18em] text-white uppercase">
        <span aria-hidden className="h-4 w-1 rounded-full bg-vif" />
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="text-sm text-white/70 transition-colors hover:text-white hover:underline hover:decoration-vif hover:decoration-2 hover:underline-offset-4">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pied de page : appel à la pré-inscription, présentation, liens, coordonnées et carte, barre basse. */
export function SiteFooter() {
  const { address } = siteConfig;
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto bg-nuit text-white/80">
      <div className="relative">
        <div aria-hidden className="bg-avenida-pattern pointer-events-none absolute inset-0 opacity-[0.04]" />
        <Container className="relative grid gap-12 pt-16 pb-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-5 lg:col-span-4">
            <SiteLogo inverted />
            <p className="text-sm leading-relaxed">
              Centre de formation aux métiers de l&apos;hôtellerie, de la restauration et du tourisme, adossé à un hôtel d&apos;application à
              Lomé. Diplômes d&apos;État du CFA au BTS, cours du jour et du soir, internat.
            </p>
            <blockquote className="border-l-2 border-vif pl-4 font-elegant text-lg text-white italic">« {siteConfig.tagline} »</blockquote>
            <SocialLinks brand />
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="L'École" items={footerNav.school} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title="L'Hôtel" items={footerNav.hotel} />
          </div>

          <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-4">
            <h2 className="flex items-center gap-2 font-display text-sm font-extrabold tracking-[0.18em] text-white uppercase">
              <span aria-hidden className="h-4 w-1 rounded-full bg-vif" />
              Nous trouver
            </h2>
            <address className="flex flex-col gap-3 text-sm not-italic">
              <p className="flex gap-3">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-vif-clair" />
                <span>
                  {address.street}, {address.district}
                  <br />
                  {address.postal} {address.city} – {address.country}
                </span>
              </p>
              <p className="flex gap-3">
                <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-vif-clair" />
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                  {siteConfig.phones.map((p) => (
                    <a key={p.e164} href={`tel:${p.e164}`} className="hover:text-white">
                      {p.display}
                    </a>
                  ))}
                </span>
              </p>
              <p className="flex gap-3">
                <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-vif-clair" />
                <a href={`mailto:${siteConfig.email}`} className="break-all hover:text-white">
                  {siteConfig.email}
                </a>
              </p>
              <p className="flex gap-3">
                <Globe aria-hidden className="mt-0.5 size-4 shrink-0 text-vif-clair" />
                {siteConfig.website}
              </p>
            </address>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <iframe title="Plan d'accès à l'Hôtel École Avenida" src={siteConfig.mapsEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-40 w-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={siteConfig.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-avenida-blue-950 transition-colors hover:bg-red-50">
                <Navigation aria-hidden className="size-4 text-vif" />
                Itinéraire
                <span className="sr-only">(nouvel onglet)</span>
              </a>
              <Link href="/connexion" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-bold text-white hover:border-vif hover:bg-vif">
                <UserRound aria-hidden className="size-4" />
                Élèves, parents, professeurs
              </Link>
            </div>
          </div>
        </Container>
      </div>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 text-xs sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p>© {year} Hôtel École Avenida · Lomé, Togo · {siteConfig.motto}</p>
            <p className="text-white/60">
              Site conçu et réalisé par <strong className="font-elegant text-sm font-bold text-or italic">Lovelight Coopération House</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/confidentialite" className="hover:text-white hover:underline">
              Politique de confidentialité
            </Link>
            <Link href="/conditions-utilisation" className="hover:text-white hover:underline">
              Conditions d&apos;utilisation
            </Link>
            <Link href="/connexion" className="rounded-full border border-white/15 px-3 py-1.5 hover:border-vif hover:text-white">
              Espace de gestion
            </Link>
            <a href="#top" className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 hover:border-vif hover:text-white">
              <ArrowUp aria-hidden className="size-3.5" />
              Haut de page
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}
