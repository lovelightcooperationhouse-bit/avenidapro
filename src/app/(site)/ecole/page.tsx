import { ArrowRight, Check, Clock, GraduationCap, Moon, Sun } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Accent, SectionTitle } from "@/components/site/SectionTitle";
import { formatCFA, formations, images, schedules, specialties, studyOptions } from "@/content/site";

export const metadata: Metadata = {
  title: "L'École — formations CFA, CAP, BEP, BT, BTS",
  description: "Formations aux métiers de l'hôtellerie et de la restauration à Lomé : CFA, CAP, BEP, BT et BTS. Cours du jour et du soir.",
};

export default function SchoolPage() {
  return (
    <>
      <PageHeader
        eyebrow="L'École"
        title={
          <>
            Des diplômes d&apos;État pour les métiers de l&apos;<Accent inverted>hôtellerie</Accent>
          </>
        }
        description="Du CFA au BTS, l'Hôtel École Avenida forme cuisiniers, pâtissiers, serveurs, barmen, réceptionnistes et gouvernants."
        image={images.kitchen}
        breadcrumbs={[{ label: "L'École" }]}
      />

      {/* Tableau des formations */}
      <Section id="formations" aria-labelledby="formations-title" className="scroll-mt-28">
        <SectionTitle
          id="formations-title"
          eyebrow="Tableau des formations 2026-2027"
          title="Choisissez votre diplôme"
          description="Chaque niveau correspond à un niveau de recrutement et à une durée de formation. Les bourses sont attribuées sur étude de dossier."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {formations.map((f, i) => (
            <Reveal key={f.code} delay={i * 80} className="h-full">
              <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex items-start justify-between gap-4 bg-avenida-blue p-6 text-white">
                  <div>
                    <p className="font-serif text-4xl font-extrabold text-red-300">{f.code}</p>
                    <h3 className="mt-1 text-sm font-semibold text-white/85">{f.name}</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold whitespace-nowrap">{f.duration}</span>
                </div>
                <div className="flex flex-1 flex-col gap-5 p-6">
                  <p className="text-sm text-slate-600">
                    <span className="font-bold text-avenida-blue">Recrutement :</span> {f.level}
                  </p>
                  <div>
                    <p className="mb-2 text-xs font-bold tracking-widest text-avenida-red uppercase">Spécialités</p>
                    <ul className="flex flex-wrap gap-2">
                      {f.specialties.map((s) => (
                        <li key={s} className="rounded-full bg-avenida-blue-50 px-3 py-1 text-xs font-semibold text-avenida-blue">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
                    <div>
                      <dt className="text-xs text-slate-500">Inscription</dt>
                      <dd className="font-display text-lg font-extrabold text-avenida-blue">{formatCFA(f.registration)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Scolarité par an</dt>
                      <dd className="font-display text-lg font-extrabold text-avenida-red">{formatCFA(f.tuition)}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            </Reveal>
          ))}

          <Reveal delay={formations.length * 80} className="h-full">
            <div className="flex h-full flex-col justify-between gap-6 rounded-3xl bg-[image:linear-gradient(140deg,#0C356A,#B91C1C)] p-8 text-white shadow-lg">
              <div>
                <GraduationCap aria-hidden className="size-10 text-red-200" />
                <h3 className="mt-4 font-display text-2xl font-extrabold">Formation continue et modulaire</h3>
                <p className="mt-3 leading-relaxed text-white/85">
                  Vous travaillez déjà ? Suivez des modules à la carte, en cours du soir, pour compléter vos compétences.
                </p>
              </div>
              <ButtonLink href="/contact" variant="white" className="w-fit">
                Se renseigner
                <ArrowRight aria-hidden />
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Spécialités */}
      <Section id="specialites" tone="muted" aria-labelledby="specialties-title" className="scroll-mt-28">
        <SectionTitle id="specialties-title" eyebrow="Nos spécialités" title="Apprendre un métier par la pratique" align="center" />
        <div className="mt-14 flex flex-col gap-10">
          {specialties.map((s, i) => (
            <Reveal key={s.title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <div className={`relative aspect-[16/10] overflow-hidden rounded-3xl shadow-xl ${i % 2 ? "lg:order-2" : ""}`}>
                <Image src={s.image.src} alt={s.image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="flex flex-col gap-4">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-avenida-red text-white shadow-lg">
                  <s.icon aria-hidden className="size-7" />
                </span>
                <h3 className="font-display text-3xl font-extrabold text-avenida-blue">{s.title}</h3>
                <p className="text-lg leading-relaxed text-slate-600">{s.text}</p>
                <p className="text-sm font-semibold text-avenida-red">Niveaux : {s.levels}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Horaires */}
      <Section id="horaires" aria-labelledby="schedule-title" className="scroll-mt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <SectionTitle
            id="schedule-title"
            eyebrow="Horaires des cours"
            title="Cours du jour ou cours du soir"
            description="Choisissez la formule qui vous convient : en journée pour les élèves, en soirée pour celles et ceux qui travaillent."
          />
          <ul className="grid gap-4">
            {schedules.map((s, i) => {
              const Icon = i === 0 ? Sun : Moon;
              return (
                <li key={s.label}>
                  <Reveal delay={i * 100} className="flex items-center gap-5 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-900/5">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-avenida-blue-50 text-avenida-red">
                      <Icon aria-hidden className="size-7" />
                    </span>
                    <div>
                      <p className="font-display text-xl font-bold text-avenida-blue">{s.label}</p>
                      <p className="flex items-center gap-1.5 text-slate-600">
                        <Clock aria-hidden className="size-4" />
                        {s.hours}
                      </p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
            <li className="flex flex-wrap gap-2 pt-2">
              {studyOptions.map((o) => (
                <span key={o} className="inline-flex items-center gap-1.5 rounded-full bg-avenida-blue-50 px-3 py-1.5 text-xs font-bold text-avenida-blue">
                  <Check aria-hidden className="size-3.5 text-avenida-red" />
                  {o}
                </span>
              ))}
            </li>
          </ul>
        </div>
      </Section>

      <Section tone="flag" aria-labelledby="school-cta">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 id="school-cta" className="font-display text-3xl font-extrabold sm:text-4xl">
            Prêt·e à rejoindre l&apos;Hôtel École Avenida ?
          </h2>
          <p className="max-w-2xl text-lg text-white/85">Frais, dossier à fournir, rentrées et internat : tout est sur la page Admissions.</p>
          <ButtonLink href="/admissions" variant="white">
            Voir les admissions
            <ArrowRight aria-hidden />
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
