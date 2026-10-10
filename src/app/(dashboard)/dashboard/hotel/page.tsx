"use client";

import { useState, useEffect } from "react";
import {
  BedDouble,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  UserCheck,
  Wrench,
  AlertTriangle,
  Plus,
  Printer,
  X,
  Save,
} from "lucide-react";
import { MOCK_RESERVATIONS } from "@/lib/mock-data";
import { HotelRoom, RoomStatus, HotelReservation } from "@/types";
import { formatFCFA } from "@/lib/utils";
import { HotelReceiptModal } from "@/components/shared/HotelReceiptModal";
import {
  getStoredRooms,
  saveAndSyncRoom,
  syncRoomsFromSupabase,
  broadcastDataChange,
  AVENIDA_DATA_UPDATED_EVENT,
} from "@/lib/realtime-store";
import { createClient } from "@/lib/supabase/client";

const ROOM_TYPES = [
  "Chambre Standard Découverte",
  "Chambre Standard Confort",
  "Chambre Supérieure",
  "Suite Junior Avenida",
  "Suite Deluxe",
  "Chambre Familiale",
  "Studio Hôtelier",
  "Suite Présidentielle",
];

export default function HotelRoomsPage() {
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus | "ALL">("ALL");
  const [selectedReceiptReservation, setSelectedReceiptReservation] = useState<HotelReservation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [newRoom, setNewRoom] = useState({
    room_number: "",
    floor: 1,
    room_type: ROOM_TYPES[0],
    price_per_night: 25000,
    status: "disponible" as RoomStatus,
    current_guest: "",
    capacity: 1,
    amenities: "",
    description: "",
  });

  // Charger les chambres depuis le store local/Supabase
  const refreshRooms = () => {
    setRooms(getStoredRooms());
  };

  useEffect(() => {
    refreshRooms();
    syncRoomsFromSupabase().then(() => refreshRooms());
    window.addEventListener(AVENIDA_DATA_UPDATED_EVENT, refreshRooms);
    window.addEventListener("storage", refreshRooms);
    return () => {
      window.removeEventListener(AVENIDA_DATA_UPDATED_EVENT, refreshRooms);
      window.removeEventListener("storage", refreshRooms);
    };
  }, []);

  const handleOpenRoomReceipt = (room: HotelRoom) => {
    const match = MOCK_RESERVATIONS.find((r) => r.room_number === room.room_number);
    if (match) {
      setSelectedReceiptReservation(match);
    } else {
      setSelectedReceiptReservation({
        id: `res-room-${room.room_number}`,
        booking_ref: `RES-HOT-${room.room_number}-2026`,
        customer_name: room.current_guest || "Client Résident",
        customer_phone: "+228 90 22 11 00",
        room_number: room.room_number,
        room_type: room.room_type,
        check_in: new Date().toISOString().split("T")[0],
        check_out: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
        nights_count: 2,
        nightly_rate: room.price_per_night,
        total_price: room.price_per_night * 2,
        deposit_paid: room.price_per_night * 2,
        payment_status: "réglé",
        status: "payée",
        payment_method: "Espèces",
        cashier_name: "Yao Richard MENSAH (Chef de Réception)",
      });
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesFloor = selectedFloor === "ALL" || r.floor === selectedFloor;
    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    return matchesFloor && matchesStatus;
  });

  const updateRoomStatus = async (roomId: string, newStatus: RoomStatus) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    const updated = { ...room, status: newStatus };
    await saveAndSyncRoom(updated);
    refreshRooms();
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.room_number.trim()) return;

    setIsSaving(true);
    const roomId = `rm-${newRoom.room_number.replace(/\s/g, "").toLowerCase()}-${Date.now()}`;
    const roomToAdd: HotelRoom = {
      id: roomId,
      room_number: newRoom.room_number.trim(),
      floor: Number(newRoom.floor),
      room_type: newRoom.room_type,
      price_per_night: Number(newRoom.price_per_night),
      status: newRoom.status,
      current_guest: newRoom.current_guest.trim() || undefined,
    };

    try {
      // Sauvegarder localement
      const current = getStoredRooms();
      const isDuplicate = current.some((r) => r.room_number === roomToAdd.room_number);
      if (isDuplicate) {
        alert(`La chambre ${roomToAdd.room_number} existe déjà !`);
        setIsSaving(false);
        return;
      }

      const updated = [...current, roomToAdd];
      localStorage.setItem("avenida_custom_rooms", JSON.stringify(updated));

      // Synchronisation Supabase
      try {
        const supabase = createClient();
        await supabase.from("rooms").upsert(
          {
            room_number: roomToAdd.room_number,
            floor: roomToAdd.floor,
            room_type: roomToAdd.room_type,
            price_per_night: roomToAdd.price_per_night,
            status: roomToAdd.status,
            current_guest: roomToAdd.current_guest || null,
          },
          { onConflict: "room_number" }
        );
      } catch (err) {
        console.warn("Sync Supabase chambre non bloquante:", err);
      }

      broadcastDataChange();
      refreshRooms();
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowAddModal(false);
        setNewRoom({
          room_number: "",
          floor: 1,
          room_type: ROOM_TYPES[0],
          price_per_night: 25000,
          status: "disponible",
          current_guest: "",
          capacity: 1,
          amenities: "",
          description: "",
        });
      }, 1200);
    } catch (err) {
      console.error("Erreur ajout chambre:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const statusConfig: Record<
    RoomStatus,
    { label: string; bg: string; border: string; text: string; icon: any }
  > = {
    disponible: {
      label: "Disponible",
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      text: "text-emerald-900",
      icon: CheckCircle2,
    },
    occupée: {
      label: "Occupée",
      bg: "bg-rose-50",
      border: "border-rose-300",
      text: "text-rose-900",
      icon: BedDouble,
    },
    réservée: {
      label: "Réservée",
      bg: "bg-blue-50",
      border: "border-blue-300",
      text: "text-blue-900",
      icon: Calendar,
    },
    nettoyage: {
      label: "En Nettoyage",
      bg: "bg-amber-50",
      border: "border-amber-300",
      text: "text-amber-900",
      icon: Sparkles,
    },
    maintenance: {
      label: "Maintenance",
      bg: "bg-slate-100",
      border: "border-slate-300",
      text: "text-slate-800",
      icon: Wrench,
    },
    hors_service: {
      label: "Hors Service",
      bg: "bg-zinc-100",
      border: "border-zinc-300",
      text: "text-zinc-800",
      icon: AlertTriangle,
    },
  };

  const uniqueFloors = [...new Set(rooms.map((r) => r.floor))].sort();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border-2 border-red-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center shadow-sm">
            <BedDouble className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-[#DC2626] px-2 py-0.5 rounded-full">
                ESPACE HÔTELLERIE & CLIENTÈLE
              </span>
              <span className="text-xs text-slate-400">• {rooms.length} Chambre{rooms.length > 1 ? "s" : ""} Physique{rooms.length > 1 ? "s" : ""}</span>
            </div>
            <h1 className="text-2xl font-black text-[#DC2626] font-serif">
              Hôtel Avenida • Gestion des Chambres
            </h1>
            <p className="text-xs text-slate-500">
              Planning en temps réel, assignation des clients, check-in express et service d&apos;étage
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>Nouvelle Chambre</span>
        </button>
      </div>

      {/* Filter and Overview Pills */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600">Étage :</span>
          <select
            value={selectedFloor}
            onChange={(e) =>
              setSelectedFloor(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
            }
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
          >
            <option value="ALL">Tous les étages</option>
            {uniqueFloors.map((f) => (
              <option key={f} value={f}>Étage {f}</option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-600 ml-3">Statut :</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="disponible">Disponible</option>
            <option value="occupée">Occupée</option>
            <option value="réservée">Réservée</option>
            <option value="nettoyage">Nettoyage</option>
            <option value="maintenance">Maintenance</option>
            <option value="hors_service">Hors Service</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg font-black">
            {rooms.filter((r) => r.status === "disponible").length} Libre{rooms.filter((r) => r.status === "disponible").length > 1 ? "s" : ""}
          </span>
          <span className="px-2.5 py-1 bg-rose-50 text-rose-900 border border-rose-300 rounded-lg font-black">
            {rooms.filter((r) => r.status === "occupée").length} Occupée{rooms.filter((r) => r.status === "occupée").length > 1 ? "s" : ""}
          </span>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-lg font-black">
            {rooms.filter((r) => r.status === "nettoyage").length} Nettoyage
          </span>
        </div>
      </div>

      {/* Rooms Interactive Grid */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aucune chambre trouvée</p>
          <p className="text-xs text-slate-400 mt-1">Ajoutez une chambre ou modifiez les filtres</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-[#DC2626] text-white text-xs font-bold rounded-xl"
          >
            + Ajouter une chambre
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredRooms.map((room) => {
            const cfg = statusConfig[room.status];
            const Icon = cfg.icon;

            return (
              <div
                key={room.id}
                className={`p-5 rounded-2xl border-2 ${cfg.border} ${cfg.bg} flex flex-col justify-between shadow-xs transition-all hover:shadow-md space-y-4`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black font-serif text-slate-900">
                      Ch. {room.room_number}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}
                    >
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 font-medium">
                    {room.room_type} • Étage {room.floor}
                  </div>

                  {room.current_guest && (
                    <div className="mt-3 p-2.5 bg-white/90 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Client en cours</span>
                        <span className="font-bold text-slate-900">{room.current_guest}</span>
                      </div>
                      <button
                        onClick={() => handleOpenRoomReceipt(room)}
                        className="px-2 py-1 bg-red-50 hover:bg-[#DC2626] hover:text-white text-[#DC2626] rounded-lg text-[10px] font-bold border border-red-200 transition-colors flex items-center gap-1 shrink-0"
                        title="Générer et imprimer le reçu officiel de séjour"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Reçu</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-black text-slate-900 font-serif">
                      {formatFCFA(room.price_per_night)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">/ nuitée</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {room.status === "disponible" && (
                      <button
                        onClick={() => updateRoomStatus(room.id, "occupée")}
                        className="px-2.5 py-1 bg-[#DC2626] text-white rounded-lg text-[11px] font-bold hover:bg-[#b91c1c] transition-colors"
                      >
                        Check-in
                      </button>
                    )}
                    {room.status === "occupée" && (
                      <button
                        onClick={() => updateRoomStatus(room.id, "nettoyage")}
                        className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold hover:bg-amber-700 transition-colors"
                      >
                        Check-out
                      </button>
                    )}
                    {room.status === "nettoyage" && (
                      <button
                        onClick={() => updateRoomStatus(room.id, "disponible")}
                        className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-800 transition-colors"
                      >
                        Prête
                      </button>
                    )}
                    {room.status === "réservée" && (
                      <button
                        onClick={() => updateRoomStatus(room.id, "occupée")}
                        className="px-2.5 py-1 bg-blue-700 text-white rounded-lg text-[11px] font-bold hover:bg-blue-800 transition-colors"
                      >
                        Arrivée
                      </button>
                    )}
                    {(room.status === "maintenance" || room.status === "hors_service") && (
                      <button
                        onClick={() => updateRoomStatus(room.id, "disponible")}
                        className="px-2.5 py-1 bg-slate-700 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 transition-colors"
                      >
                        Remettre en service
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL REÇU DE SÉJOUR HÔTEL */}
      {selectedReceiptReservation && (
        <HotelReceiptModal
          reservation={selectedReceiptReservation}
          isOpen={!!selectedReceiptReservation}
          onClose={() => setSelectedReceiptReservation(null)}
        />
      )}

      {/* MODAL AJOUTER UNE NOUVELLE CHAMBRE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-[#DC2626] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-red-200" />
                <span className="text-sm font-black uppercase tracking-wider">
                  Enregistrer une Nouvelle Chambre
                </span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="p-6 space-y-5">
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Chambre enregistrée avec succès ! Synchronisation Supabase effectuée.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Numéro chambre */}
                <div>
                  <label className="block text-xs font-bold text-[#DC2626] mb-1.5">
                    Numéro de Chambre *
                  </label>
                  <input
                    type="text"
                    value={newRoom.room_number}
                    onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                    placeholder="Ex: 103, 201, Suite-01..."
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-[#DC2626] font-semibold"
                  />
                </div>

                {/* Étage */}
                <div>
                  <label className="block text-xs font-bold text-[#DC2626] mb-1.5">
                    Étage *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={newRoom.floor}
                    onChange={(e) => setNewRoom({ ...newRoom, floor: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-[#DC2626] font-semibold"
                  />
                </div>
              </div>

              {/* Type de chambre */}
              <div>
                <label className="block text-xs font-bold text-[#DC2626] mb-1.5">
                  Type de Chambre *
                </label>
                <select
                  value={newRoom.room_type}
                  onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-[#DC2626] font-semibold"
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Prix par nuit */}
                <div>
                  <label className="block text-xs font-bold text-[#DC2626] mb-1.5">
                    Prix par Nuitée (FCFA) *
                  </label>
                  <input
                    type="number"
                    min={5000}
                    step={1000}
                    value={newRoom.price_per_night}
                    onChange={(e) => setNewRoom({ ...newRoom, price_per_night: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-[#DC2626] font-semibold"
                  />
                </div>

                {/* Statut initial */}
                <div>
                  <label className="block text-xs font-bold text-[#DC2626] mb-1.5">
                    Statut Initial *
                  </label>
                  <select
                    value={newRoom.status}
                    onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value as RoomStatus })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-[#DC2626] font-semibold"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="occupée">Occupée</option>
                    <option value="réservée">Réservée</option>
                    <option value="nettoyage">En Nettoyage</option>
                    <option value="maintenance">En Maintenance</option>
                    <option value="hors_service">Hors Service</option>
                  </select>
                </div>
              </div>

              {/* Client actuel (optionnel) */}
              <div>
                <label className="block text-xs font-bold text-[#DC2626] mb-1.5">
                  Client Actuel (optionnel, si occupée)
                </label>
                <input
                  type="text"
                  value={newRoom.current_guest}
                  onChange={(e) => setNewRoom({ ...newRoom, current_guest: e.target.value })}
                  placeholder="Ex: Dr. Mensah Agbéyomé"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-[#DC2626] font-semibold"
                />
              </div>

              {/* Boutons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 active:scale-95"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Enregistrer & Synchroniser</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
