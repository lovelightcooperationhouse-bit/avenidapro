import { ArrowRight, BedDouble, CalendarDays, Check, ChefHat, Clock, GraduationCap, Home, Phone, Quote, Utensils, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/site/ButtonLink";
import { HeroSlider } from "@/components/site/HeroSlider";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Accent, SectionTitle } from "@/components/site/SectionTitle";
import { StatCounter } from "@/components/site/StatCounter";
import { formatCFA, formations, images, intakes, keyFigures, siteConfig, specialties, studyOptions } from "@/content/site";

export default function HomePage() {
  return (
    <>
      <HeroSlider />

      {/* Chiffres clés */}
      <section aria-labelledby="stats-title" className="bg-avenida-blue py-16 text-white sm:py-20">
        <h2 id="stats-title" className="sr-only">
          L&apos;Hôtel École Avenida en chiffres
        </h2>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-12 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {keyFigures.map((f) => (
            <StatCounter key={f.label} value={f.value} suffix={f.suffix} label={f.label} />
          ))}
        </div>
      </section>

      {/* Qui sommes-nous */}
      <Section aria-labelledby="about-title">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl sm:aspect-[4/3] lg:aspect-[4/5]">
              <Image src={images.building.src} alt={images.building.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="absolute -right-2 -bottom-6 max-w-[16rem] rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-900/5 sm:-right-6">
              <p className="font-serif text-2xl font-extrabold text-avenida-red">Hôtel + École</p>
              <p className="text-sm text-slate-600">Un même établissement pour apprendre et pratiquer, à la Cocoteraie, Lomé.</p>
            </div>
            <div aria-hidden className="absolute -top-5 -left-5 -z-10 size-32 rounded-full bg-avenida-red/20 blur-2xl" />
          </Reveal>

          <Reveal delay={120} className="flex flex-col gap-6">
            <SectionTitle
              id="about-title"
              eyebrow="Qui sommes-nous"
              title={
                <>
                  Une école <Accent>hôtelière</Accent> au cœur d&apos;un vrai hôtel
                </>
              }
            />
            <p className="text-lg leading-relaxed text-slate-600">
              L&apos;<strong className="text-avenida-blue">Hôtel École Avenida</strong> forme aux métiers de l&apos;hôtellerie, de la restauration et du
              tourisme. Nos élèves préparent des diplômes d&apos;État, du CFA au BTS, et pratiquent dans les conditions réelles de notre hôtel.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {studyOptions.map((o) => (
                <li key={o} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="flex size-5 items-center justify-center rounded-full bg-avenida-red text-white">
                    <Check aria-hidden className="size-3" />
                  </span>
                  {o}
                </li>
              ))}
            </ul>
            <figure className="relative rounded-2xl border-l-4 border-avenida-red bg-avenida-blue-50 p-6">
              <Quote aria-hidden className="absolute top-4 right-4 size-8 text-avenida-red/30" />
              <blockquote className="font-serif text-xl leading-snug font-bold text-avenida-blue">{siteConfig.motto}</blockquote>
              <figcaption className="mt-2 text-sm text-slate-600">Devise de l&apos;Hôtel École Avenida</figcaption>
            </figure>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/a-propos" variant="blue">
                En savoir plus
                <ArrowRight aria-hidden />
              </ButtonLink>
              <ButtonLink href="/ecole" variant="outline">
                Nos formations
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Les deux pôles */}
      <Section tone="muted" aria-labelledby="poles-title">
        <SectionTitle
          id="poles-title"
          eyebrow="Deux pôles, une même exigence"
          title="Se former ou séjourner chez nous"
          description="L'école forme les professionnels de demain ; l'hôtel les accueille en situation réelle et reçoit ses clients."
          align="center"
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {[
            {
              href: "/ecole",
              image: images.students,
              tag: "L'École",
              title: "Diplômes d'État, du CFA au BTS",
              text: "Cuisine, pâtisserie, restaurant, bar, réception, étages et hébergement. Cours du jour ou du soir, internat sur place.",
              cta: "Découvrir les formations",
              icon: GraduationCap,
              color: "bg-avenida-blue",
            },
            {
              href: "/hotel",
              image: images.housekeeping,
              tag: "L'Hôtel",
              title: "Un hôtel d'application à Lomé",
              text: "Chambres, restaurant et bar tenus par nos équipes et nos élèves, avec le sens du service et de l'accueil.",
              cta: "Découvrir l'hôtel",
              icon: BedDouble,
              color: "bg-avenida-red",
            },
          ].map((p, i) => (
            <Reveal key={p.href} delay={i * 120}>
              <Link href={p.href} className="group relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-3xl p-8 text-white shadow-xl sm:p-10">
                <Image src={p.image.src} alt={p.image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="-z-20 object-cover transition-transform duration-700 group-hover:scale-110" />
                <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-avenida-blue-950 via-avenida-blue-950/70 to-avenida-blue-950/10" />
                <span className={`mb-4 inline-flex w-fit items-center gap-2 rounded-full ${p.color} px-4 py-1.5 text-xs font-bold tracking-widest uppercase`}>
                  <p.icon aria-hidden className="size-4" />
                  {p.tag}
                </span>
                <h3 className="font-display text-3xl font-extrabold">{p.title}</h3>
                <p className="mt-3 max-w-lg leading-relaxed text-white/85">{p.text}</p>
                <span className="mt-6 inline-flex items-center gap-2 font-bold text-red-300">
                  {p.cta}
                  <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Spécialités */}
      <Section aria-labelledby="specialties-title">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionTitle
            id="specialties-title"
            eyebrow="Nos spécialités"
            title="Trois grands métiers, huit spécialités"
            description="De la cuisine à la réception, chaque filière prépare à un métier concret de l'hôtellerie et de la restauration."
          />
          <ButtonLink href="/ecole#specialites" variant="outline" className="shrink-0">
            Toutes les spécialités
            <ArrowRight aria-hidden />
          </ButtonLink>
        </div>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {specialties.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 100} className="h-full">
                <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
                  <span aria-hidden className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 bg-[image:linear-gradient(90deg,#0C356A,#DC2626)] transition-transform duration-500 group-hover:scale-x-100" />
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image src={s.image.src} alt={s.image.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <span className="-mt-12 flex size-14 items-center justify-center rounded-2xl bg-avenida-red text-white shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:rotate-6">
                      <s.icon aria-hidden className="size-7" />
                    </span>
                    <h3 className="font-display text-xl font-bold text-avenida-blue">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{s.text}</p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      {/* Formations */}
      <Section tone="blue" aria-labelledby="formations-title" className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-avenida-red/20 blur-3xl" />
        <SectionTitle
          id="formations-title"
          eyebrow="Au menu 2026-2027"
          title={
            <>
              Cinq diplômes pour <Accent inverted>réussir</Accent>
            </>
          }
          description="Inscription dès 10 000 F, paiement de la scolarité en 8 tranches, bourses sur étude de dossier."
          align="center"
          inverted
        />
        <ol className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {formations.map((f, i) => (
            <li key={f.code}>
              <Reveal delay={i * 70} className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:bg-white/10">
                <p className="font-serif text-3xl font-extrabold text-red-400">{f.code}</p>
                <p className="text-sm font-semibold leading-snug">{f.name}</p>
                <dl className="mt-auto grid gap-1 text-xs text-white/75">
                  <div className="flex justify-between gap-2">
                    <dt>Durée</dt>
                    <dd className="font-bold text-white">{f.duration}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Niveau</dt>
                    <dd className="text-right font-bold text-white">{f.level}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Scolarité / an</dt>
                    <dd className="font-bold text-white">{formatCFA(f.tuition)}</dd>
                  </div>
                </dl>
              </Reveal>
            </li>
          ))}
        </ol>
        <div className="relative mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/ecole#formations" variant="white">
            Détail des formations
            <ArrowRight aria-hidden />
          </ButtonLink>
          <ButtonLink href="/admissions">
            <GraduationCap aria-hidden />
            S&apos;inscrire
          </ButtonLink>
        </div>
      </Section>

      {/* Infos pratiques */}
      <Section aria-labelledby="practical-title">
        <SectionTitle id="practical-title" eyebrow="Infos pratiques" title="Tout pour bien préparer votre rentrée" align="center" />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarDays, title: "3 rentrées", text: intakes.join(" · "), href: "/admissions#rentrees" },
            { icon: Clock, title: "Jour ou soir", text: "7 h 30 – 14 h 30 ou 18 h 30 – 21 h 30, du lundi au vendredi", href: "/ecole#horaires" },
            { icon: Wallet, title: "8 tranches", text: "Mensuelles, ou 3 tranches trimestrielles dès l'inscription", href: "/admissions#tarifs" },
            { icon: Home, title: "Internat", text: "30 000 F par mois + 3 mois de caution", href: "/admissions#internat" },
          ].map((c, i) => (
            <li key={c.title}>
              <Reveal delay={i * 80} className="h-full">
                <Link
                  href={c.href}
                  className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                >
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-avenida-blue-50 text-avenida-red transition-all duration-300 group-hover:rotate-6 group-hover:bg-avenida-red group-hover:text-white">
                    <c.icon aria-hidden className="size-7" />
                  </span>
                  <h3 className="font-display text-lg font-bold text-avenida-blue">{c.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{c.text}</p>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-avenida-red">
                    En savoir plus
                    <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      {/* Bandeau hôtel */}
      <section aria-labelledby="hotel-cta-title" className="px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-3xl bg-avenida-blue-950 text-white shadow-xl lg:grid-cols-2">
          <div className="relative min-h-64 lg:min-h-full">
            <Image src={images.kitchen.src} alt={images.kitchen.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-avenida-blue-950/70 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-avenida-blue-950" />
          </div>
          <div className="flex flex-col gap-5 p-8 sm:p-12">
            <p className="text-sm font-bold tracking-widest text-red-300 uppercase">L&apos;Hôtel Avenida</p>
            <h2 id="hotel-cta-title" className="font-display text-3xl font-extrabold sm:text-4xl">
              Séjournez, déjeunez, <Accent inverted>soutenez</Accent> la formation
            </h2>
            <p className="leading-relaxed text-white/80">
              Chaque séjour et chaque repas à l&apos;Hôtel École Avenida permettent à nos élèves de se former au contact de vrais clients.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/hotel#reserver">
                <BedDouble aria-hidden />
                Réserver
              </ButtonLink>
              <ButtonLink href="/hotel#restaurant" variant="ghost">
                <Utensils aria-hidden />
                Le restaurant
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Appel final */}
      <Section tone="flag" aria-labelledby="cta-title" className="relative overflow-hidden">
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <ChefHat aria-hidden className="size-12 text-red-300" />
          <h2 id="cta-title" className="font-display text-3xl font-extrabold text-balance sm:text-5xl">
            {siteConfig.tagline}
          </h2>
          <p className="text-lg text-white/85">
            Inscriptions ouvertes pour la rentrée du {intakes[0]}. Le bureau vous reçoit du lundi au vendredi, de 9 h à 14 h.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/admissions">
              <GraduationCap aria-hidden />
              S&apos;inscrire
            </ButtonLink>
            <ButtonLink href="/contact" variant="white">
              <Phone aria-hidden />
              Nous contacter
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
