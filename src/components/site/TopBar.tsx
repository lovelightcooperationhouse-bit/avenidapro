import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/content/site";
import { Container } from "./Section";
import { SocialLinks } from "./SocialLinks";

/** Bandeau au-dessus du menu : téléphone, e-mail, adresse, horaires et réseaux sociaux. */
export function TopBar() {
  const [phone, phone2] = siteConfig.phones;

  return (
    <div className="relative bg-nuit text-white">
      <span aria-hidden className="absolute inset-x-0 bottom-0 flex h-[3px]">
        <span className="flex-1 bg-avenida-blue" />
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-vif" />
      </span>
      <Container className="flex min-h-11 items-center justify-between gap-3 py-1.5 text-xs sm:text-[13px]">
        <ul className="flex min-w-0 items-center gap-x-5">
          <li>
            <a href={`tel:${phone.e164}`} aria-label={`Appeler le ${phone.display}`} className="flex items-center gap-1.5 font-semibold whitespace-nowrap text-white hover:text-vif-clair">
              <Phone aria-hidden className="size-3.5 shrink-0 text-vif-clair" />
              {phone.display}
            </a>
          </li>
          <li className="hidden lg:block">
            <a href={`tel:${phone2.e164}`} aria-label={`Appeler le ${phone2.display}`} className="whitespace-nowrap text-white/85 hover:text-vif-clair">
              {phone2.display}
            </a>
          </li>
          <li>
            <a href={`mailto:${siteConfig.email}`} aria-label={`Écrire à ${siteConfig.email}`} className="flex items-center gap-1.5 text-white/85 hover:text-vif-clair">
              <Mail aria-hidden className="size-3.5 shrink-0 text-vif-clair" />
              <span className="hidden sm:inline">{siteConfig.email}</span>
            </a>
          </li>
          <li className="hidden items-center gap-1.5 text-white/70 xl:flex">
            <MapPin aria-hidden className="size-3.5 text-vif-clair" />
            {siteConfig.address.district}, {siteConfig.address.city}
          </li>
        </ul>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden items-center gap-1.5 text-white/70 md:flex">
            <Clock aria-hidden className="size-3.5 text-vif-clair" />
            Lun – Ven · 9 h – 14 h
          </span>
          <span aria-hidden className="hidden h-4 w-px bg-white/20 md:block" />
          <SocialLinks size="sm" className="gap-0.5" itemClassName="text-white/85 hover:bg-vif hover:text-white" />
        </div>
      </Container>
    </div>
  );
}
