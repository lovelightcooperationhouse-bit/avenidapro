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
  Clock,
  UserX,
  AlertTriangle,
} from "lucide-react";
import { MOCK_STUDENTS } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/utils";
import { useSchoolYear } from "@/context/SchoolYearContext";
import { Student, StudentReportCard, PaymentReceipt, AbsenceTicket, LateTicket } from "@/types";
import { ReportCardModal } from "@/components/shared/ReportCardModal";
import { StudentRegistrationModal } from "@/components/shared/StudentRegistrationModal";
import { OfficialPaymentReceiptModal } from "@/components/shared/OfficialPaymentReceiptModal";
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
  getStoredReceipts,
  syncReceiptsFromSupabase,
  formatReceiptDateTime,
  getStoredAbsences,
  syncAbsencesFromSupabase,
  getStoredLates,
  syncLatesFromSupabase,
  recordStudentAttendanceIncident,
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

  // Règlements d'Écolage & Reçus Officiels
  const [allReceipts, setAllReceipts] = useState<PaymentReceipt[]>([]);
  const [receiptToView, setReceiptToView] = useState<PaymentReceipt | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(50000);
  const [paymentDesignation, setPaymentDesignation] = useState("Frais de scolarité (Tranche)");
  const [paymentMethod, setPaymentMethod] = useState<"Espèces" | "Stripe" | "Mobile Money" | "Virement">("Espèces");
  const [paymentDepositorName, setPaymentDepositorName] = useState("");
  const [paymentDepositorPhone, setPaymentDepositorPhone] = useState("");
  const [paymentDepositorRole, setPaymentDepositorRole] = useState("Parent / Tuteur");
  const [paymentCashierName, setPaymentCashierName] = useState("Caisse Scolaire Lomé");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Vie Scolaire & Assiduité Élève
  const [allAbsences, setAllAbsences] = useState<AbsenceTicket[]>([]);
  const [allLates, setAllLates] = useState<LateTicket[]>([]);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    type: "absence" as "absence" | "retard" | "permission",
    date: new Date().toISOString().split("T")[0],
    time: "08:00",
    duration_minutes: 20,
    end_date: new Date().toISOString().split("T")[0],
    reason: "",
    is_justified: true,
  });

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
    setAllAbsences(getStoredAbsences());
    setAllLates(getStoredLates());
    setAllReceipts(getStoredReceipts());

    Promise.all([
      syncStudentsFromSupabase(),
      syncAbsencesFromSupabase(),
      syncLatesFromSupabase(),
      syncReceiptsFromSupabase(),
    ]).then(([list]) => {
      if (list && list.length > 0) {
        setAllStudents(list);
      }
      setAllAbsences(getStoredAbsences());
      setAllLates(getStoredLates());
      setAllReceipts(getStoredReceipts());
    });

    const handleUpdate = () => {
      const freshStudents = getStoredStudents();
      setAllStudents(freshStudents);
      setAllAbsences(getStoredAbsences());
      setAllLates(getStoredLates());
      setAllReceipts(getStoredReceipts());
      if (selectedStudent) {
        const found = freshStudents.find((s) => s.id === selectedStudent.id);
        if (found) setSelectedStudent(found);
      }
    };
    window.addEventListener(AVENIDA_DATA_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(AVENIDA_DATA_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [selectedStudent]);

  // Filtrage de tous les reçus et versements passés de l'élève
  const selectedStudentReceipts = useMemo(() => {
    if (!selectedStudent) return [];
    const regNum = (selectedStudent.registration_number || "").toLowerCase().trim();
    const fullName = `${selectedStudent.last_name} ${selectedStudent.first_name}`.toLowerCase().trim();
    return allReceipts.filter((r) => {
      const rMat = (r.student_matricule || "").toLowerCase().trim();
      const rName = (r.student_name || "").toLowerCase().trim();
      return (regNum && rMat === regNum) || (fullName && rName === fullName);
    });
  }, [allReceipts, selectedStudent]);

  // Enregistrement d'un versement d'écolage direct pour l'élève
  const handleMakeStudentPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || paymentAmount <= 0) return;
    setIsSubmittingPayment(true);

    try {
      const prevPaid = Number(selectedStudent.paid_fee) || 0;
      const totalDue = Number(selectedStudent.total_fee) || (prevPaid + Number(selectedStudent.remaining_fee || 0)) || 370000;
      const newRemaining = Math.max(0, Number(selectedStudent.remaining_fee) - paymentAmount);

      const newReceipt: PaymentReceipt = {
        id: `rec-${Date.now()}`,
        reference: `#AV2022-${Math.floor(1000 + Math.random() * 9000)}`,
        student_name: `${selectedStudent.last_name} ${selectedStudent.first_name}`,
        student_matricule: selectedStudent.registration_number,
        class_name: selectedStudent.class_name,
        designation: paymentDesignation.trim() || "Frais de scolarité (Tranche)",
        amount_paid: Number(paymentAmount),
        total_due: totalDue,
        remaining_due: newRemaining,
        depositor_name: paymentDepositorName.trim() || selectedStudent.emergency_contact_name || "Parent / Tuteur",
        depositor_id_card: "PIÈCE TUTEUR",
        depositor_phone: paymentDepositorPhone.trim() || selectedStudent.emergency_contact_phone || selectedStudent.phone || "+228 90 00 00 00",
        depositor_role: paymentDepositorRole,
        payment_method: paymentMethod,
        site: "LOMÉ",
        date: formatReceiptDateTime(),
        cashier_name: paymentCashierName || "Caisse Scolaire Lomé",
      };

      await saveAndSyncReceipt(newReceipt);

      // Mise à jour de l'état local
      const updatedStudents = getStoredStudents();
      const found = updatedStudents.find((s) => s.id === selectedStudent.id);
      if (found) setSelectedStudent(found);
      setAllStudents(updatedStudents);
      setAllReceipts(getStoredReceipts());

      setIsSubmittingPayment(false);
      setIsPaymentModalOpen(false);
      setReceiptToView(newReceipt);
    } catch (err) {
      console.error("Erreur enregistrement versement élève:", err);
      setIsSubmittingPayment(false);
    }
  };

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

  // Filtrage des incidents de vie scolaire pour l'élève sélectionné
  const selectedStudentAbsences = useMemo(() => {
    if (!selectedStudent) return [];
    return allAbsences.filter(
      (a) =>
        (a.student_matricule && a.student_matricule === selectedStudent.registration_number) ||
        (a.student_id && a.student_id === selectedStudent.id) ||
        (a.student_name && a.student_name.toLowerCase().includes(selectedStudent.last_name.toLowerCase()))
    );
  }, [allAbsences, selectedStudent]);

  const selectedStudentLates = useMemo(() => {
    if (!selectedStudent) return [];
    return allLates.filter(
      (l) =>
        (l.student_matricule && l.student_matricule === selectedStudent.registration_number) ||
        (l.student_id && l.student_id === selectedStudent.id) ||
        (l.student_name && l.student_name.toLowerCase().includes(selectedStudent.last_name.toLowerCase()))
    );
  }, [allLates, selectedStudent]);

  const studentRegularAbsences = selectedStudentAbsences.filter((a) => a.ticket_type !== "permission");
  const studentPermissions = selectedStudentAbsences.filter((a) => a.ticket_type === "permission");

  const handleOpenIncidentModal = (type: "absence" | "retard" | "permission" = "absence") => {
    setIncidentForm({
      type,
      date: new Date().toISOString().split("T")[0],
      time: "08:00",
      duration_minutes: 20,
      end_date: new Date().toISOString().split("T")[0],
      reason: "",
      is_justified: true,
    });
    setShowIncidentModal(true);
  };

  const handleSaveStudentIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !incidentForm.reason.trim()) return;
    setIsSubmittingIncident(true);
    try {
      await recordStudentAttendanceIncident({
        student_id: selectedStudent.id,
        student_matricule: selectedStudent.registration_number,
        student_name: `${selectedStudent.last_name} ${selectedStudent.first_name}`,
        class_name: selectedStudent.class_name || `${selectedStudent.program_code} - Hôtellerie`,
        type: incidentForm.type,
        date: incidentForm.date,
        time: incidentForm.time,
        duration_minutes: Number(incidentForm.duration_minutes) || 15,
        end_date: incidentForm.end_date,
        reason: incidentForm.reason.trim(),
        is_justified: incidentForm.is_justified,
        visa_vie_scolaire: true,
      });

      setAllAbsences(getStoredAbsences());
      setAllLates(getStoredLates());
      setShowIncidentModal(false);
    } catch (err) {
      console.error("Erreur enregistrement vie scolaire:", err);
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  const getStudentAttendanceSummary = (st: Student) => {
    const absences = allAbsences.filter(
      (a) =>
        (a.student_matricule && a.student_matricule === st.registration_number) ||
        (a.student_id && a.student_id === st.id) ||
        (a.student_name && a.student_name.toLowerCase().includes(st.last_name.toLowerCase()))
    );
    const lates = allLates.filter(
      (l) =>
        (l.student_matricule && l.student_matricule === st.registration_number) ||
        (l.student_id && l.student_id === st.id) ||
        (l.student_name && l.student_name.toLowerCase().includes(st.last_name.toLowerCase()))
    );
    const regularAbs = absences.filter((a) => a.ticket_type !== "permission");
    const permissions = absences.filter((a) => a.ticket_type === "permission");
    return {
      total: absences.length + lates.length,
      absencesCount: regularAbs.length,
      permissionsCount: permissions.length,
      latesCount: lates.length,
    };
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
                <th className="py-3.5 px-4 text-right">Écolage Dû / Payé</th>
                <th className="py-3.5 px-4 text-center">Statut Financier (Caisse)</th>
                <th className="py-3.5 px-4 text-center">Pointages & Assiduité</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => {
                const isPaidFull = s.remaining_fee === 0;
                const isUnpaid = (Number(s.paid_fee) || 0) === 0;
                const attSummary = getStudentAttendanceSummary(s);

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
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-black uppercase text-blue-700">
                          {s.program_code}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-medium">&bull; {s.academic_year}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-black text-slate-900 text-xs">
                        {formatFCFA(s.paid_fee)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {isPaidFull ? (
                          <span className="text-emerald-700 font-bold">Soldé (100%)</span>
                        ) : (
                          <span className="text-rose-600 font-bold">
                            Reste: {formatFCFA(s.remaining_fee)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Statut Financier Caisse Direct */}
                    <td className="py-3 px-4 text-center">
                      {isPaidFull ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Soldé (En Règle)
                        </span>
                      ) : isUnpaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Impayé (0 F)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Solde Partiel
                        </span>
                      )}
                    </td>

                    {/* Pointages & Assiduité Direct */}
                    <td className="py-3 px-4 text-center">
                      {attSummary.total === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          0 Incident (Assidu)
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1 flex-wrap justify-center">
                          {attSummary.absencesCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800 border border-red-200">
                              {attSummary.absencesCount} abs.
                            </span>
                          )}
                          {attSummary.latesCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                              {attSummary.latesCount} ret.
                            </span>
                          )}
                          {attSummary.permissionsCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-200">
                              {attSummary.permissionsCount} perm.
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href="/dashboard/payments"
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-[#0C356A] hover:text-white text-slate-700 font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs border border-slate-200 active:scale-95 cursor-pointer"
                          title="Consulter le dossier de cet élève à la Caisse Centrale (Gestion Trésorerie)"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                          <span>Situation Caisse</span>
                        </Link>
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-mono">
                      {selectedStudent.registration_number}
                    </span>
                    <span className="text-xs text-white/80 font-bold">
                      Année {selectedStudent.academic_year}
                    </span>
                    {/* Badge financier temps réel */}
                    {selectedStudent.remaining_fee === 0 ? (
                      <span className="text-[10px] font-black bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                        Scolarité Soldée
                      </span>
                    ) : (
                      <span className="text-[10px] font-black bg-amber-500/30 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-300" />
                        Reste : {formatFCFA(selectedStudent.remaining_fee)}
                      </span>
                    )}
                    {/* Badge pointage vie scolaire temps réel */}
                    <span className="text-[10px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-200" />
                      {studentRegularAbsences.length + selectedStudentLates.length === 0
                        ? "Assidu (0 Pointage)"
                        : `${studentRegularAbsences.length} abs. / ${selectedStudentLates.length} ret.`}
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
                    <span className="text-[10px] text-slate-400 font-bold block">Quartier de Résidence</span>
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

              {/* Bilan Financier, Échelonnement & Reçus d'Écolage */}
              <div>
                <div className="flex items-center justify-between border-b pb-1 mb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Situation Financière Réelle &amp; Échelonnement de Scolarité</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {Number(selectedStudent.remaining_fee) === 0 ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        100% Soldé
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-bold text-[10px]">
                        {selectedStudent.total_fee > 0
                          ? `${Math.round(((Number(selectedStudent.paid_fee) || 0) / Number(selectedStudent.total_fee)) * 100)}% réglé`
                          : "En cours"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Barre de progression financière */}
                <div className="mb-3 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-500 ${
                      Number(selectedStudent.remaining_fee) === 0 ? "bg-emerald-500" : "bg-[#0C356A]"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        selectedStudent.total_fee > 0
                          ? Math.round(((Number(selectedStudent.paid_fee) || 0) / Number(selectedStudent.total_fee)) * 100)
                          : 0
                      )}%`,
                    }}
                  />
                </div>

                {/* 3 Blocs KPI */}
                <div className="grid grid-cols-3 gap-3 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Total Scolarité Dû</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {formatFCFA(selectedStudent.total_fee)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 font-bold block">Total Déjà Réglé</span>
                    <span className="font-mono font-black text-emerald-800 text-sm">
                      {formatFCFA(selectedStudent.paid_fee)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-700 font-bold block">Solde Restant à Payer</span>
                    <span
                      className={`font-mono font-black text-sm ${
                        Number(selectedStudent.remaining_fee) === 0 ? "text-emerald-700" : "text-[#DC2626]"
                      }`}
                    >
                      {formatFCFA(selectedStudent.remaining_fee)}
                    </span>
                  </div>
                </div>

                {/* Décision Administrative & Solvabilité Scolaire (Garder ou Renvoyer) */}
                <div className="mt-3 p-3.5 rounded-2xl border text-xs bg-white shadow-2xs">
                  <div className="flex items-start gap-3">
                    {Number(selectedStudent.remaining_fee) === 0 ? (
                      <>
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-emerald-950 font-black text-xs uppercase tracking-wide">
                              SITUATION 100% EN RÈGLE &bull; ÉLÈVE AUTORISÉ DÉFINITIVEMENT EN COURS
                            </strong>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                              Quittance Intégrale
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 mt-0.5">
                            Tous les frais de scolarité sont intégralement acquittés. L&apos;apprenant est autorisé à participer à tous les cours, ateliers pratiques et examens officiels.
                          </p>
                        </div>
                      </>
                    ) : Number(selectedStudent.paid_fee) > 0 ? (
                      <>
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-amber-950 font-black text-xs uppercase tracking-wide">
                              TRANCHE EN COURS VALIDÉE &bull; ACCÈS AUX COURS AUTORISÉ SOUS CONTRÔLE
                            </strong>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                              Reste : {formatFCFA(selectedStudent.remaining_fee)}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            L&apos;élève est en règle pour les échéances actuelles. Suivre le calendrier des versements pour anticiper la tranche suivante.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-xl bg-red-100 text-[#DC2626] flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-red-950 font-black text-xs uppercase tracking-wide">
                              ALERTE IMPAYÉ CRITIQUE &bull; ORIENTER IMMÉDIATEMENT À LA CAISSE
                            </strong>
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">
                              0 F Versé
                            </span>
                          </div>
                          <p className="text-[11px] text-[#DC2626] font-semibold mt-0.5">
                            Décision du Responsable : Accès aux cours conditionné. L&apos;élève doit se présenter d&apos;urgence à la Caisse Écolage pour versement de la 1ère tranche.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Boutons d'Action : Orientation Caisse & Reçu Définitif */}
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`/dashboard/payments?student=${selectedStudent.registration_number}`}
                    className="flex-1 min-w-[240px] px-4 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center"
                  >
                    <CreditCard className="w-4 h-4 text-amber-300" />
                    <span>Transférer à la Caisse Écolage pour Règlement par Tranche &rarr;</span>
                  </Link>

                  {Number(selectedStudent.remaining_fee) === 0 && selectedStudentReceipts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setReceiptToView(selectedStudentReceipts[selectedStudentReceipts.length - 1])}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Award className="w-4 h-4 text-amber-300" />
                      <span>Imprimer Reçu Définitif (Solde Intégral 100%)</span>
                    </button>
                  )}
                </div>

                {/* Historique Horodaté de l'Échelonnement des Paiements Effectués */}
                <div className="mt-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                      Échelonnement &amp; Tranches Réglées ({selectedStudentReceipts.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Date, heure &amp; justificatifs</span>
                  </div>

                  {selectedStudentReceipts.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {selectedStudentReceipts.map((rec, idx) => (
                        <div
                          key={rec.id || idx}
                          className="p-2.5 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200 transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold font-mono text-[11px]">
                              T{idx + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 truncate">
                                  {rec.designation || "Frais d'écolage"}
                                </span>
                                <span className="text-[10px] font-mono text-[#0C356A] font-bold bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                  {rec.reference}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                <span>{rec.date}</span>
                                <span>&bull;</span>
                                <span className="text-slate-600">{rec.payment_method}</span>
                                <span>&bull;</span>
                                <span>
                                  Reste après versement :{" "}
                                  <strong className={rec.remaining_due === 0 ? "text-emerald-700" : "text-[#DC2626]"}>
                                    {formatFCFA(rec.remaining_due)}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-black text-emerald-700 text-xs">
                              {formatFCFA(rec.amount_paid)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setReceiptToView(rec)}
                              className="px-2 py-1 bg-white hover:bg-[#0C356A] text-[#0C356A] hover:text-white border border-blue-200 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Consulter et imprimer le reçu officiel avec historique"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Reçu</span>
                            </button>
                            {rec.proof_file_url && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDocPreview({
                                    id: `proof-${rec.reference}`,
                                    key: `proof-${rec.reference}`,
                                    name: rec.proof_file_name || `Preuve de versement ${rec.reference}`,
                                    size: 0,
                                    formattedSize: rec.proof_file_size || "Pièce jointe",
                                    type: "application/pdf",
                                    dataUrl: rec.proof_file_url,
                                    uploadedAt: rec.date,
                                    category: "Justificatifs Financiers & Reçus de Caisse",
                                  });
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Consulter la pièce justificative jointe par la caisse"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span>Preuve</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
                      <p className="font-bold text-slate-700">Aucun versement d&apos;écolage enregistré à la caisse</p>
                      <p className="text-[11px]">
                        Le service comptabilité &amp; trésorerie n&apos;a pas encore enregistré d&apos;encaissement. Cliquez sur &laquo; Transférer à la Caisse Écolage &raquo; pour encaisser la 1ère tranche.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vie Scolaire, Pointages & Assiduité Directe */}
              <div>
                <div className="flex items-center justify-between border-b pb-1 mb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Vie Scolaire & Pointages de l&apos;Élève</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenIncidentModal("absence")}
                      className="px-2 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 font-bold rounded-lg text-[10px] transition-colors border border-red-200 cursor-pointer"
                    >
                      + Absence
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenIncidentModal("retard")}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 font-bold rounded-lg text-[10px] transition-colors border border-amber-200 cursor-pointer"
                    >
                      + Retard
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenIncidentModal("permission")}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-800 font-bold rounded-lg text-[10px] transition-colors border border-blue-200 cursor-pointer"
                    >
                      + Permission
                    </button>
                  </div>
                </div>

                {/* Synthèse des Pointages */}
                <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                  <div className="bg-red-50/70 p-2.5 rounded-xl border border-red-200 text-center">
                    <span className="text-[10px] text-red-700 font-bold block uppercase">Absences</span>
                    <span className="text-base font-black text-red-950 font-mono">
                      {studentRegularAbsences.length}
                    </span>
                    <span className="text-[9px] text-red-600 block">
                      {studentRegularAbsences.filter((a) => !a.is_justified && !a.parent_justified).length} injustifiée(s)
                    </span>
                  </div>
                  <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-center">
                    <span className="text-[10px] text-amber-800 font-bold block uppercase">Retards</span>
                    <span className="text-base font-black text-amber-950 font-mono">
                      {selectedStudentLates.length}
                    </span>
                    <span className="text-[9px] text-amber-700 block">Pointages horaires</span>
                  </div>
                  <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 text-center">
                    <span className="text-[10px] text-blue-800 font-bold block uppercase">Permissions</span>
                    <span className="text-base font-black text-blue-950 font-mono">
                      {studentPermissions.length}
                    </span>
                    <span className="text-[9px] text-blue-600 block">Visas accordés</span>
                  </div>
                </div>

                {/* Historique des incidents récents */}
                {selectedStudentAbsences.length > 0 || selectedStudentLates.length > 0 ? (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 max-h-36 overflow-y-auto">
                    {selectedStudentAbsences.map((ab) => (
                      <div
                        key={ab.id}
                        className="flex items-center justify-between text-[11px] p-2 bg-white rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              ab.ticket_type === "permission"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {ab.ticket_type === "permission" ? "Permission" : "Absence"}
                          </span>
                          <span className="font-semibold text-slate-800">{ab.reason || "Non spécifié"}</span>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 font-mono">
                          {ab.date || ab.start_date} {ab.is_justified || ab.parent_justified ? "• Justifiée" : "• Injustifiée"}
                        </div>
                      </div>
                    ))}
                    {selectedStudentLates.map((lt) => (
                      <div
                        key={lt.id}
                        className="flex items-center justify-between text-[11px] p-2 bg-white rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-900">
                            Retard ({lt.duration_minutes || lt.minutes_late || 15} min)
                          </span>
                          <span className="font-semibold text-slate-800">{lt.reason || "Arrivée tardive"}</span>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 font-mono">
                          {lt.date} {lt.time_arrived ? `à ${lt.time_arrived}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-center text-emerald-800 text-[11px] font-semibold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Élève assidu : Aucun incident d&apos;assiduité ou de retard enregistré.</span>
                  </div>
                )}
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

      {/* MODAL D'ENREGISTREMENT RAPIDE D'INCIDENT / POINTAGE VIE SCOLAIRE */}
      {showIncidentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Vie Scolaire &bull; Pointage
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Enregistrer un incident : {selectedStudent.last_name} {selectedStudent.first_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIncidentModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentIncident} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Type de Pointage *</label>
                <select
                  value={incidentForm.type}
                  onChange={(e) =>
                    setIncidentForm({ ...incidentForm, type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="absence">Absence (Non comparu au cours)</option>
                  <option value="retard">Retard (Arrivée tardive)</option>
                  <option value="permission">Permission de sortie autorisée</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={incidentForm.date}
                    onChange={(e) => setIncidentForm({ ...incidentForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                {incidentForm.type === "retard" ? (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Minutes de retard</label>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={incidentForm.duration_minutes}
                      onChange={(e) =>
                        setIncidentForm({ ...incidentForm, duration_minutes: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Heure / Période</label>
                    <input
                      type="time"
                      value={incidentForm.time}
                      onChange={(e) => setIncidentForm({ ...incidentForm, time: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motif / Justification *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="ex: Maladie déclarée, problème de transport, convocation..."
                  value={incidentForm.reason}
                  onChange={(e) => setIncidentForm({ ...incidentForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="incident-justified"
                  checked={incidentForm.is_justified}
                  onChange={(e) =>
                    setIncidentForm({ ...incidentForm, is_justified: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#0C356A]"
                />
                <label htmlFor="incident-justified" className="font-bold text-slate-700 cursor-pointer">
                  Incident formellement justifié (Certificat / Billet officiel)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIncident}
                  className="px-5 py-2 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingIncident ? "Enregistrement..." : "Valider le Pointage"}
                </button>
              </div>
            </form>
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
            if (selectedStudent?.id === studentToEdit?.id) {
              const fresh = getStoredStudents().find((s) => s.id === studentToEdit.id);
              if (fresh) setSelectedStudent(fresh);
            }
          }}
        />
      )}

      {/* MODAL ENCAISSEMENT DIRECT D'ÉCOLAGE ÉLÈVE AVEC DÉDUCTION INSTANTANÉE */}
      {isPaymentModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Caisse Scolaire &bull; Versement Écolage
                </span>
                <h3 className="text-base font-black text-[#0C356A] mt-1 font-serif">
                  Encaisser pour : {selectedStudent.last_name} {selectedStudent.first_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Récapitulatif situation financière actuelle */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Classe : {selectedStudent.class_name} ({selectedStudent.program_code})</span>
                <span className="font-mono text-[#0C356A] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                  {selectedStudent.registration_number}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Scolarité : <strong>{formatFCFA(selectedStudent.total_fee)}</strong></span>
                <span>Déjà versé : <strong className="text-emerald-700">{formatFCFA(selectedStudent.paid_fee)}</strong></span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                <span className="text-slate-700">Reste actuel avant ce paiement :</span>
                <span className="text-[#DC2626]">{formatFCFA(selectedStudent.remaining_fee)}</span>
              </div>
            </div>

            <form onSubmit={handleMakeStudentPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Motif / Désignation du Versement *</label>
                <input
                  type="text"
                  required
                  value={paymentDesignation}
                  onChange={(e) => setPaymentDesignation(e.target.value)}
                  placeholder="ex: Frais de scolarité (Tranche 2)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Montant Versé Maintenant (F CFA) *</label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 font-mono text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mode de Règlement *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="Espèces">Espèces (Guichet)</option>
                    <option value="Mobile Money">Mobile Money (Flooz / T-Money)</option>
                    <option value="Virement">Virement Bancaire</option>
                    <option value="Stripe">Carte Bancaire / Stripe</option>
                  </select>
                </div>
              </div>

              {/* Simulation dynamique du nouveau solde */}
              {(() => {
                const simulatedRem = Math.max(0, Number(selectedStudent.remaining_fee) - Number(paymentAmount));
                const willBeSettled = simulatedRem === 0;
                return (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      willBeSettled
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : "bg-blue-50 border-blue-200 text-blue-900"
                    }`}
                  >
                    <div>
                      <span className="font-bold">Nouveau solde après cette opération : </span>
                      <strong className={willBeSettled ? "text-emerald-700" : "text-[#DC2626]"}>
                        {formatFCFA(simulatedRem)}
                      </strong>
                    </div>
                    {willBeSettled ? (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-md uppercase">
                        Sera 100% Soldé !
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-200 text-blue-900 text-[10px] font-bold rounded-md">
                        Paiement Partiel
                      </span>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom du Déposant / Payeur</label>
                  <input
                    type="text"
                    value={paymentDepositorName}
                    onChange={(e) => setPaymentDepositorName(e.target.value)}
                    placeholder="Nom complet"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone du Déposant</label>
                  <input
                    type="text"
                    value={paymentDepositorPhone}
                    onChange={(e) => setPaymentDepositorPhone(e.target.value)}
                    placeholder="+228..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Qualité / Lien avec l&apos;Élève</label>
                  <select
                    value={paymentDepositorRole}
                    onChange={(e) => setPaymentDepositorRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                  >
                    <option>Parent / Tuteur</option>
                    <option>Père</option>
                    <option>Mère</option>
                    <option>Élève lui-même</option>
                    <option>Parrain / Entreprise</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Caissier Référent</label>
                  <input
                    type="text"
                    value={paymentCashierName}
                    onChange={(e) => setPaymentCashierName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPayment ? (
                    <span>Traitement en cours...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Valider &amp; Émettre Reçu Officiel</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DU REÇU OFFICIEL AVEC HISTORIQUE D'ÉCHELONNEMENT & TAMPON DÉFINITIF */}
      <OfficialPaymentReceiptModal
        receipt={receiptToView}
        isOpen={!!receiptToView}
        onClose={() => setReceiptToView(null)}
        allEntityReceipts={allReceipts}
      />
    </div>
  );
}
