import { ArrowRight, BedDouble, ClipboardList, GraduationCap, Quote } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/site/ButtonLink";
import { Marquee } from "@/components/site/Marquee";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Accent, SectionTitle } from "@/components/site/SectionTitle";
import { aboutValues, images, marqueeWords, siteConfig, studyOptions } from "@/content/site";

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
        image={images.graduates}
        focus="50% 30%"
        breadcrumbs={[{ label: "À propos" }]}
      />

      <Section aria-labelledby="story-title" className="overflow-hidden">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
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
              L&apos;Hôtel École Avenida est un centre de formation aux métiers de l&apos;hôtellerie, de la restauration et du tourisme, installé rue
              d&apos;Almeida Léopold, à la Cocoteraie, à Lomé.
            </p>
            <p className="leading-relaxed text-slate-600">
              Sa particularité : l&apos;école fonctionne avec un hôtel d&apos;application. Les élèves passent des salles de cours à la cuisine, au
              restaurant, à la réception et aux étages, et apprennent leur métier au contact de vrais clients, en uniforme officiel Avenida.
            </p>
            <ul className="flex flex-wrap gap-2">
              {studyOptions.map((o) => (
                <li key={o} className="rounded-full bg-avenida-blue-50 px-3.5 py-2 text-sm font-bold text-avenida-blue">
                  {o}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120} className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl sm:aspect-[4/3] lg:aspect-[4/5]">
              <Image src={images.building.src} alt={images.building.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="site-float absolute -bottom-6 -left-4 w-44 overflow-hidden rounded-2xl border-[5px] border-white shadow-2xl sm:w-56">
              <Image src={images.fabric.src} alt={images.fabric.alt} width={904} height={544} className="h-auto w-full" />
            </div>
          </Reveal>
        </div>
      </Section>

      <Marquee words={marqueeWords} />

      {/* Valeurs */}
      <Section tone="night" aria-labelledby="values-title">
        <SectionTitle id="values-title" eyebrow="Notre devise" title={siteConfig.motto} align="center" inverted />
        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {aboutValues.map((v, i) => (
            <li key={v.title}>
              <Reveal delay={i * 100} className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <span aria-hidden className="absolute top-3 right-5 font-display text-8xl font-extrabold text-white/5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex size-14 items-center justify-center rounded-2xl bg-vif text-white transition-transform duration-300 group-hover:rotate-6">
                  <v.icon aria-hidden className="size-7" />
                </span>
                <h3 className="font-elegant text-3xl font-bold italic">{v.title}</h3>
                <p className="leading-relaxed text-white/75">{v.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      {/* Identité */}
      <Section aria-labelledby="identity-title">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="relative aspect-[3/2] overflow-hidden rounded-[2rem] shadow-2xl">
            <Image src={images.waiter.src} alt={images.waiter.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[70%_center]" />
          </Reveal>
          <div className="flex flex-col gap-6">
            <SectionTitle
              id="identity-title"
              eyebrow="Notre identité"
              title={
                <>
                  Un uniforme, une <Accent>fierté</Accent>
                </>
              }
              description="Losanges bleus, liserés rouges, fleurs de lys, toques et couverts : le tissu Avenida habille nos élèves en cuisine, en salle et le jour de la remise des diplômes."
            />
            <figure className="relative rounded-2xl border-l-4 border-vif bg-red-50/60 p-6">
              <Quote aria-hidden className="absolute top-4 right-4 size-8 text-vif/30" />
              <blockquote className="font-elegant text-2xl leading-snug font-bold text-avenida-blue-950 italic">« {siteConfig.tagline} »</blockquote>
              <figcaption className="mt-2 text-sm text-slate-600">L&apos;ambition de l&apos;Hôtel École Avenida pour chaque promotion.</figcaption>
            </figure>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/ecole" variant="blue">
                <GraduationCap aria-hidden />
                Nos formations
              </ButtonLink>
              <ButtonLink href="/hotel" variant="outline">
                <BedDouble aria-hidden />
                L&apos;Hôtel
              </ButtonLink>
              <ButtonLink href="/preinscription">
                <ClipboardList aria-hidden />
                Pré-inscription
                <ArrowRight aria-hidden />
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
