"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Pages d'accueil : rien avant elles, pas de bouton retour. */
const HOMES = new Set(["/", "/dashboard", "/espace", "/connexion"]);

/**
 * Bouton « Retour » de l'application installée (écran d'accueil du téléphone) : sans barre de navigateur,
 * il n'y a pas de flèche retour. Revient à la page précédente, sinon à l'accueil de son espace.
 */
export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [app, setApp] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const update = () => setApp(mq.matches || !!(navigator as unknown as { standalone?: boolean }).standalone);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!app || HOMES.has(pathname)) return null;

  const back = () => {
    if (window.history.length > 1) return router.back();
    router.push(pathname.startsWith("/dashboard") || pathname.startsWith("/impression") ? "/dashboard" : pathname.startsWith("/espace") ? "/espace" : "/");
  };

  return (
    <button
      type="button"
      onClick={back}
      aria-label="Retour à la page précédente"
      // Gestion sur grand écran : à droite de la barre latérale, pour ne pas couvrir la fiche de l'utilisateur
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[150] ${pathname.startsWith("/dashboard") ? "lg:left-[19rem]" : ""} inline-flex items-center gap-1.5 rounded-full bg-[#0C356A] py-2.5 pr-4 pl-3 text-sm font-bold text-white shadow-xl ring-2 ring-white/80 active:scale-95 print:hidden`}
    >
      <ArrowLeft aria-hidden className="size-5" /> Retour
    </button>
  );
}
