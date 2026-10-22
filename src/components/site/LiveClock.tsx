"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

/** Date et heure locales de Lomé, mises à jour chaque minute. */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  if (!now) return null;
  const date = now.toLocaleDateString("fr-FR", { timeZone: "Africa/Lome", weekday: "short", day: "numeric", month: "short" });
  const time = now.toLocaleTimeString("fr-FR", { timeZone: "Africa/Lome", hour: "2-digit", minute: "2-digit" });
  return (
    <span className={className}>
      <Clock aria-hidden className="size-3.5 shrink-0 text-or" />
      <span className="capitalize">{date}</span>
      <strong className="font-mono text-white tabular-nums">{time}</strong>
      <span className="text-white/60">Lomé</span>
    </span>
  );
}
