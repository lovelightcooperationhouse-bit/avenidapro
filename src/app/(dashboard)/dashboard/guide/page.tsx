"use client";

import { LifeBuoy, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { GuideCard, InstallButton } from "@/components/guide/GuideView";
import { adminWorkflows, commonGuides } from "@/content/guides";
import { useAuth } from "@/context/AuthContext";
import { ROLE_CONFIG, ROLE_SCOPE, STAFF_ROLES, type RoleType } from "@/lib/roles";
import { cn } from "@/lib/utils";

/** Guide de l'espace de gestion : rôles, responsabilités et procédures pas à pas. */
export default function AdminGuidePage() {
  const { user } = useAuth();
  const isDG = user?.role === "directeur_general";
  const [role, setRole] = useState<RoleType | "">(isDG ? "" : (user?.role ?? ""));
  if (!user) return null;
  const shown = adminWorkflows.filter((w) => !role || w.roles.includes(role));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
            <LifeBuoy aria-hidden className="size-6 text-[#E30613]" /> Guide de la gestion
          </h1>
          <p className="mt-1 text-sm text-slate-600">Qui fait quoi, et comment, pour une utilisation fluide de la plateforme.</p>
        </div>
        <InstallButton />
      </div>

      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-black text-[#0C356A]">
          <ShieldCheck aria-hidden className="size-5" /> Les rôles et leurs responsabilités
        </h2>
        <p className="text-sm text-slate-600">
          Seul le Directeur général attribue les rôles. Chaque responsable ne voit que les pages de son département ; les décisions finales (validation des
          dossiers, rôles, contenu du site) restent au DG.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(ROLE_CONFIG) as RoleType[]).map((r) => (
            <div key={r} className={cn("rounded-2xl p-4 ring-1", r === user.role ? "bg-red-50/60 ring-[#E30613]/40" : "ring-slate-200")}>
              <p className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800">{ROLE_CONFIG[r].label}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{STAFF_ROLES.includes(r) ? "Gestion" : "Espace personnel"}</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">{ROLE_SCOPE[r]}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-slate-600">Procédures pour :</span>
        {isDG && (
          <button type="button" onClick={() => setRole("")} className={cn("rounded-full px-3 py-1.5 text-xs font-bold ring-1", !role ? "bg-[#0C356A] text-white ring-[#0C356A]" : "ring-slate-200")}>
            Tous
          </button>
        )}
        {STAFF_ROLES.filter((r) => isDG || r === user.role).map((r) => (
          <button key={r} type="button" onClick={() => setRole(r)} className={cn("rounded-full px-3 py-1.5 text-xs font-bold ring-1", role === r ? "bg-[#0C356A] text-white ring-[#0C356A]" : "ring-slate-200")}>
            {ROLE_CONFIG[r].label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {shown.map((g, i) => (
          <GuideCard key={g.id} guide={g} open={i === 0} />
        ))}
        {commonGuides.map((g) => (
          <GuideCard key={g.id} guide={g} />
        ))}
      </div>
    </div>
  );
}
