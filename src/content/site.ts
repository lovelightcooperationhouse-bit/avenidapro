import {
  Award,
  BedDouble,
  BookOpenCheck,
  Briefcase,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Clock,
  ConciergeBell,
  FileCheck2,
  GraduationCap,
  Handshake,
  Home,
  Info,
  MessageSquare,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Contenus du site vitrine (site public).
 * Source : brochure officielle « Au menu 2026-2027 », carnet de correspondance (docs/reference_docs/)
 * et visuels de marque (docs/visuels/). Les valeurs marquées ⚠️ sont à confirmer par la direction.
 */

export const siteConfig = {
  name: "Hôtel École Avenida",
  motto: "Travail – Discipline – Excellence",
  signature: "L'excellence, notre passion",
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
    { display: "+228 22 21 46 72", e164: "+22822214672" },
    { display: "+228 22 22 01 01", e164: "+22822220101" },
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
  officeHours: "Du lundi au vendredi, de 9 h à 14 h",
  /**
   * Réseaux sociaux, dans l'ordre d'affichage. Une URL vide masque l'icône.
   * ⚠️ À compléter : Facebook, Instagram, YouTube et LinkedIn (adresses des pages officielles).
   */
  socials: {
    facebook: "",
    instagram: "",
    tiktok: "https://www.tiktok.com/@hotelecoleavenida",
    youtube: "",
    linkedin: "",
    whatsapp: "https://wa.me/22896640000",
  },
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rue+d%27Almeida+L%C3%A9opold+Cocoteraie+Lom%C3%A9+Togo",
  mapsEmbedUrl: "https://www.google.com/maps?q=Cocoteraie,+Lom%C3%A9,+Togo&z=15&output=embed",
} as const;

export type SocialNetwork = keyof typeof siteConfig.socials;

export const whatsappUrl = (e164: string, text?: string) =>
  `https://wa.me/${e164.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export type SiteImage = { src: string; alt: string; /** Photo d'illustration (pas l'établissement). */ stock?: boolean };

export const images = {
  building: { src: "/avenida_building.jpg", alt: "Façade bleu, blanc et rouge du bâtiment de l'Hôtel École Avenida à Lomé" },
  chef: { src: "/site/chef.webp", alt: "Élève cuisinier portant la toque officielle Avenida aux motifs bleu, blanc, rouge" },
  uniforms: { src: "/site/uniformes.webp", alt: "Une élève et un élève de l'Hôtel École Avenida en uniforme officiel" },
  graduates: { src: "/site/diplomes.webp", alt: "Diplômés de l'Hôtel École Avenida en toge officielle, diplôme en main" },
  waiter: { src: "/site/serveur.webp", alt: "Maître d'hôtel en gilet Avenida, plateau d'argent en main" },
  fabric: { src: "/site/tissu.webp", alt: "Tissu Avenida : losanges bleus, fleurs de lys, toques et couverts" },
  plating: { src: "/site/dressage.webp", alt: "Chef nappant de sauce une assiette dressée", stock: true },
  pastry: { src: "/site/patisserie.webp", alt: "Pâtissière en toque préparant une pâte", stock: true },
  service: { src: "/site/service-salle.webp", alt: "Service à table dans un restaurant gastronomique", stock: true },
  diningRoom: { src: "/site/salle-restaurant.webp", alt: "Salle de restaurant élégante, tables dressées", stock: true },
  reception: { src: "/site/reception.webp", alt: "Hall de réception d'un hôtel avec salon", stock: true },
  roomGarden: { src: "/site/chambre-jardin.webp", alt: "Chambre d'hôtel avec vue sur jardin", stock: true },
  roomComfort: { src: "/site/chambre-confort.webp", alt: "Chambre d'hôtel confort, grand lit et lampes de chevet", stock: true },
  roomSuite: { src: "/site/chambre-suite.webp", alt: "Suite lumineuse avec salon et grand lit", stock: true },
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
      { label: "Pédagogie", description: "Apprendre dans un vrai hôtel", href: "/ecole#pedagogie", icon: Sparkles },
      { label: "Cours du jour et du soir", description: "Des horaires adaptés à chacun", href: "/ecole#horaires", icon: Clock },
      { label: "Espace École (en ligne)", description: "Cours, devoirs et visio de votre filière", href: "/espace/ecole", icon: MonitorPlay },
    ],
  },
  {
    label: "Admissions",
    href: "/admissions",
    children: [
      { label: "Pré-inscription en ligne", description: "Déposez votre dossier en 5 minutes", href: "/preinscription", icon: ClipboardList },
      { label: "Frais et paiement", description: "Inscription, scolarité, 8 tranches", href: "/admissions#tarifs", icon: Wallet },
      { label: "Pièces à fournir", description: "La liste complète du dossier", href: "/admissions#dossier", icon: BookOpenCheck },
      { label: "Rentrées et internat", description: "Trois rentrées, logement sur place", href: "/admissions#rentrees", icon: CalendarDays },
    ],
  },
  {
    label: "L'Hôtel",
    href: "/hotel",
    children: [
      { label: "Chambres", description: "Séjourner à l'Hôtel École", href: "/hotel#chambres", icon: BedDouble },
      { label: "Restaurant & bar", description: "Une table tenue par nos élèves", href: "/hotel#restaurant", icon: Utensils },
      { label: "Demande de réservation", description: "Réponse rapide de la réception", href: "/hotel#reserver", icon: ConciergeBell },
      { label: "Espace Hôtel (personnel)", description: "Consignes, documents et réunions par service", href: "/espace/hotel", icon: Users },
    ],
  },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
];

export const footerNav = {
  school: [
    { label: "Nos formations", href: "/ecole#formations" },
    { label: "Spécialités", href: "/ecole#specialites" },
    { label: "Pré-inscription en ligne", href: "/preinscription" },
    { label: "Frais et paiement", href: "/admissions#tarifs" },
    { label: "Pièces à fournir", href: "/admissions#dossier" },
    { label: "Internat", href: "/admissions#internat" },
  ],
  hotel: [
    { label: "L'Hôtel", href: "/hotel" },
    { label: "Chambres", href: "/hotel#chambres" },
    { label: "Restaurant & bar", href: "/hotel#restaurant" },
    { label: "Réserver", href: "/hotel#reserver" },
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

export type HeroSlide = {
  image: SiteImage;
  /** Cadrage de la photo (object-position). */
  focus?: string;
  eyebrow: string;
  title: [string, string, string];
  subtitle: string;
};

export const heroSlides: HeroSlide[] = [
  {
    image: images.waiter,
    focus: "70% 30%",
    eyebrow: "Hôtellerie · Restauration · Tourisme",
    title: ["L'art de", "recevoir", "s'apprend ici"],
    subtitle: "Du CFA au BTS, des diplômes d'État pour devenir cuisinier, serveur, barman, réceptionniste ou gouvernant, au cœur de Lomé.",
  },
  {
    image: images.chef,
    focus: "50% 25%",
    eyebrow: "Cuisine & pâtisserie",
    title: ["Former aujourd'hui les", "chefs", "de demain"],
    subtitle: "Techniques culinaires, pâtisserie, hygiène et brigade : nos élèves cuisinent dans un vrai hôtel dès la première année.",
  },
  {
    image: images.graduates,
    focus: "50% 30%",
    eyebrow: "Diplômes d'État",
    title: ["Un diplôme,", "un métier,", "un avenir"],
    subtitle: "CFA, CAP, BEP, BT et BTS : des formations reconnues, des cours du jour ou du soir, et un paiement en 8 tranches.",
  },
  {
    image: images.uniforms,
    focus: "50% 20%",
    eyebrow: "Rentrée du 26 octobre 2026",
    title: ["Rejoignez la", "famille", "Avenida"],
    subtitle: "Pré-inscription en ligne en 5 minutes, internat sur place et accompagnement personnalisé de chaque élève.",
  },
];

export const marqueeWords = ["Cuisine", "Pâtisserie", "Restaurant", "Bar", "Réception", "Étages", "Hébergement", "Boucherie", "Lingerie", "Tourisme"];

export const keyFigures = [
  { value: 5, suffix: "", label: "Diplômes d'État, du CFA au BTS" },
  { value: 8, suffix: "", label: "Spécialités enseignées" },
  { value: 3, suffix: "", label: "Rentrées par année scolaire" },
  { value: 8, suffix: "", label: "Tranches pour payer la scolarité" },
];

export const pillars: { title: string; text: string; icon: LucideIcon }[] = [
  { title: "Un vrai hôtel d'application", text: "Cuisine, salle, réception et étages : nos élèves pratiquent face à de vrais clients, dès la première année.", icon: ConciergeBell },
  { title: "Des formateurs du métier", text: "Chefs, maîtres d'hôtel et professionnels de l'hébergement transmettent les gestes et les standards du secteur.", icon: ChefHat },
  { title: "Tenue, rigueur, discipline", text: "Uniforme officiel, ponctualité, carnet de correspondance : les exigences d'une grande maison, au quotidien.", icon: ShieldCheck },
  { title: "Un suivi transparent", text: "Élèves et parents suivent notes, absences et paiements en ligne, et échangent directement avec les professeurs.", icon: MessageSquare },
];

export const admissionSteps: { title: string; text: string; icon: LucideIcon }[] = [
  { title: "Pré-inscription en ligne", text: "Choisissez votre formation et remplissez votre dossier en 5 minutes.", icon: ClipboardList },
  { title: "Dépôt des pièces", text: "Téléversez vos documents en ligne ou déposez-les au bureau.", icon: FileCheck2 },
  { title: "Étude du dossier", text: "L'école étudie votre candidature et vous répond dans votre espace.", icon: Users },
  { title: "Inscription définitive", text: "Réglez les frais d'inscription et recevez votre reçu officiel.", icon: Award },
];

export const careers = ["Chef de cuisine", "Pâtissier", "Maître d'hôtel", "Barman", "Réceptionniste", "Gouvernante", "Agent de voyage", "Responsable de restauration"];

export const faq = [
  {
    q: "Quel niveau faut-il pour s'inscrire ?",
    a: "Le CFA est accessible sans diplôme. Le CAP se prépare à partir de la 4ᵉ ou de la 3ᵉ, le BEP et le BT avec le niveau BEPC, et le BTS avec le BAC ou un BT.",
  },
  {
    q: "Peut-on payer la scolarité en plusieurs fois ?",
    a: "Oui : la scolarité se règle en 8 tranches mensuelles ou en 3 tranches trimestrielles, dès l'inscription. Des bourses sont attribuées sur étude de dossier.",
  },
  {
    q: "Existe-t-il des cours du soir ?",
    a: "Oui. Les cours du jour ont lieu du lundi au vendredi de 7 h 30 à 14 h 30, et les cours du soir de 18 h 30 à 21 h 30, idéals si vous travaillez déjà.",
  },
  {
    q: "L'école propose-t-elle un internat ?",
    a: "Oui, pour 30 000 F par mois, avec une caution de 3 mois. Les places sont limitées : précisez-le dès votre pré-inscription.",
  },
  {
    q: "Comment suivre la scolarité de mon enfant ?",
    a: "Chaque parent reçoit un compte personnel : notes, absences, retards, paiements et messagerie directe avec les professeurs et l'administration.",
  },
  {
    q: "Quand a lieu la prochaine rentrée ?",
    a: "Trois rentrées sont prévues : le 26 octobre 2026, le 28 janvier 2027 et le 13 mai 2027.",
  },
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
  pitch: string;
  image: SiteImage;
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
    pitch: "Une année intensive pour apprendre les bases de la cuisine ou de la pâtisserie et entrer vite dans le métier.",
    image: images.pastry,
  },
  {
    code: "CAP",
    name: "Certificat d'aptitude professionnelle",
    level: "Niveau 4ᵉ ou 3ᵉ",
    duration: "2 ans",
    specialties: ["Cuisine / Pâtisserie", "Restaurant / Bar", "Réception / Étages", "Boucherie / Charcuterie"],
    registration: 10000,
    tuition: 260000,
    pitch: "Le premier diplôme d'État du métier : deux ans de pratique encadrée en cuisine, en salle ou à la réception.",
    image: images.chef,
  },
  {
    code: "BEP",
    name: "Brevet d'études professionnelles",
    level: "Niveau BEPC",
    duration: "2 ans",
    specialties: ["Cuisine / Pâtisserie", "Restaurant / Bar", "Réception / Étages", "Lingerie / Buanderie"],
    registration: 10000,
    tuition: 330000,
    pitch: "Une formation complète qui associe savoir-faire technique, hygiène, organisation et relation client.",
    image: images.service,
  },
  {
    code: "BT",
    name: "Brevet de technicien",
    level: "Niveau BEPC",
    duration: "3 ans",
    specialties: ["Restauration", "Hébergement"],
    registration: 10000,
    tuition: 330000,
    pitch: "Trois ans pour devenir technicien de la restauration ou de l'hébergement et encadrer une équipe.",
    image: images.waiter,
  },
  {
    code: "BTS",
    name: "Brevet de technicien supérieur",
    level: "BAC ou BT",
    duration: "2 ans",
    specialties: ["Restauration", "Hébergement"],
    registration: 20000,
    tuition: 420000,
    pitch: "Le diplôme supérieur pour viser les postes de responsable en hôtellerie, en restauration et en tourisme.",
    image: images.graduates,
  },
];

export const specialties: { title: string; text: string; levels: string; icon: LucideIcon; image: SiteImage }[] = [
  {
    title: "Cuisine & pâtisserie",
    text: "Techniques culinaires, pâtisserie, hygiène et organisation d'une brigade de cuisine.",
    levels: "CFA, CAP et BEP ; boucherie-charcuterie en CAP",
    icon: ChefHat,
    image: images.chef,
  },
  {
    title: "Restaurant & bar",
    text: "Accueil des clients, service en salle, mise en place, bar et arts de la table.",
    levels: "CAP et BEP (restaurant / bar), BT et BTS (restauration)",
    icon: Utensils,
    image: images.waiter,
  },
  {
    title: "Réception & hébergement",
    text: "Accueil, réservations, gestion des chambres, étages, lingerie et buanderie.",
    levels: "CAP et BEP (réception / étages, lingerie), BT et BTS (hébergement)",
    icon: ConciergeBell,
    image: images.reception,
  },
];

export const studyOptions = ["Diplômes d'État", "Formation continue", "Modulaire à la carte", "Cours du jour et du soir", "Internat"];

export const schedules = [
  { label: "Cours du jour", hours: "Du lundi au vendredi, de 7 h 30 à 14 h 30" },
  { label: "Cours du soir", hours: "Du lundi au vendredi, de 18 h 30 à 21 h 30" },
];

/* ─────────────────────────── Admissions ─────────────────────────── */

export const intakes = ["26 octobre 2026", "28 janvier 2027", "13 mai 2027"];
/** Dates ISO des rentrées (compte à rebours). */
export const intakeDates = ["2026-10-26", "2027-01-28", "2027-05-13"];

export const requiredDocuments = [
  { key: "acte_naissance", label: "Copie de l'acte de naissance", count: "1 copie", upload: true },
  { key: "bulletins", label: "Derniers bulletins ou relevés de notes", count: "Dernière année", upload: true },
  { key: "photo", label: "Photos d'identité", count: "4 photos", upload: true },
  { key: "certificat_medical", label: "Certificat médical", count: "1 certificat", upload: true },
  { key: "diplome", label: "Dernier diplôme obtenu (si vous en avez un)", count: "Facultatif", upload: true },
  { key: "rame", label: "Paquet de rames de papier (500 feuilles)", count: "À déposer au bureau", upload: false },
] as const;

export type DocumentType = (typeof requiredDocuments)[number]["key"];

export const fees = {
  suppliesDiploma: 75000,
  suppliesCfa: 45000,
  boardingMonthly: 30000,
  boardingDepositMonths: 3,
};

export const paymentFacts = [
  { title: "8 tranches mensuelles", text: "ou 3 tranches trimestrielles, dès l'inscription.", icon: Wallet },
  { title: "Bourses", text: "Attribuées sur étude de dossier.", icon: Award },
  { title: "Fournitures", text: "75 000 F pour BTS, BT, BEP et CAP · 45 000 F pour le CFA et le modulaire.", icon: Briefcase },
];

export const aboutValues = [
  { title: "Travail", text: "Un métier s'apprend par la pratique, chaque jour, en cuisine, en salle et à la réception.", icon: ChefHat },
  { title: "Discipline", text: "Tenue, ponctualité et rigueur : les exigences d'un vrai hôtel, dès la formation.", icon: Clock },
  { title: "Excellence", text: "Des diplômes d'État et des professionnels prêts pour l'hôtellerie et le tourisme.", icon: GraduationCap },
];

/* ─────────────────────────── Hôtel ─────────────────────────── */

/** Catégories de chambres (docs/ARCHITECTURE.md). ⚠️ Descriptions et tarifs à confirmer par la direction. */
export const rooms = [
  { name: "Chambre Standard", text: "Confortable et fonctionnelle, idéale pour un court séjour à Lomé.", image: images.roomComfort },
  { name: "Chambre Confort", text: "Plus d'espace et d'équipements pour un séjour en toute sérénité.", image: images.roomGarden },
  { name: "Suite Junior", text: "Un espace salon pour se détendre ou travailler.", image: images.roomSuite },
  { name: "Suite Présidentielle", text: "Notre meilleure prestation, pour les séjours d'exception.", image: images.reception },
];

/* ─────────────────────────── Contact ─────────────────────────── */

export type ContactTopic = "inscription" | "reservation" | "restaurant" | "partenariat" | "autre";

/** Sujets de contact, avec les informations et pièces utiles pour chaque demande. */
export const contactTopics: { value: ContactTopic; label: string; icon: LucideIcon; hint: string; checklist: string[]; cta?: { label: string; href: string } }[] = [
  {
    value: "inscription",
    label: "Inscription",
    icon: GraduationCap,
    hint: "Pour une demande d'inscription complète, utilisez la pré-inscription en ligne.",
    checklist: ["Formation et spécialité souhaitées", "Dernière classe suivie", "Rentrée visée (octobre, janvier ou mai)"],
    cta: { label: "Pré-inscription en ligne", href: "/preinscription" },
  },
  {
    value: "reservation",
    label: "Réservation",
    icon: BedDouble,
    hint: "Pour réserver une chambre, utilisez le formulaire de réservation de l'hôtel.",
    checklist: ["Dates d'arrivée et de départ", "Nombre de personnes", "Catégorie de chambre souhaitée"],
    cta: { label: "Demande de réservation", href: "/hotel#reserver" },
  },
  { value: "restaurant", label: "Restaurant", icon: Utensils, hint: "Repas, groupes ou événements.", checklist: ["Date et heure", "Nombre de couverts", "Occasion ou besoins particuliers"] },
  { value: "partenariat", label: "Partenariat", icon: Handshake, hint: "Entreprises, hôtels et restaurants : stages, emplois et partenariats.", checklist: ["Nom de la structure", "Type de partenariat (stage, emploi, autre)", "Personne à contacter"] },
  { value: "autre", label: "Autre", icon: Info, hint: "Toute autre question.", checklist: [] },
];

export const formatCFA = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ")} F`;
