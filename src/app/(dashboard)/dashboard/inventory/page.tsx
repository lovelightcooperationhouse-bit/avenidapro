"use client";

import { useState } from "react";
import {
  Boxes,
  AlertTriangle,
  PackageCheck,
  PlusCircle,
  Search,
  Filter,
  CreditCard,
  Building,
  X,
  Warehouse,
} from "lucide-react";
import { MOCK_INVENTORY } from "@/lib/mock-data";
import { InventoryItem } from "@/types";
import { formatFCFA } from "@/lib/utils";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Cuisine & Épicerie" as any,
    quantity: 10,
    unit: "kg",
    min_alert_threshold: 5,
    unit_price: 15000,
    supplier: "Marché Central Lomé",
    location: "Magasin Cuisine",
  });

  const totalValue = items.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const alertCount = items.filter((i) => i.quantity <= i.min_alert_threshold).length;

  const filteredItems = items.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === "ALL" || i.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    const added: InventoryItem = {
      id: `inv-${Date.now()}`,
      code: `STK-${String(items.length + 6).padStart(3, "0")}`,
      name: newItem.name,
      category: newItem.category,
      quantity: Number(newItem.quantity),
      unit: newItem.unit,
      min_alert_threshold: Number(newItem.min_alert_threshold),
      unit_price: Number(newItem.unit_price),
      supplier: newItem.supplier,
      last_restock_date: new Date().toISOString().split("T")[0],
      location: newItem.location,
    };

    setItems([added, ...items]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <Boxes className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                DIRECTION, RH & FINANCES
              </span>
              <span className="text-xs text-slate-400">&bull; Économat & Magasins</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-serif">
              Gestion des Stocks & Approvisionnements
            </h1>
            <p className="text-xs text-slate-500">
              Ingrédients cuisine pratique, produits d&apos;accueil hôtel, linge de lit et économat général
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>Réapprovisionnement / Entrée Stock</span>
        </button>
      </div>

      {/* Statistiques Stocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Valeur du Stock</span>
            <CreditCard className="w-4 h-4 text-[#0C356A]" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">{formatFCFA(totalValue)}</div>
          <div className="text-[10px] text-slate-500 mt-1">Actif circulant immobilisé</div>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 text-xs font-black">
            <span>Alertes Stock Bas</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-950 mt-2">{alertCount} article(s)</div>
          <div className="text-[10px] text-rose-700 font-semibold mt-1">À commander d&apos;urgence</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
            <span>Références Gérées</span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">{items.length}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Cuisine, Hôtel, Lingerie</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Entrepôts / Lieux</span>
            <Warehouse className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">3 magasins</div>
          <div className="text-[10px] text-slate-500 mt-1">Économat, Cave, Lingerie</div>
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
            placeholder="Désignation, code stock, fournisseur..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
        >
          <option value="ALL">Toutes les catégories</option>
          <option value="Cuisine & Épicerie">Cuisine & Épicerie</option>
          <option value="Boissons & Bar">Boissons & Bar</option>
          <option value="Lingerie & Produits d'Entretien">Lingerie & Produits d&apos;Entretien</option>
        </select>
      </div>

      {/* Tableau des Stocks */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Code & Désignation Article</th>
                <th className="py-3.5 px-4">Catégorie</th>
                <th className="py-3.5 px-4">Quantité en Stock</th>
                <th className="py-3.5 px-4">Prix Unitaire</th>
                <th className="py-3.5 px-4">Valeur Totale</th>
                <th className="py-3.5 px-4">Emplacement</th>
                <th className="py-3.5 px-4">Statut Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isLow = item.quantity <= item.min_alert_threshold;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.code} &bull; Fournisseur: {item.supplier}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">{item.category}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-black text-sm text-slate-900">
                        {item.quantity}
                      </span>{" "}
                      <span className="text-slate-500 text-[10px]">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{formatFCFA(item.unit_price)}</td>
                    <td className="py-3 px-4 font-mono font-black text-slate-900">
                      {formatFCFA(item.quantity * item.unit_price)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.location}</td>
                    <td className="py-3 px-4">
                      {isLow ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Stock Bas (Seuil: {item.min_alert_threshold})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Entrée de Stock */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-slate-900">Entrée en Stock / Réapprovisionnement</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Désignation du Produit *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Huile Végétale Raffinée (Bidons 20L)"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catégorie</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                    className="form-input-avenida"
                  >
                    <option value="Cuisine & Épicerie">Cuisine & Épicerie</option>
                    <option value="Boissons & Bar">Boissons & Bar</option>
                    <option value="Lingerie & Produits d'Entretien">Lingerie & Entretien</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Emplacement</label>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantité</label>
                  <input
                    type="number"
                    min={1}
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unité</label>
                  <input
                    type="text"
                    placeholder="kg, sacs, cartons"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seuil Alerte</label>
                  <input
                    type="number"
                    min={1}
                    value={newItem.min_alert_threshold}
                    onChange={(e) => setNewItem({ ...newItem, min_alert_threshold: Number(e.target.value) })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prix Unitaire (F CFA)</label>
                  <input
                    type="number"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fournisseur</label>
                  <input
                    type="text"
                    placeholder="Fournisseur Lomé..."
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
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
                  className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl shadow-md"
                >
                  Enregistrer en Magasin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
