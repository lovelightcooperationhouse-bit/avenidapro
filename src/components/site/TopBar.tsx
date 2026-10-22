import { Clock, Mail, MapPin, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import type { SiteContact } from "@/lib/site-contact";
import { Container } from "./Section";
import { LiveClock } from "./LiveClock";
import { SocialLinks } from "./SocialLinks";

/** Bandeau au-dessus du menu : téléphone, e-mail, adresse, horaires et réseaux sociaux. */
export function TopBar({ contact }: { contact: SiteContact }) {
  const [phone, phone2] = contact.phones;

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
            <a
              href={`tel:${phone.e164}`}
              aria-label={`Appeler le ${phone.display}`}
              className="flex items-center gap-1.5 font-semibold whitespace-nowrap text-white hover:text-vif-clair"
            >
              <Phone aria-hidden className="size-3.5 shrink-0 text-vif-clair" />
              {phone.display}
            </a>
          </li>
          {phone2 && (
            <li className="hidden xl:block">
              <a
                href={`tel:${phone2.e164}`}
                aria-label={`Appeler le ${phone2.display}`}
                className="whitespace-nowrap text-white/85 hover:text-vif-clair"
              >
                {phone2.display}
              </a>
            </li>
          )}
          <li>
            <a
              href={`mailto:${contact.email}`}
              aria-label={`Écrire à ${contact.email}`}
              className="flex items-center gap-1.5 text-white/85 hover:text-vif-clair"
            >
              <Mail aria-hidden className="size-3.5 shrink-0 text-vif-clair" />
              <span className="hidden xl:inline">{contact.email}</span>
            </a>
          </li>
          <li className="hidden items-center gap-1.5 text-white/70 2xl:flex">
            <MapPin aria-hidden className="size-3.5 text-vif-clair" />
            {contact.address.district}, {contact.address.city}
          </li>
        </ul>

        <div className="flex shrink-0 items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-white/85 xl:flex"
            title="Horaires du bureau"
          >
            <Clock aria-hidden className="size-3.5 text-or" />
            Bureau : lun. – ven. · 9 h – 14 h
          </span>
          <LiveClock className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-white/85 md:flex" />
          <Link
            href="/connexion"
            className="hidden items-center gap-1.5 rounded-full bg-vif px-3 py-1 font-bold text-white hover:bg-vif-fonce sm:flex"
          >
            <UserRound aria-hidden className="size-3.5" />
            Mon espace
          </Link>
          <SocialLinks size="sm" brand className="gap-1.5" />
        </div>
      </Container>
    </div>
  );
}
