"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  UserPlus,
  User,
  MapPin,
  GraduationCap,
  Phone,
  FileText,
  Heart,
  CreditCard,
  Save,
  CheckCircle2,
  AlertCircle,
  Camera,
  Info,
  Sparkles,
  UploadCloud,
  Trash2,
  X,
  Printer,
  FileCheck,
  AlertTriangle,
  Paperclip,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useSchoolYear } from "@/context/SchoolYearContext";
import {
  PROGRAMS,
  NATIONALITIES,
  NEIGHBORHOODS,
  calculateTotalFees,
  generateMatricule,
  generateStudentNumber,
  getNextStudentSequence,
  type DiplomeCode,
} from "@/lib/academic-data";
import { formatFCFA } from "@/lib/utils";
import { StudentRegistrationModal } from "@/components/shared/StudentRegistrationModal";
import { createClient } from "@/lib/supabase/client";
import { Student } from "@/types";
import {
  PhotoUploadZone,
  DocumentUploadManager,
  formatBytes,
  type UploadedFileItem,
  type RequiredDocDef,
} from "@/components/shared/DocumentUploadManager";
import {
  saveAndSyncStudent,
  broadcastDataChange,
  getStoredStudents,
} from "@/lib/realtime-store";

export type UploadedFileMeta = UploadedFileItem;

const REQUIRED_DOCS: RequiredDocDef[] = [
  {
    key: "doc_birth_certificate",
    label: "Extrait d'Acte de Naissance",
    description: "Original ou copie légalisée certifiée conforme",
    required: true,
  },
  {
    key: "doc_id_card",
    label: "Pièce d'Identité / CNI ou Passeport",
    description: "Copie recto-verso de la carte d'identité togolaise ou passeport",
    required: true,
  },
  {
    key: "doc_photos",
    label: "Photos d'Identité 4x4",
    description: "Planche ou photo numérique récente sur fond blanc",
    required: false,
  },
  {
    key: "doc_last_report",
    label: "Dernier Bulletin de Notes / Relevé Scolaire",
    description: "Relevé officiel de l'année précédente pour validation pédagogique",
    required: false,
  },
  {
    key: "doc_medical_certificate",
    label: "Certificat Médical d'Aptitude",
    description: "Certificat d'aptitude médicale aux métiers de l'hôtellerie",
    required: false,
  },
  {
    key: "doc_diploma_copy",
    label: "Copie du Dernier Diplôme Obtenu",
    description: "Attestation ou diplôme (BEPC, BAC, CAP ou équivalent)",
    required: false,
  },
  {
    key: "doc_enrollment_form",
    label: "Fiche d'Inscription Remplie & Signée",
    description: "Exemplaire papier ou PDF portant l'émargement du tuteur",
    required: false,
  },
];

// ═══════════════════════════════════════════════════════════════
// FORMULAIRE D'INSCRIPTION DÉTAILLÉ — Hôtel École Avenida Lomé
// ═══════════════════════════════════════════════════════════════

interface FormData {
  // ── ÉTAT CIVIL ──
  last_name: string;
  first_name: string;
  gender: "M" | "F" | "";
  birth_date: string;
  birth_place: string;
  nationality: string;
  id_card_number: string;
  photo_url: string;

  // ── COORDONNÉES ──
  address: string;
  neighborhood: string;
  city: string;
  phone: string;
  phone_secondary: string;
  email: string;

  // ── INFORMATIONS SCOLAIRES ANTÉRIEURES ──
  previous_school: string;
  last_diploma: string;
  last_class: string;
  average_last_year: string;
  transfer_reason: string;

  // ── FORMATION CHOISIE ──
  program_code: DiplomeCode | "";
  year_level: string;
  specialty: string;
  boarder_status: "interne" | "externe" | "";

  // ── CONTACTS D'URGENCE / RESPONSABLE ──
  parent_father_name: string;
  parent_father_phone: string;
  parent_father_profession: string;
  parent_mother_name: string;
  parent_mother_phone: string;
  parent_mother_profession: string;
  tutor_name: string;
  tutor_phone: string;
  tutor_relation: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_relation: string;

  // ── SANTÉ ──
  blood_group: string;
  allergies: string;
  chronic_conditions: string;
  doctor_name: string;
  doctor_phone: string;

  // ── DOCUMENTS FOURNIS ──
  doc_birth_certificate: boolean;
  doc_id_card: boolean;
  doc_photos: boolean;
  doc_last_report: boolean;
  doc_medical_certificate: boolean;
  doc_diploma_copy: boolean;
  doc_enrollment_form: boolean;

  // ── OBSERVATIONS ──
  observations: string;
}

const INITIAL_FORM: FormData = {
  last_name: "",
  first_name: "",
  gender: "",
  birth_date: "",
  birth_place: "",
  nationality: "Togolaise",
  id_card_number: "",
  photo_url: "",
  address: "",
  neighborhood: "",
  city: "Lomé",
  phone: "",
  phone_secondary: "",
  email: "",
  previous_school: "",
  last_diploma: "",
  last_class: "",
  average_last_year: "",
  transfer_reason: "",
  program_code: "",
  year_level: "",
  specialty: "",
  boarder_status: "",
  parent_father_name: "",
  parent_father_phone: "",
  parent_father_profession: "",
  parent_mother_name: "",
  parent_mother_phone: "",
  parent_mother_profession: "",
  tutor_name: "",
  tutor_phone: "",
  tutor_relation: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_relation: "",
  blood_group: "",
  allergies: "",
  chronic_conditions: "",
  doctor_name: "",
  doctor_phone: "",
  doc_birth_certificate: false,
  doc_id_card: false,
  doc_photos: false,
  doc_last_report: false,
  doc_medical_certificate: false,
  doc_diploma_copy: false,
  doc_enrollment_form: false,
  observations: "",
};

