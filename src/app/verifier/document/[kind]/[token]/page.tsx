"use client";

import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatFCFA } from "@/lib/utils";

type Result = Record<string, string | number | boolean | null> & { valid: boolean; reason?: string; type?: string };

/** Vérification publique d'un bulletin ou d'un reçu à partir du QR code imprimé. */
export default function VerifyDocumentPage() {
  const { kind, token } = useParams<{ kind: string; token: string }>();
  const [r, setR] = useState<Result | null>(null);

  useEffect(() => {
    createClient()
      .rpc("verify_document", { k: kind, t: token })
      .then(({ data }) => setR((data as Result) ?? { valid: false, reason: "Document inconnu" }));
  }, [kind, token]);

  const rows: [string, string][] = !r?.valid
    ? []
    : r.type === "bulletin"
      ? [
          ["Élève", String(r.name ?? "")],
          ["Matricule", String(r.matricule ?? "")],
          ["Classe", String(r.class ?? "")],
          ["Période", `${r.period ?? ""} · ${r.year ?? ""}`],
          ["Moyenne générale", r.average !== null ? `${Number(r.average).toFixed(2)}/20` : "—"],
          ["Classement", `${r.rank ?? "—"}${r.total ? ` sur ${r.total}` : ""}`],
          ["Appréciation", String(r.mention ?? "—")],
          ["N° de bulletin", String(r.number ?? "")],
          ["Signé par", `${r.signed_by ?? "—"}, Directeur pédagogique`],
          ["Signé le", r.issued ? new Date(String(r.issued)).toLocaleDateString("fr-FR") : "—"],
          ...(Number(r.revision ?? 0) > 0 ? [["Version", `Bulletin rectifié (${r.revision})`] as [string, string]] : []),
        ]
      : r.type === "situation"
        ? [
            ["Élève", String(r.name ?? "")],
            ["Matricule", String(r.matricule ?? "")],
            ["Classe", String(r.class ?? "")],
            ["Année", String(r.year ?? "")],
            ["Écolage annuel", formatFCFA(Number(r.total ?? 0))],
            ["Total payé", formatFCFA(Number(r.paid ?? 0))],
            ["Reste à payer", formatFCFA(Number(r.remaining ?? 0))],
            ["Statut", String(r.status ?? "")],
            ["Situation au", new Date(String(r.date)).toLocaleString("fr-FR")],
          ]
        : [
          ["Reçu n°", String(r.number ?? "")],
          ["Élève", String(r.name ?? "")],
          ["Matricule", String(r.matricule ?? "")],
          ["Classe", String(r.class ?? "")],
          ["Montant", formatFCFA(Number(r.amount ?? 0))],
          ["Objet", String(r.designation ?? "")],
          ["Date", r.date ? new Date(String(r.date)).toLocaleDateString("fr-FR") : "—"],
          ["Reste à payer à cette date", formatFCFA(Number(r.remaining ?? 0))],
        ];

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
        <header className="flex items-center gap-3 bg-[#06152E] px-5 py-4 text-white">
          <ShieldCheck aria-hidden className="size-6 text-[#FF3B47]" />
          <div>
            <p className="font-serif text-sm font-bold tracking-wider">HÔTEL ÉCOLE AVENIDA</p>
            <p className="text-xs text-white/70">Vérification de document</p>
          </div>
        </header>
        <div className="p-6">
          {!r ? (
            <Loader2 aria-label="Vérification" className="mx-auto size-8 animate-spin text-[#0C356A]" />
          ) : r.valid ? (
            <>
              <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-800">
                <CheckCircle2 aria-hidden className="size-6" /> {r.type === "bulletin" ? "Bulletin authentique" : r.type === "situation" ? "Situation financière à jour" : "Reçu authentique"}
              </p>
              <dl className="mt-4 divide-y divide-slate-100 text-sm">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-2">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="text-right font-semibold text-slate-800">{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 font-bold text-[#B8000F]">
              <XCircle aria-hidden className="size-6" /> {r.reason ?? "Document non valide"}
            </p>
          )}
          <Link href="/" className="mt-6 block text-center text-sm font-bold text-[#0C356A] hover:text-[#E30613]">
            www.hotelecoleavenida.net
          </Link>
        </div>
      </div>
    </main>
  );
}
