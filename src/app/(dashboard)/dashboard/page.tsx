"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  CreditCard,
  BedDouble,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
  Building,
  UserCheck,
  PlusCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { AvenidaLogo } from "@/components/shared/AvenidaLogo";
import { DirectorPendingApprovalsBanner } from "@/components/shared/DirectorPendingApprovalsBanner";
import {
  MOCK_PROGRAMS,
} from "@/lib/mock-data";
import { formatFCFA } from "@/lib/utils";
import {
  Student,
  HotelRoom,
  PaymentReceipt,
  Employee,
  FinancialEntry,
  AbsenceTicket,
  LateTicket,
} from "@/types";
import {
  getStoredStudents,
  getStoredEmployees,
  getStoredFinances,
  getStoredRooms,
  getStoredReceipts,
  getStoredAbsences,
  getStoredLates,
  syncStudentsFromSupabase,
  syncRoomsFromSupabase,
  syncReceiptsFromSupabase,
  AVENIDA_DATA_UPDATED_EVENT,
} from "@/lib/realtime-store";

type ActiveSpace = "all" | "school" | "hotel" | "treasury";

export default function DashboardPage() {
  const [activeSpace, setActiveSpace] = useState<ActiveSpace>("all");
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [receiptsList, setReceiptsList] = useState<PaymentReceipt[]>([]);
  const [roomsList, setRoomsList] = useState<HotelRoom[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [financesList, setFinancesList] = useState<FinancialEntry[]>([]);
  const [absencesList, setAbsencesList] = useState<AbsenceTicket[]>([]);
  const [latesList, setLatesList] = useState<LateTicket[]>([]);

  const refreshAllStats = () => {
    setStudentsList(getStoredStudents());
    setReceiptsList(getStoredReceipts());
    setRoomsList(getStoredRooms());
    setEmployeesList(getStoredEmployees());
    setFinancesList(getStoredFinances());
    setAbsencesList(getStoredAbsences());
    setLatesList(getStoredLates());
  };

  useEffect(() => {
    refreshAllStats();
    Promise.all([
      syncStudentsFromSupabase(),
      syncRoomsFromSupabase(),
      syncReceiptsFromSupabase(),
    ]).then(() => refreshAllStats());

    window.addEventListener(AVENIDA_DATA_UPDATED_EVENT, refreshAllStats);
    window.addEventListener("storage", refreshAllStats);
    return () => {
      window.removeEventListener(AVENIDA_DATA_UPDATED_EVENT, refreshAllStats);
      window.removeEventListener("storage", refreshAllStats);
    };
  }, []);

  // Key metrics calculées en direct
  const totalStudents = studentsList.length;
  const totalFeesCollected = receiptsList.reduce((sum, r) => sum + r.amount_paid, 0);
  const totalOccupiedRooms = roomsList.filter((r) => r.status === "occupée").length;
  const totalAvailableRooms = roomsList.filter((r) => r.status === "disponible").length;
  const occupancyRate = roomsList.length > 0 ? Math.round((totalOccupiedRooms / roomsList.length) * 100) : 0;
  const activeEmployeesCount = employeesList.filter((e) => e.status === "actif").length;

  const totalHotelRevenue = financesList
    .filter((f) => f.category === "Hébergement Hôtel" || f.category === "Restauration & Bar")
    .filter((f) => f.type === "recette")
    .reduce((sum, f) => sum + f.amount, 0) || 180000;

  // Métriques Scolaires & Situation Financière Certifiée par la Trésorerie
  const totalSchoolCollected = studentsList.reduce((sum, s) => sum + (Number(s.paid_fee) || 0), 0);
  const totalSchoolRemaining = studentsList.reduce((sum, s) => sum + (Number(s.remaining_fee) || 0), 0);
  const totalSchoolTarget = studentsList.reduce((sum, s) => sum + (Number(s.total_fee) || 0), 0);
  const schoolRecoveryRate = totalSchoolTarget > 0 ? Math.round((totalSchoolCollected / totalSchoolTarget) * 100) : 0;
  const settledStudentsCount = studentsList.filter((s) => Number(s.remaining_fee) === 0).length;
  const inProgressStudentsCount = studentsList.filter((s) => Number(s.paid_fee) > 0 && Number(s.remaining_fee) > 0).length;
  const unpaidStudentsCount = studentsList.filter((s) => Number(s.paid_fee) === 0).length;

  // Métriques Trésorerie & Caisse Globale
  const totalFinancesDepenses = financesList
    .filter((f) => f.type === "depense")
    .reduce((sum, f) => sum + f.amount, 0);
  const totalGlobalRevenue = totalSchoolCollected + totalHotelRevenue;
  const netTreasuryBalance = totalGlobalRevenue - totalFinancesDepenses;

  return (
    <div className="space-y-8 animate-fade-in">
      <DirectorPendingApprovalsBanner />

      {/* 1. Official Header & Institution Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Tricolore Top Accent Bar: Blue - White - Red */}
        <div className="absolute top-0 left-0 right-0 h-2 flex">
          <div className="w-1/3 bg-[#0C356A]" />
          <div className="w-1/3 bg-slate-200" />
          <div className="w-1/3 bg-[#DC2626]" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
          <div className="flex items-center gap-5">
            <AvenidaLogo size="lg" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-[#0C356A] uppercase font-serif">
                  HÔTEL ÉCOLE
                </span>
                <span className="text-xs font-black tracking-widest text-[#DC2626] uppercase font-serif">
                  AVENIDA
                </span>
                <span className="text-[10px] bg-red-100 text-[#DC2626] font-extrabold px-2 py-0.5 rounded-full border border-red-200">
                  LOMÉ - TOGO
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[#0C356A] font-serif tracking-tight mt-0.5">
                Plateforme Intégrée de Gestion
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Centre de Formation Hôtelière &bull; Lomé &bull;{" "}
                <span className="italic text-[#0C356A] font-semibold">
                  « Travail – Discipline – Excellence »
                </span>
              </p>
            </div>
          </div>

          {/* Quick Direct Actions with Rich Hover Lift & Micro-animations */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/students"
              className="px-4 py-2 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 btn-lift flex items-center gap-2 group active:scale-95"
            >
              <GraduationCap className="w-4 h-4 text-blue-200 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
              <span>Dossiers Élèves</span>
            </Link>
            <Link
              href="/dashboard/hotel"
              className="px-4 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 btn-lift-red flex items-center gap-2 group active:scale-95"
            >
              <BedDouble className="w-4 h-4 text-red-200 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
              <span>Planning Hôtel</span>
            </Link>
            <Link
              href="/dashboard/payments"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 btn-lift flex items-center gap-2 group active:scale-95"
            >
              <CreditCard className="w-4 h-4 text-amber-400 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
              <span>Caisse Lomé</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. ESPACES ESSENTIELS — Grand Sélecteur Visuel d'Espaces Métiers avec Micro-interactions */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-col sm:flex-row items-center gap-1.5 border border-slate-200 shadow-2xs">
        <button
          onClick={() => setActiveSpace("all")}
          className={`flex-1 w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 group active:scale-98 ${
            activeSpace === "all"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200 -translate-y-0.5"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:-translate-y-0.5"
          }`}
        >
          <Building className="w-4 h-4 text-slate-700 transition-transform duration-200 group-hover:scale-110" />
          <span>VUE CONSOLIDÉE DIRECTION (Globale)</span>
        </button>

        <button
          onClick={() => setActiveSpace("school")}
          className={`flex-1 w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 group active:scale-98 ${
            activeSpace === "school"
              ? "bg-[#0C356A] text-white shadow-md border border-[#0C356A] -translate-y-0.5"
              : "text-[#0C356A] hover:bg-blue-50 hover:-translate-y-0.5"
          }`}
        >
          <GraduationCap className="w-4 h-4 text-blue-300 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
          <span>ESPACE 1 : ÉCOLE & FORMATION (Bleu)</span>
        </button>

        <button
          onClick={() => setActiveSpace("hotel")}
          className={`flex-1 w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 group active:scale-98 ${
            activeSpace === "hotel"
              ? "bg-[#DC2626] text-white shadow-md border border-[#DC2626] -translate-y-0.5"
              : "text-[#DC2626] hover:bg-red-50 hover:-translate-y-0.5"
          }`}
        >
          <BedDouble className="w-4 h-4 text-red-200 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
          <span>ESPACE 2 : HÔTELLERIE & CLIENTS (Rouge)</span>
          <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold transition-transform duration-200 group-hover:scale-105">
            {totalAvailableRooms} dispo
          </span>
        </button>

        <button
          onClick={() => setActiveSpace("treasury")}
          className={`flex-1 w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 group active:scale-98 ${
            activeSpace === "treasury"
              ? "bg-emerald-700 text-white shadow-md border border-emerald-700 -translate-y-0.5"
              : "text-emerald-800 hover:bg-emerald-50 hover:-translate-y-0.5"
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-300 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
          <span>ESPACE 3 : CAISSE & TRÉSORERIE (Vert)</span>
        </button>
      </div>

      {/* 3. CARTES KPI ESSENTIELLES (Adaptées à la sélection) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {(activeSpace === "all" || activeSpace === "school") && (
          <StatsCard
            title="Écolages Encaissés"
            value={formatFCFA(totalFeesCollected)}
            subtitle="Recouvré sur l'année en cours"
            icon={CreditCard}
            variant="school"
            trend={{ value: "+18% vs N-1", isPositive: true }}
            badge="Pôle École"
          />
        )}

        {(activeSpace === "all" || activeSpace === "school") && (
          <StatsCard
            title="Élèves Inscrits"
            value={`${totalStudents} apprenants`}
            subtitle="CFA, CAP, BEP, BT, BTS"
            icon={GraduationCap}
            variant="school"
            trend={{ value: "100% assiduité matin", isPositive: true }}
            badge="Pôle École"
          />
        )}

        {(activeSpace === "all" || activeSpace === "hotel") && (
          <StatsCard
            title="Taux Occupation Hôtel"
            value={`${occupancyRate}%`}
            subtitle={`${totalOccupiedRooms} occupées / ${roomsList.length} ch.`}
            icon={BedDouble}
            variant="hotel"
            trend={{ value: `${totalAvailableRooms} chambres libres`, isPositive: true }}
            badge="Pôle Hôtel"
          />
        )}

        {(activeSpace === "all" || activeSpace === "hotel") && (
          <StatsCard
            title="Recettes Hôtel du Jour"
            value={formatFCFA(totalHotelRevenue)}
            subtitle="Séjours, bar & restaurant"
            icon={TrendingUp}
            variant="hotel"
            trend={{ value: "+12% ce mois", isPositive: true }}
            badge="Pôle Hôtel"
          />
        )}

        {activeSpace === "treasury" && (
          <>
            <StatsCard
              title="Recettes Globales Encaissées"
              value={formatFCFA(totalGlobalRevenue)}
              subtitle={`Scolarité : ${formatFCFA(totalSchoolCollected)} • Hôtel : ${formatFCFA(totalHotelRevenue)}`}
              icon={TrendingUp}
              variant="default"
              badge="Caisse Centrale"
            />
            <StatsCard
              title="Créances Scolarités Restantes"
              value={formatFCFA(totalSchoolRemaining)}
              subtitle={`${inProgressStudentsCount} partiels • ${unpaidStudentsCount} non commencés`}
              icon={AlertCircle}
              variant="hotel"
              badge="Reste à Recouvrer"
            />
            <StatsCard
              title="Taux Recouvrement Scolaire"
              value={`${schoolRecoveryRate}%`}
              subtitle={`${settledStudentsCount} élèves soldés sur ${totalStudents}`}
              icon={CheckCircle2}
              variant="school"
              badge="Recouvrement"
            />
            <StatsCard
              title="Solde Net Théorique Caisse"
              value={formatFCFA(netTreasuryBalance)}
              subtitle={`Total Dépenses : ${formatFCFA(totalFinancesDepenses)}`}
              icon={CreditCard}
              variant="default"
              badge="Trésorerie"
            />
          </>
        )}

        {activeSpace === "all" && (
          <StatsCard
            title="Personnel & Profs"
            value={`${activeEmployeesCount} actifs`}
            subtitle={`${employeesList.length} collaborateurs enregistrés`}
            icon={Briefcase}
            variant="default"
            badge="Direction & RH"
          />
        )}
      </div>

      {/* 4. BLOCS MÉTIERS SÉPARÉS : ÉCOLE VS HÔTEL */}

      {/* ========================================================
          ESPACE 1 : PÔLE ÉCOLE HÔTELIÈRE (Cadre et Accent BLEU)
         ======================================================== */}
      {(activeSpace === "all" || activeSpace === "school") && (
        <section className="bg-white rounded-3xl border-2 border-blue-200 shadow-xs overflow-hidden">
          {/* Section Header: Blue Band */}
          <div className="bg-[#0C356A] text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-wide font-serif">
                    ESPACE ÉCOLE & FORMATION
                  </h2>
                  <span className="text-[10px] bg-blue-400/30 text-blue-100 font-bold px-2 py-0.5 rounded-full border border-blue-300/30">
                    ACADÉMIQUE
                  </span>
                </div>
                <p className="text-xs text-blue-100">
                  Gestion des inscriptions, filières officielles d'Avenida, carnet de correspondance et scolarité
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/students"
                className="px-3.5 py-1.5 bg-white text-[#0C356A] rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors"
              >
                Tous les Élèves
              </Link>
              <Link
                href="/dashboard/payments"
                className="px-3.5 py-1.5 bg-blue-500/30 hover:bg-blue-500/40 text-white rounded-xl text-xs font-bold border border-blue-300/30 transition-colors"
              >
                Caisse Écolages
              </Link>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table des Encaissements Scolaires (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-serif">
                    Derniers Reçus Scolaires (#AV2022-xxxx) &bull; Lomé
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Versements enregistrés avec le format de reçu certifié
                  </p>
                </div>
                <Link
                  href="/dashboard/payments"
                  className="text-xs font-bold text-[#0C356A] hover:underline flex items-center gap-1"
                >
                  <span>Journal complet</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-blue-50/60 text-[#0C356A] font-bold border-b border-blue-100 whitespace-nowrap">
                      <tr>
                        <th className="py-2.5 px-3">Réf</th>
                        <th className="py-2.5 px-3">Élève & Matricule</th>
                        <th className="py-2.5 px-3">Classe</th>
                        <th className="py-2.5 px-3">Motif</th>
                        <th className="py-2.5 px-3 text-right">Payé</th>
                        <th className="py-2.5 px-3 text-right">Reste</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receiptsList.slice(0, 5).map((r) => (
                        <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {r.reference}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{r.student_name}</div>
                            <div className="text-[10px] text-blue-900 font-mono">
                              {r.student_matricule}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">{r.class_name}</td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{r.designation}</td>
                          <td className="py-3 px-3 text-right font-black text-emerald-700 whitespace-nowrap">
                            {formatFCFA(r.amount_paid)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-amber-900 whitespace-nowrap">
                            {formatFCFA(r.remaining_due)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() =>
                                alert(
                                  `Impression Reçu Officiel ${r.reference} certifié pour ${r.student_name}`
                                )
                              }
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors"
                              title="Imprimer Reçu Duplicata"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Carnet de Correspondance : Billets Absences / Retards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {absencesList.length > 0 ? (
                  absencesList.slice(0, 2).map((abs) => (
                    <div key={abs.id} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-800 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          Billet d&apos;Absence N°{abs.ticket_number}
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">
                          {abs.class_name}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{abs.student_name}</p>
                      <p className="text-[11px] text-slate-600">{abs.start_date} &bull; Motif : {abs.reason}</p>
                      <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3 h-3" /> {abs.visa_vie_scolaire ? "Visa Vie Scolaire accordé" : "En attente de visa"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 text-xs text-rose-800 flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Aucune absence non justifiée en cours</span>
                  </div>
                )}

                {latesList.length > 0 ? (
                  latesList.slice(0, 2).map((late) => (
                    <div key={late.id} className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-600" />
                          Billet de Retard N°{late.ticket_number} ({late.duration_minutes} min)
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                          {late.class_name}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{late.student_name}</p>
                      <p className="text-[11px] text-slate-600">{(late as any).date || "Aujourd'hui"} &bull; Orientation : <strong>{late.destination}</strong></p>
                      <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3 h-3" /> Visa Vie Scolaire apposé
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 text-xs text-blue-800 flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Aucun retard signalé ce matin</span>
                  </div>
                )}
              </div>
            </div>

            {/* Formations Officielles Avenida (1 col) */}
            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#0C356A]" />
                <h3 className="text-xs font-black uppercase text-[#0C356A] tracking-wider">
                  Diplômes & Formations Avenida
                </h3>
              </div>
              <p className="text-[11px] text-slate-600">
                Grille annuelle 2026-2027 (extraite du document de référence) :
              </p>
              <div className="space-y-2">
                {MOCK_PROGRAMS.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-white rounded-xl border border-blue-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-black text-[#0C356A]">{p.code}</span>
                      <span className="text-[10px] text-slate-500 ml-1">({p.duration_years} an{p.duration_years > 1 ? "s" : ""})</span>
                      <div className="text-[10px] text-slate-500">Recrutement: {p.entry_level}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">{formatFCFA(p.annual_tuition)}</span>
                      <span className="text-[10px] text-slate-400">par an</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          ESPACE 2 : PÔLE HÔTELLERIE & CLIENTÈLE (Cadre et Accent ROUGE)
         ======================================================== */}
      {(activeSpace === "all" || activeSpace === "hotel") && (
        <section className="bg-white rounded-3xl border-2 border-red-200 shadow-xs overflow-hidden">
          {/* Section Header: Red Band */}
          <div className="bg-[#DC2626] text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BedDouble className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-wide font-serif">
                    ESPACE HÔTEL & CLIENTÈLE
                  </h2>
                  <span className="text-[10px] bg-red-400/40 text-white font-bold px-2 py-0.5 rounded-full border border-white/20">
                    HÉBERGEMENT
                  </span>
                </div>
                <p className="text-xs text-red-100">
                  Gestion des chambres, réservations, arrivées/départs (Check-in/out) et gouvernance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/hotel"
                className="px-3.5 py-1.5 bg-white text-[#DC2626] rounded-xl text-xs font-bold hover:bg-red-50 transition-colors"
              >
                Plan Complet des Chambres
              </Link>
              <button
                onClick={() => alert("Enregistrement Check-in immédiat")}
                className="px-3.5 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-bold border border-red-400/30 transition-colors"
              >
                Nouveau Check-in
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Disponibilité des Chambres en Temps Réel
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cliquez sur une chambre pour effectuer un check-in, un check-out ou changer l'état ménage
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> {totalAvailableRooms} Disponible{totalAvailableRooms > 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5 text-rose-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> {totalOccupiedRooms} Occupée{totalOccupiedRooms > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Grille Interactive des Chambres */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {roomsList.map((room) => {
                const statusStyles = {
                  disponible: {
                    bg: "bg-emerald-50 border-emerald-300 text-emerald-900",
                    badge: "bg-emerald-100 text-emerald-800",
                    btn: "bg-[#0C356A] text-white hover:bg-[#164E87]",
                    actionText: "Check-in",
                  },
                  occupée: {
                    bg: "bg-rose-50 border-rose-300 text-rose-900",
                    badge: "bg-rose-100 text-rose-800",
                    btn: "bg-[#DC2626] text-white hover:bg-[#b91c1c]",
                    actionText: "Check-out",
                  },
                  réservée: {
                    bg: "bg-blue-50 border-blue-300 text-blue-900",
                    badge: "bg-blue-100 text-blue-800",
                    btn: "bg-blue-800 text-white hover:bg-blue-900",
                    actionText: "Arrivée",
                  },
                  nettoyage: {
                    bg: "bg-amber-50 border-amber-300 text-amber-900",
                    badge: "bg-amber-100 text-amber-800",
                    btn: "bg-amber-600 text-white hover:bg-amber-700",
                    actionText: "Prête",
                  },
                  maintenance: {
                    bg: "bg-slate-100 border-slate-300 text-slate-800",
                    badge: "bg-slate-200 text-slate-700",
                    btn: "bg-slate-700 text-white",
                    actionText: "Réparer",
                  },
                  hors_service: {
                    bg: "bg-zinc-100 border-zinc-300 text-zinc-800",
                    badge: "bg-zinc-200 text-zinc-700",
                    btn: "bg-zinc-700 text-white",
                    actionText: "Détail",
                  },
                };

                const currentStyle =
                  (statusStyles as Record<string, any>)[room.status] || statusStyles.disponible;

                return (
                  <div
                    key={room.id}
                    className={`p-4 rounded-2xl border-2 ${currentStyle.bg} flex flex-col justify-between shadow-xs transition-all hover:scale-[1.01] space-y-3`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black font-serif">
                          Ch. {room.room_number}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${currentStyle.badge}`}
                        >
                          {room.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium opacity-80 mt-1">
                        {room.room_type} &bull; Ét. {room.floor}
                      </p>

                      {room.current_guest && (
                        <div className="mt-2 p-2 bg-white/90 rounded-lg border border-slate-200 text-[11px]">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Client</span>
                          <span className="font-bold text-slate-900 truncate block">
                            {room.current_guest}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-black font-serif">
                        {formatFCFA(room.price_per_night)}
                      </span>
                      <button
                        onClick={() => alert(`Action ${currentStyle.actionText} sur la Chambre ${room.room_number}`)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${currentStyle.btn}`}
                      >
                        {currentStyle.actionText}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          ESPACE 3 : PÔLE CAISSE & TRÉSORERIE (Cadre et Accent ÉMERAUDE)
         ======================================================== */}
      {(activeSpace === "all" || activeSpace === "treasury") && (
        <section className="bg-white rounded-3xl border-2 border-emerald-200 shadow-xs overflow-hidden">
          {/* Section Header: Emerald Band */}
          <div className="bg-emerald-800 text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-wide font-serif">
                    ESPACE CAISSE & TRÉSORERIE CENTRALE
                  </h2>
                  <span className="text-[10px] bg-emerald-500/40 text-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-300/30">
                    GESTION DES FONDS & REÇUS
                  </span>
                </div>
                <p className="text-xs text-emerald-100">
                  Entrées et sorties d'argent, encaissements écolages &amp; clients hôtel, balance des soldes en temps réel
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/payments"
                className="px-3.5 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors shadow-xs"
              >
                Guichet Caisse Unique
              </Link>
              <Link
                href="/dashboard/finances"
                className="px-3.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-950/60 text-white rounded-xl text-xs font-bold border border-emerald-400/30 transition-colors"
              >
                Livre de Trésorerie
              </Link>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 block mb-1">Total Encaissé Tous Pôles</span>
              <p className="text-2xl font-black text-emerald-900">{formatFCFA(totalGlobalRevenue)}</p>
              <p className="text-[10px] text-emerald-700 mt-1">
                Scolarité : {formatFCFA(totalSchoolCollected)} &bull; Hôtel : {formatFCFA(totalHotelRevenue)}
              </p>
            </div>

            <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200">
              <span className="text-[11px] font-bold text-rose-800 block mb-1">Créances Restantes à Recouvrer</span>
              <p className="text-2xl font-black text-[#DC2626]">{formatFCFA(totalSchoolRemaining)}</p>
              <p className="text-[10px] text-rose-700 mt-1">
                {inProgressStudentsCount} élèves en cours &bull; {unpaidStudentsCount} non démarrés
              </p>
            </div>

            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200">
              <span className="text-[11px] font-bold text-blue-800 block mb-1">Taux Global de Recouvrement</span>
              <p className="text-2xl font-black text-[#0C356A]">{schoolRecoveryRate}%</p>
              <p className="text-[10px] text-blue-700 mt-1">
                {settledStudentsCount} élèves totalement soldés (100%) sur {totalStudents}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
