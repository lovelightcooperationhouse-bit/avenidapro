"use client";

import { useState } from "react";
import {
  CreditCard,
  Printer,
  PlusCircle,
  Search,
  CheckCircle2,
  Building,
  FileCheck,
  X,
} from "lucide-react";
import { MOCK_RECEIPTS, MOCK_STUDENTS } from "@/lib/mock-data";
import { PaymentReceipt } from "@/types";
import { formatFCFA } from "@/lib/utils";
import { AvenidaLogo } from "@/components/shared/AvenidaLogo";

export default function PaymentsPage() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(MOCK_RECEIPTS);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  // New Payment Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(MOCK_STUDENTS[0].id);
  const [amount, setAmount] = useState(50000);
  const [designation, setDesignation] = useState("Frais de scolarité (Tranche suivante)");
  const [paymentMethod, setPaymentMethod] = useState<any>("Espèces");

  const handleCashIn = (e: React.FormEvent) => {
    e.preventDefault();
    const st = MOCK_STUDENTS.find((s) => s.id === selectedStudentId)!;
    const newRef = `#AV2025-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReceipt: PaymentReceipt = {
      id: `rec-${Date.now()}`,
      reference: newRef,
      student_name: `${st.last_name} ${st.first_name}`,
      student_matricule: st.registration_number,
      class_name: st.class_name.split(" ")[0],
      designation: designation,
      amount_paid: Number(amount),
      total_due: st.total_fee,
      remaining_due: Math.max(0, st.remaining_fee - Number(amount)),
      depositor_name: st.emergency_contact_name,
      depositor_id_card: "TG-LOM-2024-9912",
      depositor_phone: st.emergency_contact_phone,
      depositor_role: "Parent",
      payment_method: paymentMethod,
      site: "LOMÉ",
      date: new Date().toISOString().replace("T", " ").substring(0, 19),
      cashier_name: "BANGASSOU AGNETA",
    };

    setReceipts([newReceipt, ...receipts]);
    setIsNewModalOpen(false);
    setSelectedReceipt(newReceipt);
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Caisse Identity */}
      <div className="bg-white p-6 rounded-3xl border-2 border-blue-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0C356A] text-white flex items-center justify-center shadow-sm">
            <CreditCard className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0C356A] px-2 py-0.5 rounded-full">
                CAISSE SCOLAIRE &bull; LOMÉ
              </span>
              <span className="text-xs text-slate-400">&bull; Francs CFA (XOF)</span>
            </div>
            <h1 className="text-2xl font-black text-[#0C356A] font-serif">
              Journal de Caisse & Reçus Officiels
            </h1>
            <p className="text-xs text-slate-500">
              Émission des reçus certifiés Avenida (#AV2022-xxxx), suivi des tranches et balance scolarité
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouvel Encaissement</span>
        </button>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/40">
          <span className="text-xs font-black uppercase text-[#0C356A]">
            Journal des Transactions Récentes &bull; Site LOMÉ
          </span>
          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300">
            Total Encaissé : {formatFCFA(receipts.reduce((s, r) => s + r.amount_paid, 0))}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Élève & Matricule</th>
                <th className="py-3 px-4">Classe</th>
                <th className="py-3 px-4">Désignation</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Reçu Officiel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {r.reference}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{r.date}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{r.student_name}</div>
                    <div className="text-[10px] text-[#0C356A] font-mono font-bold">{r.student_matricule}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{r.class_name}</td>
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
                    <button
                      onClick={() => setSelectedReceipt(r)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#0C356A] text-white hover:bg-[#164E87] rounded-lg text-[11px] font-bold transition-colors"
                    >
                      <Printer className="w-3 h-3 text-blue-200" />
                      <span>Voir Reçu</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Receipt Modal (Conforme à RECU_ECOLE_HOTEL_AVENIDA.pdf) */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border-2 border-slate-300 relative animate-scale-up space-y-6">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Header with Avenida Logo & Tricolore */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <AvenidaLogo size="sm" showText={true} />
              </div>
              <div className="text-right">
                <span className="inline-block border-2 border-[#DC2626] text-[#DC2626] px-3 py-1 text-xs font-black tracking-widest uppercase">
                  DUPLICATA
                </span>
                <p className="text-[11px] text-slate-600 mt-1">Site : <strong>{selectedReceipt.site}</strong></p>
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black tracking-wider uppercase underline font-serif text-[#0C356A]">
                REÇU DE PAIEMENT
              </h2>
              <p className="text-xs text-slate-500">
                Règlement des frais de scolarité &bull; Réf : <strong>{selectedReceipt.reference}</strong>
              </p>
            </div>

            {/* Student & Payment Info Box */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p><strong>Nom :</strong> {selectedReceipt.student_name}</p>
                <p><strong>Matricule :</strong> {selectedReceipt.student_matricule}</p>
                <p><strong>Classe :</strong> {selectedReceipt.class_name}</p>
              </div>
              <div className="text-right">
                <p><strong>Date opération :</strong> {selectedReceipt.date}</p>
                <p><strong>Mode règlement :</strong> {selectedReceipt.payment_method}</p>
                <p><strong>Année Scolaire :</strong> 2024 - 2025</p>
              </div>
            </div>

            {/* Financial Line Table */}
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-blue-50/60 font-bold text-[#0C356A]">
                <tr>
                  <th className="p-2 border">Réf</th>
                  <th className="p-2 border">Désignation</th>
                  <th className="p-2 border text-right">Montant à payer</th>
                  <th className="p-2 border text-right">Montant payé</th>
                  <th className="p-2 border text-right">Reste à payer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border font-mono">{selectedReceipt.reference}</td>
                  <td className="p-2 border font-semibold">{selectedReceipt.designation}</td>
                  <td className="p-2 border text-right">{formatFCFA(selectedReceipt.total_due)}</td>
                  <td className="p-2 border text-right font-black text-emerald-700">
                    {formatFCFA(selectedReceipt.amount_paid)}
                  </td>
                  <td className="p-2 border text-right font-black text-[#DC2626]">
                    {formatFCFA(selectedReceipt.remaining_due)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Depositor details & Total balance summary */}
            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
              <div className="space-y-1">
                <span className="font-bold uppercase text-[10px] text-slate-500 block">Informations Déposant</span>
                <p><strong>Nom complet :</strong> {selectedReceipt.depositor_name}</p>
                <p><strong>Qualité / Pièce :</strong> {selectedReceipt.depositor_role} ({selectedReceipt.depositor_id_card})</p>
                <p><strong>Tél :</strong> {selectedReceipt.depositor_phone}</p>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl space-y-1 text-right border border-blue-100">
                <p className="text-slate-600">Total scolarité : <strong>{formatFCFA(selectedReceipt.total_due)}</strong></p>
                <p className="text-slate-600">Total payé à ce jour : <strong>{formatFCFA(selectedReceipt.total_due - selectedReceipt.remaining_due)}</strong></p>
                <p className="font-bold text-[#DC2626] border-t border-blue-200 pt-1">
                  Reste à payer : {formatFCFA(selectedReceipt.remaining_due)}
                </p>
              </div>
            </div>

            {/* Signature & Print */}
            <div className="flex items-end justify-between pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                Caissier : <strong>{selectedReceipt.cashier_name}</strong>
              </div>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-[#0C356A] text-white font-bold text-xs rounded-xl hover:bg-[#164E87] flex items-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4 text-blue-200" />
                <span>Imprimer Reçu Officiel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash In Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-black text-[#0C356A] font-serif">
                Encaisser Frais de Scolarité
              </h2>
              <button onClick={() => setIsNewModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCashIn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Élève Bénéficiaire</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {MOCK_STUDENTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.last_name} {s.first_name} ({s.registration_number}) - Reste: {formatFCFA(s.remaining_fee)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Désignation du Versement</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Montant (F CFA)</label>
                  <input
                    type="number"
                    step="5000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mode de Paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Espèces">Espèces (Caisse)</option>
                    <option value="Mobile Money">Mobile Money (Flooz/T-Money)</option>
                    <option value="Virement">Virement Bancaire</option>
                    <option value="Stripe">Carte Bancaire / Stripe</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#DC2626] text-white rounded-xl font-black hover:bg-[#b91c1c] shadow-xs"
                >
                  Valider & Générer Reçu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
