import { CalendarDays, Check, FileText, Home, MessageCircle, Phone, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Accent, SectionTitle } from "@/components/site/SectionTitle";
import { fees, formatCFA, formations, images, intakes, paymentFacts, requiredDocuments, siteConfig, whatsappUrl } from "@/content/site";

export const metadata: Metadata = {
  title: "Admissions — frais, dossier et rentrées 2026-2027",
  description: "Inscriptions à l'Hôtel École Avenida : frais de scolarité, paiement en 8 tranches, dossier à fournir, rentrées 2026-2027 et internat.",
};

export default function AdmissionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admissions 2026-2027"
        title={
          <>
            Rejoignez l&apos;<Accent inverted>Hôtel École</Accent> Avenida
          </>
        }
        description="Trois rentrées dans l'année, un paiement en 8 tranches et un internat sur place : préparez votre inscription."
        image={images.students}
        breadcrumbs={[{ label: "Admissions" }]}
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={whatsappUrl(siteConfig.whatsapp, "Bonjour, je souhaite des informations sur l'inscription à l'Hôtel École Avenida.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 font-bold text-white transition-colors hover:bg-[#1da851]"
          >
            <MessageCircle aria-hidden className="size-4" />
            S&apos;inscrire par WhatsApp
            <span className="sr-only">(nouvel onglet)</span>
          </a>
          <a href={`tel:${siteConfig.admissionsPhones[0].e164}`} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-avenida-blue hover:bg-avenida-blue-50">
            <Phone aria-hidden className="size-4" />
            {siteConfig.admissionsPhones[0].display}
          </a>
        </div>
      </PageHeader>

      {/* Rentrées */}
      <Section id="rentrees" aria-labelledby="intakes-title" className="scroll-mt-28">
        <SectionTitle id="intakes-title" eyebrow="Calendrier" title="Trois rentrées dans l'année" align="center" description="Valables pour toutes les formations, du CFA au BTS." />
        <ol className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
          {intakes.map((d, i) => (
            <li key={d}>
              <Reveal delay={i * 100} className="flex flex-col items-center gap-3 rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-slate-900/5">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-avenida-red text-white">
                  <CalendarDays aria-hidden className="size-7" />
                </span>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">{i + 1}ʳᵉ rentrée</p>
                <p className="font-display text-2xl font-extrabold text-avenida-blue">{d}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      {/* Tarifs */}
      <Section id="tarifs" tone="muted" aria-labelledby="fees-title" className="scroll-mt-28">
        <SectionTitle id="fees-title" eyebrow="Frais de formation" title="Frais d'inscription et de scolarité" description="Montants en francs CFA, pour l'année scolaire 2026-2027." />
        <Reveal className="mt-10 overflow-x-auto rounded-3xl bg-white shadow-lg ring-1 ring-slate-900/5">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Frais par diplôme</caption>
            <thead className="bg-avenida-blue text-white">
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
                <tr key={f.code} className="transition-colors hover:bg-avenida-blue-50/50">
                  <th scope="row" className="px-6 py-4">
                    <span className="font-serif text-lg font-extrabold text-avenida-red">{f.code}</span>
                  </th>
                  <td className="px-6 py-4 text-slate-600">{f.level}</td>
                  <td className="px-6 py-4 text-slate-600">{f.duration}</td>
                  <td className="px-6 py-4 text-right font-semibold text-avenida-blue">{formatCFA(f.registration)}</td>
                  <td className="px-6 py-4 text-right font-display text-base font-extrabold text-avenida-blue">{formatCFA(f.tuition)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {paymentFacts.map((p, i) => (
            <li key={p.title}>
              <Reveal delay={i * 80} className="flex h-full gap-4 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-900/5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-avenida-blue-50 text-avenida-red">
                  <Wallet aria-hidden className="size-6" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-avenida-blue">{p.title}</p>
                  <p className="text-sm text-slate-600">{p.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section aria-label="Dossier et internat">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Dossier */}
          <Reveal id="dossier" className="scroll-mt-28 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-900/5 sm:p-10">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-avenida-red text-white">
              <FileText aria-hidden className="size-7" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold text-avenida-blue">Dossier à fournir</h2>
            <ul className="mt-6 flex flex-col gap-3">
              {requiredDocuments.map((d) => (
                <li key={d} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-avenida-red text-white">
                    <Check aria-hidden className="size-3" />
                  </span>
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl bg-avenida-blue-50 p-4 text-sm text-avenida-blue">
              Dossier à déposer au bureau, {siteConfig.officeHours.toLowerCase().replace("bureau ouvert ", "")}.
            </p>
          </Reveal>

          {/* Internat */}
          <Reveal id="internat" delay={120} className="flex scroll-mt-28 flex-col rounded-3xl bg-avenida-blue-950 p-8 text-white shadow-lg sm:p-10">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10 text-red-300">
              <Home aria-hidden className="size-7" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold">Internat</h2>
            <p className="mt-4 leading-relaxed text-white/80">
              Les élèves qui le souhaitent peuvent être logés sur place pendant leur formation, au plus près des cours et des travaux pratiques.
            </p>
            <dl className="mt-auto grid grid-cols-2 gap-4 pt-8">
              <div className="rounded-2xl bg-white/5 p-5">
                <dt className="text-xs text-white/60">Pension mensuelle</dt>
                <dd className="font-display text-2xl font-extrabold text-red-300">{formatCFA(fees.boardingMonthly)}</dd>
              </div>
              <div className="rounded-2xl bg-white/5 p-5">
                <dt className="text-xs text-white/60">Caution</dt>
                <dd className="font-display text-2xl font-extrabold">{fees.boardingDepositMonths} mois</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </Section>

      {/* Contacts inscriptions */}
      <Section tone="flag" aria-labelledby="admissions-contact">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 id="admissions-contact" className="font-display text-3xl font-extrabold sm:text-4xl">
            Une question sur l&apos;inscription ?
          </h2>
          <p className="text-white/85">{siteConfig.officeHours}.</p>
          <ul className="flex flex-wrap justify-center gap-3">
            {siteConfig.admissionsPhones.map((p) => (
              <li key={p.e164}>
                <a href={`tel:${p.e164}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 font-bold ring-1 ring-white/20 transition-colors hover:bg-white hover:text-avenida-blue">
                  <Phone aria-hidden className="size-4" />
                  {p.display}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
