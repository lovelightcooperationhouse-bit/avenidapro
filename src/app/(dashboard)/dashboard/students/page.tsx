"use client";

import { useState, useMemo, useEffect } from "react";
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
  Printer,
  Paperclip,
  Plus,
  FileText,
  AlertCircle,
  UploadCloud,
  Trash2,
  FolderOpen,
  Edit3,
  ShieldCheck,
} from "lucide-react";
import { MOCK_STUDENTS } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/utils";
import { useSchoolYear } from "@/context/SchoolYearContext";
import { Student, StudentReportCard, PaymentReceipt } from "@/types";
import { ReportCardModal } from "@/components/shared/ReportCardModal";
import { StudentRegistrationModal } from "@/components/shared/StudentRegistrationModal";
import { DirectorPendingApprovalsBanner } from "@/components/shared/DirectorPendingApprovalsBanner";
import { EditWithDirectorApprovalModal } from "@/components/shared/EditWithDirectorApprovalModal";
import { StudentDocumentsModal } from "@/components/shared/StudentDocumentsModal";
import {
  DocumentViewerModal,
  DEFAULT_DOCUMENT_REQUIREMENTS,
  formatBytes,
  type UploadedFileItem,
} from "@/components/shared/DocumentUploadManager";
import {
  getStoredStudents,
  syncStudentsFromSupabase,
  saveAndSyncStudent,
  saveAndSyncReceipt,
  broadcastDataChange,
  AVENIDA_DATA_UPDATED_EVENT,
} from "@/lib/realtime-store";
import {
  getReportCardsFromStorage,
  createBlankReportCardForStudent,
  upsertReportCard,
} from "@/lib/report-cards-data";

