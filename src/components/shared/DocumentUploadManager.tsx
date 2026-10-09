"use client";

import { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Eye,
  Download,
  Plus,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  FileSpreadsheet,
  X,
  Sparkles,
  ShieldCheck,
  HardDrive,
  Info,
} from "lucide-react";

export interface UploadedFileItem {
  key?: string;
  id?: string;
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  dataUrl?: string;
  uploadedAt?: string;
  label?: string;
  category?: string;
  required?: boolean;
}

export interface RequiredDocDef {
  key: string;
  label: string;
  description?: string;
  required: boolean;
  category?: string;
}

// ── Exigences par défaut de Format et de Débit (Taille Max) ──
export const DEFAULT_PHOTO_REQUIREMENTS = {
  allowedFormats: ["image/jpeg", "image/png", "image/webp"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
  maxSizeBytes: 3 * 1024 * 1024, // 3 Mo
  maxSizeLabel: "3 Mo",
  formatLabel: "JPG, PNG, WEBP",
};

export const DEFAULT_DOCUMENT_REQUIREMENTS = {
  allowedFormats: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ],
  allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".docx", ".doc"],
  maxSizeBytes: 5 * 1024 * 1024, // 5 Mo
  maxSizeLabel: "5 Mo",
  formatLabel: "PDF, JPG, PNG, WEBP, DOCX",
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 octet";
  if (bytes < 1024) return `${bytes} octets`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

// Helper pour déterminer l'icône et la couleur selon le type de fichier
export function getFileTypeBadge(filename: string, mimeType?: string) {
  const ext = "." + (filename.split(".").pop() || "").toLowerCase();

  if (ext === ".pdf" || mimeType?.includes("pdf")) {
    return {
      label: "PDF",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
      icon: FileText,
      iconColor: "text-rose-600",
    };
  }
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) || mimeType?.startsWith("image/")) {
    return {
      label: "IMAGE",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
      icon: ImageIcon,
      iconColor: "text-sky-600",
    };
  }
  if ([".docx", ".doc"].includes(ext) || mimeType?.includes("word")) {
    return {
      label: "WORD",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      icon: FileSpreadsheet,
      iconColor: "text-indigo-600",
    };
  }

  return {
    label: ext.replace(".", "").toUpperCase() || "DOC",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    icon: FileText,
    iconColor: "text-slate-600",
  };
}

// ═══════════════════════════════════════════════════════════════
// 1. COMPOSANT TÉLÉVERSEMENT DE PHOTO AVEC EXIGENCES STRICTES
// ═══════════════════════════════════════════════════════════════

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoChange: (photoDataUrl: string, fileMeta?: UploadedFileItem | null) => void;
  label?: string;
  sublabel?: string;
  required?: boolean;
  maxSizeBytes?: number;
  allowedFormats?: string[];
  shape?: "square" | "circle" | "portrait";
}

