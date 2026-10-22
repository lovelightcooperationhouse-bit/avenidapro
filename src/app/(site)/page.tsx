import { ArrowRight, BedDouble, Check, ClipboardList, Mail, MessageCircle, Phone, Quote, Utensils } from "lucide-react";
import { AnimatedHeadline } from "@/components/site/AnimatedHeadline";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/site/ButtonLink";
import { Faq } from "@/components/site/Faq";
import { FormationExplorer } from "@/components/site/FormationExplorer";
import { HeroSlider } from "@/components/site/HeroSlider";
import { Marquee } from "@/components/site/Marquee";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Accent, SectionTitle } from "@/components/site/SectionTitle";
import { StatCounter } from "@/components/site/StatCounter";
import { admissionSteps, careers, faq, images, keyFigures, marqueeWords, pillars, siteConfig, studyOptions, whatsappUrl } from "@/content/site";
import { CmsSections } from "@/components/site/CmsBlocks";
import { getSettings } from "@/lib/cms";

export const revalidate = 60;

export default async function HomePage() {
  const { hero } = await getSettings();
  return (
    <>
      <HeroSlider custom={hero} />
      <Marquee words={marqueeWords} />

      {/* Chiffres clés */}
      <Section tone="night" aria-labelledby="stats-title" className="py-16 sm:py-20">
        <h2 id="stats-title" className="sr-only">
          L&apos;Hôtel École Avenida en chiffres
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {keyFigures.map((f) => (
            <StatCounter key={f.label} value={f.value} suffix={f.suffix} label={f.label} />
          ))}
        </div>
      </Section>

      {/* L'excellence, notre passion */}
      <Section aria-labelledby="about-title" className="overflow-hidden">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative ml-auto aspect-[3/4] w-[78%] overflow-hidden rounded-[2rem] shadow-2xl">
              <Image src={images.uniforms.src} alt={images.uniforms.alt} fill sizes="(min-width: 1024px) 40vw, 80vw" className="object-cover object-top" />
            </div>
            <div className="site-float absolute bottom-10 left-0 aspect-square w-[46%] overflow-hidden rounded-[1.75rem] border-[6px] border-white shadow-2xl">
              <Image src={images.chef.src} alt={images.chef.alt} fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-cover object-[50%_30%]" />
            </div>
            <div className="absolute top-8 -left-2 rounded-2xl bg-vif px-5 py-4 text-white shadow-xl sm:left-4">
              <p className="font-display text-3xl font-extrabold">CFA → BTS</p>
              <p className="text-sm font-semibold text-white/90">Diplômes d&apos;État</p>
            </div>
            <div aria-hidden className="bg-avenida-pattern absolute -right-6 -bottom-6 -z-10 size-48 rounded-[2rem] opacity-30" />
          </Reveal>

          <Reveal delay={120} className="flex flex-col gap-6">
            <SectionTitle
              id="about-title"
              eyebrow="Qui sommes-nous"
              title={
                <>
                  L&apos;excellence, <Accent>notre passion</Accent>
                </>
              }
            />
            <p className="text-lg leading-relaxed text-slate-600">
              L&apos;<strong className="text-avenida-blue-950">Hôtel École Avenida</strong> forme aux métiers de l&apos;hôtellerie, de la restauration et du
              tourisme. Ici, on apprend dans un <strong className="text-vif">vrai hôtel</strong> : en cuisine, en salle, au bar, à la réception et aux étages,
              face à de vrais clients.
            </p>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {studyOptions.map((o) => (
                <li key={o} className="flex items-center gap-2.5 font-semibold text-slate-700">
                  <span className="flex size-6 items-center justify-center rounded-full bg-vif text-white">
                    <Check aria-hidden className="size-3.5" />
                  </span>
                  {o}
                </li>
              ))}
            </ul>
            <figure className="relative overflow-hidden rounded-2xl bg-nuit p-6 text-white">
              <div aria-hidden className="bg-avenida-pattern absolute inset-0 opacity-10" />
              <Quote aria-hidden className="relative size-8 text-vif-clair" />
              <blockquote className="relative mt-2 font-elegant text-2xl leading-snug font-bold italic">L&apos;élégance au service de l&apos;excellence.</blockquote>
              <figcaption className="relative mt-2 text-sm font-bold tracking-widest text-white/70 uppercase">{siteConfig.motto}</figcaption>
            </figure>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/a-propos" variant="blue">
                Découvrir l&apos;école
                <ArrowRight aria-hidden />
              </ButtonLink>
              <ButtonLink href="/preinscription" variant="outline">
                Pré-inscription
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Formations */}
      <Section tone="night" aria-labelledby="formations-title" className="overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[30rem] rounded-full bg-vif/25 blur-3xl" />
        <div className="mb-12 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionTitle
            id="formations-title"
            eyebrow="Au menu 2026-2027"
            title={
              <>
                Cinq diplômes pour <Accent inverted>réussir</Accent>
              </>
            }
            description="Inscription dès 10 000 F, scolarité en 8 tranches, bourses sur étude de dossier. Choisissez votre niveau :"
            inverted
          />
          <ButtonLink href="/ecole#formations" variant="glass" className="shrink-0">
            Toutes les formations
            <ArrowRight aria-hidden />
          </ButtonLink>
        </div>
        <FormationExplorer />
      </Section>

      {/* Pédagogie */}
      <Section aria-labelledby="pedagogy-title">
        <div className="grid items-stretch gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Reveal className="relative min-h-[26rem] overflow-hidden rounded-[2rem] shadow-2xl">
            <Image src={images.waiter.src} alt={images.waiter.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover object-[72%_center]" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-nuit/90 via-nuit/10 to-transparent" />
            <div className="absolute bottom-0 p-8 text-white">
              <p className="font-elegant text-3xl font-bold italic">L&apos;art de recevoir</p>
              <p className="mt-1 text-white/80">Service en salle, arts de la table, accueil : les standards des grandes maisons.</p>
            </div>
          </Reveal>
          <div className="flex flex-col justify-center gap-10">
            <SectionTitle
              id="pedagogy-title"
              eyebrow="Notre pédagogie"
              title={
                <>
                  Apprendre dans un <Accent>vrai hôtel</Accent>
                </>
              }
            />
            <ul className="grid gap-5 sm:grid-cols-2">
              {pillars.map((p, i) => (
                <li key={p.title}>
                  <Reveal delay={i * 90} className="group flex h-full flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-vif/30 hover:shadow-xl">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-avenida-blue-50 text-vif transition-all duration-300 group-hover:rotate-6 group-hover:bg-vif group-hover:text-white">
                      <p.icon aria-hidden className="size-6" />
                    </span>
                    <h3 className="font-display text-lg font-bold text-avenida-blue-950">{p.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{p.text}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Admission en 4 étapes */}
      <Section tone="muted" aria-labelledby="steps-title">
        <SectionTitle
          id="steps-title"
          eyebrow="Admission"
          title={
            <>
              Votre inscription en <Accent>4 étapes</Accent>
            </>
          }
          description="Tout se fait en ligne : vous suivez votre dossier et échangez avec l'école depuis votre espace personnel."
          align="center"
        />
        <ol className="relative mt-14 grid gap-6 md:grid-cols-4">
          <span aria-hidden className="absolute top-10 right-[12%] left-[12%] hidden h-0.5 bg-[image:linear-gradient(90deg,#0C356A,#E30613)] md:block" />
          {admissionSteps.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 110} className="relative flex flex-col items-center gap-4 text-center">
                <span className="relative flex size-20 items-center justify-center rounded-full bg-white text-vif shadow-xl ring-8 ring-slate-50">
                  <s.icon aria-hidden className="size-8" />
                  <span className="absolute -top-1 -right-1 flex size-8 items-center justify-center rounded-full bg-avenida-blue-950 font-display text-sm font-extrabold text-white">{i + 1}</span>
                </span>
                <h3 className="font-display text-xl font-bold text-avenida-blue-950">{s.title}</h3>
                <p className="max-w-[16rem] text-sm leading-relaxed text-slate-600">{s.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/preinscription" size="xl">
            <ClipboardList aria-hidden />
            Commencer ma pré-inscription
          </ButtonLink>
          <ButtonLink href="/admissions#dossier" variant="outline" size="xl">
            Pièces à fournir
          </ButtonLink>
        </div>
      </Section>

      {/* Nos diplômés */}
      <section aria-labelledby="graduates-title" className="relative isolate overflow-hidden bg-nuit py-24 text-white sm:py-32">
        <Image src={images.graduates.src} alt="" fill sizes="100vw" className="site-kenburns-slow -z-20 object-cover object-[50%_30%]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#06152E_0%,rgb(6_21_46/0.85)_45%,rgb(6_21_46/0.2)_100%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <SectionTitle
              id="graduates-title"
              eyebrow="Nos diplômés"
              title={
                <>
                  Ils sont devenus des <Accent inverted>professionnels</Accent>
                </>
              }
              description="Chaque année, nos diplômés rejoignent hôtels, restaurants et agences de voyage, ou créent leur propre activité."
              inverted
            />
            <ul className="mt-8 flex flex-wrap gap-2">
              {careers.map((c) => (
                <li key={c} className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-md">
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* L'Hôtel & le restaurant */}
      <Section aria-labelledby="hotel-title">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionTitle
            id="hotel-title"
            eyebrow="L'Hôtel Avenida"
            title={
              <>
                Séjournez, dînez, <Accent>soutenez</Accent> la formation
              </>
            }
            description="Chaque séjour et chaque repas permettent à nos élèves de se former au contact de vrais clients."
          />
          <ButtonLink href="/hotel#reserver" className="shrink-0">
            <BedDouble aria-hidden />
            Demande de réservation
          </ButtonLink>
        </div>
        <div className="grid auto-rows-[13rem] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { image: images.roomGarden, label: "Chambres", href: "/hotel#chambres", cls: "sm:col-span-2 sm:row-span-2" },
            { image: images.plating, label: "Restaurant", href: "/hotel#restaurant", cls: "" },
            { image: images.reception, label: "Réception", href: "/hotel", cls: "" },
            { image: images.diningRoom, label: "Salle & bar", href: "/hotel#restaurant", cls: "sm:col-span-2" },
          ].map((t, i) => (
            <Reveal key={t.label} delay={i * 80} className={t.cls}>
              <Link href={t.href} className="group relative block size-full overflow-hidden rounded-3xl shadow-lg">
                <Image src={t.image.src} alt={t.image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-nuit/85 via-transparent to-transparent" />
                <span className="absolute bottom-0 left-0 flex items-center gap-2 p-5 font-display text-xl font-extrabold text-white">
                  {t.label}
                  <ArrowRight aria-hidden className="size-5 -translate-x-2 text-vif-clair opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
        <p className="mt-3 text-right text-xs text-slate-400">Photos d&apos;ambiance · visuels non contractuels</p>
      </Section>

      {/* FAQ */}
      <Section tone="muted" aria-labelledby="faq-title">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <SectionTitle
              id="faq-title"
              eyebrow="Questions fréquentes"
              title={
                <>
                  Vous avez des <Accent>questions</Accent> ?
                </>
              }
              description="Les réponses aux questions les plus posées par les familles. Une autre question ? Écrivez-nous."
            />
            <div className="flex flex-col gap-4 rounded-3xl bg-nuit p-6 text-white">
              <p className="font-display text-lg font-bold">Parlons de votre projet</p>
              <p className="text-sm text-white/70">Choisissez votre moyen de contact :</p>
              <ul className="flex gap-3">
                {[
                  { href: whatsappUrl(siteConfig.whatsapp, "Bonjour, j'ai une question sur l'Hôtel École Avenida."), label: "WhatsApp", icon: MessageCircle, ext: true },
                  { href: `tel:${siteConfig.phones[0].e164}`, label: "Appeler", icon: Phone },
                  { href: `mailto:${siteConfig.email}`, label: "E-mail", icon: Mail },
                  { href: "/contact", label: "Formulaire", icon: ClipboardList },
                ].map((c) => (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      target={c.ext ? "_blank" : undefined}
                      rel={c.ext ? "noopener noreferrer" : undefined}
                      title={c.label}
                      className="group flex flex-col items-center gap-1.5 text-[11px] font-bold text-white/80 transition-colors hover:text-white"
                    >
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-avenida-blue-950 transition-colors group-hover:text-vif">
                        <c.icon aria-hidden className="size-5" />
                      </span>
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-sm font-semibold text-white">{siteConfig.phones[0].display}</p>
            </div>
          </div>
          <Reveal>
            <Faq items={faq} />
          </Reveal>
        </div>
      </Section>

      {/* Appel final */}
      <Section tone="flag" aria-labelledby="cta-title" className="relative overflow-hidden">
        <div aria-hidden className="bg-avenida-pattern absolute inset-0 opacity-10" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
            <Utensils aria-hidden className="size-8 text-white" />
          </span>
          <AnimatedHeadline id="cta-title" text={siteConfig.tagline} className="font-display text-4xl font-extrabold text-balance sm:text-6xl" />
          <p className="text-lg text-white/90">Inscriptions ouvertes pour la rentrée du 26 octobre 2026. Le bureau vous reçoit {siteConfig.officeHours.toLowerCase()}.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/preinscription" variant="white" size="xl">
              <ClipboardList aria-hidden />
              Je me pré-inscris
            </ButtonLink>
            <ButtonLink href="/contact" variant="glass" size="xl">
              Nous contacter
            </ButtonLink>
          </div>
        </div>
      </Section>
      <CmsSections page="accueil" />
    </>
  );
}
