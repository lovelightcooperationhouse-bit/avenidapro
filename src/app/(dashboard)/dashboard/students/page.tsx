"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  ArrowRight,
  GraduationCap,
  Download,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building,
  UserCheck,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  Award,
  Sparkles,
} from "lucide-react";
import { MOCK_STUDENTS } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/utils";
import { useSchoolYear } from "@/context/SchoolYearContext";
import { Student, StudentReportCard } from "@/types";
import { ReportCardModal } from "@/components/shared/ReportCardModal";
import {
  getReportCardsFromStorage,
  createBlankReportCardForStudent,
  upsertReportCard,
} from "@/lib/report-cards-data";

export default function StudentsPage() {
  const { selectedYearLabel, setSelectedYear } = useSchoolYear();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProgram, setFilterProgram] = useState("ALL");
  const [selectedYearTab, setSelectedYearTab] = useState<string>("ALL");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedReportCard, setSelectedReportCard] = useState<StudentReportCard | null>(null);

  const handleOpenStudentReport = (st: Student) => {
    const existing = getReportCardsFromStorage().find(
      (c) => c.student_matricule === st.registration_number
    );
    if (existing) {
      setSelectedReportCard(existing);
    } else {
      const created = createBlankReportCardForStudent(st.id);
      const ranked = upsertReportCard(created);
      const match = ranked.find((c) => c.student_matricule === st.registration_number) || created;
      setSelectedReportCard(match);
    }
  };

  // Statistiques calculées
  const stats = useMemo(() => {
    const list =
      selectedYearTab === "ALL" || MOCK_STUDENTS.length <= 2
        ? MOCK_STUDENTS
        : MOCK_STUDENTS.filter((s) => s.academic_year === selectedYearTab);

    const total = list.length;
    const girls = list.filter((s) => s.gender === "F").length;
    const boys = list.filter((s) => s.gender === "M").length;
    const btsCount = list.filter((s) => s.program_code === "BTS").length;
    const capCount = list.filter((s) => s.program_code === "CAP").length;
    const cfaCount = list.filter((s) => s.program_code === "CFA").length;
    const totalTuition = list.reduce((acc, s) => acc + s.total_fee, 0);
    const paidTuition = list.reduce((acc, s) => acc + s.paid_fee, 0);

    return {
      total,
      girls,
      boys,
      btsCount,
      capCount,
      cfaCount,
      totalTuition,
      paidTuition,
    };
  }, [selectedYearTab]);

  // Filtrage combiné par année, programme et texte
  const filteredStudents = useMemo(() => {
    return MOCK_STUDENTS.filter((s) => {
      const matchesYear =
        selectedYearTab === "ALL" ||
        s.academic_year === selectedYearTab ||
        MOCK_STUDENTS.length <= 2;
      const matchesProgram =
        filterProgram === "ALL" || s.program_code === filterProgram;
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        `${s.last_name} ${s.first_name}`.toLowerCase().includes(q) ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.registration_number.toLowerCase().includes(q) ||
        s.class_name.toLowerCase().includes(q) ||
        s.program_code.toLowerCase().includes(q) ||
        s.academic_year.toLowerCase().includes(q) ||
        s.residence_neighborhood.toLowerCase().includes(q) ||
        (q === "soldé" && s.remaining_fee === 0) ||
        (q === "impayé" && s.paid_fee === 0) ||
        (q === "partiel" && s.remaining_fee > 0 && s.paid_fee > 0);

      return matchesYear && matchesProgram && matchesSearch;
    });
  }, [selectedYearTab, filterProgram, searchTerm]);

  return (
    <div className="space-y-6">
      {/* 1. EN-TÊTE OFFICIEL DE LA SCOLARITÉ */}
      <div className="bg-white p-6 rounded-3xl border-2 border-blue-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0C356A] text-white flex items-center justify-center shadow-md">
            <GraduationCap className="w-7 h-7 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0C356A] px-2 py-0.5 rounded-full">
                ESPACE ÉCOLE & FORMATION
              </span>
              <span className="text-xs text-slate-400">
                &bull; Base Officielle des Étudiants Avenida Lomé
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#0C356A] font-serif">
              Dossiers & Effectifs Scolaires Réels
            </h1>
            <p className="text-xs text-slate-500">
              Registre officiel complet classé par année : Promotions 2024-2025, 2025-2026 et 2026-2027
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/students/new"
            className="px-4 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>Nouvelle Inscription Élève</span>
          </Link>
        </div>
      </div>

      {/* 2. STATISTIQUES EN TEMPS RÉEL SELON L'ANNÉE SÉLECTIONNÉE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Effectif Inscrit</span>
            <Users className="w-4 h-4 text-[#0C356A]" />
          </div>
          <div className="text-2xl font-black text-[#0C356A] mt-2">{stats.total} élèves</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {selectedYearTab === "ALL" ? "Toutes années confondues" : `Promotion ${selectedYearTab}`}
          </div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-black">
            <span>Cycle BTS Hôtelier</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-2">{stats.btsCount}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">BTS / DUT Restauration</div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-black">
            <span>Cycles CAP & CFA</span>
            <Building className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">
            {stats.capCount + stats.cfaCount}{" "}
            <span className="text-xs font-semibold text-amber-800">
              ({stats.capCount} CAP &bull; {stats.cfaCount} CFA)
            </span>
          </div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">Cuisine, Pâtisserie & Mod</div>
        </div>

        <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 shadow-2xs">
          <div className="flex items-center justify-between text-purple-800 text-xs font-black">
            <span>Répartition Genre</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-950 mt-2">
            {stats.girls} <span className="text-xs font-bold text-rose-600">F</span> &bull; {stats.boys}{" "}
            <span className="text-xs font-bold text-blue-600">G</span>
          </div>
          <div className="text-[10px] text-purple-700 font-semibold mt-1">
            {Math.round((stats.girls / (stats.total || 1)) * 100)}% de jeunes filles
          </div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
            <span>Recouvrement Écolage</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-950 mt-2.5">
            {formatFCFA(stats.paidTuition)}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
            Sur {formatFCFA(stats.totalTuition)} attendus
          </div>
        </div>
      </div>

      {/* 3. CLASSEMENT DIRECT PAR ANNÉE SCOLAIRE (ONGLETS DÉDIÉS) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full lg:w-auto bg-slate-100 p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setSelectedYearTab("ALL")}
            className={`px-3.5 py-2 rounded-lg text-xs font-black shrink-0 transition-all ${
              selectedYearTab === "ALL"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Toutes les Promotions ({MOCK_STUDENTS.length})
          </button>

          <button
            onClick={() => setSelectedYearTab("2024 - 2025")}
            className={`px-3.5 py-2 rounded-lg text-xs font-black shrink-0 flex items-center gap-1.5 transition-all ${
              selectedYearTab === "2024 - 2025"
                ? "bg-[#0C356A] text-white shadow-sm"
                : "text-[#0C356A] hover:bg-blue-50"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Année 2024 – 2025 (2 élèves)</span>
          </button>

          <button
            onClick={() => setSelectedYearTab("2025 - 2026")}
            className={`px-3.5 py-2 rounded-lg text-xs font-black shrink-0 flex items-center gap-1.5 transition-all ${
              selectedYearTab === "2025 - 2026"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-emerald-900 hover:bg-emerald-50"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Année 2025 – 2026 (2 élèves)</span>
          </button>

          <button
            onClick={() => setSelectedYearTab("2026 - 2027")}
            className={`px-3.5 py-2 rounded-lg text-xs font-black shrink-0 flex items-center gap-1.5 transition-all ${
              selectedYearTab === "2026 - 2027"
                ? "bg-purple-700 text-white shadow-sm"
                : "text-purple-900 hover:bg-purple-50"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Année 2026 – 2027 (2 élèves)</span>
          </button>
        </div>

        {/* Barre de Recherche et Filtre Filière */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tapez un nom, matricule (814AVN), filière (BTS, CAP...), quartier..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20"
            />
          </div>

          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none"
          >
            <option value="ALL">Tous diplômes</option>
            <option value="BTS">BTS</option>
            <option value="CAP">CAP</option>
            <option value="CFA">CFA</option>
          </select>
        </div>
      </div>

      {/* 4. TABLEAU DE RÉSULTATS DYNAMIQUE DES ÉLÈVES */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Élève & État Civil</th>
                <th className="py-3.5 px-4">Matricule & Contact Lomé</th>
                <th className="py-3.5 px-4">Diplôme & Classe</th>
                <th className="py-3.5 px-4">Année Scolaire</th>
                <th className="py-3.5 px-4 text-right">Écolage & Paiement</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => {
                const isPaidFull = s.remaining_fee === 0;

                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs ${
                            s.gender === "F" ? "bg-rose-600" : "bg-[#0C356A]"
                          }`}
                        >
                          {s.last_name[0]}
                          {s.first_name[0]}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 group-hover:text-[#0C356A] transition-colors text-sm">
                            {s.last_name} {s.first_name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Genre: <strong className="text-slate-700">{s.gender === "F" ? "Féminin" : "Masculin"}</strong> &bull; Né(e) le {s.birth_date}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-black text-[#0C356A] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                        {s.registration_number}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {s.phone} &bull; Lomé ({s.residence_neighborhood})
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{s.class_name}</div>
                      <span className="text-[10px] font-black uppercase text-blue-700">
                        Diplôme : {s.program_code}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          s.academic_year === "2024 - 2025"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : s.academic_year === "2025 - 2026"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-purple-50 text-purple-800 border-purple-200"
                        }`}
                      >
                        {s.academic_year}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-bold text-slate-900">
                        {formatFCFA(s.paid_fee)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isPaidFull ? (
                          <span className="text-emerald-700 font-bold">Solde réglé (100%)</span>
                        ) : (
                          <span className="text-rose-600 font-bold">
                            Reste: {formatFCFA(s.remaining_fee)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Inscrit Actif
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenStudentReport(s)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-[#0C356A] hover:text-white text-[#0C356A] font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs border border-blue-200 active:scale-95"
                          title="Consulter et télécharger le bulletin officiel"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>Bulletin</span>
                        </button>
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-[#0C356A] hover:text-white text-slate-700 font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs active:scale-95"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Fiche 360°</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    Aucun élève trouvé pour ces critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL FICHE SIGNALÉTIQUE 360° DE L'ÉLÈVE */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header du dossier */}
            <div className="p-6 bg-gradient-to-r from-[#0C356A] to-[#164E87] text-white rounded-t-3xl relative">
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-black shadow-md">
                  {selectedStudent.last_name[0]}
                  {selectedStudent.first_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-mono">
                      {selectedStudent.registration_number}
                    </span>
                    <span className="text-xs text-white/80 font-bold">
                      Année {selectedStudent.academic_year}
                    </span>
                  </div>
                  <h2 className="text-xl font-black mt-1">
                    {selectedStudent.last_name} {selectedStudent.first_name}
                  </h2>
                  <p className="text-xs text-blue-200 font-semibold">{selectedStudent.class_name}</p>
                </div>
              </div>
            </div>

            {/* Corps du dossier */}
            <div className="p-6 space-y-5 text-xs text-slate-700">
              {/* Identité */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] border-b pb-1 mb-2.5">
                  État Civil & Coordonnées
                </h3>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Genre</span>
                    <span className="font-bold text-slate-800">
                      {selectedStudent.gender === "F" ? "Féminin" : "Masculin"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Date de Naissance</span>
                    <span className="font-bold text-slate-800">{selectedStudent.birth_date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Nationalité</span>
                    <span className="font-bold text-slate-800">{selectedStudent.nationality}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Quartier (Lomé)</span>
                    <span className="font-bold text-slate-800">{selectedStudent.residence_neighborhood}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Téléphone</span>
                    <span className="font-bold text-slate-800">{selectedStudent.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Email</span>
                    <span className="font-bold text-slate-800">{selectedStudent.email}</span>
                  </div>
                </div>
              </div>

              {/* Scolarité & Cursus */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] border-b pb-1 mb-2.5">
                  Formation & Régime Avenida
                </h3>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Diplôme Préparé</span>
                    <span className="font-bold text-slate-800">{selectedStudent.program_code}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Classe Affectée</span>
                    <span className="font-bold text-slate-800">{selectedStudent.class_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Année de Promotion</span>
                    <span className="font-bold text-slate-800">{selectedStudent.academic_year}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Régime Scolaire</span>
                    <span className="font-bold text-slate-800 uppercase">
                      {selectedStudent.boarder_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bilan Financier */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] border-b pb-1 mb-2.5">
                  Bilan Écolage & Situation Caisse
                </h3>
                <div className="grid grid-cols-3 gap-3 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Total Écolage Dû</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {formatFCFA(selectedStudent.total_fee)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 font-bold block">Montant Réglé</span>
                    <span className="font-mono font-black text-emerald-800 text-sm">
                      {formatFCFA(selectedStudent.paid_fee)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-700 font-bold block">Solde Restant</span>
                    <span className="font-mono font-black text-rose-800 text-sm">
                      {formatFCFA(selectedStudent.remaining_fee)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bilan Académique & Bulletin */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] border-b pb-1 mb-2.5 flex items-center justify-between">
                  <span>Relevé de Notes & Bulletin Scolaire</span>
                  <span className="text-[10px] text-blue-600 font-bold lowercase">officiel</span>
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-3.5 rounded-2xl border border-blue-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Livret Scolaire Numérique
                    </span>
                    <span className="font-extrabold text-slate-900 text-xs">
                      Bulletin & Relevé Officiel avec Classement
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Calcul automatique des moyennes et rangs ministériels
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const st = selectedStudent;
                      setSelectedStudent(null);
                      handleOpenStudentReport(st);
                    }}
                    className="px-3 py-2 bg-[#0C356A] hover:bg-[#164E87] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 active:scale-95"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-300" />
                    <span>Consulter le Bulletin</span>
                  </button>
                </div>
              </div>

              {/* Responsable Légal */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] border-b pb-1 mb-2.5">
                  Contact d&apos;Urgence & Tuteur Légal
                </h3>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {selectedStudent.emergency_contact_name}
                    </span>
                    <span className="text-[11px] text-slate-500">Parent / Tuteur Officiel</span>
                  </div>
                  <div className="font-mono font-bold text-slate-800">
                    {selectedStudent.emergency_contact_phone}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center rounded-b-3xl">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Imprimer Fiche Élève</span>
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl text-xs transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DU BULLETIN DE NOTES DE L'ÉLÈVE */}
      {selectedReportCard && (
        <ReportCardModal
          reportCard={selectedReportCard}
          isOpen={!!selectedReportCard}
          onClose={() => setSelectedReportCard(null)}
        />
      )}
    </div>
  );
}
