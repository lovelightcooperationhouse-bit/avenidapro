"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Briefcase,
  GraduationCap,
  BedDouble,
  Users,
  Search,
  Filter,
  UserPlus,
  Calendar,
  FileText,
  Phone,
  Mail,
  MapPin,
  Award,
  Clock,
  CreditCard,
  CheckCircle2,
  X,
  Eye,
  Building,
  Sparkles,
  Download,
  FileCheck,
} from "lucide-react";
import { MOCK_EMPLOYEES } from "@/lib/mock-data";
import { Employee, EmployeeSector } from "@/types";
import { formatFCFA } from "@/lib/utils";
import { NEIGHBORHOODS } from "@/lib/academic-data";
import {
  PhotoUploadZone,
  DocumentUploadManager,
  DocumentViewerModal,
  type UploadedFileItem,
  type RequiredDocDef,
} from "@/components/shared/DocumentUploadManager";
import {
  getStoredEmployees,
  saveAndSyncEmployee,
  AVENIDA_DATA_UPDATED_EVENT,
} from "@/lib/realtime-store";

const REQUIRED_EMPLOYEE_DOCS: RequiredDocDef[] = [
  {
    key: "doc_cv",
    label: "Curriculum Vitae (CV) Récent & Détaillé",
    description: "Parcours professionnel complet, expériences antérieures et références",
    required: true,
  },
  {
    key: "doc_diploma",
    label: "Copie Certifiée du Diplôme le Plus Élevé",
    description: "Diplôme d'État ou certification professionnelle hôtelière / pédagogique",
    required: true,
  },
  {
    key: "doc_id_card",
    label: "Pièce d'Identité / CNI ou Passeport",
    description: "Copie recto-verso de la carte d'identité ou passeport togolais valide",
    required: true,
  },
  {
    key: "doc_contract",
    label: "Contrat de Travail Avenida Paraphé & Signé",
    description: "Contrat de travail portant visa de la direction générale et émargement",
    required: false,
  },
  {
    key: "doc_medical",
    label: "Certificat Médical d'Aptitude au Travail",
    description: "Certificat médical d'aptitude aux métiers de l'hôtellerie ou de l'enseignement",
    required: false,
  },
  {
    key: "doc_police_record",
    label: "Extrait de Casier Judiciaire (Bulletin N°3)",
    description: "Bulletin n°3 délivré par les autorités judiciaires togolaises",
    required: false,
  },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [activeTab, setActiveTab] = useState<"all" | "ecole" | "hotel">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [contractFilter, setContractFilter] = useState("ALL");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDocForViewer, setSelectedDocForViewer] = useState<UploadedFileItem | null>(null);

  useEffect(() => {
    setEmployees(getStoredEmployees());
    const handleUpdate = () => setEmployees(getStoredEmployees());
    window.addEventListener(AVENIDA_DATA_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(AVENIDA_DATA_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const [newEmp, setNewEmp] = useState({
    first_name: "",
    last_name: "",
    gender: "M" as "M" | "F",
    birth_date: "",
    nationality: "Togolaise",
    phone: "",
    email: "",
    neighborhood: "Tokoin",
    sector: "ecole" as EmployeeSector,
    role_title: "",
    department: "",
    specialty: "",
    contract_type: "CDI" as "CDI" | "CDD" | "Vacation" | "Stage Professionnel",
    hire_date: new Date().toISOString().split("T")[0],
    contract_duration: "Indéterminée (CDI)",
    contract_end_date: "",
    base_salary: 250000,
    cnss_number: "",
    highest_degree: "",
    experience_years: 5,
    cv_summary: "",
    photo_url: "",
    uploaded_documents: {} as Record<string, UploadedFileItem>,
  });

  // Statistiques calculées dynamiquement
  const stats = useMemo(() => {
    const total = employees.length;
    const ecoleList = employees.filter((e) => e.sector === "ecole");
    const hotelList = employees.filter((e) => e.sector === "hotel");
    const totalPayroll = employees.reduce((acc, curr) => acc + (curr.base_salary || 0), 0);
    const cdiCount = employees.filter((e) => e.contract_type === "CDI").length;

    return {
      total,
      ecoleCount: ecoleList.length,
      hotelCount: hotelList.length,
      totalPayroll,
      cdiCount,
    };
  }, [employees]);

  // Filtrage combiné
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchTab = activeTab === "all" || emp.sector === activeTab;
      const matchSearch =
        emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
      const matchContract = contractFilter === "ALL" || emp.contract_type === contractFilter;

      return matchTab && matchSearch && matchContract;
    });
  }, [employees, activeTab, searchTerm, contractFilter]);

  // Soumission du formulaire
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.first_name || !newEmp.last_name || !newEmp.role_title) {
      alert("Veuillez renseigner au moins le prénom, le nom et le rôle du collaborateur.");
      return;
    }

    const prefix = newEmp.sector === "ecole" ? "AVN-ENS" : "AVN-HOT";
    const nextNum = String(employees.length + 1).padStart(3, "0");
    const matricule = `${prefix}-${nextNum}`;

    const created: Employee = {
      id: `emp-${Date.now()}`,
      matricule,
      first_name: newEmp.first_name,
      last_name: newEmp.last_name.toUpperCase(),
      gender: newEmp.gender,
      birth_date: newEmp.birth_date || "1990-01-01",
      nationality: newEmp.nationality,
      phone: newEmp.phone || "+228 90 00 00 00",
      email: newEmp.email || `${newEmp.first_name.toLowerCase()}.${newEmp.last_name.toLowerCase()}@avenida-lome.tg`,
      neighborhood: newEmp.neighborhood,
      photo_url: newEmp.photo_url || undefined,
      uploaded_documents: newEmp.uploaded_documents,
      sector: newEmp.sector,
      role_title: newEmp.role_title,
      department: newEmp.department || (newEmp.sector === "ecole" ? "Pédagogie" : "Hébergement"),
      specialty: newEmp.specialty || undefined,
      contract_type: newEmp.contract_type,
      hire_date: newEmp.hire_date,
      contract_duration: newEmp.contract_duration,
      contract_end_date: newEmp.contract_end_date || undefined,
      base_salary: Number(newEmp.base_salary) || 200000,
      cnss_number: newEmp.cnss_number || `TG-CNSS-${Math.floor(100000 + Math.random() * 900000)}`,
      highest_degree: newEmp.highest_degree || "Diplôme d'État",
      experience_years: Number(newEmp.experience_years) || 3,
      cv_summary: newEmp.cv_summary || "Profil recruté pour renforcer l'équipe Avenida.",
      status: "actif",
    };

    setEmployees([created, ...employees]);
    saveAndSyncEmployee(created);
    setIsCreateModalOpen(false);
    setSelectedEmployee(created); // Ouvre directement la fiche du nouvel employé
  };

  return (
    <div className="space-y-6">
      {/* 1. EN-TÊTE DE SECTION AVEC STATISTIQUES À CHAQUE NIVEAU */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0C356A] to-[#082347] text-white flex items-center justify-center shadow-md">
            <Briefcase className="w-7 h-7 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full border border-slate-300">
                DIRECTION RH & GESTION DU PERSONNEL
              </span>
              <span className="text-xs text-slate-400">&bull; Hôtel École Avenida Lomé</span>
            </div>
            <h1 className="text-2xl font-black text-[#0C356A] font-serif">
              Corps Professoral & Personnel Opérationnel Hôtel
            </h1>
            <p className="text-xs text-slate-500">
              Profils individuels complets, rôles, CV, dates d&apos;entrée, contrats et paie en F CFA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-bold rounded-xl shadow-md transition-all duration-200 flex items-center gap-2 active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>Nouveau Recrutement / Collaborateur</span>
          </button>
        </div>
      </div>

      {/* 2. TABLEAU DE RÉSULTAT STATISTIQUE (KPIS SECTORIELS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Collaborateurs</span>
            <Users className="w-4 h-4 text-[#0C356A]" />
          </div>
          <div className="text-2xl font-black text-[#0C356A] mt-2">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-1">Actifs à l&apos;établissement</div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-black">
            <span>Professeurs École</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-2">{stats.ecoleCount}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">Enseignants & Chefs Formateurs</div>
        </div>

        <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 shadow-2xs">
          <div className="flex items-center justify-between text-red-800 text-xs font-black">
            <span>Personnel Hôtel</span>
            <BedDouble className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-900 mt-2">{stats.hotelCount}</div>
          <div className="text-[10px] text-red-700 font-semibold mt-1">Hébergement, Bar, Étages & Cuisine</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
            <span>Masse Salariale</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-950 mt-2.5">
            {formatFCFA(stats.totalPayroll)}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Salaires bruts mensuels</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Stabilité Contrats</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {stats.cdiCount} <span className="text-xs font-bold text-slate-500">CDI</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {Math.round((stats.cdiCount / (stats.total || 1)) * 100)}% de pérennité
          </div>
        </div>
      </div>

      {/* 3. SÉPARATEUR SECTORIEL MAJEUR & ONGLETS */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tous les Effectifs ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab("ecole")}
            className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${
              activeTab === "ecole"
                ? "bg-[#0C356A] text-white shadow-sm"
                : "text-blue-900 hover:bg-blue-50"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Professeurs École ({stats.ecoleCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("hotel")}
            className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${
              activeTab === "hotel"
                ? "bg-[#DC2626] text-white shadow-sm"
                : "text-red-900 hover:bg-red-50"
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span>Personnel Hôtel ({stats.hotelCount})</span>
          </button>
        </div>

        {/* Barre de recherche et filtre contrat */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom, matricule, poste, Lomé..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20"
            />
          </div>

          <select
            value={contractFilter}
            onChange={(e) => setContractFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
          >
            <option value="ALL">Tous contrats</option>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
            <option value="Vacation">Vacation</option>
          </select>
        </div>
      </div>

      {/* 4. TABLEAU DE RÉSULTATS DÉTAILLÉ DU PERSONNEL */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Collaborateur & Matricule</th>
                <th className="py-3.5 px-4">Secteur</th>
                <th className="py-3.5 px-4">Poste & Spécialité</th>
                <th className="py-3.5 px-4">Contrat & Durée</th>
                <th className="py-3.5 px-4">Recruté le</th>
                <th className="py-3.5 px-4">Salaire Base</th>
                <th className="py-3.5 px-4 text-right">Profil & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => {
                const isEcole = emp.sector === "ecole";

                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs ${
                            isEcole ? "bg-[#0C356A]" : "bg-[#DC2626]"
                          }`}
                        >
                          {emp.first_name[0]}
                          {emp.last_name[0]}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 group-hover:text-[#0C356A] transition-colors">
                            {emp.last_name} {emp.first_name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {emp.matricule} &bull; {emp.neighborhood}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {isEcole ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-[#0C356A] border border-blue-200">
                          <GraduationCap className="w-3 h-3 text-[#0C356A]" />
                          ÉCOLE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-[#DC2626] border border-red-200">
                          <BedDouble className="w-3 h-3 text-[#DC2626]" />
                          HÔTEL
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{emp.role_title}</div>
                      <div className="text-[10px] text-slate-500">{emp.specialty || emp.department}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                        {emp.contract_type}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{emp.contract_duration}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(emp.hire_date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {formatFCFA(emp.base_salary)}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-[#0C356A] hover:text-white text-slate-700 font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Fiche CV</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    Aucun collaborateur ne correspond à ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL PROFIL INDIVIDUEL COMPLET & CV (« DOSSIER DU COLLABORATEUR ») */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header du Profil */}
            <div
              className={`p-6 text-white rounded-t-3xl relative ${
                selectedEmployee.sector === "ecole"
                  ? "bg-gradient-to-r from-[#0C356A] to-[#164E87]"
                  : "bg-gradient-to-r from-[#DC2626] to-[#991B1B]"
              }`}
            >
              <button
                onClick={() => setSelectedEmployee(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="flex items-center gap-4">
                {selectedEmployee.photo_url ? (
                  <div className="w-16 h-20 rounded-2xl overflow-hidden border-2 border-white/60 shadow-md shrink-0 bg-white">
                    <img
                      src={selectedEmployee.photo_url}
                      alt={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                    {selectedEmployee.first_name[0]}
                    {selectedEmployee.last_name[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30">
                      {selectedEmployee.sector === "ecole"
                        ? "PROFESSEUR / FORMATEUR ÉCOLE"
                        : "PERSONNEL OPÉRATIONNEL HÔTEL"}
                    </span>
                    <span className="text-xs font-mono font-bold text-white/90">
                      {selectedEmployee.matricule}
                    </span>
                  </div>
                  <h2 className="text-xl font-black mt-1">
                    {selectedEmployee.last_name} {selectedEmployee.first_name}
                  </h2>
                  <p className="text-xs text-white/80">{selectedEmployee.role_title}</p>
                </div>
              </div>
            </div>

            {/* Contenu Détaillé du Profil */}
            <div className="p-6 space-y-6 text-xs text-slate-700">
              {/* Bloc 1 : Identité & Coordonnées */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] border-b pb-1.5 mb-3 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  Identité & Coordonnées à Lomé
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Nationalité</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.nationality}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Date de Naissance</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.birth_date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Quartier (Lomé)</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.neighborhood}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Téléphone WhatsApp</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      {selectedEmployee.phone}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block font-bold">Email Institutionnel</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#0C356A]" />
                      {selectedEmployee.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloc 2 : Poste & Affectation */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] border-b pb-1.5 mb-3 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Poste & Responsabilités
                </h3>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Département</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Spécialité / Discipline</span>
                    <span className="font-bold text-slate-800">
                      {selectedEmployee.specialty || "Polyvalence Hôtelière"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloc 3 : CV & Qualifications Professionnelles */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] border-b pb-1.5 mb-3 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  Qualifications Académiques & Résumé du CV
                </h3>
                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-800 font-bold block">Diplôme le plus élevé</span>
                      <span className="text-xs font-black text-amber-950">
                        {selectedEmployee.highest_degree}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-amber-800 font-bold block">Expérience</span>
                      <span className="text-xs font-black text-amber-950">
                        {selectedEmployee.experience_years} ans
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-amber-200/60 pt-2">
                    <span className="text-[10px] text-amber-900 font-bold block mb-1">Résumé du Parcours :</span>
                    <p className="text-xs leading-relaxed text-slate-700 italic">
                      &laquo; {selectedEmployee.cv_summary} &raquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloc 4 : Données Contractuelles & Date de Réception */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] border-b pb-1.5 mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Contrat, Recrutement & Conditions Salariales
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Date de Recrutement</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.hire_date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Type de Contrat</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.contract_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Durée de Contrat</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.contract_duration}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Salaire Mensuel</span>
                    <span className="font-mono font-black text-emerald-700">
                      {formatFCFA(selectedEmployee.base_salary)}
                    </span>
                  </div>
                  {selectedEmployee.cnss_number && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block font-bold">N° Immatriculation CNSS</span>
                      <span className="font-mono font-bold text-slate-700">
                        {selectedEmployee.cnss_number}
                      </span>
                    </div>
                  )}
                  {selectedEmployee.contract_end_date && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block font-bold">Échéance de Fin de Contrat</span>
                      <span className="font-bold text-rose-700">
                        {selectedEmployee.contract_end_date}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bloc 5 : Documents Numérisés & Pièces Justificatives */}
              <div>
                <div className="flex items-center justify-between border-b pb-1.5 mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Documents Numérisés & Dossier Collaborateur
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0C356A] border border-blue-200">
                    {selectedEmployee.uploaded_documents
                      ? Object.keys(selectedEmployee.uploaded_documents).length
                      : 0}{" "}
                    pièce(s)
                  </span>
                </div>

                {selectedEmployee.uploaded_documents &&
                Object.keys(selectedEmployee.uploaded_documents).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(selectedEmployee.uploaded_documents).map(([k, doc]) => (
                      <div
                        key={k}
                        className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-emerald-700" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 truncate" title={doc.label || doc.name}>
                              {doc.label || doc.name}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-mono">
                              Débit : {doc.formattedSize || "Fichier conforme"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedDocForViewer(doc as any)}
                            className="p-1.5 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                            title="Aperçu du document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
                    <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700">Aucun document numérique rattaché</p>
                    <p className="text-[11px] text-slate-500">
                      Exigences Avenida : Formats PDF, JPG, PNG, WEBP, DOCX • Débit max 5 Mo
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center rounded-b-3xl">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Imprimer Fiche Individuelle</span>
              </button>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-5 py-2 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl text-xs transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL FORMULAIRE DE RECRUTEMENT / NOUVEAU COLLABORATEUR */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 bg-[#0C356A] text-white rounded-t-3xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  FORMULAIRE DE RECRUTEMENT RH
                </span>
                <h2 className="text-xl font-black mt-1">Nouveau Collaborateur Avenida Lomé</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-6 text-xs">
              {/* Choix du Secteur */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2">
                  1. Secteur d&apos;Affectation *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setNewEmp({ ...newEmp, sector: "ecole" })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      newEmp.sector === "ecole"
                        ? "border-[#0C356A] bg-blue-50/80 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#0C356A] text-white flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">Corps Professoral École</div>
                      <div className="text-[10px] text-slate-500">Enseignant, Chef formateur, Vacataire</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setNewEmp({ ...newEmp, sector: "hotel" })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      newEmp.sector === "hotel"
                        ? "border-[#DC2626] bg-red-50/80 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#DC2626] text-white flex items-center justify-center">
                      <BedDouble className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">Personnel Opérationnel Hôtel</div>
                      <div className="text-[10px] text-slate-500">Réception, Hébergement, Restauration, Technique</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identité */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2">
                  2. Identité & État Civil
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Nom de famille *</label>
                    <input
                      type="text"
                      required
                      value={newEmp.last_name}
                      onChange={(e) => setNewEmp({ ...newEmp, last_name: e.target.value })}
                      placeholder="ex: KOUASSI"
                      className="form-input-avenida"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Prénom(s) *</label>
                    <input
                      type="text"
                      required
                      value={newEmp.first_name}
                      onChange={(e) => setNewEmp({ ...newEmp, first_name: e.target.value })}
                      placeholder="ex: Mawuli"
                      className="form-input-avenida"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Genre</label>
                    <select
                      value={newEmp.gender}
                      onChange={(e) => setNewEmp({ ...newEmp, gender: e.target.value as "M" | "F" })}
                      className="form-input-avenida"
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Date de naissance</label>
                    <input
                      type="date"
                      value={newEmp.birth_date}
                      onChange={(e) => setNewEmp({ ...newEmp, birth_date: e.target.value })}
                      className="form-input-avenida"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Téléphone WhatsApp</label>
                    <input
                      type="tel"
                      value={newEmp.phone}
                      onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                      placeholder="+228 90 00 00 00"
                      className="form-input-avenida"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Quartier à Lomé</label>
                    <select
                      value={newEmp.neighborhood}
                      onChange={(e) => setNewEmp({ ...newEmp, neighborhood: e.target.value })}
                      className="form-input-avenida"
                    >
                      {NEIGHBORHOODS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rôle & CV */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2">
                  3. Poste, CV & Qualifications
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Intitulé du Poste *</label>
                    <input
                      type="text"
                      required
                      value={newEmp.role_title}
                      onChange={(e) => setNewEmp({ ...newEmp, role_title: e.target.value })}
                      placeholder={
                        newEmp.sector === "ecole"
                          ? "ex: Formateur Cuisine & Pâtisserie"
                          : "ex: Réceptionniste Polyvalent"
                      }
                      className="form-input-avenida"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Spécialité / Département
                    </label>
                    <input
                      type="text"
                      value={newEmp.specialty}
                      onChange={(e) => setNewEmp({ ...newEmp, specialty: e.target.value })}
                      placeholder="ex: Arts de la Table & Sommellerie"
                      className="form-input-avenida"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Diplôme le plus élevé</label>
                    <input
                      type="text"
                      value={newEmp.highest_degree}
                      onChange={(e) => setNewEmp({ ...newEmp, highest_degree: e.target.value })}
                      placeholder="ex: BTS Hôtellerie Restauration"
                      className="form-input-avenida"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Années d&apos;expérience</label>
                    <input
                      type="number"
                      value={newEmp.experience_years}
                      onChange={(e) => setNewEmp({ ...newEmp, experience_years: Number(e.target.value) })}
                      className="form-input-avenida"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Résumé du CV & Parcours
                    </label>
                    <textarea
                      rows={2}
                      value={newEmp.cv_summary}
                      onChange={(e) => setNewEmp({ ...newEmp, cv_summary: e.target.value })}
                      placeholder="Expériences précédentes, établissements fréquentés, compétences majeures..."
                      className="form-input-avenida"
                    />
                  </div>
                </div>
              </div>

              {/* Contrat & Date de Réception */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2">
                  4. Contrat & Rémunération
                </label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Date d&apos;embauche (Reçu le) *</label>
                    <input
                      type="date"
                      required
                      value={newEmp.hire_date}
                      onChange={(e) => setNewEmp({ ...newEmp, hire_date: e.target.value })}
                      className="form-input-avenida"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Type de Contrat</label>
                    <select
                      value={newEmp.contract_type}
                      onChange={(e) =>
                        setNewEmp({
                          ...newEmp,
                          contract_type: e.target.value as any,
                          contract_duration:
                            e.target.value === "CDI"
                              ? "Indéterminée (CDI)"
                              : e.target.value === "CDD"
                              ? "12 mois (Renouvelable)"
                              : "Volume horaire",
                        })
                      }
                      className="form-input-avenida"
                    >
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="Vacation">Vacation</option>
                      <option value="Stage Professionnel">Stage Pro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Durée Précise</label>
                    <input
                      type="text"
                      value={newEmp.contract_duration}
                      onChange={(e) => setNewEmp({ ...newEmp, contract_duration: e.target.value })}
                      className="form-input-avenida"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Salaire Base (F CFA)</label>
                    <input
                      type="number"
                      step={5000}
                      value={newEmp.base_salary}
                      onChange={(e) => setNewEmp({ ...newEmp, base_salary: Number(e.target.value) })}
                      className="form-input-avenida"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Photo & Pièces Justificatives Demandées */}
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <label className="block text-xs font-black uppercase text-slate-700">
                  5. Photo d&apos;Identité & Documents Requis du Collaborateur
                </label>

                {/* Photo Upload Zone */}
                <PhotoUploadZone
                  currentPhotoUrl={newEmp.photo_url}
                  onPhotoChange={(url) => setNewEmp({ ...newEmp, photo_url: url })}
                  label="Photo d'Identité Officielle (Badge & Dossier)"
                  sublabel="Photo récente de face sur fond clair (Exigence Format : JPG, PNG, WEBP • Débit Max : 3 Mo)"
                  required={false}
                  shape="portrait"
                />

                {/* Document Upload Manager avec exigences de format et débit */}
                <DocumentUploadManager
                  requiredDefs={REQUIRED_EMPLOYEE_DOCS}
                  uploadedFiles={newEmp.uploaded_documents}
                  onFilesChange={(files) => setNewEmp({ ...newEmp, uploaded_documents: files })}
                  title="Documents & Justificatifs Requis du Personnel"
                  subtitle="Téléversement certifié conforme : CV, Diplômes, CNI, Casier judiciaire, Certificat médical..."
                  allowCustomDocs={true}
                />
              </div>

              {/* Boutons d'Action */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Valider le Recrutement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Prévisualisation Document */}
      <DocumentViewerModal
        document={selectedDocForViewer}
        isOpen={!!selectedDocForViewer}
        onClose={() => setSelectedDocForViewer(null)}
      />
    </div>
  );
}
