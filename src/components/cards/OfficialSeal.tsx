import { OFFICIAL_SIGNATORY, type OfficialSignatory } from "@/lib/official";
import { cn } from "@/lib/utils";

/**
 * Tampon de l'école avec la signature du Directeur pédagogique par-dessus, comme sur un document signé à la main.
 * `size` est la hauteur du tampon (mm, cqw…) ; la signature s'y superpose.
 */
export function OfficialSeal({ size, signatory = OFFICIAL_SIGNATORY, className }: { size: string; signatory?: OfficialSignatory; className?: string }) {
  return (
    <div className={cn("relative mx-auto", className)} style={{ height: size, width: `calc(${size} * 2.5)` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- tampon officiel */}
      <img src={signatory.stamp} alt="Tampon de l'Hôtel École Avenida" className="absolute top-0 left-0 h-full w-auto opacity-90" style={{ transform: "rotate(-9deg)" }} />
      {/* eslint-disable-next-line @next/next/no-img-element -- signature officielle */}
      <img src={signatory.signature} alt={`Signature de ${signatory.name}`} className="absolute top-[14%] right-0 h-[76%] w-auto" />
    </div>
  );
}
