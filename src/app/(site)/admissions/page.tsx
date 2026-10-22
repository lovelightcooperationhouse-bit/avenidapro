import { CalendarDays, CheckCircle2, ClipboardList, FileText, Home, MessageCircle, Phone, Upload } from "lucide-react";
import { getSiteImages } from "@/lib/site-images";
import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Accent, SectionTitle } from "@/components/site/SectionTitle";
import { admissionSteps, fees, formatCFA, formations, intakes, paymentFacts, requiredDocuments, siteConfig, whatsappUrl } from "@/content/site";
import { CmsSections } from "@/components/site/CmsBlocks";

export const metadata: Metadata = {
  title: "Admissions — frais, pièces à fournir et rentrées 2026-2027",
  description: "Inscriptions à l'Hôtel École Avenida : pré-inscription en ligne, frais de scolarité, paiement en 8 tranches, pièces à fournir, rentrées 2026-2027 et internat.",
};

export const revalidate = 60;

export default async function AdmissionsPage() {
  const { images } = await getSiteImages();
  return (
    <>
      <PageHeader
        eyebrow="Admissions 2026-2027"
        title={
          <>
            Rejoignez la <Accent inverted>famille</Accent> Avenida
          </>
        }
        description="Trois rentrées dans l'année, une pré-inscription en ligne, un paiement en 8 tranches et un internat sur place."
        image={images.uniforms}
        focus="50% 20%"
        breadcrumbs={[{ label: "Admissions" }]}
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/preinscription" size="lg">
            <ClipboardList aria-hidden />
            Pré-inscription en ligne
          </ButtonLink>
          <a
            href={whatsappUrl(siteConfig.whatsapp, "Bonjour, je souhaite des informations sur l'inscription à l'Hôtel École Avenida.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 font-bold text-white transition-colors hover:bg-[#1da851]"
          >
            <MessageCircle aria-hidden className="size-4" />
            WhatsApp
            <span className="sr-only">(nouvel onglet)</span>
          </a>
        </div>
      </PageHeader>

      {/* Étapes */}
      <Section aria-labelledby="steps-title">
        <SectionTitle
          id="steps-title"
          eyebrow="Comment s'inscrire"
          title={
            <>
              Quatre étapes, <Accent>en ligne</Accent>
            </>
          }
          align="center"
        />
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {admissionSteps.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 90} className="relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl bg-white p-7 shadow-lg ring-1 ring-slate-900/5">
                <span aria-hidden className="absolute -top-4 -right-2 font-display text-8xl font-extrabold text-red-50">{i + 1}</span>
                <span className="relative flex size-14 items-center justify-center rounded-2xl bg-vif text-white shadow-lg shadow-vif/30">
                  <s.icon aria-hidden className="size-7" />
                </span>
                <h3 className="relative font-display text-xl font-bold text-avenida-blue-950">{s.title}</h3>
                <p className="relative text-sm leading-relaxed text-slate-600">{s.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      {/* Rentrées */}
      <Section id="rentrees" tone="night" aria-labelledby="intakes-title" className="scroll-mt-28">
        <SectionTitle id="intakes-title" eyebrow="Calendrier" title="Trois rentrées dans l'année" align="center" description="Valables pour toutes les formations, du CFA au BTS." inverted />
        <ol className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
          {intakes.map((d, i) => (
            <li key={d}>
              <Reveal delay={i * 100} className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-vif text-white">
                  <CalendarDays aria-hidden className="size-7" />
                </span>
                <p className="text-xs font-bold tracking-widest text-white/60 uppercase">{i + 1}ʳᵉ rentrée</p>
                <p className="font-display text-2xl font-extrabold">{d}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      {/* Tarifs */}
      <Section id="tarifs" tone="muted" aria-labelledby="fees-title" className="scroll-mt-28">
        <SectionTitle id="fees-title" eyebrow="Frais de formation" title="Frais d'inscription et de scolarité" description="Montants en francs CFA, pour l'année scolaire 2026-2027." />
        <Reveal className="mt-10 overflow-x-auto rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/5">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Frais par diplôme</caption>
            <thead className="bg-nuit text-white">
              <tr>
                <th scope="col" className="px-6 py-4 font-bold">Diplôme</th>
                <th scope="col" className="px-6 py-4 font-bold">Niveau de recrutement</th>
                <th scope="col" className="px-6 py-4 font-bold">Durée</th>
                <th scope="col" className="px-6 py-4 text-right font-bold">Inscription</th>
                <th scope="col" className="px-6 py-4 text-right font-bold">Scolarité / an</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {formations.map((f) => (
                <tr key={f.code} className="transition-colors hover:bg-red-50/40">
                  <th scope="row" className="px-6 py-4 font-display text-xl font-extrabold text-vif">
                    {f.code}
                  </th>
                  <td className="px-6 py-4 text-slate-600">{f.level}</td>
                  <td className="px-6 py-4 text-slate-600">{f.duration}</td>
                  <td className="px-6 py-4 text-right font-semibold text-avenida-blue">{formatCFA(f.registration)}</td>
                  <td className="px-6 py-4 text-right font-display text-base font-extrabold text-avenida-blue-950">{formatCFA(f.tuition)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {paymentFacts.map((p, i) => (
            <li key={p.title}>
              <Reveal delay={i * 80} className="flex h-full gap-4 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-900/5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-vif">
                  <p.icon aria-hidden className="size-6" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-avenida-blue-950">{p.title}</p>
                  <p className="text-sm text-slate-600">{p.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section aria-label="Pièces à fournir et internat">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Pièces */}
          <Reveal id="dossier" className="scroll-mt-28 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-slate-900/5 sm:p-10">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-vif text-white">
              <FileText aria-hidden className="size-7" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold text-avenida-blue-950">Pièces à fournir</h2>
            <p className="mt-2 text-slate-600">Téléversez-les pendant la pré-inscription ou déposez-les au bureau.</p>
            <ul className="mt-6 divide-y divide-slate-100">
              {requiredDocuments.map((d) => (
                <li key={d.key} className="flex items-center justify-between gap-4 py-3.5">
                  <span className="flex items-start gap-3 text-slate-800">
                    <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-vif" />
                    {d.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-avenida-blue-50 px-3 py-1 text-xs font-bold text-avenida-blue">
                    {d.upload && <Upload aria-hidden className="size-3.5" />}
                    {d.count}
                  </span>
                </li>
              ))}
            </ul>
            <ButtonLink href="/preinscription" className="mt-6">
              <ClipboardList aria-hidden />
              Déposer mon dossier en ligne
            </ButtonLink>
          </Reveal>

          {/* Internat */}
          <Reveal id="internat" delay={120} className="relative flex scroll-mt-28 flex-col overflow-hidden rounded-[2rem] bg-nuit text-white shadow-xl">
            <div className="relative h-56">
              <Image src={images.building.src} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover object-[50%_40%]" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-nuit to-transparent" />
            </div>
            <div className="flex flex-1 flex-col p-8 sm:p-10">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10 text-vif-clair">
                <Home aria-hidden className="size-7" />
              </span>
              <h2 className="mt-5 font-display text-3xl font-extrabold">Internat</h2>
              <p className="mt-3 leading-relaxed text-white/80">Les élèves qui le souhaitent sont logés sur place, au plus près des cours et des travaux pratiques.</p>
              <dl className="mt-auto grid grid-cols-2 gap-4 pt-8">
                <div className="rounded-2xl bg-white/5 p-5">
                  <dt className="text-xs text-white/60">Pension mensuelle</dt>
                  <dd className="font-display text-2xl font-extrabold text-vif-clair">{formatCFA(fees.boardingMonthly)}</dd>
                </div>
                <div className="rounded-2xl bg-white/5 p-5">
                  <dt className="text-xs text-white/60">Caution</dt>
                  <dd className="font-display text-2xl font-extrabold">{fees.boardingDepositMonths} mois</dd>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Contacts inscriptions */}
      <Section tone="flag" aria-labelledby="admissions-contact" className="relative overflow-hidden">
        <div aria-hidden className="bg-avenida-pattern absolute inset-0 opacity-10" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <h2 id="admissions-contact" className="font-display text-4xl font-extrabold sm:text-5xl">
            Une question sur l&apos;inscription ?
          </h2>
          <p className="text-white/90">Le bureau vous reçoit {siteConfig.officeHours.toLowerCase()}.</p>
          <ul className="flex flex-wrap justify-center gap-3">
            {siteConfig.admissionsPhones.map((p) => (
              <li key={p.e164}>
                <a href={`tel:${p.e164}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 font-bold ring-1 ring-white/25 transition-colors hover:bg-white hover:text-avenida-blue-950">
                  <Phone aria-hidden className="size-4" />
                  {p.display}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Section>
      <CmsSections page="admissions" />
    </>
  );
}
