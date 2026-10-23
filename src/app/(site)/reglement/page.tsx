import { LogIn, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/site/ButtonLink";
import { ReglementDocument } from "@/components/documents/ReglementDocument";
import { PageHeader } from "@/components/site/PageHeader";
import { Section } from "@/components/site/Section";
import { Accent } from "@/components/site/SectionTitle";
import { getSiteImages } from "@/lib/site-images";

export const metadata: Metadata = {
  title: "Règlement intérieur des apprenants",
  description: "Règles de vie, de travail et de discipline de l'Hôtel École Avenida : ponctualité, tenue, hygiène, évaluations, carnet de correspondance et sanctions.",
};

export const revalidate = 60;

export default async function ReglementPage() {
  const { images } = await getSiteImages();
  return (
    <>
      <PageHeader
        pageKey="reglement"
        eyebrow="Vie scolaire"
        title={
          <>
            Règlement <Accent inverted>intérieur</Accent>
          </>
        }
        description="Les règles de vie, de travail et de discipline applicables à tous les apprenants, à l'école, en travaux pratiques et en stage."
        image={images.uniforms}
        breadcrumbs={[{ label: "Règlement intérieur" }]}
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/espace/reglement" size="lg">
            <LogIn aria-hidden />
            Signer dans mon espace
          </ButtonLink>
        </div>
      </PageHeader>
      <Section aria-label="Texte du règlement" tone="muted">
        <p className="mx-auto mb-6 flex max-w-[210mm] items-start gap-3 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-900/5">
          <ScrollText aria-hidden className="mt-0.5 size-5 shrink-0 text-vif" />
          Chaque élève inscrit reçoit ce règlement par e-mail et dans son espace en ligne. L&apos;élève et son parent ou tuteur y signent leur engagement ; le
          document peut être téléchargé en PDF ou imprimé.
        </p>
        <ReglementDocument />
      </Section>
    </>
  );
}
