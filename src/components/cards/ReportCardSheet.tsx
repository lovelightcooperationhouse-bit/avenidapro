"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { siteConfig } from "@/content/site";
import type { SubjectLine } from "@/lib/bulletins";
import { createClient } from "@/lib/supabase/client";

export type ReportCard = {
  id: string;
  token: string;
  bulletin_number: string | null;
  student_id: string;
  student_name: string | null;
  student_matricule: string | null;
  student_number: string | null;
  class_name: string | null;
  program_code: string | null;
  academic_year: string | null;
  term: number;
  period: string | null;
  gender: string | null;
  birth_date: string | null;
  birth_place: string | null;
  nationality: string | null;
  photo_url: string | null;
  subjects_data: SubjectLine[];
  total_coefficients: number | null;
  total_points: number | null;
  general_average: number | null;
  rank_display: string | null;
  total_students: number | null;
  class_general_average: number | null;
  class_highest_average: number | null;
  class_lowest_average: number | null;
  absences_unjustified: number | null;
  absences_justified: number | null;
  lates_count: number | null;
  mention: string | null;
  council_decision: string | null;
  principal_teacher_comment: string | null;
  director_comment: string | null;
  conduct_appreciation: string | null;
  issue_date: string | null;
  published: boolean;
};

const f2 = (n: number | null | undefined) => (n === null || n === undefined ? "—" : Number(n).toFixed(2).replace(".", ","));
const d = (x: string | null) => (x ? new Date(x).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—");

/** URL de vérification publique d'un document (bulletin, reçu) encodée dans son QR code. */
export const documentVerifyUrl = (kind: "bulletin" | "recu", token: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/verifier/document/${kind}/${token}`;

/** Bulletin de notes trimestriel officiel (A4, une page) : uniquement les données de l'élève concerné. */
export function ReportCardSheet({ id }: { id: string }) {
  const [r, setR] = useState<ReportCard | null | undefined>(undefined);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .from("report_cards")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setR((data as ReportCard) ?? null);
        if (data?.token) QRCode.toDataURL(documentVerifyUrl("bulletin", data.token), { margin: 0, width: 220 }).then(setQr);
      });
  }, [id]);

  if (r === undefined) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  if (!r) return <p className="rounded-2xl bg-amber-50 p-6 text-amber-900">Bulletin introuvable ou non accessible.</p>;

  const photo = r.photo_url && !r.photo_url.includes("default") ? r.photo_url : null;
  const lines = r.subjects_data ?? [];

  return (
    <article id="avenida-official-report-card" className="mx-auto w-full max-w-[210mm] bg-white p-[6mm] text-[11px] leading-snug text-slate-900 shadow-xl ring-1 ring-slate-200 sm:p-[8mm] print:p-0 print:shadow-none print:ring-0">
      <div className="flex min-h-[265mm] flex-col border-[3px] border-double border-[#0C356A] p-[5mm] sm:p-[6mm]">
        <header className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 border-b-[3px] border-[#E30613] pb-[3mm]">
          <div className="text-[9px] leading-tight text-slate-600">
            <p className="font-bold tracking-wider text-slate-800 uppercase">République Togolaise</p>
            <p className="italic">Travail – Liberté – Patrie</p>
            <p className="mt-1.5">Enseignement technique et formation professionnelle</p>
          </div>
          <div className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- document imprimable */}
            <img src="/logoavenida.jpg" alt="" className="size-[16mm] object-contain" />
            <p className="mt-1 font-serif text-[15px] font-extrabold tracking-wider text-[#0C356A]">
              HÔTEL ÉCOLE <span className="text-[#E30613]">AVENIDA</span>
            </p>
            <p className="text-[9px] font-semibold tracking-widest text-slate-500 uppercase">{siteConfig.motto}</p>
          </div>
          <div className="text-right text-[9px] leading-tight text-slate-600">
            <p>{siteConfig.address.street}</p>
            <p>
              {siteConfig.address.postal} {siteConfig.address.city}
            </p>
            <p>{siteConfig.phones[0].display}</p>
            <p>{siteConfig.email}</p>
          </div>
        </header>

        <div className="mt-[3mm] flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-[19px] font-extrabold tracking-wide text-[#0C356A] uppercase">Bulletin de notes</h1>
            <p className="text-[10px] text-slate-600">
              {r.period ?? `Trimestre ${r.term}`} · Année scolaire <strong>{r.academic_year}</strong>
            </p>
          </div>
          <div className="rounded border-2 border-[#E30613] px-3 py-1 text-center">
            <p className="text-[8px] font-bold tracking-widest text-slate-500 uppercase">N° de bulletin</p>
            <p className="font-mono text-[12px] font-extrabold text-[#E30613]">{r.bulletin_number}</p>
          </div>
        </div>

        {/* Élève */}
        <section className="mt-[3mm] flex gap-[4mm] rounded border border-slate-300 p-[3mm]">
          <div className="flex h-[32mm] w-[25mm] shrink-0 items-center justify-center overflow-hidden border-2 border-[#0C356A] bg-slate-50">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- photo d'identité en data URL
              <img src={photo} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-[8px] text-slate-400">PHOTO</span>
            )}
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-x-[5mm] gap-y-[2px] text-[10.5px]">
            {[
              ["Nom et prénoms", r.student_name],
              ["Matricule", r.student_matricule],
              ["Classe", r.class_name],
              ["Filière", r.program_code],
              ["Né(e) le", `${d(r.birth_date)}${r.birth_place ? ` à ${r.birth_place}` : ""}`],
              ["Sexe", r.gender === "F" ? "Féminin" : r.gender === "M" ? "Masculin" : r.gender],
              ["Effectif de la classe", r.total_students],
              ["Nationalité", r.nationality],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex gap-2 border-b border-dotted border-slate-300">
                <dt className="w-[30mm] shrink-0 text-slate-500">{k}</dt>
                <dd className="font-semibold">{v ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Notes */}
        <table className="mt-[4mm] w-full border-collapse text-left text-[10.5px]">
          <thead>
            <tr className="bg-[#0C356A] text-white">
              <th className="border border-[#0C356A] px-2 py-1">Matières</th>
              <th className="border border-[#0C356A] px-2 py-1 text-center">Coef.</th>
              <th className="border border-[#0C356A] px-2 py-1 text-center">Moyenne /20</th>
              <th className="border border-[#0C356A] px-2 py-1 text-center">Points</th>
              <th className="border border-[#0C356A] px-2 py-1">Appréciation</th>
              <th className="border border-[#0C356A] px-2 py-1">Professeur</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.subject} className="odd:bg-slate-50">
                <td className="border border-slate-300 px-2 py-[3px] font-semibold">{l.subject}</td>
                <td className="border border-slate-300 px-2 py-[3px] text-center">{l.coefficient}</td>
                <td className={`border border-slate-300 px-2 py-[3px] text-center font-bold ${l.average < 10 ? "text-[#E30613]" : ""}`}>{f2(l.average)}</td>
                <td className="border border-slate-300 px-2 py-[3px] text-center">{f2(l.points)}</td>
                <td className="border border-slate-300 px-2 py-[3px]">{l.appreciation}</td>
                <td className="border border-slate-300 px-2 py-[3px] text-slate-600">{l.teacher}</td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-bold">
              <td className="border border-slate-300 px-2 py-1">TOTAUX</td>
              <td className="border border-slate-300 px-2 py-1 text-center">{r.total_coefficients}</td>
              <td className="border border-slate-300 px-2 py-1" />
              <td className="border border-slate-300 px-2 py-1 text-center">{f2(r.total_points)}</td>
              <td className="border border-slate-300 px-2 py-1" colSpan={2} />
            </tr>
          </tbody>
        </table>

        {/* Résultats */}
        <div className="mt-[4mm] grid grid-cols-3 gap-[3mm]">
          <div className="rounded border-2 border-[#0C356A] p-2 text-center">
            <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">Moyenne générale</p>
            <p className="font-display text-[22px] font-extrabold text-[#0C356A]">{f2(r.general_average)}/20</p>
            <p className="font-bold text-[#E30613]">{r.mention}</p>
          </div>
          <div className="rounded border border-slate-300 p-2 text-[10px]">
            <p>
              Rang : <strong>{r.rank_display ?? "—"}</strong> / {r.total_students ?? "—"}
            </p>
            <p>Moyenne de la classe : {f2(r.class_general_average)}</p>
            <p>Plus forte : {f2(r.class_highest_average)}</p>
            <p>Plus faible : {f2(r.class_lowest_average)}</p>
          </div>
          <div className="rounded border border-slate-300 p-2 text-[10px]">
            <p className="font-bold text-[#0C356A]">Assiduité du trimestre</p>
            <p>Absences non justifiées : {r.absences_unjustified ?? 0}</p>
            <p>Absences justifiées : {r.absences_justified ?? 0}</p>
            <p>Retards : {r.lates_count ?? 0}</p>
            <p>Conduite : {r.conduct_appreciation ?? "—"}</p>
          </div>
        </div>

        <div className="mt-[3mm] grid grid-cols-2 gap-[3mm] text-[10px]">
          <div className="min-h-[18mm] rounded border border-slate-300 p-2">
            <p className="font-bold text-[#0C356A]">Appréciation du professeur principal</p>
            <p className="mt-1">{r.principal_teacher_comment ?? ""}</p>
          </div>
          <div className="min-h-[18mm] rounded border border-slate-300 p-2">
            <p className="font-bold text-[#0C356A]">Décision du conseil de classe</p>
            <p className="mt-1">{r.council_decision ?? ""}</p>
            {r.director_comment && <p className="mt-1 italic">{r.director_comment}</p>}
          </div>
        </div>

        <div className="mt-auto grid grid-cols-[1fr_1fr_auto] items-end gap-[5mm] pt-[6mm] text-center text-[10px] font-semibold text-slate-600">
          <div>
            <p>Le parent / tuteur</p>
            <div className="mt-[12mm] border-t border-slate-400 pt-1 text-[9px] font-normal">Signature</div>
          </div>
          <div>
            <p>Le Directeur des études</p>
            <div className="mt-[12mm] border-t border-slate-400 pt-1 text-[9px] font-normal">Signature et cachet</div>
          </div>
          <div className="flex flex-col items-center">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element -- QR code généré
              <img src={qr} alt="QR code de vérification" className="size-[20mm]" />
            ) : (
              <span className="size-[20mm] border border-dashed border-slate-300" />
            )}
            <span className="mt-0.5 text-[8px] font-normal">Vérification</span>
          </div>
        </div>
        <p className="mt-[3mm] border-t border-slate-200 pt-1 text-center text-[8.5px] text-slate-400">
          Bulletin établi le {d(r.issue_date)} · document généré par la plateforme Avenida · authenticité vérifiable par QR code
        </p>
      </div>
    </article>
  );
}
