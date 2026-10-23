"use client";

import { AlertTriangle, BadgeCheck, CalendarCheck, CalendarX, Clock, CreditCard, FileCheck2, Loader2, ShieldAlert, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OfficialAttestation } from "@/components/cards/OfficialAttestation";
import { SiteLogo } from "@/components/site/SiteLogo";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFCFA } from "@/lib/utils";

type Result = {
  valid: boolean;
  reason?: string;
  type?: "eleve" | "personnel";
  name?: string;
  photo?: string | null;
  matricule?: string;
  class?: string;
  year?: string;
  position?: string;
  department?: string;
  status?: string;
  version?: number;
  issued_at?: string;
  payment_ok?: boolean;
  student_id?: string;
  paid?: number;
  remaining?: number;
  total?: number;
  absences_30j?: number;
  retards_30j?: number;
  permission_en_cours?: boolean;
  present_today?: string | null;
};

/**
 * Page ouverte par le QR code d'une carte : validité et situation en temps réel.
 * Le grand public voit l'identité et la validité ; le personnel connecté voit aussi la situation financière et l'assiduité.
 */
export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [r, setR] = useState<Result | null>(null);

  useEffect(() => {
    createClient()
      .rpc("verify_card", { t: token })
      .then(({ data }) => setR((data as Result) ?? { valid: false, reason: "Carte inconnue" }));
  }, [token]);

  return (
    <div className="flex min-h-dvh flex-col items-center bg-slate-100 px-4 py-8">
      <SiteLogo />
      <main className="mt-8 w-full max-w-md">
        {!r ? (
          <div className="flex justify-center p-10">
            <Loader2 aria-label="Vérification" className="size-8 animate-spin text-avenida-blue" />
          </div>
        ) : !r.name ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-8 text-center shadow-xl">
            <XCircle aria-hidden className="size-16 text-vif" />
            <h1 className="font-display text-2xl font-extrabold text-avenida-blue-950">Carte non valide</h1>
            <p className="text-slate-600">{r.reason ?? "Cette carte n'est pas reconnue par l'Hôtel École Avenida."}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className={cn("flex items-center gap-3 px-6 py-4 text-white", r.valid ? "bg-emerald-600" : "bg-vif")}>
              {r.valid ? <BadgeCheck aria-hidden className="size-8" /> : <ShieldAlert aria-hidden className="size-8" />}
              <div>
                <p className="font-display text-xl font-extrabold">{r.valid ? "Carte valide" : "Carte non valide"}</p>
                <p className="text-sm text-white/85">
                  {r.type === "eleve" ? "Carte scolaire" : "Carte de travail"} · version {r.version}
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-6">
              <div className="size-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element -- photo stockée en data URL */}
                {r.photo && !r.photo.includes("default.png") ? <img src={r.photo} alt={`Photo de ${r.name}`} className="size-full object-cover" /> : null}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl leading-tight font-extrabold text-avenida-blue-950 uppercase">{r.name}</h1>
                <p className="font-semibold text-vif">{r.type === "eleve" ? r.class : r.position}</p>
                <p className="text-sm text-slate-500">{r.type === "eleve" ? r.year : r.department}</p>
                <p className="mt-1 font-mono text-lg font-bold tracking-wider">{r.matricule}</p>
              </div>
            </div>

            {r.type === "eleve" && (
              <div className="grid gap-3 px-6 pb-6">
                {r.student_id !== undefined && (
                  <>
                    <dl className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <dt className="text-[11px] font-bold text-slate-500">Payé</dt>
                        <dd className="text-sm font-extrabold text-emerald-700">{formatFCFA(r.paid ?? 0)}</dd>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <dt className="text-[11px] font-bold text-slate-500">Reste</dt>
                        <dd className="text-sm font-extrabold text-vif">{formatFCFA(r.remaining ?? 0)}</dd>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <dt className="text-[11px] font-bold text-slate-500">Total</dt>
                        <dd className="text-sm font-extrabold text-avenida-blue-950">{formatFCFA(r.total ?? 0)}</dd>
                      </div>
                    </dl>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                        <CalendarCheck aria-hidden className="size-4 text-emerald-600" />
                        Aujourd&apos;hui : <strong>{r.present_today ?? "non pointé"}</strong>
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                        <FileCheck2 aria-hidden className="size-4 text-sky-600" />
                        {r.permission_en_cours ? <strong>En permission</strong> : "Pas de permission"}
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                        <CalendarX aria-hidden className="size-4 text-vif" />
                        Absences (30 j) : <strong>{r.absences_30j}</strong>
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                        <Clock aria-hidden className="size-4 text-amber-600" />
                        Retards (30 j) : <strong>{r.retards_30j}</strong>
                      </div>
                    </dl>
                    <Link href={`/dashboard/eleves/${r.student_id}`} className="rounded-full bg-avenida-blue py-3 text-center text-sm font-bold text-white hover:bg-avenida-blue-950">
                      Ouvrir le dossier complet
                    </Link>
                  </>
                )}
              </div>
            )}
            {r.student_id === undefined && r.type === "eleve" && (
              <p className="mx-6 mb-6 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle aria-hidden className="size-4 shrink-0" />
                Le personnel de l&apos;école connecté voit aussi la situation financière et l&apos;assiduité.
              </p>
            )}
            {r.valid && r.type === "eleve" && (
              <div className="px-6 pb-6">
                <OfficialAttestation what="Carte scolaire" />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
