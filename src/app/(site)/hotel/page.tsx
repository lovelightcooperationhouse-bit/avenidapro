import { ArrowRight, BedDouble, ConciergeBell, Mail, Phone, Utensils, Wine } from "lucide-react";
import { getSiteImages } from "@/lib/site-images";
import { getSettings } from "@/lib/cms";
import type { Metadata } from "next";
import Image from "next/image";
import { BookingFlow } from "@/components/site/BookingFlow";
import { onlineMethods } from "@/lib/payments";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Accent, SectionTitle } from "@/components/site/SectionTitle";
import { hotelGallery, hotelServices, siteConfig } from "@/content/site";
import { PhotoGallery } from "@/components/site/PhotoGallery";
import { CmsSections } from "@/components/site/CmsBlocks";

export const metadata: Metadata = {
  title: "L'Hôtel — chambres et restaurant à Lomé",
  description: "Séjournez à l'Hôtel École Avenida, à la Cocoteraie (Lomé) : chambres, restaurant et bar tenus par nos équipes et nos élèves. Demande de réservation en ligne.",
};


export const revalidate = 60;

export default async function HotelPage() {
  const [{ images, im }, settings] = await Promise.all([getSiteImages(), getSettings()]);
  // Chambres et services : textes modifiables (les photos se changent dans « Images du site »)
  const services = [
    { ...hotelServices[0], icon: ConciergeBell, image: images.reception },
    { ...hotelServices[1], icon: Utensils, image: images.plating },
    { ...hotelServices[2], icon: Wine, image: images.diningRoom },
  ];
  const serviceList = services.map((x, i) => ({ ...x, ...(settings.hotel_services?.[i] ?? {}) }));
  return (
    <>
      <PageHeader
        pageKey="hotel"
        eyebrow="L'Hôtel"
        title={
          <>
            L&apos;hospitalité <Accent inverted>Avenida</Accent>
          </>
        }
        description="Un hôtel d'application à la Cocoteraie, à Lomé, où l'exigence de l'école se met au service de chaque client."
        image={images.waiter}
        focus="72% 30%"
        breadcrumbs={[{ label: "L'Hôtel" }]}
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="#reserver" size="lg">
            <BedDouble aria-hidden />
            Demande de réservation
          </ButtonLink>
          <ButtonLink href="#restaurant" variant="glass">
            Le restaurant
          </ButtonLink>
        </div>
      </PageHeader>

      {/* Chambres et réservation en ligne */}
      <Section id="chambres" aria-labelledby="rooms-title" className="scroll-mt-28">
        <div id="reserver" className="scroll-mt-28" />
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionTitle
            id="rooms-title"
            eyebrow="Nos chambres · réservation en ligne"
            title={
              <>
                Choisissez votre <Accent>chambre</Accent>
              </>
            }
            description="Indiquez vos dates : les chambres libres s'affichent avec leurs photos, leur référence et leur prix. Réservez en quelques clics, payez à l'arrivée ou en ligne (carte bancaire, Mixx by Yas, Moov Money), et recevez votre reçu."
          />
        </div>
        <BookingFlow methods={onlineMethods()} />
      </Section>

      {/* Restaurant & services */}
      <Section id="restaurant" tone="night" aria-labelledby="services-title" className="scroll-mt-28 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-40 -z-10 size-[28rem] rounded-full bg-vif/25 blur-3xl" />
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
        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {serviceList.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 100} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={s.image.src} alt={s.image.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="flex flex-col gap-3 p-7">
                  <span className="-mt-14 flex size-14 items-center justify-center rounded-2xl bg-vif text-white shadow-lg ring-4 ring-nuit">
                    <s.icon aria-hidden className="size-7" />
                  </span>
                  <h3 className="font-display text-xl font-bold">{s.title}</h3>
                  <p className="leading-relaxed text-white/75">{s.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      {/* Galerie */}
      <Section id="galerie" aria-labelledby="gallery-title" className="scroll-mt-28">
        <SectionTitle
          id="gallery-title"
          eyebrow="L'hôtel en images"
          title={
            <>
              Chambres, bar et <Accent>salle de conférence</Accent>
            </>
          }
          description="Des chambres rénovées, un bar-salon, une salle de réunion équipée : découvrez l'établissement tel qu'il est."
          className="mb-10"
        />
        <PhotoGallery photos={hotelGallery.map((k) => images[k])} />
      </Section>

      {/* Réception */}
      <Section aria-labelledby="booking-title" className="scroll-mt-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-[image:linear-gradient(130deg,#06152E_0%,#0C356A_50%,#E30613_100%)] p-7 text-white shadow-2xl sm:p-12">
          <div aria-hidden className="bg-avenida-pattern absolute inset-0 opacity-10" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-extrabold tracking-[0.2em] text-white uppercase">Réception</p>
              <h2 id="booking-title" className="font-display text-3xl font-extrabold sm:text-4xl">
                Une question sur votre séjour ?
              </h2>
              <p className="max-w-xl text-white/85">Groupes, longs séjours, séminaires : la réception vous répond et prépare votre réservation sur mesure.</p>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              {siteConfig.phones.map((p) => (
                <li key={p.e164}>
                  <a href={`tel:${p.e164}`} className="inline-flex items-center gap-2 font-bold hover:underline">
                    <Phone aria-hidden className="size-4" />
                    {p.display}
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${siteConfig.email}?subject=${encodeURIComponent("Réservation de chambre")}`} className="inline-flex items-center gap-2 font-bold break-all hover:underline">
                  <Mail aria-hidden className="size-4 shrink-0" />
                  {siteConfig.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Section>
      <CmsSections page="hotel" />
    </>
  );
}
