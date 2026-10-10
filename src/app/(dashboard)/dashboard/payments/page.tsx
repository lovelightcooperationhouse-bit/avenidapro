"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Printer,
  PlusCircle,
  Search,
  CheckCircle2,
  Building,
  FileCheck,
  X,
  Users,
  UserCheck,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Filter,
  DollarSign,
  Receipt,
  Download,
  ShieldCheck,
  Check,
  Building2,
  Sparkles,
} from "lucide-react";
import { PaymentReceipt, Student, HotelCustomer, HotelReservation } from "@/types";
import { formatFCFA } from "@/lib/utils";
import { AvenidaLogo } from "@/components/shared/AvenidaLogo";
import { OfficialPaymentReceiptModal } from "@/components/shared/OfficialPaymentReceiptModal";
import {
  getStoredReceipts,
  saveAndSyncReceipt,
  syncReceiptsFromSupabase,
  getStoredStudents,
  syncStudentsFromSupabase,
  getStoredCustomers,
  syncCustomersFromSupabase,
  getStoredReservations,
  syncReservationsFromSupabase,
  saveAndSyncCustomerPayment,
  formatReceiptDateTime,
  AVENIDA_DATA_UPDATED_EVENT,
} from "@/lib/realtime-store";

type CaisseTab = "students" | "customers" | "receipts";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<CaisseTab>("students");
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [customers, setCustomers] = useState<HotelCustomer[]>([]);
  const [reservations, setReservations] = useState<HotelReservation[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SETTLED" | "PENDING" | "UNPAID">("ALL");

  // Modal Encaissement Élève
  const [isStudentPaymentModalOpen, setIsStudentPaymentModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(50000);
  const [paymentDesignation, setPaymentDesignation] = useState("Frais de scolarité (Tranche)");
  const [paymentMethod, setPaymentMethod] = useState<"Espèces" | "Stripe" | "Mobile Money" | "Virement">("Espèces");
  const [depositorName, setDepositorName] = useState("");
  const [depositorPhone, setDepositorPhone] = useState("");
  const [depositorRole, setDepositorRole] = useState("Parent / Tuteur");
  const [cashierName, setCashierName] = useState("Caisse Centrale Lomé");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Encaissement Client Hôtel
  const [isCustomerPaymentModalOpen, setIsCustomerPaymentModalOpen] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState<HotelCustomer | null>(null);
  const [custAmount, setCustAmount] = useState<number>(35000);
  const [custDesignation, setCustDesignation] = useState("Règlement Séjour & Hébergement");
  const [custMethod, setCustMethod] = useState<"Espèces" | "Stripe" | "Mobile Money" | "Virement">("Espèces");
  const [custDepositorName, setCustDepositorName] = useState("");
  const [custDepositorPhone, setCustDepositorPhone] = useState("");

  // Chargement et synchronisation temps réel
  const refreshAllData = () => {
    setReceipts(getStoredReceipts());
    setStudents(getStoredStudents());
    setCustomers(getStoredCustomers());
    setReservations(getStoredReservations());
  };

  useEffect(() => {
    refreshAllData();

    Promise.all([
      syncReceiptsFromSupabase(),
      syncStudentsFromSupabase(),
      syncCustomersFromSupabase(),
      syncReservationsFromSupabase(),
    ]).then(() => refreshAllData());

    window.addEventListener(AVENIDA_DATA_UPDATED_EVENT, refreshAllData);
    window.addEventListener("storage", refreshAllData);
    return () => {
      window.removeEventListener(AVENIDA_DATA_UPDATED_EVENT, refreshAllData);
      window.removeEventListener("storage", refreshAllData);
    };
  }, []);

  // Métriques financières calculées en direct
  const totalSchoolCollected = useMemo(() => {
    return students.reduce((sum, s) => sum + (Number(s.paid_fee) || 0), 0);
  }, [students]);

  const totalSchoolRemaining = useMemo(() => {
    return students.reduce((sum, s) => sum + (Number(s.remaining_fee) || 0), 0);
  }, [students]);

  const totalSchoolTarget = useMemo(() => {
    return students.reduce((sum, s) => sum + (Number(s.total_fee) || 0), 0);
  }, [students]);

  const schoolRecoveryRate = totalSchoolTarget > 0 ? Math.round((totalSchoolCollected / totalSchoolTarget) * 100) : 0;

  const settledStudentsCount = students.filter((s) => Number(s.remaining_fee) === 0).length;
  const inProgressStudentsCount = students.filter((s) => Number(s.paid_fee) > 0 && Number(s.remaining_fee) > 0).length;
  const unpaidStudentsCount = students.filter((s) => Number(s.paid_fee) === 0).length;

  const totalHotelCollected = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0);
  }, [customers]);

  // Filtrage Élèves
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.registration_number.toLowerCase().includes(q) ||
        (s.class_name && s.class_name.toLowerCase().includes(q));

      if (!matchSearch) return false;

      const rem = Number(s.remaining_fee);
      const paid = Number(s.paid_fee);

      if (statusFilter === "SETTLED") return rem === 0;
      if (statusFilter === "PENDING") return paid > 0 && rem > 0;
      if (statusFilter === "UNPAID") return paid === 0;
      return true;
    });
  }, [students, searchTerm, statusFilter]);

  // Filtrage Clients
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        c.full_name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        c.phone.includes(q)
      );
    });
  }, [customers, searchTerm]);

  // Filtrage Reçus
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const q = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        r.student_name.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        r.student_matricule.toLowerCase().includes(q) ||
        r.designation.toLowerCase().includes(q)
      );
    });
  }, [receipts, searchTerm]);

  // Action d'encaissement élève
  const openStudentCashIn = (student: Student) => {
    setTargetStudent(student);
    const suggested = Math.min(student.remaining_fee || 50000, 100000);
    setPaymentAmount(suggested > 0 ? suggested : 50000);
    setPaymentDesignation(
      student.remaining_fee === 0
        ? "Régularisation complémentaire"
        : `Frais de scolarité - Tranche (${student.class_name || "BTS"})`
    );
    setDepositorName(student.emergency_contact_name || student.tutor_name || "Parent d'Élève");
    setDepositorPhone(student.emergency_contact_phone || student.tutor_phone || student.phone || "");
    setIsStudentPaymentModalOpen(true);
  };

  const handleConfirmStudentPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudent) return;
    setIsSubmitting(true);

    try {
      const amt = Number(paymentAmount);
      const newRef = `#AV${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newRem = Math.max(0, Number(targetStudent.remaining_fee) - amt);

      const newReceipt: PaymentReceipt = {
        id: `rec-${Date.now()}`,
        reference: newRef,
        student_name: `${targetStudent.last_name} ${targetStudent.first_name}`,
        student_matricule: targetStudent.registration_number,
        class_name: targetStudent.class_name.split(" ")[0] || "BTS",
        designation: paymentDesignation,
        amount_paid: amt,
        total_due: targetStudent.total_fee,
        remaining_due: newRem,
        depositor_name: depositorName || targetStudent.emergency_contact_name || "Parent d'Élève",
        depositor_id_card: "TG-LOM-2024-9912",
        depositor_phone: depositorPhone || targetStudent.emergency_contact_phone || "+228 90 00 00 00",
        depositor_role: depositorRole,
        payment_method: paymentMethod,
        site: "LOMÉ",
        date: formatReceiptDateTime(),
        cashier_name: cashierName,
      };

      const updatedReceipts = await saveAndSyncReceipt(newReceipt);
      setReceipts(updatedReceipts);
      refreshAllData();

      setIsStudentPaymentModalOpen(false);
      setSelectedReceipt(newReceipt);
    } catch (err) {
      console.error("Erreur validation encaissement élève:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action d'encaissement client hôtel
  const openCustomerCashIn = (customer: HotelCustomer) => {
    setTargetCustomer(customer);
    setCustAmount(35000);
    setCustDesignation(`Hébergement & Séjour Hôtel — ${customer.full_name}`);
    setCustDepositorName(customer.full_name);
    setCustDepositorPhone(customer.phone);
    setIsCustomerPaymentModalOpen(true);
  };

  const handleConfirmCustomerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCustomer) return;
    setIsSubmitting(true);

    try {
      const receipt = await saveAndSyncCustomerPayment({
        customer_id: targetCustomer.code || targetCustomer.id,
        customer_name: targetCustomer.full_name,
        customer_phone: targetCustomer.phone,
        amount: Number(custAmount),
        designation: custDesignation,
        payment_method: custMethod,
        depositor_name: custDepositorName || targetCustomer.full_name,
        depositor_phone: custDepositorPhone || targetCustomer.phone,
        cashier_name: cashierName,
      });

      refreshAllData();
      setIsCustomerPaymentModalOpen(false);
      setSelectedReceipt(receipt);
    } catch (err) {
      console.error("Erreur validation encaissement client:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. En-tête Principal de la Caisse Centrale */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-slate-200 shadow-sm relative overflow-hidden">
        {/* Barre Tricolore */}
        <div className="absolute top-0 inset-x-0 h-2 flex">
          <div className="w-1/3 bg-[#0C356A]" />
          <div className="w-1/3 bg-slate-200" />
          <div className="w-1/3 bg-[#DC2626]" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0C356A] text-white flex items-center justify-center shadow-md shrink-0 border border-blue-900">
              <CreditCard className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0C356A] px-2.5 py-0.5 rounded-full border border-blue-200">
                  GUICHET UNIQUE &bull; CAISSE &amp; TRÉSORERIE CENTRALE
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Site Officiel LOMÉ
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0C356A] font-serif tracking-tight mt-1">
                Gestion des Recettes, Scolarités &amp; Clients
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Centralisation de tous les règlements au fur et à mesure • Déduction automatique en base • Émission de reçus horodatés certifiés
              </p>
            </div>
          </div>

          {/* Boutons d'Action Rapide Caisse */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (students.length > 0) openStudentCashIn(students[0]);
              }}
              className="px-4 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-blue-200" />
              <span>Encaisser Écolage Élève</span>
            </button>
            <button
              onClick={() => {
                if (customers.length > 0) openCustomerCashIn(customers[0]);
              }}
              className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Building2 className="w-4 h-4 text-amber-300" />
              <span>Encaisser Client Hôtel</span>
            </button>
          </div>
        </div>

        {/* 4 Cartes Synthèse Financière Directe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between text-xs text-blue-900 font-bold mb-1">
              <span>Écolages Encaissés</span>
              <span className="text-[10px] px-2 py-0.5 bg-blue-200 text-blue-900 rounded-md font-black">
                {schoolRecoveryRate}%
              </span>
            </div>
            <p className="text-xl font-black text-[#0C356A]">{formatFCFA(totalSchoolCollected)}</p>
            <div className="w-full bg-blue-200/70 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[#0C356A] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, schoolRecoveryRate)}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-100">
            <div className="flex items-center justify-between text-xs text-rose-900 font-bold mb-1">
              <span>Reste à Recouvrer (Élèves)</span>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <p className="text-xl font-black text-[#DC2626]">{formatFCFA(totalSchoolRemaining)}</p>
            <p className="text-[11px] text-rose-700 font-medium mt-1">
              {inProgressStudentsCount} partiels &bull; {unpaidStudentsCount} non démarrés
            </p>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-between text-xs text-emerald-900 font-bold mb-1">
              <span>Élèves 100% Soldés</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xl font-black text-emerald-700">
              {settledStudentsCount} <span className="text-xs text-slate-500 font-normal">/ {students.length} inscrits</span>
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Quittus délivré &bull; Aucun arriéré
            </p>
          </div>

          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-100">
            <div className="flex items-center justify-between text-xs text-amber-900 font-bold mb-1">
              <span>Recettes Prestations Hôtel</span>
              <Building className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-xl font-black text-amber-800">{formatFCFA(totalHotelCollected)}</p>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              {customers.length} clients enregistrés
            </p>
          </div>
        </div>
      </div>

      {/* 2. Barre d'Onglets Caisse : Élèves / Clients / Reçus */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-1.5">
        <button
          onClick={() => {
            setActiveTab("students");
            setStatusFilter("ALL");
          }}
          className={`flex-1 w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === "students"
              ? "bg-[#0C356A] text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Base Scolarités — Tous les Élèves ({students.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("customers");
            setStatusFilter("ALL");
          }}
          className={`flex-1 w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === "customers"
              ? "bg-[#DC2626] text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Base Clients &amp; Prestations Hôtel ({customers.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("receipts");
            setStatusFilter("ALL");
          }}
          className={`flex-1 w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === "receipts"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Receipt className="w-4 h-4 text-amber-400" />
          <span>Journal Général des Reçus Certifiés ({receipts.length})</span>
        </button>
      </div>

      {/* 3. Zone de Recherche et Filtres */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === "students"
                ? "Rechercher élève, matricule, classe..."
                : activeTab === "customers"
                ? "Rechercher client, code, entreprise..."
                : "Rechercher référence, élève, caissier..."
            }
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0C356A]/20 font-medium"
          />
        </div>

        {activeTab === "students" && (
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Statut :</span>
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "ALL"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tous ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter("SETTLED")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                statusFilter === "SETTLED"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <Check className="w-3 h-3" />
              <span>Soldés ({settledStudentsCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                statusFilter === "PENDING"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Reste à payer ({inProgressStudentsCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter("UNPAID")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                statusFilter === "UNPAID"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Non démarré ({unpaidStudentsCount})</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. CONTENU DE L'ONGLET 1 : BASE SCOLARITÉS & TOUS LES ÉLÈVES */}
      {activeTab === "students" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-blue-50/40 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-[#0C356A] uppercase tracking-wide">
                Répertoire Financier des Élèves &bull; Caisse Scolaire Avenida
              </h2>
              <p className="text-[11px] text-slate-500">
                La Caisse gère en direct chaque dossier d'écolage. Les encaissements déduisent automatiquement le reste dû pour l'espace scolaire.
              </p>
            </div>
            <span className="text-xs font-bold bg-white px-3 py-1 rounded-xl border border-slate-200 text-slate-700 shrink-0">
              {filteredStudents.length} élève(s) affiché(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Élève &amp; Matricule</th>
                  <th className="py-3 px-4">Classe &amp; Filière</th>
                  <th className="py-3 px-4 text-right">Écolage Total</th>
                  <th className="py-3 px-4 text-right">Déjà Versé</th>
                  <th className="py-3 px-4 text-right">Reste Dû</th>
                  <th className="py-3 px-4 text-center">Progression &amp; Statut</th>
                  <th className="py-3 px-4 text-center">Action Caisse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const total = Number(s.total_fee) || 370000;
                  const paid = Number(s.paid_fee) || 0;
                  const rem = Number(s.remaining_fee) || 0;
                  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                  const isSettled = rem === 0;

                  return (
                    <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {s.last_name} {s.first_name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] font-bold text-[#0C356A] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {s.registration_number}
                          </span>
                          {s.phone && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              &bull; {s.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{s.class_name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {s.academic_year || "2025-2026"} &bull; {s.boarder_status || "externe"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700">
                        {formatFCFA(total)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">
                        {formatFCFA(paid)}
                      </td>
                      <td className="py-3 px-4 text-right font-black">
                        {isSettled ? (
                          <span className="text-emerald-700">0 F CFA</span>
                        ) : (
                          <span className="text-[#DC2626]">{formatFCFA(rem)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isSettled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                              <Check className="w-3 h-3" />
                              <span>SOLDÉ</span>
                            </span>
                          ) : paid > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                              <Clock className="w-3 h-3" />
                              <span>RESTE : {formatFCFA(rem)}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                              <span>NON DÉMARRÉ</span>
                            </span>
                          )}

                          <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isSettled ? "bg-emerald-600" : "bg-[#0C356A]"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">{pct}% versé</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openStudentCashIn(s)}
                            className="px-3 py-1.5 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                            <span>Encaisser</span>
                          </button>
                          <button
                            onClick={() => {
                              const studReceipts = receipts.filter(
                                (r) =>
                                  r.student_matricule === s.registration_number ||
                                  r.student_name.toLowerCase() ===
                                    `${s.last_name} ${s.first_name}`.toLowerCase()
                              );
                              if (studReceipts.length > 0) {
                                setSelectedReceipt(studReceipts[0]);
                              } else {
                                alert(`Aucun reçu émis pour le moment pour ${s.first_name} ${s.last_name}.`);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#0C356A] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            title="Voir les reçus de cet élève"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. CONTENU DE L'ONGLET 2 : BASE CLIENTS & PRESTATIONS HÔTEL */}
      {activeTab === "customers" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-red-50/40 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-[#DC2626] uppercase tracking-wide">
                Fichier Clients &bull; Caisse Prestations Hôtel Avenida
              </h2>
              <p className="text-[11px] text-slate-500">
                Suivi des séjours, chambres, événements et encaissements avec intégration comptable instantanée.
              </p>
            </div>
            <span className="text-xs font-bold bg-white px-3 py-1 rounded-xl border border-slate-200 text-slate-700 shrink-0">
              {filteredCustomers.length} client(s) répertorié(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Code &amp; Client</th>
                  <th className="py-3 px-4">Société / Contact</th>
                  <th className="py-3 px-4">Nationalité</th>
                  <th className="py-3 px-4 text-center">Séjours</th>
                  <th className="py-3 px-4 text-right">Dépenses Totales</th>
                  <th className="py-3 px-4 text-center">Statut Client</th>
                  <th className="py-3 px-4 text-center">Action Caisse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-red-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{c.full_name}</span>
                        {c.is_vip && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-black rounded-md border border-amber-300">
                            VIP
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-[#DC2626] font-bold mt-0.5">
                        {c.code}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-700">{c.company || "Particulier"}</div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {c.phone} {c.email ? `• ${c.email}` : ""}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{c.nationality}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md font-bold text-slate-700">
                        {c.total_stays || 1} séjour(s)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-amber-800">
                      {formatFCFA(c.total_spent || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                        <span>Compte Actif</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openCustomerCashIn(c)}
                        className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                        <span>Encaisser Prestation</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. CONTENU DE L'ONGLET 3 : JOURNAL GÉNÉRAL DES REÇUS */}
      {activeTab === "receipts" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Grand Livre de Caisse &bull; Reçus Numérotés avec Date &amp; Heure
              </h2>
              <p className="text-[11px] text-slate-500">
                Tout paiement émis par la trésorerie est certifié avec son horodatage à la seconde et son statut de solde.
              </p>
            </div>
            <span className="text-xs font-bold bg-white px-3 py-1 rounded-xl border border-slate-200 text-slate-700 shrink-0">
              {filteredReceipts.length} reçu(s) émis
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Référence</th>
                  <th className="py-3 px-4">Date &amp; Heure Exacte</th>
                  <th className="py-3 px-4">Bénéficiaire &amp; Réf</th>
                  <th className="py-3 px-4">Désignation</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Montant Encaissé</th>
                  <th className="py-3 px-4 text-center">Statut Solde Reçu</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.map((r) => {
                  const isSettled = Number(r.remaining_due) === 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {r.reference}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{r.date}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{r.student_name}</div>
                        <div className="text-[10px] text-[#0C356A] font-mono font-bold">
                          {r.student_matricule} &bull; {r.class_name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{r.designation}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {r.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                        {formatFCFA(r.amount_paid)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isSettled ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-black uppercase tracking-wider">
                            SOLDÉ (0 F)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-md text-[10px] font-black uppercase tracking-wider">
                            Reste: {formatFCFA(r.remaining_due)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedReceipt(r)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#0C356A] text-white hover:bg-[#164E87] rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-blue-200" />
                          <span>Voir Reçu</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* 7. MODAL OFFICIEL DU REÇU AVENIDA (DATE & HEURE + ÉCHELONNEMENT + SOLDE DÉFINITIF) */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <OfficialPaymentReceiptModal
        receipt={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        allEntityReceipts={receipts}
      />

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* 8. MODAL ENCAISSEMENT ÉLÈVE AVEC DÉDUCTION INSTANTANÉE                         */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {isStudentPaymentModalOpen && targetStudent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-black text-[#0C356A] font-serif">
                  Encaisser Frais de Scolarité &bull; Caisse Lomé
                </h2>
                <p className="text-xs text-slate-500">
                  Déduction automatique immédiate dans la base de l'élève &amp; comptabilité
                </p>
              </div>
              <button
                onClick={() => setIsStudentPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Récapitulatif Situation Actuelle de l'élève */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">
                  {targetStudent.last_name} {targetStudent.first_name}
                </span>
                <span className="font-mono text-[#0C356A] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                  {targetStudent.registration_number}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Scolarité : <strong>{formatFCFA(targetStudent.total_fee)}</strong></span>
                <span>Déjà versé : <strong className="text-emerald-700">{formatFCFA(targetStudent.paid_fee)}</strong></span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                <span className="text-slate-700">Reste actuel avant ce paiement :</span>
                <span className="text-[#DC2626]">{formatFCFA(targetStudent.remaining_fee)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmStudentPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Changer d'Élève (sélection parmi tous les inscrits)
                </label>
                <select
                  value={targetStudent.id}
                  onChange={(e) => {
                    const st = students.find((s) => s.id === e.target.value);
                    if (st) setTargetStudent(st);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.last_name} {s.first_name} ({s.registration_number}) — Reste : {formatFCFA(s.remaining_fee)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Désignation du Versement</label>
                <input
                  type="text"
                  value={paymentDesignation}
                  onChange={(e) => setPaymentDesignation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Montant à Encaisser (F CFA)</label>
                  <input
                    type="number"
                    step="5000"
                    min="1000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mode de Paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Espèces">Espèces (Guichet Caisse)</option>
                    <option value="Mobile Money">Mobile Money (Flooz / T-Money)</option>
                    <option value="Virement">Virement Bancaire</option>
                    <option value="Stripe">Carte Bancaire / Stripe</option>
                  </select>
                </div>
              </div>

              {/* Simulation en Direct du Résultat de l'Opération */}
              {(() => {
                const simulatedRem = Math.max(0, Number(targetStudent.remaining_fee) - Number(paymentAmount));
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
                  <label className="block font-bold text-slate-700 mb-1">Nom du Déposant</label>
                  <input
                    type="text"
                    value={depositorName}
                    onChange={(e) => setDepositorName(e.target.value)}
                    placeholder="Nom complet"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone Déposant</label>
                  <input
                    type="text"
                    value={depositorPhone}
                    onChange={(e) => setDepositorPhone(e.target.value)}
                    placeholder="+228..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Qualité / Lien</label>
                  <select
                    value={depositorRole}
                    onChange={(e) => setDepositorRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option>Parent / Tuteur</option>
                    <option>Père</option>
                    <option>Mère</option>
                    <option>Élève lui-même</option>
                    <option>Parrain / Entreprise</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Caissier Référent</label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentPaymentModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white rounded-xl font-black shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Traitement en cours...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Valider &amp; Émettre Reçu Officiel</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* 9. MODAL ENCAISSEMENT CLIENT HÔTEL AVEC DÉDUCTION INSTANTANÉE                 */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {isCustomerPaymentModalOpen && targetCustomer && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-black text-[#DC2626] font-serif">
                  Encaisser Client Hôtel &bull; Prestations Avenida
                </h2>
                <p className="text-xs text-slate-500">
                  Enregistrement recette comptable &amp; émission du reçu horodaté
                </p>
              </div>
              <button
                onClick={() => setIsCustomerPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{targetCustomer.full_name}</span>
                <span className="font-mono text-[#DC2626]">{targetCustomer.code}</span>
              </div>
              <p className="text-slate-500">{targetCustomer.company || "Particulier"} &bull; {targetCustomer.phone}</p>
              <p className="text-slate-600 border-t border-slate-200 pt-1">
                Dépenses cumulées antérieures : <strong>{formatFCFA(targetCustomer.total_spent || 0)}</strong>
              </p>
            </div>

            <form onSubmit={handleConfirmCustomerPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Désignation de la Prestation</label>
                <input
                  type="text"
                  value={custDesignation}
                  onChange={(e) => setCustDesignation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Montant Encaissé (F CFA)</label>
                  <input
                    type="number"
                    step="1000"
                    min="500"
                    value={custAmount}
                    onChange={(e) => setCustAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mode de Paiement</label>
                  <select
                    value={custMethod}
                    onChange={(e) => setCustMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Mobile Money">Mobile Money (T-Money / Flooz)</option>
                    <option value="Virement">Virement Bancaire</option>
                    <option value="Stripe">Carte Bancaire / Stripe</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom Déposant</label>
                  <input
                    type="text"
                    value={custDepositorName}
                    onChange={(e) => setCustDepositorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tél Déposant</label>
                  <input
                    type="text"
                    value={custDepositorPhone}
                    onChange={(e) => setCustDepositorPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerPaymentModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white rounded-xl font-black shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Enregistrement...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-amber-300" />
                      <span>Encaisser &amp; Émettre Reçu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
