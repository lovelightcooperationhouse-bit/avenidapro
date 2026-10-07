"use client";

import { useState } from "react";
import {
  GraduationCap,
  Award,
  BookOpen,
  PlusCircle,
  Search,
  CheckCircle2,
  X,
  Clock,
  Sparkles,
  Download,
} from "lucide-react";
import { MOCK_PROGRAMS } from "@/lib/mock-data";
import { Program, DiplomeCode } from "@/types";
import { formatFCFA } from "@/lib/utils";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>(MOCK_PROGRAMS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newProg, setNewProg] = useState({
    code: "CAP" as DiplomeCode,
    name: "",
    duration_years: 2,
    entry_level: "BEPC ou niveau 3ème",
    annual_tuition: 280000,
    registration_fee: 15000,
    supplies_fee: 55000,
    specialties: "",
  });

  const filteredPrograms = programs.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTuitionAverage = Math.round(
    programs.reduce((acc, p) => acc + p.annual_tuition, 0) / (programs.length || 1)
  );

  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProg.name) return;

    const added: Program = {
      id: `prog-${Date.now()}`,
      code: newProg.code,
      name: newProg.name,
      duration_years: Number(newProg.duration_years),
      entry_level: newProg.entry_level,
      annual_tuition: Number(newProg.annual_tuition),
      registration_fee: Number(newProg.registration_fee),
      supplies_fee: Number(newProg.supplies_fee),
      specialties: newProg.specialties
        ? newProg.specialties.split(",").map((s) => s.trim())
        : ["Cuisine", "Service"],
    };

    setPrograms([...programs, added]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
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
              <span className="text-xs text-slate-400">&bull; Diplômes & Cursus</span>
            </div>
            <h1 className="text-2xl font-black text-[#0C356A] font-serif">
              Diplômes & Filières de Formation Avenida
            </h1>
            <p className="text-xs text-slate-500">
              Formations certifiantes d&apos;État : CFA, CAP, BEP, BT, BTS et grilles tarifaires
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>Ajouter un Diplôme / Filière</span>
        </button>
      </div>

      {/* Statistiques Sectorielles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Diplômes Agréés</span>
            <Award className="w-4 h-4 text-[#0C356A]" />
          </div>
          <div className="text-2xl font-black text-[#0C356A] mt-2">{programs.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Cursus reconnus par l&apos;État</div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-black">
            <span>Scolarité Moyenne</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-900 mt-2">
            {formatFCFA(totalTuitionAverage)}
          </div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">Par année académique</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
            <span>Taux de Réussite</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">96.8%</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Examens nationaux Togo</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Durée Moyenne</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">2.2 ans</div>
          <div className="text-[10px] text-slate-500 mt-1">Cycles 1 à 3 ans</div>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par diplôme (ex: CAP, Cuisine)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20"
          />
        </div>
        <div className="text-xs text-slate-500 font-bold">{filteredPrograms.length} programme(s)</div>
      </div>

      {/* Tableau des Diplômes */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Cycle & Code</th>
                <th className="py-3.5 px-4">Intitulé Officiel</th>
                <th className="py-3.5 px-4">Durée</th>
                <th className="py-3.5 px-4">Niveau d&apos;Admission</th>
                <th className="py-3.5 px-4">Scolarité Annuelle</th>
                <th className="py-3.5 px-4">Spécialités Disponibles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrograms.map((prog) => (
                <tr key={prog.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-[#0C356A] text-white font-black rounded-lg text-xs shadow-2xs">
                      {prog.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">{prog.name}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-700">{prog.duration_years} an(s)</td>
                  <td className="py-3.5 px-4 text-slate-600">{prog.entry_level}</td>
                  <td className="py-3.5 px-4 font-mono font-black text-[#0C356A]">
                    {formatFCFA(prog.annual_tuition)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {prog.specialties.map((spec, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajout Diplôme */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-[#0C356A]">Ajouter une Nouvelle Formation</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddProgram} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Code Diplôme</label>
                <select
                  value={newProg.code}
                  onChange={(e) => setNewProg({ ...newProg, code: e.target.value as DiplomeCode })}
                  className="form-input-avenida"
                >
                  <option value="CFA">CFA</option>
                  <option value="CAP">CAP</option>
                  <option value="BEP">BEP</option>
                  <option value="BT">BT</option>
                  <option value="BTS">BTS</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Intitulé Officiel</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Brevet de Technicien Hôtellerie"
                  value={newProg.name}
                  onChange={(e) => setNewProg({ ...newProg, name: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Durée (Années)</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={newProg.duration_years}
                    onChange={(e) => setNewProg({ ...newProg, duration_years: Number(e.target.value) })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Niveau d&apos;entrée</label>
                  <input
                    type="text"
                    value={newProg.entry_level}
                    onChange={(e) => setNewProg({ ...newProg, entry_level: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Scolarité Annuelle (F CFA)</label>
                <input
                  type="number"
                  step={5000}
                  value={newProg.annual_tuition}
                  onChange={(e) => setNewProg({ ...newProg, annual_tuition: Number(e.target.value) })}
                  className="form-input-avenida"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Spécialités (séparées par une virgule)
                </label>
                <input
                  type="text"
                  placeholder="Cuisine, Pâtisserie, Service en Salle"
                  value={newProg.specialties}
                  onChange={(e) => setNewProg({ ...newProg, specialties: e.target.value })}
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
                  Enregistrer la Filière
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