export default function StudentsPage() {
  const { selectedYearLabel, setSelectedYear } = useSchoolYear();
  const [allStudents, setAllStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProgram, setFilterProgram] = useState("ALL");
  const [selectedYearTab, setSelectedYearTab] = useState<string>("ALL");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedReportCard, setSelectedReportCard] = useState<StudentReportCard | null>(null);
  const [selectedEnrollmentStudent, setSelectedEnrollmentStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentForDocs, setStudentForDocs] = useState<Student | null>(null);
  const [activeDocPreview, setActiveDocPreview] = useState<UploadedFileItem | null>(null);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("Dossier Scolaire");

  // État de versement direct d'écolage
  const [paymentModalStudent, setPaymentModalStudent] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(50000);
  const [paymentDesignation, setPaymentDesignation] = useState("Frais de scolarité (Tranche suivante)");
  const [paymentMethod, setPaymentMethod] = useState<string>("Espèces");
  const [paymentDepositor, setPaymentDepositor] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<PaymentReceipt | null>(null);

  const handleQuickPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalStudent) return;
    setIsProcessingPayment(true);

    const ref = `#AV${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const amt = Number(paymentAmount) || 0;
    const newReceipt: PaymentReceipt = {
      id: `rec-${Date.now()}`,
      reference: ref,
      student_name: `${paymentModalStudent.last_name} ${paymentModalStudent.first_name}`,
      student_matricule: paymentModalStudent.registration_number,
      class_name: paymentModalStudent.class_name.split(" ")[0] || "BTS",
      designation: paymentDesignation,
      amount_paid: amt,
      total_due: paymentModalStudent.total_fee,
      remaining_due: Math.max(0, paymentModalStudent.remaining_fee - amt),
      depositor_name: paymentDepositor || paymentModalStudent.emergency_contact_name || "Parent d'Élève",
      depositor_id_card: "TG-LOM-2024-9912",
      depositor_phone: paymentPhone || paymentModalStudent.emergency_contact_phone || "+228 90 00 00 00",
      depositor_role: "Parent / Tuteur",
      payment_method: paymentMethod as any,
      site: "LOMÉ",
      date: new Date().toISOString().replace("T", " ").substring(0, 19),
      cashier_name: "Caisse Scolaire Avenida Lomé",
    };

    await saveAndSyncReceipt(newReceipt);

    const updatedRemaining = Math.max(0, paymentModalStudent.remaining_fee - amt);
    const updatedPaid = paymentModalStudent.paid_fee + amt;
    const updatedStud: Student = {
      ...paymentModalStudent,
      paid_fee: updatedPaid,
      remaining_fee: updatedRemaining,
    };
    setSelectedStudent(updatedStud);
    setAllStudents((prev) => prev.map((s) => (s.id === updatedStud.id ? updatedStud : s)));

    setIsProcessingPayment(false);
    setPaymentModalStudent(null);
    setPaymentSuccessReceipt(newReceipt);
  };

  const handleAttachStudentDocument = (file: File) => {
    if (!selectedStudent) return;
    setDocUploadError(null);
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    const allowed = DEFAULT_DOCUMENT_REQUIREMENTS.allowedExtensions;
    if (!allowed.includes(ext.toLowerCase())) {
      setDocUploadError(
        `Format "${ext}" refusé. Seuls les formats ${allowed.join(", ").toUpperCase()} sont autorisés.`
      );
      return;
    }
    if (file.size > DEFAULT_DOCUMENT_REQUIREMENTS.maxSizeBytes) {
      setDocUploadError(
        `Débit/Taille dépassé(e) : ${formatBytes(file.size)}. Le débit maximal autorisé est de ${formatBytes(
          DEFAULT_DOCUMENT_REQUIREMENTS.maxSizeBytes
        )}.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const docKey = `doc_${Date.now()}`;
      const item: UploadedFileItem = {
        key: docKey,
        id: docKey,
        name: newDocTitle.trim() || file.name,
        size: file.size,
        formattedSize: formatBytes(file.size),
        type: file.type || ext,
        dataUrl: typeof reader.result === "string" ? reader.result : undefined,
        uploadedAt: new Date().toISOString(),
        category: newDocCategory,
      };

      const updatedDocs = {
        ...(selectedStudent.uploaded_documents || {}),
        [docKey]: item,
      };

      const updatedStudent: Student = {
        ...selectedStudent,
        uploaded_documents: updatedDocs,
      };

      setSelectedStudent(updatedStudent);
      const updatedList = allStudents.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
      setAllStudents(updatedList);
      await saveAndSyncStudent(updatedStudent);
      setNewDocTitle("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveStudentDocument = async (docKey: string) => {
    if (!selectedStudent || !selectedStudent.uploaded_documents) return;
    const remainingDocs = { ...selectedStudent.uploaded_documents };
    delete remainingDocs[docKey];

    const updatedStudent: Student = {
      ...selectedStudent,
      uploaded_documents: remainingDocs,
    };
    setSelectedStudent(updatedStudent);
    const updatedList = allStudents.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setAllStudents(updatedList);
    await saveAndSyncStudent(updatedStudent);
  };

  useEffect(() => {
    setAllStudents(getStoredStudents());
    syncStudentsFromSupabase().then((list) => {
      if (list && list.length > 0) {
        setAllStudents(list);
      }
    });

    const handleUpdate = () => setAllStudents(getStoredStudents());
    window.addEventListener(AVENIDA_DATA_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(AVENIDA_DATA_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

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
      selectedYearTab === "ALL"
        ? allStudents
        : allStudents.filter((s) => s.academic_year === selectedYearTab);

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
  }, [allStudents, selectedYearTab]);

  // Filtrage combiné par année, programme et texte
  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      const matchesYear =
        selectedYearTab === "ALL" ||
        s.academic_year === selectedYearTab;
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
  }, [allStudents, selectedYearTab, filterProgram, searchTerm]);

  return (
    <div className="space-y-6">
      <DirectorPendingApprovalsBanner />

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
            Toutes les Promotions ({allStudents.length})
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
            <span>Année 2024 – 2025</span>
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
            <span>Année 2025 – 2026</span>
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
            <span>Année 2026 – 2027</span>
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
            <option value="CFA">CFA</option>
            <option value="CAP">CAP</option>
            <option value="BEP">BEP</option>
            <option value="BT">BT</option>
            <option value="BTS">BTS</option>
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
                        {s.photo_url && !s.photo_url.includes("default.png") ? (
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-300 shadow-xs shrink-0 bg-slate-100">
                            <img
                              src={s.photo_url}
                              alt={`${s.first_name}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0 ${
                              s.gender === "F" ? "bg-rose-600" : "bg-[#0C356A]"
                            }`}
                          >
                            {s.last_name[0]}
                            {s.first_name[0]}
                          </div>
                        )}
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-[#0C356A] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                          {s.registration_number}
                        </span>
                        {s.uploaded_documents && Object.keys(s.uploaded_documents).length > 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
                            title={`${Object.keys(s.uploaded_documents).filter((k) => k !== "photo").length} pièces jointes`}
                          >
                            <Paperclip className="w-2.5 h-2.5" />
                            {Object.keys(s.uploaded_documents).filter((k) => k !== "photo").length} pièces
                          </span>
                        )}
                      </div>
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
                          onClick={() => {
                            setPaymentModalStudent(s);
                            setPaymentAmount(Math.min(s.remaining_fee || 50000, 50000));
                            setPaymentDepositor(s.emergency_contact_name || "");
                            setPaymentPhone(s.emergency_contact_phone || "");
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs border border-emerald-200 active:scale-95 cursor-pointer"
                          title="Encaisser un versement et déduire du solde d'écolage"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Payer / Encaisser</span>
                        </button>
                        <button
                          onClick={() => setSelectedEnrollmentStudent(s)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-400 hover:text-slate-950 text-amber-900 font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs border border-amber-200 active:scale-95 cursor-pointer"
                          title="Imprimer ou télécharger la Fiche d'Inscription (PDF)"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-700" />
                          <span>Fiche Inscription</span>
                        </button>
                        <button
                          onClick={() => handleOpenStudentReport(s)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-[#0C356A] hover:text-white text-[#0C356A] font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs border border-blue-200 active:scale-95"
                          title="Consulter et télécharger le bulletin officiel"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>Bulletin</span>
                        </button>
                        <button
                          onClick={() => setStudentForDocs(s)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs border border-emerald-200 active:scale-95 cursor-pointer"
                          title="Dossier d'accès aux documents enregistrés"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Documents</span>
                        </button>
                        <button
                          onClick={() => setStudentToEdit(s)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-500 hover:text-slate-950 text-amber-900 font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs border border-amber-300 active:scale-95 cursor-pointer"
                          title="Modifier les informations de l'élève (Visa du Directeur Général requis)"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-[#0C356A] hover:text-white text-slate-700 font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
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
                {selectedStudent.photo_url && !selectedStudent.photo_url.includes("default.png") ? (
                  <div className="w-16 h-20 rounded-2xl overflow-hidden border-2 border-white/60 shadow-md shrink-0 bg-white">
                    <img
                      src={selectedStudent.photo_url}
                      alt={`${selectedStudent.first_name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                    {selectedStudent.last_name[0]}
                    {selectedStudent.first_name[0]}
                  </div>
                )}
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
                {/* Bouton d'encaissement et déduction d'écolage */}
                <button
                  onClick={() => {
                    setPaymentModalStudent(selectedStudent);
                    setPaymentAmount(Math.min(selectedStudent.remaining_fee || 50000, 50000));
                    setPaymentDepositor(selectedStudent.emergency_contact_name || "");
                    setPaymentPhone(selectedStudent.emergency_contact_phone || "");
                  }}
                  className="mt-2.5 w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                  <span>Encaisser un Versement / Déduire du Reste d&apos;Écolage</span>
                </button>
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

              {/* Pièces Justificatives Numérisées & Ajout de documents requis */}
              <div>
                <div className="flex items-center justify-between border-b pb-1.5 mb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#0C356A]" />
                    <span>Pièces Justificatives & Documents Requis</span>
                  </h3>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {Object.keys(selectedStudent.uploaded_documents || {}).filter((k) => k !== "photo").length} document(s) classé(s)
                  </span>
                </div>

                {/* Exigence de format et débit */}
                <div className="p-2.5 mb-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Exigences Numériques Avenida Lomé :</div>
                    <div className="text-blue-800 text-[10px]">
                      Formats autorisés : <strong>PDF, JPG, PNG, WEBP, DOCX</strong> • Débit max autorisé : <strong>5 Mo par fichier</strong>
                    </div>
                  </div>
                </div>

                {docUploadError && (
                  <div className="p-2.5 mb-3 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span className="font-medium">{docUploadError}</span>
                  </div>
                )}

                {/* Liste des documents déjà joints */}
                {selectedStudent.uploaded_documents && Object.keys(selectedStudent.uploaded_documents).filter((k) => k !== "photo").length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {Object.entries(selectedStudent.uploaded_documents)
                      .filter(([key]) => key !== "photo")
                      .map(([key, doc]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate">{doc.name}</p>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                {doc.category && (
                                  <span className="text-blue-700 font-semibold">{doc.category}</span>
                                )}
                                <span className="font-mono text-slate-500 font-bold">{doc.formattedSize}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setActiveDocPreview(doc)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                              title="Visualiser le document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStudentDocument(key)}
                              className="p-1.5 rounded-lg bg-slate-100 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                              title="Supprimer la pièce"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-3 mb-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-[11px] text-slate-500">
                    Aucun document complémentaire numérisé pour le moment.
                  </div>
                )}

                {/* Formulaire d'ajout rapide d'un document requis */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-black uppercase text-slate-700 block mb-2 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    Ajouter un document requis demandé
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Libellé (ex: Certificat Médical, Casier...)"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={newDocCategory}
                      onChange={(e) => setNewDocCategory(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Dossier Scolaire">Dossier Scolaire</option>
                      <option value="État Civil / CNI">État Civil / CNI</option>
                      <option value="Médical">Certificat Médical</option>
                      <option value="Financier">Justificatif Écolage</option>
                      <option value="Autre Requis">Autre Document Requis</option>
                    </select>
                  </div>
                  <label className="flex items-center justify-center gap-2 p-2 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50/30 cursor-pointer text-blue-800 transition-colors">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-[11px]">
                      Choisir le fichier requis (PDF ou Image, Max 5 Mo)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAttachStudentDocument(file);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedEnrollmentStudent(selectedStudent)}
                  className="px-4 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer Fiche Officielle (PDF)</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Imprimer Vue Écran</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
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

      {/* MODAL OFFICIEL D'INSCRIPTION & RÉCÉPISSÉ SCOLAIRE (IMPRIMABLE A4) */}
      {selectedEnrollmentStudent && (
        <StudentRegistrationModal
          student={selectedEnrollmentStudent}
          isOpen={!!selectedEnrollmentStudent}
          onClose={() => setSelectedEnrollmentStudent(null)}
        />
      )}

      {/* Visionneuse de document intégrée */}
      <DocumentViewerModal
        document={activeDocPreview}
        isOpen={!!activeDocPreview}
        onClose={() => setActiveDocPreview(null)}
      />

      {/* Modal Dossier d'accès aux documents enregistrés pour l'élève */}
      {studentForDocs && (
        <StudentDocumentsModal
          student={studentForDocs}
          isOpen={!!studentForDocs}
          onClose={() => setStudentForDocs(null)}
          onUpdateStudent={(upd) => {
            setAllStudents(getStoredStudents());
            if (selectedStudent?.id === upd.id) setSelectedStudent(upd);
          }}
        />
      )}

      {/* Modal Modification d'informations sous autorisation du Directeur */}
      {studentToEdit && (
        <EditWithDirectorApprovalModal
          entityType="student"
          entityData={studentToEdit}
          isOpen={!!studentToEdit}
          onClose={() => setStudentToEdit(null)}
          onSuccess={() => {
            setAllStudents(getStoredStudents());
            if (selectedStudent?.id === studentToEdit.id) {
              const fresh = getStoredStudents().find((s) => s.id === studentToEdit.id);
              if (fresh) setSelectedStudent(fresh);
            }
          }}
        />
      )}

      {/* MODAL RAPIDE DE VERSEMENT D'ÉCOLAGE / DÉDUCTION DU SOLDE */}
      {paymentModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-emerald-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base leading-tight">
                    Encaisser un Versement Scolaire
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Déduction immédiate dans la base de données Supabase
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalStudent(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulaire de paiement */}
            <form onSubmit={handleQuickPaymentSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Infos élève */}
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    Élève bénéficiaire
                  </span>
                  <span className="font-black text-slate-900 text-sm">
                    {paymentModalStudent.last_name} {paymentModalStudent.first_name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Matricule : {paymentModalStudent.registration_number} &bull; {paymentModalStudent.class_name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-rose-600 font-bold block uppercase">
                    Reste actuel à payer
                  </span>
                  <span className="font-mono font-black text-rose-700 text-sm">
                    {formatFCFA(paymentModalStudent.remaining_fee)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    Total dû : {formatFCFA(paymentModalStudent.total_fee)}
                  </span>
                </div>
              </div>

              {/* Montant versé */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Montant à encaisser (F CFA) *
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-base text-[#0C356A] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 50000"
                />
                <div className="flex gap-2 mt-1.5">
                  {[25000, 50000, 100000].map((quickAmt) => (
                    <button
                      key={quickAmt}
                      type="button"
                      onClick={() => setPaymentAmount(quickAmt)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      +{quickAmt.toLocaleString()} F
                    </button>
                  ))}
                  {paymentModalStudent.remaining_fee > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(paymentModalStudent.remaining_fee)}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-bold transition-colors ml-auto"
                    >
                      Régler la totalité ({formatFCFA(paymentModalStudent.remaining_fee)})
                    </button>
                  )}
                </div>
              </div>

              {/* Motif / Tranche */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Désignation du paiement / Tranche *
                </label>
                <input
                  type="text"
                  value={paymentDesignation}
                  onChange={(e) => setPaymentDesignation(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Frais de scolarité - Tranche 2"
                />
              </div>

              {/* Mode de règlement & déposant */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Mode de règlement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Espèces">Espèces (Caisse)</option>
                    <option value="Virement bancaire">Virement bancaire</option>
                    <option value="T-Money">T-Money</option>
                    <option value="Flooz">Flooz</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Déposant (Nom complet)
                  </label>
                  <input
                    type="text"
                    value={paymentDepositor}
                    onChange={(e) => setPaymentDepositor(e.target.value)}
                    placeholder="Nom du parent"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Aperçu du nouveau solde */}
              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-bold">Nouveau solde restant calculé :</span>
                <span className="font-mono font-black text-emerald-800 text-sm">
                  {formatFCFA(Math.max(0, paymentModalStudent.remaining_fee - paymentAmount))}
                </span>
              </div>

              {/* Bouton de validation */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentModalStudent(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment || paymentAmount <= 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isProcessingPayment ? "Synchronisation Supabase..." : "Valider & Déduire l'Écolage"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DE SUCCÈS APRÈS VERSEMENT */}
      {paymentSuccessReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-2 border-emerald-300 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#0C356A]">
                Versement Enregistré avec Succès !
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Le montant de{" "}
                <strong className="text-emerald-800 font-mono text-sm">
                  {formatFCFA(paymentSuccessReceipt.amount_paid)}
                </strong>{" "}
                a été déduit du compte de l&apos;élève.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Réf. Reçu :</span>
                <strong className="font-mono">{paymentSuccessReceipt.reference}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Élève :</span>
                <strong>{paymentSuccessReceipt.student_name}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500 font-bold">Nouveau Reste Dû :</span>
                <strong className="text-rose-700 font-mono text-sm">
                  {formatFCFA(paymentSuccessReceipt.remaining_due)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statut :</span>
                <strong className="text-emerald-700">
                  {paymentSuccessReceipt.remaining_due === 0 ? "★ Totalement Soldé" : "Paiement Partiel"}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard/payments"
                className="px-4 py-2 bg-[#0C356A] hover:bg-[#164E87] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Voir / Imprimer le Reçu</span>
              </Link>
              <button
                onClick={() => setPaymentSuccessReceipt(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
