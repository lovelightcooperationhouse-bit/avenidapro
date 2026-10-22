"use client";

import { CalendarCheck, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { rooms, siteConfig, whatsappUrl } from "@/content/site";
import { createClient } from "@/lib/supabase/client";

const field =
  "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/20 [color-scheme:dark]";

const today = () => new Date().toISOString().slice(0, 10);

/** Demande de réservation : enregistrée pour la réception (espace de gestion), avec repli WhatsApp. */
export function BookingForm() {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", check_in: "", check_out: "", guests: "2", room_type: rooms[0].name, message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (form.full_name.trim().length < 2 || form.phone.replace(/\D/g, "").length < 8) return setError("Indiquez votre nom et un numéro de téléphone valide.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return setError("Indiquez votre adresse e-mail : la confirmation vous sera envoyée par e-mail.");
    if (!form.check_in || !form.check_out || form.check_out <= form.check_in) return setError("La date de départ doit être après la date d'arrivée.");
    setError("");
    setSending(true);
    const { error: err } = await createClient()
      .from("booking_requests")
      .insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        check_in: form.check_in,
        check_out: form.check_out,
        guests: Number(form.guests),
        room_type: form.room_type,
        message: form.message.trim() || null,
      });
    setSending(false);
    if (err) return setError("L'envoi a échoué. Réessayez ou contactez la réception par WhatsApp.");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/10 p-8 text-center backdrop-blur-md">
        <CheckCircle2 aria-hidden className="size-14 text-emerald-400" />
        <p className="font-display text-2xl font-extrabold">Demande envoyée !</p>
        <p className="text-white/80">
          La réception vous rappelle au <strong>{form.phone}</strong> pour confirmer la disponibilité et le tarif de votre séjour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <input type="text" name="site_web" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Nom complet *
          <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} autoComplete="name" className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Téléphone *
          <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="+228 …" className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Arrivée *
          <input type="date" min={today()} value={form.check_in} onChange={(e) => set("check_in", e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Départ *
          <input type="date" min={form.check_in || today()} value={form.check_out} onChange={(e) => set("check_out", e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Personnes
          <select value={form.guests} onChange={(e) => set("guests", e.target.value)} className={field}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n} className="text-slate-900">
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Chambre souhaitée
          <select value={form.room_type} onChange={(e) => set("room_type", e.target.value)} className={field}>
            {rooms.map((r) => (
              <option key={r.name} className="text-slate-900">
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        E-mail (pour recevoir la confirmation) *
        <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" placeholder="vous@exemple.com" className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Précisions (facultatif)
        <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={2} maxLength={2000} className={`${field} resize-y`} />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-vif">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={sending} className="relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full bg-white px-6 font-bold text-vif transition-colors hover:bg-red-50 disabled:opacity-70">
          {sending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <CalendarCheck aria-hidden className="size-4" />}
          Envoyer ma demande
        </button>
        <a
          href={whatsappUrl(siteConfig.whatsapp, "Bonjour, je souhaite réserver une chambre à l'Hôtel École Avenida.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 font-bold text-white hover:bg-[#1da851]"
        >
          <MessageCircle aria-hidden className="size-4" />
          WhatsApp
          <span className="sr-only">(nouvel onglet)</span>
        </a>
      </div>
    </form>
  );
}
