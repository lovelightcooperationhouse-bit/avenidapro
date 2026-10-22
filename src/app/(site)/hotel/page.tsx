import { BedDouble, ConciergeBell, Crown, Mail, MessageCircle, Phone, Sparkles, Star, Utensils, Wine } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Accent, SectionTitle } from "@/components/site/SectionTitle";
import { images, siteConfig, whatsappUrl } from "@/content/site";

export const metadata: Metadata = {
  title: "L'Hôtel — chambres et restaurant à Lomé",
  description: "Séjournez à l'Hôtel École Avenida, à la Cocoteraie (Lomé) : chambres, restaurant et bar tenus par nos équipes et nos élèves.",
};

/** Catégories de chambres (docs/ARCHITECTURE.md). ⚠️ Descriptions et tarifs à confirmer par la direction. */
const rooms = [
  { name: "Chambre Standard", text: "Confortable et fonctionnelle, idéale pour un court séjour à Lomé.", icon: BedDouble },
  { name: "Chambre Confort", text: "Plus d'espace et d'équipements pour un séjour en toute sérénité.", icon: Star },
  { name: "Suite Junior", text: "Un espace salon pour se détendre ou travailler.", icon: Sparkles },
  { name: "Suite Présidentielle", text: "Notre meilleure prestation, pour les séjours d'exception.", icon: Crown },
];

const services = [
  { title: "Accueil & réception", text: "Une réception attentive, assurée par nos équipes et nos élèves de la filière hébergement.", icon: ConciergeBell },
  { title: "Restaurant", text: "Une cuisine préparée par notre brigade, avec nos élèves cuisiniers et pâtissiers.", icon: Utensils },
  { title: "Bar", text: "Boissons et cocktails servis par nos élèves de la filière restaurant / bar.", icon: Wine },
];

export default function HotelPage() {
  const bookingText = "Bonjour, je souhaite réserver une chambre à l'Hôtel École Avenida.";

  return (
    <>
      <PageHeader
        eyebrow="L'Hôtel"
        title={
          <>
            Séjourner à l&apos;Hôtel <Accent inverted>Avenida</Accent>
          </>
        }
        description="Un hôtel d'application à la Cocoteraie, à Lomé, où l'exigence de l'école se met au service de chaque client."
        image={images.building}
        breadcrumbs={[{ label: "L'Hôtel" }]}
      />

      {/* Chambres */}
      <Section id="chambres" aria-labelledby="rooms-title" className="scroll-mt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
              <Image src={images.housekeeping.src} alt={images.housekeeping.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="absolute -right-2 -bottom-6 max-w-[15rem] rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-900/5 sm:-right-6">
              <p className="font-display text-lg font-extrabold text-avenida-red">Tarifs sur demande</p>
              <p className="text-sm text-slate-600">Contactez la réception pour connaître les disponibilités.</p>
            </div>
          </Reveal>
          <div className="flex flex-col gap-6">
            <SectionTitle
              id="rooms-title"
              eyebrow="Nos chambres"
              title="Quatre catégories de chambres"
              description="De la chambre standard à la suite présidentielle, chaque chambre est préparée avec le soin enseigné à nos élèves."
            />
            <ul className="grid gap-4 sm:grid-cols-2">
              {rooms.map((r, i) => (
                <li key={r.name}>
                  <Reveal delay={i * 80} className="flex h-full flex-col gap-2 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-900/5">
                    <r.icon aria-hidden className="size-6 text-avenida-red" />
                    <p className="font-display font-bold text-avenida-blue">{r.name}</p>
                    <p className="text-sm text-slate-600">{r.text}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Restaurant & services */}
      <Section id="restaurant" tone="blue" aria-labelledby="services-title" className="relative scroll-mt-28 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-avenida-red/20 blur-3xl" />
        <SectionTitle
          id="services-title"
          eyebrow="Restaurant & services"
          title={
            <>
              Le savoir-faire de nos <Accent inverted>élèves</Accent> à votre table
            </>
          }
          align="center"
          inverted
        />
        <ul className="relative mt-14 grid gap-6 md:grid-cols-3">
          {services.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 100} className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-avenida-red text-white">
                  <s.icon aria-hidden className="size-7" />
                </span>
                <h3 className="font-display text-xl font-bold">{s.title}</h3>
                <p className="leading-relaxed text-white/80">{s.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="relative mt-12 overflow-hidden rounded-3xl">
          <div className="relative aspect-[21/9]">
            <Image src={images.kitchen.src} alt={images.kitchen.alt} fill sizes="100vw" className="object-cover" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-avenida-blue-950/80 to-transparent" />
          </div>
        </div>
      </Section>

      {/* Réserver */}
      <Section id="reserver" aria-labelledby="booking-title" className="scroll-mt-28">
        <div className="relative overflow-hidden rounded-3xl bg-[image:linear-gradient(130deg,#072042_0%,#0C356A_50%,#B91C1C_100%)] p-8 text-white shadow-xl sm:p-14">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-bold tracking-widest text-red-200 uppercase">Réservation</p>
              <h2 id="booking-title" className="font-display text-3xl font-extrabold sm:text-4xl">
                Réservez directement auprès de la réception
              </h2>
              <p className="text-white/85">
                Indiquez vos dates d&apos;arrivée et de départ, le nombre de personnes et la catégorie de chambre souhaitée : nous vous répondons rapidement.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={whatsappUrl(siteConfig.whatsapp, bookingText)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 items-center justify-center gap-2 rounded-full bg-[#25D366] font-bold text-white transition-colors hover:bg-[#1da851]"
              >
                <MessageCircle aria-hidden className="size-5" />
                Réserver par WhatsApp
                <span className="sr-only">(nouvel onglet)</span>
              </a>
              {siteConfig.phones.map((p) => (
                <a key={p.e164} href={`tel:${p.e164}`} className="flex h-14 items-center justify-center gap-2 rounded-full bg-white font-bold text-avenida-blue transition-colors hover:bg-avenida-blue-50">
                  <Phone aria-hidden className="size-5" />
                  {p.display}
                </a>
              ))}
              <a
                href={`mailto:${siteConfig.email}?subject=${encodeURIComponent("Réservation de chambre")}`}
                className="flex h-14 items-center justify-center gap-2 rounded-full bg-white/10 font-bold ring-1 ring-white/25 transition-colors hover:bg-white hover:text-avenida-blue"
              >
                <Mail aria-hidden className="size-5" />
                Réserver par e-mail
              </a>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
