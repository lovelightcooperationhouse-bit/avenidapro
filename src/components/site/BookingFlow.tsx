"use client";

import { ArrowLeft, BedDouble, CalendarDays, Check, ChevronLeft, ChevronRight, CreditCard, Gift, Images, Loader2, ShieldCheck, Smartphone, Users, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type PublicRoom = { id: string; ref: string; name: string; category: string | null; description: string | null; images: { url: string; alt?: string }[]; capacity: number; amenities: string[]; price: number; floor: number | null; available: boolean };
type Method = "arrivee" | "carte" | "yas" | "moov";

const F = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ")} F CFA`;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => iso(new Date(new Date(`${s}T12:00:00`).getTime() + n * 86_400_000));
const nightsBetween = (a: string, b: string) => (a && b ? Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86_400_000) : 0);
const frDate = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
const field = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-avenida-blue focus:ring-2 focus:ring-avenida-blue/20";

/**
 * Réservation en ligne à la manière des grands sites : dates → chambres disponibles (photos, référence, prix)
 * → détail de la chambre → coordonnées et paiement (à l'arrivée, carte, Mixx by Yas, Moov Money) → reçu.
 */
export function BookingFlow({ methods }: { methods: Record<"carte" | "yas" | "moov", boolean> }) {
  const today = iso(new Date());
  const [stay, setStay] = useState({ check_in: "", check_out: "", guests: 2 });
  const [rooms, setRooms] = useState<PublicRoom[] | null>(null);
  const [viewing, setViewing] = useState<PublicRoom | null>(null);
  const [chosen, setChosen] = useState<PublicRoom | null>(null);
  const nights = nightsBetween(stay.check_in, stay.check_out);
  const datesOk = !!stay.check_in && nights > 0;

  const load = useCallback(async () => {
    const { data } = await createClient().rpc("public_rooms", datesOk ? { p_in: stay.check_in, p_out: stay.check_out } : {});
    setRooms((data ?? []) as PublicRoom[]);
  }, [datesOk, stay.check_in, stay.check_out]);

  useEffect(() => {
    load();
  }, [load]);

  // Lien de parrainage (?parrain=…) gardé sur l'appareil jusqu'à la réservation
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get("parrain");
      if (code) localStorage.setItem("avenida_parrain", code.toUpperCase());
    } catch {
      // stockage indisponible
    }
  }, []);

  const list = useMemo(
    () => (rooms ?? []).slice().sort((a, b) => Number(b.available && b.capacity >= stay.guests) - Number(a.available && a.capacity >= stay.guests) || a.price - b.price),
    [rooms, stay.guests],
  );
  const freeCount = list.filter((r) => r.available && r.capacity >= stay.guests).length;

  const choose = (r: PublicRoom) => {
    setViewing(null);
    setChosen(r);
    requestAnimationFrame(() => document.getElementById("reserver")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  if (chosen && datesOk) return <Checkout room={chosen} stay={stay} nights={nights} methods={methods} onBack={() => setChosen(null)} />;

  return (
    <div className="flex flex-col gap-6">
      {/* Barre de recherche */}
      <div className="grid gap-3 rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-900/5 sm:grid-cols-[1fr_1fr_auto] sm:p-5 lg:grid-cols-[1fr_1fr_10rem_auto]">
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1">
            <CalendarDays aria-hidden className="size-3.5" /> Arrivée
          </span>
          <input type="date" min={today} value={stay.check_in} onChange={(e) => setStay((s) => ({ ...s, check_in: e.target.value, check_out: s.check_out && s.check_out > e.target.value ? s.check_out : addDays(e.target.value, 1) }))} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1">
            <CalendarDays aria-hidden className="size-3.5" /> Départ
          </span>
          <input type="date" min={stay.check_in ? addDays(stay.check_in, 1) : today} value={stay.check_out} onChange={(e) => setStay((s) => ({ ...s, check_out: e.target.value }))} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1">
            <Users aria-hidden className="size-3.5" /> Personnes
          </span>
          <select value={stay.guests} onChange={(e) => setStay((s) => ({ ...s, guests: Number(e.target.value) }))} className={field}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} personne{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
        <p className="flex items-end text-sm font-semibold text-slate-600 sm:col-span-3 lg:col-span-1">
          {datesOk ? (
            <span className="rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800">
              {nights} nuit{nights > 1 ? "s" : ""} · {freeCount} chambre{freeCount > 1 ? "s" : ""} libre{freeCount > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">Choisissez vos dates pour voir les disponibilités</span>
          )}
        </p>
      </div>

      {/* Chambres */}
      {rooms === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-96 animate-pulse rounded-3xl bg-slate-200" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-3xl bg-white p-8 text-center text-slate-600 shadow">Les chambres seront bientôt réservables en ligne. Appelez la réception pour réserver.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => {
            const tooSmall = r.capacity < stay.guests;
            const free = r.available && !tooSmall;
            return (
              <li key={r.id} className={cn("group flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-900/5 transition-all", free ? "hover:-translate-y-1 hover:shadow-2xl" : "opacity-70")}>
                <button type="button" onClick={() => setViewing(r)} className="relative block aspect-[4/3] overflow-hidden bg-slate-100 text-left" aria-label={`Voir les photos de la chambre ${r.ref}`}>
                  {r.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- photos gérées dans l'espace de gestion
                    <img src={r.images[0].url} alt={r.images[0].alt || r.name} className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <BedDouble aria-hidden className="absolute inset-0 m-auto size-12 text-slate-300" />
                  )}
                  <span className="absolute top-3 left-3 rounded-full bg-avenida-blue-950/85 px-3 py-1 text-xs font-bold text-white">Réf. {r.ref}</span>
                  {r.images.length > 1 && (
                    <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-800">
                      <Images aria-hidden className="size-3.5" /> {r.images.length} photos
                    </span>
                  )}
                  <span className={cn("absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold", !datesOk ? "bg-white/90 text-slate-700" : free ? "bg-emerald-500 text-white" : "bg-slate-800 text-white")}>
                    {!datesOk ? "Choisissez vos dates" : r.available ? (tooSmall ? `${r.capacity} pers. max` : "Disponible") : "Déjà réservée"}
                  </span>
                </button>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="font-display text-xl font-bold text-avenida-blue-950">{r.name}</h3>
                  <p className="flex flex-wrap gap-x-3 text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Users aria-hidden className="size-3.5" /> {r.capacity} pers.
                    </span>
                    {r.floor !== null && <span>Étage {r.floor}</span>}
                    {r.category && r.category !== r.name && <span>{r.category}</span>}
                  </p>
                  {r.amenities.length > 0 && (
                    <ul className="flex flex-wrap gap-1">
                      {r.amenities.slice(0, 5).map((a) => (
                        <li key={a} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <p>
                      <span className="block text-2xl font-extrabold text-avenida-blue-950">{F(r.price)}</span>
                      <span className="text-xs text-slate-500">par nuit{datesOk ? ` · ${nights} nuit(s) : ${F(r.price * nights)}` : ""}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setViewing(r)} className="rounded-full px-3 py-2.5 text-sm font-bold text-avenida-blue ring-1 ring-avenida-blue/30 hover:bg-avenida-blue/5">
                      Voir la chambre
                    </button>
                    <button
                      type="button"
                      disabled={!free || !datesOk}
                      onClick={() => choose(r)}
                      title={!datesOk ? "Choisissez d'abord vos dates" : undefined}
                      className="rounded-full bg-vif px-3 py-2.5 text-sm font-bold text-white hover:bg-vif-fonce disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Choisir
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {viewing && <RoomViewer room={viewing} stay={stay} nights={nights} datesOk={datesOk} onClose={() => setViewing(null)} onChoose={() => choose(viewing)} />}
    </div>
  );
}

/** Fiche de la chambre : toutes les photos en grand, description, équipements, prix du séjour. */
function RoomViewer({ room, stay, nights, datesOk, onClose, onChoose }: { room: PublicRoom; stay: { guests: number }; nights: number; datesOk: boolean; onClose: () => void; onChoose: () => void }) {
  const [i, setI] = useState(0);
  const imgs = room.images.length ? room.images : [{ url: "", alt: "" }];
  const free = room.available && room.capacity >= stay.guests;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((x) => (x + 1) % imgs.length);
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + imgs.length) % imgs.length);
    };
    window.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = "";
    };
  }, [imgs.length, onClose]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Chambre ${room.ref}`} className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 p-2 sm:p-6" onClick={onClose}>
      <div className="flex max-h-[96dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-[16/10] w-full shrink-0 bg-slate-900 sm:aspect-[16/9]">
          {imgs[i].url ? (
            // eslint-disable-next-line @next/next/no-img-element -- photos gérées dans l'espace de gestion
            <img src={imgs[i].url} alt={imgs[i].alt || room.name} className="size-full object-contain" />
          ) : (
            <BedDouble aria-hidden className="absolute inset-0 m-auto size-16 text-slate-600" />
          )}
          <button type="button" onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-slate-900">
            <X aria-hidden className="size-5" />
          </button>
          {imgs.length > 1 && (
            <>
              <button type="button" onClick={() => setI((i - 1 + imgs.length) % imgs.length)} aria-label="Photo précédente" className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 p-2">
                <ChevronLeft aria-hidden className="size-5" />
              </button>
              <button type="button" onClick={() => setI((i + 1) % imgs.length)} aria-label="Photo suivante" className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 p-2">
                <ChevronRight aria-hidden className="size-5" />
              </button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
                {i + 1} / {imgs.length}
              </span>
            </>
          )}
        </div>
        {imgs.length > 1 && (
          <div className="flex shrink-0 gap-2 overflow-x-auto bg-slate-50 p-2">
            {imgs.map((m, k) => (
              <button key={m.url + k} type="button" onClick={() => setI(k)} aria-label={`Photo ${k + 1}`} className={cn("h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2", k === i ? "ring-vif" : "ring-transparent")}>
                {/* eslint-disable-next-line @next/next/no-img-element -- vignette */}
                <img src={m.url} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-3 overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-wider text-vif uppercase">Chambre réf. {room.ref}</p>
              <h3 className="font-display text-2xl font-extrabold text-avenida-blue-950">{room.name}</h3>
              <p className="text-sm text-slate-500">
                Jusqu&apos;à {room.capacity} personne(s){room.floor !== null ? ` · étage ${room.floor}` : ""}
              </p>
            </div>
            <p className="text-right">
              <span className="block text-2xl font-extrabold text-avenida-blue-950">{F(room.price)}</span>
              <span className="text-xs text-slate-500">par nuit{datesOk ? ` · total ${nights} nuit(s) : ${F(room.price * nights)}` : ""}</span>
            </p>
          </div>
          {room.description && <p className="text-sm leading-relaxed text-slate-700">{room.description}</p>}
          {room.amenities.length > 0 && (
            <ul className="grid grid-cols-2 gap-1.5 text-sm text-slate-700 sm:grid-cols-3">
              {room.amenities.map((a) => (
                <li key={a} className="flex items-center gap-1.5">
                  <Check aria-hidden className="size-4 text-emerald-600" /> {a}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            disabled={!free || !datesOk}
            onClick={onChoose}
            className="mt-2 rounded-full bg-vif px-6 py-3.5 font-bold text-white hover:bg-vif-fonce disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {!datesOk ? "Choisissez vos dates d'abord" : free ? "Je prends cette chambre" : room.available ? `Trop petite pour ${stay.guests} personnes` : "Déjà réservée pour ces dates"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Coordonnées, parrainage, points et mode de paiement, avec le récapitulatif du séjour. */
function Checkout({ room, stay, nights, methods, onBack }: { room: PublicRoom; stay: { check_in: string; check_out: string; guests: number }; nights: number; methods: Record<"carte" | "yas" | "moov", boolean>; onBack: () => void }) {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", nationality: "", message: "", referral: "", site_web: "" });
  const [payment, setPayment] = useState<Method>("arrivee");
  const [me, setMe] = useState<{ points: number; point_value: number; name: string } | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = room.price * nights;
  const discount = usePoints && me ? Math.min(me.points * me.point_value, total) : 0;
  const due = total - discount;
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    // Code de parrainage reçu par lien (?parrain=…) ; client connecté : nom, e-mail et points
    try {
      const code = new URLSearchParams(window.location.search).get("parrain") ?? localStorage.getItem("avenida_parrain");
      if (code) setForm((f) => ({ ...f, referral: code.toUpperCase() }));
    } catch {
      // stockage indisponible
    }
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("first_name, last_name, phone, email").eq("id", user.id).maybeSingle();
      if (p) setForm((f) => ({ ...f, full_name: f.full_name || [p.first_name, p.last_name].filter(Boolean).join(" "), phone: f.phone || p.phone || "", email: f.email || p.email || "" }));
      const { data } = await supabase.rpc("my_hotel");
      if (data) setMe(data as { points: number; point_value: number; name: string });
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, room_id: room.id, check_in: stay.check_in, check_out: stay.check_out, guests: stay.guests, payment, use_points: usePoints }),
    }).catch(() => null);
    const j = res ? ((await res.json().catch(() => ({}))) as { error?: string; token?: string; url?: string; paymentError?: string }) : { error: "Connexion impossible : vérifiez votre réseau." };
    if (!res?.ok || !j.token) {
      setBusy(false);
      return setError(j.error ?? "La réservation a échoué.");
    }
    window.location.href = j.url ?? `/reservation/${j.token}${j.paymentError ? `?paiement=indisponible` : ""}`;
  };

  const PAY: { k: Method; label: string; hint: string; icon: typeof Wallet; on: boolean }[] = [
    { k: "arrivee", label: "Payer à l'arrivée", hint: "Réservation simple : vous réglez à la réception (espèces, Mobile Money, carte).", icon: Wallet, on: true },
    { k: "carte", label: "Carte bancaire", hint: "Visa, Mastercard : paiement sécurisé immédiat.", icon: CreditCard, on: methods.carte },
    { k: "yas", label: "Mixx by Yas", hint: "Paiement mobile Yas (T-Money).", icon: Smartphone, on: methods.yas },
    { k: "moov", label: "Moov Money", hint: "Paiement mobile Moov (Flooz).", icon: Smartphone, on: methods.moov },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <form onSubmit={submit} className="flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-900/5 sm:p-7" noValidate>
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 self-start text-sm font-bold text-avenida-blue hover:text-vif">
          <ArrowLeft aria-hidden className="size-4" /> Changer de chambre
        </button>
        <h3 className="font-display text-2xl font-extrabold text-avenida-blue-950">Vos coordonnées</h3>
        <input type="text" name="site_web" value={form.site_web} onChange={(e) => set("site_web", e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
            Nom et prénoms *
            <input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} autoComplete="name" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
            Téléphone *
            <input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="+228 …" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
            E-mail (reçu de réservation) *
            <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" placeholder="vous@exemple.com" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
            Nationalité
            <input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} className={field} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
          Demandes particulières (facultatif)
          <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={2} maxLength={1000} placeholder="Heure d'arrivée, lit bébé…" className={cn(field, "resize-y")} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
          <span className="flex items-center gap-1">
            <Gift aria-hidden className="size-4 text-vif" /> Code de parrainage (facultatif)
          </span>
          <input value={form.referral} onChange={(e) => set("referral", e.target.value.toUpperCase())} placeholder="Ex. AV3F9K2Q" className={cn(field, "uppercase")} />
        </label>
        {me && me.points > 0 && (
          <label className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="size-5 accent-[#E30613]" />
            Utiliser mes {me.points} points fidélité (−{F(Math.min(me.points * me.point_value, total))})
          </label>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-display text-xl font-extrabold text-avenida-blue-950">Paiement</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PAY.map((m) => (
              <label
                key={m.k}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition-colors",
                  !m.on ? "cursor-not-allowed border-slate-200 opacity-50" : payment === m.k ? "border-vif bg-red-50/60" : "border-slate-200 hover:border-slate-300",
                )}
              >
                <input type="radio" name="paiement" value={m.k} disabled={!m.on} checked={payment === m.k} onChange={() => setPayment(m.k)} className="mt-1 size-4 accent-[#E30613]" />
                <span>
                  <span className="flex items-center gap-1.5 font-bold text-slate-900">
                    <m.icon aria-hidden className="size-4" /> {m.label}
                  </span>
                  <span className="text-xs text-slate-600">{m.on ? m.hint : "Bientôt disponible"}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-vif">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-full bg-vif px-6 py-4 text-base font-bold text-white hover:bg-vif-fonce disabled:opacity-70">
          {busy ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <ShieldCheck aria-hidden className="size-5" />}
          {payment === "arrivee" ? `Confirmer la réservation · ${F(due)}` : `Réserver et payer ${F(due)}`}
        </button>
        <p className="text-xs text-slate-500">
          {payment === "arrivee"
            ? "Votre chambre est bloquée à votre nom. Le reçu indique « paiement en attente » jusqu'au règlement à la réception."
            : "La chambre est bloquée pendant le paiement. Dès le paiement confirmé, elle est à vous et le reçu indique « soldé »."}
        </p>
      </form>

      {/* Récapitulatif */}
      <aside className="flex h-fit flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/5 lg:sticky lg:top-28">
        {room.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element -- photo de la chambre choisie
          <img src={room.images[0].url} alt={room.name} className="aspect-[16/10] w-full object-cover" />
        )}
        <div className="flex flex-col gap-3 p-5">
          <div>
            <p className="text-xs font-bold tracking-wider text-vif uppercase">Chambre réf. {room.ref}</p>
            <p className="font-display text-xl font-extrabold text-avenida-blue-950">{room.name}</p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-slate-50 p-2.5">
              <dt className="text-xs text-slate-500">Arrivée</dt>
              <dd className="font-bold">{frDate(stay.check_in)}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <dt className="text-xs text-slate-500">Départ</dt>
              <dd className="font-bold">{frDate(stay.check_out)}</dd>
            </div>
          </dl>
          <dl className="flex flex-col gap-1.5 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between">
              <dt>
                {F(room.price)} × {nights} nuit{nights > 1 ? "s" : ""}
              </dt>
              <dd className="font-semibold">{F(total)}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Personnes</dt>
              <dd>{stay.guests}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Points fidélité</dt>
                <dd>−{F(discount)}</dd>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-lg font-extrabold text-avenida-blue-950">
              <dt>Total</dt>
              <dd>{F(due)}</dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
