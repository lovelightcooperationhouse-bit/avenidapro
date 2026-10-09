"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  Printer,
  X,
  Download,
  Award,
  CheckCircle2,
  Calendar,
  User,
  GraduationCap,
  Sparkles,
  Edit3,
} from "lucide-react";
import { StudentReportCard } from "@/types";
import { formatRank } from "@/lib/report-cards-data";

interface ReportCardModalProps {
  reportCard: StudentReportCard;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (card: StudentReportCard) => void;
}

export function ReportCardModal({
  reportCard,
  isOpen,
  onClose,
  onEdit,
}: ReportCardModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !reportCard) return null;

  const handlePrint = () => {
    window.print();
  };

  const getMentionColor = (mention: string) => {
    switch (mention) {
      case "Très Bien":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "Bien":
        return "bg-blue-100 text-blue-900 border-blue-300";
      case "Assez Bien":
        return "bg-indigo-100 text-indigo-900 border-indigo-300";
      case "Passable":
        return "bg-amber-100 text-amber-900 border-amber-300";
      default:
        return "bg-rose-100 text-rose-900 border-rose-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Container Principal */}
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full">
        {/* Barre d'actions supérieure (masquée à l'impression) */}
        <div className="bg-[#0C356A] text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-300" />
            <span className="text-xs font-black uppercase tracking-wider">
              Bulletin Scolaire & Relevé Officiel &bull; {reportCard.class_name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(reportCard)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Modifier les notes de ce bulletin"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span>Modifier Notes</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Télécharger / Imprimer (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            FEUILLE DU BULLETIN OFFICIEL (STYLE RELEVÉ DE NOTES A4 OFFICIEL)
            ========================================================================= */}
        <div
          ref={printableRef}
          className="p-6 md:p-8 bg-white text-slate-900 text-xs font-sans print:p-6 print:m-0"
          id="avenida-official-report-card"
        >
          {/* 1. EN-TÊTE RÉPUBLICAIN & IDENTITÉ AVENIDA */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="grid grid-cols-12 gap-2 items-center">
              {/* En-tête gauche : République & Ministère */}
              <div className="col-span-4 text-center border-r border-slate-200 pr-2">
                <p className="font-serif font-black text-[10px] uppercase tracking-wider text-slate-800">
                  RÉPUBLIQUE TOGOLAISE
                </p>
                <p className="text-[8px] italic font-semibold text-slate-500">
                  Travail &bull; Liberté &bull; Patrie
                </p>
                <div className="w-10 h-0.5 bg-[#DC2626] mx-auto my-1"></div>
                <p className="text-[8px] font-bold uppercase text-slate-700 leading-tight">
                  Ministère délégué chargé de l&apos;Enseignement Technique & de la Formation Professionnelle
                </p>
                <p className="text-[8px] text-slate-500 font-medium mt-0.5">
                  Inspection Pédagogique Régionale Maritime
                </p>
              </div>

              {/* En-tête centre : Logo & Complexe Avenida */}
              <div className="col-span-5 text-center px-2">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-12 h-12 relative rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
                    <Image
                      src="/logoavenida.jpg"
                      alt="Logo Avenida Lomé"
                      width={48}
                      height={48}
                      className="object-contain w-full h-full"
                      priority
                    />
                  </div>
                  <div className="text-left">
                    <h1 className="font-serif font-black text-sm tracking-tight text-[#0C356A] leading-none uppercase">
                      HÔTEL ÉCOLE AVENIDA
                    </h1>
                    <span className="text-[9px] font-black tracking-widest text-[#DC2626] uppercase">
                      LOMÉ &bull; TOGO
                    </span>
                  </div>
                </div>
                <p className="text-[8px] text-slate-500 italic">
                  Agrément Ministériel &bull; Formation d&apos;Élite aux Métiers de l&apos;Hôtellerie & de la Restauration
                </p>
                <p className="text-[8px] text-slate-600 font-medium">
                  Quartier Dékon / Tokoin &bull; Tél: +228 22 21 00 00 / 90 11 22 33
                </p>
              </div>

              {/* En-tête droite : Numérotation & Période */}
              <div className="col-span-3 text-right pl-2 border-l border-slate-200">
                <div className="inline-block bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#0C356A]">
                  {reportCard.bulletin_number}
                </div>
                <div className="text-[10px] font-bold text-slate-700 mt-1">
                  Année : <span className="font-mono font-black">{reportCard.academic_year}</span>
                </div>
                <div className="text-[11px] font-black text-[#DC2626] uppercase font-serif mt-0.5">
                  {reportCard.period}
                </div>
                <div className="text-[8px] text-slate-400 mt-0.5">
                  Édité le : {reportCard.issue_date.replace("Lomé, le ", "")}
                </div>
              </div>
            </div>

            {/* Titre Institutionnel */}
            <div className="text-center mt-3 pt-2 border-t border-dashed border-slate-300">
              <h2 className="text-base font-black uppercase font-serif tracking-widest text-[#0C356A] underline decoration-amber-400 decoration-2 underline-offset-4">
                BULLETIN OFFICIEL DE NOTES & RELEVÉ D&apos;ÉVALUATION
              </h2>
            </div>
          </div>

          {/* 2. FICHE SIGNALÉTIQUE DE L'ÉLÈVE */}
          <div className="bg-slate-50 border border-slate-300 rounded-2xl p-3.5 mb-4 grid grid-cols-12 gap-3 items-center">
            {/* Photo & Identité */}
            <div className="col-span-8 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 border-2 border-white shadow-xs shrink-0">
                {reportCard.photo_url ? (
                  <img
                    src={reportCard.photo_url}
                    alt={reportCard.student_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-lg">
                    {reportCard.student_name[0]}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black bg-[#0C356A] text-white px-2 py-0.2 rounded">
                    {reportCard.student_matricule}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Cycle : {reportCard.program_code}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 font-serif">
                  {reportCard.student_name}
                </h3>
                <div className="text-[10px] text-slate-600 flex flex-wrap gap-x-3">
                  <span>Né(e) le : <strong>{reportCard.birth_date}</strong> à <strong>{reportCard.birth_place}</strong></span>
                  <span>&bull;</span>
                  <span>Nationalité : <strong>{reportCard.nationality}</strong></span>
                </div>
              </div>
            </div>

            {/* Classe & Effectif */}
            <div className="col-span-4 text-right border-l border-slate-200 pl-3 space-y-0.5">
              <div className="text-[10px] text-slate-500">Classe d&apos;inscription</div>
              <div className="text-xs font-black text-[#0C356A]">
                {reportCard.class_name}
              </div>
              <div className="text-[10px] text-slate-600 font-semibold">
                Effectif total : <strong className="text-slate-900">{reportCard.total_students} élèves</strong>
              </div>
              <div className="text-[9px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                Statut : Régulier inscrit
              </div>
            </div>
          </div>

          {/* 3. TABLEAU OFFICIEL DES NOTES PAR MATIÈRE */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-4 shadow-2xs">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-[#0C356A] text-white text-[9px] uppercase font-bold tracking-wider">
                  <th className="py-2 px-2.5">Discipline / Pôle d&apos;Enseignement</th>
                  <th className="py-2 px-2 text-center">Coeff</th>
                  <th className="py-2 px-2 text-center">Note / 20</th>
                  <th className="py-2 px-2 text-center">Points (N×C)</th>
                  <th className="py-2 px-2 text-center">Rang</th>
                  <th className="py-2 px-2 text-center">Classe [Min - Moy - Max]</th>
                  <th className="py-2 px-2.5">Professeur & Appréciation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportCard.subjects.map((sub, idx) => {
                  const weightedPoints = Number((sub.score * sub.coefficient).toFixed(2));
                  const isSuccess = sub.score >= 10;
                  const isHigh = sub.score >= 15;

                  return (
                    <tr
                      key={sub.id || idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}
                    >
                      {/* Matière & Catégorie */}
                      <td className="py-2 px-2.5 border-r border-slate-200">
                        <div className="font-bold text-slate-900 leading-tight">
                          {sub.subject_name}
                        </div>
                        <div className="text-[8px] text-slate-400 font-medium">
                          {sub.category}
                        </div>
                      </td>

                      {/* Coefficient */}
                      <td className="py-2 px-2 text-center font-bold text-slate-700 border-r border-slate-200">
                        {sub.coefficient}
                      </td>

                      {/* Note / 20 */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <span
                          className={`font-mono font-black text-xs px-1.5 py-0.5 rounded ${
                            isHigh
                              ? "bg-emerald-100 text-emerald-800"
                              : isSuccess
                              ? "bg-blue-50 text-blue-900"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {sub.score.toFixed(2)}
                        </span>
                      </td>

                      {/* Points (Note x Coeff) */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-900 border-r border-slate-200">
                        {weightedPoints.toFixed(2)}
                      </td>

                      {/* Rang Matière */}
                      <td className="py-2 px-2 text-center font-bold text-slate-600 border-r border-slate-200 text-[10px]">
                        {sub.subject_rank ? `${sub.subject_rank}e` : "-"}
                      </td>

                      {/* Statistiques Classe */}
                      <td className="py-2 px-2 text-center font-mono text-[9px] text-slate-500 border-r border-slate-200">
                        {sub.class_min !== undefined
                          ? `${sub.class_min.toFixed(1)} / ${sub.class_avg?.toFixed(1)} / ${sub.class_max?.toFixed(1)}`
                          : "-"}
                      </td>

                      {/* Professeur & Appréciation */}
                      <td className="py-2 px-2.5 text-slate-700">
                        <span className="font-bold text-[9px] text-slate-900 block">
                          {sub.teacher_name}
                        </span>
                        <span className="italic text-[9px] text-slate-600 block leading-tight">
                          &laquo; {sub.teacher_comment} &raquo;
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Ligne Totaux du Tableau */}
              <tfoot className="bg-slate-100 border-t-2 border-slate-800 font-black text-slate-900">
                <tr>
                  <td className="py-2.5 px-2.5 text-right uppercase tracking-wider text-[10px]">
                    Totaux Pondérés :
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-xs">
                    {reportCard.total_coefficients}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-400 text-[9px]">
                    -
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-xs text-[#0C356A]">
                    {reportCard.total_points.toFixed(2)}
                  </td>
                  <td colSpan={3} className="py-2.5 px-2 text-slate-600 font-normal italic text-[10px]">
                    Total points calculé sur {reportCard.total_coefficients * 20} points possibles
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4. BILAN GÉNÉRAL : MOYENNE, RANG OFFICIEL & MENTION */}
          <div className="grid grid-cols-12 gap-3 mb-4">
            {/* Bloc Résultat Élève (Moyenne + Rang) */}
            <div className="col-span-7 bg-gradient-to-br from-blue-50 to-indigo-50/60 border-2 border-[#0C356A] rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0C356A]">
                    MOYENNE GÉNÉRALE DE L&apos;ÉLÈVE
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="font-serif font-black text-2xl text-[#0C356A]">
                      {reportCard.general_average.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">/ 20</span>
                  </div>
                </div>

                {/* Badge Rang */}
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    RANG OFFICIEL DANS LA CLASSE
                  </span>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-xl text-base shadow-xs mt-0.5">
                    <Award className="w-4 h-4 text-slate-950" />
                    <span>{reportCard.rank_display}</span>
                    <span className="text-xs font-semibold text-slate-800">
                      / {reportCard.total_students}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mention & Décision */}
              <div className="pt-2 border-t border-blue-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Mention obtenue :</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-md font-black text-[11px] border ${getMentionColor(reportCard.appreciation_mention)}`}>
                    {reportCard.appreciation_mention}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Décision du conseil :</span>
                  <span className="font-extrabold text-[#0C356A]">
                    {reportCard.council_decision}
                  </span>
                </div>
              </div>
            </div>

            {/* Bloc Statistiques Classe & Assiduité */}
            <div className="col-span-5 bg-slate-50 border border-slate-300 rounded-2xl p-3 space-y-2 text-[10px]">
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-200 pb-0.5 mb-1 text-[9px]">
                  Statistiques de la Promotion ({reportCard.class_name})
                </span>
                <div className="grid grid-cols-3 gap-1 text-center font-mono">
                  <div className="bg-white p-1 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 block font-sans">Plus Faible</span>
                    <strong className="text-rose-700">{reportCard.class_lowest_average.toFixed(2)}</strong>
                  </div>
                  <div className="bg-white p-1 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 block font-sans">Moyenne</span>
                    <strong className="text-blue-900">{reportCard.class_general_average.toFixed(2)}</strong>
                  </div>
                  <div className="bg-white p-1 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 block font-sans">Plus Forte</span>
                    <strong className="text-emerald-700">{reportCard.class_highest_average.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Assiduité & Conduite */}
              <div className="pt-1.5 border-t border-slate-200">
                <span className="font-bold text-slate-700 uppercase tracking-wider block text-[9px] mb-0.5">
                  Vie Scolaire & Assiduité
                </span>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Absences injustifiées : <strong className="text-rose-600">{reportCard.absences_unjustified} h</strong></span>
                  <span>Retards : <strong className="text-slate-800">{reportCard.lates_count}</strong></span>
                </div>
                <p className="text-[9px] text-slate-500 italic mt-0.5">
                  &bull; {reportCard.conduct_appreciation}
                </p>
              </div>
            </div>
          </div>

          {/* 5. AVIS DU PROFESSEUR PRINCIPAL ET DE LA DIRECTION */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-[#0C356A] uppercase text-[9px] block">
                Avis du Professeur Principal ({reportCard.principal_teacher_name}) :
              </span>
              <p className="text-slate-700 italic mt-1 leading-snug">
                &laquo; {reportCard.principal_teacher_comment} &raquo;
              </p>
            </div>
            <div className="p-2.5 bg-blue-50/50 border border-blue-200 rounded-xl">
              <span className="font-bold text-[#0C356A] uppercase text-[9px] block">
                Observations de la Direction Générale :
              </span>
              <p className="text-slate-700 italic mt-1 leading-snug">
                &laquo; {reportCard.director_comment} &raquo;
              </p>
            </div>
          </div>

          {/* 6. CARTOUCHES OFFICIELS DES 3 SIGNATURES */}
          <div className="border-t-2 border-slate-900 pt-3 grid grid-cols-3 gap-4 text-center text-[10px]">
            {/* Signature 1 : Professeur Principal */}
            <div className="flex flex-col justify-between min-h-[90px] border-r border-slate-200 pr-2">
              <div>
                <p className="font-bold text-slate-800 uppercase text-[9px]">
                  Le Professeur Principal
                </p>
                <p className="text-[8px] text-slate-400">{reportCard.principal_teacher_name}</p>
              </div>
              <div className="font-serif italic text-blue-900 text-xs font-semibold py-1">
                Visa Pédagogique
              </div>
              <div className="text-[8px] text-slate-400">Signature</div>
            </div>

            {/* Signature 2 : Parent / Tuteur */}
            <div className="flex flex-col justify-between min-h-[90px] border-r border-slate-200 pr-2">
              <div>
                <p className="font-bold text-slate-800 uppercase text-[9px]">
                  Le Parent / Tuteur Légal
                </p>
                <p className="text-[8px] text-slate-400">Vu et pris connaissance</p>
              </div>
              <div className="text-[8px] text-slate-300 italic py-2">
                (Émargement parent)
              </div>
              <div className="text-[8px] text-slate-400">Signature</div>
            </div>

            {/* Signature 3 : Chef d'Établissement & Tampon Officiel */}
            <div className="flex flex-col justify-between min-h-[90px] pl-2 relative">
              <div>
                <p className="font-bold text-[#0C356A] uppercase text-[9px]">
                  Le Directeur Général &bull; M. Hope d&apos;Almeida
                </p>
                <p className="text-[8px] text-slate-500">Complexe Scolaire & Hôtelier Avenida Lomé</p>
              </div>
              {/* Sceau / Cachet numérique stylisé */}
              <div className="my-auto py-1">
                <div className="inline-block border-2 border-[#DC2626] text-[#DC2626] rounded-full px-3 py-1 font-mono text-[9px] font-black uppercase rotate-[-4deg] tracking-wider opacity-90 shadow-2xs">
                  ★ AVENIDA LOMÉ &bull; CERTIFIÉ ★
                </div>
              </div>
              <div className="text-[8px] text-slate-500 font-bold">
                {reportCard.issue_date}
              </div>
            </div>
          </div>

          {/* Mention de bas de page */}
          <div className="text-center text-[8px] text-slate-400 pt-3 border-t border-slate-200 mt-3 print:pt-2">
            Ce bulletin officiel est délivré par le Complexe Scolaire et Hôtelier Avenida Lomé. Il atteste des résultats académiques de l&apos;élève sous l&apos;autorité du Ministère de tutelle. Toute falsification ou rature entraîne sa nullité.
          </div>
        </div>
      </div>
    </div>
  );
}
