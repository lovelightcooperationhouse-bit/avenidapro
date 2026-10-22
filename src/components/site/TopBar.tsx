import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/content/site";
import { Container } from "./Section";
import { TikTokIcon } from "./TikTokIcon";

/**
 * Bandeau au-dessus du menu : téléphone, e-mail, adresse et réseaux sociaux.
 * Sur mobile, seuls le téléphone, l'icône e-mail et les réseaux restent visibles.
 */
export function TopBar() {
  const [phone, phone2] = siteConfig.phones;

  return (
    <div className="bg-avenida-blue-950 text-white">
      <Container className="flex min-h-10 items-center justify-between gap-3 py-1 text-xs sm:text-[13px]">
        <ul className="flex min-w-0 items-center gap-x-4">
          <li>
            <a href={`tel:${phone.e164}`} aria-label={`Appeler le ${phone.display}`} className="flex items-center gap-1.5 font-medium whitespace-nowrap text-white/90 hover:text-red-300">
              <Phone aria-hidden className="size-3.5 shrink-0 text-red-400" />
              {phone.display}
            </a>
          </li>
          <li className="hidden lg:block">
            <a href={`tel:${phone2.e164}`} aria-label={`Appeler le ${phone2.display}`} className="whitespace-nowrap text-white/90 hover:text-red-300">
              {phone2.display}
            </a>
          </li>
          <li>
            <a href={`mailto:${siteConfig.email}`} aria-label={`Écrire à ${siteConfig.email}`} className="flex items-center gap-1.5 text-white/90 hover:text-red-300">
              <Mail aria-hidden className="size-3.5 shrink-0 text-red-400" />
              <span className="hidden sm:inline">{siteConfig.email}</span>
            </a>
          </li>
          <li className="hidden items-center gap-1.5 text-white/75 xl:flex">
            <MapPin aria-hidden className="size-3.5 text-red-400" />
            {siteConfig.address.district}, {siteConfig.address.city}
          </li>
        </ul>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden items-center gap-1.5 text-white/75 md:flex">
            <Clock aria-hidden className="size-3.5 text-red-400" />
            Lun – Ven · 9 h – 14 h
          </span>
          <a
            href={siteConfig.socials.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok de l'Hôtel École Avenida (nouvel onglet)"
            className="flex size-7 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-red-300"
          >
            <TikTokIcon className="size-3.5" />
          </a>
        </div>
      </Container>
    </div>
  );
}
