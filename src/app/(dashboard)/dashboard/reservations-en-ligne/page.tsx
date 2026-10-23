"use client";

import { Banknote, Ban, ExternalLink, Loader2, RefreshCw, Search, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { pingNotifications } from "@/lib/notify";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  booking_ref: string;
  token: string | null;
  created_at: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  room_number: string | null;
  room_type: string | null;
  check_in: string | null;
  check_out: string | null;
  nights_count: number | null;
  guests: number | null;
  total_price: number;
  deposit_paid: number | null;
  payment_status: string | null;
  payment_choice: string | null;
  payment_method: string | null;
  status: string | null;
  hold_until: string | null;
  source: string | null;
  notes: string | null;
};

const F = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ")} F`;
const d = (s: string | null) => (s ? new Date(`${s.slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—");
const TABS = [
  { k: "attente", label: "Paiement en attente" },
  { k: "avenir", label: "Arrivées à venir" },
  { k: "soldees", label: "Soldées" },
  { k: "annulees", label: "Annulées" },
  { k: "toutes", label: "Toutes" },
] as const;

/** Réservations faites sur le site : encaissement à l'arrivée, suivi des paiements en ligne, annulation, reçu. */
export default function OnlineReservationsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["k"]>("attente");
  const [q, setQ] = useState("");
  const [paying, setPaying] = useState<Row | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const canCancel = ["directeur_general", "responsable_hotel", "personnel"].includes(user?.role ?? "");

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from("reservations")
      .select("id, booking_ref, token, created_at, customer_name, customer_phone, customer_email, room_number, room_type, check_in, check_out, nights_count, guests, total_price, deposit_paid, payment_status, payment_choice, payment_method, status, hold_until, source, notes")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data ?? []) as Row[]);
  }, []);

  useEffect(() => {
    load();
    // Nouvelles réservations et paiements en ligne visibles sans recharger
    const ch = createClient()
      .channel("reservations-en-ligne")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => load())
      .subscribe();
    const t = window.setInterval(load, 60_000);
    return () => {
      createClient().removeChannel(ch);
      window.clearInterval(t);
    };
  }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      const cancelled = r.status === "annulée";
      const paid = r.payment_status === "payé";
      const ok =
        tab === "toutes" ||
        (tab === "annulees" && cancelled) ||
        (tab === "soldees" && paid && !cancelled) ||
        (tab === "attente" && !paid && !cancelled) ||
        (tab === "avenir" && !cancelled && (r.check_in ?? "") >= today);
      return ok && (!s || `${r.booking_ref} ${r.customer_name} ${r.customer_phone} ${r.room_number}`.toLowerCase().includes(s));
    });
  }, [rows, tab, q, today]);

  const cancel = async (r: Row) => {
    const reason = window.prompt(`Annuler la réservation ${r.booking_ref} de ${r.customer_name} ?\nLa chambre redevient libre. Motif :`, "Client absent (non présenté)");
    if (reason === null) return;
    const { error } = await createClient().rpc("cancel_reservation", { res: r.id, reason: reason || null });
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: `${r.booking_ref} annulée : la chambre ${r.room_number} est de nouveau libre pour ces dates.` });
    pingNotifications();
    load();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0C356A]">Réservations en ligne</h1>
          <p className="text-sm text-slate-600">
            Réservations faites sur le site (et au comptoir). Chaque chambre réservée est bloquée pour ses dates : personne d&apos;autre ne peut la prendre. Encaissez ici les
            paiements à l&apos;arrivée : le reçu du client passe à « soldé ».
          </p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold ring-1 ring-slate-200">
          <RefreshCw aria-hidden className="size-4" /> Actualiser
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.k} type="button" onClick={() => setTab(t.k)} className={cn("rounded-full px-4 py-2 text-sm font-bold ring-1", tab === t.k ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200")}>
            {t.label}
          </button>
        ))}
        <span className="relative min-w-[14rem] flex-1">
          <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Référence, client, téléphone, chambre" className="w-full rounded-full border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm" />
        </span>
      </div>

      {msg && <p className={cn("rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#B8000F]")}>{msg.text}</p>}

      {rows === null ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Aucune réservation dans cette liste.</p>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {list.map((r) => {
            const paid = Number(r.deposit_paid ?? 0);
            const rest = Math.max(Number(r.total_price) - paid, 0);
            const cancelled = r.status === "annulée";
            const settled = r.payment_status === "payé";
            const holding = r.status === "paiement_en_cours" && r.hold_until && new Date(r.hold_until) > new Date();
            return (
              <article key={r.id} className={cn("flex flex-col gap-3 rounded-3xl border bg-white p-4", cancelled ? "border-slate-200 opacity-70" : settled ? "border-emerald-200" : "border-amber-200")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-black text-[#0C356A]">
                      {r.booking_ref} {r.source === "site" && <span className="ml-1 rounded-full bg-sky-100 px-2 py-0.5 font-sans text-[10px] font-bold text-sky-800">SITE</span>}
                    </p>
                    <p className="font-bold text-slate-900">{r.customer_name}</p>
                    <p className="text-xs text-slate-500">
                      {r.customer_phone} {r.customer_email ? `· ${r.customer_email}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      cancelled ? "bg-slate-200 text-slate-600" : settled ? "bg-emerald-100 text-emerald-800" : holding ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-900",
                    )}
                  >
                    {cancelled ? "Annulée" : settled ? "Soldée" : holding ? "Paiement en ligne en cours" : paid > 0 ? "Paiement partiel" : r.payment_choice === "en_ligne" ? "Paiement en ligne non abouti" : "Paiement à l'arrivée"}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-2">
                    <dt className="text-[11px] text-slate-500">Chambre</dt>
                    <dd className="font-bold">
                      {r.room_number} · {r.room_type}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    <dt className="text-[11px] text-slate-500">Séjour</dt>
                    <dd className="font-bold">
                      {d(r.check_in)} → {d(r.check_out)}
                    </dd>
                    <dd className="text-[11px] text-slate-500">
                      {r.nights_count} nuit(s) · {r.guests ?? "?"} pers.
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    <dt className="text-[11px] text-slate-500">Total · payé</dt>
                    <dd className="font-bold">{F(Number(r.total_price))}</dd>
                    <dd className="text-[11px] text-emerald-700">{F(paid)} payé</dd>
                  </div>
                  <div className={cn("rounded-xl p-2", rest > 0 && !cancelled ? "bg-amber-50" : "bg-emerald-50")}>
                    <dt className="text-[11px] text-slate-500">Reste à payer</dt>
                    <dd className={cn("font-black", rest > 0 && !cancelled ? "text-[#B8000F]" : "text-emerald-700")}>{F(rest)}</dd>
                  </div>
                </dl>
                {r.notes && <p className="rounded-xl bg-slate-50 p-2 text-xs text-slate-600">{r.notes}</p>}
                <div className="flex flex-wrap gap-2">
                  {!cancelled && rest > 0 && (
                    <button type="button" onClick={() => setPaying(r)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
                      <Banknote aria-hidden className="size-4" /> Encaisser
                    </button>
                  )}
                  {r.token && (
                    <Link href={`/reservation/${r.token}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-[#0C356A]/30">
                      <ExternalLink aria-hidden className="size-4" /> Reçu
                    </Link>
                  )}
                  {!cancelled && !settled && canCancel && (
                    <button type="button" onClick={() => cancel(r)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-[#B8000F] ring-1 ring-red-200">
                      <Ban aria-hidden className="size-4" /> Annuler
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {paying && (
        <PayModal
          row={paying}
          onClose={() => setPaying(null)}
          onDone={(text) => {
            setPaying(null);
            setMsg({ ok: true, text });
            pingNotifications();
            load();
          }}
        />
      )}
    </div>
  );
}

/** Encaissement au comptoir : montant (solde par défaut) et moyen de paiement. */
function PayModal({ row, onClose, onDone }: { row: Row; onClose: () => void; onDone: (text: string) => void }) {
  const rest = Math.max(Number(row.total_price) - Number(row.deposit_paid ?? 0), 0);
  const [amount, setAmount] = useState(String(rest));
  const [method, setMethod] = useState("especes");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Math.round(Number(amount));
    if (!n || n <= 0) return setError("Montant invalide");
    if (n > rest && !window.confirm(`Le montant dépasse le reste à payer (${F(rest)}). Continuer ?`)) return;
    setBusy(true);
    const { data, error: err } = await createClient().rpc("record_reservation_payment", { res: row.id, amount: n, method, note: note || null });
    setBusy(false);
    if (err) return setError(err.message);
    const full = (data as { full?: boolean } | null)?.full;
    onDone(`${F(n)} encaissés pour ${row.booking_ref}. ${full ? "Séjour soldé : le reçu du client indique « SOLDÉ »." : `Reste ${F(rest - n)}.`}`);
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-sm font-black text-[#0C356A]">{row.booking_ref}</p>
            <p className="text-lg font-bold">Encaisser · {row.customer_name}</p>
            <p className="text-sm text-slate-500">Reste à payer : {F(rest)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-1 hover:bg-slate-100">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
          Montant reçu (F CFA)
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-lg font-bold" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
          Moyen de paiement
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5">
            <option value="especes">Espèces</option>
            <option value="mobile_money">Mobile Money (Yas / Moov) au comptoir</option>
            <option value="carte">Carte bancaire (TPE)</option>
            <option value="virement">Virement</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
          Référence ou remarque (facultatif)
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="N° de transaction Mobile Money…" className="rounded-xl border border-slate-200 px-3 py-2.5" />
        </label>
        {error && <p className="text-sm font-semibold text-[#B8000F]">{error}</p>}
        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-60">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Banknote aria-hidden className="size-4" />} Enregistrer l&apos;encaissement
        </button>
      </form>
    </div>
  );
}
