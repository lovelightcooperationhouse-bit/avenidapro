"use client";

import { BarChart3, Eye, Loader2, Monitor, Smartphone, Tablet, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Stats = {
  total_visits: number;
  total_visitors: number;
  period_visits: number;
  period_visitors: number;
  today_visits: number;
  today_visitors: number;
  per_day: { day: string; visits: number; visitors: number }[];
  top_pages: { path: string; visits: number }[];
  devices: Record<string, number>;
};

const PAGE_NAMES: Record<string, string> = {
  "/": "Accueil",
  "/ecole": "L'École",
  "/admissions": "Admissions",
  "/preinscription": "Pré-inscription",
  "/hotel": "L'Hôtel",
  "/actualites": "Actualités",
  "/a-propos": "À propos",
  "/contact": "Contact",
  "/confidentialite": "Confidentialité",
  "/conditions-utilisation": "Conditions d'utilisation",
};
const pageName = (p: string) => PAGE_NAMES[p] ?? (p.startsWith("/actualites/") ? `Article : ${p.slice(12)}` : p.startsWith("/pages/") ? `Page : ${p.slice(7)}` : p);

/** Statistiques de visite du site public : aujourd'hui, période, total, par jour, pages et appareils. */
export function SiteStats({ compact = false }: { compact?: boolean }) {
  const [days, setDays] = useState(30);
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setS(null);
    createClient()
      .rpc("site_stats", { days })
      .then(({ data, error: e }) => (e ? setError(e.message) : setS(data as Stats)));
  }, [days]);

  if (error) return <p className="rounded-2xl bg-red-50 p-4 text-sm text-[#B8000F]">Statistiques indisponibles : {error}</p>;
  if (!s) return <Loader2 aria-label="Chargement" className="size-6 animate-spin text-[#0C356A]" />;

  const max = Math.max(1, ...s.per_day.map((d) => d.visits));
  const chart = [...s.per_day].reverse();
  const devTotal = Object.values(s.devices).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-black text-[#0C356A]">
          <BarChart3 aria-hidden className="size-5 text-[#E30613]" /> Visites du site public
        </h2>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Période">
          {[7, 30, 90].map((d) => (
            <button key={d} type="button" role="radio" aria-checked={days === d} onClick={() => setDays(d)} className={cn("rounded-lg px-3 py-1.5 text-xs font-bold", days === d ? "bg-white text-[#0C356A] shadow-sm" : "text-slate-500 hover:text-[#E30613]")}>
              {d} jours
            </button>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          ["Aujourd'hui", s.today_visits, s.today_visitors],
          [`${days} derniers jours`, s.period_visits, s.period_visitors],
          ["Depuis le lancement", s.total_visits, s.total_visitors],
        ].map(([l, v, u]) => (
          <div key={String(l)} className="rounded-2xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-bold text-slate-500">{l}</dt>
            <dd className="mt-1 flex items-baseline gap-3">
              <span className="flex items-center gap-1 text-2xl font-black text-[#0C356A]">
                <Eye aria-hidden className="size-4 text-slate-400" />
                {Number(v).toLocaleString("fr-FR")}
              </span>
              <span className="flex items-center gap-1 text-sm font-bold text-slate-600">
                <Users aria-hidden className="size-3.5" />
                {Number(u).toLocaleString("fr-FR")} visiteur(s)
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-xs font-bold tracking-wide text-slate-500 uppercase">Pages vues par jour</p>
        <div className="flex h-40 items-end gap-[2px]" role="img" aria-label="Graphique des visites par jour">
          {chart.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              <div className="w-full rounded-t bg-[#0C356A] transition-colors group-hover:bg-[#E30613]" style={{ height: `${Math.max(2, (d.visits / max) * 100)}%` }} />
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-slate-900 px-2 py-0.5 text-[10px] whitespace-nowrap text-white group-hover:block">
                {new Date(d.day).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} · {d.visits}
              </span>
            </div>
          ))}
        </div>
      </section>

      {!compact && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <p className="border-b border-slate-100 px-4 py-3 text-xs font-bold tracking-wide text-slate-500 uppercase">Détail par jour</p>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Jour</th>
                    <th className="px-4 py-2 text-right">Pages vues</th>
                    <th className="px-4 py-2 text-right">Visiteurs</th>
                  </tr>
                </thead>
                <tbody>
                  {s.per_day.map((d) => (
                    <tr key={d.day} className="border-t border-slate-100">
                      <td className="px-4 py-2 capitalize">{new Date(d.day).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}</td>
                      <td className="px-4 py-2 text-right font-bold text-[#0C356A]">{d.visits}</td>
                      <td className="px-4 py-2 text-right">{d.visitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <div className="flex flex-col gap-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-xs font-bold tracking-wide text-slate-500 uppercase">Pages les plus consultées</p>
              {s.top_pages.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune visite sur la période.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {s.top_pages.map((p) => (
                    <li key={p.path} className="text-sm">
                      <span className="flex justify-between gap-2">
                        <span className="truncate font-semibold text-slate-700">{pageName(p.path)}</span>
                        <span className="font-bold text-[#0C356A]">{p.visits}</span>
                      </span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <span className="block h-full rounded-full bg-[#0C356A]" style={{ width: `${(p.visits / s.top_pages[0].visits) * 100}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-xs font-bold tracking-wide text-slate-500 uppercase">Appareils</p>
              <ul className="grid grid-cols-3 gap-2 text-center text-sm">
                {[
                  ["ordinateur", "Ordinateur", Monitor],
                  ["tablette", "Tablette", Tablet],
                  ["mobile", "Téléphone", Smartphone],
                ].map(([k, l, Icon]) => {
                  const n = s.devices[k as string] ?? 0;
                  const I = Icon as typeof Monitor;
                  return (
                    <li key={k as string} className="rounded-xl bg-slate-50 p-3">
                      <I aria-hidden className="mx-auto size-5 text-[#0C356A]" />
                      <p className="mt-1 font-black text-[#0C356A]">{Math.round((n / devTotal) * 100)} %</p>
                      <p className="text-xs text-slate-500">{l as string}</p>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
