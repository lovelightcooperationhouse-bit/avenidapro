import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { siteConfig } from "@/content/site";
import { Container } from "./Section";

export type LegalSection = { id: string; title: string; body: ReactNode };

/**
 * Mise en page des pages juridiques (confidentialité, conditions) :
 * sommaire collant sur grand écran, articles numérotés, encadré de contact.
 */
export function LegalDocument({ updated, intro, sections, related }: { updated: string; intro: ReactNode; sections: LegalSection[]; related: { label: string; href: string } }) {
  const { address } = siteConfig;
  return (
    <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[16rem_1fr] lg:gap-16">
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <nav aria-label="Sommaire" className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-900/5">
          <p className="text-xs font-bold tracking-widest text-vif uppercase">Sommaire</p>
          <ol className="mt-4 flex flex-col gap-2 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex gap-2 font-semibold text-slate-600 hover:text-vif">
                  <span className="text-vif">{i + 1}.</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
          <Link href={related.href} className="mt-6 block border-t border-slate-200 pt-4 text-sm font-bold text-avenida-blue hover:text-vif">
            {related.label} →
          </Link>
        </nav>
      </aside>

      <article className="flex max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-500">Dernière mise à jour : {updated}</p>
          <div className="text-lg leading-relaxed text-slate-700">{intro}</div>
        </div>

        {sections.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-titre`} className="scroll-mt-32">
            <h2 id={`${s.id}-titre`} className="font-display text-2xl font-extrabold text-avenida-blue-950">
              <span className="text-vif">{i + 1}.</span> {s.title}
            </h2>
            <div className="mt-4 flex flex-col gap-4 leading-relaxed text-slate-700 [&_li]:pl-1 [&_strong]:text-slate-900 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">{s.body}</div>
          </section>
        ))}

        <div className="flex flex-col gap-3 rounded-3xl bg-nuit p-7 text-white">
          <p className="font-display text-xl font-bold">Une question ? Écrivez-nous.</p>
          <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-2 text-white/85 hover:text-white">
            <Mail aria-hidden className="size-4 text-vif-clair" />
            {siteConfig.email}
          </a>
          <a href={`tel:${siteConfig.phones[0].e164}`} className="flex items-center gap-2 text-white/85 hover:text-white">
            <Phone aria-hidden className="size-4 text-vif-clair" />
            {siteConfig.phones[0].display}
          </a>
          <p className="flex items-center gap-2 text-white/85">
            <MapPin aria-hidden className="size-4 shrink-0 text-vif-clair" />
            {address.street}, {address.district} · {address.postal} {address.city}, {address.country}
          </p>
        </div>
      </article>
    </Container>
  );
}
