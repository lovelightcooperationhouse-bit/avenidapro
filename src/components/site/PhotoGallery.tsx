import Image from "next/image";
import type { SiteImage } from "@/content/site";
import { Reveal } from "./Reveal";

/** Galerie de photos réelles (mosaïque) ; la première photo est mise en avant. */
export function PhotoGallery({ photos }: { photos: SiteImage[] }) {
  return (
    <ul className="grid auto-rows-[12rem] grid-cols-2 gap-3 sm:auto-rows-[14rem] sm:gap-4 lg:grid-cols-4">
      {photos.map((p, i) => (
        <li key={p.src + i} className={i === 0 ? "col-span-2 row-span-2" : ""}>
          <Reveal delay={(i % 4) * 70} className="group relative size-full overflow-hidden rounded-3xl bg-slate-100 shadow-md ring-1 ring-slate-900/5">
            <Image src={p.src} alt={p.alt} fill sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"} className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 sm:text-sm">{p.alt}</span>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
