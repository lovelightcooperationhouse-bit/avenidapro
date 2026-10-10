"use client";

import React, { useRef, useMemo } from "react";
import Image from "next/image";
import {
  Printer,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  CreditCard,
  User,
  Phone,
  FileCheck,
  Award,
} from "lucide-react";
import { PaymentReceipt } from "@/types";
import { formatFCFA } from "@/lib/utils";

interface OfficialPaymentReceiptModalProps {
  receipt: PaymentReceipt | null;
  isOpen: boolean;
  onClose: () => void;
  allEntityReceipts?: PaymentReceipt[];
}

export function OfficialPaymentReceiptModal({
  receipt,
  isOpen,
  onClose,
  allEntityReceipts = [],
}: OfficialPaymentReceiptModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  // Historique ordonné chronologiquement de tous les règlements
  const paymentHistory = useMemo(() => {
    if (!receipt) return [];
    const entityMatricule = (receipt.student_matricule || "").trim().toLowerCase();
    const entityName = (receipt.student_name || "").trim().toLowerCase();

    const related = allEntityReceipts.filter((r) => {
      const rMat = (r.student_matricule || "").trim().toLowerCase();
      const rName = (r.student_name || "").trim().toLowerCase();
      return (
        (entityMatricule && rMat === entityMatricule) ||
        (entityName && rName === entityName)
      );
    });

    // S'assurer que le reçu actuel figure dans la liste s'il n'y est pas encore
    const exists = related.some((r) => r.reference === receipt.reference);
    const fullList = exists ? related : [receipt, ...related];

    // Tri du plus ancien au plus récent
    return [...fullList].sort((a, b) => {
      return a.reference.localeCompare(b.reference);
    });
  }, [receipt, allEntityReceipts]);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const isFinalSettlement = Number(receipt.remaining_due) === 0;
  const totalCumulativePaid = paymentHistory.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0) || Number(receipt.amount_paid);
  const totalDueAmount = Number(receipt.total_due) > 0 ? Number(receipt.total_due) : (totalCumulativePaid + Number(receipt.remaining_due));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full">
        {/* Top Control Bar (Masquée à l'impression) */}
        <div className="bg-[#0C356A] text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-200" />
            <span className="text-xs font-black uppercase tracking-wider">
              {isFinalSettlement ? "🏆 REÇU DÉFINITIF & QUITTANCE LIBÉRATOIRE" : "REÇU OFFICIEL DE VERSEMENT"} &bull; Réf : {receipt.reference}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-white text-[#0C356A] hover:bg-blue-50 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#0C356A]" />
              <span>Imprimer / Télécharger (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Papier Imprimable Officiel A4/A5 */}
        <div
          ref={printableRef}
          className="p-6 md:p-8 bg-white text-slate-900 text-xs font-sans print:p-6 print:m-0 space-y-4"
          id="avenida-official-tuition-receipt"
        >
          {/* 1. En-tête Institutionnel & République */}
          <div className="border-b-2 border-[#0C356A] pb-3 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 relative rounded-xl overflow-hidden border border-slate-200 shadow-2xs shrink-0 bg-white">
                <Image
                  src="/logoavenida.jpg"
                  alt="Hôtel École Avenida Lomé"
                  width={56}
                  height={56}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-widest text-[#0C356A] uppercase font-serif">
                    HÔTEL ÉCOLE AVENIDA
                  </span>
                  <span className="text-[10px] bg-red-100 text-[#DC2626] font-extrabold px-1.5 py-0.2 rounded border border-red-200">
                    LOMÉ - TOGO
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 font-medium">
                  Centre de Formation Professionnelle & Hôtelière &bull; Agréé par l&apos;État
                </p>
                <p className="text-[9px] text-slate-400 font-mono">
                  B.P. 1207 Lomé &bull; Tél: (+228) 90 00 00 00 / 22 21 00 00 &bull; contact@ecole-avenida.tg
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">
                RÉPUBLIQUE TOGOLAISE
              </span>
              <span className="text-[8px] italic text-slate-500 block mb-1">
                Travail &bull; Liberté &bull; Patrie
              </span>
              <div className="inline-block bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                <span className="text-[9px] font-bold text-slate-500 block">REÇU DE CAISSE N°</span>
                <span className="font-mono font-black text-sm text-[#0C356A]">{receipt.reference}</span>
              </div>
            </div>
          </div>

          {/* Titre du document & Horodatage Exact */}
          <div className="text-center py-1">
            <h1 className="text-base sm:text-lg font-black uppercase text-[#0C356A] tracking-wider font-serif">
              {isFinalSettlement
                ? "REÇU DÉFINITIF DE SCOLARITÉ & QUITTANCE LIBÉRATOIRE"
                : "REÇU OFFICIEL DE VERSEMENT D'ÉCOLAGE"}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Opération enregistrée le : <strong className="text-slate-800 font-mono">{receipt.date}</strong> &bull; Service : <strong>Caisse Écolage &amp; Trésorerie Centrale</strong>
            </p>
            {receipt.proof_file_name && (
              <p className="text-[10px] text-emerald-800 font-bold mt-1 bg-emerald-50 inline-block px-2.5 py-0.5 rounded-full border border-emerald-200">
                📎 Justificatif de versement archivé au dossier : {receipt.proof_file_name} ({receipt.proof_file_size || "Vérifié"})
              </p>
            )}
          </div>

          {/* 2. Coordonnées de l'Apprenant / Client & Déposant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-[#0C356A] block mb-1">
                Bénéficiaire / Apprenant
              </span>
              <div className="space-y-0.5 text-xs">
                <p className="font-black text-slate-900 text-sm">{receipt.student_name}</p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <span>Matricule :</span>
                  <span className="font-mono font-bold text-[#0C356A]">{receipt.student_matricule}</span>
                </p>
                <p className="text-slate-600">
                  <span>Classe / Filière :</span> <strong className="text-slate-800">{receipt.class_name}</strong>
                </p>
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                Informations du Déposant / Payeur
              </span>
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-slate-800">{receipt.depositor_name || "L'élève lui-même"}</p>
                <p className="text-slate-600">
                  <span>Lien / Qualité :</span> <strong>{receipt.depositor_role || "Tuteur / Parent"}</strong>
                </p>
                {receipt.depositor_phone && (
                  <p className="text-slate-600">
                    <span>Contact :</span> <span className="font-mono">{receipt.depositor_phone}</span>
                  </p>
                )}
                <p className="text-slate-600">
                  <span>Mode de règlement :</span>{" "}
                  <strong className="text-emerald-700">{receipt.payment_method}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* 3. Encadré "PAYÉ MAINTENANT" (Ce versement) */}
          <div className="p-3.5 bg-blue-50/70 border-2 border-[#0C356A]/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-blue-900 uppercase block tracking-wider">
                Versement Encaissé à l&apos;Instant &bull; Payé Maintenant
              </span>
              <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                {receipt.designation || "Frais de scolarité & formation"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-blue-900 font-bold block">Montant Versé Aujourd&apos;hui :</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight">
                {formatFCFA(receipt.amount_paid)}
              </span>
            </div>
          </div>

          {/* 4. Tableau d'Échelonnement des Paiements Passés avec Date & Heure */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-[#0C356A] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Échelonnement des Paiements Effectués (Historique Horodaté)</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-500 font-mono">
                {paymentHistory.length} versement(s) comptabilisé(s)
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#0C356A] text-white font-bold">
                  <tr>
                    <th className="py-1.5 px-2.5">Tranche / N°</th>
                    <th className="py-1.5 px-2.5">Date &amp; Heure de l&apos;Opération</th>
                    <th className="py-1.5 px-2.5">Réf Reçu</th>
                    <th className="py-1.5 px-2.5">Mode</th>
                    <th className="py-1.5 px-2.5 text-right">Montant Versé</th>
                    <th className="py-1.5 px-2.5 text-center">Statut Caisse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paymentHistory.map((p, idx) => {
                    const isCurrent = p.reference === receipt.reference;
                    return (
                      <tr
                        key={p.id || idx}
                        className={isCurrent ? "bg-emerald-50/60 font-semibold" : "hover:bg-slate-50"}
                      >
                        <td className="py-2 px-2.5 font-bold text-slate-800">
                          Tranche {idx + 1} {isCurrent && <span className="text-[9px] text-emerald-700 ml-1 font-mono">(Ce jour)</span>}
                        </td>
                        <td className="py-2 px-2.5 font-mono text-slate-700">
                          {p.date}
                        </td>
                        <td className="py-2 px-2.5 font-mono font-bold text-slate-800">
                          {p.reference}
                        </td>
                        <td className="py-2 px-2.5 text-slate-600">
                          {p.payment_method || "Espèces"}
                        </td>
                        <td className="py-2 px-2.5 text-right font-black text-emerald-700 font-mono">
                          {formatFCFA(p.amount_paid)}
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            Encaissé ✓
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Synthèse Financière du Solde Réel & Reste à Régler */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Dû Annuel</span>
              <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
                {formatFCFA(totalDueAmount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-800 font-bold block uppercase">Total Déjà Versé</span>
              <span className="text-sm sm:text-base font-black text-emerald-800 font-mono">
                {formatFCFA(totalCumulativePaid)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-rose-800 font-bold block uppercase">Montant Restant (Solde Dû)</span>
              <span className={`text-sm sm:text-base font-black font-mono ${isFinalSettlement ? "text-emerald-700" : "text-[#DC2626]"}`}>
                {formatFCFA(receipt.remaining_due)}
              </span>
            </div>
          </div>

          {/* 6. Tampon Officiel de Statut : Définitivement Soldé vs En Cours */}
          <div>
            {isFinalSettlement ? (
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex items-center justify-between gap-4 text-emerald-950 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-wider text-emerald-900 font-serif">
                      SCOLARITÉ 100% INTÉGRALEMENT SOLDÉE &bull; QUITTANCE DÉFINITIVE
                    </p>
                    <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                      L&apos;Agence Comptable et la Direction certifient que l&apos;élève est en règle intégrale pour l&apos;année scolaire. Aucun reliquat n&apos;est dû.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block text-center border-2 border-dashed border-emerald-600 px-3 py-1 rounded-xl shrink-0">
                  <span className="text-[10px] font-black uppercase text-emerald-700 block">VISA DIRECTION</span>
                  <span className="text-xs font-black text-emerald-900">SOLDÉ À 100%</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-center justify-between gap-4 text-amber-950 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Clock className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-wider text-amber-900 font-serif">
                      VERSEMENT PARTIEL &bull; SCOLARITÉ EN COURS D&apos;APUREMENT
                    </p>
                    <p className="text-[11px] text-amber-900 font-medium">
                      Versement partiel comptabilisé. Reste à régler : <strong className="text-[#DC2626] font-bold font-mono">{formatFCFA(receipt.remaining_due)}</strong>
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block text-center border border-amber-300 px-3 py-1 rounded-xl bg-white shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 block">ÉCHÉANCE SUIVANTE</span>
                  <span className="text-xs font-black text-amber-900">À VENIR</span>
                </div>
              </div>
            )}
          </div>

          {/* 7. Signatures et Mentions Légales Certifiées */}
          <div className="pt-3 border-t-2 border-slate-200 grid grid-cols-2 gap-6 text-[11px]">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[9px] mb-1">Émargement du Déposant</p>
              <div className="h-14 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 italic text-[10px] bg-slate-50">
                Signature du Déposant : {receipt.depositor_name || receipt.student_name}
              </div>
            </div>

            <div className="text-right">
              <p className="text-slate-400 font-bold uppercase text-[9px] mb-1">
                L&apos;Agent Comptable / Caisse Centrale
              </p>
              <div className="h-14 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-blue-50/40 text-[10px] text-[#0C356A] font-bold">
                <span>{receipt.cashier_name || "Caisse Centrale Avenida"}</span>
                <span className="text-[8px] text-emerald-700 font-mono font-normal">
                  Cachet &amp; Certification Numérique Apposés
                </span>
              </div>
            </div>
          </div>

          {/* Mentions de bas de page */}
          <div className="text-center pt-2 text-[9px] text-slate-400 border-t border-slate-100">
            Ce reçu certifié constitue une pièce comptable officielle opposable aux tiers. Toute rature ou surcharge l&apos;annule.
            <br />
            Hôtel École Avenida &bull; Direction des Affaires Financières et du Contrôle de Gestion &bull; Lomé, Togo
          </div>
        </div>
      </div>
    </div>
  );
}
