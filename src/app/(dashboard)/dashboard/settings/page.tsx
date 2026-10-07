"use client";

import { useState } from "react";
import {
  Settings,
  Building,
  Save,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useSchoolYear } from "@/context/SchoolYearContext";

export default function SettingsPage() {
  const { selectedYearLabel, availableYears, setSelectedYear } = useSchoolYear();
  const [isSaved, setIsSaved] = useState(false);

  const [config, setConfig] = useState({
    school_name: "Hôtel École Avenida",
    address: "30, Rue d'Almeida Leopold",
    city: "Lomé",
    country: "TOGO",
    phone_main: "+228 22 21 00 00",
    phone_secondary: "+228 90 12 34 56",
    email: "contact@avenida-lome.tg",
    motto: "Travail • Discipline • Excellence",
    currency: "F CFA (XOF)",
    bank_account: "TG054 01001 001234567890 45 (BTCI Lomé)",
    active_year: "2026-2027",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <Settings className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                ADMINISTRATION SYSTÈME
              </span>
              <span className="text-xs text-slate-400">&bull; Configuration</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-serif">
              Paramètres Institutionnels & Plateforme Avenida
            </h1>
            <p className="text-xs text-slate-500">
              Coordonnées de l&apos;établissement à Lomé, devise F CFA, années scolaires et règles de gestion
            </p>
          </div>
        </div>

        {isSaved && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-black animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Paramètres enregistrés avec succès !</span>
          </div>
        )}
      </div>

      {/* Statistiques Système */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Année Scolaire Active</span>
            <Calendar className="w-4 h-4 text-[#0C356A]" />
          </div>
          <div className="text-xl font-black text-[#0C356A] mt-2">{selectedYearLabel}</div>
          <div className="text-[10px] text-slate-500 mt-1">Synchronisée dans toute l&apos;application</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
            <span>Devise Officielle</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-950 mt-2">Franc CFA (XOF)</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Caisse scolaire & hôtel</div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-black">
            <span>Modules Opérationnels</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">12 / 12</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">Tous les services actifs</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Site Officiel</span>
            <Building className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-2">LOMÉ - TOGO</div>
          <div className="text-[10px] text-slate-500 mt-1">30, Rue d&apos;Almeida Leopold</div>
        </div>
      </div>

      {/* Formulaire de Configuration */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] border-b pb-2 mb-4 flex items-center gap-2">
              <Building className="w-4 h-4" />
              1. Informations Officielles de l&apos;Hôtel École Avenida
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Raison Sociale</label>
                <input
                  type="text"
                  value={config.school_name}
                  onChange={(e) => setConfig({ ...config, school_name: e.target.value })}
                  className="form-input-avenida font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Devise Officielle</label>
                <input
                  type="text"
                  value={config.motto}
                  onChange={(e) => setConfig({ ...config, motto: e.target.value })}
                  className="form-input-avenida"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Adresse à Lomé</label>
                <input
                  type="text"
                  value={config.address}
                  onChange={(e) => setConfig({ ...config, address: e.target.value })}
                  className="form-input-avenida"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ville</label>
                  <input
                    type="text"
                    value={config.city}
                    onChange={(e) => setConfig({ ...config, city: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pays</label>
                  <input
                    type="text"
                    value={config.country}
                    onChange={(e) => setConfig({ ...config, country: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] border-b pb-2 mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              2. Contacts Officiels & Coordonnées Bancaires
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Téléphone Principal</label>
                <input
                  type="tel"
                  value={config.phone_main}
                  onChange={(e) => setConfig({ ...config, phone_main: e.target.value })}
                  className="form-input-avenida"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Téléphone WhatsApp</label>
                <input
                  type="tel"
                  value={config.phone_secondary}
                  onChange={(e) => setConfig({ ...config, phone_secondary: e.target.value })}
                  className="form-input-avenida"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Institutionnel</label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="form-input-avenida"
                />
              </div>
              <div className="md:col-span-3">
                <label className="font-bold text-slate-700 block mb-1">
                  Relevé d&apos;Identité Bancaire (RIB) Lomé pour Reçus
                </label>
                <input
                  type="text"
                  value={config.bank_account}
                  onChange={(e) => setConfig({ ...config, bank_account: e.target.value })}
                  className="form-input-avenida font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0C356A] border-b pb-2 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              3. Gestion de l&apos;Année Académique Active
            </h3>
            <div className="max-w-md">
              <label className="font-bold text-slate-700 block mb-1">
                Année Scolaire de Travail Sélectionnée
              </label>
              <select
                value={selectedYearLabel.replace(" ", "")}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="form-input-avenida font-bold text-slate-900"
              >
                {availableYears.map((yr) => (
                  <option key={yr.value} value={yr.value}>
                    Année Scolaire {yr.label} ({yr.status})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Modifie instantanément l&apos;année affichée sur la barre latérale, le haut de page et les reçus.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Enregistrer les Paramètres Avenida</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
