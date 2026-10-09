"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { useSchoolYear } from "@/context/SchoolYearContext";
import {
  PROGRAMS,
  NATIONALITIES,
  NEIGHBORHOODS,
  calculateTotalFees,
  generateMatricule,
  generateStudentNumber,
  type DiplomeCode,
} from "@/lib/academic-data";
import { formatFCFA } from "@/lib/utils";
import { StudentRegistrationModal } from "@/components/shared/StudentRegistrationModal";
import { createClient } from "@/lib/supabase/client";
import { Student } from "@/types";
import { Printer } from "lucide-react";

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

  // ── Matricule preview ──
  const matriculePreview = generateMatricule(818, enrollmentYear);
  const studentNumberPreview = generateStudentNumber(818, enrollmentYear);

  // ── Helpers ──
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    const studentData: Student = {
      id: `std-${Date.now()}`,
      registration_number: matriculePreview,
      student_number: studentNumberPreview,
      first_name: form.first_name || "Élève",
      last_name: form.last_name || "AVENIDA",
      gender: (form.gender || "M") as "M" | "F",
      birth_date: form.birth_date || "2006-01-15",
      birth_place: form.birth_place || "Lomé",
      nationality: form.nationality || "Togolaise",
      residence_neighborhood: form.neighborhood || form.city || "Lomé (Dékon)",
      phone: form.phone || "+228 90 00 00 00",
      email: form.email || `${form.first_name.toLowerCase()}.${form.last_name.toLowerCase()}@ecole-avenida.tg`,
      boarder_status: (form.boarder_status || "externe") as "interne" | "externe",
      emergency_contact_name: form.emergency_contact_name || form.parent_father_name || "Direction Avenida",
      emergency_contact_phone: form.emergency_contact_phone || form.parent_father_phone || "+228 22 21 00 00",
      program_code: (form.program_code || "BTS") as DiplomeCode,
      class_name: className || "1ère Année Hôtellerie",
      academic_year: availableYears.find((y) => y.value === enrollmentYear)?.label || "2024 - 2025",
      status: "actif",
      photo_url: form.photo_url || "/avatars/default.png",
      total_fee: fees?.total || 370000,
      paid_fee: fees?.registration || 50000,
      remaining_fee: Math.max(0, (fees?.total || 370000) - (fees?.registration || 50000)),
    };

    // 1. Sauvegarde locale immédiate (réactivité instantanée garantie)
    try {
      const stored = localStorage.getItem("avenida_custom_students");
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem("avenida_custom_students", JSON.stringify([studentData, ...list]));
    } catch (e) {
      console.warn("Erreur localStorage:", e);
    }

    // 2. Sauvegarde Supabase en tâche de fond si connecté
    try {
      const supabase = createClient();
      await supabase.from("students").insert({
        registration_number: studentData.registration_number,
        student_number: studentData.student_number,
        first_name: studentData.first_name,
        last_name: studentData.last_name,
        gender: studentData.gender,
        birth_date: studentData.birth_date || null,
        birth_place: studentData.birth_place || null,
        nationality: studentData.nationality,
        residence_neighborhood: studentData.residence_neighborhood,
        phone: studentData.phone,
        email: studentData.email,
        boarder_status: studentData.boarder_status,
        emergency_contact_name: studentData.emergency_contact_name,
        emergency_contact_phone: studentData.emergency_contact_phone,
        status: "actif",
      });
    } catch (err) {
      console.warn("Synchronisation Supabase (mode déconnecté / fallback actif):", err);
    }

    setCreatedStudent(studentData);
    setSubmitted(true);
  };

  // ═══════════════════════════════════════════════════
  // RENDU DU FORMULAIRE
  // ═══════════════════════════════════════════════════

  if (submitted && createdStudent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-emerald-200 shadow-xl text-center max-w-xl space-y-5 animate-in fade-in duration-300">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
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
                setCurrentStep(1);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold underline transition-colors"
            >
              + Inscrire un autre élève
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
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 whitespace-nowrap ${
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
              <FormField label="Nom de famille *" required>
                <input type="text" value={form.last_name} onChange={(e) => updateField("last_name", e.target.value.toUpperCase())}
                  placeholder="Ex: PINHEIRO" className="form-input-avenida" />
              </FormField>

              <FormField label="Prénom(s) *" required>
                <input type="text" value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)}
                  placeholder="Ex: Oswaldo Sam-will" className="form-input-avenida" />
              </FormField>

              <FormField label="Genre *" required>
                <select value={form.gender} onChange={(e) => updateField("gender", e.target.value as "M" | "F")} className="form-input-avenida">
                  <option value="">-- Sélectionner --</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </FormField>

              <FormField label="Date de naissance *" required>
                <input type="date" value={form.birth_date} onChange={(e) => updateField("birth_date", e.target.value)}
                  className="form-input-avenida" />
              </FormField>

              <FormField label="Lieu de naissance *" required>
                <input type="text" value={form.birth_place} onChange={(e) => updateField("birth_place", e.target.value)}
                  placeholder="Ex: Lomé, Kpalimé, Aného..." className="form-input-avenida" />
              </FormField>

              <FormField label="Nationalité *" required>
                <select value={form.nationality} onChange={(e) => updateField("nationality", e.target.value)} className="form-input-avenida">
                  {NATIONALITIES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="N° Pièce d'identité (CNI / Passeport)">
                <input type="text" value={form.id_card_number} onChange={(e) => updateField("id_card_number", e.target.value)}
                  placeholder="Ex: TG-LOM-2022-8941" className="form-input-avenida" />
              </FormField>

              <FormField label="Photo d'identité (URL)">
                <div className="flex items-center gap-2">
                  <input type="text" value={form.photo_url} onChange={(e) => updateField("photo_url", e.target.value)}
                    placeholder="URL de la photo ou glisser-déposer" className="form-input-avenida flex-1" />
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0">
                    {form.photo_url ? (
                      <img src={form.photo_url} alt="Photo" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </FormField>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 2 : COORDONNÉES ─── */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <SectionHeader icon={MapPin} title="Coordonnées & Résidence" subtitle="Adresse et moyens de contact de l'élève" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormField label="Adresse complète *" required className="lg:col-span-2">
                <input type="text" value={form.address} onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Ex: 30, Rue d'Almeida Leopold" className="form-input-avenida" />
              </FormField>

              <FormField label="Quartier *" required>
                <select value={form.neighborhood} onChange={(e) => updateField("neighborhood", e.target.value)} className="form-input-avenida">
                  <option value="">-- Sélectionner le quartier --</option>
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Ville *" required>
                <input type="text" value={form.city} onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Lomé" className="form-input-avenida" />
              </FormField>

              <FormField label="Téléphone principal *" required>
                <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="Ex: 91 42 46 45" className="form-input-avenida" />
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
              <FormField label="Diplôme visé *" required>
                <select
                  value={form.program_code}
                  onChange={(e) => {
                    const code = e.target.value as DiplomeCode;
                    updateField("program_code", code);
                    updateField("year_level", "");
                    updateField("specialty", "");
                  }}
                  className="form-input-avenida"
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
              <FormField label="Niveau / Année *" required>
                <select
                  value={form.year_level}
                  onChange={(e) => updateField("year_level", e.target.value)}
                  disabled={!selectedProgram}
                  className="form-input-avenida"
                >
                  <option value="">-- Choisir le niveau --</option>
                  {selectedProgram?.yearLevels.map((yl) => (
                    <option key={yl} value={yl}>{yl}</option>
                  ))}
                </select>
              </FormField>

              {/* Spécialité */}
              <FormField label="Spécialité *" required>
                <select
                  value={form.specialty}
                  onChange={(e) => updateField("specialty", e.target.value)}
                  disabled={!selectedProgram}
                  className="form-input-avenida"
                >
                  <option value="">-- Choisir la spécialité --</option>
                  {selectedProgram?.specialties.map((sp) => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </FormField>

              {/* Régime */}
              <FormField label="Régime (Interne / Externe) *" required>
                <select
                  value={form.boarder_status}
                  onChange={(e) => updateField("boarder_status", e.target.value as "interne" | "externe")}
                  className="form-input-avenida"
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
                <FormField label="Nom complet *" required>
                  <input type="text" value={form.emergency_contact_name} onChange={(e) => updateField("emergency_contact_name", e.target.value)}
                    className="form-input-avenida" />
                </FormField>
                <FormField label="Téléphone *" required>
                  <input type="tel" value={form.emergency_contact_phone} onChange={(e) => updateField("emergency_contact_phone", e.target.value)}
                    className="form-input-avenida" />
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

        {/* ─── ÉTAPE 7 : DOCUMENTS FOURNIS ─── */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <SectionHeader icon={FileText} title="Pièces du Dossier" subtitle="Documents nécessaires pour valider l'inscription" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "doc_birth_certificate" as keyof FormData, label: "Extrait d'acte de naissance (original + copie)" },
                { key: "doc_id_card" as keyof FormData, label: "Copie de la pièce d'identité / carte scolaire" },
                { key: "doc_photos" as keyof FormData, label: "4 photos d'identité récentes (format passeport)" },
                { key: "doc_last_report" as keyof FormData, label: "Dernier bulletin de notes / relevé" },
                { key: "doc_medical_certificate" as keyof FormData, label: "Certificat médical d'aptitude" },
                { key: "doc_diploma_copy" as keyof FormData, label: "Copie du dernier diplôme obtenu" },
                { key: "doc_enrollment_form" as keyof FormData, label: "Fiche d'inscription remplie et signée" },
              ].map((doc) => (
                <label
                  key={doc.key}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    form[doc.key]
                      ? "bg-emerald-50 border-emerald-300 shadow-sm"
                      : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form[doc.key] as boolean}
                    onChange={(e) => updateField(doc.key, e.target.checked as any)}
                    className="w-5 h-5 rounded-md accent-emerald-600"
                  />
                  <span className={`text-sm font-medium ${form[doc.key] ? "text-emerald-800" : "text-slate-700"}`}>
                    {doc.label}
                  </span>
                  {form[doc.key] && <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto" />}
                </label>
              ))}
            </div>

            <FormField label="Observations / Remarques">
              <textarea value={form.observations} onChange={(e) => updateField("observations", e.target.value)}
                placeholder="Notes complémentaires, conditions particulières, etc."
                className="form-input-avenida min-h-[100px] resize-none" />
            </FormField>
          </div>
        )}

        {/* ─── ÉTAPE 8 : RÉCAPITULATIF ─── */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <SectionHeader icon={CreditCard} title="Récapitulatif & Frais de Scolarité" subtitle="Vérifiez toutes les informations avant validation" color="red" />

            {/* Résumé identité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <RecapCard title="Identité">
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

            {/* Documents fournis */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Documents fournis</h3>
              <div className="flex flex-wrap gap-2">
                {form.doc_birth_certificate && <DocBadge>Acte de naissance</DocBadge>}
                {form.doc_id_card && <DocBadge>Pièce d&apos;identité</DocBadge>}
                {form.doc_photos && <DocBadge>Photos</DocBadge>}
                {form.doc_last_report && <DocBadge>Bulletin</DocBadge>}
                {form.doc_medical_certificate && <DocBadge>Certificat médical</DocBadge>}
                {form.doc_diploma_copy && <DocBadge>Diplôme</DocBadge>}
                {form.doc_enrollment_form && <DocBadge>Fiche signée</DocBadge>}
                {!form.doc_birth_certificate && !form.doc_id_card && !form.doc_photos && (
                  <span className="text-xs text-slate-400 italic">Aucun document coché</span>
                )}
              </div>
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
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95"
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
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0C356A] text-white rounded-xl font-bold text-sm hover:bg-[#164E87] active:scale-95 transition-all shadow-sm"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#DC2626] text-white rounded-xl font-bold text-sm hover:bg-[#b91c1c] active:scale-95 transition-all shadow-md shadow-red-900/20"
            >
              <Save className="w-4 h-4" />
              Valider l&apos;Inscription
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

function FormField({ label, required, children, className = "" }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
        {label}
        {required && <span className="text-[#DC2626]">*</span>}
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
