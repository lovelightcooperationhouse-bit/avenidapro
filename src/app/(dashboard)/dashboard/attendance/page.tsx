"use client";

import {
  CalendarCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Search,
  Filter,
  User,
  X,
  FileCheck,
  ShieldCheck,
  FileText,
} from "lucide-react";
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
  recordStudentAttendanceIncident,
  AVENIDA_DATA_UPDATED_EVENT,
} from "@/lib/realtime-store";
import { useState, useEffect } from "react";

export default function AttendancePage() {
  const [allStudents, setAllStudents] = useState(getStoredStudents());
  const [absences, setAbsences] = useState<AbsenceTicket[]>(getStoredAbsences());
  const [lates, setLates] = useState<LateTicket[]>(getStoredLates());
  const [activeTab, setActiveTab] = useState<"absences" | "lates" | "permissions">("absences");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [formType, setFormType] = useState<"absence" | "late" | "permission">("absence");
  const [formData, setFormData] = useState({
    student_id: "",
    student_matricule: "",
    student_name: "",
    class_name: "",
    date: new Date().toISOString().split("T")[0],
    time: "08:00",
    duration_minutes: 20,
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

  const regularAbsences = absences.filter((a) => a.ticket_type !== "permission");
  const permissionsList = absences.filter((a) => a.ticket_type === "permission");

  const totalAbsences = regularAbsences.length;
  const justifiedAbsences = regularAbsences.filter((a) => a.parent_justified).length;
  const totalLates = lates.length;
  const totalPermissions = permissionsList.length;

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    if (!studentId) {
      setFormData((prev) => ({
        ...prev,
        student_id: "",
        student_matricule: "",
        student_name: "",
        class_name: "",
      }));
      return;
    }
    const found = allStudents.find((s) => s.id === studentId || s.registration_number === studentId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        student_id: found.id,
        student_matricule: found.registration_number,
        student_name: `${found.last_name} ${found.first_name}`,
        class_name: found.class_name || `${found.program_code} - Hôtellerie`,
      }));
    }
  };

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_name.trim()) return;

    await recordStudentAttendanceIncident({
      student_id: formData.student_id || undefined,
      student_matricule: formData.student_matricule || "AVN-ETU",
      student_name: formData.student_name.trim(),
      class_name: formData.class_name || "Formation Hôtelière",
      type: formType === "late" ? "retard" : formType === "permission" ? "permission" : "absence",
      date: formData.date,
      time: formData.time,
      duration_minutes: formData.duration_minutes,
      reason: formData.reason || (formType === "permission" ? "Dispense exceptionnelle accordée" : "Motif déclaré"),
      is_justified: formData.is_authorized,
      visa_vie_scolaire: true,
    });

    refreshAll();
    setIsModalOpen(false);
    setSelectedStudentId("");
    setFormData({
      student_id: "",
      student_matricule: "",
      student_name: "",
      class_name: "",
      date: new Date().toISOString().split("T")[0],
      time: "08:00",
      duration_minutes: 20,
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
          <div className="w-14 h-14 rounded-2xl bg-[#0C356A] text-white flex items-center justify-center shadow-md shrink-0">
            <CalendarCheck className="w-7 h-7 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0C356A] px-2 py-0.5 rounded-full">
                ESPACE ÉCOLE &amp; FORMATION
              </span>
              <span className="text-xs text-slate-400">&bull; Vie Scolaire &amp; Assiduité</span>
            </div>
            <h1 className="text-2xl font-black text-[#0C356A] font-serif">
              Gestion de la Vie Scolaire • Absences, Retards &amp; Permissions
            </h1>
            <p className="text-xs text-slate-500">
              Attribution directe à chaque élève, suivi individuel tout au long du cursus et mise à jour en temps réel
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormType("absence");
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>+ Émettre Billet Vie Scolaire</span>
        </button>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Absences Enregistrées</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalAbsences}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            Dont {justifiedAbsences} justifiée{justifiedAbsences > 1 ? "s" : ""}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Retards Cumulés</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalLates}</div>
          <div className="text-[10px] text-slate-400 mt-1">Régularisés à la Vie Scolaire</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Permissions Accordées</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-2">{totalPermissions}</div>
          <div className="text-[10px] text-slate-400 mt-1">Autorisations préalables</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200 shadow-xs">
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
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl flex-wrap">
          <button
            onClick={() => setActiveTab("absences")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === "absences"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Billets d&apos;Absence ({regularAbsences.length})
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
          <button
            onClick={() => setActiveTab("permissions")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === "permissions"
                ? "bg-white text-blue-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Permissions &amp; Dispensations ({permissionsList.length})
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

      {/* Tableaux des Absences / Retards / Permissions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {activeTab === "absences" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Billet N°</th>
                  <th className="py-3.5 px-4">Élève &amp; Classe</th>
                  <th className="py-3.5 px-4">Période d&apos;Absence</th>
                  <th className="py-3.5 px-4">Motif Déclaré</th>
                  <th className="py-3.5 px-4">Justification Parent</th>
                  <th className="py-3.5 px-4">Statut Visa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regularAbsences
                  .filter((a) =>
                    searchTerm === ""
                      ? true
                      : a.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.class_name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((abs) => (
                    <tr key={abs.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        #ABS-{String(abs.ticket_number).padStart(3, "0")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{abs.student_name}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{abs.class_name}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        Du {abs.start_date} <br />
                        Au {abs.end_date}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">{abs.reason}</td>
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
        )}

        {activeTab === "lates" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Billet N°</th>
                  <th className="py-3.5 px-4">Élève &amp; Classe</th>
                  <th className="py-3.5 px-4">Date &amp; Heure d&apos;Arrivée</th>
                  <th className="py-3.5 px-4">Durée du Retard</th>
                  <th className="py-3.5 px-4">Motif Explicatif</th>
                  <th className="py-3.5 px-4">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lates
                  .filter((lat) =>
                    searchTerm === ""
                      ? true
                      : lat.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lat.class_name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((lat) => (
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

        {activeTab === "permissions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Billet N°</th>
                  <th className="py-3.5 px-4">Élève &amp; Classe</th>
                  <th className="py-3.5 px-4">Date de la Permission</th>
                  <th className="py-3.5 px-4">Motif / Dispensation</th>
                  <th className="py-3.5 px-4">Autorisation Direction</th>
                  <th className="py-3.5 px-4">Visa Vie Scolaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissionsList
                  .filter((p) =>
                    searchTerm === ""
                      ? true
                      : p.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.class_name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((perm) => (
                    <tr key={perm.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">
                        #PERM-{String(perm.ticket_number).padStart(3, "0")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{perm.student_name}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{perm.class_name}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{perm.start_date}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{perm.reason}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200">
                          Autorisé
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded text-[10px] font-bold border border-blue-200">
                          Visa Délivré
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Billet d'Absence, Retard ou Permission */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-auto">
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
                <button
                  type="button"
                  onClick={() => setFormType("permission")}
                  className={`flex-1 py-1.5 rounded-lg font-bold ${
                    formType === "permission" ? "bg-white text-blue-900 shadow-sm" : "text-slate-600"
                  }`}
                >
                  Permission
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Sélectionner un Élève (Base Officielle Avenida) *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 mb-2 font-semibold bg-blue-50/50"
                  required
                >
                  <option value="">-- Choisir un élève inscrit ({allStudents.length} élèves) --</option>
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.last_name} {s.first_name} — {s.registration_number} ({s.class_name || s.program_code})
                    </option>
                  ))}
                </select>

                <label className="font-bold text-slate-700 block mb-1">Nom &amp; Prénom de l&apos;Élève</label>
                <input
                  type="text"
                  required
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="Nom et prénom..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Classe</label>
                  <input
                    type="text"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              {formType === "late" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Durée du Retard (minutes)</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Motif {formType === "permission" ? "de la permission / dispense" : formType === "late" ? "du retard" : "de l'absence"} *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explication ou motif fourni..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
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
                  {formType === "permission"
                    ? "Permission officiellement accordée par la Direction"
                    : "Justification parentale ou certificat médical reçu"}
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
                  className="px-5 py-2 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
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
