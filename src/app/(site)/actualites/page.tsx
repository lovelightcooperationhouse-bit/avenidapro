import type { Metadata } from "next";
import { getSiteImages } from "@/lib/site-images";
import { CmsSections, PostGrid } from "@/components/site/CmsBlocks";
import { PageHeader } from "@/components/site/PageHeader";
import { Section } from "@/components/site/Section";
import { Accent } from "@/components/site/SectionTitle";
import { getPosts } from "@/lib/cms";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Actualités",
  description: "Annonces, événements, articles, photos et vidéos de l'Hôtel École Avenida à Lomé.",
};

export default async function ActualitesPage() {
  const { images } = await getSiteImages();
  const posts = await getPosts(60);
  return (
    <>
      <PageHeader
        eyebrow="Actualités"
        title={
          <>
            La vie à <Accent inverted>Avenida</Accent>
          </>
        }
        description="Annonces, événements, réussites de nos élèves, nouveautés de l'hôtel : suivez-nous et partagez."
        image={images.graduates}
        focus="50% 30%"
        breadcrumbs={[{ label: "Actualités" }]}
      />
      <Section>
        <PostGrid posts={posts} />
      </Section>
      <CmsSections page="actualites" />
    </>
  );
}
