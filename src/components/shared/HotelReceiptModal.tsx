"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  Printer,
  X,
  CheckCircle2,
  Clock,
  BedDouble,
  CreditCard,
  User,
  Phone,
  CalendarDays,
  ShieldCheck,
  Building,
} from "lucide-react";
import { HotelReservation } from "@/types";
import { formatFCFA } from "@/lib/utils";

interface HotelReceiptModalProps {
  reservation: HotelReservation;
  isOpen: boolean;
  onClose: () => void;
}

export function HotelReceiptModal({
  reservation,
  isOpen,
  onClose,
}: HotelReceiptModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !reservation) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid =
    reservation.payment_status === "réglé" ||
    reservation.status === "payée" ||
    reservation.deposit_paid >= reservation.total_price;

  const isPartial =
    !isPaid &&
    (reservation.payment_status === "acompte" || reservation.deposit_paid > 0);

  const remainingBalance = Math.max(
    0,
    reservation.total_price - reservation.deposit_paid
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full">
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-[#DC2626] text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-red-200" />
            <span className="text-xs font-black uppercase tracking-wider">
              Reçu Officiel d&apos;Hôtel &bull; Réf : {reservation.booking_ref}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-white text-[#DC2626] hover:bg-red-50 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 text-[#DC2626]" />
              <span>Télécharger / Imprimer le Reçu (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div
          ref={printableRef}
          className="p-6 md:p-8 bg-white text-slate-900 text-xs font-sans print:p-6 print:m-0 space-y-5"
          id="avenida-official-hotel-receipt"
        >
          {/* 1. Header with Hotel Avenida Branding */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 relative rounded-xl overflow-hidden border border-slate-200 shadow-2xs shrink-0">
                <Image
                  src="/logoavenida.jpg"
                  alt="Hôtel Avenida Lomé"
                  width={56}
                  height={56}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif font-black text-base text-[#DC2626] tracking-wide uppercase leading-tight">
                    HÔTEL AVENIDA
                  </h1>
                  <span className="text-[10px] bg-red-100 text-[#DC2626] font-black px-1.5 py-0.2 rounded border border-red-200">
                    LOMÉ &bull; TOGO
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 font-medium">
                  Complexe Hôtelier & Restaurant Gastronomique
                </p>
                <p className="text-[8px] text-slate-400 mt-0.5">
                  Quartier Dékon / Tokoin &bull; Tél: +228 22 21 00 00 / 90 55 44 33
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block border-2 border-slate-900 text-slate-900 px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest">
                REÇU OFFICIEL
              </span>
              <p className="text-[10px] font-mono font-black text-[#DC2626] mt-1">
                {reservation.booking_ref}
              </p>
              <p className="text-[9px] text-slate-500">
                Date : {new Date().toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          {/* 2. Titre & Badge Statut */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 font-serif">
                JUSTIFICATIF D&apos;HÉBERGEMENT & FACTURE ACQUITTÉE
              </h2>
              <p className="text-[10px] text-slate-500">
                Délivré par le Service Réception & Hébergement de l&apos;Hôtel Avenida
              </p>
            </div>

            {/* Official Status Badge */}
            <div>
              {isPaid ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-full font-black text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>SÉJOUR PAYÉ & RÉGLÉ</span>
                </div>
              ) : isPartial ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-full font-black text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>RÉSERVATION (ACOMPTE REÇU)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 border border-blue-300 text-blue-900 rounded-full font-black text-xs">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-700" />
                  <span>RÉSERVATION EN ATTENTE</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Informations Client & Séjour */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            {/* Colonne Client */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Informations du Client
              </span>
              <p className="font-black text-slate-900 text-sm">{reservation.customer_name}</p>
              <p className="text-slate-600 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {reservation.customer_phone}
              </p>
              {reservation.customer_email && (
                <p className="text-slate-500 text-[11px]">{reservation.customer_email}</p>
              )}
              {reservation.customer_id_card && (
                <p className="text-slate-500 text-[10px]">
                  Pièce d&apos;identité : <strong>{reservation.customer_id_card}</strong>
                </p>
              )}
            </div>

            {/* Colonne Chambre & Dates */}
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Détail de l&apos;Hébergement
              </span>
              <div className="inline-block bg-[#DC2626] text-white font-mono font-black px-2.5 py-0.5 rounded text-xs">
                Chambre N° {reservation.room_number}
              </div>
              <p className="font-bold text-slate-800 text-[11px]">{reservation.room_type}</p>
              <div className="text-[11px] text-slate-600 pt-1">
                <span>Du : <strong>{reservation.check_in}</strong></span>
                <span className="mx-1">&bull;</span>
                <span>Au : <strong>{reservation.check_out}</strong></span>
              </div>
              <p className="text-[10px] font-bold text-slate-700">
                Durée : {reservation.nights_count} nuitée(s)
              </p>
            </div>
          </div>

          {/* 4. Tableau Financier Détaillé */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Description des Prestations</th>
                  <th className="py-2.5 px-2 text-center">Quantité</th>
                  <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                  <th className="py-2.5 px-3 text-right">Total (F CFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">
                      Séjour en {reservation.room_type}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Chambre {reservation.room_number} &bull; Climatisation, Wi-Fi & Télévision
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">
                    {reservation.nights_count} nuit(s)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {formatFCFA(reservation.nightly_rate)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                    {formatFCFA(reservation.total_price)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-600 italic text-[11px]">
                    Taxes de séjour & Services de chambre
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400 text-[10px]">-</td>
                  <td className="py-2 px-3 text-right text-slate-400 text-[10px]">Inclus</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500 text-[10px]">
                    0 F CFA
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. Récapitulatif Total & Règlement */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Mode de Règlement
              </span>
              <p className="font-bold text-slate-800">
                {reservation.payment_method || "Espèces (Caisse Réception)"}
              </p>
              <p className="text-[10px] text-slate-500">
                Opération enregistrée par : <strong>{reservation.cashier_name || "Yao Richard MENSAH (Réception)"}</strong>
              </p>
            </div>

            <div className="space-y-1.5 bg-red-50/50 p-4 rounded-xl border border-red-200 text-right">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Total Facture :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatFCFA(reservation.total_price)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-bold border-t border-red-200 pt-1">
                <span>Montant Réglé / Encaissé :</span>
                <span className="font-mono font-black text-emerald-800 text-sm">
                  {formatFCFA(reservation.deposit_paid)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-black border-t border-red-200 pt-1">
                <span className={remainingBalance === 0 ? "text-emerald-700" : "text-[#DC2626]"}>
                  Solde Restant Dû :
                </span>
                <span className={`font-mono text-sm ${remainingBalance === 0 ? "text-emerald-700" : "text-[#DC2626]"}`}>
                  {formatFCFA(remainingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* 6. Signature & Cachet Hôtel Avenida */}
          <div className="border-t-2 border-slate-900 pt-4 grid grid-cols-2 gap-6 text-center text-xs">
            {/* Signature Client */}
            <div className="flex flex-col justify-between min-h-[85px] border-r border-slate-200 pr-4">
              <p className="font-bold text-slate-700 uppercase text-[10px]">
                Signature du Client
              </p>
              <div className="text-[9px] text-slate-300 italic">
                (Pour accord et acceptation)
              </div>
              <div className="text-[9px] text-slate-400">Date et Émargement</div>
            </div>

            {/* Cachet Réception Hôtel Avenida */}
            <div className="flex flex-col justify-between min-h-[85px] pl-4 relative">
              <p className="font-bold text-[#DC2626] uppercase text-[10px]">
                Pour la Réception &bull; Hôtel Avenida
              </p>
              <div className="my-auto py-1">
                <div className="inline-block border-2 border-[#DC2626] text-[#DC2626] rounded-xl px-3 py-1 font-mono text-[9px] font-black uppercase rotate-[-3deg] tracking-wider opacity-90 shadow-2xs">
                  ★ HÔTEL AVENIDA &bull; CAISSE ACCUEIL ★
                </div>
              </div>
              <div className="text-[9px] text-slate-500 font-semibold">
                Lomé, le {new Date().toLocaleDateString("fr-FR")}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[8px] text-slate-400 pt-3 border-t border-slate-100">
            Merci de votre confiance. Hôtel Avenida Lomé — L&apos;art de recevoir et l&apos;excellence hôtelière au Togo.
          </div>
        </div>
      </div>
    </div>
  );
}
