import { ArrowRight, BedDouble, GraduationCap, Quote } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Accent, SectionTitle } from "@/components/site/SectionTitle";
import { aboutValues, images, siteConfig, studyOptions } from "@/content/site";

export const metadata: Metadata = {
  title: "À propos",
  description: "L'Hôtel École Avenida, centre de formation aux métiers de l'hôtellerie, de la restauration et du tourisme à Lomé. Travail – Discipline – Excellence.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="À propos"
        title={
          <>
            Travail, discipline, <Accent inverted>excellence</Accent>
          </>
        }
        description="Une école et un hôtel réunis pour former, sur le terrain, les professionnels de l'hôtellerie et du tourisme au Togo."
        image={images.students}
        breadcrumbs={[{ label: "À propos" }]}
      />

      <Section aria-labelledby="story-title">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="flex flex-col gap-6">
            <SectionTitle
              id="story-title"
              eyebrow="Notre établissement"
              title={
                <>
                  Apprendre dans un <Accent>vrai hôtel</Accent>
                </>
              }
            />
            <p className="text-lg leading-relaxed text-slate-600">
              L&apos;Hôtel École Avenida est un centre de formation aux métiers de l&apos;hôtellerie, de la restauration et du tourisme, installé
              rue d&apos;Almeida Léopold, à la Cocoteraie, à Lomé.
            </p>
            <p className="leading-relaxed text-slate-600">
              Sa particularité : l&apos;école fonctionne avec un hôtel d&apos;application. Les élèves passent des salles de cours à la cuisine, au
              restaurant, à la réception et aux étages, et apprennent leur métier au contact de vrais clients.
            </p>
            <ul className="flex flex-wrap gap-2">
              {studyOptions.map((o) => (
                <li key={o} className="rounded-full bg-avenida-blue-50 px-3 py-1.5 text-xs font-bold text-avenida-blue">
                  {o}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120} className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl sm:aspect-[4/3] lg:aspect-[4/5]">
              <Image src={images.building.src} alt={images.building.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div aria-hidden className="absolute -right-5 -bottom-5 -z-10 size-40 rounded-full bg-avenida-red/20 blur-2xl" />
          </Reveal>
        </div>
      </Section>

      {/* Valeurs */}
      <Section tone="muted" aria-labelledby="values-title">
        <SectionTitle id="values-title" eyebrow="Notre devise" title={siteConfig.motto} align="center" />
        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {aboutValues.map((v, i) => (
            <li key={v.title}>
              <Reveal delay={i * 100} className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-900/5">
                <span aria-hidden className="absolute top-4 right-6 font-serif text-7xl font-extrabold text-avenida-blue/5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex size-14 items-center justify-center rounded-2xl bg-avenida-red text-white transition-transform duration-300 group-hover:rotate-6">
                  <v.icon aria-hidden className="size-7" />
                </span>
                <h3 className="font-serif text-2xl font-extrabold text-avenida-blue">{v.title}</h3>
                <p className="leading-relaxed text-slate-600">{v.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section aria-label="Citation">
        <Reveal className="relative mx-auto max-w-4xl rounded-3xl border-l-4 border-avenida-red bg-avenida-blue-50 p-8 sm:p-12">
          <Quote aria-hidden className="absolute top-6 right-6 size-12 text-avenida-red/25" />
          <p className="font-serif text-2xl leading-snug font-bold text-avenida-blue sm:text-3xl">« {siteConfig.tagline} »</p>
          <p className="mt-4 text-slate-600">L&apos;ambition de l&apos;Hôtel École Avenida pour chaque promotion.</p>
        </Reveal>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/ecole" variant="blue">
            <GraduationCap aria-hidden />
            Nos formations
          </ButtonLink>
          <ButtonLink href="/hotel" variant="outline">
            <BedDouble aria-hidden />
            L&apos;Hôtel
          </ButtonLink>
          <ButtonLink href="/contact">
            Nous contacter
            <ArrowRight aria-hidden />
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