const STEPS = [
  { id: 1, title: "État Civil", icon: User, color: "blue" },
  { id: 2, title: "Coordonnées", icon: MapPin, color: "blue" },
  { id: 3, title: "Parcours Scolaire", icon: FileText, color: "blue" },
  { id: 4, title: "Formation Choisie", icon: GraduationCap, color: "red" },
  { id: 5, title: "Responsables & Urgences", icon: Phone, color: "blue" },
  { id: 6, title: "Santé", icon: Heart, color: "red" },
  { id: 7, title: "Documents Fournis", icon: FileText, color: "blue" },
  { id: 8, title: "Récapitulatif & Frais", icon: CreditCard, color: "red" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Inconnu"];

export default function NewStudentPage() {
  const { selectedYear, selectedYearLabel, availableYears, setSelectedYear } = useSchoolYear();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [enrollmentYear, setEnrollmentYear] = useState(selectedYear);
  const [refreshSeqKey, setRefreshSeqKey] = useState(0);

  // ── Validation & Erreurs ──
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stepValidationError, setStepValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Restauration du brouillon local ──
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("avenida_student_new_draft");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            setForm((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch (err) {
        console.warn("Erreur lecture brouillon:", err);
      }
    }
  }, []);

  // ── Sauvegarde automatique du brouillon ──
  useEffect(() => {
    if (typeof window !== "undefined" && !submitted) {
      try {
        if (form.last_name || form.first_name || form.phone) {
          sessionStorage.setItem("avenida_student_new_draft", JSON.stringify(form));
        }
      } catch {
        // storage fallback
      }
    }
  }, [form, submitted]);

  // ── Fichiers & Pièces Téléversées ──
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFileMeta>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});

  // ── Programme sélectionné ──
  const selectedProgram = useMemo(
    () => PROGRAMS.find((p) => p.code === form.program_code),
    [form.program_code]
  );

  // ── Calcul automatique des frais ──
  const fees = useMemo(() => {
    if (!form.program_code || !form.boarder_status) return null;
    return calculateTotalFees(form.program_code as DiplomeCode, form.boarder_status as "interne" | "externe");
  }, [form.program_code, form.boarder_status]);

  // ── Classe complète générée ──
  const className = form.year_level && form.specialty
    ? `${form.year_level} - ${form.specialty}`
    : "";

  // ── Matricule séquentiel dynamique garanti UNIQUE ──
  const existingStudents = useMemo(() => {
    return getStoredStudents();
  }, [refreshSeqKey, submitted]);

  const nextSequence = useMemo(() => {
    return getNextStudentSequence(existingStudents.map((s) => s.registration_number));
  }, [existingStudents]);

  const matriculePreview = useMemo(() => {
    return generateMatricule(nextSequence, enrollmentYear);
  }, [nextSequence, enrollmentYear]);

  const studentNumberPreview = useMemo(() => {
    return generateStudentNumber(nextSequence, enrollmentYear);
  }, [nextSequence, enrollmentYear]);

  // ── Validation stricte des étapes obligatoires ──
  const validateStep = (stepNumber: number): boolean => {
    const errs: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!form.last_name?.trim()) errs.last_name = "Le nom de famille est obligatoire.";
      if (!form.first_name?.trim()) errs.first_name = "Le prénom est obligatoire.";
      if (!form.gender) errs.gender = "Veuillez choisir le genre (M/F).";
      if (!form.birth_date) errs.birth_date = "La date de naissance est obligatoire.";
      if (!form.birth_place?.trim()) errs.birth_place = "Le lieu de naissance est obligatoire.";
      if (!form.nationality?.trim()) errs.nationality = "La nationalité est obligatoire.";
    } else if (stepNumber === 2) {
      if (!form.address?.trim()) errs.address = "L'adresse complète est obligatoire.";
      if (!form.neighborhood?.trim()) errs.neighborhood = "Le quartier est obligatoire.";
      if (!form.city?.trim()) errs.city = "La ville est obligatoire.";
      if (!form.phone?.trim()) errs.phone = "Le numéro de téléphone principal est obligatoire.";
    } else if (stepNumber === 4) {
      if (!form.program_code) errs.program_code = "Veuillez choisir le diplôme.";
      if (!form.year_level) errs.year_level = "Veuillez choisir le niveau d'année.";
      if (!form.specialty) errs.specialty = "Veuillez choisir la spécialité.";
      if (!form.boarder_status) errs.boarder_status = "Veuillez choisir le régime (Interne/Externe).";
    } else if (stepNumber === 5) {
      const hasEmergencyName = Boolean(form.emergency_contact_name?.trim() || form.parent_father_name?.trim() || form.tutor_name?.trim());
      const hasEmergencyPhone = Boolean(form.emergency_contact_phone?.trim() || form.parent_father_phone?.trim() || form.tutor_phone?.trim());
      if (!hasEmergencyName) {
        errs.emergency_contact_name = "Nom d'urgence ou d'un parent obligatoire.";
      }
      if (!hasEmergencyPhone) {
        errs.emergency_contact_phone = "Téléphone d'urgence obligatoire.";
      }
    }

    setFormErrors(errs);

    if (Object.keys(errs).length > 0) {
      setStepValidationError(
        "Veuillez remplir tous les champs obligatoires (*) de cette étape avant d'accéder à la suite."
      );
      return false;
    }

    setStepValidationError(null);
    return true;
  };

  // ── Helpers de mise à jour ──
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key as string]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[key as string];
        return copy;
      });
    }
    if (stepValidationError) setStepValidationError(null);
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const prevStep = () => {
    setStepValidationError(null);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep < currentStep) {
      setStepValidationError(null);
      setCurrentStep(targetStep);
      return;
    }
    // Pour avancer, vérifier que chaque étape précédente est valide
    for (let s = currentStep; s < targetStep; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }
    setCurrentStep(targetStep);
  };

  // ── Gestion Téléversement Photo d'Identité (Exigences : JPG/PNG/WEBP • Max 3 Mo) ──
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    // 1. Exigence Format
    const validFormats = ["image/jpeg", "image/png", "image/webp"];
    if (!validFormats.includes(file.type)) {
      setPhotoError("Format non supporté. Formats exigés : JPG, PNG ou WEBP.");
      return;
    }

    // 2. Exigence Débit / Taille (Max 3 Mo)
    const maxBytes = 3 * 1024 * 1024;
    if (file.size > maxBytes) {
      setPhotoError(
        `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Le débit maximal autorisé est de 3 Mo.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("photo_url", reader.result);
        setUploadedFiles((prev) => ({
          ...prev,
          photo: {
            key: "photo",
            name: file.name,
            size: file.size,
            formattedSize: formatBytes(file.size),
            type: file.type,
            dataUrl: reader.result as string,
          },
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateField("photo_url", "");
    setPhotoError(null);
    setUploadedFiles((prev) => {
      const copy = { ...prev };
      delete copy.photo;
      return copy;
    });
  };

  // ── Gestion Téléversement Documents Requis (Exigences : PDF/JPG/PNG/DOCX • Max 5 Mo) ──
  const handleDocumentUpload = (docKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocErrors((prev) => ({ ...prev, [docKey]: "" }));

    // 1. Exigence Formats
    const validExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".docx"];
    const fileExt = "." + (file.name.split(".").pop() || "").toLowerCase();
    const validMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!validMimes.includes(file.type) && !validExtensions.includes(fileExt)) {
      setDocErrors((prev) => ({
        ...prev,
        [docKey]: `Format "${fileExt}" non supporté. Exigences : PDF, JPG, PNG, WEBP, DOCX.`,
      }));
      return;
    }

    // 2. Exigence Débit / Taille (Max 5 Mo)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setDocErrors((prev) => ({
        ...prev,
        [docKey]: `Débit dépassé : ${(file.size / (1024 * 1024)).toFixed(1)} Mo. Le débit maximal autorisé est de 5 Mo par document.`,
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
      setUploadedFiles((prev) => ({
        ...prev,
        [docKey]: {
          key: docKey,
          name: file.name,
          size: file.size,
          formattedSize: formatBytes(file.size),
          type: file.type || fileExt,
          dataUrl,
        },
      }));
      // Coche automatiquement le document comme fourni
      updateField(docKey as any, true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDocument = (docKey: string) => {
    setUploadedFiles((prev) => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
    setDocErrors((prev) => ({ ...prev, [docKey]: "" }));
    updateField(docKey as any, false);
  };

  const handleSubmit = async () => {
    // 1. Validation intégrale de toutes les étapes obligatoires
    for (const stepNum of [1, 2, 4, 5]) {
      if (!validateStep(stepNum)) {
        setCurrentStep(stepNum);
        return;
      }
    }

    setIsSubmitting(true);

    // 2. Calcul du matricule unique en temps réel
    const currentList = getStoredStudents();
    const finalSequence = getNextStudentSequence(currentList.map((s) => s.registration_number));
    const finalMatricule = generateMatricule(finalSequence, enrollmentYear);
    const finalStudentNumber = generateStudentNumber(finalSequence, enrollmentYear);

    const studentData: Student = {
      id: `std-${Date.now()}`,
      registration_number: finalMatricule,
      student_number: finalStudentNumber,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      gender: (form.gender || "M") as "M" | "F",
      birth_date: form.birth_date,
      birth_place: form.birth_place,
      nationality: form.nationality || "Togolaise",
      residence_neighborhood: form.neighborhood || form.city || "Lomé (Dékon)",
      phone: form.phone,
      email: form.email || `${form.first_name.toLowerCase().replace(/\s+/g, '')}.${form.last_name.toLowerCase().replace(/\s+/g, '')}@ecole-avenida.tg`,
      boarder_status: (form.boarder_status || "externe") as "interne" | "externe",
      emergency_contact_name: form.emergency_contact_name || form.parent_father_name || form.tutor_name || "Direction Avenida",
      emergency_contact_phone: form.emergency_contact_phone || form.parent_father_phone || form.tutor_phone || "+228 22 21 00 00",
      program_code: (form.program_code || "BTS") as DiplomeCode,
      class_name: className || "1ère Année Hôtellerie",
      academic_year: availableYears.find((y) => y.value === enrollmentYear)?.label || "2024 - 2025",
      status: "actif",
      photo_url: form.photo_url || "/avatars/default.png",
      total_fee: fees?.total || 370000,
      paid_fee: fees?.registration || 50000,
      remaining_fee: Math.max(0, (fees?.total || 370000) - (fees?.registration || 50000)),
      uploaded_documents: uploadedFiles,
      id_card_number: form.id_card_number || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      phone_secondary: form.phone_secondary || undefined,
      previous_school: form.previous_school || undefined,
      last_diploma: form.last_diploma || undefined,
      last_class: form.last_class || undefined,
      average_last_year: form.average_last_year || undefined,
      transfer_reason: form.transfer_reason || undefined,
      year_level: form.year_level || undefined,
      specialty: form.specialty || undefined,
      parent_father_name: form.parent_father_name || undefined,
      parent_father_phone: form.parent_father_phone || undefined,
      parent_father_profession: form.parent_father_profession || undefined,
      parent_mother_name: form.parent_mother_name || undefined,
      parent_mother_phone: form.parent_mother_phone || undefined,
      parent_mother_profession: form.parent_mother_profession || undefined,
      tutor_name: form.tutor_name || undefined,
      tutor_phone: form.tutor_phone || undefined,
      tutor_profession: form.tutor_profession || undefined,
      tutor_relation: form.tutor_relation || undefined,
      blood_group: form.blood_group || undefined,
      allergies: form.allergies || undefined,
      medical_notes: form.medical_notes || undefined,
      payment_method: form.payment_method || undefined,
      registration_fee: Number(form.registration_fee) || fees?.registration || 50000,
      installments_count: Number(form.installments_count) || 1,
      notes: form.notes || undefined,
      raw_data: { ...form },
    };

    try {
      // Sauvegarde locale + synchronisation Supabase avec retour
      await saveAndSyncStudent(studentData);
      broadcastDataChange();

      // Nettoyer le brouillon
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("avenida_student_new_draft");
      }

      setCreatedStudent(studentData);
      setSubmitted(true);
      setRefreshSeqKey((k) => k + 1);
    } catch (err) {
      console.error("Erreur enregistrement élève:", err);
      setStepValidationError("Une erreur est survenue lors de l'enregistrement de l'élève. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════
  // RENDU DU FORMULAIRE
  // ═══════════════════════════════════════════════════

  if (submitted && createdStudent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-emerald-200 shadow-xl text-center max-w-xl space-y-5 animate-in fade-in duration-300">
          {createdStudent.photo_url && createdStudent.photo_url !== "/avatars/default.png" ? (
            <div className="w-24 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md relative bg-slate-100">
              <img
                src={createdStudent.photo_url}
                alt={`${createdStudent.first_name} ${createdStudent.last_name}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-1 shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
          )}
          <h2 className="text-2xl font-black text-[#0C356A] font-serif">
            Inscription Validée avec Succès !
          </h2>
          <p className="text-sm text-slate-600">
            L&apos;élève <strong>{createdStudent.last_name} {createdStudent.first_name}</strong> a été inscrit(e) sous le matricule{" "}
            <span className="font-mono font-black text-[#DC2626] bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              {createdStudent.registration_number}
            </span>{" "}
            pour l&apos;année scolaire <strong>{createdStudent.academic_year}</strong>.
          </p>
          <div className="text-xs text-slate-600 bg-blue-50 rounded-2xl p-4 border border-blue-200 text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Classe & Filière :</span>
              <strong>{createdStudent.class_name} ({createdStudent.program_code})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Régime Scolaire :</span>
              <strong className="capitalize">{createdStudent.boarder_status}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pièces Justificatives :</span>
              <strong className="text-emerald-700">
                {Object.keys(uploadedFiles).filter((k) => k !== "photo").length} document(s) numérisé(s) & joint(s)
              </strong>
            </div>
            <div className="flex justify-between border-t border-blue-200 pt-1.5 font-bold">
              <span className="text-slate-700">Total Frais Annuels :</span>
              <span className="text-[#0C356A] font-mono text-sm">{formatFCFA(createdStudent.total_fee)}</span>
            </div>
          </div>

          {/* Actions d'impression & navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => setIsReceiptOpen(true)}
              className="w-full sm:w-auto px-5 py-3 bg-[#DC2626] hover:bg-[#b91c1c] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Imprimer la Fiche d&apos;Inscription (PDF)</span>
            </button>
            <Link
              href="/dashboard/students"
              className="w-full sm:w-auto px-5 py-3 bg-[#0C356A] text-white rounded-xl font-bold text-sm hover:bg-[#164E87] transition-colors flex items-center justify-center"
            >
              Voir la Liste des Élèves
            </Link>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setSubmitted(false);
                setCreatedStudent(null);
                setForm(INITIAL_FORM);
                setUploadedFiles({});
                setFormErrors({});
                setStepValidationError(null);
                setCurrentStep(1);
                setRefreshSeqKey((k) => k + 1);
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("avenida_student_new_draft");
                }
              }}
              className="text-xs text-[#0C356A] hover:text-[#DC2626] font-bold underline transition-colors cursor-pointer"
            >
              + Inscrire un autre élève (Nouveau Matricule Garanti)
            </button>
          </div>
        </div>

        {/* Modal d'impression officielle */}
        <StudentRegistrationModal
          student={createdStudent}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          enrollmentDetails={{
            fees: fees || undefined,
            specialty: form.specialty,
            parentName: form.parent_father_name || form.tutor_name || form.parent_mother_name,
            parentPhone: form.parent_father_phone || form.tutor_phone || form.parent_mother_phone,
            bloodGroup: form.blood_group,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ══════ HEADER ══════ */}
      <div className="bg-white p-6 rounded-3xl border-2 border-blue-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/students"
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0C356A] px-2 py-0.5 rounded-full">
                  NOUVELLE INSCRIPTION
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                  Formulaire Complet
                </span>
              </div>
              <h1 className="text-2xl font-black text-[#0C356A] font-serif mt-1">
                Dossier d&apos;Inscription Élève
              </h1>
            </div>
          </div>

          {/* Sélecteur année d'inscription */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-xs">
              <label className="font-bold text-[#0C356A] block mb-1">Année d&apos;inscription</label>
              <select
                value={enrollmentYear}
                onChange={(e) => setEnrollmentYear(e.target.value)}
                className="bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs font-bold text-[#0C356A] focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 w-full"
              >
                {availableYears.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label} {y.status === "en_cours" ? "● En cours" : y.status === "passée" ? "(Archive)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-center">
              <span className="text-slate-500 block text-[10px]">Matricule prévu</span>
              <span className="font-mono font-bold text-[#DC2626]">{matriculePreview}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ PROGRESS STEPS ══════ */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between overflow-x-auto gap-1">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#0C356A] text-white shadow-sm scale-105"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="hidden lg:inline">{step.title}</span>
                <span className="lg:hidden">{step.id}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════ CONTENU DU FORMULAIRE ══════ */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs min-h-[500px]">

        {/* ─── ÉTAPE 1 : ÉTAT CIVIL ─── */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <SectionHeader icon={User} title="État Civil de l'Élève" subtitle="Informations d'identité officielles" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormField label="Nom de famille *" required error={formErrors.last_name}>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => updateField("last_name", e.target.value.toUpperCase())}
                  placeholder="Ex: PINHEIRO"
                  className={`form-input-avenida ${formErrors.last_name ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                />
              </FormField>

              <FormField label="Prénom(s) *" required error={formErrors.first_name}>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  placeholder="Ex: Oswaldo Sam-will"
                  className={`form-input-avenida ${formErrors.first_name ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                />
              </FormField>

              <FormField label="Genre *" required error={formErrors.gender}>
                <select
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value as "M" | "F")}
                  className={`form-input-avenida ${formErrors.gender ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </FormField>

              <FormField label="Date de naissance *" required error={formErrors.birth_date}>
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => updateField("birth_date", e.target.value)}
                  className={`form-input-avenida ${formErrors.birth_date ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                />
              </FormField>

              <FormField label="Lieu de naissance *" required error={formErrors.birth_place}>
                <input
                  type="text"
                  value={form.birth_place}
                  onChange={(e) => updateField("birth_place", e.target.value)}
                  placeholder="Ex: Lomé, Kpalimé, Aného..."
                  className={`form-input-avenida ${formErrors.birth_place ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                />
              </FormField>

              <FormField label="Nationalité *" required error={formErrors.nationality}>
                <select
                  value={form.nationality}
                  onChange={(e) => updateField("nationality", e.target.value)}
                  className={`form-input-avenida ${formErrors.nationality ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                >
                  <option value="">-- Sélectionner la nationalité --</option>
                  {NATIONALITIES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="N° Pièce d'identité (CNI / Passeport)">
                <input
                  type="text"
                  value={form.id_card_number}
                  onChange={(e) => updateField("id_card_number", e.target.value)}
                  placeholder="Ex: TG-LOM-2022-8941"
                  className="form-input-avenida"
                />
              </FormField>

              <div className="md:col-span-2 lg:col-span-3">
                <PhotoUploadZone
                  currentPhotoUrl={form.photo_url}
                  onPhotoChange={(url, meta) => {
                    updateField("photo_url", url);
                    if (meta) {
                      setUploadedFiles((prev) => ({ ...prev, photo: meta as any }));
                    } else {
                      setUploadedFiles((prev) => {
                        const next = { ...prev };
                        delete next.photo;
                        return next;
                      });
                    }
                  }}
                  label="Photo d'Identité Officielle de l'Élève (Format 4x4)"
                  sublabel="Photo récente sur fond blanc pour badge, relevé et fiche d'inscription officielle"
                  required={false}
                  shape="portrait"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 2 : COORDONNÉES ─── */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <SectionHeader icon={MapPin} title="Coordonnées & Résidence" subtitle="Adresse et moyens de contact de l'élève" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormField label="Adresse complète *" required error={formErrors.address} className="lg:col-span-2">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Ex: 30, Rue d'Almeida Leopold"
                  className={`form-input-avenida ${formErrors.address ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                />
              </FormField>

              <FormField label="Quartier *" required error={formErrors.neighborhood}>
                <select
                  value={form.neighborhood}
                  onChange={(e) => updateField("neighborhood", e.target.value)}
                  className={`form-input-avenida ${formErrors.neighborhood ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                >
                  <option value="">-- Sélectionner le quartier --</option>
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Ville *" required error={formErrors.city}>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Lomé"
                  className={`form-input-avenida ${formErrors.city ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                />
              </FormField>

              <FormField label="Téléphone principal *" required error={formErrors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="Ex: 91 42 46 45"
                  className={`form-input-avenida ${formErrors.phone ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                />
              </FormField>

              <FormField label="Téléphone secondaire">
                <input type="tel" value={form.phone_secondary} onChange={(e) => updateField("phone_secondary", e.target.value)}
                  placeholder="Ex: 96 24 88 77" className="form-input-avenida" />
              </FormField>

              <FormField label="Email">
                <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)}
                  placeholder="eleve@ecole-avenida.tg" className="form-input-avenida" />
              </FormField>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 3 : PARCOURS SCOLAIRE ANTÉRIEUR ─── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <SectionHeader icon={FileText} title="Parcours Scolaire Antérieur" subtitle="Informations sur le cursus précédent de l'élève" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Dernier établissement fréquenté">
                <input type="text" value={form.previous_school} onChange={(e) => updateField("previous_school", e.target.value)}
                  placeholder="Nom de l'école ou du lycée" className="form-input-avenida" />
              </FormField>

              <FormField label="Dernier diplôme obtenu">
                <select value={form.last_diploma} onChange={(e) => updateField("last_diploma", e.target.value)} className="form-input-avenida">
                  <option value="">-- Sélectionner --</option>
                  <option value="CEP">CEP (Certificat d&apos;Études Primaires)</option>
                  <option value="BEPC">BEPC</option>
                  <option value="BAC">BAC</option>
                  <option value="BT">BT (Brevet de Technicien)</option>
                  <option value="CAP">CAP</option>
                  <option value="BEP">BEP</option>
                  <option value="Aucun">Aucun</option>
                  <option value="Autre">Autre</option>
                </select>
              </FormField>

              <FormField label="Dernière classe fréquentée">
                <input type="text" value={form.last_class} onChange={(e) => updateField("last_class", e.target.value)}
                  placeholder="Ex: 3ème, Terminale, BT2..." className="form-input-avenida" />
              </FormField>

              <FormField label="Moyenne générale dernière année">
                <input type="text" value={form.average_last_year} onChange={(e) => updateField("average_last_year", e.target.value)}
                  placeholder="Ex: 12.50 / 20" className="form-input-avenida" />
              </FormField>

              <FormField label="Motif de la demande d'inscription" className="md:col-span-2">
                <textarea value={form.transfer_reason} onChange={(e) => updateField("transfer_reason", e.target.value)}
                  placeholder="Pourquoi l'élève souhaite intégrer l'Hôtel École Avenida ?"
                  className="form-input-avenida min-h-[80px] resize-none" />
              </FormField>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 4 : FORMATION CHOISIE ─── */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <SectionHeader icon={GraduationCap} title="Formation & Classe" subtitle="Choix du diplôme, niveau et spécialité" color="red" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Diplôme */}
              <FormField label="Diplôme visé *" required error={formErrors.program_code}>
                <select
                  value={form.program_code}
                  onChange={(e) => {
                    const code = e.target.value as DiplomeCode;
                    updateField("program_code", code);
                    updateField("year_level", "");
                    updateField("specialty", "");
                  }}
                  className={`form-input-avenida ${formErrors.program_code ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                >
                  <option value="">-- Choisir le diplôme --</option>
                  {PROGRAMS.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.fullName} — {p.durationYears} an{p.durationYears > 1 ? "s" : ""} (Entrée: {p.entryLevel})
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Niveau d'année */}
              <FormField label="Niveau / Année *" required error={formErrors.year_level}>
                <select
                  value={form.year_level}
                  onChange={(e) => updateField("year_level", e.target.value)}
                  disabled={!selectedProgram}
                  className={`form-input-avenida ${formErrors.year_level ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                >
                  <option value="">-- Choisir le niveau --</option>
                  {selectedProgram?.yearLevels.map((yl) => (
                    <option key={yl} value={yl}>{yl}</option>
                  ))}
                </select>
              </FormField>

              {/* Spécialité */}
              <FormField label="Spécialité *" required error={formErrors.specialty}>
                <select
                  value={form.specialty}
                  onChange={(e) => updateField("specialty", e.target.value)}
                  disabled={!selectedProgram}
                  className={`form-input-avenida ${formErrors.specialty ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                >
                  <option value="">-- Choisir la spécialité --</option>
                  {selectedProgram?.specialties.map((sp) => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </FormField>

              {/* Régime */}
              <FormField label="Régime (Interne / Externe) *" required error={formErrors.boarder_status}>
                <select
                  value={form.boarder_status}
                  onChange={(e) => updateField("boarder_status", e.target.value as "interne" | "externe")}
                  className={`form-input-avenida ${formErrors.boarder_status ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="externe">Externe (sans hébergement)</option>
                  <option value="interne">Interne (avec hébergement à l&apos;école)</option>
                </select>
              </FormField>
            </div>

            {/* Aperçu de la classe et des frais */}
            {selectedProgram && form.year_level && form.specialty && (
              <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-red-50/30 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#0C356A]" />
                  <span className="text-sm font-black text-[#0C356A]">Aperçu de l&apos;inscription</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <span className="text-slate-500 block">Classe</span>
                    <span className="font-bold text-[#0C356A]">{className}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <span className="text-slate-500 block">Année scolaire</span>
                    <span className="font-bold text-[#0C356A]">{availableYears.find(y => y.value === enrollmentYear)?.label}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <span className="text-slate-500 block">Matricule prévu</span>
                    <span className="font-mono font-bold text-[#DC2626]">{matriculePreview}</span>
                  </div>
                  {fees && (
                    <div className="bg-white rounded-xl p-3 border border-red-200">
                      <span className="text-slate-500 block">Total frais</span>
                      <span className="font-bold text-[#DC2626]">{formatFCFA(fees.total)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── ÉTAPE 5 : RESPONSABLES & URGENCES ─── */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <SectionHeader icon={Phone} title="Responsables Légaux & Contacts d'Urgence" subtitle="Père, mère, tuteur et personne à prévenir en cas d'urgence" />

            {/* Père */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-4">
              <h3 className="text-sm font-bold text-[#0C356A] flex items-center gap-2">
                <User className="w-4 h-4" /> Père
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Nom complet du père">
                  <input type="text" value={form.parent_father_name} onChange={(e) => updateField("parent_father_name", e.target.value)}
                    placeholder="Nom et prénoms" className="form-input-avenida" />
                </FormField>
                <FormField label="Téléphone du père">
                  <input type="tel" value={form.parent_father_phone} onChange={(e) => updateField("parent_father_phone", e.target.value)}
                    placeholder="Ex: 90 64 00 00" className="form-input-avenida" />
                </FormField>
                <FormField label="Profession du père">
                  <input type="text" value={form.parent_father_profession} onChange={(e) => updateField("parent_father_profession", e.target.value)}
                    placeholder="Ex: Commerçant, Enseignant..." className="form-input-avenida" />
                </FormField>
              </div>
            </div>

            {/* Mère */}
            <div className="p-4 bg-red-50/30 rounded-2xl border border-red-200 space-y-4">
              <h3 className="text-sm font-bold text-[#DC2626] flex items-center gap-2">
                <User className="w-4 h-4" /> Mère
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Nom complet de la mère">
                  <input type="text" value={form.parent_mother_name} onChange={(e) => updateField("parent_mother_name", e.target.value)}
                    placeholder="Nom et prénoms" className="form-input-avenida" />
                </FormField>
                <FormField label="Téléphone de la mère">
                  <input type="tel" value={form.parent_mother_phone} onChange={(e) => updateField("parent_mother_phone", e.target.value)}
                    placeholder="Ex: 92 98 44 33" className="form-input-avenida" />
                </FormField>
                <FormField label="Profession de la mère">
                  <input type="text" value={form.parent_mother_profession} onChange={(e) => updateField("parent_mother_profession", e.target.value)}
                    placeholder="Ex: Couturière, Infirmière..." className="form-input-avenida" />
                </FormField>
              </div>
            </div>

            {/* Tuteur */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4" /> Tuteur / Responsable légal (si différent des parents)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Nom complet du tuteur">
                  <input type="text" value={form.tutor_name} onChange={(e) => updateField("tutor_name", e.target.value)}
                    placeholder="Nom et prénoms" className="form-input-avenida" />
                </FormField>
                <FormField label="Téléphone du tuteur">
                  <input type="tel" value={form.tutor_phone} onChange={(e) => updateField("tutor_phone", e.target.value)}
                    className="form-input-avenida" />
                </FormField>
                <FormField label="Lien de parenté">
                  <input type="text" value={form.tutor_relation} onChange={(e) => updateField("tutor_relation", e.target.value)}
                    placeholder="Ex: Oncle, Grand-mère..." className="form-input-avenida" />
                </FormField>
              </div>
            </div>

            {/* Urgence */}
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-4">
              <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Personne à contacter en cas d&apos;urgence *
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Nom complet *" required error={formErrors.emergency_contact_name}>
                  <input
                    type="text"
                    value={form.emergency_contact_name}
                    onChange={(e) => updateField("emergency_contact_name", e.target.value)}
                    placeholder="Ex: PINHEIRO Jean"
                    className={`form-input-avenida ${formErrors.emergency_contact_name ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                  />
                </FormField>
                <FormField label="Téléphone *" required error={formErrors.emergency_contact_phone}>
                  <input
                    type="tel"
                    value={form.emergency_contact_phone}
                    onChange={(e) => updateField("emergency_contact_phone", e.target.value)}
                    placeholder="Ex: 90 00 00 00"
                    className={`form-input-avenida ${formErrors.emergency_contact_phone ? "border-red-500 bg-red-50/30 ring-2 ring-red-400/20" : ""}`}
                  />
                </FormField>
                <FormField label="Relation">
                  <input type="text" value={form.emergency_relation} onChange={(e) => updateField("emergency_relation", e.target.value)}
                    placeholder="Ex: Parent, Oncle, Voisin..." className="form-input-avenida" />
                </FormField>
              </div>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 6 : SANTÉ ─── */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <SectionHeader icon={Heart} title="Informations Médicales & Santé" subtitle="Données confidentielles pour la sécurité de l'élève" color="red" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormField label="Groupe sanguin">
                <select value={form.blood_group} onChange={(e) => updateField("blood_group", e.target.value)} className="form-input-avenida">
                  <option value="">-- Sélectionner --</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Allergies connues">
                <input type="text" value={form.allergies} onChange={(e) => updateField("allergies", e.target.value)}
                  placeholder="Ex: Arachides, Poussière, Aucune..." className="form-input-avenida" />
              </FormField>

              <FormField label="Maladies chroniques">
                <input type="text" value={form.chronic_conditions} onChange={(e) => updateField("chronic_conditions", e.target.value)}
                  placeholder="Ex: Asthme, Diabète, Aucune..." className="form-input-avenida" />
              </FormField>

              <FormField label="Médecin traitant">
                <input type="text" value={form.doctor_name} onChange={(e) => updateField("doctor_name", e.target.value)}
                  placeholder="Dr. ..." className="form-input-avenida" />
              </FormField>

              <FormField label="Téléphone du médecin">
                <input type="tel" value={form.doctor_phone} onChange={(e) => updateField("doctor_phone", e.target.value)}
                  className="form-input-avenida" />
              </FormField>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 7 : DOCUMENTS FOURNIS & TÉLÉVERSEMENT ─── */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <SectionHeader
              icon={FileText}
              title="Pièces Justificatives & Dossier d'Inscription"
              subtitle="Téléversez les documents numériques demandés ou confirmez leur remise physique"
            />

            {/* Gestionnaire Officiel des Pièces Justificatives avec Exigences de Format & Débit */}
            <DocumentUploadManager
              requiredDefs={REQUIRED_DOCS}
              uploadedFiles={uploadedFiles}
              onFilesChange={(files) => {
                setUploadedFiles(files);
                REQUIRED_DOCS.forEach((d) => {
                  if (files[d.key]) {
                    updateField(d.key as any, true);
                  }
                });
              }}
              title="Pièces Justificatives & Dossier Numérisé"
              subtitle="Contrôle de conformité officiel : Formats PDF, JPG, PNG, WEBP, DOCX • Débit max 5 Mo par document"
              allowCustomDocs={true}
            />

            <FormField label="Observations Administratives / Remarques sur le Dossier">
              <textarea
                value={form.observations}
                onChange={(e) => updateField("observations", e.target.value)}
                placeholder="Ex: Acte de naissance original vérifié et restitué aux parents, dispense médicale temporaire..."
                className="form-input-avenida min-h-[90px] resize-none"
              />
            </FormField>
          </div>
        )}

        {/* ─── ÉTAPE 8 : RÉCAPITULATIF ─── */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <SectionHeader icon={CreditCard} title="Récapitulatif & Frais de Scolarité" subtitle="Vérifiez toutes les informations avant validation" color="red" />

            {/* Résumé identité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <RecapCard title="Identité de l'Élève">
                {form.photo_url && (
                  <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-100">
                    <div className="w-14 h-16 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-sm shrink-0 bg-slate-100">
                      <img src={form.photo_url} alt="Photo élève" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Photo 4x4 validée
                      </span>
                      {uploadedFiles.photo && (
                        <p className="text-[10px] text-slate-500 font-mono">
                          {uploadedFiles.photo.name} ({uploadedFiles.photo.formattedSize})
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <RecapLine label="Nom" value={`${form.last_name} ${form.first_name}`} />
                <RecapLine label="Genre" value={form.gender === "M" ? "Masculin" : form.gender === "F" ? "Féminin" : "—"} />
                <RecapLine label="Né(e) le" value={form.birth_date || "—"} />
                <RecapLine label="Lieu" value={form.birth_place || "—"} />
                <RecapLine label="Nationalité" value={form.nationality} />
              </RecapCard>

              <RecapCard title="Coordonnées">
                <RecapLine label="Adresse" value={form.address || "—"} />
                <RecapLine label="Quartier" value={form.neighborhood || "—"} />
                <RecapLine label="Ville" value={form.city} />
                <RecapLine label="Tél." value={form.phone || "—"} />
                <RecapLine label="Email" value={form.email || "—"} />
              </RecapCard>

              <RecapCard title="Formation">
                <RecapLine label="Diplôme" value={selectedProgram?.fullName || "—"} />
                <RecapLine label="Classe" value={className || "—"} />
                <RecapLine label="Régime" value={form.boarder_status || "—"} />
                <RecapLine label="Année" value={availableYears.find(y => y.value === enrollmentYear)?.label || "—"} />
                <RecapLine label="Matricule" value={matriculePreview} highlight />
              </RecapCard>

              <RecapCard title="Responsables">
                <RecapLine label="Père" value={form.parent_father_name || "—"} />
                <RecapLine label="Mère" value={form.parent_mother_name || "—"} />
                <RecapLine label="Tuteur" value={form.tutor_name || "—"} />
                <RecapLine label="Urgence" value={form.emergency_contact_name || "—"} />
              </RecapCard>
            </div>

            {/* Détail des frais */}
            {fees && (
              <div className="p-5 bg-gradient-to-r from-[#0C356A] to-[#164E87] rounded-2xl text-white space-y-4">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-300" />
                  Détail des Frais — Année {availableYears.find(y => y.value === enrollmentYear)?.label}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <FeeItem label="Inscription" amount={fees.registration} />
                  <FeeItem label="Scolarité annuelle" amount={fees.tuition} />
                  <FeeItem label="Fournitures" amount={fees.supplies} />
                  {form.boarder_status === "interne" && (
                    <>
                      <FeeItem label="Internat" amount={fees.boarding} />
                      <FeeItem label="Caution internat" amount={fees.boardingDeposit} />
                    </>
                  )}
                </div>
                <div className="border-t border-white/30 pt-3 flex items-center justify-between">
                  <span className="text-sm font-bold">TOTAL À PAYER</span>
                  <span className="text-2xl font-black text-amber-300">{formatFCFA(fees.total)}</span>
                </div>
              </div>
            )}

            {/* Documents & Pièces Jointes */}
            <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#0C356A] flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  État du Dossier & Pièces Justificatives
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {Object.keys(uploadedFiles).filter((k) => k !== "photo").length} pièce(s) numérique(s) rattachée(s)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {REQUIRED_DOCS.map((doc) => {
                  const uploaded = uploadedFiles[doc.key];
                  const isPaper = form[doc.key as keyof FormData];

                  if (uploaded) {
                    return (
                      <div
                        key={doc.key}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold truncate">{doc.label}</p>
                            <p className="text-[10px] text-emerald-700 truncate">{uploaded.name}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] bg-emerald-200/80 px-1.5 py-0.5 rounded font-bold shrink-0">
                          {uploaded.formattedSize}
                        </span>
                      </div>
                    );
                  }

                  if (isPaper) {
                    return (
                      <div
                        key={doc.key}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <p className="font-bold truncate">{doc.label}</p>
                        </div>
                        <span className="text-[10px] bg-blue-200/80 px-1.5 py-0.5 rounded font-semibold shrink-0">
                          Version papier
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={doc.key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400"
                    >
                      <span className="truncate">{doc.label}</span>
                      <span className="text-[10px] text-slate-400 italic">
                        {doc.required ? "Manquant (À fournir)" : "Non fourni"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════ BANNIÈRE D'ERREUR DE VALIDATION D'ÉTAPE ══════ */}
        {stepValidationError && (
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-center gap-3 text-xs text-red-900 font-bold animate-in fade-in slide-in-from-bottom-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <p>{stepValidationError}</p>
              <p className="text-[11px] font-normal text-red-600 mt-0.5">
                Remplissez les champs encadrés en rouge ci-dessus pour pouvoir continuer.
              </p>
            </div>
          </div>
        )}

        {/* ══════ NAVIGATION STEPS ══════ */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              currentStep === 1
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 cursor-pointer"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Précédent
          </button>

          <span className="text-xs font-bold text-slate-400">
            Étape {currentStep} / {STEPS.length}
          </span>

          {currentStep < STEPS.length ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0C356A] text-white rounded-xl font-bold text-sm hover:bg-[#164E87] active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 bg-[#DC2626] text-white rounded-xl font-bold text-sm hover:bg-[#b91c1c] active:scale-95 transition-all shadow-md shadow-red-900/20 cursor-pointer ${
                isSubmitting ? "opacity-75 cursor-wait" : ""
              }`}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSubmitting ? "Enregistrement en cours..." : "Valider l'Inscription"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SOUS-COMPOSANTS RÉUTILISABLES
// ═══════════════════════════════════════════════════

function SectionHeader({ icon: Icon, title, subtitle, color = "blue" }: {
  icon: any; title: string; subtitle: string; color?: "blue" | "red";
}) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        color === "red" ? "bg-[#DC2626] text-white" : "bg-[#0C356A] text-white"
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-lg font-black text-[#0C356A] font-serif">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
        <span className="flex items-center gap-1">
          {label}
          {required && <span className="text-[#DC2626] font-black">*</span>}
        </span>
        {error && (
          <span className="text-[10px] text-red-600 font-bold flex items-center gap-1 animate-in fade-in">
            <AlertCircle className="w-3 h-3 text-red-600 inline shrink-0" />
            {error}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function RecapCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
      <h3 className="text-xs font-black text-[#0C356A] uppercase tracking-wider">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function RecapLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={highlight ? "font-mono font-bold text-[#DC2626]" : "font-semibold text-slate-800"}>{value}</span>
    </div>
  );
}

function FeeItem({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="bg-white/10 rounded-xl p-2.5 text-center">
      <span className="text-[10px] text-blue-100 block">{label}</span>
      <span className="text-sm font-bold">{formatFCFA(amount)}</span>
    </div>
  );
}

function DocBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" />
      {children}
    </span>
  );
}
