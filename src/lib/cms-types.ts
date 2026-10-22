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

export type CmsSettings = {
  hero?: HeroSlideSetting[];
  bandeau?: { text: string; href?: string; visible: boolean };
  socials?: Partial<Record<"facebook" | "instagram" | "tiktok" | "youtube" | "linkedin" | "whatsapp", string>>;
  footer?: { about?: string };
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
