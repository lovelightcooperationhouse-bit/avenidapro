"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/** Bandeau hors connexion : consultation des dernières données ; les enregistrements reprennent au retour du réseau. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-bold text-amber-950 shadow-lg print:hidden">
      <WifiOff aria-hidden className="size-4 shrink-0" />
      Hors connexion : vous consultez les dernières données enregistrées sur cet appareil. Les enregistrements reprendront au retour du réseau.
    </div>
  );
}
