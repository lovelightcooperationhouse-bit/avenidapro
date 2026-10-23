/** Contenu du site géré depuis l'administration (tables site_*). */

export type CmsMenuItem = {
  id: string;
  parent_id: string | null;
  label: string;
  href: string;
  description: string | null;
  icon: string | null;
  position: number;
  visible: boolean;
};

export type CmsMedia = { url: string; alt?: string; caption?: string };

export type CmsSection = {
  id: string;
  page: string;
  position: number;
  kind: "texte" | "image" | "video" | "galerie" | "publications" | "appel";
  eyebrow: string | null;
  title: string | null;
  body: string | null;
  media: CmsMedia[];
  video_url: string | null;
  button_label: string | null;
  button_href: string | null;
  tone: "clair" | "gris" | "sombre" | "vif";
  visible: boolean;
};

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  description: string | null;
  header_image: string | null;
  published: boolean;
};

export type CmsPost = {
  id: string;
  slug: string;
  kind: "article" | "annonce" | "evenement" | "photos" | "video";
  title: string;
  excerpt: string | null;
  body: string | null;
  cover: string | null;
  media: CmsMedia[];
  video_url: string | null;
  audience: "public" | "membres";
  published: boolean;
  pinned: boolean;
  published_at: string;
};

export type HeroSlideSetting = { image: string; alt?: string; focus?: string; eyebrow: string; title: string; highlight?: string; titleEnd?: string; subtitle: string };

export type ThemeSetting = { blue?: string; vif?: string; or?: string; nuit?: string };
export type ContactSetting = {
  phones?: string[];
  email?: string;
  street?: string;
  district?: string;
  postal?: string;
  city?: string;
  country?: string;
  hours?: string;
  whatsapp?: string;
  mapsUrl?: string;
  website?: string;
};

/** Sections intégrées de l'accueil que l'on peut masquer. */
export const HOME_SECTIONS = [
  { key: "chiffres", label: "Chiffres clés" },
  { key: "apropos", label: "L'excellence, notre passion" },
  { key: "formations", label: "Nos formations" },
  { key: "pedagogie", label: "Pédagogie" },
  { key: "etapes", label: "Étapes d'admission" },
  { key: "metiers", label: "Débouchés / métiers" },
  { key: "hotel", label: "L'Hôtel" },
  { key: "faq", label: "Questions fréquentes" },
  { key: "appel", label: "Appel final (pré-inscription)" },
] as const;

export type FooterLink = { label: string; href: string };
export type FooterSetting = { about?: string; tagline?: string; col1?: { title?: string; links?: FooterLink[] }; col2?: { title?: string; links?: FooterLink[] } };

export type CardSettings = {
  motto?: string;
  signatureTitle?: string;
  /** Nom du signataire et signature scannée (image), au verso. */
  signatoryName?: string;
  signatureImage?: string;
  phone?: string;
  email?: string;
  address?: string;
  /** Texte du verso par catégorie (eleve, professeur, personnel, hotel, client). */
  rules?: Partial<Record<"eleve" | "professeur" | "personnel" | "hotel" | "client", string>>;
};

export type CmsSettings = {
  theme?: ThemeSetting;
  contact?: ContactSetting;
  home_hidden?: string[];
  /** Remplacement des images du site (clé de l'emplacement → image). */
  images?: Record<string, { src: string; alt?: string }>;
  /** Textes et réglages communs des cartes (recto, verso, signature). */
  cards?: CardSettings;
  /** En-têtes des pages (sur-titre, titre, introduction, photo), par clé de page. */
  page_headers?: Record<string, { eyebrow?: string; title?: string; description?: string; image?: string }>;
  hero?: HeroSlideSetting[];
  bandeau?: { text: string; href?: string; visible: boolean };
  socials?: Partial<Record<"facebook" | "instagram" | "tiktok" | "youtube" | "linkedin" | "whatsapp", string>>;
  footer?: FooterSetting;
};

/** Pages du site auxquelles on peut ajouter des sections. */
export const BUILTIN_PAGES = [
  { key: "accueil", label: "Accueil", href: "/" },
  { key: "ecole", label: "L'École", href: "/ecole" },
  { key: "admissions", label: "Admissions", href: "/admissions" },
  { key: "hotel", label: "L'Hôtel", href: "/hotel" },
  { key: "a-propos", label: "À propos", href: "/a-propos" },
  { key: "contact", label: "Contact", href: "/contact" },
  { key: "actualites", label: "Actualités", href: "/actualites" },
] as const;

/** Pages dont l'en-tête (bandeau photo) est modifiable. */
export const HEADER_PAGES = [
  { key: "ecole", label: "L'École", href: "/ecole" },
  { key: "admissions", label: "Admissions", href: "/admissions" },
  { key: "preinscription", label: "Pré-inscription", href: "/preinscription" },
  { key: "hotel", label: "L'Hôtel", href: "/hotel" },
  { key: "a-propos", label: "À propos", href: "/a-propos" },
  { key: "actualites", label: "Actualités", href: "/actualites" },
  { key: "contact", label: "Contact", href: "/contact" },
  { key: "reglement", label: "Règlement intérieur", href: "/reglement" },
  { key: "confidentialite", label: "Politique de confidentialité", href: "/confidentialite" },
  { key: "conditions-utilisation", label: "Conditions d'utilisation", href: "/conditions-utilisation" },
] as const;

export const POST_KINDS: { value: CmsPost["kind"]; label: string }[] = [
  { value: "article", label: "Article" },
  { value: "annonce", label: "Annonce" },
  { value: "evenement", label: "Événement" },
  { value: "photos", label: "Album photo" },
  { value: "video", label: "Vidéo" },
];

/** Lien d'intégration pour YouTube, Vimeo ou Facebook ; null pour une vidéo hébergée (mp4). */
export function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  if (/facebook\.com\/.+\/videos\//.test(url)) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
  return null;
}

/** Transforme un titre en adresse (slug). */
export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
