"use client";

import { officialSignatory } from "@/lib/official";
import { useCardSettings } from "./IdCard";
import { OfficialSeal } from "./OfficialSeal";

/** Bloc affiché au scan du QR code : le document porte le tampon de l'école et la signature du Directeur pédagogique. */
export function OfficialAttestation({ what }: { what: string }) {
  const official = officialSignatory(useCardSettings());
  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-center">
      <p className="text-xs font-bold tracking-wide text-blue-900 uppercase">Signature officielle</p>
      <OfficialSeal size="72px" signatory={official} className="my-2" />
      <p className="text-sm font-extrabold text-slate-900">{official.name}</p>
      <p className="text-xs text-slate-600">
        {official.title} · {what} signé(e) et revêtu(e) du tampon officiel de l&apos;Hôtel École Avenida
      </p>
    </div>
  );
}
