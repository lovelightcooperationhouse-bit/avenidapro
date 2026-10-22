import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/site/ContactForm";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Accent } from "@/components/site/SectionTitle";
import { SocialLinks } from "@/components/site/SocialLinks";
import { images, siteConfig } from "@/content/site";
import { CmsSections } from "@/components/site/CmsBlocks";
import { getSettings } from "@/lib/cms";
import { mergeContact } from "@/lib/site-contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'Hôtel École Avenida : 30, rue d'Almeida Léopold, Cocoteraie, Lomé. Téléphone, e-mail, WhatsApp, formulaire et plan d'accès.",
};

export const revalidate = 60;

export default async function ContactPage() {
  const contact = mergeContact((await getSettings()).contact);
  const { address } = contact;
  const cards = [
    { icon: MapPin, title: "Adresse", lines: [address.street, address.district, `${address.postal} ${address.city} – ${address.country}`] },
    { icon: Phone, title: "Téléphone", lines: contact.phones.map((p) => p.display), links: contact.phones.map((p) => `tel:${p.e164}`) },
    { icon: Mail, title: "E-mail", lines: [contact.email], links: [`mailto:${contact.email}`] },
    { icon: Clock, title: "Bureau", lines: [contact.officeHours] },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={
          <>
            Parlons de votre <Accent inverted>projet</Accent>
          </>
        }
        description="Inscription, réservation, restaurant, partenariat ou simple question : notre équipe vous répond."
        image={images.service}
        breadcrumbs={[{ label: "Contact" }]}
      />

      <Section tone="muted" aria-label="Nos coordonnées">
        <ul className="-mt-28 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <li key={c.title}>
              <Reveal delay={i * 80} className="flex h-full flex-col gap-3 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-vif text-white shadow-lg shadow-vif/30">
                  <c.icon aria-hidden className="size-6" />
                </span>
                <h2 className="font-display text-lg font-bold text-avenida-blue-950">{c.title}</h2>
                <p className="flex flex-col text-sm text-slate-600">
                  {c.lines.map((l, j) =>
                    c.links?.[j] ? (
                      <a key={l} href={c.links[j]} className="break-all hover:text-vif">
                        {l}
                      </a>
                    ) : (
                      <span key={l}>{l}</span>
                    )
                  )}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>

        <div className="mt-14 grid gap-8 lg:grid-cols-5">
          <Reveal className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-slate-900/5 sm:p-10 lg:col-span-3">
            <h2 className="font-display text-3xl font-extrabold text-avenida-blue-950">Écrivez-nous</h2>
            <p className="mt-2 mb-8 text-slate-600">Choisissez le sujet : nous vous indiquons les informations utiles pour traiter votre demande rapidement.</p>
            <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-slate-50" />}>
              <ContactForm />
            </Suspense>
          </Reveal>

          <Reveal delay={120} className="flex flex-col gap-4 lg:col-span-2">
            <div className="min-h-80 flex-1 overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-slate-900/5">
              <iframe title="Plan d'accès à l'Hôtel École Avenida" src={contact.mapsEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="size-full min-h-80" />
            </div>
            <a
              href={contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-avenida-blue font-bold text-white hover:bg-avenida-blue-950"
            >
              <Navigation aria-hidden className="size-4" />
              Ouvrir l&apos;itinéraire
              <span className="sr-only">(nouvel onglet)</span>
            </a>
            <div className="rounded-[2rem] bg-nuit p-6 text-white">
              <p className="font-display font-bold">Service des inscriptions</p>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {siteConfig.admissionsPhones.map((p) => (
                  <li key={p.e164}>
                    <a href={`tel:${p.e164}`} className="text-white/80 hover:text-white">
                      {p.display}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-5 font-display font-bold">Suivez-nous</p>
              <SocialLinks className="mt-3" itemClassName="bg-white/10 text-white hover:bg-vif" />
            </div>
          </Reveal>
        </div>
      </Section>
      <CmsSections page="contact" />
    </>
  );
}
