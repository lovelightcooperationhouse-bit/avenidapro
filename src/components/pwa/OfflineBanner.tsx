"use client";

import { CloudUpload, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { flushOutbox, OUTBOX_EVENT, pendingOps } from "@/lib/offline-queue";

/**
 * Bandeau hors connexion : consultation des dernières données ; l'appel et les notes saisis sans réseau
 * attendent sur l'appareil et partent automatiquement au retour de la connexion.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [waiting, setWaiting] = useState(0);
  const [sent, setSent] = useState(0);

  useEffect(() => {
    const refresh = () => setWaiting(pendingOps().length);
    const sync = async () => {
      const r = await flushOutbox();
      if (r.sent) setSent(r.sent);
      refresh();
    };
    const update = () => {
      setOffline(!navigator.onLine);
      if (navigator.onLine) sync();
    };
    update();
    refresh();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener(OUTBOX_EVENT, refresh);
    const timer = window.setInterval(() => navigator.onLine && pendingOps().length && sync(), 60_000);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener(OUTBOX_EVENT, refresh);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!sent) return;
    const t = window.setTimeout(() => setSent(0), 6000);
    return () => window.clearTimeout(t);
  }, [sent]);

  if (!offline && !waiting && !sent) return null;
  return (
    <div role="status" className={`fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 text-center text-sm font-bold shadow-lg print:hidden ${offline ? "bg-amber-500 text-amber-950" : "bg-emerald-600 text-white"}`}>
      {offline ? <WifiOff aria-hidden className="size-4 shrink-0" /> : <CloudUpload aria-hidden className="size-4 shrink-0" />}
      {offline
        ? `Hors connexion : vous consultez les dernières données de cet appareil. L'appel et les notes restent enregistrables${waiting ? ` (${waiting} envoi(s) en attente)` : ""} et partiront au retour du réseau.`
        : sent
          ? `Connexion rétablie : ${sent} enregistrement(s) fait(s) hors connexion envoyé(s).`
          : `Envoi en cours de ${waiting} enregistrement(s) fait(s) hors connexion…`}
    </div>
  );
}
