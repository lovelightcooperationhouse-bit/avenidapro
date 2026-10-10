"use client";

import { CalendarCheck, Clock, AlertTriangle, CheckCircle2, PlusCircle, Search, Filter, User, X, FileCheck } from "lucide-react";
import { AbsenceTicket, LateTicket } from "@/types";
import {
  getStoredStudents,
  getStoredAbsences,
  saveAndSyncAbsence,
  syncAbsencesFromSupabase,
  getStoredLates,
  saveAndSyncLate,
  syncLatesFromSupabase,
  syncStudentsFromSupabase,
  AVENIDA_DATA_UPDATED_EVENT,
} from "@/lib/realtime-store";
import { useState, useEffect } from "react";

export default function AttendancePage() {
  const [allStudents, setAllStudents] = useState(getStoredStudents());
  const [absences, setAbsences] = useState<AbsenceTicket[]>(getStoredAbsences());
  const [lates, setLates] = useState<LateTicket[]>(getStoredLates());
  const [activeTab, setActiveTab] = useState<"absences" | "lates">("absences");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [formType, setFormType] = useState<"absence" | "late">("absence");
  const [formData, setFormData] = useState({
    student_name: "",
    class_name: "",
    date: new Date().toISOString().split("T")[0],
    duration: "2 heures",
    reason: "",
    is_authorized: true,
  });

  const refreshAll = () => {
    setAllStudents(getStoredStudents());
    setAbsences(getStoredAbsences());
    setLates(getStoredLates());
  };

  useEffect(() => {
    refreshAll();
    Promise.all([
      syncStudentsFromSupabase(),
      syncAbsencesFromSupabase(),
      syncLatesFromSupabase(),
    ]).then(() => refreshAll());

    window.addEventListener(AVENIDA_DATA_UPDATED_EVENT, refreshAll);
    window.addEventListener("storage", refreshAll);
    return () => {
      window.removeEventListener(AVENIDA_DATA_UPDATED_EVENT, refreshAll);
      window.removeEventListener("storage", refreshAll);
    };
  }, []);

  const totalAbsences = absences.length;
  const justifiedAbsences = absences.filter((a) => a.parent_justified).length;
  const totalLates = lates.length;

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    if (!studentId) {
      setFormData((prev) => ({ ...prev, student_name: "", class_name: "" }));
      return;
    }
    const found = allStudents.find((s) => s.id === studentId || s.registration_number === studentId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        student_name: `${found.last_name} ${found.first_name}`,
        class_name: found.class_name || `${found.program_code} - Hôtellerie`,
      }));
    }
  };

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_name.trim()) return;

    if (formType === "absence") {
      const newAbs: AbsenceTicket = {
        id: `abs-${Date.now()}`,
        ticket_number: absences.length + 1,
        student_name: formData.student_name.trim(),
        class_name: formData.class_name || "Formation Hôtelière",
        start_date: `${formData.date} à 08:00`,
        end_date: `${formData.date} à 12:00`,
        reason: formData.reason || "Motif familial ou maladie",
        is_authorized: formData.is_authorized,
        parent_justified: formData.is_authorized,
        visa_vie_scolaire: true,
      };
      await saveAndSyncAbsence(newAbs);
    } else {
      const newLate: LateTicket = {
        id: `lat-${Date.now()}`,
        ticket_number: lates.length + 1,
        student_name: formData.student_name.trim(),
        class_name: formData.class_name || "Formation Hôtelière",
        duration_minutes: 20,
        reason: formData.reason || "Embouteillages Lomé",
        destination: "classe",
        visa_vie_scolaire: true,
        date: `${formData.date} 07:50`,
      };
      await saveAndSyncLate(newLate);
    }

    refreshAll();
    setIsModalOpen(false);
    setSelectedStudentId("");
    setFormData({
      student_name: "",
      class_name: "",
      date: new Date().toISOString().split("T")[0],
      duration: "2 heures",
      reason: "",
      is_authorized: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-3xl border-2 border-blue-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0C356A] text-white flex items-center justify-center shadow-md">
            <CalendarCheck className="w-7 h-7 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0C356A] px-2 py-0.5 rounded-full">
                ESPACE ÉCOLE & FORMATION
              </span>
              <span className="text-xs text-slate-400">&bull; Vie Scolaire</span>
            </div>
            <h1 className="text-2xl font-black text-[#0C356A] font-serif">
              Contrôle des Présences, Absences & Retards
            </h1>
            <p className="text-xs text-slate-500">
              Registres d&apos;émargement journaliers, justificatifs parents et discipline des élèves
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>Pointer Absence / Retard</span>
        </button>
      </div>

      {/* Statistiques Vie Scolaire */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Taux de Présence</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">95.2%</div>
          <div className="text-[10px] text-slate-500 mt-1">Sur l&apos;ensemble des promotions</div>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 text-xs font-black">
            <span>Absences Enregistrées</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-950 mt-2">{totalAbsences}</div>
          <div className="text-[10px] text-rose-700 font-semibold mt-1">
            {justifiedAbsences} justifiée(s) par les parents
          </div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-black">
            <span>Retards Émargés</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">{totalLates}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">Moyenne 18 min / retard</div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-black">
            <span>Visas Vie Scolaire</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">100%</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">Régularisés avec billet d&apos;entrée</div>
        </div>
      </div>

      {/* Onglets et Recherche */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("absences")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === "absences"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Billets d&apos;Absence ({absences.length})
          </button>
          <button
            onClick={() => setActiveTab("lates")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === "lates"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Billets de Retard ({lates.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher élève, classe..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>
      </div>

      {/* Tableaux des Absences / Retards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {activeTab === "absences" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Billet N°</th>
                  <th className="py-3.5 px-4">Élève & Classe</th>
                  <th className="py-3.5 px-4">Période d&apos;Absence</th>
                  <th className="py-3.5 px-4">Motif Déclaré</th>
                  <th className="py-3.5 px-4">Justification Parent</th>
                  <th className="py-3.5 px-4">Statut Visa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {absences.map((abs) => (
                  <tr key={abs.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      #ABS-{String(abs.ticket_number).padStart(3, "0")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{abs.student_name}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{abs.class_name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>Du : {abs.start_date}</div>
                      <div className="text-[10px] text-slate-500">Au : {abs.end_date}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 italic">&laquo; {abs.reason} &raquo;</td>
                    <td className="py-3 px-4">
                      {abs.parent_justified ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200">
                          Justifiée
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold border border-rose-200">
                          Non Justifiée
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[10px] font-bold border border-blue-200">
                        Visa Accordé
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Billet N°</th>
                  <th className="py-3.5 px-4">Élève & Classe</th>
                  <th className="py-3.5 px-4">Date & Heure d&apos;Arrivée</th>
                  <th className="py-3.5 px-4">Durée du Retard</th>
                  <th className="py-3.5 px-4">Motif Explicatif</th>
                  <th className="py-3.5 px-4">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lates.map((lat) => (
                  <tr key={lat.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      #RET-{String(lat.ticket_number).padStart(3, "0")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{lat.student_name}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{lat.class_name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{lat.date}</td>
                    <td className="py-3 px-4 font-bold text-amber-700">{lat.duration_minutes} min</td>
                    <td className="py-3 px-4 text-slate-700 italic">&laquo; {lat.reason} &raquo;</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-[10px] font-bold border">
                        Admis en {lat.destination}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Billet d'Absence ou de Retard */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-[#0C356A]">Émettre un Billet de Vie Scolaire</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddTicket} className="space-y-4 text-xs">
              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormType("absence")}
                  className={`flex-1 py-1.5 rounded-lg font-bold ${
                    formType === "absence" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                  }`}
                >
                  Absence
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("late")}
                  className={`flex-1 py-1.5 rounded-lg font-bold ${
                    formType === "late" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                  }`}
                >
                  Retard
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Sélectionner un Élève (Base Officielle Avenida) *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="form-input-avenida mb-2 font-semibold bg-blue-50/50 border-blue-200"
                >
                  <option value="">-- Choisir un élève inscrit ({allStudents.length} élèves) --</option>
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.last_name} {s.first_name} — {s.registration_number} ({s.class_name || s.program_code})
                    </option>
                  ))}
                </select>

                <label className="font-bold text-slate-700 block mb-1">Nom & Prénom de l&apos;Élève</label>
                <input
                  type="text"
                  required
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="Nom et prénom..."
                  className="form-input-avenida"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Classe</label>
                  <input
                    type="text"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motif de l&apos;absence / du retard</label>
                <textarea
                  rows={2}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explication ou motif fourni..."
                  className="form-input-avenida"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="justified"
                  checked={formData.is_authorized}
                  onChange={(e) => setFormData({ ...formData, is_authorized: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0C356A]"
                />
                <label htmlFor="justified" className="font-bold text-slate-700">
                  Justification parentale ou médicale reçue
                </label>
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
                  Enregistrer le Billet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
