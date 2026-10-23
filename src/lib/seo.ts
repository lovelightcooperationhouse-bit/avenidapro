import { siteConfig } from "@/content/site";
import type { SiteContact } from "@/lib/site-contact";

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.hotelecoleavenida.net").replace(/\/$/, "");

/** Noms sous lesquels on cherche l'établissement (Google les rattache au site officiel). */
export const SEARCH_NAMES = ["Hôtel École Avenida", "Hotel Ecole Avenida", "Hôtel Avenida", "Hotel Avenida", "École Avenida", "Ecole Avenida", "Avenida Lomé", "Hôtel Avenida Lomé"];

export const SEO_KEYWORDS = [
  ...SEARCH_NAMES,
  "hotel avenida lomé",
  "ecole avenida lomé",
  "école hôtelière Lomé",
  "école hôtelière Togo",
  "formation hôtellerie restauration Lomé",
  "BTS hôtellerie Togo",
  "CAP cuisine Lomé",
  "hôtel Cocoteraie Lomé",
  "hôtel Lomé réservation en ligne",
];

/**
 * Données structurées (schema.org) : le site, l'école hôtelière et l'hôtel d'application,
 * avec leurs différents noms, adresse et contacts, pour que Google affiche la fiche officielle.
 */
export function structuredData(contact: SiteContact) {
  const address = {
    "@type": "PostalAddress",
    streetAddress: `${contact.address.street}, ${contact.address.district}`,
    postOfficeBoxNumber: contact.address.postal,
    addressLocality: contact.address.city,
    addressCountry: "TG",
  };
  const phones = contact.phones.map((p) => p.e164);
  const sameAs = Object.values(siteConfig.socials).filter(Boolean);
  const logo = `${SITE_URL}/logo-avenida.png`;
  const images = [`${SITE_URL}/site/reel/facade-ecole.webp`, `${SITE_URL}/site/reel/entree-hotel.webp`, `${SITE_URL}/site/reel/chambre-renovee.webp`];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#site`,
        url: `${SITE_URL}/`,
        name: siteConfig.name,
        alternateName: SEARCH_NAMES.filter((n) => n !== siteConfig.name),
        inLanguage: "fr",
        publisher: { "@id": `${SITE_URL}/#ecole` },
      },
      {
        "@type": ["EducationalOrganization", "CollegeOrUniversity"],
        "@id": `${SITE_URL}/#ecole`,
        name: siteConfig.name,
        alternateName: ["École Avenida", "Ecole Avenida", "Hotel Ecole Avenida"],
        description: "École hôtelière à Lomé (Togo) : formations CFA, CAP, BEP, BT et BTS en cuisine, restaurant, réception et hébergement, avec un hôtel d'application.",
        url: `${SITE_URL}/ecole`,
        logo,
        image: images,
        email: contact.email,
        telephone: phones[0],
        address,
        slogan: siteConfig.motto,
        sameAs,
        subOrganization: { "@id": `${SITE_URL}/#hotel` },
      },
      {
        "@type": "Hotel",
        "@id": `${SITE_URL}/#hotel`,
        name: "Hôtel Avenida",
        alternateName: ["Hôtel École Avenida", "Hotel Avenida Lomé", "Avenida Hotel"],
        description: "Hôtel d'application de l'École Avenida à la Cocoteraie, Lomé : chambres, restaurant et bar, réservation et paiement en ligne.",
        url: `${SITE_URL}/hotel`,
        logo,
        image: images.slice(1),
        email: contact.email,
        telephone: phones[0],
        address,
        priceRange: "$$",
        currenciesAccepted: "XOF",
        paymentAccepted: "Espèces, Mixx by Yas, Moov Money, carte bancaire",
        parentOrganization: { "@id": `${SITE_URL}/#ecole` },
        potentialAction: { "@type": "ReserveAction", target: `${SITE_URL}/hotel#reserver` },
      },
    ],
  };
}
