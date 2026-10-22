import { ArrowUp, Globe, LayoutDashboard, Mail, MapPin, Navigation, Phone } from "lucide-react";
import Link from "next/link";
import { footerNav, siteConfig } from "@/content/site";
import { Container } from "./Section";
import { SiteLogo } from "./SiteLogo";
import { TikTokIcon } from "./TikTokIcon";

function FooterColumn({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="mb-4 font-display text-sm font-bold tracking-wider text-white uppercase">{title}</h2>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-sm text-white/70 transition-colors hover:text-red-300">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pied de page : présentation, liens École / Hôtel, coordonnées et carte, barre basse. */
export function SiteFooter() {
  const { address } = siteConfig;
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto bg-avenida-blue-950 text-white/80">
      {/* Liseré tricolore en transition avec la page */}
      <svg aria-hidden viewBox="0 0 1440 48" preserveAspectRatio="none" className="absolute inset-x-0 -top-px h-6 w-full text-white sm:h-10">
        <path d="M0 0h1440v8c-240 40-480 40-720 16S240-8 0 24z" fill="currentColor" />
        <path d="M0 24c240-32 480-24 720 0s480 40 720 0" fill="none" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
      </svg>

      <Container className="grid gap-10 pt-20 pb-12 sm:pt-24 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-5 lg:col-span-4">
          <SiteLogo inverted />
          <p className="text-sm leading-relaxed">
            Centre de formation aux métiers de l&apos;hôtellerie, de la restauration et du tourisme, adossé à un hôtel d&apos;application
            à Lomé. Diplômes d&apos;État du CFA au BTS, cours du jour et du soir, internat.
          </p>
          <blockquote className="border-l-2 border-avenida-red pl-4 text-sm text-white italic">« {siteConfig.tagline} »</blockquote>
          <a
            href={siteConfig.socials.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white hover:text-avenida-blue"
          >
            <TikTokIcon className="size-4" />
            @hotelecoleavenida
            <span className="sr-only">(nouvel onglet)</span>
          </a>
        </div>

        <div className="lg:col-span-2">
          <FooterColumn title="L'École" items={footerNav.school} />
        </div>
        <div className="lg:col-span-2">
          <FooterColumn title="L'Hôtel" items={footerNav.hotel} />
        </div>

        <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-4">
          <h2 className="font-display text-sm font-bold tracking-wider text-white uppercase">Nous trouver</h2>
          <address className="flex flex-col gap-3 text-sm not-italic">
            <p className="flex gap-3">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-red-400" />
              <span>
                {address.street}
                <br />
                {address.district}
                <br />
                {address.postal} {address.city} – {address.country}
              </span>
            </p>
            <p className="flex gap-3">
              <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-red-400" />
              <span className="flex flex-col gap-1">
                {siteConfig.phones.map((p) => (
                  <a key={p.e164} href={`tel:${p.e164}`} className="hover:text-red-300">
                    {p.display}
                  </a>
                ))}
              </span>
            </p>
            <p className="flex gap-3">
              <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-red-400" />
              <a href={`mailto:${siteConfig.email}`} className="break-all hover:text-red-300">
                {siteConfig.email}
              </a>
            </p>
            <p className="flex gap-3">
              <Globe aria-hidden className="mt-0.5 size-4 shrink-0 text-red-400" />
              {siteConfig.website}
            </p>
          </address>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <iframe
              title="Plan d'accès à l'Hôtel École Avenida"
              src={siteConfig.mapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-44 w-full grayscale-[30%]"
            />
          </div>
          <a
            href={siteConfig.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-avenida-blue transition-colors hover:bg-red-50"
          >
            <Navigation aria-hidden className="size-4" />
            Itinéraire
            <span className="sr-only">(nouvel onglet)</span>
          </a>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 text-xs sm:flex-row">
          <p>© {year} Hôtel École Avenida · Lomé, Togo. Tous droits réservés.</p>
          <div className="flex items-center gap-3">
            <Link href="/connexion" className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 hover:border-red-300 hover:text-red-300">
              <LayoutDashboard aria-hidden className="size-3.5" />
              Espace de gestion
            </Link>
            <a href="#top" className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 hover:border-red-300 hover:text-red-300">
              <ArrowUp aria-hidden className="size-3.5" />
              Haut de page
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}
