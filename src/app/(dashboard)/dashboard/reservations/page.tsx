"use client";

import { useState } from "react";
import {
  CalendarDays,
  BedDouble,
  Clock,
  CheckCircle2,
  PlusCircle,
  Search,
  Filter,
  Phone,
  User,
  X,
  CreditCard,
  Building,
} from "lucide-react";
import { MOCK_RESERVATIONS, MOCK_ROOMS } from "@/lib/mock-data";
import { HotelReservation } from "@/types";
import { formatFCFA } from "@/lib/utils";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<HotelReservation[]>(MOCK_RESERVATIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newRes, setNewRes] = useState({
    customer_name: "",
    customer_phone: "",
    room_number: "201",
    room_type: "Chambre Supérieure Avenida",
    check_in: new Date().toISOString().split("T")[0],
    check_out: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    nights_count: 3,
    nightly_rate: 30000,
    deposit_paid: 30000,
  });

  const totalRevenue = reservations.reduce((acc, r) => acc + r.total_price, 0);
  const totalDeposit = reservations.reduce((acc, r) => acc + r.deposit_paid, 0);
  const activeCount = reservations.filter((r) => r.status === "en_cours").length;

  const filteredReservations = reservations.filter((r) => {
    const matchSearch =
      r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.booking_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.room_number.includes(searchTerm);
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAddReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRes.customer_name) return;

    const total = newRes.nights_count * newRes.nightly_rate;
    const added: HotelReservation = {
      id: `res-${Date.now()}`,
      booking_ref: `RES-2026-${String(reservations.length + 93).padStart(3, "0")}`,
      customer_name: newRes.customer_name,
      customer_phone: newRes.customer_phone || "+228 90 00 00 00",
      room_number: newRes.room_number,
      room_type: newRes.room_type,
      check_in: newRes.check_in,
      check_out: newRes.check_out,
      nights_count: Number(newRes.nights_count),
      nightly_rate: Number(newRes.nightly_rate),
      total_price: total,
      deposit_paid: Number(newRes.deposit_paid),
      payment_status:
        Number(newRes.deposit_paid) >= total
          ? "réglé"
          : Number(newRes.deposit_paid) > 0
          ? "acompte"
          : "en_attente",
      status: "confirmée",
    };

    setReservations([added, ...reservations]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-3xl border-2 border-red-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center shadow-md">
            <CalendarDays className="w-7 h-7 text-red-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-[#DC2626] px-2 py-0.5 rounded-full">
                ESPACE HÔTEL AVENIDA
              </span>
              <span className="text-xs text-slate-400">&bull; Planning des Séjours</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-serif">
              Réservations & Arrivées Clients Hôtel
            </h1>
            <p className="text-xs text-slate-500">
              Gestion des 8 chambres, séjours en cours, acomptes et arrivées prévues
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Nouvelle Réservation Chambre</span>
        </button>
      </div>

      {/* Statistiques Réservations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Séjours en Cours</span>
            <BedDouble className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-2xl font-black text-[#DC2626] mt-2">{activeCount} clients</div>
          <div className="text-[10px] text-slate-500 mt-1">Actuellement en chambre</div>
        </div>

        <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 shadow-2xs">
          <div className="flex items-center justify-between text-red-800 text-xs font-black">
            <span>Revenu Hébergement</span>
            <CreditCard className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-black text-red-950 mt-2">
            {formatFCFA(totalRevenue)}
          </div>
          <div className="text-[10px] text-red-700 font-semibold mt-1">
            Dont {formatFCFA(totalDeposit)} encaissés
          </div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
            <span>Taux de Confirmation</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">100%</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Aucune annulation récente</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Total Réservations</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{reservations.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Période en cours</div>
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
            placeholder="Nom du client, référence, n° chambre..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="confirmée">Confirmée</option>
          <option value="en_cours">En cours</option>
          <option value="terminée">Terminée</option>
        </select>
      </div>

      {/* Tableau des Réservations */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Réf. & Client</th>
                <th className="py-3.5 px-4">Chambre</th>
                <th className="py-3.5 px-4">Dates Séjour</th>
                <th className="py-3.5 px-4">Nuits</th>
                <th className="py-3.5 px-4">Montant Total</th>
                <th className="py-3.5 px-4">Acompte Versé</th>
                <th className="py-3.5 px-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservations.map((res) => (
                <tr key={res.id} className="hover:bg-red-50/30">
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-slate-900">{res.customer_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {res.booking_ref} &bull; {res.customer_phone}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-black text-white bg-[#DC2626] px-2 py-0.5 rounded text-[11px]">
                      Chambre {res.room_number}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">{res.room_type}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div>Du {res.check_in}</div>
                    <div className="text-[10px] text-slate-500">Au {res.check_out}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-700">{res.nights_count} nuit(s)</td>
                  <td className="py-3 px-4 font-mono font-black text-slate-900">
                    {formatFCFA(res.total_price)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                    {formatFCFA(res.deposit_paid)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        res.status === "en_cours"
                          ? "bg-emerald-100 text-emerald-800"
                          : res.status === "confirmée"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {res.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Réservation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-[#DC2626]">Enregistrer une Réservation</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddReservation} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom Complet du Client *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: M. Koffi Anan"
                  value={newRes.customer_name}
                  onChange={(e) => setNewRes({ ...newRes, customer_name: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Téléphone de Contact</label>
                <input
                  type="tel"
                  placeholder="+228 90 00 00 00"
                  value={newRes.customer_phone}
                  onChange={(e) => setNewRes({ ...newRes, customer_phone: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chambre</label>
                  <select
                    value={newRes.room_number}
                    onChange={(e) => setNewRes({ ...newRes, room_number: e.target.value })}
                    className="form-input-avenida"
                  >
                    {MOCK_ROOMS.map((r) => (
                      <option key={r.id} value={r.room_number}>
                        Ch. {r.room_number} - {r.room_type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tarif / Nuit (F CFA)</label>
                  <input
                    type="number"
                    value={newRes.nightly_rate}
                    onChange={(e) => setNewRes({ ...newRes, nightly_rate: Number(e.target.value) })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date d&apos;arrivée</label>
                  <input
                    type="date"
                    value={newRes.check_in}
                    onChange={(e) => setNewRes({ ...newRes, check_in: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date de départ</label>
                  <input
                    type="date"
                    value={newRes.check_out}
                    onChange={(e) => setNewRes({ ...newRes, check_out: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre de nuits</label>
                  <input
                    type="number"
                    min={1}
                    value={newRes.nights_count}
                    onChange={(e) => setNewRes({ ...newRes, nights_count: Number(e.target.value) })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Acompte versé (F CFA)</label>
                  <input
                    type="number"
                    value={newRes.deposit_paid}
                    onChange={(e) => setNewRes({ ...newRes, deposit_paid: Number(e.target.value) })}
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
                  className="px-5 py-2 bg-[#DC2626] text-white font-bold rounded-xl shadow-md"
                >
                  Confirmer la Réservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
