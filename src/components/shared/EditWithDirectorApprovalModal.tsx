"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  User,
  KeyRound,
  FileCheck,
  Send,
  Save,
} from "lucide-react";
import { Student, Employee, HotelCustomer, DiplomeCode } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  EntityType,
  applyImmediateDirectorModification,
  requestEntityModification,
  verifyDirectorPin,
} from "@/lib/director-modifications";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityData: Student | Employee | HotelCustomer | null;
  onSuccess?: () => void;
}

export function EditWithDirectorApprovalModal({
  isOpen,
  onClose,
  entityType,
  entityData,
  onSuccess,
}: EditModalProps) {
  const { user } = useAuth();
  const isDirector =
    user?.role === "directeur_general" || user?.email === "direction@ecole-avenida.tg";

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [directorPin, setDirectorPin] = useState("");
  const [usePinOverride, setUsePinOverride] = useState(false);
  const [pinError, setPinError] = useState("");
  const [directorNotes, setDirectorNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (entityData) {
      setFormData({ ...entityData });
      setPinError("");
      setSuccessMessage(null);
      setDirectorPin("");
      setUsePinOverride(false);
      setDirectorNotes("");
    }
  }, [entityData, isOpen]);

  if (!isOpen || !entityData) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getEntityTitle = () => {
    switch (entityType) {
      case "student":
        const s = entityData as Student;
        return {
          title: `Modifier Dossier Élève : ${s.last_name} ${s.first_name}`,
          code: s.registration_number,
          label: "Élève",
        };
      case "employee":
        const e = entityData as Employee;
        return {
          title: `Modifier Collaborateur / Formateur : ${e.last_name} ${e.first_name}`,
          code: e.matricule,
          label: "Professeur / Collaborateur",
        };
      case "customer":
        const c = entityData as HotelCustomer;
        return {
          title: `Modifier Fiche Client Hôtel : ${c.full_name}`,
          code: c.code,
          label: "Client Hôtel",
        };
    }
  };

  const info = getEntityTitle();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    setIsSubmitting(true);

    try {
      // 1. Détecter les champs modifiés
      const changedKeys = Object.keys(formData).filter(
        (k) => JSON.stringify(formData[k]) !== JSON.stringify((entityData as any)[k])
      );

      if (changedKeys.length === 0) {
        alert("Aucune modification n'a été détectée.");
        setIsSubmitting(false);
        return;
      }

      const proposedChanges: Record<string, any> = {};
      changedKeys.forEach((k) => {
        proposedChanges[k] = formData[k];
      });

      // 2. Si l'utilisateur est le Directeur ou a validé le Code PIN
      const canDirectApply = isDirector || (usePinOverride && verifyDirectorPin(directorPin));

      if (usePinOverride && !verifyDirectorPin(directorPin)) {
        setPinError("Code PIN d'autorisation du Directeur invalide.");
        setIsSubmitting(false);
        return;
      }

      if (canDirectApply) {
        await applyImmediateDirectorModification({
          entity_type: entityType,
          entity_id: entityData.id,
          entity_name:
            entityType === "customer"
              ? (formData as HotelCustomer).full_name
              : `${formData.last_name} ${formData.first_name}`,
          entity_code: info.code,
          previous_data: entityData as any,
          proposed_changes: proposedChanges,
          director_name: isDirector
            ? user?.fullName || "M. Hope d'Almeida (Directeur Général)"
            : "Visa Direct via Code Directeur Général (M. Hope d'Almeida)",
          director_notes: directorNotes || "Modification validée et autorisée par la Direction.",
        });

        setSuccessMessage("✅ Modification autorisée et appliquée immédiatement dans la base !");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        // Soumission à l'approbation du Directeur
        requestEntityModification({
          entity_type: entityType,
          entity_id: entityData.id,
          entity_name:
            entityType === "customer"
              ? (formData as HotelCustomer).full_name
              : `${formData.last_name} ${formData.first_name}`,
          entity_code: info.code,
          previous_data: entityData as any,
          proposed_changes: proposedChanges,
          requested_by: user?.fullName || user?.email || "Personnel Avenida",
        });

        setSuccessMessage(
          "⏳ Demande de modification transmise au Directeur Général M. Hope d'Almeida pour validation !"
        );
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1400);
      }
    } catch (err) {
      console.error("Erreur enregistrement modification:", err);
      alert("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-[#0C356A] via-[#164E87] to-[#0C356A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-mono">
                  AUTORISATION DIRECTION REQUISE
                </span>
                <span className="text-xs text-blue-200 font-mono font-bold">
                  {info.code}
                </span>
              </div>
              <h2 className="text-base font-black font-serif mt-0.5">{info.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-2.5 font-bold animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. Champs spécifiques par type d'entité */}
          {entityType === "student" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom de famille *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name || ""}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prénoms *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name || ""}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sexe</label>
                  <select
                    value={formData.gender || "M"}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="M">Masculin (M)</option>
                    <option value="F">Féminin (F)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nationalité</label>
                  <input
                    type="text"
                    value={formData.nationality || "Togolaise"}
                    onChange={(e) => handleChange("nationality", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quartier (Lomé)</label>
                  <input
                    type="text"
                    value={formData.residence_neighborhood || ""}
                    onChange={(e) => handleChange("residence_neighborhood", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone élève</label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Diplôme / Filière</label>
                  <select
                    value={formData.program_code || "BTS"}
                    onChange={(e) => handleChange("program_code", e.target.value as DiplomeCode)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-[#0C356A]"
                  >
                    <option value="CFA">CFA</option>
                    <option value="CAP">CAP</option>
                    <option value="BEP">BEP</option>
                    <option value="BT">BT</option>
                    <option value="BTS">BTS</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Classe</label>
                  <input
                    type="text"
                    value={formData.class_name || ""}
                    onChange={(e) => handleChange("class_name", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Régime</label>
                  <select
                    value={formData.boarder_status || "externe"}
                    onChange={(e) => handleChange("boarder_status", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold capitalize"
                  >
                    <option value="externe">Externe</option>
                    <option value="interne">Interne</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-red-50/60 rounded-2xl border border-red-200">
                <div>
                  <label className="font-bold text-red-900 block mb-1">Contact d&apos;Urgence (Nom)</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name || ""}
                    onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-red-900 block mb-1">Téléphone d&apos;Urgence</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_phone || ""}
                    onChange={(e) => handleChange("emergency_contact_phone", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl font-bold text-red-700"
                  />
                </div>
              </div>
            </div>
          )}

          {entityType === "employee" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name || ""}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prénoms *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name || ""}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Poste / Fonction</label>
                  <input
                    type="text"
                    value={formData.role_title || ""}
                    onChange={(e) => handleChange("role_title", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Département</label>
                  <input
                    type="text"
                    value={formData.department || ""}
                    onChange={(e) => handleChange("department", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Secteur</label>
                  <select
                    value={formData.sector || "ecole"}
                    onChange={(e) => handleChange("sector", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="ecole">École Hôtelière</option>
                    <option value="hotel">Hôtel Avenida</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Salaire de Base (F CFA)</label>
                  <input
                    type="number"
                    step={5000}
                    value={formData.base_salary || 0}
                    onChange={(e) => handleChange("base_salary", Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Statut Collaborateur</label>
                  <select
                    value={formData.status || "actif"}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="actif">Actif (En poste)</option>
                    <option value="inactif">Inactif / Fin de contrat</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {entityType === "customer" && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom & Prénoms complets *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name || ""}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Société / Entreprise</label>
                  <input
                    type="text"
                    value={formData.company || ""}
                    onChange={(e) => handleChange("company", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nationalité</label>
                  <input
                    type="text"
                    value={formData.nationality || "Togolaise"}
                    onChange={(e) => handleChange("nationality", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">N° CNI ou Passeport</label>
                  <input
                    type="text"
                    value={formData.id_card_or_passport || ""}
                    onChange={(e) => handleChange("id_card_or_passport", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_vip_check"
                    checked={Boolean(formData.is_vip)}
                    onChange={(e) => handleChange("is_vip", e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <label htmlFor="is_vip_check" className="font-bold text-slate-800">
                    Client VIP / Privilégié
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 2. SECTION PROTOCOLE D'AUTORISATION DIRECTEUR */}
          <div className="border-t pt-4">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300/80 space-y-3">
              <div className="flex items-start gap-2.5">
                <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-amber-950 uppercase tracking-wide text-[11px]">
                    Procédure de Contrôle Hiérarchique
                  </div>
                  <div className="text-[11px] text-amber-900 mt-0.5">
                    Conformément au règlement de l&apos;établissement, toute modification de données personnelles d&apos;un élève, professeur ou client requiert l&apos;approbation formelle de <strong>M. Hope d&apos;Almeida (Directeur Général)</strong>.
                  </div>
                </div>
              </div>

              {isDirector ? (
                <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Vous êtes connecté en tant que Directeur Général. Votre visa sera apposé.</span>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Observation ou Visa officiel (optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Rectification autorisée suite au justificatif présenté..."
                      value={directorNotes}
                      onChange={(e) => setDirectorNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1 border-t border-amber-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="pin_override"
                      checked={usePinOverride}
                      onChange={(e) => setUsePinOverride(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0C356A]"
                    />
                    <label htmlFor="pin_override" className="font-bold text-slate-800 cursor-pointer">
                      Le Directeur est présent et valide immédiatement via son Code PIN
                    </label>
                  </div>

                  {usePinOverride && (
                    <div className="p-3 bg-white rounded-xl border border-amber-300 space-y-1.5 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[#0C356A]" />
                        <span className="font-bold text-slate-800 text-[11px]">
                          Code PIN d&apos;habilitation du Directeur :
                        </span>
                      </div>
                      <input
                        type="password"
                        placeholder="Saisir le mot de passe / PIN directeur (avenida)"
                        value={directorPin}
                        onChange={(e) => setDirectorPin(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-[#0C356A]/20"
                      />
                      {pinError && (
                        <p className="text-[11px] text-red-600 font-bold">{pinError}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Boutons */}
          <div className="flex items-center justify-between pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer text-white ${
                isDirector || usePinOverride
                  ? "bg-[#0C356A] hover:bg-[#164E87]"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isDirector || usePinOverride ? (
                <Save className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>
                {isDirector || usePinOverride
                  ? "Valider & Enregistrer (Visa Direction)"
                  : "Transmettre au Directeur pour Approbation"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
