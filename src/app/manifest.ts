import type { MetadataRoute } from "next";

/** Application installable (Android, iPhone, ordinateur) : nom, icônes, couleurs et raccourcis. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Hôtel École Avenida",
    short_name: "Avenida",
    description: "École hôtelière et hôtel d'application à Lomé : espace élèves, parents, professeurs, personnel et direction.",
    start_url: "/espace?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0C356A",
    lang: "fr",
    categories: ["education", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Discussions", short_name: "Discussions", url: "/discussions", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Réunions", short_name: "Réunions", url: "/reunions", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Mon espace", short_name: "Espace", url: "/espace", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Gestion", short_name: "Gestion", url: "/dashboard", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
