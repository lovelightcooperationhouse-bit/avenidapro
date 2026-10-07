"use client";

import { useState } from "react";
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
} from "lucide-react";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { HotelRoom, RoomStatus } from "@/types";
import { formatFCFA } from "@/lib/utils";

export default function HotelRoomsPage() {
  const [rooms, setRooms] = useState<HotelRoom[]>(MOCK_ROOMS);
  const [selectedFloor, setSelectedFloor] = useState<number | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus | "ALL">("ALL");

  const filteredRooms = rooms.filter((r) => {
    const matchesFloor = selectedFloor === "ALL" || r.floor === selectedFloor;
    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    return matchesFloor && matchesStatus;
  });

  const updateRoomStatus = (roomId: string, newStatus: RoomStatus) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
    );
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

  return (
    <div className="space-y-6">
      {/* Top Header with Red Hotel Identity */}
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
              <span className="text-xs text-slate-400">&bull; 8 Chambres Physiques</span>
            </div>
            <h1 className="text-2xl font-black text-[#DC2626] font-serif">
              Hôtel Avenida &bull; Gestion des Chambres
            </h1>
            <p className="text-xs text-slate-500">
              Planning en temps réel, assignation des clients, check-in express et service d'étage
            </p>
          </div>
        </div>

        <button
          onClick={() => alert("Ajouter une nouvelle chambre")}
          className="px-4 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>Nouvelle Chambre</span>
        </button>
      </div>

      {/* Filter and Overview Pills */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Étage :</span>
          <select
            value={selectedFloor}
            onChange={(e) =>
              setSelectedFloor(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value)
              )
            }
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
          >
            <option value="ALL">Tous les étages</option>
            <option value={1}>1er Étage</option>
            <option value={2}>2ème Étage</option>
            <option value={3}>3ème Étage</option>
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
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg font-black">
            3 Libres
          </span>
          <span className="px-2.5 py-1 bg-rose-50 text-rose-900 border border-rose-300 rounded-lg font-black">
            2 Occupées
          </span>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-lg font-black">
            1 En Ménage
          </span>
        </div>
      </div>

      {/* Rooms Interactive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                    Chambre {room.room_number}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}
                  >
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1 font-medium">
                  {room.room_type} &bull; Étage {room.floor}
                </div>

                {room.current_guest && (
                  <div className="mt-3 p-2.5 bg-white/90 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Client en cours</span>
                    <span className="font-bold text-slate-900">{room.current_guest}</span>
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
                      className="px-2.5 py-1 bg-[#DC2626] text-white rounded-lg text-[11px] font-bold hover:bg-[#b91c1c]"
                    >
                      Check-in
                    </button>
                  )}
                  {room.status === "occupée" && (
                    <button
                      onClick={() => updateRoomStatus(room.id, "nettoyage")}
                      className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold hover:bg-amber-700"
                    >
                      Check-out
                    </button>
                  )}
                  {room.status === "nettoyage" && (
                    <button
                      onClick={() => updateRoomStatus(room.id, "disponible")}
                      className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-800"
                    >
                      Prête
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
