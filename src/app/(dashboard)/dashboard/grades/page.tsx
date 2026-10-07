"use client";

import { useState } from "react";
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
} from "lucide-react";
import { MOCK_GRADES, MOCK_STUDENTS } from "@/lib/mock-data";
import { GradeRecord } from "@/types";

export default function GradesPage() {
  const [grades, setGrades] = useState<GradeRecord[]>(MOCK_GRADES);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newGrade, setNewGrade] = useState({
    student_name: MOCK_STUDENTS[0]?.first_name + " " + MOCK_STUDENTS[0]?.last_name,
    class_name: MOCK_STUDENTS[0]?.class_name || "BEP1",
    subject: "Technologie Culinaire",
    evaluation_type: "Pratique Cuisine" as any,
    score: 15,
    coefficient: 3,
    teacher_name: "Chef KOUASSI Mawuli",
    appreciation: "Bonne application des règles d'hygiène et de sécurité.",
  });

  const averageScore = (
    grades.reduce((acc, g) => acc + g.score, 0) / (grades.length || 1)
  ).toFixed(1);

  const bestScore = Math.max(...grades.map((g) => g.score), 0);

  const filteredGrades = grades.filter(
    (g) =>
      g.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddGrade = (e: React.FormEvent) => {
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
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-3xl border-2 border-blue-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0C356A] text-white flex items-center justify-center shadow-md">
            <BookOpen className="w-7 h-7 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0C356A] px-2 py-0.5 rounded-full">
                ESPACE ÉCOLE & FORMATION
              </span>
              <span className="text-xs text-slate-400">&bull; Évaluations & Examens</span>
            </div>
            <h1 className="text-2xl font-black text-[#0C356A] font-serif">
              Relevés de Notes & Contrôle Continu
            </h1>
            <p className="text-xs text-slate-500">
              Évaluations théoriques et pratiques cuisine/service, coefficients et appréciations des professeurs
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>Saisir une Note / Évaluation</span>
        </button>
      </div>

      {/* Statistiques des Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Moyenne Générale</span>
            <Award className="w-4 h-4 text-[#0C356A]" />
          </div>
          <div className="text-2xl font-black text-[#0C356A] mt-2">
            {averageScore} <span className="text-xs font-semibold text-slate-400">/ 20</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">+0.8 pt vs promotion précédente</div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-black">
            <span>Meilleure Note</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">
            {bestScore} <span className="text-xs font-semibold text-blue-700">/ 20</span>
          </div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">Épreuve Pratique Pâtisserie</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
            <span>Notes Enregistrées</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">{grades.length}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Devoirs & Pratiques notées</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Taux de Réussite</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">94%</div>
          <div className="text-[10px] text-slate-500 mt-1">Moyenne &gt; 12 / 20</div>
        </div>
      </div>

      {/* Barre de Recherche */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Recherche par élève, matière, classe..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 font-bold">{filteredGrades.length} note(s)</div>
      </div>

      {/* Tableau des Notes */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Élève & Classe</th>
                <th className="py-3.5 px-4">Matière / Épreuve</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Note / 20</th>
                <th className="py-3.5 px-4">Coeff.</th>
                <th className="py-3.5 px-4">Professeur</th>
                <th className="py-3.5 px-4">Appréciation Pédagogique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrades.map((grd) => (
                <tr key={grd.id} className="hover:bg-slate-50/80">
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
                      className={`text-sm font-black px-2.5 py-1 rounded-lg ${
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
                  <td className="py-3 px-4 text-slate-600 italic">&laquo; {grd.appreciation} &raquo;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Saisie de Note */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-[#0C356A]">Saisir une Nouvelle Note</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddGrade} className="space-y-4 text-xs">
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
                    onChange={(e) => setNewGrade({ ...newGrade, evaluation_type: e.target.value as any })}
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
                    onChange={(e) => setNewGrade({ ...newGrade, coefficient: Number(e.target.value) })}
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
                  placeholder="Conseils, points forts, points à améliorer..."
                  className="form-input-avenida"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
