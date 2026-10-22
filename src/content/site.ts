import {
  BedDouble,
  BookOpenCheck,
  CalendarDays,
  ChefHat,
  Clock,
  ConciergeBell,
  GraduationCap,
  Home,
  Info,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Contenus du site vitrine (site public).
 * Source : brochure officielle « Au menu 2026-2027 » et carnet de correspondance
 * (docs/reference_docs/). Les valeurs marquées ⚠️ sont à confirmer par la direction.
 */

export const siteConfig = {
  name: "Hôtel École Avenida",
  motto: "Travail – Discipline – Excellence",
  tagline: "Former aujourd'hui les professionnels de demain !",
  domains: "Hôtellerie · Restauration · Tourisme",
  address: {
    street: "30, rue d'Almeida Léopold",
    district: "Cocoteraie, près de Pa de Souza",
    postal: "B.P. 2584",
    city: "Lomé",
    country: "Togo",
  },
  /** Lignes fixes de l'établissement (carnet de correspondance). */
  phones: [
    { display: "+228 22 21 46 72", e164: "+22822214672", whatsapp: false },
    { display: "+228 22 22 01 01", e164: "+22822220101", whatsapp: false },
  ],
  /** Numéros des inscriptions (brochure). ⚠️ À vérifier : lus sur un scan. */
  admissionsPhones: [
    { display: "+228 96 64 00 00", e164: "+22896640000" },
    { display: "+228 92 58 17 48", e164: "+22892581748" },
    { display: "+228 97 53 88 43", e164: "+22897538843" },
    { display: "+228 79 73 21 01", e164: "+22879732101" },
    { display: "+228 99 24 91 29", e164: "+22899249129" },
  ],
  /** Numéro utilisé pour les boutons WhatsApp. ⚠️ À confirmer. */
  whatsapp: "+22896640000",
  email: "avenidahotel1994@gmail.com",
  website: "www.hotelecoleavenida.com",
  officeHours: "Bureau ouvert du lundi au vendredi, de 9 h à 14 h",
  socials: {
    tiktok: "https://www.tiktok.com/@hotelecoleavenida",
  },
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rue+d%27Almeida+L%C3%A9opold+Cocoteraie+Lom%C3%A9+Togo",
  mapsEmbedUrl: "https://www.google.com/maps?q=Cocoteraie,+Lom%C3%A9,+Togo&z=15&output=embed",
} as const;

export const whatsappUrl = (e164: string, text?: string) =>
  `https://wa.me/${e164.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export type SiteImage = { src: string; alt: string };

export const images = {
  building: { src: "/avenida_building.jpg", alt: "Façade bleu, blanc et rouge du bâtiment de l'Hôtel École Avenida à Lomé" },
  kitchen: { src: "/site/cuisine.jpg", alt: "Élèves cuisiniers en tenue au travail pratique en cuisine" },
  students: { src: "/site/eleves.jpg", alt: "Élèves de l'Hôtel École Avenida en uniforme" },
  housekeeping: { src: "/site/hebergement.jpg", alt: "Apprenant en travaux pratiques d'hébergement, préparation d'un lit" },
} satisfies Record<string, SiteImage>;

/* ─────────────────────────── Navigation ─────────────────────────── */

export type NavChild = { label: string; description: string; href: string; icon: LucideIcon };
export type NavEntry = { label: string; href: string; children?: NavChild[] };

export const mainNav: NavEntry[] = [
  { label: "Accueil", href: "/" },
  {
    label: "L'École",
    href: "/ecole",
    children: [
      { label: "Nos formations", description: "CFA, CAP, BEP, BT et BTS", href: "/ecole#formations", icon: GraduationCap },
      { label: "Spécialités", description: "Cuisine, restaurant, réception, hébergement", href: "/ecole#specialites", icon: ChefHat },
      { label: "Cours du jour et du soir", description: "Des horaires adaptés à chacun", href: "/ecole#horaires", icon: Clock },
    ],
  },
  {
    label: "Admissions",
    href: "/admissions",
    children: [
      { label: "Frais et paiement", description: "Inscription, scolarité, tranches", href: "/admissions#tarifs", icon: Wallet },
      { label: "Dossier à fournir", description: "Les pièces à préparer", href: "/admissions#dossier", icon: BookOpenCheck },
      { label: "Rentrées 2026-2027", description: "Trois rentrées dans l'année", href: "/admissions#rentrees", icon: CalendarDays },
      { label: "Internat", description: "Loger sur place pendant la formation", href: "/admissions#internat", icon: Home },
    ],
  },
  {
    label: "L'Hôtel",
    href: "/hotel",
    children: [
      { label: "Chambres", description: "Séjourner à l'Hôtel École", href: "/hotel#chambres", icon: BedDouble },
      { label: "Restaurant & bar", description: "Une table tenue par nos élèves", href: "/hotel#restaurant", icon: Utensils },
      { label: "Réserver", description: "Par téléphone ou WhatsApp", href: "/hotel#reserver", icon: ConciergeBell },
    ],
  },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
];

export const footerNav = {
  school: [
    { label: "Nos formations", href: "/ecole#formations" },
    { label: "Spécialités", href: "/ecole#specialites" },
    { label: "Frais et paiement", href: "/admissions#tarifs" },
    { label: "Dossier à fournir", href: "/admissions#dossier" },
    { label: "Internat", href: "/admissions#internat" },
  ],
  hotel: [
    { label: "L'Hôtel", href: "/hotel" },
    { label: "Chambres", href: "/hotel#chambres" },
    { label: "Restaurant & bar", href: "/hotel#restaurant" },
    { label: "À propos", href: "/a-propos" },
    { label: "Contact", href: "/contact" },
  ],
};

/** Vrai si `href` correspond à la page courante ou à l'une de ses sous-pages. */
export function isActivePath(pathname: string, href: string) {
  const path = href.split("#")[0];
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

/* ─────────────────────────── Accueil ─────────────────────────── */

export type HeroSlide = { image: SiteImage; eyebrow: string; title: [string, string, string]; subtitle: string };

export const heroSlides: HeroSlide[] = [
  {
    image: images.kitchen,
    eyebrow: "Hôtellerie · Restauration · Tourisme",
    title: ["Former aujourd'hui les", "professionnels", "de demain"],
    subtitle: "Du CFA au BTS, des diplômes d'État pour apprendre un métier de l'hôtellerie et de la restauration, au cœur de Lomé.",
  },
  {
    image: images.students,
    eyebrow: "Rentrées 2026-2027",
    title: ["Un métier entre les mains,", "un avenir", "devant soi"],
    subtitle: "Trois rentrées dans l'année, des cours du jour ou du soir, un internat sur place et un paiement en 8 tranches.",
  },
  {
    image: images.housekeeping,
    eyebrow: "Un vrai hôtel d'application",
    title: ["Apprendre", "sur le terrain,", "dès la première année"],
    subtitle: "Cuisine, service, réception et hébergement : nos élèves pratiquent dans les conditions réelles d'un hôtel.",
  },
  {
    image: images.building,
    eyebrow: "Travail – Discipline – Excellence",
    title: ["Bienvenue à", "l'Hôtel École", "Avenida"],
    subtitle: "Une école de formation et un hôtel, réunis dans un même établissement de la Cocoteraie, à Lomé.",
  },
];

export const keyFigures = [
  { value: 5, suffix: "", label: "Niveaux de diplômes, du CFA au BTS" },
  { value: 8, suffix: "", label: "Spécialités enseignées" },
  { value: 3, suffix: "", label: "Rentrées par année scolaire" },
  { value: 8, suffix: "", label: "Tranches pour payer la scolarité" },
];

/* ─────────────────────────── Formations ─────────────────────────── */

export type Formation = {
  code: string;
  name: string;
  level: string;
  duration: string;
  specialties: string[];
  registration: number;
  tuition: number;
};

export const formations: Formation[] = [
  {
    code: "CFA",
    name: "Certificat de fin d'apprentissage",
    level: "Accessible sans diplôme",
    duration: "1 an",
    specialties: ["Cuisine", "Pâtisserie"],
    registration: 10000,
    tuition: 260000,
  },
  {
    code: "CAP",
    name: "Certificat d'aptitude professionnelle",
    level: "Niveau 4ᵉ ou 3ᵉ",
    duration: "2 ans",
    specialties: ["Cuisine / Pâtisserie", "Restaurant / Bar", "Réception / Étages", "Boucherie / Charcuterie"],
    registration: 10000,
    tuition: 260000,
  },
  {
    code: "BEP",
    name: "Brevet d'études professionnelles",
    level: "Niveau BEPC",
    duration: "2 ans",
    specialties: ["Cuisine / Pâtisserie", "Restaurant / Bar", "Réception / Étages", "Lingerie / Buanderie"],
    registration: 10000,
    tuition: 330000,
  },
  {
    code: "BT",
    name: "Brevet de technicien",
    level: "Niveau BEPC",
    duration: "3 ans",
    specialties: ["Restauration", "Hébergement"],
    registration: 10000,
    tuition: 330000,
  },
  {
    code: "BTS",
    name: "Brevet de technicien supérieur",
    level: "BAC ou BT",
    duration: "2 ans",
    specialties: ["Restauration", "Hébergement"],
    registration: 20000,
    tuition: 420000,
  },
];

export const specialties: { title: string; text: string; levels: string; icon: LucideIcon; image: SiteImage }[] = [
  {
    title: "Cuisine & pâtisserie",
    text: "Techniques culinaires, pâtisserie, hygiène et organisation d'une brigade de cuisine.",
    levels: "CFA, CAP et BEP ; boucherie-charcuterie en CAP",
    icon: ChefHat,
    image: images.kitchen,
  },
  {
    title: "Restaurant & bar",
    text: "Accueil des clients, service en salle, mise en place, bar et arts de la table.",
    levels: "CAP et BEP (restaurant / bar), BT et BTS (restauration)",
    icon: Utensils,
    image: images.students,
  },
  {
    title: "Réception & hébergement",
    text: "Accueil, réservations, gestion des chambres, étages, lingerie et buanderie.",
    levels: "CAP et BEP (réception / étages, lingerie), BT et BTS (hébergement)",
    icon: ConciergeBell,
    image: images.housekeeping,
  },
];

export const studyOptions = [
  "Diplômes d'État",
  "Formation continue",
  "Modulaire à la carte",
  "Cours du jour et du soir",
  "Internat",
];

export const schedules = [
  { label: "Cours du jour", hours: "Du lundi au vendredi, de 7 h 30 à 14 h 30" },
  { label: "Cours du soir", hours: "Du lundi au vendredi, de 18 h 30 à 21 h 30" },
];

/* ─────────────────────────── Admissions ─────────────────────────── */

export const intakes = ["26 octobre 2026", "28 janvier 2027", "13 mai 2027"];

export const requiredDocuments = [
  "1 copie de l'acte de naissance",
  "Les derniers bulletins ou relevés de notes",
  "4 photos d'identité",
  "1 certificat médical",
  "1 paquet de rames de papier (500 feuilles)",
];

export const fees = {
  suppliesDiploma: 75000,
  suppliesCfa: 45000,
  boardingMonthly: 30000,
  boardingDepositMonths: 3,
};

export const paymentFacts = [
  { title: "8 tranches mensuelles", text: "ou 3 tranches trimestrielles, dès l'inscription." },
  { title: "Bourses", text: "Attribuées sur étude de dossier." },
  { title: "Fournitures", text: "75 000 F pour BTS, BT, BEP et CAP · 45 000 F pour le CFA et le modulaire." },
];

export const aboutValues = [
  { title: "Travail", text: "Un métier s'apprend par la pratique, chaque jour, en cuisine, en salle et à la réception.", icon: ChefHat },
  { title: "Discipline", text: "Tenue, ponctualité et rigueur : les exigences d'un vrai hôtel, dès la formation.", icon: Clock },
  { title: "Excellence", text: "Des diplômes d'État et des professionnels prêts pour l'hôtellerie et le tourisme.", icon: GraduationCap },
];

export const contactTopics = [
  { value: "Inscription", icon: GraduationCap },
  { value: "Réservation hôtel", icon: BedDouble },
  { value: "Restaurant", icon: Utensils },
  { value: "Autre demande", icon: Info },
];


export const formatCFA = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/ /g, " ")} F`;
