"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  CreditCard,
  CalendarCheck,
  FileText,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Award,
  GraduationCap,
} from "lucide-react";
import {
  MOCK_STUDENTS,
  MOCK_RECEIPTS,
  MOCK_ABSENCES,
  MOCK_LATES,
} from "@/lib/mock-data";
import { formatFCFA } from "@/lib/utils";
import { StudentReportCard } from "@/types";
import { ReportCardModal } from "@/components/shared/ReportCardModal";
import {
  getReportCardsFromStorage,
  createBlankReportCardForStudent,
  upsertReportCard,
} from "@/lib/report-cards-data";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const student =
    MOCK_STUDENTS.find((s) => s.id === unwrappedParams.id) || MOCK_STUDENTS[0];

  const [reportCard, setReportCard] = useState<StudentReportCard | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const list = getReportCardsFromStorage();
    const existing = list.find((c) => c.student_matricule === student.registration_number);
    if (existing) {
      setReportCard(existing);
    } else {
      const created = createBlankReportCardForStudent(student.id);
      const ranked = upsertReportCard(created);
      const match = ranked.find((c) => c.student_matricule === student.registration_number) || created;
      setReportCard(match);
    }
  }, [student]);

  const studentReceipts = MOCK_RECEIPTS.filter(
    (r) => r.student_matricule === student.registration_number
  );
  const studentAbsences = MOCK_ABSENCES.filter(
    (a) => a.student_name.includes(student.last_name)
  );
  const studentLates = MOCK_LATES.filter((l) =>
    l.student_name.includes(student.last_name)
  );

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C356A] hover:text-[#164E87] bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à l&apos;Espace École</span>
        </Link>

        <div className="flex items-center gap-2">
          {reportCard && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Voir & Télécharger Bulletin Officiel</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimer Fiche 360°</span>
          </button>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white rounded-3xl border-2 border-blue-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={student.photo_url}
              alt={student.last_name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-100 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black bg-blue-50 text-[#0C356A] border border-blue-300 px-2.5 py-0.5 rounded-md">
                  {student.registration_number}
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-md">
                  {student.student_number}
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-[#0C356A]">
                  {student.program_code}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 font-serif">
                {student.last_name} {student.first_name}
              </h1>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Classe : <strong className="text-slate-800">{student.class_name}</strong></span>
                <span>&bull;</span>
                <span>Régime : <strong className="capitalize text-slate-800">{student.boarder_status}</strong></span>
                <span>&bull;</span>
                <span>Nationalité : <strong className="text-slate-800">{student.nationality}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Balance Snapshot */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 min-w-[240px] space-y-1 text-right">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#0C356A]">
              Situation Écolage (F CFA)
            </div>
            <div className="text-xl font-black text-[#0C356A] font-serif">
              {formatFCFA(student.paid_fee)}
            </div>
            <div className="text-xs font-medium text-slate-500">
              sur un total de {formatFCFA(student.total_fee)}
            </div>
            <div className="text-xs font-bold text-[#DC2626] pt-1 border-t border-blue-200">
              Reste à payer : {formatFCFA(student.remaining_fee)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BANNIÈRE BULLETIN SCOLAIRE & CLASSEMENT */}
      {reportCard && (
        <div className="bg-gradient-to-r from-blue-900 via-[#0C356A] to-[#164E87] text-white p-6 rounded-3xl shadow-md border-2 border-blue-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-mono">
                  {reportCard.period} &bull; {reportCard.academic_year}
                </span>
                <span className="text-xs text-blue-200">
                  Bulletin Officiel N° {reportCard.bulletin_number}
                </span>
              </div>
              <h2 className="text-lg font-black mt-1 font-serif">
                Relevé de Notes & Classement Académique
              </h2>
              <p className="text-xs text-blue-200/90">
                Mention : <strong className="text-white">{reportCard.appreciation_mention}</strong> &bull; {reportCard.council_decision}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-blue-200 block">
                Moyenne Générale
              </span>
              <div className="text-2xl font-black font-serif text-white">
                {reportCard.general_average.toFixed(2)}{" "}
                <span className="text-xs font-normal text-blue-200">/ 20</span>
              </div>
            </div>

            <div className="text-right border-l border-white/20 pl-4">
              <span className="text-[10px] uppercase font-bold text-blue-200 block">
                Rang dans la classe
              </span>
              <div className="inline-block px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-xl text-base shadow-sm">
                {reportCard.rank_display}{" "}
                <span className="text-xs font-semibold text-slate-800">
                  / {reportCard.total_students}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2.5 bg-white text-[#0C356A] hover:bg-blue-50 font-black text-xs rounded-xl shadow-md transition-all shrink-0 active:scale-95 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-[#0C356A]" />
              <span>Consulter & Imprimer</span>
            </button>
          </div>
        </div>
      )}

      {/* 360° Tabs & Detail Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Fiche Signalétique Officielle */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-[#0C356A]" />
            <h2 className="text-sm font-bold text-[#0C356A] font-serif">
              Fiche Signalétique Officielle
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Nom & Prénoms</span>
              <span className="font-bold text-slate-900">{student.last_name} {student.first_name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Sexe</span>
                <span className="font-semibold text-slate-800">{student.gender === "M" ? "Masculin" : "Féminin"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nationalité</span>
                <span className="font-semibold text-slate-800">{student.nationality}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Lieu de Naissance</span>
              <span className="font-semibold text-slate-800">{student.birth_date} à {student.birth_place}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Quartier de Résidence</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {student.residence_neighborhood}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Téléphone & Email</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {student.phone}
              </span>
              <span className="text-slate-500 text-[11px] block mt-0.5">{student.email}</span>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
              <span className="text-[#DC2626] block text-[10px] uppercase font-black">
                Personne à Prévenir en Urgence
              </span>
              <span className="font-bold text-slate-900 block mt-0.5">{student.emergency_contact_name}</span>
              <span className="text-xs font-bold text-[#DC2626]">Tél : {student.emergency_contact_phone}</span>
            </div>
          </div>
        </div>

        {/* Middle Col: Carnet de Correspondance (Absences & Retards) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#0C356A]" />
              <h2 className="text-sm font-bold text-[#0C356A] font-serif">
                Carnet de Correspondance Numérique
              </h2>
            </div>
            <span className="text-[10px] font-bold bg-blue-100 text-[#0C356A] px-2 py-0.5 rounded">
              Vie Scolaire
            </span>
          </div>

          <div className="space-y-4">
            {/* Absences Tickets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Billets d'Absences Enregistrés
              </span>
              {studentAbsences.map((a) => (
                <div key={a.id} className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-rose-900">
                    <span>Billet N°{a.ticket_number}</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                      Justifié
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700">{a.start_date}</div>
                  <div className="text-[11px] text-slate-600 italic">Motif : {a.reason}</div>
                  <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3 h-3" /> Visa Vie Scolaire accordé
                  </div>
                </div>
              ))}
            </div>

            {/* Lates Tickets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Billets de Retard Enregistrés
              </span>
              {studentLates.map((l) => (
                <div key={l.id} className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#0C356A]">
                    <span>Billet N°{l.ticket_number} ({l.duration_minutes} min)</span>
                    <span className="text-[10px] bg-blue-100 text-[#0C356A] px-1.5 py-0.2 rounded font-bold capitalize">
                      En {l.destination}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700">{l.date}</div>
                  <div className="text-[11px] text-slate-600 italic">Motif : {l.reason}</div>
                  <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3 h-3" /> Visa Vie Scolaire apposé
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Historique des Reçus de Paiement Officiels */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900 font-serif">
                Reçus d'Écolage (#AV2022)
              </h2>
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
              Caisse Lomé
            </span>
          </div>

          <div className="space-y-3">
            {studentReceipts.map((r) => (
              <div
                key={r.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {r.reference}
                  </span>
                  <span className="text-[10px] text-slate-500">{r.date.split(" ")[0]}</span>
                </div>
                <div className="text-xs font-semibold text-slate-700">{r.designation}</div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                  <span className="font-black text-emerald-700">
                    {formatFCFA(r.amount_paid)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Caissier : {r.cashier_name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL BULLETIN DE NOTES OFFICIEL */}
      {reportCard && isReportModalOpen && (
        <ReportCardModal
          reportCard={reportCard}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
}
