"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronRight,
  X,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  ModificationRequest,
  getPendingModifications,
  approveModificationRequest,
  rejectModificationRequest,
  MODIFICATIONS_UPDATED_EVENT,
} from "@/lib/director-modifications";

export function DirectorPendingApprovalsBanner() {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<ModificationRequest[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const refresh = () => {
    setPendingRequests(getPendingModifications());
  };

  useEffect(() => {
    refresh();
    window.addEventListener(MODIFICATIONS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(MODIFICATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (pendingRequests.length === 0) return null;

  const isDirector =
    user?.role === "directeur_general" || user?.email === "direction@ecole-avenida.tg";

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    await approveModificationRequest(
      id,
      user?.fullName || "M. Hope d'Almeida (Directeur Général)"
    );
    setProcessingId(null);
    refresh();
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Motif du refus de la modification (optionnel) :") || undefined;
    setProcessingId(id);
    await rejectModificationRequest(
      id,
      user?.fullName || "M. Hope d'Almeida (Directeur Général)",
      reason
    );
    setProcessingId(null);
    refresh();
  };

  return (
    <>
      {/* Bannière d'alerte en haut */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 px-4 py-3 rounded-2xl shadow-md border-2 border-amber-300 flex items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-sm font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                AUTORISATION DIRECTION
              </span>
              <span className="text-xs font-black text-white">
                {pendingRequests.length} demande{pendingRequests.length > 1 ? "s" : ""} de modification en attente
              </span>
            </div>
            <p className="text-[11px] text-amber-950 font-medium truncate mt-0.5">
              Des modifications sur des élèves, professeurs ou clients ont été soumises et requièrent le visa du Directeur Général.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsReviewOpen(true)}
          className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <span>Examiner ({pendingRequests.length})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modal d'examen pour le Directeur */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Header */}
            <div className="p-5 bg-[#0C356A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black font-serif">
                    Demandes de Modifications soumises à la Direction
                  </h2>
                  <p className="text-xs text-blue-200">
                    Visa officiel de M. Hope d&apos;Almeida (Directeur Général)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Liste des demandes */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs divide-y divide-slate-100">
              {pendingRequests.map((req) => {
                const typeLabels = {
                  student: "Élève",
                  employee: "Professeur / Collaborateur",
                  customer: "Client Hôtel",
                };

                return (
                  <div key={req.id} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#0C356A]">
                            {typeLabels[req.entity_type]}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {req.entity_code}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 mt-1">
                          {req.entity_name}
                        </h3>
                        <div className="text-[11px] text-slate-500">
                          Demandé par : <strong className="text-slate-700">{req.requested_by}</strong> &bull; Le {new Date(req.requested_at).toLocaleString("fr-FR")}
                        </div>
                      </div>

                      {/* Boutons d'action Direction */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={processingId === req.id}
                          className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Rejeter</span>
                        </button>
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={processingId === req.id}
                          className="px-4 py-1.5 bg-[#0C356A] hover:bg-[#164E87] text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Approuver & Appliquer</span>
                        </button>
                      </div>
                    </div>

                    {/* Tableau des modifications proposées */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                      <div className="font-bold text-slate-700 mb-2 text-[11px]">
                        Modifications demandées :
                      </div>
                      <div className="space-y-1.5">
                        {Object.entries(req.proposed_changes).map(([key, newVal]) => {
                          const oldVal = req.previous_data[key];
                          return (
                            <div key={key} className="grid grid-cols-3 gap-2 bg-white p-2 rounded-xl border border-slate-200 text-[11px]">
                              <span className="font-bold text-slate-700 truncate">{key}</span>
                              <span className="text-rose-600 line-through truncate font-mono">
                                {String(oldVal || "—")}
                              </span>
                              <span className="text-emerald-700 font-bold font-mono truncate">
                                ➔ {String(newVal || "—")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                Toute approbation applique instantanément la modification à la base de données.
              </span>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
