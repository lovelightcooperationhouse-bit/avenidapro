"use client";

import { useState, useEffect } from "react";
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
  Printer,
  FileText,
  BadgeAlert,
  ArrowRight,
} from "lucide-react";
import { MOCK_RESERVATIONS, MOCK_ROOMS } from "@/lib/mock-data";
import { HotelReservation } from "@/types";
import { formatFCFA } from "@/lib/utils";
import { HotelReceiptModal } from "@/components/shared/HotelReceiptModal";
import { createClient } from "@/lib/supabase/client";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<HotelReservation[]>(MOCK_RESERVATIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceiptRes, setSelectedReceiptRes] = useState<HotelReservation | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("avenida_custom_reservations");
      if (stored) {
        const parsed = JSON.parse(stored) as HotelReservation[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const customIds = new Set(parsed.map((r) => r.id));
          const filteredMocks = MOCK_RESERVATIONS.filter((m) => !customIds.has(m.id));
          setReservations([...parsed, ...filteredMocks]);
        }
      }
    } catch (e) {
      console.warn("Erreur chargement réservations localStorage:", e);
    }
  }, []);

  // New reservation form state
  const [newRes, setNewRes] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_id_card: "",
    customer_nationality: "Togolaise",
    room_number: "201",
    room_type: "Chambre Supérieure Avenida",
    check_in: new Date().toISOString().split("T")[0],
    check_out: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    nights_count: 3,
    nightly_rate: 30000,
    deposit_paid: 90000,
    status_type: "payée" as "payée" | "réservée",
    payment_method: "Espèces" as any,
    auto_generate_receipt: true,
  });

  const totalRevenue = reservations.reduce((acc, r) => acc + r.total_price, 0);
  const totalDeposit = reservations.reduce((acc, r) => acc + r.deposit_paid, 0);
  const paidCount = reservations.filter(
    (r) => r.payment_status === "réglé" || r.status === "payée"
  ).length;
  const reservedCount = reservations.filter(
    (r) => r.status === "réservée" || r.payment_status === "en_attente" || r.status === "confirmée"
  ).length;

  const filteredReservations = reservations.filter((r) => {
    const matchSearch =
      r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.booking_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.room_number.includes(searchTerm);

    let matchStatus = true;
    if (statusFilter === "payé") {
      matchStatus = r.payment_status === "réglé" || r.status === "payée";
    } else if (statusFilter === "réservé") {
      matchStatus = r.status === "réservée" || r.payment_status === "en_attente" || r.status === "confirmée";
    } else if (statusFilter === "en_cours") {
      matchStatus = r.status === "en_cours";
    } else if (statusFilter !== "ALL") {
      matchStatus = r.status === statusFilter;
    }

    return matchSearch && matchStatus;
  });

  const handleRoomChange = (roomNum: string) => {
    const foundRoom = MOCK_ROOMS.find((r) => r.room_number === roomNum);
    const rate = foundRoom ? foundRoom.price_per_night : 30000;
    const roomType = foundRoom ? foundRoom.room_type : "Chambre Supérieure Avenida";
    const total = newRes.nights_count * rate;

    setNewRes((prev) => ({
      ...prev,
      room_number: roomNum,
      room_type: roomType,
      nightly_rate: rate,
      deposit_paid: prev.status_type === "payée" ? total : 0,
    }));
  };

  const handleNightsChange = (nights: number) => {
    const total = nights * newRes.nightly_rate;
    setNewRes((prev) => ({
      ...prev,
      nights_count: nights,
      deposit_paid: prev.status_type === "payée" ? total : prev.deposit_paid,
    }));
  };

  const handleStatusTypeChange = (type: "payée" | "réservée") => {
    const total = newRes.nights_count * newRes.nightly_rate;
    setNewRes((prev) => ({
      ...prev,
      status_type: type,
      deposit_paid: type === "payée" ? total : 0,
    }));
  };

  const handleAddReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRes.customer_name) return;

    const total = newRes.nights_count * newRes.nightly_rate;
    const isPaid = newRes.status_type === "payée" || Number(newRes.deposit_paid) >= total;
    const isPartial = !isPaid && Number(newRes.deposit_paid) > 0;

    const added: HotelReservation = {
      id: `res-${Date.now()}`,
      booking_ref: `RES-2026-${String(reservations.length + 93).padStart(3, "0")}`,
      customer_name: newRes.customer_name,
      customer_phone: newRes.customer_phone || "+228 90 00 00 00",
      customer_email: newRes.customer_email || undefined,
      customer_id_card: newRes.customer_id_card || undefined,
      customer_nationality: newRes.customer_nationality,
      room_number: newRes.room_number,
      room_type: newRes.room_type,
      check_in: newRes.check_in,
      check_out: newRes.check_out,
      nights_count: Number(newRes.nights_count),
      nightly_rate: Number(newRes.nightly_rate),
      total_price: total,
      deposit_paid: isPaid ? total : Number(newRes.deposit_paid),
      payment_status: isPaid ? "réglé" : isPartial ? "acompte" : "en_attente",
      status: isPaid ? "payée" : "réservée",
      payment_method: newRes.payment_method,
      cashier_name: "Yao Richard MENSAH (Chef de Réception)",
    };

    // 1. Sauvegarde locale immédiate
    try {
      const stored = localStorage.getItem("avenida_custom_reservations");
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem("avenida_custom_reservations", JSON.stringify([added, ...list]));
    } catch (e) {
      console.warn("Erreur localStorage réservations:", e);
    }

    // 2. Sauvegarde Supabase
    try {
      const supabase = createClient();
      (async () => {
        try {
          await supabase.from("reservations").insert({
            total_price: added.total_price,
            advance_amount: added.deposit_paid,
            status: added.status === "payée" ? "confirmée" : "en_attente",
            check_in_date: added.check_in,
            check_out_date: added.check_out,
          });
        } catch {
          // ignore background fallback
        }
      })();
    } catch (err) {
      console.warn("Supabase reservations insert fallback:", err);
    }

    setReservations([added, ...reservations]);
    setIsModalOpen(false);

    // Open receipt modal automatically if checked
    if (newRes.auto_generate_receipt) {
      setSelectedReceiptRes(added);
    }
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
                ESPACE HÔTEL &bull; RÉSERVATIONS
              </span>
              <span className="text-xs text-slate-400">&bull; Planning & Facturation Séjours</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-serif">
              Réservations, Statuts & Reçus Clients Hôtel
            </h1>
            <p className="text-xs text-slate-500">
              Gestion des statuts &laquo; Réservé &raquo; ou &laquo; Payé &raquo;, suivi des acomptes et génération instantanée des reçus officiels
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const total = newRes.nights_count * newRes.nightly_rate;
            setNewRes((prev) => ({
              ...prev,
              deposit_paid: prev.status_type === "payée" ? total : 0,
            }));
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Nouvelle Réservation (Réservé / Payé)</span>
        </button>
      </div>

      {/* Statistiques Réservations & Recettes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
            <span>Séjours Payés (Réglés)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">
            {paidCount} séjour(s)
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
            Reçus acquittés & validés
          </div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-black">
            <span>Réservations en Attente</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">
            {reservedCount} client(s)
          </div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">
            Statut &laquo; Réservé &raquo;
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Revenu Total Hébergement</span>
            <CreditCard className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {formatFCFA(totalRevenue)}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">
            Dont {formatFCFA(totalDeposit)} encaissés
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Total Réservations</span>
            <BedDouble className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {reservations.length} dossiers
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Hôtel Avenida Lomé</div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom du client, référence, n° chambre..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Filtrer par :</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="payé">Statut : Payé (Réglé 100%)</option>
            <option value="réservé">Statut : Réservé (En attente)</option>
            <option value="en_cours">Séjours en cours</option>
            <option value="terminée">Séjours terminés</option>
          </select>
        </div>
      </div>

      {/* Tableau des Réservations avec Actions Reçu */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-[#DC2626]" />
            <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              Registre des Séjours & Émission des Reçus
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {filteredReservations.length} réservation(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3.5 px-4">Réf. & Client</th>
                <th className="py-3.5 px-4">Chambre</th>
                <th className="py-3.5 px-4">Dates Séjour</th>
                <th className="py-3.5 px-4 text-center">Nuits</th>
                <th className="py-3.5 px-4">Montant Total</th>
                <th className="py-3.5 px-4">Encaissé / Solde</th>
                <th className="py-3.5 px-4 text-center">Statut Réservation</th>
                <th className="py-3.5 px-4 text-right">Reçu Officiel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservations.map((res) => {
                const isPaid =
                  res.payment_status === "réglé" ||
                  res.status === "payée" ||
                  res.deposit_paid >= res.total_price;
                const isPartial = !isPaid && res.deposit_paid > 0;
                const balance = Math.max(0, res.total_price - res.deposit_paid);

                return (
                  <tr key={res.id} className="hover:bg-red-50/20 transition-colors">
                    {/* Client & Réf */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{res.customer_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {res.booking_ref} &bull; {res.customer_phone}
                      </div>
                    </td>

                    {/* Chambre */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-black text-white bg-[#DC2626] px-2 py-0.5 rounded text-[11px] shadow-2xs">
                        Chambre {res.room_number}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{res.room_type}</div>
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 text-slate-700">
                      <div>Du {res.check_in}</div>
                      <div className="text-[10px] text-slate-500">Au {res.check_out}</div>
                    </td>

                    {/* Nuits */}
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {res.nights_count} nuit(s)
                    </td>

                    {/* Montant Total */}
                    <td className="py-3 px-4 font-mono font-black text-slate-900">
                      {formatFCFA(res.total_price)}
                    </td>

                    {/* Encaissé / Solde */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-emerald-700">
                        {formatFCFA(res.deposit_paid)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {balance === 0 ? (
                          <span className="text-emerald-700 font-bold">Soldé (0 F)</span>
                        ) : (
                          <span className="text-rose-600 font-bold">Reste: {formatFCFA(balance)}</span>
                        )}
                      </div>
                    </td>

                    {/* Statut Badge */}
                    <td className="py-3 px-4 text-center">
                      {isPaid ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>PAYÉ</span>
                        </span>
                      ) : isPartial ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>ACOMPTE</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-blue-600" />
                          <span>RÉSERVÉ</span>
                        </span>
                      )}
                    </td>

                    {/* Action Reçu */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceiptRes(res)}
                        className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 ml-auto"
                        title="Générer et télécharger le reçu de séjour officiel"
                      >
                        <Printer className="w-3.5 h-3.5 text-white" />
                        <span>Générer Reçu</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Aucune réservation trouvée pour ces critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1 : Enregistrer une Réservation avec Choix Réservé / Payé */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-[#DC2626] flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 font-serif">
                    Nouvelle Réservation Chambre Hôtel
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Définir le statut &laquo; Réservé &raquo; ou &laquo; Payé &raquo; et générer le reçu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReservation} className="space-y-4 text-xs">
              {/* Sélecteur de Statut : Réservé vs Payé */}
              <div className="bg-red-50/60 p-3.5 rounded-2xl border-2 border-red-200 space-y-2">
                <span className="font-black text-slate-800 text-[11px] block uppercase tracking-wider">
                  Statut de la Réservation & Facturation *
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleStatusTypeChange("payée")}
                    className={`p-3 rounded-xl border-2 font-black text-left flex items-center justify-between transition-all ${
                      newRes.status_type === "payée"
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="text-xs">SÉJOUR PAYÉ</div>
                      <div className={`text-[10px] ${newRes.status_type === "payée" ? "text-emerald-100" : "text-slate-400"}`}>
                        Réglé à 100% (Reçu acquitté)
                      </div>
                    </div>
                    {newRes.status_type === "payée" && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusTypeChange("réservée")}
                    className={`p-3 rounded-xl border-2 font-black text-left flex items-center justify-between transition-all ${
                      newRes.status_type === "réservée"
                        ? "bg-[#0C356A] text-white border-blue-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="text-xs">SÉJOUR RÉSERVÉ</div>
                      <div className={`text-[10px] ${newRes.status_type === "réservée" ? "text-blue-200" : "text-slate-400"}`}>
                        En attente ou avec acompte
                      </div>
                    </div>
                    {newRes.status_type === "réservée" && (
                      <Clock className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Informations Client */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nom Complet du Client *
                  </label>
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
                  <label className="font-bold text-slate-700 block mb-1">
                    Téléphone de Contact
                  </label>
                  <input
                    type="tel"
                    placeholder="+228 90 00 00 00"
                    value={newRes.customer_phone}
                    onChange={(e) => setNewRes({ ...newRes, customer_phone: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Pièce d&apos;identité / Passeport
                  </label>
                  <input
                    type="text"
                    placeholder="TG-CNI-2023-8941 ou N° Passeport"
                    value={newRes.customer_id_card}
                    onChange={(e) => setNewRes({ ...newRes, customer_id_card: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nationalité
                  </label>
                  <input
                    type="text"
                    value={newRes.customer_nationality}
                    onChange={(e) => setNewRes({ ...newRes, customer_nationality: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              {/* Détail Chambre & Tarif */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chambre</label>
                  <select
                    value={newRes.room_number}
                    onChange={(e) => handleRoomChange(e.target.value)}
                    className="form-input-avenida"
                  >
                    {MOCK_ROOMS.map((r) => (
                      <option key={r.id} value={r.room_number}>
                        Ch. {r.room_number} - {r.room_type} ({formatFCFA(r.price_per_night)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tarif / Nuitée (F CFA)
                  </label>
                  <input
                    type="number"
                    value={newRes.nightly_rate}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      const total = newRes.nights_count * rate;
                      setNewRes({
                        ...newRes,
                        nightly_rate: rate,
                        deposit_paid: newRes.status_type === "payée" ? total : newRes.deposit_paid,
                      });
                    }}
                    className="form-input-avenida font-mono font-bold"
                  />
                </div>
              </div>

              {/* Dates & Nuits */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date Arrivée</label>
                  <input
                    type="date"
                    value={newRes.check_in}
                    onChange={(e) => setNewRes({ ...newRes, check_in: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date Départ</label>
                  <input
                    type="date"
                    value={newRes.check_out}
                    onChange={(e) => setNewRes({ ...newRes, check_out: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre Nuits</label>
                  <input
                    type="number"
                    min={1}
                    value={newRes.nights_count}
                    onChange={(e) => handleNightsChange(Number(e.target.value))}
                    className="form-input-avenida font-bold text-center"
                  />
                </div>
              </div>

              {/* Règlements & Montant */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Mode de Règlement
                  </label>
                  <select
                    value={newRes.payment_method}
                    onChange={(e) => setNewRes({ ...newRes, payment_method: e.target.value as any })}
                    className="form-input-avenida font-semibold"
                  >
                    <option value="Espèces">Espèces (Caisse Hôtel)</option>
                    <option value="Mobile Money">Mobile Money (T-Money / Flooz)</option>
                    <option value="Carte Bancaire">Carte Bancaire (Stripe)</option>
                    <option value="Virement">Virement Bancaire</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {newRes.status_type === "payée" ? "Montant Total Payé" : "Acompte Versé (F CFA)"}
                  </label>
                  <input
                    type="number"
                    value={newRes.deposit_paid}
                    onChange={(e) => setNewRes({ ...newRes, deposit_paid: Number(e.target.value) })}
                    className="form-input-avenida font-mono font-black text-emerald-800"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Total Séjour : {formatFCFA(newRes.nights_count * newRes.nightly_rate)}
                  </div>
                </div>
              </div>

              {/* Checkbox auto generate receipt */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="auto_receipt"
                  checked={newRes.auto_generate_receipt}
                  onChange={(e) => setNewRes({ ...newRes, auto_generate_receipt: e.target.checked })}
                  className="rounded text-[#DC2626] focus:ring-[#DC2626]"
                />
                <label htmlFor="auto_receipt" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Générer et afficher le reçu de séjour immédiatement après confirmation
                </label>
              </div>

              {/* Boutons Footer */}
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
                  className="px-5 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Confirmer (Statut {newRes.status_type === "payée" ? "Payé" : "Réservé"})
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 : Reçu Officiel d'Hôtel Téléchargeable / Imprimable */}
      {selectedReceiptRes && (
        <HotelReceiptModal
          reservation={selectedReceiptRes}
          isOpen={!!selectedReceiptRes}
          onClose={() => setSelectedReceiptRes(null)}
        />
      )}
    </div>
  );
}
