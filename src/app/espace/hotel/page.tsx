"use client";

import { BedDouble } from "lucide-react";
import { SpaceList } from "@/components/campus/SpaceList";

export default function EspaceHotelPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-avenida-blue text-white shadow-lg shadow-avenida-blue/30">
          <BedDouble aria-hidden className="size-7" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-avenida-blue-950 sm:text-4xl">Espace Hôtel</h1>
          <p className="mt-1 max-w-2xl text-slate-600">
            L&apos;espace du personnel de l&apos;hôtel, service par service : consignes, annonces, documents, programme, discussion et réunions en visio.
          </p>
        </div>
      </div>
      <SpaceList kind="hotel" />
    </div>
  );
}
