"use client";

import QRCode from "qrcode";
import { Fragment, useEffect, useState } from "react";
import { useCardSettings } from "@/components/cards/IdCard";
import { siteConfig } from "@/content/site";
import { GROUPS, SANCTIONS, type BulletinExtras, type SubjectLine } from "@/lib/bulletins";
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
  signed_by_name: string | null;
  signed_at: string | null;
  revision: number | null;
  raw_data: { extras?: BulletinExtras } | null;
};

const f2 = (n: number | null | undefined) => (n === null || n === undefined ? "" : Number(n).toFixed(2).replace(".", ","));
const d = (x: string | null) => (x ? new Date(x).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "");

/** URL de vérification publique d'un document (bulletin, reçu) encodée dans son QR code. */
export const documentVerifyUrl = (kind: "bulletin" | "recu" | "situation", token: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/verifier/document/${kind}/${token}`;

const Box = ({ on }: { on: boolean }) => (
  <span className="inline-flex size-[3.4mm] shrink-0 items-center justify-center border border-slate-700 text-[9px] leading-none font-black">{on ? "✓" : ""}</span>
);

/** Bulletin de notes semestriel officiel (A4) sur le modèle de l'Hôtel École Avenida. */
export function ReportCardSheet({ id }: { id: string }) {
  const [r, setR] = useState<ReportCard | null | undefined>(undefined);
  const [qr, setQr] = useState<string | null>(null);
  const cs = useCardSettings();

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
  const extras = r.raw_data?.extras ?? {};
  const grouped = GROUPS.map((g) => ({ ...g, lines: lines.filter((l) => l.group === g.key) })).filter((g) => g.lines.length);
  const ungrouped = lines.filter((l) => !l.group);
  if (ungrouped.length) grouped.push({ key: "generale", label: "Matières", lines: ungrouped });
  const cell = "border border-slate-700 px-[1.5mm] py-[0.8mm]";
  const head = "border border-slate-700 px-[1mm] py-[1mm] text-center text-[8.5px] font-extrabold leading-tight uppercase";

  return (
    <article id="avenida-official-report-card" className="relative mx-auto w-full max-w-[210mm] bg-white p-[7mm] text-[10px] leading-snug text-slate-900 shadow-xl ring-1 ring-slate-200 print:p-[5mm] print:shadow-none print:ring-0">
      {!r.signed_at && (
        <p aria-hidden className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -rotate-[25deg] text-[52px] font-black whitespace-nowrap text-red-600/10 select-none">
          PROVISOIRE · À VALIDER
        </p>
      )}
      {/* En-tête officiel */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <div className="text-[9.5px] leading-tight">
          <p className="font-serif text-[13px] font-extrabold text-[#1B1652]">
            HÔTEL ÉCOLE <span className="text-[#E31B3A]">AVENIDA</span>
          </p>
          <p className="font-bold uppercase">Centre de formation hôtelière</p>
          <p>
            {siteConfig.address.postal} · Tél. {siteConfig.phones[0].display} · {siteConfig.address.city} – Togo
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- document imprimable */}
        <img src="/logo-avenida.png" alt="" className="size-[19mm] object-contain" />
        <div className="text-right text-[9.5px] leading-tight">
          <p className="font-extrabold tracking-wide uppercase">République Togolaise</p>
          <p className="italic">Travail – Liberté – Patrie</p>
          <p className="mt-1 font-mono text-[8.5px] text-slate-500">N° {r.bulletin_number}</p>
        </div>
      </header>

      <div className="mt-[2.5mm] flex justify-between border-y border-slate-300 py-[1mm] text-[10.5px]">
        <p>
          Classe : <strong>{r.class_name}</strong>
        </p>
        <p>
          Filière : <strong>{r.program_code}</strong>
        </p>
      </div>

      <h1 className="mt-[2mm] bg-[#1B1652] py-[1.5mm] text-center font-display text-[17px] font-extrabold tracking-[0.2em] text-white">BULLETIN DE NOTES</h1>

      <div className="mt-[2mm] grid grid-cols-3 text-[10.5px]">
        <p>
          Semestre : <strong>{r.period ?? r.term}</strong>
        </p>
        <p className="text-center">
          Année scolaire : <strong>{r.academic_year}</strong>
        </p>
        <p className="text-right">
          Effectif : <strong>{r.total_students}</strong>
        </p>
      </div>

      <div className="mt-[2mm] flex items-center gap-[3mm] rounded border border-slate-300 p-[2mm]">
        <div className="flex h-[22mm] w-[17mm] shrink-0 items-center justify-center overflow-hidden border border-[#1B1652] bg-slate-50">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- photo d'identité
            <img src={photo} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[7px] text-slate-400">PHOTO</span>
          )}
        </div>
        <div className="flex-1 text-[10.5px]">
          <p>
            NOM DE L&apos;ÉLÈVE : <strong className="text-[12.5px] text-[#1B1652]">{r.student_name}</strong>
          </p>
          <p className="mt-0.5 text-slate-700">
            Matricule : <strong>{r.student_matricule}</strong>
            {r.birth_date ? ` · Né(e) le ${d(r.birth_date)}${r.birth_place ? ` à ${r.birth_place}` : ""}` : ""}
            {r.gender ? ` · Sexe : ${r.gender === "F" ? "F" : r.gender === "M" ? "M" : r.gender}` : ""}
          </p>
        </div>
      </div>

      {/* Tableau des notes */}
      <table className="mt-[2.5mm] w-full border-collapse text-[9.5px]">
        <thead className="bg-slate-100">
          <tr>
            <th className={`${head} w-[26%] text-left`}>Matières</th>
            <th className={head}>Moy. classe</th>
            <th className={head}>Notes de comp.</th>
            <th className={head}>Moy. géné.</th>
            <th className={head}>Coef</th>
            <th className={head}>Produit</th>
            <th className={head}>Rang</th>
            <th className={head}>Noms des professeurs</th>
            <th className={head}>Appréciations des professeurs</th>
            <th className={head}>Signatures</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((g) => (
            <Fragment key={g.label}>
              <tr>
                <td colSpan={10} className="border border-slate-700 bg-[#1B1652]/10 px-[1.5mm] py-[0.6mm] text-[9px] font-extrabold tracking-wider text-[#1B1652] uppercase">
                  {g.label}
                </td>
              </tr>
              {g.lines.map((l) => (
                <tr key={l.subject}>
                  <td className={`${cell} font-semibold`}>{l.subject}</td>
                  <td className={`${cell} text-center`}>{f2(l.classMark)}</td>
                  <td className={`${cell} text-center`}>{f2(l.compoMark)}</td>
                  <td className={`${cell} text-center font-bold ${l.average < 10 ? "text-[#E31B3A]" : ""}`}>{f2(l.average)}</td>
                  <td className={`${cell} text-center`}>{l.coefficient}</td>
                  <td className={`${cell} text-center`}>{f2(l.points)}</td>
                  <td className={`${cell} text-center text-[8.5px] whitespace-nowrap`}>{l.rank ?? ""}</td>
                  <td className={`${cell} text-[8.5px]`}>{l.teacher}</td>
                  <td className={cell}>{l.appreciation}</td>
                  <td className={cell} />
                </tr>
              ))}
            </Fragment>
          ))}
          <tr className="bg-slate-100 font-extrabold">
            <td className={cell}>TOTAL</td>
            <td className={cell} colSpan={3} />
            <td className={`${cell} text-center`}>{r.total_coefficients}</td>
            <td className={`${cell} text-center`}>{f2(r.total_points)}</td>
            <td className={cell} colSpan={4} />
          </tr>
        </tbody>
      </table>

      <p className="mt-[1.5mm] text-[10.5px]">
        Absences : <strong>{(r.absences_unjustified ?? 0) + (r.absences_justified ?? 0)}</strong>
        {r.absences_justified ? ` (dont ${r.absences_justified} justifiée(s))` : ""} <span className="mx-4" /> Retards : <strong>{r.lates_count ?? 0}</strong>
      </p>

      {/* Distinctions, sanctions, résultats */}
      <div className="mt-[2.5mm] grid grid-cols-[1.15fr_1fr] gap-[4mm]">
        <div className="flex flex-col gap-[2mm] text-[10px]">
          <div>
            <p className="font-extrabold uppercase">I- Distinctions spéciales obtenues par l&apos;élève</p>
            <p className="mt-0.5 flex items-center gap-2">
              1- Tableau d&apos;honneur <Box on={extras.distinction === "Tableau d'honneur"} />
            </p>
            <p className="flex items-center gap-2">
              2- Tableau d&apos;honneur et félicitations <Box on={extras.distinction === "Tableau d'honneur et félicitations"} />
            </p>
          </div>
          <div>
            <p className="font-extrabold uppercase">II- Sanctions infligées à l&apos;élève</p>
            {SANCTIONS.map((s, i) => (
              <p key={s.key} className="flex items-center gap-2">
                {i + 1}- {s.label} <Box on={!!extras.sanctions?.[s.key]} />
              </p>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-[1.5mm] rounded border-2 border-[#1B1652] p-[2.5mm] text-[10.5px]">
          <p className="flex justify-between">
            Moyenne semestrielle : <strong className="text-[15px] text-[#1B1652]">{f2(r.general_average)}/20</strong>
          </p>
          <p className="flex justify-between">
            Classement semestriel :{" "}
            <strong>
              {r.rank_display} sur {r.total_students}
            </strong>
          </p>
          <p className="flex justify-between">
            Appréciation : <strong className="text-[#E31B3A]">{r.mention}</strong>
          </p>
          <p className="border-t border-slate-200 pt-1 text-[9px] text-slate-600">
            Moyenne de la classe : {f2(r.class_general_average)} · plus forte : {f2(r.class_highest_average)} · plus faible : {f2(r.class_lowest_average)}
          </p>
          {r.council_decision && (
            <p className="border-t border-slate-200 pt-1">
              Décision du conseil : <strong>{r.council_decision}</strong>
            </p>
          )}
          {r.director_comment && <p className="text-[9.5px] italic">Observation : {r.director_comment}</p>}
        </div>
      </div>

      {/* Signature */}
      <div className="mt-[4mm] grid grid-cols-[auto_1fr_auto] items-end gap-[4mm]">
        <div className="flex flex-col items-center">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- QR code généré
            <img src={qr} alt="QR code de vérification" className="size-[19mm]" />
          ) : (
            <span className="size-[19mm] border border-dashed border-slate-300" />
          )}
          <span className="mt-0.5 text-[7.5px] text-slate-500">Authenticité vérifiable</span>
        </div>
        <div />
        <div className="min-w-[62mm] text-center text-[10.5px]">
          <p>Fait à Lomé, le {d(r.signed_at ?? r.issue_date) || ".............................."}</p>
          <p className="mt-1 font-extrabold uppercase">Le Directeur pédagogique</p>
          {r.signed_at && cs.signatureImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- signature scannée
            <img src={cs.signatureImage} alt="Signature" className="mx-auto mt-1 h-[13mm] object-contain" />
          ) : (
            <div className="h-[13mm]" />
          )}
          <p className="font-bold">{r.signed_by_name ?? ""}</p>
          {r.signed_at ? (
            <p className="text-[8px] text-emerald-700">Validé et signé électroniquement le {new Date(r.signed_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
          ) : (
            <p className="text-[8px] text-amber-700">En attente de validation</p>
          )}
          {!!r.revision && <p className="text-[8px] text-slate-500">Bulletin rectifié ({r.revision}×)</p>}
        </div>
      </div>
      <p className="mt-[3mm] text-center text-[9.5px] font-bold italic">Il ne sera pas délivré de duplicata</p>
    </article>
  );
}
