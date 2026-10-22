import { Clock, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/site/PageHeader";
import { PreinscriptionForm } from "@/components/site/PreinscriptionForm";
import { Section } from "@/components/site/Section";
import { Accent } from "@/components/site/SectionTitle";
import { images, siteConfig, whatsappUrl } from "@/content/site";

export const metadata: Metadata = {
  title: "Pré-inscription en ligne",
  description: "Déposez votre dossier de pré-inscription à l'Hôtel École Avenida en 5 minutes : formation, informations, pièces et suivi en ligne.",
};

export default function PreinscriptionPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admissions 2026-2027"
        title={
          <>
            Pré-inscription <Accent inverted>en ligne</Accent>
          </>
        }
        description="Cinq étapes, cinq minutes : choisissez votre formation, renseignez votre dossier, joignez vos pièces et suivez la réponse de l'école."
        image={images.uniforms}
        breadcrumbs={[{ label: "Admissions", href: "/admissions" }, { label: "Pré-inscription" }]}
      />

      <Section tone="muted" className="pt-12 sm:pt-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-[2rem] bg-white" />}>
            <PreinscriptionForm />
          </Suspense>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl bg-nuit p-6 text-white">
              <ShieldCheck aria-hidden className="size-8 text-vif-clair" />
              <p className="mt-3 font-display text-lg font-bold">Dossier sécurisé</p>
              <p className="mt-1 text-sm text-white/75">
                Vos informations et vos pièces ne sont visibles que par le service des admissions et par vous, depuis votre espace.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
              <p className="font-display text-lg font-bold text-avenida-blue-950">Besoin d&apos;aide ?</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                <Clock aria-hidden className="size-4 text-vif" />
                {siteConfig.officeHours}
              </p>
              <a
                href={whatsappUrl(siteConfig.whatsapp, "Bonjour, j'ai besoin d'aide pour ma pré-inscription.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-bold text-white hover:bg-[#1da851]"
              >
                <MessageCircle aria-hidden className="size-4" />
                WhatsApp
                <span className="sr-only">(nouvel onglet)</span>
              </a>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {siteConfig.admissionsPhones.slice(0, 3).map((p) => (
                  <li key={p.e164}>
                    <a href={`tel:${p.e164}`} className="flex items-center gap-2 font-semibold text-avenida-blue hover:text-vif">
                      <Phone aria-hidden className="size-4 text-vif" />
                      {p.display}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
