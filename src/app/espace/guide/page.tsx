"use client";

import { LifeBuoy } from "lucide-react";
import { GuideCard, InstallButton } from "@/components/guide/GuideView";
import { commonGuides, memberGuides, startGuide } from "@/content/guides";
import { useAuth } from "@/context/AuthContext";
import { ROLE_SCOPE } from "@/lib/roles";

/** Guide de l'espace personnel, adapté au rôle du membre. */
export default function GuidePage() {
  const { user } = useAuth();
  if (!user) return null;
  const mine = memberGuides[user.role];
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold tracking-widest text-vif uppercase">
            <LifeBuoy aria-hidden className="size-4" /> Guide
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-avenida-blue">Comment utiliser Avenida</h1>
          <p className="mt-1 text-sm text-slate-600">
            Vous êtes <strong>{user.roleLabel}</strong> : {ROLE_SCOPE[user.role]}
          </p>
        </div>
        <InstallButton />
      </div>
      {user.role === "candidat" && <GuideCard guide={startGuide} open />}
      {mine && <GuideCard guide={mine} open />}
      {commonGuides.map((g) => (
        <GuideCard key={g.id} guide={g} />
      ))}
      {user.role !== "candidat" && <GuideCard guide={startGuide} />}
    </div>
  );
}
