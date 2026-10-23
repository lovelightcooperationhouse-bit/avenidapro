"use client";

import { MessageSquare, Phone } from "lucide-react";
import Link from "next/link";

export type DirectoryEntry = { id: string; full_name: string; function_title: string | null; subjects: string | null; phones: string | null; position: number; profile_id?: string | null };

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

/** Messagerie interne : écrire directement à la personne (si elle a un compte sur la plateforme). */
export function WriteLink({ profileId, name }: { profileId?: string | null; name: string }) {
  if (!profileId) return <span className="text-xs text-slate-400">Pas encore de compte</span>;
  return (
    <Link href={`/discussions?avec=${profileId}`} aria-label={`Écrire à ${name}`} className="inline-flex items-center gap-1.5 rounded-full bg-[#0C356A] px-3 py-1 text-xs font-bold text-white hover:bg-[#E30613]">
      <MessageSquare aria-hidden className="size-3.5" /> Écrire
    </Link>
  );
}
