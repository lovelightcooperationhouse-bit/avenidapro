import { Fragment } from "react";
import { OfficialSeal } from "@/components/cards/OfficialSeal";
import { siteConfig } from "@/content/site";
import { reglementChapitres, reglementPreambule, reglementSignataire, REGLEMENT_VERSION, type ReglementBlock } from "@/content/reglement";

/** Texte avec passages **en gras**. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function Blocks({ blocks }: { blocks: ReglementBlock[] }) {
  return (
    <>
      {blocks.map((b, i) =>
        typeof b === "string" ? (
          <p key={i} className="mt-1.5 text-justify">
            <Rich text={b} />
          </p>
        ) : b.ordered ? (
          <ol key={i} className="mt-1.5 list-decimal space-y-1 pl-6">
            {b.list.map((li) => (
              <li key={li}>
                <Rich text={li} />
              </li>
            ))}
          </ol>
        ) : (
          <ul key={i} className="mt-1.5 list-disc space-y-1 pl-6">
            {b.list.map((li) => (
              <li key={li}>
                <Rich text={li} />
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}

export type ReglementIdentity = { student?: string; className?: string; phone?: string; guardian?: string; guardianPhone?: string; year?: string };
export type ReglementSignature = { name: string; role: "eleve" | "parent"; date: string };

/**
 * Règlement intérieur au format A4 (aperçu, PDF, image, impression).
 * Avec une identité, l'en-tête du carnet est rempli ; les signatures en ligne figurent dans l'engagement final.
 */
export function ReglementDocument({ identity, signatures = [], id = "avenida-reglement" }: { identity?: ReglementIdentity; signatures?: ReglementSignature[]; id?: string }) {
  const field = (label: string, value?: string) => (
    <p className="flex gap-2 border-b border-dotted border-slate-400 py-1">
      <span className="shrink-0 font-bold">{label} :</span>
      <span className="font-semibold text-[#0C356A]">{value || " "}</span>
    </p>
  );
  const sig = (role: "eleve" | "parent") => signatures.find((s) => s.role === role);
  return (
    <article id={id} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }} className="mx-auto w-full max-w-[210mm] bg-white px-6 py-8 text-[13px] leading-relaxed text-slate-800 shadow-lg sm:px-12 print:max-w-none print:shadow-none">
      <header className="flex items-center gap-4 border-b-4 border-double border-[#0C356A] pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo */}
        <img src="/logo-avenida.png" alt="" className="size-16 object-contain" />
        <div className="flex-1">
          <p className="font-sans text-lg font-black tracking-wide text-[#0C356A]">
            HÔTEL ÉCOLE <span className="text-[#E30613]">AVENIDA</span>
          </p>
          <p className="font-sans text-xs text-slate-500">
            {siteConfig.address.street}, {siteConfig.address.district}, {siteConfig.address.city} · {siteConfig.phones[0].display}
          </p>
        </div>
        <p className="font-sans text-right text-[10px] font-bold text-slate-500 uppercase">
          Version
          <br />
          {REGLEMENT_VERSION}
        </p>
      </header>

      <h1 className="mt-6 text-center font-sans text-2xl font-black text-[#0C356A] uppercase underline decoration-[#E30613] decoration-2 underline-offset-8">Règlement intérieur des apprenants</h1>
      <p className="mt-3 text-center font-sans text-sm font-bold">Carnet de correspondance</p>
      <p className="text-center font-sans text-sm font-bold text-[#E30613]">Devise : {siteConfig.motto}</p>

      <section className="mt-5 grid gap-x-8 sm:grid-cols-2">
        {field("Année scolaire", identity?.year)}
        {field("Classe / Filière", identity?.className)}
        {field("Nom et prénoms de l'apprenant", identity?.student)}
        {field("Téléphone", identity?.phone)}
        {field("Nom du parent ou tuteur", identity?.guardian)}
        {field("Téléphone", identity?.guardianPhone)}
      </section>

      <h2 className="mt-7 font-sans text-lg font-black text-[#0C356A]">Préambule</h2>
      <Blocks blocks={reglementPreambule} />

      {reglementChapitres.map((c) => (
        <section key={c.title} className="mt-7 break-inside-avoid-page">
          <h2 className="border-b border-slate-200 pb-1 text-center font-sans text-lg font-black text-[#0C356A]">{c.title}</h2>
          {c.articles.map((a) => (
            <div key={a.title} className="mt-4">
              <h3 className="font-sans text-[14px] font-extrabold text-slate-900">{a.title}</h3>
              <Blocks blocks={a.blocks} />
            </div>
          ))}
        </section>
      ))}

      <section className="mt-10 break-inside-avoid rounded-xl border-2 border-[#0C356A] p-5">
        <h2 className="font-sans text-lg font-black text-[#0C356A]">Engagement de l&apos;apprenant et de sa famille</h2>
        <p className="mt-2">Je soussigné(e), apprenant(e), reconnais avoir pris connaissance du présent règlement et m&apos;engage à le respecter.</p>
        <div className="mt-2 grid gap-x-8 sm:grid-cols-2">
          {field("Nom et signature de l'apprenant", sig("eleve") ? `${sig("eleve")!.name} — signé en ligne` : identity?.student)}
          {field("Date", sig("eleve")?.date)}
        </div>
        <p className="mt-4">Je soussigné(e), parent ou tuteur, reconnais avoir pris connaissance du présent règlement et m&apos;engage à accompagner l&apos;apprenant dans son respect.</p>
        <div className="mt-2 grid gap-x-8 sm:grid-cols-2">
          {field("Nom et signature du parent ou tuteur", sig("parent") ? `${sig("parent")!.name} — signé en ligne` : identity?.guardian)}
          {field("Date", sig("parent")?.date)}
          {field("Téléphone", identity?.guardianPhone)}
        </div>
        <div className="mt-8 text-right font-sans">
          <p className="text-sm font-bold">{reglementSignataire.title}</p>
          <OfficialSeal size="22mm" className="mt-2 mr-0 ml-auto" />
          <p className="mt-1 text-sm font-black">{reglementSignataire.name}</p>
        </div>
      </section>
    </article>
  );
}
