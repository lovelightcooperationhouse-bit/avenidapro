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
  Search,
  User,
  Phone,
  FileText,
  CreditCard,
  LogOut,
  CalendarDays,
  ShieldCheck,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { MOCK_RESERVATIONS } from "@/lib/mock-data";
import { HotelRoom, RoomStatus, HotelReservation } from "@/types";
import { formatFCFA } from "@/lib/utils";
import { HotelReceiptModal } from "@/components/shared/HotelReceiptModal";
import {
  getStoredRooms,
  saveAndSyncRoom,
  syncRoomsFromSupabase,
  assignRoomToGuest,
  checkoutRoom,
  getStoredReservations,
  syncReservationsFromSupabase,
  broadcastDataChange,
  AVENIDA_DATA_UPDATED_EVENT,
} from "@/lib/realtime-store";

export default function HotelRoomsPage() {
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [reservations, setReservations] = useState<HotelReservation[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Attribution / Arrivée / Réservation
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Modal Reçu officiel
  const [selectedReceiptReservation, setSelectedReceiptReservation] = useState<HotelReservation | null>(null);

  // Modal Checkout confirmation
  const [checkoutRoomTarget, setCheckoutRoomTarget] = useState<HotelRoom | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Formulaire d'attribution
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [assignForm, setAssignForm] = useState({
    mode: "walk_in" as "walk_in" | "reservation",
    room_number: "",
    guest_name: "",
    guest_phone: "",
    guest_email: "",
    guest_id_card: "",
    guest_nationality: "Togolaise",
    guest_company: "",
    is_vip: false,
    check_in: todayStr,
    check_out: tomorrowStr,
    price_per_night: 25000,
    deposit_paid: 25000,
    payment_method: "Espèces" as "Espèces" | "Stripe" | "Mobile Money" | "Virement" | "Carte Bancaire",
    cashier_name: "Yao Richard MENSAH (Chef de Réception)",
    special_requests: "",
  });

  const refreshAll = () => {
    setRooms(getStoredRooms());
    setReservations(getStoredReservations());
  };

  useEffect(() => {
    refreshAll();
    Promise.all([syncRoomsFromSupabase(), syncReservationsFromSupabase()]).then(() => {
      refreshAll();
    });

    window.addEventListener(AVENIDA_DATA_UPDATED_EVENT, refreshAll);
    window.addEventListener("storage", refreshAll);
    return () => {
      window.removeEventListener(AVENIDA_DATA_UPDATED_EVENT, refreshAll);
      window.removeEventListener("storage", refreshAll);
    };
  }, []);

  // Calcul dynamique des nuits et du total
  const calculateNights = () => {
    try {
      const d1 = new Date(assignForm.check_in);
      const d2 = new Date(assignForm.check_out);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  const currentNights = calculateNights();
  const currentTotalPrice = currentNights * (assignForm.price_per_night || 25000);
  const remainingDue = Math.max(0, currentTotalPrice - (assignForm.deposit_paid || 0));

  // Ouvrir le modal d'attribution pour une chambre précise
  const handleOpenAssignModal = (
    roomNumber?: string,
    initialMode: "walk_in" | "reservation" = "walk_in"
  ) => {
    const selectedRoom = roomNumber ? rooms.find((r) => r.room_number === roomNumber) : null;
    const defaultRoom = selectedRoom || rooms.find((r) => r.status === "disponible") || rooms[0];

    const price = defaultRoom ? defaultRoom.price_per_night : 25000;

    setAssignForm({
      mode: initialMode,
      room_number: defaultRoom ? defaultRoom.room_number : "101",
      guest_name: "",
      guest_phone: "+228 ",
      guest_email: "",
      guest_id_card: "",
      guest_nationality: "Togolaise",
      guest_company: "",
      is_vip: false,
      check_in: todayStr,
      check_out: tomorrowStr,
      price_per_night: price,
      deposit_paid: price, // Par défaut soldé d'avance pour 1 nuit
      payment_method: "Espèces",
      cashier_name: "Yao Richard MENSAH (Chef de Réception)",
      special_requests: "",
    });

    setShowAssignModal(true);
  };

  // Changement de la chambre sélectionnée dans le formulaire
  const handleRoomSelectChange = (roomNum: string) => {
    const found = rooms.find((r) => r.room_number === roomNum);
    const price = found ? found.price_per_night : 25000;
    setAssignForm((prev) => ({
      ...prev,
      room_number: roomNum,
      price_per_night: price,
      deposit_paid: price * currentNights,
    }));
  };

  // Exécution de l'attribution avec enregistrement et caisse immédiate
  const handleExecuteAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.guest_name.trim() || !assignForm.room_number) {
      alert("Veuillez renseigner le nom du client et choisir une chambre.");
      return;
    }

    setIsAssigning(true);
    try {
      const result = await assignRoomToGuest({
        room_number: assignForm.room_number,
        guest_name: assignForm.guest_name.trim(),
        guest_phone: assignForm.guest_phone.trim(),
        guest_email: assignForm.guest_email.trim() || undefined,
        guest_id_card: assignForm.guest_id_card.trim() || undefined,
        guest_nationality: assignForm.guest_nationality || "Togolaise",
        guest_company: assignForm.guest_company.trim() || undefined,
        is_vip: assignForm.is_vip,
        check_in: assignForm.check_in,
        check_out: assignForm.check_out,
        nights_count: currentNights,
        price_per_night: assignForm.price_per_night,
        total_price: currentTotalPrice,
        deposit_paid: Number(assignForm.deposit_paid) || 0,
        payment_method: assignForm.payment_method,
        cashier_name: assignForm.cashier_name,
        mode: assignForm.mode,
        special_requests: assignForm.special_requests || undefined,
      });

      refreshAll();
      setAssignSuccess(true);

      setTimeout(() => {
        setAssignSuccess(false);
        setShowAssignModal(false);

        // Si un montant a été payé, afficher immédiatement le reçu certifié
        if (result.receipt) {
          setSelectedReceiptReservation(result.reservation);
        }
      }, 1000);
    } catch (err) {
      console.error("Erreur exécution attribution chambre:", err);
      alert("Une erreur est survenue lors de l'attribution. Veuillez réessayer.");
    } finally {
      setIsAssigning(false);
    }
  };

  // Confirmer Check-out / Libération chambre
  const handleConfirmCheckout = async () => {
    if (!checkoutRoomTarget) return;
    setIsCheckingOut(true);
    try {
      await checkoutRoom(checkoutRoomTarget.room_number);
      refreshAll();
      setCheckoutRoomTarget(null);
    } catch (err) {
      console.error("Erreur check-out:", err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Convertir une réservation en check-in direct (Arrivée d'un client réservé)
  const handleCheckinReserved = async (room: HotelRoom) => {
    const updated = { ...room, status: "occupée" as RoomStatus };
    await saveAndSyncRoom(updated);
    refreshAll();
  };

  // Ouvrir le reçu lié à une chambre
  const handleOpenRoomReceipt = (room: HotelRoom) => {
    const match =
      reservations.find(
        (r) =>
          r.room_number === room.room_number &&
          (r.customer_name === room.current_guest || r.status === "en_cours" || r.status === "payée")
      ) || MOCK_RESERVATIONS.find((r) => r.room_number === room.room_number);

    if (match) {
      setSelectedReceiptReservation(match);
    } else {
      setSelectedReceiptReservation({
        id: `res-room-${room.room_number}`,
        booking_ref: `RES-HOT-${room.room_number}-${new Date().getFullYear()}`,
        customer_name: room.current_guest || "Client Résident",
        customer_phone: room.guest_phone || "+228 90 22 11 00",
        customer_id_card: room.guest_id_card || "Vérifié à la réception",
        customer_nationality: "Togolaise",
        room_number: room.room_number,
        room_type: room.room_type,
        check_in: room.check_in_date || todayStr,
        check_out: room.check_out_date || tomorrowStr,
        nights_count: 1,
        nightly_rate: room.price_per_night,
        total_price: room.price_per_night,
        deposit_paid: room.price_per_night,
        payment_status: "réglé",
        status: "payée",
        payment_method: "Espèces",
        cashier_name: "Yao Richard MENSAH (Chef de Réception)",
      });
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

  const filteredRooms = rooms.filter((r) => {
    const matchesFloor = selectedFloor === "ALL" || r.floor === selectedFloor;
    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    const matchesSearch =
      searchTerm.trim() === "" ||
      r.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.room_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.current_guest && r.current_guest.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFloor && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border-2 border-red-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center shadow-sm shrink-0">
            <BedDouble className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-[#DC2626] px-2 py-0.5 rounded-full">
                ESPACE HÔTELLERIE & CLIENTÈLE
              </span>
              <span className="text-xs text-slate-400">
                • {rooms.length} Chambre{rooms.length > 1 ? "s" : ""} de l&apos;Établissement
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#DC2626] font-serif">
              Hôtel Avenida • Attribution des Chambres &amp; Réception
            </h1>
            <p className="text-xs text-slate-500">
              Assignation directe aux clients arrivants, réservations préalables sous demande et encaissement immédiat à la caisse
            </p>
          </div>
        </div>

        {/* Bouton d'action principal : Attribuer une chambre */}
        <button
          onClick={() => handleOpenAssignModal(undefined, "walk_in")}
          className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>+ Attribuer Chambre (Arrivée ou Réservation)</span>
        </button>
      </div>

      {/* Filter and Overview Pills */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-[280px]">
          {/* Recherche */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher chambre, type ou client..."
              className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium w-64 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          <div className="flex items-center gap-2">
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
                <option key={f} value={f}>
                  Étage {f}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Statut :</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="disponible">Disponible</option>
              <option value="occupée">Occupée</option>
              <option value="réservée">Réservée</option>
              <option value="nettoyage">En Nettoyage</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Compteurs rapides */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg font-black">
            {rooms.filter((r) => r.status === "disponible").length} Disponible(s)
          </span>
          <span className="px-2.5 py-1 bg-rose-50 text-rose-900 border border-rose-300 rounded-lg font-black">
            {rooms.filter((r) => r.status === "occupée").length} Occupée(s)
          </span>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-300 rounded-lg font-black">
            {rooms.filter((r) => r.status === "réservée").length} Réservée(s)
          </span>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-lg font-black">
            {rooms.filter((r) => r.status === "nettoyage").length} En Nettoyage
          </span>
        </div>
      </div>

      {/* Grille des chambres avec attribution immédiate */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aucune chambre ne correspond à ces critères.</p>
          <button
            onClick={() => {
              setSelectedFloor("ALL");
              setSelectedStatus("ALL");
              setSearchTerm("");
            }}
            className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            Réinitialiser les filtres
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

                  {/* Détails du client actif ou réservataire */}
                  {room.current_guest ? (
                    <div className="mt-3 p-2.5 bg-white/95 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          {room.status === "réservée" ? "Client Réservataire" : "Client Résident"}
                        </span>
                        <button
                          onClick={() => handleOpenRoomReceipt(room)}
                          className="px-2 py-0.5 bg-red-50 hover:bg-[#DC2626] hover:text-white text-[#DC2626] rounded-md text-[10px] font-bold border border-red-200 transition-colors flex items-center gap-1 shrink-0"
                          title="Générer ou imprimer le reçu officiel de séjour"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Reçu</span>
                        </button>
                      </div>
                      <p className="font-bold text-slate-900 text-sm truncate">{room.current_guest}</p>
                      {room.guest_phone && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {room.guest_phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 p-2 bg-white/50 rounded-xl border border-dashed border-slate-300 text-center">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {room.status === "disponible"
                          ? "Prête pour nouvelle attribution"
                          : room.status === "nettoyage"
                          ? "En cours de remise en état"
                          : "Non assignable pour l'instant"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-black text-slate-900 font-serif">
                      {formatFCFA(room.price_per_night)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">/ nuitée</span>
                  </div>

                  {/* Actions par statut de chambre */}
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {room.status === "disponible" && (
                      <>
                        <button
                          onClick={() => handleOpenAssignModal(room.room_number, "walk_in")}
                          className="px-2.5 py-1.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white rounded-lg text-[11px] font-black shadow-xs transition-colors flex items-center gap-1"
                          title="Le client est là : enregistrement et remise de clé immédiate"
                        >
                          <span>Arrivée Directe</span>
                        </button>
                        <button
                          onClick={() => handleOpenAssignModal(room.room_number, "reservation")}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors"
                          title="Réservation préalable sous demande"
                        >
                          <span>Réserver</span>
                        </button>
                      </>
                    )}

                    {room.status === "occupée" && (
                      <button
                        onClick={() => setCheckoutRoomTarget(room)}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="Fin de séjour : libération et passage en nettoyage"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Check-out</span>
                      </button>
                    )}

                    {room.status === "réservée" && (
                      <button
                        onClick={() => handleCheckinReserved(room)}
                        className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[11px] font-black flex items-center gap-1 transition-colors"
                        title="Le client arrive pour prendre sa réservation"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Confirmer Arrivée</span>
                      </button>
                    )}

                    {room.status === "nettoyage" && (
                      <button
                        onClick={async () => {
                          const updated = { ...room, status: "disponible" as RoomStatus };
                          await saveAndSyncRoom(updated);
                          refreshAll();
                        }}
                        className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-black flex items-center gap-1 transition-colors"
                        title="Le service d'étages a terminé le ménage"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Prête</span>
                      </button>
                    )}

                    {(room.status === "maintenance" || room.status === "hors_service") && (
                      <button
                        onClick={async () => {
                          const updated = { ...room, status: "disponible" as RoomStatus };
                          await saveAndSyncRoom(updated);
                          refreshAll();
                        }}
                        className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-colors"
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

      {/* ========================================================================= */}
      {/* MODAL STRUCTURÉ : ATTRIBUTION DE CHAMBRE & ENREGISTREMENT CLIENT         */}
      {/* ========================================================================= */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="bg-[#DC2626] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <BedDouble className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider">
                    Attribution de Chambre &amp; Enregistrement Client
                  </h2>
                  <p className="text-[11px] text-red-100">
                    Chambre physique existante • Synchronisation immédiate avec la Caisse et Supabase
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteAssignment} className="p-6 space-y-5">
              {assignSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-bold animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Attribution validée ! Chambre mise à jour, client enregistré et caisse synchronisée.
                </div>
              )}

              {/* 1. Mode d'attribution : Walk-In ou Réservation préalable */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2">
                  Type d&apos;attribution du client *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                      assignForm.mode === "walk_in"
                        ? "border-[#DC2626] bg-red-50/50 text-[#DC2626]"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="assign_mode"
                      value="walk_in"
                      checked={assignForm.mode === "walk_in"}
                      onChange={() => setAssignForm({ ...assignForm, mode: "walk_in" })}
                      className="accent-[#DC2626]"
                    />
                    <div>
                      <span className="block text-xs font-black">Arrivée Directe (Walk-In)</span>
                      <span className="text-[10px] text-slate-500">
                        La personne est présente • Chambre immédiatement Occupée
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                      assignForm.mode === "reservation"
                        ? "border-blue-600 bg-blue-50/50 text-blue-800"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="assign_mode"
                      value="reservation"
                      checked={assignForm.mode === "reservation"}
                      onChange={() => setAssignForm({ ...assignForm, mode: "reservation" })}
                      className="accent-blue-600"
                    />
                    <div>
                      <span className="block text-xs font-black">Réservation Sous Demande</span>
                      <span className="text-[10px] text-slate-500">
                        Réservation préalable • Chambre bloquée et Réservée
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Chambre sélectionnée */}
              <div>
                <label className="block text-xs font-bold text-[#DC2626] mb-1.5">
                  Chambre Physique à Attribuer *
                </label>
                <select
                  value={assignForm.room_number}
                  onChange={(e) => handleRoomSelectChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  {rooms.map((r) => (
                    <option key={r.room_number} value={r.room_number}>
                      Chambre {r.room_number} — {r.room_type} (Étage {r.floor}) • {r.price_per_night.toLocaleString()} FCFA/nuit • [{r.status.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Fiche Complète du Client (bien structurée) */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Informations d&apos;Identité du Client
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nom et Prénoms du Client *
                    </label>
                    <input
                      type="text"
                      value={assignForm.guest_name}
                      onChange={(e) => setAssignForm({ ...assignForm, guest_name: e.target.value })}
                      placeholder="Ex: M. KOFFI Yao Christian"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Numéro Téléphone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={assignForm.guest_phone}
                      onChange={(e) => setAssignForm({ ...assignForm, guest_phone: e.target.value })}
                      placeholder="+228 90 00 00 00"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      N° CNI ou Passeport *
                    </label>
                    <input
                      type="text"
                      value={assignForm.guest_id_card}
                      onChange={(e) => setAssignForm({ ...assignForm, guest_id_card: e.target.value })}
                      placeholder="Ex: TG-0987654 / PASSEPORT"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nationalité
                    </label>
                    <input
                      type="text"
                      value={assignForm.guest_nationality}
                      onChange={(e) => setAssignForm({ ...assignForm, guest_nationality: e.target.value })}
                      placeholder="Togolaise"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Entreprise / Société
                    </label>
                    <input
                      type="text"
                      value={assignForm.guest_company}
                      onChange={(e) => setAssignForm({ ...assignForm, guest_company: e.target.value })}
                      placeholder="Optionnel"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Dates & Séjour */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Dates de Séjour &amp; Calcul Automatique
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Date d&apos;Arrivée *
                    </label>
                    <input
                      type="date"
                      value={assignForm.check_in}
                      onChange={(e) => setAssignForm({ ...assignForm, check_in: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Date de Départ *
                    </label>
                    <input
                      type="date"
                      value={assignForm.check_out}
                      onChange={(e) => setAssignForm({ ...assignForm, check_out: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nuitées Calculées
                    </label>
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 text-xs font-black">
                      {currentNights} nuit{currentNights > 1 ? "s" : ""}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Total Séjour
                    </label>
                    <div className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-[#DC2626] text-xs font-black font-mono">
                      {formatFCFA(currentTotalPrice)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Encaissement Caisse Immédiat (La caisse gère immédiatement sa part) */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border-2 border-emerald-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    <span>Règlement Caisse &amp; Trésorerie Immédiat</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-2 py-0.5 rounded-full">
                    Guichet Connecté
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      Montant Encaissé Maintenant *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={assignForm.deposit_paid}
                      onChange={(e) =>
                        setAssignForm({ ...assignForm, deposit_paid: Number(e.target.value) })
                      }
                      required
                      className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-xl text-slate-900 text-xs font-black font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-emerald-700 mt-0.5 block font-medium">
                      0 = Règlement différé au départ
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      Reste à Payer
                    </label>
                    <div
                      className={`w-full px-3 py-2 rounded-xl text-xs font-black font-mono border ${
                        remainingDue === 0
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                          : "bg-rose-50 text-rose-800 border-rose-300"
                      }`}
                    >
                      {remainingDue === 0 ? "SOLDÉ EN TOTALITÉ" : formatFCFA(remainingDue)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      Mode de Paiement *
                    </label>
                    <select
                      value={assignForm.payment_method}
                      onChange={(e) => setAssignForm({ ...assignForm, payment_method: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Espèces">Espèces</option>
                      <option value="Mobile Money">Mobile Money (TMoney / Flooz)</option>
                      <option value="Carte Bancaire">Carte Bancaire (POS)</option>
                      <option value="Virement">Virement Bancaire</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-6 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 active:scale-95"
                >
                  {isAssigning ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {assignForm.mode === "walk_in"
                      ? "Exécuter Arrivée & Encaisser"
                      : "Enregistrer Réservation & Encaisser"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CHECK-OUT / LIBÉRATION DE LA CHAMBRE                               */}
      {/* ========================================================================= */}
      {checkoutRoomTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">
                Confirmer le Check-out • Ch. {checkoutRoomTarget.room_number}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Le client <strong className="text-slate-800">{checkoutRoomTarget.current_guest || "Résident"}</strong> quitte l&apos;hôtel.
                La chambre passera en statut <strong>En Nettoyage</strong> pour le service d&apos;étages.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutRoomTarget(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckout}
                disabled={isCheckingOut}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isCheckingOut ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>Confirmer Départ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL REÇU OFFICIEL DE SÉJOUR HÔTEL                                      */}
      {/* ========================================================================= */}
      {selectedReceiptReservation && (
        <HotelReceiptModal
          reservation={selectedReceiptReservation}
          isOpen={!!selectedReceiptReservation}
          onClose={() => setSelectedReceiptReservation(null)}
        />
      )}
    </div>
  );
}
