"use client";

import { Phone } from "lucide-react";

export type DirectoryEntry = { id: string; full_name: string; function_title: string | null; subjects: string | null; phones: string | null; position: number };

/** Liens d'appel pour chaque numéro (« +228 90 00 00 00 / +228 91 … »). */
export function PhoneLinks({ phones }: { phones: string | null }) {
  if (!phones) return <span className="text-slate-400">—</span>;
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {phones.split("/").map((p) => (
        <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 font-semibold whitespace-nowrap text-avenida-blue hover:text-vif">
          <Phone aria-hidden className="size-3.5" /> {p.trim()}
        </a>
      ))}
    </span>
  );
}
