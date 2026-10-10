"use client";

import { useState, useEffect } from "react";
import {
  UserCheck,
  Building,
  Phone,
  Mail,
  PlusCircle,
  Search,
  Star,
  CreditCard,
  X,
  Award,
  Printer,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Paperclip,
  Eye,
  Edit3,
  Download,
  BedDouble,
  FolderOpen,
  ShieldCheck,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { MOCK_CUSTOMERS } from "@/lib/mock-data";
import { HotelCustomer, PaymentReceipt } from "@/types";
import { formatFCFA } from "@/lib/utils";
import { CustomerAttestationModal } from "@/components/shared/CustomerAttestationModal";
import { OfficialPaymentReceiptModal } from "@/components/shared/OfficialPaymentReceiptModal";
import { DirectorPendingApprovalsBanner } from "@/components/shared/DirectorPendingApprovalsBanner";
import { EditWithDirectorApprovalModal } from "@/components/shared/EditWithDirectorApprovalModal";
import { createClient } from "@/lib/supabase/client";
import {
  DocumentViewerModal,
  DEFAULT_DOCUMENT_REQUIREMENTS,
  formatBytes,
  type UploadedFileItem,
} from "@/components/shared/DocumentUploadManager";
import {
  getStoredCustomers,
  saveAndSyncCustomer,
  syncCustomersFromSupabase,
  getStoredReceipts,
  syncReceiptsFromSupabase,
  saveAndSyncCustomerPayment,
  AVENIDA_DATA_UPDATED_EVENT,
  broadcastDataChange,
} from "@/lib/realtime-store";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<HotelCustomer[]>(MOCK_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<HotelCustomer | null>(null);
  const [selectedCustomerForAttestation, setSelectedCustomerForAttestation] = useState<HotelCustomer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<HotelCustomer | null>(null);
  const [activeDocPreview, setActiveDocPreview] = useState<UploadedFileItem | null>(null);
  const [newCustDocTitle, setNewCustDocTitle] = useState("");
  const [newCustDocCategory, setNewCustDocCategory] = useState("Pièce d'Identité");
  const [custDocError, setCustDocError] = useState<string | null>(null);

  // Règlements & Reçus Clients
  const [allReceipts, setAllReceipts] = useState<PaymentReceipt[]>([]);
  const [receiptToView, setReceiptToView] = useState<PaymentReceipt | null>(null);
  const [isCustomerPayOpen, setIsCustomerPayOpen] = useState(false);
  const [custPayAmount, setCustPayAmount] = useState<number>(35000);
  const [custPayDesignation, setCustPayDesignation] = useState("Règlement Prestation & Séjour Hôtel");
  const [custPayMethod, setCustPayMethod] = useState<"Espèces" | "Stripe" | "Mobile Money" | "Virement">("Espèces");
  const [custPayDepositor, setCustPayDepositor] = useState("");
  const [custPayPhone, setCustPayPhone] = useState("");
  const [isCustSubmitting, setIsCustSubmitting] = useState(false);

  useEffect(() => {
    setCustomers(getStoredCustomers());
    setAllReceipts(getStoredReceipts());

    Promise.all([
      syncCustomersFromSupabase(),
      syncReceiptsFromSupabase(),
    ]).then(([list]) => {
      if (list && list.length > 0) {
        setCustomers(list);
      }
      setAllReceipts(getStoredReceipts());
    });

    const handleUpdate = () => {
      const freshList = getStoredCustomers();
      setCustomers(freshList);
      setAllReceipts(getStoredReceipts());
      if (selectedCustomer) {
        const found = freshList.find((c) => c.id === selectedCustomer.id);
        if (found) setSelectedCustomer(found);
      }
    };
    window.addEventListener(AVENIDA_DATA_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(AVENIDA_DATA_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [selectedCustomer]);

  const handleAttachCustomerDocToSelected = (file: File) => {
    if (!selectedCustomer) return;
    setCustDocError(null);
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    const allowed = DEFAULT_DOCUMENT_REQUIREMENTS.allowedExtensions;
    if (!allowed.includes(ext.toLowerCase())) {
      setCustDocError(`Format "${ext}" non autorisé. Formats acceptés : ${allowed.join(", ").toUpperCase()}`);
      return;
    }
    if (file.size > DEFAULT_DOCUMENT_REQUIREMENTS.maxSizeBytes) {
      setCustDocError(`Débit dépassé : ${formatBytes(file.size)}. Débit max autorisé : 5 Mo.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const docKey = `doc_${Date.now()}`;
      const item: UploadedFileItem = {
        key: docKey,
        id: docKey,
        name: newCustDocTitle.trim() || file.name,
        size: file.size,
        formattedSize: formatBytes(file.size),
        type: file.type || ext,
        dataUrl: typeof reader.result === "string" ? reader.result : undefined,
        uploadedAt: new Date().toISOString(),
        category: newCustDocCategory,
      };

      const updatedDocs = {
        ...(selectedCustomer.uploaded_documents || {}),
        [docKey]: item,
      };

      const updatedCust: HotelCustomer = {
        ...selectedCustomer,
        uploaded_documents: updatedDocs,
      };

      setSelectedCustomer(updatedCust);
      const updatedList = customers.map((c) => (c.id === updatedCust.id ? updatedCust : c));
      setCustomers(updatedList);
      await saveAndSyncCustomer(updatedCust);
      broadcastDataChange();
      setNewCustDocTitle("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomerDocFromSelected = async (docKey: string) => {
    if (!selectedCustomer || !selectedCustomer.uploaded_documents) return;
    const remainingDocs = { ...selectedCustomer.uploaded_documents };
    delete remainingDocs[docKey];

    const updatedCust: HotelCustomer = {
      ...selectedCustomer,
      uploaded_documents: remainingDocs,
    };

    setSelectedCustomer(updatedCust);
    const updatedList = customers.map((c) => (c.id === updatedCust.id ? updatedCust : c));
    setCustomers(updatedList);
    await saveAndSyncCustomer(updatedCust);
    broadcastDataChange();
  };

  const handleDownloadFile = (name: string, dataUrl?: string) => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const [newCust, setNewCust] = useState({
    full_name: "",
    company: "",
    phone: "",
    email: "",
    nationality: "Togolaise",
    id_card_or_passport: "",
    is_vip: false,
  });

  const [idDocument, setIdDocument] = useState<{
    name: string;
    size: number;
    formattedSize: string;
    type: string;
    dataUrl?: string;
  } | null>(null);
  const [idDocError, setIdDocError] = useState<string | null>(null);

  const handleIdDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdDocError(null);

    // Formats acceptés : PDF, JPG, PNG, WEBP
    const validFormats = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!validFormats.includes(file.type) && ![".pdf", ".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      setIdDocError("Format non supporté. Formats autorisés : PDF, JPG, PNG, WEBP.");
      return;
    }

    // Débit / Taille max : 5 Mo
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setIdDocError(
        `Débit dépassé (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Le débit maximal autorisé est de 5 Mo.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
      const formattedSize =
        file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} Ko`
          : `${(file.size / (1024 * 1024)).toFixed(1)} Mo`;
      setIdDocument({
        name: file.name,
        size: file.size,
        formattedSize,
        type: file.type || ext,
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveIdDoc = () => {
    setIdDocument(null);
    setIdDocError(null);
  };

  const totalSpentAll = customers.reduce((acc, c) => acc + c.total_spent, 0);
  const vipCount = customers.filter((c) => c.is_vip).length;

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.full_name) return;

    const added: HotelCustomer = {
      id: `clt-${Date.now()}`,
      code: `CLT-${String(customers.length + 46).padStart(4, "0")}`,
      full_name: newCust.full_name,
      company: newCust.company || undefined,
      phone: newCust.phone || "+228 90 00 00 00",
      email: newCust.email || `${newCust.full_name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      nationality: newCust.nationality,
      id_card_or_passport: newCust.id_card_or_passport || "TG-CNI-XXXXXX",
      total_stays: 1,
      total_spent: 0,
      is_vip: newCust.is_vip,
      created_at: new Date().toISOString().split("T")[0],
      id_card_document: idDocument || undefined,
    };

    setCustomers([added, ...customers]);
    saveAndSyncCustomer(added);
    broadcastDataChange();
    setIdDocument(null);
    setIdDocError(null);
    setIsModalOpen(false);
    setSelectedCustomerForAttestation(added);
  };

  const selectedCustomerReceipts = selectedCustomer
    ? allReceipts.filter(
        (r) =>
          r.student_matricule === selectedCustomer.code ||
          r.student_name.toLowerCase().trim() === selectedCustomer.full_name.toLowerCase().trim() ||
          ((r as any).student_id && (r as any).student_id === selectedCustomer.id) ||
          (r.class_name.toLowerCase().includes("hôtel") &&
            r.depositor_name.toLowerCase().trim() === selectedCustomer.full_name.toLowerCase().trim())
      )
    : [];

  const handleConfirmCustomerPaymentInDrawer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = Number(custPayAmount);
    if (!amt || amt <= 0) {
      alert("Veuillez saisir un montant valide.");
      return;
    }

    setIsCustSubmitting(true);
    try {
      const receipt = await saveAndSyncCustomerPayment({
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.full_name,
        customer_phone: selectedCustomer.phone,
        customer_code: selectedCustomer.code,
        room_number: selectedCustomer.active_room_number || "Hôtel",
        reservation_id: selectedCustomer.active_reservation_id,
        amount: amt,
        designation: custPayDesignation.trim() || "Règlement Séjour & Prestations Hôtelières",
        payment_method: custPayMethod,
        depositor_name: custPayDepositor.trim() || selectedCustomer.full_name,
        depositor_phone: custPayPhone.trim() || selectedCustomer.phone,
        cashier_name: "Caisse Réception & Hôtel Avenida Lomé",
      });

      broadcastDataChange();
      setAllReceipts(getStoredReceipts());
      const freshCustomers = getStoredCustomers();
      setCustomers(freshCustomers);
      const freshSelected = freshCustomers.find((c) => c.id === selectedCustomer.id);
      if (freshSelected) {
        setSelectedCustomer(freshSelected);
      }

      setIsCustomerPayOpen(false);
      setReceiptToView(receipt);
    } catch (err) {
      console.error("Erreur enregistrement règlement client:", err);
      alert("Erreur lors de l'enregistrement du règlement.");
    } finally {
      setIsCustSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <DirectorPendingApprovalsBanner />

      {/* En-tête */}
      <div className="bg-white p-6 rounded-3xl border-2 border-red-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center shadow-md">
            <UserCheck className="w-7 h-7 text-red-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-[#DC2626] px-2 py-0.5 rounded-full">
                ESPACE HÔTEL & CLIENTS
              </span>
              <span className="text-xs text-slate-400">&bull; Fichier Clientèle</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-serif">
              Répertoire des Clients & Historique des Séjours
            </h1>
            <p className="text-xs text-slate-500">
              Coordonnées, entreprises partenaires, passeports, fidélité VIP et cumul des dépenses
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Nouveau Client Hôtel</span>
        </button>
      </div>

      {/* Statistiques Clients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Clients Enregistrés</span>
            <UserCheck className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{customers.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Carnet d&apos;adresses Avenida</div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-black">
            <span>Clients VIP & Réguliers</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">{vipCount}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">Tarifs préférentiels</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
            <span>Dépense Cumulée</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-950 mt-2">
            {formatFCFA(totalSpentAll)}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Hébergement & extras</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Panier Moyen</span>
            <Award className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-2">
            {formatFCFA(Math.round(totalSpentAll / (customers.length || 1)))}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Par client enregistré</div>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom, entreprise, n° client, téléphone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 font-bold">{filteredCustomers.length} fiche(s)</div>
      </div>

      {/* Tableau des Clients */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Code & Nom du Client</th>
                <th className="py-3.5 px-4">Entreprise / Organisme</th>
                <th className="py-3.5 px-4">Coordonnées</th>
                <th className="py-3.5 px-4">Nationalité & CNI/Passeport</th>
                <th className="py-3.5 px-4">Séjours</th>
                <th className="py-3.5 px-4">Total Dépensé</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => (
                <tr
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className="hover:bg-red-50/30 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-slate-900 group-hover:text-[#DC2626] transition-colors">{cust.full_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{cust.code}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {cust.company ? (
                      <span className="font-bold flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        {cust.company}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Particulier</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div>{cust.phone}</div>
                    <div className="text-[10px] text-slate-500">{cust.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{cust.nationality}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500">{cust.id_card_or_passport}</span>
                      {cust.id_card_document && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDocPreview({
                              key: `cust-${cust.id}-id`,
                              id: `cust-${cust.id}-id`,
                              name: cust.id_card_document?.name || `Pièce ${cust.full_name}`,
                              size: cust.id_card_document?.size || 0,
                              formattedSize: cust.id_card_document?.formattedSize || "",
                              type: cust.id_card_document?.type || "application/pdf",
                              dataUrl: cust.id_card_document?.dataUrl,
                              uploadedAt: new Date().toISOString(),
                              category: "Pièce d'Identité Client",
                            });
                          }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer"
                          title="Cliquer pour prévisualiser la pièce d'identité"
                        >
                          <Eye className="w-2.5 h-2.5" /> Pièce ({cust.id_card_document.formattedSize})
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{cust.total_stays} séjour(s)</td>
                  <td className="py-3 px-4 font-mono font-black text-emerald-800">
                    {formatFCFA(cust.total_spent)}
                  </td>
                  <td className="py-3 px-4">
                    {cust.is_vip ? (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black border border-amber-200 flex items-center gap-1 w-fit">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        VIP
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-[#0C356A] hover:text-white text-slate-700 font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                        title="Consulter le dossier individuel complet et les pièces fournies"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Dossier 360°</span>
                      </button>
                      <button
                        onClick={() => setCustomerToEdit(cust)}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-500 hover:text-slate-950 text-amber-900 border border-amber-300 font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                        title="Modifier les données du client (Visa du Directeur Général requis)"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => setSelectedCustomerForAttestation(cust)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-[#DC2626] hover:text-white text-[#DC2626] font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs border border-red-200 active:scale-95 cursor-pointer"
                        title="Générer et télécharger la Fiche Client Officielle (PDF)"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Fiche Client</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DOSSIER CLIENT INDIVIDUEL COMPLET & COFFRE-FORT NUMÉRIQUE      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header du dossier client */}
            <div className="p-6 bg-gradient-to-r from-[#DC2626] to-[#991B1B] text-white rounded-t-3xl relative">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-xl font-black shadow-md shrink-0">
                  {selectedCustomer.full_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-mono">
                      {selectedCustomer.code}
                    </span>
                    {selectedCustomer.is_vip ? (
                      <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                        Client VIP
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded-full">
                        Client Standard
                      </span>
                    )}
                    {selectedCustomer.active_room_number && (
                      <span className="text-[10px] font-black bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <BedDouble className="w-3 h-3" />
                        En Chambre : {selectedCustomer.active_room_number}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black mt-1">
                    {selectedCustomer.full_name}
                  </h2>
                  <p className="text-xs text-red-100">
                    {selectedCustomer.company ? `Société : ${selectedCustomer.company}` : "Client Particulier"} &bull; {selectedCustomer.nationality}
                  </p>
                </div>
              </div>
            </div>

            {/* Corps du dossier */}
            <div className="p-6 space-y-5 text-xs text-slate-700">
              {/* 1. Coordonnées & Identification */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#DC2626] border-b pb-1 mb-2.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Coordonnées & Identification Officielle</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Téléphone</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedCustomer.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Email</span>
                    <span className="font-bold text-slate-900 truncate block">{selectedCustomer.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Nationalité</span>
                    <span className="font-bold text-slate-900">{selectedCustomer.nationality}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">N° CNI / Passeport</span>
                    <span className="font-mono font-bold text-slate-900">{selectedCustomer.id_card_or_passport}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block">Entreprise / Organisme</span>
                    <span className="font-bold text-slate-900">{selectedCustomer.company || "Non rattaché (Individuel)"}</span>
                  </div>
                </div>
              </div>

              {/* 2. Situation Financière & Compte Client */}
              <div>
                <div className="flex items-center justify-between border-b pb-1 mb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#DC2626] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Situation Financière & Règlements Hôteliers</span>
                  </h3>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Synchronisé Caisse & Supabase
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-red-50/40 p-3.5 rounded-2xl border border-red-200 mb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Total Dépensé Cumulé</span>
                    <span className="font-mono font-black text-emerald-800 text-sm">
                      {formatFCFA(selectedCustomer.total_spent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Séjours Enregistrés</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {selectedCustomer.total_stays} séjour(s)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Solde Restant à Régler</span>
                    <span className={`font-mono font-black text-sm ${Number(selectedCustomer.balance) > 0 ? "text-[#DC2626]" : "text-emerald-700 font-bold"}`}>
                      {Number(selectedCustomer.balance) > 0 ? formatFCFA(Number(selectedCustomer.balance)) : "0 F CFA (Soldé)"}
                    </span>
                  </div>
                </div>

                {/* Actions de Paiement & Reçu Définitif */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCustPayAmount(Number(selectedCustomer.balance) > 0 ? Number(selectedCustomer.balance) : 35000);
                      setCustPayDepositor(selectedCustomer.full_name);
                      setCustPayPhone(selectedCustomer.phone);
                      setCustPayDesignation(Number(selectedCustomer.balance) > 0 ? "Règlement Solde Séjour / Prestations" : "Acompte / Prestation Hôtel");
                      setIsCustomerPayOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Encaisser / Régler Séjour</span>
                  </button>

                  {Number(selectedCustomer.balance) === 0 && selectedCustomerReceipts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setReceiptToView(selectedCustomerReceipts[0])}
                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Reçu Définitif (Facture Acquittée)</span>
                    </button>
                  )}

                  <Link
                    href="/dashboard/payments"
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <span>Caisse &rarr;</span>
                  </Link>
                </div>

                {/* Historique échelonné des reçus et règlements du client */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-[#DC2626]" />
                      Échelonnement des Règlements & Reçus ({selectedCustomerReceipts.length})
                    </span>
                    <span className="text-[10px] text-slate-400">Date, heure & montants</span>
                  </div>

                  {selectedCustomerReceipts.length === 0 ? (
                    <div className="p-3 text-center text-[11px] text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                      Aucun reçu d'encaissement enregistré pour ce client. Cliquez sur "+ Encaisser / Régler Séjour" pour effectuer un versement.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {selectedCustomerReceipts.map((rec) => (
                        <div
                          key={rec.id}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition"
                        >
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span className="font-mono text-[10px] text-red-600 font-bold">{rec.reference}</span>
                              <span className="text-slate-700">{rec.designation}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {rec.date} &bull; Mode : {rec.payment_method}
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="text-right">
                              <span className="font-mono font-bold text-emerald-700 block text-xs">
                                +{formatFCFA(rec.amount_paid)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Reste : {formatFCFA(rec.remaining_due)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReceiptToView(rec)}
                              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Visualiser et imprimer le reçu officiel avec échelonnement"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Historique des Séjours */}
              {selectedCustomer.stay_history && selectedCustomer.stay_history.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#DC2626] border-b pb-1 mb-2.5">
                    Historique des Séjours & Chambres Occupées
                  </h3>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedCustomer.stay_history.map((st) => (
                      <div
                        key={st.id}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <BedDouble className="w-3.5 h-3.5 text-red-600" />
                          <div>
                            <strong className="text-slate-900">Chambre {st.room_number}</strong>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Du {st.check_in} au {st.check_out} &bull; Réf: {st.booking_ref}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900">{formatFCFA(st.total_amount)}</div>
                          <span className="text-[9px] font-bold text-emerald-700 uppercase">{st.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. DÉPÔT & GESTION DES PIÈCES FOURNIES PAR LE CLIENT */}
              <div>
                <div className="flex items-center justify-between border-b pb-1.5 mb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#DC2626] flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Coffre-Fort Numérique &amp; Pièces Fournies par le Client</span>
                  </h3>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {Object.keys(selectedCustomer.uploaded_documents || {}).length + (selectedCustomer.id_card_document ? 1 : 0)} document(s)
                  </span>
                </div>

                <div className="p-2.5 mb-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Gestion des Pièces d&apos;Identité &amp; Justificatifs Avenida :</div>
                    <div className="text-blue-800 text-[10px]">
                      Formats : <strong>PDF, JPG, PNG, WEBP, DOCX</strong> &bull; Débit max : <strong>5 Mo</strong> &bull; Transparence totale pour les gestionnaires
                    </div>
                  </div>
                </div>

                {custDocError && (
                  <div className="p-2.5 mb-3 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{custDocError}</span>
                  </div>
                )}

                {/* Pièce d'identité principale scannée à l'enregistrement si présente */}
                {selectedCustomer.id_card_document && (
                  <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-300 flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <strong className="text-slate-900 text-xs block truncate">
                          {selectedCustomer.id_card_document.name || "CNI / Passeport Principal"}
                        </strong>
                        <span className="text-[10px] text-emerald-800 font-bold">
                          Pièce d&apos;identité officielle &bull; {selectedCustomer.id_card_document.formattedSize}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveDocPreview({
                            key: "main-id",
                            id: "main-id",
                            name: selectedCustomer.id_card_document?.name || "Pièce d'Identité",
                            size: selectedCustomer.id_card_document?.size || 0,
                            formattedSize: selectedCustomer.id_card_document?.formattedSize || "",
                            type: selectedCustomer.id_card_document?.type || "application/pdf",
                            dataUrl: selectedCustomer.id_card_document?.dataUrl,
                            uploadedAt: new Date().toISOString(),
                            category: "Pièce d'Identité",
                          })
                        }
                        className="p-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 cursor-pointer"
                        title="Visualiser"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {selectedCustomer.id_card_document.dataUrl && (
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(selectedCustomer.id_card_document?.name || "Piece_Identite.pdf", selectedCustomer.id_card_document?.dataUrl)}
                          className="p-1.5 rounded-lg bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 cursor-pointer"
                          title="Télécharger la pièce"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Liste des autres pièces fournies déposées */}
                {selectedCustomer.uploaded_documents && Object.keys(selectedCustomer.uploaded_documents).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {Object.entries(selectedCustomer.uploaded_documents).map(([key, doc]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-red-50/30 rounded-xl border border-slate-200 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{doc.name}</p>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              {doc.category && <span className="text-red-700 font-semibold">{doc.category}</span>}
                              <span className="font-mono text-slate-500 font-bold">{doc.formattedSize}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveDocPreview(doc)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                            title="Consulter"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {doc.dataUrl && (
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(doc.name, doc.dataUrl)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                              title="Télécharger"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomerDocFromSelected(key)}
                            className="p-1.5 rounded-lg bg-slate-100 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
                            title="Supprimer la pièce"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !selectedCustomer.id_card_document && (
                  <div className="p-3 mb-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-[11px] text-slate-500">
                    Aucune pièce justificative déposée pour le moment.
                  </div>
                )}

                {/* Formulaire de dépôt d'une nouvelle pièce fournie */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-black uppercase text-slate-700 block mb-2 flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-[#DC2626]" />
                    Déposer une nouvelle pièce fournie par le client
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Libellé (ex: Registre Commerce, Passeport, Attestation...)"
                      value={newCustDocTitle}
                      onChange={(e) => setNewCustDocTitle(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <select
                      value={newCustDocCategory}
                      onChange={(e) => setNewCustDocCategory(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="Pièce d'Identité">Pièce d&apos;Identité / Passeport</option>
                      <option value="Registre de Commerce">Registre de Commerce / RCCM</option>
                      <option value="Justificatif de Domicile">Justificatif de Domicile / Facture</option>
                      <option value="Attestation d'Entreprise">Attestation de Prise en Charge</option>
                      <option value="Contrat Séjour">Contrat d&apos;Hébergement Spécial</option>
                      <option value="Autre Pièce Fournie">Autre Pièce Fournie</option>
                    </select>
                  </div>
                  <label className="flex items-center justify-center gap-2 p-2 rounded-xl border-2 border-dashed border-red-300 hover:border-red-500 bg-white hover:bg-red-50/30 cursor-pointer text-red-800 transition-colors">
                    <UploadCloud className="w-4 h-4 text-red-600" />
                    <span className="font-bold text-[11px]">
                      Téléverser le document déposé (PDF ou Image, Max 5 Mo)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAttachCustomerDocToSelected(file);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center rounded-b-3xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const c = selectedCustomer;
                    setSelectedCustomer(null);
                    setSelectedCustomerForAttestation(c);
                  }}
                  className="px-4 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Fiche Client Officielle (PDF)</span>
                </button>
                <button
                  onClick={() => {
                    const c = selectedCustomer;
                    setSelectedCustomer(null);
                    setCustomerToEdit(c);
                  }}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-400 text-amber-950 border border-amber-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Modifier (Visa Direction)</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveau Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-[#DC2626]">Créer une Fiche Client</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom & Prénom(s) *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Dr. Mensah Agbéyomé"
                  value={newCust.full_name}
                  onChange={(e) => setNewCust({ ...newCust, full_name: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Société / Entreprise (facultatif)</label>
                <input
                  type="text"
                  placeholder="ex: BOAD, Clinique..."
                  value={newCust.company}
                  onChange={(e) => setNewCust({ ...newCust, company: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="+228 90 00 00 00"
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={newCust.email}
                    onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nationalité</label>
                  <input
                    type="text"
                    value={newCust.nationality}
                    onChange={(e) => setNewCust({ ...newCust, nationality: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">N° CNI ou Passeport</label>
                  <input
                    type="text"
                    placeholder="TG-CNI-..."
                    value={newCust.id_card_or_passport}
                    onChange={(e) => setNewCust({ ...newCust, id_card_or_passport: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              {/* Téléversement Pièce d'identité / Passeport */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block text-xs">
                    Pièce d&apos;Identité / Passeport Scanné (Facultatif)
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                    Max 5 Mo
                  </span>
                </div>

                {/* Exigences de format et débit */}
                <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200/70 text-[11px] text-blue-900 flex items-center justify-between gap-2">
                  <span>
                    Exigences : Formats <strong>PDF, JPG, PNG, WEBP</strong> • Débit max <strong>5 Mo</strong>
                  </span>
                </div>

                {idDocError && (
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{idDocError}</span>
                  </div>
                )}

                {idDocument ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs truncate">{idDocument.name}</p>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                          {idDocument.formattedSize}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {idDocument.dataUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveDocPreview({
                              key: "cust-id-preview",
                              id: "cust-id-preview",
                              name: idDocument.name,
                              size: idDocument.size,
                              formattedSize: idDocument.formattedSize,
                              type: idDocument.type,
                              dataUrl: idDocument.dataUrl,
                              uploadedAt: new Date().toISOString(),
                              category: "Pièce d'Identité Client",
                            })
                          }
                          className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-100/50"
                          title="Aperçu de la pièce"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleRemoveIdDoc}
                        className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-100/50"
                        title="Supprimer la pièce"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-red-400 bg-slate-50 hover:bg-red-50/20 cursor-pointer text-slate-600 transition-colors">
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-xs text-slate-700">
                      Téléverser la pièce d&apos;identité (PDF ou Image)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                      onChange={handleIdDocUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vip-status"
                  checked={newCust.is_vip}
                  onChange={(e) => setNewCust({ ...newCust, is_vip: e.target.checked })}
                  className="w-4 h-4 rounded text-[#DC2626]"
                />
                <label htmlFor="vip-status" className="font-bold text-slate-700">
                  Classifier en tant que Client VIP / Partenaire Régulier
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#DC2626] text-white font-bold rounded-xl shadow-md"
                >
                  Enregistrer la Fiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Attestation & Fiche Client Imprimable A4 */}
      {selectedCustomerForAttestation && (
        <CustomerAttestationModal
          customer={selectedCustomerForAttestation}
          isOpen={!!selectedCustomerForAttestation}
          onClose={() => setSelectedCustomerForAttestation(null)}
        />
      )}

      {/* Visionneuse de document d'identité client */}
      <DocumentViewerModal
        document={activeDocPreview}
        isOpen={!!activeDocPreview}
        onClose={() => setActiveDocPreview(null)}
      />

      {/* Modal Modification d'informations sous autorisation du Directeur */}
      {customerToEdit && (
        <EditWithDirectorApprovalModal
          entityType="customer"
          entityData={customerToEdit}
          isOpen={!!customerToEdit}
          onClose={() => setCustomerToEdit(null)}
          onSuccess={() => {
            setCustomers(getStoredCustomers());
            if (selectedCustomerForAttestation?.id === customerToEdit.id) {
              const fresh = getStoredCustomers().find((c) => c.id === customerToEdit.id);
              if (fresh) setSelectedCustomerForAttestation(fresh);
            }
          }}
        />
      )}

      {/* Modal Reçu de Paiement Officiel avec Échelonnement & Quittance Définitive */}
      {receiptToView && (
        <OfficialPaymentReceiptModal
          receipt={receiptToView}
          allEntityReceipts={selectedCustomerReceipts.length > 0 ? selectedCustomerReceipts : allReceipts}
          isOpen={!!receiptToView}
          onClose={() => setReceiptToView(null)}
        />
      )}

      {/* Modal Règlement Client & Encaissement Séjour */}
      {isCustomerPayOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-red-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-[#DC2626] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-serif">Encaisser un Règlement Client</h3>
                  <p className="text-xs text-slate-500">{selectedCustomer.full_name} &bull; Réf: {selectedCustomer.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerPayOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmCustomerPaymentInDrawer} className="space-y-4 pt-4">
              <div className="bg-red-50/50 p-3 rounded-2xl border border-red-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px]">SOLDE ACTUEL DÉBITEUR</span>
                  <span className="font-mono font-black text-[#DC2626] text-sm">
                    {formatFCFA(Number(selectedCustomer.balance) || 0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-bold block text-[10px]">TOTAL DÉPENSÉ</span>
                  <span className="font-mono font-black text-emerald-800 text-sm">
                    {formatFCFA(Number(selectedCustomer.total_spent) || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Montant à Encaisser (FCFA) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="500"
                  required
                  value={custPayAmount}
                  onChange={(e) => setCustPayAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Désignation / Motif de l'encaissement *
                </label>
                <input
                  type="text"
                  required
                  value={custPayDesignation}
                  onChange={(e) => setCustPayDesignation(e.target.value)}
                  placeholder="Ex: Règlement nuitées, Restauration, Prestation..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mode de Paiement</label>
                  <select
                    value={custPayMethod}
                    onChange={(e) => setCustPayMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                  >
                    <option value="Espèces">Espèces (Caisse)</option>
                    <option value="Mobile Money">T-Money / Flooz</option>
                    <option value="Virement">Virement / Carte Bancaire</option>
                    <option value="Stripe">Stripe En Ligne</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Téléphone de Contact</label>
                  <input
                    type="text"
                    value={custPayPhone}
                    onChange={(e) => setCustPayPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nom du Déposant / Payeur</label>
                <input
                  type="text"
                  value={custPayDepositor}
                  onChange={(e) => setCustPayDepositor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerPayOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCustSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#b91c1c] rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isCustSubmitting ? "Traitement..." : "Valider l'Encaissement & Émettre Reçu"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
