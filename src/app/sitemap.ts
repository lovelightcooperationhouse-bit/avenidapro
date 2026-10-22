import type { MetadataRoute } from "next";
import { getPages, getPosts } from "@/lib/cms";

const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://www.hotelecoleavenida.net";

export const revalidate = 3600;

/** Plan du site pour les moteurs de recherche : pages fixes, pages créées et publications. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ["", "/ecole", "/hotel", "/admissions", "/preinscription", "/actualites", "/a-propos", "/contact", "/confidentialite", "/conditions-utilisation"];
  const [pages, posts] = await Promise.all([getPages(), getPosts(200)]);
  return [
    ...fixed.map((p) => ({ url: `${SITE}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...pages.map((p) => ({ url: `${SITE}/pages/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...posts.map((p) => ({ url: `${SITE}/actualites/${p.slug}`, lastModified: p.published_at, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
