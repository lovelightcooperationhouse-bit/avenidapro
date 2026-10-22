import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Logo du site public : monogramme HA + « HÔTEL ÉCOLE AVENIDA » en capitales à empattements, comme la brochure. */
export function SiteLogo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="Hôtel École Avenida, retour à l'accueil" className={cn("flex shrink-0 items-center gap-3", className)}>
      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200 lg:size-14">
        <Image src="/logoavenida.jpg" alt="" fill sizes="56px" className="object-contain" priority />
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("font-serif text-[0.8rem] font-bold tracking-[0.12em] lg:text-sm", inverted ? "text-white" : "text-avenida-blue")}>HÔTEL ÉCOLE</span>
        <span className={cn("font-serif text-xl font-extrabold tracking-[0.08em] lg:text-2xl", inverted ? "text-red-400" : "text-avenida-red")}>AVENIDA</span>
        <span className={cn("mt-1 hidden text-[0.6rem] font-semibold tracking-[0.18em] uppercase sm:block", inverted ? "text-white/60" : "text-slate-500")}>
          Travail · Discipline · Excellence
        </span>
      </span>
    </Link>
  );
}
