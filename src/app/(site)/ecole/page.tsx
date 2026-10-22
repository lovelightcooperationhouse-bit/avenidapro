import { ArrowRight, Check, ClipboardList, Clock, GraduationCap, Moon, Sun } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/site/ButtonLink";
import { FormationExplorer } from "@/components/site/FormationExplorer";
import { Marquee } from "@/components/site/Marquee";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Accent, SectionTitle } from "@/components/site/SectionTitle";
import { careers, formatCFA, formations, images, pillars, schedules, specialties, studyOptions } from "@/content/site";

export const metadata: Metadata = {
  title: "L'École — formations CFA, CAP, BEP, BT, BTS",
  description: "Formations aux métiers de l'hôtellerie, de la restauration et du tourisme à Lomé : CFA, CAP, BEP, BT et BTS. Cours du jour et du soir, internat.",
};

export default function SchoolPage() {
  return (
    <>
      <PageHeader
        eyebrow="L'École"
        title={
          <>
            Les métiers de l&apos;<Accent inverted>hôtellerie</Accent>, du CFA au BTS
          </>
        }
        description="Cuisiniers, pâtissiers, serveurs, barmen, réceptionnistes, gouvernants : nous formons les professionnels que recherchent hôtels et restaurants."
        image={images.chef}
        focus="50% 22%"
        breadcrumbs={[{ label: "L'École" }]}
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/preinscription" size="lg">
            <ClipboardList aria-hidden />
            Pré-inscription en ligne
          </ButtonLink>
          <ButtonLink href="/admissions#tarifs" variant="glass">
            Frais et paiement
          </ButtonLink>
        </div>
      </PageHeader>

      {/* Explorateur des diplômes */}
      <Section id="formations" tone="night" aria-labelledby="formations-title" className="scroll-mt-28 overflow-hidden">
        <SectionTitle
          id="formations-title"
          eyebrow="Tableau des formations 2026-2027"
          title={
            <>
              Choisissez votre <Accent inverted>diplôme</Accent>
            </>
          }
          description="Chaque niveau correspond à un niveau de recrutement et à une durée de formation. Les bourses sont attribuées sur étude de dossier."
          inverted
          className="mb-12"
        />
        <FormationExplorer />
      </Section>

      {/* Tableau récapitulatif */}
      <Section aria-labelledby="summary-title">
        <SectionTitle id="summary-title" eyebrow="En un coup d'œil" title="Niveaux, durées et frais" />
        <Reveal className="mt-10 overflow-x-auto rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/5">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <caption className="sr-only">Récapitulatif des formations</caption>
            <thead className="bg-nuit text-white">
              <tr>
                {["Diplôme", "Recrutement", "Durée", "Spécialités", "Inscription", "Scolarité / an"].map((h, i) => (
                  <th key={h} scope="col" className={`px-5 py-4 font-bold ${i >= 4 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {formations.map((f) => (
                <tr key={f.code} className="transition-colors hover:bg-red-50/40">
                  <th scope="row" className="px-5 py-4 font-display text-xl font-extrabold text-vif">
                    {f.code}
                  </th>
                  <td className="px-5 py-4 text-slate-600">{f.level}</td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{f.duration}</td>
                  <td className="px-5 py-4 text-slate-600">{f.specialties.join(" · ")}</td>
                  <td className="px-5 py-4 text-right font-semibold text-avenida-blue">{formatCFA(f.registration)}</td>
                  <td className="px-5 py-4 text-right font-display text-base font-extrabold text-avenida-blue-950">{formatCFA(f.tuition)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </Section>

      <Marquee words={careers} />

      {/* Spécialités */}
      <Section id="specialites" tone="muted" aria-labelledby="specialties-title" className="scroll-mt-28">
        <SectionTitle
          id="specialties-title"
          eyebrow="Nos spécialités"
          title={
            <>
              Trois grands métiers, <Accent>huit spécialités</Accent>
            </>
          }
          align="center"
        />
        <div className="mt-14 flex flex-col gap-14">
          {specialties.map((s, i) => (
            <Reveal key={s.title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div className={`relative aspect-[16/11] overflow-hidden rounded-[2rem] shadow-2xl ${i % 2 ? "lg:order-2" : ""}`}>
                <Image src={s.image.src} alt={s.image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[50%_30%] transition-transform duration-700 hover:scale-105" />
                <span className="absolute top-5 left-5 rounded-full bg-white/90 px-4 py-1.5 font-display text-sm font-extrabold text-vif backdrop-blur">0{i + 1}</span>
              </div>
              <div className="flex flex-col gap-4">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-vif text-white shadow-lg shadow-vif/30">
                  <s.icon aria-hidden className="size-8" />
                </span>
                <h3 className="font-display text-4xl font-extrabold text-avenida-blue-950">{s.title}</h3>
                <p className="text-lg leading-relaxed text-slate-600">{s.text}</p>
                <p className="flex items-start gap-2 rounded-2xl bg-white p-4 text-sm font-semibold text-avenida-blue shadow-sm">
                  <GraduationCap aria-hidden className="size-5 shrink-0 text-vif" />
                  {s.levels}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Pédagogie */}
      <Section id="pedagogie" tone="night" aria-labelledby="pedagogy-title" className="scroll-mt-28">
        <SectionTitle
          id="pedagogy-title"
          eyebrow="Notre pédagogie"
          title={
            <>
              Apprendre dans un <Accent inverted>vrai hôtel</Accent>
            </>
          }
          align="center"
          inverted
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <li key={p.title}>
              <Reveal delay={i * 90} className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm transition-colors hover:bg-white/10">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-vif text-white">
                  <p.icon aria-hidden className="size-7" />
                </span>
                <h3 className="font-display text-xl font-bold">{p.title}</h3>
                <p className="leading-relaxed text-white/75">{p.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      {/* Horaires */}
      <Section id="horaires" aria-labelledby="schedule-title" className="scroll-mt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <SectionTitle
              id="schedule-title"
              eyebrow="Horaires des cours"
              title={
                <>
                  Cours du jour ou <Accent>cours du soir</Accent>
                </>
              }
              description="Choisissez la formule qui vous convient : en journée pour les élèves, en soirée pour celles et ceux qui travaillent déjà."
            />
            <ul className="flex flex-wrap gap-2">
              {studyOptions.map((o) => (
                <li key={o} className="inline-flex items-center gap-1.5 rounded-full bg-avenida-blue-50 px-3.5 py-2 text-sm font-bold text-avenida-blue">
                  <Check aria-hidden className="size-4 text-vif" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <ul className="grid gap-4">
            {schedules.map((s, i) => {
              const Icon = i === 0 ? Sun : Moon;
              return (
                <li key={s.label}>
                  <Reveal delay={i * 100} className={`flex items-center gap-5 rounded-3xl p-7 shadow-xl ${i === 0 ? "bg-white ring-1 ring-slate-900/5" : "bg-nuit text-white"}`}>
                    <span className={`flex size-16 shrink-0 items-center justify-center rounded-2xl ${i === 0 ? "bg-red-50 text-vif" : "bg-white/10 text-vif-clair"}`}>
                      <Icon aria-hidden className="size-8" />
                    </span>
                    <div>
                      <p className={`font-display text-2xl font-extrabold ${i === 0 ? "text-avenida-blue-950" : ""}`}>{s.label}</p>
                      <p className={`flex items-center gap-1.5 ${i === 0 ? "text-slate-600" : "text-white/75"}`}>
                        <Clock aria-hidden className="size-4" />
                        {s.hours}
                      </p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </Section>

      <Section tone="flag" aria-labelledby="school-cta" className="relative overflow-hidden">
        <div aria-hidden className="bg-avenida-pattern absolute inset-0 opacity-10" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <h2 id="school-cta" className="font-display text-4xl font-extrabold sm:text-5xl">
            Prêt·e à rejoindre l&apos;Hôtel École Avenida ?
          </h2>
          <p className="max-w-2xl text-lg text-white/90">Déposez votre dossier en ligne : réponse de l&apos;école dans votre espace personnel.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/preinscription" variant="white" size="xl">
              <ClipboardList aria-hidden />
              Je me pré-inscris
            </ButtonLink>
            <ButtonLink href="/admissions" variant="glass" size="xl">
              Voir les admissions
              <ArrowRight aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
