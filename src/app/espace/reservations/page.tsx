"use client";

import { BedDouble, Copy, Gift, Loader2, MessageCircle, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MyHotel = {
  customer_id: string | null;
  name: string;
  points: number;
  point_value: number;
  conf: { pointsPer1000: number; referralPoints: number; bonusEvery: number; bonusPoints: number };
  referral_code: string | null;
  referrals: number;
  referrals_paid: number;
  reservations: { ref: string; token: string; room: string; room_number: string; check_in: string; check_out: string; total: number; paid: number; status: string; payment_status: string }[];
};

const F = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ")} F`;
const d = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/** Espace client de l'hôtel : réservations et reçus, points fidélité, lien de parrainage. */
export default function MyReservationsPage() {
  const [me, setMe] = useState<MyHotel | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    createClient()
      .rpc("my_hotel")
      .then(({ data }) => setMe((data as MyHotel) ?? null));
  }, []);

  if (me === undefined) return <Loader2 aria-label="Chargement" className="size-8 animate-spin text-avenida-blue" />;
  if (!me) return <p className="rounded-2xl bg-amber-50 p-6 text-amber-900">Impossible de charger vos réservations.</p>;

  const link = me.referral_code && typeof window !== "undefined" ? `${window.location.origin}/hotel?parrain=${me.referral_code}#reserver` : "";
  const toNextBonus = me.conf.bonusEvery - (me.referrals_paid % me.conf.bonusEvery);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-avenida-blue-950">Mes réservations</h1>
        <Link href="/hotel#reserver" className="inline-flex items-center gap-2 rounded-full bg-vif px-5 py-2.5 text-sm font-bold text-white hover:bg-vif-fonce">
          <BedDouble aria-hidden className="size-4" /> Réserver une chambre
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col gap-2 rounded-3xl bg-[image:linear-gradient(130deg,#06152E,#0C356A)] p-6 text-white">
          <p className="flex items-center gap-2 text-sm font-bold text-white/80">
            <Star aria-hidden className="size-4 text-[#F2C94C]" /> Mes points fidélité
          </p>
          <p className="font-display text-4xl font-extrabold">{me.points}</p>
          <p className="text-sm text-white/80">
            Valeur : <strong className="text-white">{F(me.points * me.point_value)}</strong> de réduction sur votre prochain séjour (cochez « utiliser mes points » en réservant).
          </p>
          <p className="text-xs text-white/60">Vous gagnez {me.conf.pointsPer1000} point(s) par tranche de 1 000 F payés.</p>
        </section>

        <section className="flex flex-col gap-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
          <p className="flex items-center gap-2 text-sm font-bold text-vif">
            <Gift aria-hidden className="size-4" /> Parrainez vos proches
          </p>
          {me.referral_code ? (
            <>
              <p className="text-sm text-slate-700">
                Pour chaque personne qui réserve avec votre lien et paie son séjour : <strong>+{me.conf.referralPoints} points</strong>. Tous les {me.conf.bonusEvery} filleuls payants : bonus de{" "}
                <strong>{me.conf.bonusPoints} points</strong>.
              </p>
              <p className="rounded-xl bg-slate-50 p-3 font-mono text-sm break-all">{link}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(link).then(() => setCopied(true))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-avenida-blue px-4 py-2 text-sm font-bold text-white"
                >
                  <Copy aria-hidden className="size-4" /> {copied ? "Lien copié" : "Copier le lien"}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Réservez votre chambre à l'Hôtel École Avenida (Lomé) avec mon lien : ${link}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white"
                >
                  <MessageCircle aria-hidden className="size-4" /> Partager sur WhatsApp
                </a>
              </div>
              <p className="text-xs text-slate-500">
                Code : <strong>{me.referral_code}</strong> · {me.referrals} filleul(s), dont {me.referrals_paid} ayant payé · encore {toNextBonus} filleul(s) payant(s) avant le prochain bonus.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-600">Votre lien de parrainage apparaît après votre première réservation avec cette adresse e-mail.</p>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <h2 className="font-display text-lg font-extrabold text-avenida-blue-950">Historique et reçus</h2>
        {me.reservations.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune réservation pour le moment.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {me.reservations.map((r) => {
              const paid = r.payment_status === "payé";
              const cancelled = r.status === "annulée";
              return (
                <li key={r.ref} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <strong className="font-mono">{r.ref}</strong> · {r.room} (réf. {r.room_number})
                    <span className="block text-xs text-slate-500">
                      {d(r.check_in)} → {d(r.check_out)} · {F(r.total)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={cn("rounded-full px-3 py-1 text-xs font-bold", cancelled ? "bg-slate-200 text-slate-600" : paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900")}>
                      {cancelled ? "Annulée" : paid ? "Soldée" : r.paid > 0 ? `Reste ${F(r.total - r.paid)}` : "Paiement en attente"}
                    </span>
                    <Link href={`/reservation/${r.token}`} className="rounded-full px-3 py-1 text-xs font-bold text-avenida-blue ring-1 ring-avenida-blue/30">
                      Reçu
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
