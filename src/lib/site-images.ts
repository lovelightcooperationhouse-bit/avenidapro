import { images as defaults, type SiteImage } from "@/content/site";
import { getSettings } from "./cms";

/**
 * Images du site avec les remplacements faits dans « Site web › Images ».
 * `im()` remplace aussi les images référencées dans les listes (formations, chambres…).
 */
export async function getSiteImages() {
  const over = (await getSettings()).images ?? {};
  const resolved = Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => {
      const o = over[k];
      return [k, o?.src ? { src: o.src, alt: o.alt || v.alt } : v];
    }),
  ) as typeof defaults;
  const bySrc = new Map<string, SiteImage>(Object.entries(defaults).map(([k, v]) => [v.src, resolved[k as keyof typeof defaults]]));
  const im = (img: SiteImage): SiteImage => bySrc.get(img.src) ?? img;
  return { images: resolved, im, imageMap: Object.fromEntries(bySrc) as Record<string, SiteImage> };
}
