"use client";

import { Gift, Loader2, Save, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Conf = { pointsPer1000: number; pointValue: number; referralPoints: number; bonusEvery: number; bonusPoints: number; holdMinutes: number };
type Customer = { id: string; full_name: string | null; phone: string | null; loyalty_points: number | null; referral_code: string | null; total_stays: number | null; referred_by: string | null; referral_rewarded: boolean };

const FIELDS: { k: keyof Conf; label: string; hint: string }[] = [
  { k: "pointsPer1000", label: "Points gagnés par 1 000 F payés", hint: "Ex. 1 : un séjour de 75 000 F rapporte 75 points." },
  { k: "pointValue", label: "Valeur d'un point (F CFA)", hint: "Ex. 10 : 300 points = 3 000 F de réduction." },
  { k: "referralPoints", label: "Points au parrain par filleul payant", hint: "Donnés quand le filleul paie son premier séjour." },
  { k: "bonusEvery", label: "Bonus tous les … filleuls payants", hint: "Ex. 3 : bonus au 3e, 6e, 9e filleul." },
  { k: "bonusPoints", label: "Points du bonus", hint: "S'ajoutent aux points du filleul." },
  { k: "holdMinutes", label: "Blocage de la chambre pendant le paiement en ligne (minutes)", hint: "Passé ce délai sans paiement, la chambre redevient réservable." },
];

/** Programme fidélité et parrainage des clients de l'hôtel : règles modifiables, meilleurs parrains, points. */
export default function LoyaltyPage() {
  const [conf, setConf] = useState<Conf | null>(null);
  const [rows, setRows] = useState<Customer[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: c }, { data: cu }] = await Promise.all([
      supabase.rpc("loyalty_conf"),
      supabase.from("hotel_customers").select("id, full_name, phone, loyalty_points, referral_code, total_stays, referred_by, referral_rewarded").order("loyalty_points", { ascending: false }).limit(300),
    ]);
    setConf(c as Conf);
    setRows((cu ?? []) as Customer[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conf) return;
    setBusy(true);
    const { error } = await createClient().rpc("set_loyalty_settings", { conf });
    setBusy(false);
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Règles enregistrées : elles s'appliquent aux prochains paiements." });
  };

  const sponsors = rows
    .map((c) => ({ c, total: rows.filter((x) => x.referred_by === c.id).length, paid: rows.filter((x) => x.referred_by === c.id && x.referral_rewarded).length }))
    .filter((s) => s.total > 0)
    .sort((a, b) => b.paid - a.paid || b.total - a.total);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
          <Star aria-hidden className="size-6 text-[#D4A017]" /> Fidélité et parrainage
        </h1>
        <p className="text-sm text-slate-600">
          Chaque client reçoit un lien de parrainage dans son espace. Quand une personne réserve avec ce lien et paie son séjour, le parrain gagne des points, convertibles
          en réduction sur ses prochains séjours.
        </p>
      </div>
      {msg && <p className={cn("rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#B8000F]")}>{msg.text}</p>}

      {!conf ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
      ) : (
        <form onSubmit={save} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <label key={f.k} className="flex flex-col gap-1 text-xs font-bold text-slate-600">
              {f.label}
              <input type="number" min={0} value={conf[f.k]} onChange={(e) => setConf({ ...conf, [f.k]: Number(e.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <span className="font-normal text-slate-500">{f.hint}</span>
            </label>
          ))}
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 self-end justify-self-start rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2 lg:col-span-3">
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />} Enregistrer les règles
          </button>
        </form>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 font-black text-[#0C356A]">
            <Gift aria-hidden className="size-5 text-[#E30613]" /> Meilleurs parrains
          </h2>
          {sponsors.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun parrainage pour le moment.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {sponsors.slice(0, 30).map(({ c, total, paid }) => (
                <li key={c.id} className="flex justify-between gap-2 py-2">
                  <span>
                    <strong>{c.full_name}</strong> <span className="font-mono text-xs text-slate-500">{c.referral_code}</span>
                  </span>
                  <span className="text-xs">
                    {paid} payant(s) / {total} filleul(s) · <strong>{c.loyalty_points ?? 0} pts</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-black text-[#0C356A]">Points des clients</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {rows
              .filter((c) => (c.loyalty_points ?? 0) > 0)
              .slice(0, 30)
              .map((c) => (
                <li key={c.id} className="flex justify-between gap-2 py-2">
                  <span>
                    <strong>{c.full_name}</strong> <span className="text-xs text-slate-500">{c.phone}</span>
                  </span>
                  <span className="text-xs">
                    {c.total_stays ?? 0} séjour(s) · <strong>{c.loyalty_points} pts</strong>
                    {conf ? ` (${new Intl.NumberFormat("fr-FR").format((c.loyalty_points ?? 0) * conf.pointValue)} F)` : ""}
                  </span>
                </li>
              ))}
            {!rows.some((c) => (c.loyalty_points ?? 0) > 0) && <li className="py-2 text-slate-500">Aucun point gagné pour le moment.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
