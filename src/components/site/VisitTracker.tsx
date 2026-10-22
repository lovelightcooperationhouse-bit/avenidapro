"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const KEY = "avenida-visiteur";

/** Identifiant anonyme du navigateur (aucune donnée personnelle), pour compter les visiteurs uniques. */
function visitorId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Statistiques de visite : chaque page consultée du site public est enregistrée (robots exclus). */
export function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (navigator.webdriver || /bot|crawl|spider|preview/i.test(navigator.userAgent)) return;
    const w = window.innerWidth;
    let referrer: string | null = null;
    try {
      const r = document.referrer ? new URL(document.referrer) : null;
      referrer = r && r.host !== window.location.host ? r.host : null;
    } catch {
      /* référent illisible */
    }
    createClient()
      .from("site_visits")
      .insert({ path: pathname.slice(0, 300), visitor: visitorId(), referrer, device: w < 768 ? "mobile" : w < 1024 ? "tablette" : "ordinateur" })
      .then(() => {});
  }, [pathname]);
  return null;
}
