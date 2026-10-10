"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Award,
  PlusCircle,
  Search,
  Star,
  CheckCircle2,
  X,
  Sparkles,
  Download,
  Printer,
  Eye,
  Edit3,
  GraduationCap,
  TrendingUp,
  FileText,
  Filter,
} from "lucide-react";
import { MOCK_GRADES, MOCK_STUDENTS } from "@/lib/mock-data";
import { ALL_REAL_STUDENTS } from "@/lib/real-students";
import { GradeRecord, StudentReportCard } from "@/types";
import {
  getReportCardsFromStorage,
  upsertReportCard,
  calculateClassRankings,
  syncReportCardsFromSupabase,
} from "@/lib/report-cards-data";
import { getStoredStudents } from "@/lib/realtime-store";
import { ReportCardModal } from "@/components/shared/ReportCardModal";
import { GradeEntryModal } from "@/components/shared/GradeEntryModal";

export default function GradesPage() {
  const [activeTab, setActiveTab] = useState<"bulletins" | "devoirs">("bulletins");
  const [reportCards, setReportCards] = useState<StudentReportCard[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>(MOCK_GRADES);

  // Filters for Report Cards
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Semestre 1");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [viewingCard, setViewingCard] = useState<StudentReportCard | null>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<StudentReportCard | null>(null);

  // Single grade entry modal state (Legacy tab)
  const [isSingleGradeModalOpen, setIsSingleGradeModalOpen] = useState(false);
  const initialStudent = getStoredStudents()[0];
  const [newGrade, setNewGrade] = useState({
    student_name: initialStudent ? `${initialStudent.first_name} ${initialStudent.last_name}` : "Élève Avenida",
    class_name: initialStudent?.class_name || "BTS1 - Restauration",
    subject: "Technologie Culinaire",
    evaluation_type: "Pratique Cuisine" as any,
    score: 15,
    coefficient: 3,
    teacher_name: "Chef KOUASSI Mawuli",
    appreciation: "Bonne application des règles d'hygiène et de sécurité.",
  });

  // Load report cards on mount and sync with Supabase
  useEffect(() => {
    const loaded = getReportCardsFromStorage();
    setReportCards(loaded);
    syncReportCardsFromSupabase().then((remote) => {
      if (remote && remote.length > 0) {
        setReportCards(remote);
      }
    });
  }, []);

  // Available classes in report cards
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    reportCards.forEach((c) => set.add(c.class_name));
    return Array.from(set);
  }, [reportCards]);

  // Filtered & Ranked Report Cards
  const filteredReportCards = useMemo(() => {
    const filtered = reportCards.filter((card) => {
      const matchClass = selectedClass === "ALL" || card.class_name === selectedClass;
      const matchPeriod = card.period === selectedPeriod;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        card.student_name.toLowerCase().includes(q) ||
        card.student_matricule.toLowerCase().includes(q) ||
        card.class_name.toLowerCase().includes(q);
      return matchClass && matchPeriod && matchSearch;
    });

    // Re-rank filtered view so ranks are accurate for this cohort
    return calculateClassRankings(filtered);
  }, [reportCards, selectedClass, selectedPeriod, searchTerm]);

  // Cohort statistics
  const cohortStats = useMemo(() => {
    if (filteredReportCards.length === 0) {
      return { avg: 0, highest: 0, lowest: 0, successRate: 0, total: 0 };
    }
    const avgs = filteredReportCards.map((c) => c.general_average);
    const avg = Number((avgs.reduce((sum, a) => sum + a, 0) / avgs.length).toFixed(2));
    const highest = Math.max(...avgs);
    const lowest = Math.min(...avgs);
    const successCount = filteredReportCards.filter((c) => c.general_average >= 10).length;
    const successRate = Math.round((successCount / filteredReportCards.length) * 100);

    return { avg, highest, lowest, successRate, total: filteredReportCards.length };
  }, [filteredReportCards]);

  // Save report card handler
  const handleSaveReportCard = (card: StudentReportCard) => {
    const updated = upsertReportCard(card);
    setReportCards(updated);
    setIsEntryModalOpen(false);
    setEditingCard(null);
    // Find the saved card in updated list to open viewing modal
    const justSaved = updated.find((c) => c.id === card.id) || card;
    setViewingCard(justSaved);
  };

  const handleOpenEdit = (card: StudentReportCard) => {
    setViewingCard(null);
    setEditingCard(card);
    setIsEntryModalOpen(true);
  };

  const handleAddSingleGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const created: GradeRecord = {
      id: `grd-${Date.now()}`,
      student_name: newGrade.student_name,
      student_matricule: "814AVN-24",
      class_name: newGrade.class_name,
      subject: newGrade.subject,
      evaluation_type: newGrade.evaluation_type,
      score: Number(newGrade.score),
      coefficient: Number(newGrade.coefficient),
      date: new Date().toISOString().split("T")[0],
      teacher_name: newGrade.teacher_name,
      appreciation: newGrade.appreciation,
    };
    setGrades([created, ...grades]);
    setIsSingleGradeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête Principal */}
      <div className="bg-white p-6 rounded-3xl border-2 border-blue-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0C356A] text-white flex items-center justify-center shadow-md">
            <BookOpen className="w-7 h-7 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0C356A] px-2 py-0.5 rounded-full">
                ESPACE ÉCOLE &bull; PÉDAGOGIE
              </span>
              <span className="text-xs text-slate-400">&bull; Bulletins & Classements</span>
            </div>
            <h1 className="text-2xl font-black text-[#0C356A] font-serif">
              Relevés de Notes, Bulletins & Classement
            </h1>
            <p className="text-xs text-slate-500">
              Calcul automatique des moyennes, classement par rang de promotion et génération des bulletins officiels téléchargeables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingCard(null);
              setIsEntryModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>Saisir Notes & Bulletin</span>
          </button>
        </div>
      </div>

      {/* Onglets Principaux */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("bulletins")}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
            activeTab === "bulletins"
              ? "bg-[#0C356A] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Award className="w-4 h-4 text-amber-300" />
          <span>Bulletins Officiels & Classement des Rangs</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {reportCards.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("devoirs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === "devoirs"
              ? "bg-[#0C356A] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileText className="w-4 h-4 text-slate-400" />
          <span>Contrôles Continus & Épreuves Simples</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
            {grades.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          CONTENU ONGLET 1 : BULLETINS SCOLAIRES & CLASSEMENT PAR RANG
          ========================================================================= */}
      {activeTab === "bulletins" && (
        <div className="space-y-6">
          {/* Statistiques en temps réel de la promotion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Moyenne de la Classe</span>
                <TrendingUp className="w-4 h-4 text-[#0C356A]" />
              </div>
              <div className="text-2xl font-black text-[#0C356A] mt-2">
                {cohortStats.avg}{" "}
                <span className="text-xs font-semibold text-slate-400">/ 20</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Sur {cohortStats.total} élèves évalués
              </div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
                <span>Plus Forte Moyenne (Major)</span>
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-2xl font-black text-emerald-950 mt-2">
                {cohortStats.highest}{" "}
                <span className="text-xs font-semibold text-emerald-700">/ 20</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                {filteredReportCards[0]
                  ? `Rang 1er : ${filteredReportCards[0].student_name}`
                  : "En attente"}
              </div>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs">
              <div className="flex items-center justify-between text-blue-800 text-xs font-black">
                <span>Taux d&apos;Admis (Moy. &ge; 10)</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-950 mt-2">
                {cohortStats.successRate}%
              </div>
              <div className="text-[10px] text-blue-700 font-semibold mt-1">
                Admissibles au niveau supérieur
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
                <span>Plus Faible Moyenne</span>
                <Sparkles className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-800 mt-2">
                {cohortStats.lowest}{" "}
                <span className="text-xs font-semibold text-slate-400">/ 20</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Seuil d&apos;accompagnement pédagogique
              </div>
            </div>
          </div>

          {/* Filtres & Barre de Recherche */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par élève ou matricule..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0C356A]"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Classe :</span>
              </div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Toutes les classes</option>
                {availableClasses.map((cl) => (
                  <option key={cl} value={cl}>
                    {cl}
                  </option>
                ))}
              </select>

              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none"
              >
                <option value="Semestre 1">Semestre 1</option>
                <option value="Semestre 2">Semestre 2</option>
                <option value="Trimestre 1">Trimestre 1</option>
                <option value="Trimestre 2">Trimestre 2</option>
                <option value="Trimestre 3">Trimestre 3</option>
                <option value="Session Annuelle">Session Annuelle</option>
              </select>
            </div>
          </div>

          {/* Tableau Officiel du Classement de la Promotion */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#0C356A]" />
                <h2 className="text-xs font-black uppercase text-[#0C356A] tracking-wider">
                  Classement Officiel des Moyennes & Rangs &bull; {selectedPeriod}
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {filteredReportCards.length} élève(s) classé(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 text-center w-20">Rang</th>
                    <th className="py-3 px-4">Élève & Matricule</th>
                    <th className="py-3 px-4">Classe & Cycle</th>
                    <th className="py-3 px-4 text-center">Coeffs / Points</th>
                    <th className="py-3 px-4 text-center">Moyenne Générale</th>
                    <th className="py-3 px-4">Mention & Décision</th>
                    <th className="py-3 px-4 text-right">Actions Bulletin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReportCards.map((card) => {
                    const isPodium = card.rank <= 3;
                    return (
                      <tr
                        key={card.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          card.rank === 1 ? "bg-amber-50/30" : ""
                        }`}
                      >
                        {/* Rang Officiel */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center font-black rounded-xl text-xs px-2.5 py-1 ${
                              card.rank === 1
                                ? "bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-xs"
                                : card.rank === 2
                                ? "bg-slate-200 text-slate-900"
                                : card.rank === 3
                                ? "bg-amber-100 text-amber-900"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {card.rank_display}
                          </span>
                        </td>

                        {/* Élève & Matricule */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                              {card.photo_url ? (
                                <img
                                  src={card.photo_url}
                                  alt={card.student_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                                  {card.student_name[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900">
                                {card.student_name}
                              </div>
                              <div className="text-[10px] font-mono text-[#0C356A] font-bold">
                                {card.student_matricule}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Classe */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{card.class_name}</div>
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            {card.program_code} &bull; {card.academic_year}
                          </span>
                        </td>

                        {/* Coeffs & Points */}
                        <td className="py-3.5 px-4 text-center font-mono">
                          <div className="font-bold text-slate-800">
                            {card.total_points.toFixed(1)} pts
                          </div>
                          <div className="text-[10px] text-slate-400">
                            sur {card.total_coefficients} coeffs
                          </div>
                        </td>

                        {/* Moyenne Générale */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-mono font-black text-sm px-2.5 py-1 rounded-xl inline-block ${
                              card.general_average >= 14
                                ? "bg-emerald-100 text-emerald-900"
                                : card.general_average >= 10
                                ? "bg-blue-100 text-blue-900"
                                : "bg-rose-100 text-rose-900"
                            }`}
                          >
                            {card.general_average.toFixed(2)} / 20
                          </span>
                        </td>

                        {/* Mention & Décision */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-black text-[10px] px-2 py-0.5 rounded-full inline-block ${
                              card.appreciation_mention === "Très Bien"
                                ? "bg-emerald-100 text-emerald-800"
                                : card.appreciation_mention === "Bien"
                                ? "bg-blue-100 text-blue-800"
                                : card.appreciation_mention === "Assez Bien"
                                ? "bg-indigo-100 text-indigo-800"
                                : card.appreciation_mention === "Passable"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {card.appreciation_mention}
                          </span>
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            {card.council_decision}
                          </div>
                        </td>

                        {/* Boutons d'Action */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(card)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                              title="Modifier les notes"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setViewingCard(card)}
                              className="px-3 py-1.5 bg-[#0C356A] hover:bg-[#164E87] text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                            >
                              <Printer className="w-3 h-3 text-amber-300" />
                              <span>Voir & Télécharger</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredReportCards.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        Aucun bulletin trouvé pour ces filtres. Cliquez sur &laquo; Saisir Notes & Bulletin &raquo; pour commencer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTENU ONGLET 2 : CONTRÔLE CONTINU & ÉVALUATIONS PAR ÉPREUVE
          ========================================================================= */}
      {activeTab === "devoirs" && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Journal des Évaluations Uniques (Devoirs écrits, Pratiques cuisine & service)
            </span>
            <button
              onClick={() => setIsSingleGradeModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#0C356A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Saisir une Évaluation</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Élève & Classe</th>
                  <th className="py-3 px-4">Matière</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Note / 20</th>
                  <th className="py-3 px-4">Coeff</th>
                  <th className="py-3 px-4">Professeur</th>
                  <th className="py-3 px-4">Appréciation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grades.map((grd) => (
                  <tr key={grd.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{grd.student_name}</div>
                      <div className="text-[10px] text-slate-500">{grd.class_name}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{grd.subject}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {grd.evaluation_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-sm font-black px-2 py-0.5 rounded-lg ${
                          grd.score >= 14
                            ? "bg-emerald-100 text-emerald-800"
                            : grd.score >= 10
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {grd.score} / 20
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-600">x{grd.coefficient}</td>
                    <td className="py-3 px-4 text-slate-700">{grd.teacher_name}</td>
                    <td className="py-3 px-4 text-slate-600 italic">
                      &laquo; {grd.appreciation} &raquo;
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1 : Aperçu & Téléchargement du Bulletin Officiel */}
      {viewingCard && (
        <ReportCardModal
          reportCard={viewingCard}
          isOpen={!!viewingCard}
          onClose={() => setViewingCard(null)}
          onEdit={(card) => handleOpenEdit(card)}
        />
      )}

      {/* MODAL 2 : Saisie Complète des Notes & Générateur de Bulletin */}
      <GradeEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingCard(null);
        }}
        onSave={handleSaveReportCard}
        initialReportCard={editingCard}
      />

      {/* MODAL 3 : Saisie Simple d'une Note Isolée */}
      {isSingleGradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-[#0C356A]">Saisir une Note Isolée</h2>
              <button onClick={() => setIsSingleGradeModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddSingleGrade} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Élève</label>
                <input
                  type="text"
                  required
                  value={newGrade.student_name}
                  onChange={(e) => setNewGrade({ ...newGrade, student_name: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Matière</label>
                  <input
                    type="text"
                    required
                    value={newGrade.subject}
                    onChange={(e) => setNewGrade({ ...newGrade, subject: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type d&apos;épreuve</label>
                  <select
                    value={newGrade.evaluation_type}
                    onChange={(e) =>
                      setNewGrade({ ...newGrade, evaluation_type: e.target.value as any })
                    }
                    className="form-input-avenida"
                  >
                    <option value="Pratique Cuisine">Pratique Cuisine</option>
                    <option value="Pratique Hôtel">Pratique Hôtel</option>
                    <option value="Devoir Écrit">Devoir Écrit</option>
                    <option value="Examen Blanc">Examen Blanc</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Note (sur 20)</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    required
                    value={newGrade.score}
                    onChange={(e) => setNewGrade({ ...newGrade, score: Number(e.target.value) })}
                    className="form-input-avenida font-black text-base"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coefficient</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newGrade.coefficient}
                    onChange={(e) =>
                      setNewGrade({ ...newGrade, coefficient: Number(e.target.value) })
                    }
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Professeur Évaluateur</label>
                <input
                  type="text"
                  value={newGrade.teacher_name}
                  onChange={(e) => setNewGrade({ ...newGrade, teacher_name: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Appréciation Pédagogique</label>
                <textarea
                  rows={2}
                  value={newGrade.appreciation}
                  onChange={(e) => setNewGrade({ ...newGrade, appreciation: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsSingleGradeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0C356A] text-white font-bold rounded-xl shadow-md"
                >
                  Enregistrer la Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
