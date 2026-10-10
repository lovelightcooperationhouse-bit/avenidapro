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

  const regFee = enrollmentDetails?.fees?.registration || student.paid_fee || 50000;
  const totalFee = enrollmentDetails?.fees?.total || student.total_fee || 370000;
  const remaining = Math.max(0, totalFee - regFee);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:static">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full">
        {/* Barre de contrôle supérieure (Masquée à l'impression) */}
        <div className="bg-[#0C356A] text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider">
              Fiche d&apos;Inscription &bull; Matricule : {student.registration_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-900" />
              <span>Télécharger / Imprimer en PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Officiel d'Inscription Formaté A4 */}
        <div
          ref={printableRef}
          className="p-6 md:p-8 bg-white text-slate-900 text-xs font-sans print:p-6 print:m-0 space-y-4"
          id="avenida-official-student-enrollment"
        >
          {/* En-tête République & École */}
          <div className="border-b-2 border-[#0C356A] pb-3 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 relative rounded-xl overflow-hidden border border-slate-200 shadow-2xs shrink-0">
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
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  RÉPUBLIQUE TOGOLAISE &bull; MINISTÈRE DE L&apos;ENSEIGNEMENT TECHNIQUE
                </div>
                <h1 className="font-serif font-black text-lg text-[#0C356A] tracking-tight uppercase leading-tight mt-0.5">
                  HÔTEL ÉCOLE AVENIDA LOMÉ
                </h1>
                <p className="text-[10px] text-slate-600 font-semibold">
                  Établissement Privé d&apos;Enseignement Technique & Professionnel Hôtelier
                </p>
                <p className="text-[8px] text-slate-400">
                  Boulevard du 13 Janvier / Dékon &bull; Lomé, Togo &bull; Tél: +228 22 21 00 00 / 90 55 44 33
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block border-2 border-[#0C356A] text-[#0C356A] px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider">
                RÉCÉPISSÉ OFFICIEL
              </span>
              <p className="text-[11px] font-mono font-black text-[#DC2626] mt-1">
                MATRICULE : {student.registration_number}
              </p>
              <p className="text-[9px] text-slate-500 font-bold">
                Année Scolaire : {student.academic_year || "2024-2025"}
              </p>
              <p className="text-[8px] text-slate-400">
                Date : {new Date().toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          {/* Titre du document */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <h2 className="text-sm font-black font-serif text-[#0C356A] uppercase tracking-wider">
              FICHE D&apos;INSCRIPTION & RÉCÉPISSÉ D&apos;ADMISSION DÉFINITIVE
            </h2>
            <p className="text-[10px] text-slate-500">
              Document officiel valant attestation d&apos;inscription académique pour l&apos;année scolaire {student.academic_year || "en cours"}
            </p>
          </div>

          {/* Section 1 : État Civil de l'Élève & Photo */}
          <div className="grid grid-cols-4 gap-4 bg-blue-50/40 p-3.5 rounded-2xl border border-blue-200">
            <div className="col-span-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#0C356A]">
                <User className="w-3.5 h-3.5" />
                <span>1. État Civil & Identité de l&apos;Élève</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500">Nom :</span>{" "}
                  <strong className="text-slate-900 uppercase">{student.last_name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Prénoms :</span>{" "}
                  <strong className="text-slate-900">{student.first_name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Sexe :</span>{" "}
                  <strong>{student.gender === "M" ? "Masculin (M)" : "Féminin (F)"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Nationalité :</span>{" "}
                  <strong>{student.nationality || "Togolaise"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Né(e) le :</span>{" "}
                  <strong>{student.birth_date || "—"}</strong>{" "}
                  {student.birth_place ? `à ${student.birth_place}` : ""}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Résidence :</span>{" "}
                  <strong>{student.residence_neighborhood || "Lomé"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Téléphone :</span>{" "}
                  <strong>{student.phone || "—"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Email :</span>{" "}
                  <strong>{student.email || "—"}</strong>
                </div>
              </div>
            </div>

            {/* Cadre Photo 4x4 */}
            <div className="col-span-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-white p-2 text-center overflow-hidden">
              <span className="text-[8px] font-bold text-slate-400 uppercase leading-tight mb-1">
                PHOTO 4 x 4
              </span>
              {student.photo_url && !student.photo_url.includes("default.png") ? (
                <div className="w-14 h-16 rounded-lg overflow-hidden border border-slate-300 shadow-2xs">
                  <img
                    src={student.photo_url}
                    alt={`${student.first_name} ${student.last_name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-14 h-16 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-300">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>

          {/* Section 2 : Filière & Affectation Pédagogique */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#0C356A]">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>2. Filière, Niveau & Régime Scolaire</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Programme / Diplôme</span>
                <span className="font-black text-[#0C356A] text-xs">
                  {student.program_code} — {student.class_name || "Formation Hôtelière"}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Régime d&apos;Études</span>
                <span className="font-bold text-slate-800 text-xs capitalize">
                  {student.boarder_status === "interne" ? "Pensionnat / Internat" : "Externe"}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Statut du Dossier</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Inscrit & Actif
                </span>
              </div>
            </div>
          </div>

          {/* Section 3 : Responsable Légal & Contact d'Urgence */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#0C356A]">
              <Phone className="w-3.5 h-3.5" />
              <span>3. Responsable Légal & Contact d&apos;Urgence</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500">Parent / Tuteur :</span>{" "}
                <strong>
                  {student.tutor_name || student.parent_father_name || student.parent_mother_name || enrollmentDetails?.parentName || student.emergency_contact_name || "Parent d'Élève"}
                </strong>
                {(student.tutor_phone || student.parent_father_phone || student.parent_mother_phone || enrollmentDetails?.parentPhone) && (
                  <p className="text-slate-600 text-[10px]">Tél : {student.tutor_phone || student.parent_father_phone || student.parent_mother_phone || enrollmentDetails?.parentPhone}</p>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Contact en Cas d&apos;Urgence :</span>{" "}
                <strong>{student.emergency_contact_name || "—"}</strong>{" "}
                <span className="text-slate-600">({student.emergency_contact_phone || "—"})</span>
                {student.blood_group && (
                  <p className="text-red-700 text-[10px] font-bold">Groupe Sanguin : {student.blood_group}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4 : Frais de Scolarité & Règlement */}
          <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-900">
              <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
              <span>4. Engagement Financier & Scolarité Annuelle</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2 rounded-xl border border-emerald-200">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Droits d&apos;Inscription</span>
                <span className="font-bold text-slate-900">{formatFCFA(regFee)}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-emerald-200">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Total Scolarité Dû</span>
                <span className="font-bold text-[#0C356A]">{formatFCFA(totalFee)}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-emerald-200">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Solde Restant Dû</span>
                <span className="font-bold text-[#DC2626]">{formatFCFA(remaining)}</span>
              </div>
            </div>
          </div>

          {/* Section 5 : Signatures & Cachet Officiel */}
          <div className="border-t-2 border-[#0C356A] pt-3 grid grid-cols-2 gap-6 text-center text-xs">
            {/* Signature Élève ou Parent */}
            <div className="flex flex-col justify-between min-h-[90px] border-r border-slate-200 pr-4">
              <div>
                <p className="font-bold text-slate-800 uppercase text-[10px]">
                  L&apos;Élève ou le Responsable Légal
                </p>
                <p className="text-[8px] text-slate-400 italic">Mention manuscrite &quot;Lu et approuvé&quot;</p>
              </div>
              <div className="text-[9px] text-slate-300 italic">Signature & Émargement</div>
            </div>

            {/* Signature Direction Générale — M. Hope d'Almeida */}
            <div className="flex flex-col justify-between min-h-[90px] pl-4 relative">
              <div>
                <p className="font-bold text-[#0C356A] uppercase text-[10px]">
                  Le Directeur Général
                </p>
                <p className="font-black text-slate-900 text-[10px]">
                  M. Hope d&apos;Almeida
                </p>
                <p className="text-[8px] text-slate-500">Hôtel École Avenida Lomé</p>
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

          {/* Pied de page officiel */}
          <div className="text-center text-[8px] text-slate-400 pt-2 border-t border-slate-100">
            Ce récépissé confère à l&apos;étudiant le droit d&apos;accès aux salles de cours et aux ateliers pratiques de l&apos;Hôtel École Avenida.
          </div>
        </div>
      </div>
    </div>
  );
}
