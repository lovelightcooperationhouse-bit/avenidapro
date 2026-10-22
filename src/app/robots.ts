import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://www.hotelecoleavenida.net";

/** Le site public est indexé ; les espaces privés et documents ne le sont pas. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/espace", "/impression", "/discussions", "/reunions", "/verifier", "/api", "/auth"] },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
