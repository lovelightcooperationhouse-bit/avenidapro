"use client";

import { useState } from "react";
import {
  TrendingUp,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  Building,
} from "lucide-react";
import { MOCK_FINANCES } from "@/lib/mock-data";
import { FinancialEntry } from "@/types";
import { formatFCFA } from "@/lib/utils";

export default function FinancesPage() {
  const [entries, setEntries] = useState<FinancialEntry[]>(MOCK_FINANCES);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newEntry, setNewEntry] = useState({
    type: "depense" as "recette" | "depense",
    category: "Approvisionnement Cuisine" as any,
    description: "",
    amount: 50000,
    payment_mode: "Espèces" as any,
    receipt_number: "",
  });

  const totalRecettes = entries
    .filter((e) => e.type === "recette")
    .reduce((acc, e) => acc + e.amount, 0);

  const totalDepenses = entries
    .filter((e) => e.type === "depense")
    .reduce((acc, e) => acc + e.amount, 0);

  const netBalance = totalRecettes - totalDepenses;

  const filteredEntries = entries.filter((e) => {
    const matchSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === "ALL" || e.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.description) return;

    const added: FinancialEntry = {
      id: `fin-${Date.now()}`,
      reference: `FIN-2026-${String(entries.length + 106).padStart(3, "0")}`,
      type: newEntry.type,
      category: newEntry.category,
      description: newEntry.description,
      amount: Number(newEntry.amount),
      date: new Date().toISOString().split("T")[0],
      recorded_by: "Comptable Caisse Lomé",
      payment_mode: newEntry.payment_mode,
      receipt_number: newEntry.receipt_number || `PJ-${Date.now().toString().slice(-4)}`,
    };

    setEntries([added, ...entries]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0C356A] to-[#082347] text-white flex items-center justify-center shadow-md">
            <TrendingUp className="w-7 h-7 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                DIRECTION, RH & FINANCES
              </span>
              <span className="text-xs text-slate-400">&bull; Trésorerie Générale</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-serif">
              Trésorerie, Encaissements & Dépenses d&apos;Exploitation
            </h1>
            <p className="text-xs text-slate-500">
              Journal des flux de trésorerie : Écolages scolaires, nuitées hôtel, énergie CEET, eau et charges
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-emerald-300" />
          <span>Enregistrer un Décaissement / Recette</span>
        </button>
      </div>

      {/* Statistiques Trésorerie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Solde Net en Caisse</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className={`text-2xl font-black mt-2 ${netBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {formatFCFA(netBalance)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Disponibilités bancaires & caisse</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
            <span>Recettes Totales</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-950 mt-2">{formatFCFA(totalRecettes)}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Écolages, Hôtel & Restaurant</div>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 text-xs font-black">
            <span>Dépenses Totales</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-950 mt-2">{formatFCFA(totalDepenses)}</div>
          <div className="text-[10px] text-rose-700 font-semibold mt-1">Approvisionnements, Factures CEET</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Écritures Validées</span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{entries.length} pièces</div>
          <div className="text-[10px] text-slate-500 mt-1">Reçus et pièces de caisse</div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Libellé, référence, catégorie..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
        >
          <option value="ALL">Tous les flux (Recettes & Dépenses)</option>
          <option value="recette">Recettes Uniquement</option>
          <option value="depense">Dépenses Uniquement</option>
        </select>
      </div>

      {/* Tableau du Journal de Trésorerie */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Réf. & Date</th>
                <th className="py-3.5 px-4">Type Flux</th>
                <th className="py-3.5 px-4">Catégorie</th>
                <th className="py-3.5 px-4">Description / Libellé</th>
                <th className="py-3.5 px-4">Montant (F CFA)</th>
                <th className="py-3.5 px-4">Mode & Reçu</th>
                <th className="py-3.5 px-4">Enregistré par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((item) => {
                const isRecette = item.type === "recette";

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{item.reference}</div>
                      <div className="text-[10px] text-slate-500">{item.date}</div>
                    </td>
                    <td className="py-3 px-4">
                      {isRecette ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          RECETTE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                          <ArrowUpRight className="w-3 h-3 text-rose-600" />
                          DÉPENSE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">{item.category}</td>
                    <td className="py-3 px-4 text-slate-800">{item.description}</td>
                    <td className="py-3 px-4 font-mono font-black text-sm">
                      <span className={isRecette ? "text-emerald-700" : "text-rose-700"}>
                        {isRecette ? "+" : "-"}
                        {formatFCFA(item.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-bold">{item.payment_mode}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.receipt_number}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.recorded_by}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Enregistrement Flux */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-[#0C356A]">Écriture de Caisse / Trésorerie</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-4 text-xs">
              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNewEntry({ ...newEntry, type: "depense" })}
                  className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 ${
                    newEntry.type === "depense"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Dépense / Décaissement
                </button>
                <button
                  type="button"
                  onClick={() => setNewEntry({ ...newEntry, type: "recette" })}
                  className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 ${
                    newEntry.type === "recette"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Recette / Encaissement
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catégorie Comptable</label>
                <select
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value as any })}
                  className="form-input-avenida"
                >
                  <option value="Écolages Scolaires">Écolages Scolaires</option>
                  <option value="Hébergement Hôtel">Hébergement Hôtel</option>
                  <option value="Restauration & Bar">Restauration & Bar</option>
                  <option value="Approvisionnement Cuisine">Approvisionnement Cuisine</option>
                  <option value="Électricité CEET">Électricité CEET</option>
                  <option value="Eau TdE">Eau TdE</option>
                  <option value="Maintenance & Travaux">Maintenance & Travaux</option>
                  <option value="Salaires & Charges">Salaires & Charges</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Motif *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Réparation climatiseur Chambre 201"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Montant (F CFA)</label>
                  <input
                    type="number"
                    step={1000}
                    required
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
                    className="form-input-avenida font-black text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mode de Paiement</label>
                  <select
                    value={newEntry.payment_mode}
                    onChange={(e) => setNewEntry({ ...newEntry, payment_mode: e.target.value as any })}
                    className="form-input-avenida"
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Virement">Virement</option>
                    <option value="Mobile Money">Mobile Money (T-Money / Flooz)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">N° Pièce Justificative / Facture</label>
                <input
                  type="text"
                  placeholder="ex: FACT-2026-881"
                  value={newEntry.receipt_number}
                  onChange={(e) => setNewEntry({ ...newEntry, receipt_number: e.target.value })}
                  className="form-input-avenida"
                />
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
                  className="px-5 py-2 bg-[#0C356A] text-white font-bold rounded-xl shadow-md"
                >
                  Enregistrer l&apos;Écriture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
