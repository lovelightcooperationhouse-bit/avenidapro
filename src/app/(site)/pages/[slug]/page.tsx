import type { Metadata } from "next";
import { getSiteImages } from "@/lib/site-images";
import { notFound } from "next/navigation";
import { CmsSections } from "@/components/site/CmsBlocks";
import { PageHeader } from "@/components/site/PageHeader";
import { getPage } from "@/lib/cms";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPage((await params).slug);
  return page ? { title: page.title, description: page.description ?? undefined } : { title: "Page introuvable" };
}

/** Page créée par la direction depuis l'administration : en-tête + sections. */
export default async function CustomPage({ params }: Props) {
  const { images } = await getSiteImages();
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <>
      <PageHeader
        eyebrow={page.eyebrow ?? undefined}
        title={page.title}
        description={page.description ?? undefined}
        image={page.header_image ? { src: page.header_image, alt: "" } : images.building}
        breadcrumbs={[{ label: page.title }]}
      />
      <CmsSections page={slug} />
    </>
  );
}
