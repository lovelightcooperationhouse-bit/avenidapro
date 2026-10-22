"use client";

import { ArrowRight, BedDouble, GraduationCap, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Space } from "@/lib/spaces";

/** Salles auxquelles l'utilisateur a accès (filtrées par la base : aucun mélange entre filières). */
export function SpaceList({ kind }: { kind: Space["kind"] }) {
  const [spaces, setSpaces] = useState<Space[] | null>(null);

  useEffect(() => {
    createClient()
      .from("spaces")
      .select("*")
      .eq("kind", kind)
      .order("name")
      .then(({ data }) => setSpaces((data ?? []) as Space[]));
  }, [kind]);

  const Icon = kind === "ecole" ? GraduationCap : BedDouble;

  if (!spaces) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-white" />)}</div>;

  if (!spaces.length) {
    return (
      <p className="flex items-center gap-3 rounded-3xl bg-amber-50 p-6 text-amber-900 ring-1 ring-amber-200">
        <Lock aria-hidden className="size-5 shrink-0" />
        {kind === "ecole"
          ? "Vous n'êtes rattaché·e à aucune filière pour le moment. La direction pédagogique configure l'accès des élèves et des professeurs."
          : "Vous n'êtes affecté·e à aucun service de l'hôtel pour le moment. La direction vous ajoutera à votre service."}
      </p>
    );
  }

  // Regroupement par diplôme (école) pour une lecture claire
  const groups = kind === "ecole" ? [...new Set(spaces.map((s) => s.program_code ?? "Autres"))] : ["Services de l'hôtel"];

  return (
    <div className="flex flex-col gap-8">
      {groups.map((g) => (
        <section key={g}>
          {kind === "ecole" && <h2 className="mb-3 font-display text-xl font-extrabold text-avenida-blue-950">{g}</h2>}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spaces
              .filter((s) => (kind === "ecole" ? (s.program_code ?? "Autres") === g : true))
              .map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/espace/salle/${s.id}`}
                    className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: s.color ?? "#0C356A" }} />
                    <span className="flex size-12 items-center justify-center rounded-2xl text-white" style={{ background: s.color ?? "#0C356A" }}>
                      <Icon aria-hidden className="size-6" />
                    </span>
                    <span className="font-display text-lg font-bold text-avenida-blue-950">{s.name}</span>
                    <span className="text-sm text-slate-500">{s.description ?? (kind === "ecole" ? "Cours, devoirs, annonces, programme, discussion et visio" : "Consignes, annonces, documents et discussion")}</span>
                    <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-vif">
                      Entrer dans la salle
                      <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
