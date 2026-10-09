"use client";

import React, { useState } from "react";
import {
  X,
  FolderOpen,
  FileText,
  Eye,
  Download,
  Trash2,
  UploadCloud,
  Sparkles,
  AlertCircle,
  Plus,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { Student } from "@/types";
import {
  DEFAULT_DOCUMENT_REQUIREMENTS,
  formatBytes,
  DocumentViewerModal,
  type UploadedFileItem,
} from "@/components/shared/DocumentUploadManager";
import {
  saveAndSyncStudent,
  broadcastDataChange,
} from "@/lib/realtime-store";

interface StudentDocumentsModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStudent?: (student: Student) => void;
}

export function StudentDocumentsModal({
  student,
  isOpen,
  onClose,
  onUpdateStudent,
}: StudentDocumentsModalProps) {
  const [activeDocPreview, setActiveDocPreview] = useState<UploadedFileItem | null>(null);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("Dossier Scolaire");

  if (!isOpen || !student) return null;

  const docs = student.uploaded_documents || {};
  const docList = Object.entries(docs).filter(([k]) => k !== "photo");

  const handleDownloadDoc = (doc: UploadedFileItem) => {
    if (doc.dataUrl) {
      const a = document.createElement("a");
      a.href = doc.dataUrl;
      a.download = doc.name || `document_${student.registration_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Pour les fichiers sans dataUrl, génère un document récapitulatif
      const blob = new Blob(
        [
          `HÔTEL ÉCOLE AVENIDA LOMÉ\nDOCUMENT ENREGISTRÉ\n\nÉlève: ${student.last_name} ${student.first_name}\nMatricule: ${student.registration_number}\nDocument: ${doc.name}\nCatégorie: ${doc.category || "Dossier Scolaire"}\nDate d'enregistrement: ${doc.uploadedAt || new Date().toISOString()}`,
        ],
        { type: "text/plain;charset=utf-8" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.name || "piece_jointe"}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleAttachDocument = (file: File) => {
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
        `Débit dépassé : ${formatBytes(file.size)}. Le débit maximal autorisé est de ${formatBytes(
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
        ...(student.uploaded_documents || {}),
        [docKey]: item,
      };

      const updatedStudent: Student = {
        ...student,
        uploaded_documents: updatedDocs,
      };

      await saveAndSyncStudent(updatedStudent);
      onUpdateStudent?.(updatedStudent);
      broadcastDataChange();
      setNewDocTitle("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDocument = async (docKey: string) => {
    const remaining = { ...(student.uploaded_documents || {}) };
    delete remaining[docKey];

    const updatedStudent: Student = {
      ...student,
      uploaded_documents: remaining,
    };

    await saveAndSyncStudent(updatedStudent);
    onUpdateStudent?.(updatedStudent);
    broadcastDataChange();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-[#0C356A] via-[#164E87] to-[#0C356A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-mono">
                  DOSSIER D&apos;ACCÈS AUX DOCUMENTS
                </span>
                <span className="text-xs text-blue-200 font-mono font-bold">
                  {student.registration_number}
                </span>
              </div>
              <h2 className="text-base font-black font-serif mt-0.5">
                Pièces & Justificatifs : {student.last_name} {student.first_name}
              </h2>
              <p className="text-[11px] text-blue-200">
                {student.class_name} &bull; {student.program_code} &bull; Lomé ({student.residence_neighborhood})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps du dossier */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Note sur les exigences */}
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Archivage Numérique Sécurisé Avenida Lomé :</div>
              <div className="text-[11px] text-blue-800">
                Chaque pièce enregistrée est consultable, téléchargeable et liée au dossier unique de l&apos;élève. Formats autorisés : <strong>PDF, JPG, PNG, WEBP, DOCX (Max 5 Mo)</strong>.
              </div>
            </div>
          </div>

          {docUploadError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{docUploadError}</span>
            </div>
          )}

          {/* Liste des documents enregistrés */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-[#0C356A] uppercase tracking-wider text-xs flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Documents & Pièces Classées ({docList.length})</span>
              </h3>
            </div>

            {docList.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {docList.map(([key, doc]) => (
                  <div
                    key={key}
                    className="p-3 bg-slate-50 hover:bg-blue-50/40 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0C356A] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate text-xs">{doc.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded">
                            {doc.category || "Dossier Scolaire"}
                          </span>
                          <span className="font-mono font-bold">{doc.formattedSize}</span>
                          <span>&bull;</span>
                          <span>
                            {doc.uploadedAt
                              ? new Date(doc.uploadedAt).toLocaleDateString("fr-FR")
                              : "Enregistré"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions sur le document */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveDocPreview(doc)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-100 text-[#0C356A] hover:bg-[#0C356A] hover:text-white transition-colors flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                        title="Visualiser le document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Voir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(doc)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-700 hover:text-white transition-colors flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                        title="Télécharger la pièce sur l'ordinateur"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(key)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Supprimer du dossier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 space-y-1">
                <FolderOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700">Aucune pièce numérique enregistrée pour cet élève.</p>
                <p className="text-[11px] text-slate-500">
                  Vous pouvez ajouter un document requis ci-dessous pour enrichir son dossier.
                </p>
              </div>
            )}
          </div>

          {/* Formulaire d'ajout rapide d'un document */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Numériser & Enregistrer un nouveau document au dossier</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Intitulé du document (ex: CNI, Acte Naissance, Casier...)
                </label>
                <input
                  type="text"
                  placeholder="Libellé du document..."
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Catégorie administrative
                </label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Dossier Scolaire">Dossier Scolaire</option>
                  <option value="État Civil / CNI">État Civil / CNI</option>
                  <option value="Certificat Médical">Certificat Médical</option>
                  <option value="Reçu Financier">Reçu Financier</option>
                  <option value="Autre Justificatif">Autre Justificatif</option>
                </select>
              </div>
            </div>

            <label className="flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50/30 cursor-pointer text-[#0C356A] transition-colors">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-xs">
                Sélectionner le document sur cet ordinateur (PDF, JPG, PNG, DOCX - Max 5 Mo)
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAttachDocument(file);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl text-xs cursor-pointer"
          >
            Fermer le Dossier
          </button>
        </div>
      </div>

      {/* Visionneuse intégrée */}
      <DocumentViewerModal
        document={activeDocPreview}
        isOpen={!!activeDocPreview}
        onClose={() => setActiveDocPreview(null)}
      />
    </div>
  );
}
