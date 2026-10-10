"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Save,
  GraduationCap,
  Calculator,
  Award,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { StudentReportCard, SubjectGrade, Student, DiplomeCode } from "@/types";
import { getStoredStudents } from "@/lib/realtime-store";
import {
  CURRICULUM_BY_PROGRAM,
  getMentionAndDecision,
  createBlankReportCardForStudent,
} from "@/lib/report-cards-data";

interface GradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: StudentReportCard) => void;
  initialReportCard?: StudentReportCard | null;
  defaultStudentId?: string;
}

export function GradeEntryModal({
  isOpen,
  onClose,
  onSave,
  initialReportCard,
  defaultStudentId,
}: GradeEntryModalProps) {
  const students = getStoredStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialReportCard?.student_id || defaultStudentId || students[0]?.id || ""
  );
  const [selectedPeriod, setSelectedPeriod] = useState<StudentReportCard["period"]>(
    initialReportCard?.period || "Semestre 1"
  );
  const [academicYear, setAcademicYear] = useState<string>(
    initialReportCard?.academic_year || "2024 - 2025"
  );
  const [subjects, setSubjects] = useState<SubjectGrade[]>([]);
  const [absencesUnjustified, setAbsencesUnjustified] = useState(
    initialReportCard?.absences_unjustified ?? 0
  );
  const [absencesJustified, setAbsencesJustified] = useState(
    initialReportCard?.absences_justified ?? 0
  );
  const [latesCount, setLatesCount] = useState(
    initialReportCard?.lates_count ?? 0
  );
  const [conduct, setConduct] = useState(
    initialReportCard?.conduct_appreciation || "Bonne attitude et sérieux en cours et travaux pratiques."
  );
  const [principalComment, setPrincipalComment] = useState(
    initialReportCard?.principal_teacher_comment || "Travail régulier et satisfaisant. Poursuivez vos efforts."
  );

  // Initialize form state
  useEffect(() => {
    if (initialReportCard) {
      setSelectedStudentId(initialReportCard.student_id);
      setSelectedPeriod(initialReportCard.period);
      setAcademicYear(initialReportCard.academic_year);
      setSubjects(initialReportCard.subjects);
      setAbsencesUnjustified(initialReportCard.absences_unjustified);
      setAbsencesJustified(initialReportCard.absences_justified);
      setLatesCount(initialReportCard.lates_count);
      setConduct(initialReportCard.conduct_appreciation);
      setPrincipalComment(initialReportCard.principal_teacher_comment);
    } else {
      const template = createBlankReportCardForStudent(
        selectedStudentId,
        selectedPeriod,
        academicYear
      );
      setSubjects(template.subjects);
    }
  }, [initialReportCard, selectedStudentId, selectedPeriod, academicYear]);

  // When student changes, adapt subjects to student's diploma
  const handleStudentChange = (newStudentId: string) => {
    setSelectedStudentId(newStudentId);
    const template = createBlankReportCardForStudent(
      newStudentId,
      selectedPeriod,
      academicYear
    );
    setSubjects(template.subjects);
  };

  const handleScoreChange = (index: number, newScore: number) => {
    const validated = Math.max(0, Math.min(20, newScore));
    const copy = [...subjects];
    copy[index] = { ...copy[index], score: validated };
    setSubjects(copy);
  };

  const handleCommentChange = (index: number, comment: string) => {
    const copy = [...subjects];
    copy[index] = { ...copy[index], teacher_comment: comment };
    setSubjects(copy);
  };

  // Live calculations
  const totalCoeffs = subjects.reduce((sum, s) => sum + s.coefficient, 0);
  const totalPoints = Number(
    subjects.reduce((sum, s) => sum + s.score * s.coefficient, 0).toFixed(2)
  );
  const liveAverage = Number((totalPoints / (totalCoeffs || 1)).toFixed(2));
  const { mention, decision } = getMentionAndDecision(liveAverage);

  const selectedStudent =
    students.find((s) => s.id === selectedStudentId || s.registration_number === selectedStudentId) ||
    students[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const reportToSave: StudentReportCard = {
      id: initialReportCard?.id || `rep-${selectedStudent.id}-${Date.now()}`,
      bulletin_number:
        initialReportCard?.bulletin_number ||
        `BUL-${academicYear.split(" ")[0]}-${selectedStudent.program_code}-${Math.floor(
          10 + Math.random() * 90
        )}`,
      student_id: selectedStudent.id,
      student_name: `${selectedStudent.last_name} ${selectedStudent.first_name}`,
      student_matricule: selectedStudent.registration_number,
      student_number: selectedStudent.student_number,
      gender: selectedStudent.gender,
      birth_date: selectedStudent.birth_date,
      birth_place: selectedStudent.birth_place,
      nationality: selectedStudent.nationality,
      photo_url: selectedStudent.photo_url,
      class_name: selectedStudent.class_name,
      program_code: selectedStudent.program_code,
      academic_year: academicYear,
      period: selectedPeriod,
      total_students: 1, // Will be computed by class ranker
      subjects: subjects,
      total_coefficients: totalCoeffs,
      total_points: totalPoints,
      general_average: liveAverage,
      class_general_average: liveAverage,
      class_highest_average: liveAverage,
      class_lowest_average: liveAverage,
      rank: 1,
      rank_display: "1er",
      appreciation_mention: mention,
      council_decision: decision,
      absences_unjustified: Number(absencesUnjustified),
      absences_justified: Number(absencesJustified),
      lates_count: Number(latesCount),
      conduct_appreciation: conduct,
      principal_teacher_name: "Chef KOUASSI Mawuli",
      principal_teacher_comment: principalComment,
      director_comment:
        liveAverage >= 14
          ? "Félicitations de la Direction Générale. Parcours remarquable."
          : "Encouragements de la Direction. Poursuivez avec rigueur.",
      issue_date: `Lomé, le ${new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
    };

    onSave(reportToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0C356A] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black font-serif">
                {initialReportCard ? "Modifier le Relevé de Notes" : "Saisie des Notes & Génération de Bulletin"}
              </h2>
              <p className="text-xs text-blue-200">
                Calcul automatique des moyennes, totaux pondérés et classement en temps réel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Sélection de l'élève & Période */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="sm:col-span-1">
              <label className="font-bold text-slate-700 block mb-1">
                Sélectionner l&apos;Élève *
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0C356A]"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.last_name} {st.first_name} ({st.registration_number}) - {st.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Période d&apos;évaluation</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0C356A]"
              >
                <option value="Semestre 1">Semestre 1</option>
                <option value="Semestre 2">Semestre 2</option>
                <option value="Trimestre 1">Trimestre 1</option>
                <option value="Trimestre 2">Trimestre 2</option>
                <option value="Trimestre 3">Trimestre 3</option>
                <option value="Session Annuelle">Session Annuelle</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Année Académique</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0C356A]"
              >
                <option value="2024 - 2025">2024 - 2025</option>
                <option value="2025 - 2026">2025 - 2026</option>
                <option value="2026 - 2027">2026 - 2027</option>
              </select>
            </div>
          </div>

          {/* Tableau interactif de saisie des notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <span>Matières du Programme ({selectedStudent.program_code})</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (Note comprise entre 0 et 20)
                </span>
              </h3>
              <span className="text-xs font-bold text-[#0C356A]">
                {subjects.length} matières &bull; {totalCoeffs} coefficients
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Matière</th>
                    <th className="py-2.5 px-2 text-center w-16">Coeff</th>
                    <th className="py-2.5 px-2 text-center w-28">Note / 20 *</th>
                    <th className="py-2.5 px-2 text-center w-20">Points</th>
                    <th className="py-2.5 px-3">Appréciation de l&apos;enseignant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((sub, idx) => {
                    const weighted = Number((sub.score * sub.coefficient).toFixed(2));
                    return (
                      <tr key={sub.id || idx} className="hover:bg-blue-50/30">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{sub.subject_name}</div>
                          <div className="text-[10px] text-slate-400">{sub.teacher_name}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-600">
                          x{sub.coefficient}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            step={0.25}
                            required
                            value={sub.score}
                            onChange={(e) => handleScoreChange(idx, Number(e.target.value))}
                            className="w-20 text-center font-black text-xs py-1.5 px-2 border-2 border-blue-200 rounded-xl focus:border-[#0C356A] focus:outline-none bg-blue-50/50"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                          {weighted}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={sub.teacher_comment}
                            onChange={(e) => handleCommentChange(idx, e.target.value)}
                            placeholder="Remarque du professeur..."
                            className="w-full text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aperçu en temps réel des résultats calculés */}
          <div className="bg-gradient-to-r from-blue-900 to-[#0C356A] text-white p-4 rounded-2xl shadow-md grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
            <div>
              <span className="text-[10px] uppercase text-blue-200 font-bold block">
                Total Coefficients
              </span>
              <span className="text-xl font-black">{totalCoeffs}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-blue-200 font-bold block">
                Total Points Pondérés
              </span>
              <span className="text-xl font-black font-mono text-amber-300">
                {totalPoints} / {totalCoeffs * 20}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-blue-200 font-bold block">
                Moyenne Calculée
              </span>
              <span className="text-2xl font-black font-serif text-white">
                {liveAverage.toFixed(2)}{" "}
                <span className="text-xs font-semibold text-blue-200">/ 20</span>
              </span>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-[10px] uppercase text-blue-200 font-bold block">
                Mention Générée
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs">
                {mention}
              </span>
            </div>
          </div>

          {/* Vie Scolaire & Remarques */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Absences Injustifiées (heures)
              </label>
              <input
                type="number"
                min={0}
                value={absencesUnjustified}
                onChange={(e) => setAbsencesUnjustified(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Absences Justifiées (heures)
              </label>
              <input
                type="number"
                min={0}
                value={absencesJustified}
                onChange={(e) => setAbsencesJustified(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Nombre de Retards
              </label>
              <input
                type="number"
                min={0}
                value={latesCount}
                onChange={(e) => setLatesCount(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Appréciation Globale du Professeur Principal
            </label>
            <textarea
              rows={2}
              value={principalComment}
              onChange={(e) => setPrincipalComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0C356A]"
              placeholder="Conseils pédagogiques, points forts, assiduité..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Enregistrer & Générer le Bulletin Officiel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
