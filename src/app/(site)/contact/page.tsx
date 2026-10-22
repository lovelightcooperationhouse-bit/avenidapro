import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/site/ContactForm";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { images, siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'Hôtel École Avenida : 30, rue d'Almeida Léopold, Cocoteraie, Lomé. Téléphone, e-mail, WhatsApp et plan d'accès.",
};

export default function ContactPage() {
  const { address } = siteConfig;
  const cards = [
    {
      icon: MapPin,
      title: "Adresse",
      lines: [address.street, address.district, `${address.postal} ${address.city} – ${address.country}`],
    },
    { icon: Phone, title: "Téléphone", lines: siteConfig.phones.map((p) => p.display), links: siteConfig.phones.map((p) => `tel:${p.e164}`) },
    { icon: Mail, title: "E-mail", lines: [siteConfig.email], links: [`mailto:${siteConfig.email}`] },
    { icon: Clock, title: "Horaires du bureau", lines: ["Du lundi au vendredi", "de 9 h à 14 h"] },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Parlons de votre projet"
        description="Inscription, réservation ou simple question : notre équipe vous répond."
        image={images.building}
        breadcrumbs={[{ label: "Contact" }]}
      />

      <Section aria-label="Nos coordonnées">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <li key={c.title}>
              <Reveal delay={i * 80} className="flex h-full flex-col gap-3 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-900/5">
                <span className="flex size-12 items-center justify-center rounded-xl bg-avenida-red text-white">
                  <c.icon aria-hidden className="size-6" />
                </span>
                <h2 className="font-display text-lg font-bold text-avenida-blue">{c.title}</h2>
                <p className="flex flex-col text-sm text-slate-600">
                  {c.lines.map((l, j) =>
                    c.links?.[j] ? (
                      <a key={l} href={c.links[j]} className="break-all hover:text-avenida-red">
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
          <Reveal className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-900/5 sm:p-10 lg:col-span-3">
            <h2 className="font-display text-2xl font-extrabold text-avenida-blue sm:text-3xl">Écrivez-nous</h2>
            <p className="mt-2 mb-8 text-slate-600">Votre message s&apos;ouvre dans WhatsApp ou dans votre messagerie, prêt à être envoyé.</p>
            <ContactForm />
          </Reveal>

          <Reveal delay={120} className="flex flex-col gap-4 lg:col-span-2">
            <div className="min-h-80 flex-1 overflow-hidden rounded-3xl shadow-lg ring-1 ring-slate-900/5">
              <iframe
                title="Plan d'accès à l'Hôtel École Avenida"
                src={siteConfig.mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="size-full min-h-80"
              />
            </div>
            <a
              href={siteConfig.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-avenida-blue font-bold text-white hover:bg-avenida-blue-950"
            >
              <Navigation aria-hidden className="size-4" />
              Ouvrir l&apos;itinéraire
              <span className="sr-only">(nouvel onglet)</span>
            </a>
            <div className="rounded-3xl bg-avenida-blue-950 p-6 text-white">
              <p className="font-display font-bold">Inscriptions</p>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {siteConfig.admissionsPhones.map((p) => (
                  <li key={p.e164}>
                    <a href={`tel:${p.e164}`} className="text-white/80 hover:text-red-300">
                      {p.display}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
