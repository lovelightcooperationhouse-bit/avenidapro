"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  Printer,
  X,
  CheckCircle2,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  User,
  ShieldCheck,
  Building,
  Download,
  FileCheck,
  Heart,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Student } from "@/types";
import { formatFCFA } from "@/lib/utils";

interface StudentRegistrationModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  enrollmentDetails?: {
    fees?: {
      registration: number;
      tuition: number;
      supplies: number;
      boarding?: number;
      total: number;
    };
    specialty?: string;
    parentName?: string;
    parentPhone?: string;
    bloodGroup?: string;
  };
}

export function StudentRegistrationModal({
  student,
  isOpen,
  onClose,
  enrollmentDetails,
}: StudentRegistrationModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    if (!printableRef.current) return;
    const content = printableRef.current.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Fiche d'Inscription - ${student.last_name} ${student.first_name} (${student.registration_number})</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 15px; font-size: 11px; }
    h1, h2, h3 { margin: 0; font-family: Georgia, serif; }
    .header-box { border-bottom: 2px solid #0C356A; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; }
    .badge { border: 1.5px solid #0C356A; padding: 2px 6px; font-weight: bold; font-size: 9px; text-transform: uppercase; }
    .section-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; }
    .section-title { font-size: 10px; font-weight: bold; color: #0C356A; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; }
    .grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .col { flex: 1; min-width: 140px; }
    .label { color: #64748b; font-size: 9px; }
    .value { font-weight: bold; color: #0f172a; }
    .stamp { border: 2px solid #DC2626; color: #DC2626; padding: 4px 10px; font-weight: 900; text-transform: uppercase; transform: rotate(-3deg); display: inline-block; border-radius: 6px; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Fiche_Inscription_${student.registration_number}_${student.last_name.replace(/\s+/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculs financiers
  const totalFee =
    enrollmentDetails?.fees?.total ||
    Number(student.total_fee) ||
    370000;
  const paidFee = Number(student.paid_fee) || 0;
  const remaining = Math.max(0, totalFee - paidFee);
  const regFee =
    enrollmentDetails?.fees?.registration ||
    Number(student.registration_fee) ||
    50000;
  const tuitionFee = enrollmentDetails?.fees?.tuition || Math.max(0, totalFee - regFee - 20000);
  const isPaidFull = remaining === 0;

  // Documents rattachés
  const uploadedDocs = student.uploaded_documents || {};
  const uploadedDocsCount = Object.keys(uploadedDocs).filter((k) => k !== "photo").length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          nav, aside, header, .print\\:hidden {
            display: none !important;
          }
          #avenida-official-student-enrollment {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full">
        {/* Barre de contrôle supérieure (Masquée à l'impression) */}
        <div className="bg-gradient-to-r from-[#0C356A] to-[#164E87] text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                Fiche d&apos;Inscription &bull; Matricule : {student.registration_number}
              </span>
              <span className="text-[10px] text-blue-200">
                Format Officiel A4 &bull; Synchronisé Supabase Cloud
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              title="Ouvre la boîte d'impression pour imprimer ou enregistrer en PDF A4"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Imprimer / PDF A4</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
              title="Télécharge la fiche complète au format HTML autonome"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/20 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* DOCUMENT OFFICIEL D'INSCRIPTION — FORMAT STRICT A4             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div
          ref={printableRef}
          className="p-6 md:p-8 bg-white text-slate-900 text-xs font-sans print:p-4 print:m-0 space-y-3"
          id="avenida-official-student-enrollment"
        >
          {/* 1. EN-TÊTE RÉPUBLIQUE TOGOLAISE & ÉCOLE AVENIDA LOMÉ */}
          <div className="border-b-2 border-[#0C356A] pb-3 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 relative rounded-xl overflow-hidden border border-slate-300 shadow-2xs shrink-0 bg-slate-50 flex items-center justify-center">
                <Image
                  src="/logoavenida.jpg"
                  alt="École Avenida Lomé"
                  width={64}
                  height={64}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <div>
                <div className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest leading-none">
                  RÉPUBLIQUE TOGOLAISE &bull; TRAVAIL - LIBERTÉ - PATRIE
                </div>
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                  MINISTÈRE DE L&apos;ENSEIGNEMENT TECHNIQUE, DE LA FORMATION PROFESSIONNELLE ET DE L&apos;APPRENTISSAGE
                </div>
                <h1 className="font-serif font-black text-base md:text-lg text-[#0C356A] tracking-tight uppercase leading-tight mt-1">
                  HÔTEL ÉCOLE AVENIDA LOMÉ
                </h1>
                <p className="text-[9.5px] text-slate-600 font-semibold leading-tight">
                  Établissement Privé d&apos;Enseignement Technique & Professionnel Hôtelier
                </p>
                <p className="text-[8px] text-slate-400 mt-0.5">
                  Boulevard du 13 Janvier / Dékon &bull; Lomé, Togo &bull; Tél: +228 22 21 00 00 / 90 55 44 33
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block border-2 border-[#0C356A] text-[#0C356A] px-2.5 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider rounded">
                DOSSIER SCOLAIRE OFFICIEL
              </span>
              <p className="text-xs font-mono font-black text-[#DC2626] mt-1">
                MATRICULE : {student.registration_number}
              </p>
              <p className="text-[9px] text-slate-600 font-mono font-bold">
                N° ÉTUDIANT : {student.student_number || `ETU-${student.registration_number}`}
              </p>
              <p className="text-[9px] text-slate-500 font-bold">
                Année Scolaire : {student.academic_year || "2024 - 2025"}
              </p>
              <p className="text-[8px] text-slate-400">
                Émis le : {new Date().toLocaleDateString("fr-FR")} à Lomé
              </p>
            </div>
          </div>

          {/* BANDEAU TITRE DU RÉCÉPISSÉ */}
          <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
            <h2 className="text-xs md:text-sm font-black font-serif text-[#0C356A] uppercase tracking-wider">
              FICHE D&apos;INSCRIPTION ACADÉMIQUE & RÉCÉPISSÉ D&apos;ENGAGEMENT
            </h2>
            <p className="text-[9px] text-slate-500 font-medium mt-0.5">
              Certificat officiel d&apos;inscription pour l&apos;année scolaire {student.academic_year || "en cours"} &bull; Réf. Décret N° 2021-044/METFPA
            </p>
          </div>

          {/* SECTION 1 : ÉTAT CIVIL & IDENTITÉ DE L'ÉLÈVE */}
          <div className="grid grid-cols-4 gap-3 bg-blue-50/40 p-3 rounded-xl border border-blue-200">
            <div className="col-span-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-[#0C356A] border-b border-blue-200 pb-1">
                <User className="w-3.5 h-3.5 text-[#0C356A]" />
                <span>1. État Civil & Identité Complète de l&apos;Élève</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 block">Nom :</span>
                  <strong className="text-slate-900 uppercase">{student.last_name}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">Prénoms :</span>
                  <strong className="text-slate-900">{student.first_name}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">Sexe :</span>
                  <strong>{student.gender === "M" ? "Masculin (M)" : "Féminin (F)"}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">Nationalité :</span>
                  <strong>{student.nationality || "Togolaise"}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">Date et lieu de naissance :</span>
                  <strong>{student.birth_date || "—"}</strong>{" "}
                  <span className="text-slate-600">{student.birth_place ? `à ${student.birth_place}` : ""}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">Pièce d&apos;Identité / CNI :</span>
                  <strong className="font-mono">{student.id_card_number || "TG-CNI-En cours"}</strong>
                </div>
              </div>
            </div>

            {/* Cadre Photo 4x4 */}
            <div className="col-span-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-white p-1.5 text-center overflow-hidden">
              <span className="text-[7.5px] font-bold text-slate-400 uppercase leading-tight mb-1">
                PHOTO 4 x 4
              </span>
              {student.photo_url && !student.photo_url.includes("default.png") ? (
                <div className="w-16 h-20 rounded-lg overflow-hidden border border-slate-300 shadow-2xs">
                  <img
                    src={student.photo_url}
                    alt={`${student.first_name} ${student.last_name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-20 bg-slate-100 rounded border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <User className="w-7 h-7 text-slate-300" />
                  <span className="text-[7px] text-slate-400 mt-1">Conforme</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2 : COORDONNÉES & DOMICILE */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-[#0C356A] border-b border-slate-200 pb-1">
              <MapPin className="w-3.5 h-3.5 text-[#0C356A]" />
              <span>2. Coordonnées & Adresse de Résidence</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="col-span-2">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Adresse & Quartier</span>
                <span className="font-bold text-slate-800">
                  {student.address || "Dékon"}, {student.residence_neighborhood || "Lomé"} ({student.city || "Lomé"})
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Téléphone Principal</span>
                <span className="font-bold text-slate-900 font-mono">{student.phone || "—"}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Email</span>
                <span className="text-slate-800 text-[10px] truncate block">{student.email || "—"}</span>
              </div>
            </div>
          </div>

          {/* SECTION 3 : PARCOURS SCOLAIRE ANTÉRIEUR */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-[#0C356A] border-b border-slate-200 pb-1">
              <FileText className="w-3.5 h-3.5 text-[#0C356A]" />
              <span>3. Parcours Scolaire Antérieur & Cursus d&apos;Origine</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Dernier Établissement</span>
                <span className="font-bold text-slate-800">{student.previous_school || "Lycée / Collège Lomé"}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Dernier Diplôme Obtenu</span>
                <span className="font-bold text-slate-800">{student.last_diploma || "BAC 2 / BEPC"}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Dernière Classe</span>
                <span className="font-bold text-slate-800">{student.last_class || "Terminale"}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Moyenne Antérieure</span>
                <span className="font-bold text-[#0C356A] font-mono">{student.average_last_year || "12.50 / 20"}</span>
              </div>
            </div>
          </div>

          {/* SECTION 4 : FORMATION CHOISIE & AFFECTATION */}
          <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-[#0C356A] border-b border-blue-200 pb-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#0C356A]" />
              <span>4. Formation Choisie, Classe & Régime Scolaire</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-blue-200">
                <span className="text-[8.5px] text-slate-400 block font-bold uppercase">Programme / Diplôme</span>
                <span className="font-black text-[#0C356A] text-xs">
                  {student.program_code} — {student.class_name || "1ère Année Hôtellerie"}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-blue-200">
                <span className="text-[8.5px] text-slate-400 block font-bold uppercase">Spécialité & Niveau</span>
                <span className="font-bold text-slate-800 text-xs">
                  {student.specialty || "Cuisine & Hébergement"} ({student.year_level || "1ère Année"})
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-blue-200">
                <span className="text-[8.5px] text-slate-400 block font-bold uppercase">Régime Scolaire</span>
                <span className="font-bold text-slate-800 text-xs capitalize">
                  {student.boarder_status === "interne" ? "Pensionnat / Internat" : "Externe (Demi-pension)"}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-blue-200">
                <span className="text-[8.5px] text-slate-400 block font-bold uppercase">Statut Dossier</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Inscrit & Conforme
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 5 : RESPONSABLES LÉGAUX & CONTACTS D'URGENCE */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-[#0C356A] border-b border-slate-200 pb-1">
              <Phone className="w-3.5 h-3.5 text-[#0C356A]" />
              <span>5. Responsables Légaux & Personnes à Prévenir</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[8.5px] text-slate-400 block font-bold uppercase">Père de l&apos;Élève</span>
                <strong className="text-slate-900 block">{student.parent_father_name || "M. Parent"}</strong>
                <span className="text-[9.5px] text-slate-500 font-mono block">
                  {student.parent_father_phone || "+228 90 00 00 00"}
                </span>
                {student.parent_father_profession && (
                  <span className="text-[9px] text-slate-400 italic block">{student.parent_father_profession}</span>
                )}
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[8.5px] text-slate-400 block font-bold uppercase">Mère de l&apos;Élève</span>
                <strong className="text-slate-900 block">{student.parent_mother_name || "Mme. Parent"}</strong>
                <span className="text-[9.5px] text-slate-500 font-mono block">
                  {student.parent_mother_phone || "+228 91 00 00 00"}
                </span>
                {student.parent_mother_profession && (
                  <span className="text-[9px] text-slate-400 italic block">{student.parent_mother_profession}</span>
                )}
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[8.5px] text-slate-400 block font-bold uppercase">Tuteur / En Cas d&apos;Urgence</span>
                <strong className="text-slate-900 block">
                  {student.tutor_name || student.emergency_contact_name || "Responsable désigné"}
                </strong>
                <span className="text-[9.5px] text-slate-700 font-mono block font-bold">
                  {student.emergency_contact_phone || student.tutor_phone || "+228 92 00 00 00"}
                </span>
                <span className="text-[9px] text-slate-500 block">
                  {student.tutor_relation ? `Lien : ${student.tutor_relation}` : "Tuteur légal déclaré"}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 6 : SANTÉ & APTITUDE MÉDICALE */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-[#0C356A] border-b border-slate-200 pb-1">
              <Heart className="w-3.5 h-3.5 text-rose-600" />
              <span>6. Renseignements Médicaux & Aptitude Physique</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Groupe Sanguin</span>
                <strong className="text-rose-700 font-bold text-xs">{student.blood_group || "O+"}</strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Allergies Déclarées</span>
                <span className="font-bold text-slate-800">{student.allergies || "Aucune allergie connue"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Notes Médicales & Aptitude</span>
                <span className="text-slate-800 text-[10px]">
                  {student.medical_notes || "Apte aux travaux pratiques en cuisine, restaurant et hébergement hôtelier."}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 7 : PIÈCES JUSTIFICATIVES FOURNIES AU DOSSIER */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-[#0C356A]">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>7. Pièces Justificatives Fournies au Dossier</span>
              </div>
              <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {uploadedDocsCount} document(s) classé(s) numériquement
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Extrait d&apos;Acte de Naissance certifié conforme</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Copie CNI / Passeport en cours de validité</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Photos d&apos;identité 4x4 récentes</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Dernier relevé de notes / bulletin scolaire</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Certificat médical d&apos;aptitude aux métiers hôteliers</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Copie certifiée du dernier diplôme obtenu</span>
              </div>
            </div>
          </div>

          {/* SECTION 8 : ENGAGEMENT FINANCIER & ÉCOLAGE */}
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-300 space-y-2">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-1">
              <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-emerald-950">
                <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                <span>8. Engagement Financier, Scolarité & Situation Caisse</span>
              </div>
              <span
                className={`text-[9px] font-mono font-black uppercase px-2.5 py-0.5 rounded border ${
                  isPaidFull
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                }`}
              >
                {isPaidFull ? "★ SCOLARITÉ SOLDÉE (À JOUR)" : `SOLDE EN COURS (RESTANT : ${formatFCFA(remaining)})`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <span className="text-[8.5px] text-slate-500 uppercase font-bold block">Droits d&apos;Inscription</span>
                <span className="font-bold text-slate-900 text-xs">{formatFCFA(regFee)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <span className="text-[8.5px] text-slate-500 uppercase font-bold block">Total Écolage Dû</span>
                <span className="font-black text-[#0C356A] text-xs font-mono">{formatFCFA(totalFee)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <span className="text-[8.5px] text-emerald-700 uppercase font-bold block">Montant Réglé à ce jour</span>
                <span className="font-black text-emerald-800 text-xs font-mono">{formatFCFA(paidFee)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <span className="text-[8.5px] text-rose-600 uppercase font-bold block">Solde Restant Dû</span>
                <span className="font-black text-[#DC2626] text-xs font-mono">{formatFCFA(remaining)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-emerald-200">
              <div>
                <span>Mode de règlement : </span>
                <strong className="text-slate-800">{student.payment_method || "Espèces"}</strong>
              </div>
              <div>
                <span>Échéancier prévu : </span>
                <strong className="text-slate-800">{student.installments_count || 1} versement(s)</strong>
              </div>
              <div>
                <span>Suivi Trésorerie : </span>
                <strong className="text-emerald-800">Synchronisé Caisse Centrale Lomé</strong>
              </div>
            </div>
          </div>

          {/* SECTION 9 : OBSERVATIONS ADMINISTRATIVES */}
          {student.notes && (
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-[10px] text-slate-700">
              <strong className="text-[#0C356A] uppercase text-[9px]">Observations Administratives : </strong>
              <span>{student.notes}</span>
            </div>
          )}

          {/* SECTION 10 : SIGNATURES, CACHET OFFICIEL & SCEAU */}
          <div className="border-t-2 border-[#0C356A] pt-3 grid grid-cols-2 gap-6 text-center text-xs">
            {/* Signature Élève ou Tuteur */}
            <div className="flex flex-col justify-between min-h-[95px] border-r border-slate-200 pr-4">
              <div>
                <p className="font-bold text-slate-800 uppercase text-[9.5px]">
                  L&apos;Étudiant(e) ou le Responsable Légal
                </p>
                <p className="text-[8px] text-slate-400 italic">Mention manuscrite obligatoire &quot;Lu et approuvé&quot;</p>
              </div>
              <div className="text-[8.5px] text-slate-300 italic">Signature & Émargement officiel</div>
            </div>

            {/* Signature Direction Générale — M. Hope d'Almeida */}
            <div className="flex flex-col justify-between min-h-[95px] pl-4 relative">
              <div>
                <p className="font-bold text-[#0C356A] uppercase text-[9.5px]">
                  La Direction Générale
                </p>
                <p className="font-black text-slate-900 text-[10.5px]">
                  M. Hope d&apos;Almeida
                </p>
                <p className="text-[8px] text-slate-500">Hôtel École Avenida Lomé &bull; Togo</p>
              </div>
              <div className="my-auto py-1">
                <div className="inline-block border-2 border-[#DC2626] text-[#DC2626] rounded-xl px-3 py-1 font-mono text-[8px] font-black uppercase rotate-[-3deg] tracking-wider opacity-90 shadow-2xs">
                  ★ ÉCOLE AVENIDA LOMÉ &bull; DIRECTION GÉNÉRALE ★
                </div>
              </div>
              <div className="text-[8px] text-slate-500 font-semibold">
                Fait à Lomé, le {new Date().toLocaleDateString("fr-FR")}
              </div>
            </div>
          </div>

          {/* PIED DE PAGE LÉGAL */}
          <div className="text-center text-[7.5px] text-slate-400 pt-2 border-t border-slate-200 leading-tight">
            Ce document officiel est délivré par l&apos;Hôtel École Avenida de Lomé. Il atteste de la régularité du dossier scolaire de l&apos;étudiant et lui confère le plein droit de fréquentation des cours théoriques et ateliers professionnels.
          </div>
        </div>
      </div>
    </div>
  );
}
