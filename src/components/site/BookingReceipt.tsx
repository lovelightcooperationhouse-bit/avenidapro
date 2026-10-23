"use client";

import { CheckCircle2, Clock, CreditCard, Loader2, Smartphone, XCircle } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { DocumentToolbar } from "@/components/cards/DocumentToolbar";
import { siteConfig } from "@/content/site";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Receipt = {
  id: string;
  ref: string;
  token: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_choice: string | null;
  payment_method: string | null;
  paid_at: string | null;
  hold_expired: boolean;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  nationality: string | null;
  room_number: string;
  room_name: string;
  room_image: string | null;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number | null;
  nightly_rate: number;
  discount: number;
  points_used: number;
  total: number;
  paid: number;
  remaining: number;
  message: string | null;
  payments: { date: string; amount: number; method: string; ref: string | null }[];
};

const F = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ")} F CFA`;
const d = (s: string | null) => (s ? new Date(s.length === 10 ? `${s}T12:00:00` : s).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—");
const METHOD: Record<string, string> = { carte: "Carte bancaire", yas: "Mixx by Yas", moov: "Moov Money", especes: "Espèces", mobile_money: "Mobile Money", virement: "Virement" };

/** Reçu de réservation : état du paiement en clair, paiement en ligne possible tant que le séjour n'est pas soldé. */
export function BookingReceipt({ token, methods }: { token: string; methods: Record<"carte" | "yas" | "moov", boolean> }) {
  const [r, setR] = useState<Receipt | null | undefined>(undefined);
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const load = () =>
      createClient()
        .rpc("booking_receipt", { t: token })
        .then(({ data }) => setR((data as Receipt) ?? null));
    load();
    QRCode.toDataURL(`${window.location.origin}/reservation/${token}`, { margin: 0, width: 220 }).then(setQr);
    const state = new URLSearchParams(window.location.search).get("paiement");
    setNotice(
      state === "ok"
        ? "Paiement confirmé : merci ! Votre reçu est à jour."
        : state === "en_cours"
          ? "Paiement en cours de confirmation par l'opérateur. Cette page se met à jour automatiquement."
          : state === "echec"
            ? "Le paiement n'a pas abouti. Vous pouvez réessayer ou payer à votre arrivée."
            : state === "annule"
              ? "Paiement interrompu. Votre réservation est gardée : réessayez ou payez à l'arrivée."
              : state === "indisponible"
                ? "Réservation enregistrée, mais le paiement en ligne n'a pas pu démarrer. Réessayez ci-dessous ou payez à l'arrivée."
                : "",
    );
    // Paiement mobile parfois confirmé avec quelques secondes de retard
    if (state === "en_cours") {
      const t = window.setInterval(load, 8000);
      return () => window.clearInterval(t);
    }
  }, [token]);

  const pay = useCallback(
    async (method: "carte" | "yas" | "moov") => {
      setBusy(method);
      setError("");
      const res = await fetch("/api/reservations/payer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, method }) }).catch(() => null);
      const j = res ? ((await res.json().catch(() => ({}))) as { url?: string; error?: string }) : { error: "Connexion impossible." };
      if (j.url) return void (window.location.href = j.url);
      setBusy("");
      setError(j.error ?? "Paiement impossible.");
    },
    [token],
  );

  // Arrivée depuis la réservation avec « payer maintenant » : la page de paiement s'ouvre d'elle-même
  const autoPay = useRef(false);
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("payer");
    if (!r || autoPay.current || r.payment_status === "payé" || r.status === "annulée" || (m !== "carte" && m !== "yas" && m !== "moov")) return;
    autoPay.current = true;
    pay(m);
  }, [r, pay]);

  // Bouton « Payer maintenant » placé à côté du bouton « Retour » de l'application installée
  const [standalone, setStandalone] = useState(false);
  const [highlight, setHighlight] = useState(false);
  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || !!(navigator as unknown as { standalone?: boolean }).standalone);
  }, []);
  const goPay = useCallback(() => {
    document.getElementById("payer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlight(true);
    window.setTimeout(() => setHighlight(false), 2500);
  }, []);
  // Arrivée depuis « Mes réservations » → « Payer » : on montre directement les moyens de paiement
  useEffect(() => {
    if (r && r.payment_status !== "payé" && r.status !== "annulée" && new URLSearchParams(window.location.search).get("payer") === "choisir") goPay();
  }, [r, goPay]);

  if (r === undefined) return <div className="flex min-h-dvh items-center justify-center"><Loader2 aria-label="Chargement" className="size-8 animate-spin text-avenida-blue" /></div>;
  if (!r) return <p className="mx-auto mt-20 max-w-md rounded-2xl bg-amber-50 p-6 text-center text-amber-900">Réservation introuvable. Vérifiez le lien reçu par e-mail.</p>;

  const cancelled = r.status === "annulée";
  const settled = r.payment_status === "payé";
  const state = cancelled
    ? { label: "RÉSERVATION ANNULÉE", tone: "border-slate-500 text-slate-600", icon: XCircle }
    : settled
      ? { label: "SOLDÉ", tone: "border-emerald-600 text-emerald-700", icon: CheckCircle2 }
      : r.paid > 0
        ? { label: "PAIEMENT PARTIEL", tone: "border-amber-600 text-amber-700", icon: Clock }
        : { label: r.payment_choice === "en_ligne" && !r.hold_expired ? "PAIEMENT EN COURS" : "PAIEMENT EN ATTENTE", tone: "border-amber-600 text-amber-700", icon: Clock };
  const anyOnline = methods.carte || methods.yas || methods.moov;

  return (
    <main className="min-h-dvh bg-slate-100 px-3 py-6 print:bg-white print:p-0">
      <div className="mx-auto flex max-w-[210mm] flex-col gap-4">
        {notice && <p className={cn("rounded-2xl p-4 text-sm font-semibold print:hidden", notice.startsWith("Paiement confirmé") ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900")}>{notice}</p>}
        <DocumentToolbar elementId="recu-reservation" fileName={`Reservation-${r.ref}`} />

        {!cancelled && !settled && (
          <section id="payer" className={cn("scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm transition-shadow print:hidden", highlight && "ring-4 ring-vif/60")}>
            <p className="font-display text-lg font-extrabold text-avenida-blue-950">Reste à payer : {F(r.remaining)}</p>
            <p className="text-sm text-slate-600">
              {r.payment_choice === "arrivee"
                ? "Vous avez choisi de payer à l'arrivée. Vous avez changé d'avis ? Payez maintenant en ligne : votre séjour sera soldé et votre chambre confirmée."
                : "Réglez maintenant en ligne, ou à votre arrivée à la réception."}{" "}
              Le reçu se met à jour dès le paiement.
            </p>
            {!anyOnline && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">Le paiement en ligne sera bientôt disponible : en attendant, réglez à la réception.</p>}
            {anyOnline && (
              <div className="mt-3 flex flex-wrap gap-2">
                {methods.carte && (
                  <button type="button" disabled={!!busy} onClick={() => pay("carte")} className="inline-flex items-center gap-2 rounded-full bg-avenida-blue px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                    {busy === "carte" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <CreditCard aria-hidden className="size-4" />} Carte bancaire
                  </button>
                )}
                {methods.yas && (
                  <button type="button" disabled={!!busy} onClick={() => pay("yas")} className="inline-flex items-center gap-2 rounded-full bg-[#FFCC00] px-5 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-60">
                    {busy === "yas" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Smartphone aria-hidden className="size-4" />} Mixx by Yas
                  </button>
                )}
                {methods.moov && (
                  <button type="button" disabled={!!busy} onClick={() => pay("moov")} className="inline-flex items-center gap-2 rounded-full bg-[#0066B3] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                    {busy === "moov" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Smartphone aria-hidden className="size-4" />} Moov Money
                  </button>
                )}
              </div>
            )}
            {error && <p role="alert" className="mt-2 text-sm font-semibold text-vif">{error}</p>}
          </section>
        )}

        {!cancelled && !settled && (
          <button
            type="button"
            onClick={goPay}
            className={cn(
              "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] z-[150] inline-flex items-center gap-1.5 rounded-full bg-vif px-4 py-2.5 text-sm font-bold text-white shadow-xl ring-2 ring-white/80 active:scale-95 print:hidden",
              standalone ? "left-[8.5rem]" : "left-4",
            )}
          >
            <CreditCard aria-hidden className="size-5" /> Payer maintenant
          </button>
        )}

        <article id="recu-reservation" className="relative flex min-h-[260mm] flex-col bg-white p-[12mm] text-[12px] text-slate-800 shadow-xl print:shadow-none">
          <header className="flex items-start justify-between gap-4 border-b-4 border-vif pb-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- logo officiel */}
              <img src="/logo-avenida.png" alt="Hôtel École Avenida" className="h-16 w-auto" />
              <div>
                <p className="font-serif text-lg font-bold text-avenida-blue-950">HÔTEL ÉCOLE <span className="text-vif">AVENIDA</span></p>
                <p className="text-[10px] text-slate-500">{siteConfig.address.street} · {siteConfig.address.city}</p>
                <p className="text-[10px] text-slate-500">{siteConfig.phones.map((p) => p.display).join(" · ")} · {siteConfig.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{settled ? "Reçu de paiement" : "Bon de réservation"}</p>
              <p className="font-mono text-xl font-black text-avenida-blue-950">{r.ref}</p>
              <p className="text-[10px] text-slate-500">Émis le {d(r.created_at)}</p>
            </div>
          </header>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Client</p>
              <p className="text-base font-bold">{r.customer_name}</p>
              <p>{r.customer_phone}</p>
              {r.customer_email && <p>{r.customer_email}</p>}
              {r.nationality && <p>Nationalité : {r.nationality}</p>}
            </div>
            <p className={cn("flex rotate-[-4deg] items-center gap-2 rounded-xl border-4 px-4 py-2 text-lg font-black tracking-wider", state.tone)}>
              <state.icon aria-hidden className="size-6" /> {state.label}
            </p>
          </div>

          <section className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[9rem_1fr]">
            {r.room_image ? (
              // eslint-disable-next-line @next/next/no-img-element -- photo de la chambre
              <img src={r.room_image} alt={r.room_name} className="aspect-[4/3] w-full rounded-xl object-cover" />
            ) : (
              <span />
            )}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <dt className="text-slate-500">Chambre</dt>
              <dd className="font-bold">
                {r.room_name} · réf. {r.room_number}
              </dd>
              <dt className="text-slate-500">Arrivée</dt>
              <dd className="font-bold">{d(r.check_in)} (à partir de 14 h)</dd>
              <dt className="text-slate-500">Départ</dt>
              <dd className="font-bold">{d(r.check_out)} (avant 12 h)</dd>
              <dt className="text-slate-500">Durée</dt>
              <dd className="font-bold">
                {r.nights} nuit{r.nights > 1 ? "s" : ""} · {r.guests ?? 1} personne(s)
              </dd>
              <dt className="text-slate-500">Paiement choisi</dt>
              <dd className="font-bold">{r.payment_choice === "en_ligne" ? `En ligne (${r.payment_method ?? ""})` : "À l'arrivée (réservation simple)"}</dd>
            </dl>
          </section>

          <table className="mt-5 w-full border-collapse">
            <thead>
              <tr className="bg-avenida-blue-950 text-left text-white">
                <th className="p-2">Désignation</th>
                <th className="p-2 text-right">Prix / nuit</th>
                <th className="p-2 text-center">Nuits</th>
                <th className="p-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2">Hébergement · {r.room_name} (réf. {r.room_number})</td>
                <td className="p-2 text-right">{F(r.nightly_rate)}</td>
                <td className="p-2 text-center">{r.nights}</td>
                <td className="p-2 text-right">{F(r.nightly_rate * r.nights)}</td>
              </tr>
              {r.discount > 0 && (
                <tr className="border-b border-slate-200 text-emerald-700">
                  <td className="p-2" colSpan={3}>
                    Réduction fidélité ({r.points_used} points)
                  </td>
                  <td className="p-2 text-right">−{F(r.discount)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="p-2 text-right" colSpan={3}>
                  Total du séjour
                </td>
                <td className="p-2 text-right">{F(r.total)}</td>
              </tr>
              <tr className="text-emerald-700">
                <td className="p-2 text-right" colSpan={3}>
                  Déjà payé
                </td>
                <td className="p-2 text-right font-bold">{F(r.paid)}</td>
              </tr>
              <tr className="text-base font-black">
                <td className="p-2 text-right" colSpan={3}>
                  Reste à payer
                </td>
                <td className={cn("p-2 text-right", r.remaining > 0 ? "text-vif" : "text-emerald-700")}>{F(r.remaining)}</td>
              </tr>
            </tfoot>
          </table>

          {r.payments.length > 0 && (
            <section className="mt-4">
              <p className="mb-1 text-[10px] font-bold text-slate-500 uppercase">Paiements reçus</p>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {r.payments.map((p, i) => (
                  <li key={i} className="flex justify-between gap-2 p-2">
                    <span>
                      {d(p.date)} · {METHOD[p.method] ?? p.method}
                      {p.ref ? <span className="text-slate-400"> · réf. {p.ref}</span> : null}
                    </span>
                    <strong>{F(p.amount)}</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {r.message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px]">Vos précisions : {r.message}</p>}

          <div className="mt-auto flex items-end justify-between gap-4 pt-8">
            <div className="max-w-md text-[10px] leading-relaxed text-slate-500">
              <p>Présentez ce document (papier ou téléphone) à la réception. {settled ? "Votre séjour est entièrement réglé." : "Le solde est à régler au plus tard à l'arrivée."}</p>
              <p>Annulation ou modification : contactez la réception au {siteConfig.phones[0]?.display}.</p>
            </div>
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- QR code de vérification */}
              {qr && <img src={qr} alt="QR code de la réservation" className="size-[24mm]" />}
              <span className="mt-0.5 text-[9px] text-slate-500">Vérifier en ligne</span>
            </div>
          </div>
        </article>

        <p className="text-center text-sm text-slate-600 print:hidden">
          Retrouvez toutes vos réservations, vos points fidélité et votre lien de parrainage dans{" "}
          <Link href="/espace/reservations" className="font-bold text-avenida-blue underline">
            votre espace client
          </Link>{" "}
          (connectez-vous ou créez votre compte avec la même adresse e-mail).
        </p>
      </div>
    </main>
  );
}
