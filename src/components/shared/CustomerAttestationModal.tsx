"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  Printer,
  X,
  UserCheck,
  Building,
  Phone,
  Mail,
  CreditCard,
  Star,
  Award,
} from "lucide-react";
import { HotelCustomer } from "@/types";
import { formatFCFA } from "@/lib/utils";

interface CustomerAttestationModalProps {
  customer: HotelCustomer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerAttestationModal({
  customer,
  isOpen,
  onClose,
}: CustomerAttestationModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !customer) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full">
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-[#DC2626] text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-red-200" />
            <span className="text-xs font-black uppercase tracking-wider">
              Fiche Client Hôtel &bull; Réf : {customer.code}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-white text-[#DC2626] hover:bg-red-50 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#DC2626]" />
              <span>Télécharger / Imprimer la Fiche (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Customer Sheet */}
        <div
          ref={printableRef}
          className="p-6 md:p-8 bg-white text-slate-900 text-xs font-sans print:p-6 print:m-0 space-y-4"
          id="avenida-official-customer-attestation"
        >
          {/* Header with Hotel Avenida Branding */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
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
                  Direction de l&apos;Hébergement & Relations Clientèle
                </p>
                <p className="text-[8px] text-slate-400">
                  Dékon &bull; Lomé, Togo &bull; Tél: +228 22 21 00 00 / 90 55 44 33
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block border-2 border-slate-900 text-slate-900 px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest">
                FICHE CLIENT
              </span>
              <p className="text-[10px] font-mono font-black text-[#DC2626] mt-1">
                {customer.code}
              </p>
              <p className="text-[9px] text-slate-500">
                Enregistré le : {customer.created_at || "2026-01-10"}
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <h2 className="text-sm font-black font-serif text-slate-900 uppercase tracking-wider">
              FICHE D&apos;IDENTIFICATION & HISTORIQUE CLIENT HÔTELIER
            </h2>
            <p className="text-[10px] text-slate-500">
              Registre officiel de la clientèle hébergée au Complexe Hôtelier Avenida Lomé
            </p>
          </div>

          {/* Customer Profile Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Identité & Coordonnées
              </span>
              <p className="text-sm font-black text-slate-900">{customer.full_name}</p>
              {customer.company && (
                <p className="text-xs font-bold text-blue-900 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" /> Entreprise : {customer.company}
                </p>
              )}
              <p className="text-slate-600 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {customer.phone}
              </p>
              <p className="text-slate-600 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> {customer.email}
              </p>
            </div>

            <div className="space-y-1.5 text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Nationalité & Pièce d&apos;Identité
              </span>
              <p className="font-bold text-slate-800">
                Nationalité : <strong>{customer.nationality || "Togolaise"}</strong>
              </p>
              <p className="text-slate-700">
                N° Pièce / Passeport : <strong className="font-mono">{customer.id_card_or_passport}</strong>
              </p>
              {customer.id_card_document && (
                <p className="text-[10px] text-emerald-800 font-semibold flex items-center justify-end gap-1">
                  <span>✓ Pièce jointe archivée ({customer.id_card_document.formattedSize})</span>
                </p>
              )}
              <div className="pt-2">
                {customer.is_vip ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-black text-xs">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    CLIENT PRIVILÈGE &bull; VIP
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full font-bold text-xs">
                    Client Standard
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stays & Spending Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 text-center">
              <span className="text-[10px] text-blue-800 font-bold uppercase block">
                Nombre Total de Séjours
              </span>
              <span className="text-xl font-black text-blue-950 mt-1 block">
                {customer.total_stays} séjour(s)
              </span>
            </div>

            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                Total Dépenses Cumulées
              </span>
              <span className="text-xl font-black text-emerald-950 mt-1 block">
                {formatFCFA(customer.total_spent)}
              </span>
            </div>
          </div>

          {/* Signatures & Cachet */}
          <div className="border-t-2 border-slate-900 pt-3 grid grid-cols-2 gap-6 text-center text-xs">
            <div className="flex flex-col justify-between min-h-[80px] border-r border-slate-200 pr-4">
              <p className="font-bold text-slate-700 uppercase text-[10px]">
                Émargement du Client
              </p>
              <div className="text-[9px] text-slate-300 italic">Signature</div>
            </div>

            <div className="flex flex-col justify-between min-h-[80px] pl-4 relative">
              <p className="font-bold text-[#DC2626] uppercase text-[10px]">
                Pour la Réception &bull; Hôtel Avenida Lomé
              </p>
              <div className="my-auto py-1">
                <div className="inline-block border-2 border-[#DC2626] text-[#DC2626] rounded-xl px-3 py-0.5 font-mono text-[8px] font-black uppercase rotate-[-2deg] tracking-wider opacity-90 shadow-2xs">
                  ★ HÔTEL AVENIDA &bull; ACCUEIL CLIENTÈLE ★
                </div>
              </div>
              <div className="text-[8px] text-slate-500 font-semibold">
                Lomé, le {new Date().toLocaleDateString("fr-FR")}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[8px] text-slate-400 pt-2 border-t border-slate-100">
            Fichier client confidentiel &bull; Hôtel Avenida Lomé, Togo.
          </div>
        </div>
      </div>
    </div>
  );
}
