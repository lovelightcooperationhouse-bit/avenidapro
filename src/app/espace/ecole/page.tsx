"use client";

import { GraduationCap } from "lucide-react";
import { SpaceList } from "@/components/campus/SpaceList";

export default function EspaceEcolePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-vif text-white shadow-lg shadow-vif/30">
          <GraduationCap aria-hidden className="size-7" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-avenida-blue-950 sm:text-4xl">Espace École</h1>
          <p className="mt-1 max-w-2xl text-slate-600">
            La plateforme numérique de chaque filière : cours en ligne, devoirs, annonces, programme, discussion et cours en direct avec vos professeurs. Chaque filière a sa propre salle.
          </p>
        </div>
      </div>
      <SpaceList kind="ecole" />
    </div>
  );
}