export function PhotoUploadZone({
  currentPhotoUrl,
  onPhotoChange,
  label = "Photo d'Identité Officielle",
  sublabel = "Photo récente sur fond blanc (Norme 4x4)",
  required = false,
  maxSizeBytes = DEFAULT_PHOTO_REQUIREMENTS.maxSizeBytes,
  shape = "portrait",
}: PhotoUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeLabel = formatBytes(maxSizeBytes);

  const processFile = (file: File) => {
    setError(null);

    // 1. Exigence de Format
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    const isFormatValid =
      DEFAULT_PHOTO_REQUIREMENTS.allowedFormats.includes(file.type) ||
      DEFAULT_PHOTO_REQUIREMENTS.allowedExtensions.includes(ext);

    if (!isFormatValid) {
      setError(
        `Format "${ext || file.type}" non accepté. Exigence de format : ${DEFAULT_PHOTO_REQUIREMENTS.formatLabel}.`
      );
      return;
    }

    // 2. Exigence de Débit / Poids Max
    if (file.size > maxSizeBytes) {
      setError(
        `Débit dépassé : fichier de ${formatBytes(file.size)}. L'exigence de débit maximale est de ${maxSizeLabel}.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const meta: UploadedFileItem = {
        key: "photo",
        name: file.name,
        size: file.size,
        formattedSize: formatBytes(file.size),
        type: file.type || ext,
        dataUrl,
        uploadedAt: new Date().toISOString(),
        label,
        required,
      };
      onPhotoChange(dataUrl, meta);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (e.target) e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    setError(null);
    onPhotoChange("", null);
  };

  const shapeClasses =
    shape === "circle"
      ? "w-28 h-28 rounded-full"
      : shape === "square"
      ? "w-28 h-28 rounded-2xl"
      : "w-28 h-36 rounded-2xl"; // Portrait 4x4

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-[#0C356A]" />
          <span>{label}</span>
          {required && <span className="text-[#DC2626] font-bold">*</span>}
        </label>
        {/* Badge Exigences Techniques Photo */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
          Exigences : {DEFAULT_PHOTO_REQUIREMENTS.formatLabel} • Débit max {maxSizeLabel}
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-center gap-4 ${
          isDragging
            ? "border-[#0C356A] bg-blue-50/80 scale-[1.01]"
            : error
            ? "border-rose-300 bg-rose-50/30"
            : "border-dashed border-slate-300 hover:border-[#0C356A]/60 bg-slate-50/60"
        }`}
      >
        {/* Aperçu Photo ou Placeholder */}
        <div className="relative shrink-0">
          <div
            className={`${shapeClasses} overflow-hidden border-2 shadow-sm bg-white flex items-center justify-center ${
              currentPhotoUrl ? "border-[#0C356A]" : "border-slate-300"
            }`}
          >
            {currentPhotoUrl ? (
              <img
                src={currentPhotoUrl}
                alt="Aperçu Photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-slate-400 text-center">
                <Camera className="w-8 h-8 mb-1 text-slate-300" />
                <span className="text-[10px] font-bold leading-tight">4x4</span>
              </div>
            )}
          </div>

          {currentPhotoUrl && (
            <button
              type="button"
              onClick={handleRemove}
              title="Supprimer la photo"
              className="absolute -top-1.5 -right-1.5 p-1 bg-[#DC2626] hover:bg-red-700 text-white rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Instructions & Actions */}
        <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
          <div>
            <div className="text-xs font-bold text-slate-800">
              {currentPhotoUrl ? "Photo d'identité chargée avec succès" : "Sélectionner ou glisser une photo"}
            </div>
            <div className="text-[11px] text-slate-500">{sublabel}</div>
          </div>

          {/* Exigences détaillées */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Formats : <strong>{DEFAULT_PHOTO_REQUIREMENTS.formatLabel}</strong>
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              <HardDrive className="w-3 h-3 text-[#0C356A]" />
              Débit max : <strong>{maxSizeLabel}</strong>
            </span>
          </div>

          {/* Bouton de sélection */}
          <div className="flex items-center gap-2 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors active:scale-95"
            >
              {currentPhotoUrl ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-200" />
                  <span>Remplacer la photo</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 text-blue-200" />
                  <span>Téléverser la photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Alerte Erreur Format ou Débit */}
      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-bold block">Non-conformité détectée :</strong>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. MODAL DE PRÉVISUALISATION DU DOCUMENT
// ═══════════════════════════════════════════════════════════════

interface DocumentViewerModalProps {
  document: UploadedFileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewerModal({ document, isOpen, onClose }: DocumentViewerModalProps) {
  if (!isOpen || !document) return null;

  const isImage =
    document.type.startsWith("image/") ||
    [".jpg", ".jpeg", ".png", ".webp"].some((ext) =>
      document.name.toLowerCase().endsWith(ext)
    );
  const isPdf =
    document.type.includes("pdf") || document.name.toLowerCase().endsWith(".pdf");

  const badge = getFileTypeBadge(document.name, document.type);
  const Icon = badge.icon;

  const handleDownload = () => {
    if (!document.dataUrl) {
      alert("Ce document n'a pas de flux direct disponible au téléchargement.");
      return;
    }
    const link = window.document.createElement("a");
    link.href = document.dataUrl;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-[#0C356A] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badge.badgeColor}`}>
                  {badge.label}
                </span>
                <span className="text-xs text-blue-200 font-mono font-bold">
                  Débit : {document.formattedSize}
                </span>
              </div>
              <h3 className="text-base font-black truncate mt-0.5">
                {document.label || document.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {document.dataUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Télécharger le fichier"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Télécharger</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              title="Fermer la prévisualisation"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Zone de contenu / Visualisation */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-100 flex items-center justify-center min-h-[300px] max-h-[65vh]">
          {isImage && document.dataUrl ? (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <img
                src={document.dataUrl}
                alt={document.name}
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md border border-slate-300 bg-white"
              />
            </div>
          ) : isPdf && document.dataUrl ? (
            <iframe
              src={document.dataUrl}
              title={document.name}
              className="w-full h-[60vh] rounded-xl border border-slate-300 bg-white shadow-md"
            />
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl border border-slate-300 shadow-sm max-w-md">
              <Icon className={`w-16 h-16 mx-auto mb-3 ${badge.iconColor}`} />
              <h4 className="font-bold text-slate-900 text-sm mb-1">{document.name}</h4>
              <p className="text-xs text-slate-500 mb-4">
                Fichier {badge.label} enregistré &bull; Débit : {document.formattedSize}
              </p>
              {document.dataUrl ? (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-5 py-2.5 bg-[#0C356A] text-white font-bold rounded-xl text-xs flex items-center gap-2 mx-auto shadow-md hover:bg-[#164E87] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger pour visualiser</span>
                </button>
              ) : (
                <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  Document archivé dans le dossier officiel de l&apos;établissement Avenida.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer métadonnées */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>Fichier : <strong className="text-slate-800">{document.name}</strong></span>
            <span>&bull;</span>
            <span>Débit : <strong className="font-mono text-slate-800">{document.formattedSize}</strong></span>
            {document.uploadedAt && (
              <>
                <span>&bull;</span>
                <span className="text-slate-500 text-[11px]">
                  Ajouté le {new Date(document.uploadedAt).toLocaleDateString("fr-FR")}
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. GESTIONNAIRE COMPLET DE DOCUMENTS REQUIS & AJOUT LIBRE
// ═══════════════════════════════════════════════════════════════

interface DocumentUploadManagerProps {
  requiredDefs: RequiredDocDef[];
  uploadedFiles: Record<string, UploadedFileItem>;
  onFilesChange: (files: Record<string, UploadedFileItem>) => void;
  title?: string;
  subtitle?: string;
  maxSizeBytes?: number;
  allowedFormats?: string[];
  allowCustomDocs?: boolean;
}

export function DocumentUploadManager({
  requiredDefs,
  uploadedFiles,
  onFilesChange,
  title = "Pièces Justificatives & Documents Requis",
  subtitle = "Téléversez les documents officiels demandés pour valider le dossier",
  maxSizeBytes = DEFAULT_DOCUMENT_REQUIREMENTS.maxSizeBytes,
  allowCustomDocs = true,
}: DocumentUploadManagerProps) {
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});
  const [activePreviewDoc, setActivePreviewDoc] = useState<UploadedFileItem | null>(null);

  // Modal d'ajout d'un document personnalisé
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customDocLabel, setCustomDocLabel] = useState("");
  const [customDocCategory, setCustomDocCategory] = useState("Autre Pièce Justificative");
  const [customDocRequired, setCustomDocRequired] = useState(false);
  const [customDocFile, setCustomDocFile] = useState<File | null>(null);
  const [customDocError, setCustomDocError] = useState<string | null>(null);

  const customFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const maxSizeLabel = formatBytes(maxSizeBytes);

  // Calcul du débit total des documents
  const totalBytes = Object.values(uploadedFiles)
    .filter((f) => f.key !== "photo")
    .reduce((acc, curr) => acc + (curr.size || 0), 0);

  // Nombre de documents obligatoires fournis
  const requiredList = requiredDefs.filter((d) => d.required);
  const requiredProvidedCount = requiredList.filter((d) => !!uploadedFiles[d.key]).length;

  // Validation d'un fichier selon format et débit
  const validateFile = (file: File): string | null => {
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    const isFormatValid =
      DEFAULT_DOCUMENT_REQUIREMENTS.allowedFormats.includes(file.type) ||
      DEFAULT_DOCUMENT_REQUIREMENTS.allowedExtensions.includes(ext);

    if (!isFormatValid) {
      return `Format "${ext || file.type}" non autorisé. Exigences : ${DEFAULT_DOCUMENT_REQUIREMENTS.formatLabel}.`;
    }

    if (file.size > maxSizeBytes) {
      return `Débit dépassé : ${(file.size / (1024 * 1024)).toFixed(2)} Mo. Le débit maximal autorisé est de ${maxSizeLabel} par document.`;
    }

    return null;
  };

  // Traitement du téléversement d'un document spécifique
  const handleUploadDoc = (docKey: string, file: File, label?: string, isRequired = false) => {
    const validationError = validateFile(file);
    if (validationError) {
      setDocErrors((prev) => ({ ...prev, [docKey]: validationError }));
      return;
    }

    setDocErrors((prev) => ({ ...prev, [docKey]: "" }));

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
      const newItem: UploadedFileItem = {
        key: docKey,
        name: file.name,
        size: file.size,
        formattedSize: formatBytes(file.size),
        type: file.type || "." + (file.name.split(".").pop() || ""),
        dataUrl,
        uploadedAt: new Date().toISOString(),
        label: label || docKey,
        required: isRequired,
      };

      onFilesChange({
        ...uploadedFiles,
        [docKey]: newItem,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (docKey: string) => {
    const next = { ...uploadedFiles };
    delete next[docKey];
    onFilesChange(next);
    setDocErrors((prev) => ({ ...prev, [docKey]: "" }));
  };

  // Traitement de l'ajout d'un document personnalisé
  const handleAddCustomDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDocLabel.trim()) {
      setCustomDocError("Veuillez renseigner un intitulé pour le document.");
      return;
    }
    if (!customDocFile) {
      setCustomDocError("Veuillez sélectionner un fichier à téléverser.");
      return;
    }

    const valErr = validateFile(customDocFile);
    if (valErr) {
      setCustomDocError(valErr);
      return;
    }

    const uniqueKey = `custom_doc_${Date.now()}`;
    handleUploadDoc(uniqueKey, customDocFile, customDocLabel.trim(), customDocRequired);

    // Reset modal
    setCustomDocLabel("");
    setCustomDocCategory("Autre Pièce Justificative");
    setCustomDocRequired(false);
    setCustomDocFile(null);
    setCustomDocError(null);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* ── EN-TÊTE DU GESTIONNAIRE AVEC EXIGENCES TECHNIQUES & DÉBIT ── */}
      <div className="bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/70 p-4 sm:p-5 rounded-2xl border-2 border-blue-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0C356A] text-white flex items-center justify-center shadow-xs shrink-0">
              <FileCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 font-serif">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500">{subtitle}</p>
            </div>
          </div>

          {/* Débit & Statut global */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1 bg-white rounded-xl border border-slate-200 text-right shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                Débit Utilisé
              </span>
              <span className="text-xs font-mono font-black text-[#0C356A]">
                {formatBytes(totalBytes)}
              </span>
            </div>

            {requiredList.length > 0 && (
              <div
                className={`px-3 py-1 rounded-xl border text-right shadow-2xs ${
                  requiredProvidedCount === requiredList.length
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-wider block">
                  Obligatoires
                </span>
                <span className="text-xs font-black">
                  {requiredProvidedCount} / {requiredList.length} fournis
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bannière Exigences Techniques de Format & Débit */}
        <div className="p-3 bg-white/95 rounded-xl border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs text-slate-700">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Exigences de Format :</span>
              <span className="font-mono bg-blue-50 text-[#0C356A] px-2 py-0.5 rounded border border-blue-200">
                {DEFAULT_DOCUMENT_REQUIREMENTS.formatLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <HardDrive className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>Exigence de Débit :</span>
              <span className="font-mono bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                Max {maxSizeLabel} / doc
              </span>
            </div>
          </div>

          {allowCustomDocs && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors self-start md:self-auto cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>Ajouter un document demandé</span>
            </button>
          )}
        </div>
      </div>

      {/* ── LISTE DES DOCUMENTS REQUIS OFFICIELS ── */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 px-1">
          Documents de la Nomenclature Officielle Avenida
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requiredDefs.map((docDef) => {
            const uploaded = uploadedFiles[docDef.key];
            const error = docErrors[docDef.key];

            return (
              <div
                key={docDef.key}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2.5 ${
                  uploaded
                    ? "bg-emerald-50/40 border-emerald-300/80 shadow-2xs"
                    : docDef.required
                    ? "bg-white border-blue-200 hover:border-blue-400"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          uploaded
                            ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                            : docDef.required
                            ? "bg-[#DC2626]"
                            : "bg-slate-300"
                        }`}
                      />
                      <span className="font-bold text-xs text-slate-900 leading-tight">
                        {docDef.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {docDef.required ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          Requis
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Optionnel
                        </span>
                      )}
                    </div>
                  </div>

                  {docDef.description && (
                    <p className="text-[11px] text-slate-500 mt-1 pl-4">
                      {docDef.description}
                    </p>
                  )}
                </div>

                {/* Si déjà téléversé */}
                {uploaded ? (
                  <div className="mt-1 pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] text-emerald-950 truncate" title={uploaded.name}>
                          {uploaded.name}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-mono">
                          Débit : {uploaded.formattedSize}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActivePreviewDoc(uploaded)}
                        title="Aperçu du document"
                        className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Remplacer */}
                      <input
                        ref={(el) => {
                          fileInputRefs.current[docDef.key] = el;
                        }}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadDoc(docDef.key, file, docDef.label, docDef.required);
                          if (e.target) e.target.value = "";
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[docDef.key]?.click()}
                        title="Remplacer le document"
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(docDef.key)}
                        title="Supprimer ce document"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Zone de sélection de fichier */
                  <div className="mt-1">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[docDef.key] = el;
                      }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadDoc(docDef.key, file, docDef.label, docDef.required);
                        if (e.target) e.target.value = "";
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[docDef.key]?.click()}
                      className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-[#0C356A] hover:bg-blue-50/50 rounded-xl text-slate-600 hover:text-[#0C356A] text-[11px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-[#0C356A]" />
                      <span>Téléverser le document (Max {maxSizeLabel})</span>
                    </button>
                  </div>
                )}

                {/* Message d'erreur spécifique */}
                {error && (
                  <div className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DOCUMENTS COMPLÉMENTAIRES / LIBRES AJOUTÉS DYNAMIQUEMENT ── */}
      {Object.entries(uploadedFiles).filter(([k]) => k.startsWith("custom_doc_")).length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#0C356A]">
              Documents Complémentaires & Pièces Jointes Libres ({Object.entries(uploadedFiles).filter(([k]) => k.startsWith("custom_doc_")).length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(uploadedFiles)
              .filter(([k]) => k.startsWith("custom_doc_"))
              .map(([key, item]) => {
                const badge = getFileTypeBadge(item.name, item.type);
                const Icon = badge.icon;

                return (
                  <div
                    key={key}
                    className="p-3 bg-white rounded-2xl border-2 border-blue-200/80 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0C356A] flex items-center justify-center shrink-0 border border-blue-100">
                        <Icon className="w-4 h-4 text-[#0C356A]" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-slate-900 truncate">
                          {item.label || item.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span className="truncate max-w-[140px]">{item.name}</span>
                          <span>&bull;</span>
                          <span className="text-emerald-700 font-bold">{item.formattedSize}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActivePreviewDoc(item)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0C356A] transition-colors cursor-pointer"
                        title="Prévisualiser"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(key)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── MODAL AJOUT D'UN DOCUMENT SUPPLÉMENTAIRE ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0C356A] px-2 py-0.5 rounded-full">
                  AJOUT DE DOCUMENT REQUIS
                </span>
                <h3 className="text-base font-black text-slate-900 font-serif mt-1">
                  Ajouter un Document Requis ou Complémentaire
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomDoc} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Intitulé du Document Demandé *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Justificatif de domicile, Certificat médical spécial, Attestation..."
                  value={customDocLabel}
                  onChange={(e) => setCustomDocLabel(e.target.value)}
                  className="form-input-avenida"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Catégorie du Document
                </label>
                <select
                  value={customDocCategory}
                  onChange={(e) => setCustomDocCategory(e.target.value)}
                  className="form-input-avenida"
                >
                  <option value="Pièce d'État Civil">Pièce d&apos;État Civil</option>
                  <option value="Dossier Académique & Notes">Dossier Académique & Notes</option>
                  <option value="Justificatif Médical">Justificatif Médical</option>
                  <option value="Pièce Comptable / Reçu">Pièce Comptable / Reçu</option>
                  <option value="Contrat & RH">Contrat & RH</option>
                  <option value="Autre Pièce Justificative">Autre Pièce Justificative</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="customDocRequired"
                  checked={customDocRequired}
                  onChange={(e) => setCustomDocRequired(e.target.checked)}
                  className="w-4 h-4 text-[#0C356A] rounded border-slate-300"
                />
                <label htmlFor="customDocRequired" className="font-bold text-slate-700 cursor-pointer">
                  Marquer ce document comme obligatoire pour le dossier
                </label>
              </div>

              {/* Fichier à joindre avec exigences de format & débit */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Fichier Numérique *
                </label>
                <div className="text-[10px] text-slate-500 mb-1.5 flex items-center gap-2">
                  <span className="font-semibold text-[#0C356A]">
                    Formats : {DEFAULT_DOCUMENT_REQUIREMENTS.formatLabel}
                  </span>
                  <span>&bull;</span>
                  <span className="font-semibold text-[#DC2626]">
                    Débit Max : {maxSizeLabel}
                  </span>
                </div>

                <input
                  ref={customFileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setCustomDocFile(f);
                  }}
                  className="hidden"
                />

                <div
                  onClick={() => customFileInputRef.current?.click()}
                  className="p-4 border-2 border-dashed border-slate-300 hover:border-[#0C356A] bg-slate-50 hover:bg-blue-50/40 rounded-2xl cursor-pointer text-center transition-all"
                >
                  {customDocFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <span>{customDocFile.name}</span>
                      <span className="text-[10px] text-emerald-600 font-mono">
                        ({formatBytes(customDocFile.size)})
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud className="w-7 h-7 text-slate-400 mx-auto" />
                      <div className="font-bold text-slate-700">
                        Cliquer pour sélectionner le document
                      </div>
                      <div className="text-[10px] text-slate-400">
                        PDF, JPG, PNG, WEBP, DOCX jusqu&apos;à {maxSizeLabel}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {customDocError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{customDocError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Valider & Ajouter au Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL PRÉVISUALISATION ── */}
      <DocumentViewerModal
        document={activePreviewDoc}
        isOpen={!!activePreviewDoc}
        onClose={() => setActivePreviewDoc(null)}
      />
    </div>
  );
}
