"use client";

import { BedDouble, Inbox, Loader2, Mail, MessageSquareText, Phone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fmtDateTime } from "@/lib/admissions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ContactRequest = { id: string; created_at: string; topic: string; full_name: string; phone: string | null; email: string | null; message: string; status: "nouveau" | "en_cours" | "traite" };
type BookingRequest = {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  email: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  room_type: string | null;
  message: string | null;
  status: "nouvelle" | "confirmee" | "refusee" | "annulee";
};

const TOPICS: Record<string, string> = { inscription: "Inscription", reservation: "Réservation", restaurant: "Restaurant", partenariat: "Partenariat", autre: "Autre" };
const CONTACT_STATUS = { nouveau: "Nouveau", en_cours: "En cours", traite: "Traité" } as const;
const BOOKING_STATUS = { nouvelle: "Nouvelle", confirmee: "Confirmée", refusee: "Refusée", annulee: "Annulée" } as const;
const tone = (s: string) =>
  s === "nouveau" || s === "nouvelle" ? "bg-sky-50 text-sky-700 ring-sky-200" : s === "traite" || s === "confirmee" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : s === "en_cours" ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-slate-100 text-slate-600 ring-slate-200";
const day = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

/** Demandes reçues depuis le site : messages de contact et demandes de réservation de chambre. */
export default function RequestsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"contact" | "booking">(user?.role === "responsable_hotel" ? "booking" : "contact");
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: c }, { data: b }] = await Promise.all([
      supabase.from("contact_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("booking_requests").select("*").order("created_at", { ascending: false }),
    ]);
    setContacts((c ?? []) as ContactRequest[]);
    setBookings((b ?? []) as BookingRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (table: "contact_requests" | "booking_requests", id: string, status: string) => {
    await createClient().from(table).update({ status, handled_by: user?.id }).eq("id", id);
    load();
  };

  const newContacts = contacts.filter((c) => c.status === "nouveau").length;
  const newBookings = bookings.filter((b) => b.status === "nouvelle").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#0C356A]">Demandes reçues du site</h1>
        <p className="mt-1 text-sm text-slate-600">Messages du formulaire de contact et demandes de réservation de l&apos;hôtel.</p>
      </div>

      <div className="flex gap-2" role="tablist">
        {[
          { key: "contact" as const, label: "Messages de contact", icon: MessageSquareText, count: newContacts },
          { key: "booking" as const, label: "Réservations", icon: BedDouble, count: newBookings },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ring-1", tab === t.key ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200")}
          >
            <t.icon aria-hidden className="size-4" />
            {t.label}
            {t.count > 0 && <span className="rounded-full bg-[#DC2626] px-2 py-0.5 text-[10px] text-white">{t.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 aria-hidden className="size-4 animate-spin" /> Chargement…
        </p>
      ) : tab === "contact" ? (
        contacts.length === 0 ? (
          <Empty />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {contacts.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{c.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {TOPICS[c.topic] ?? c.topic} · {fmtDateTime(c.created_at)}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold ring-1", tone(c.status))}>{CONTACT_STATUS[c.status]}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap text-slate-700">{c.message}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                      <Phone aria-hidden className="size-4" /> {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                      <Mail aria-hidden className="size-4" /> {c.email}
                    </a>
                  )}
                  <select
                    value={c.status}
                    onChange={(e) => setStatus("contact_requests", c.id, e.target.value)}
                    aria-label="Statut du message"
                    className="ml-auto rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold"
                  >
                    {Object.entries(CONTACT_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : bookings.length === 0 ? (
        <Empty />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {bookings.map((b) => (
            <li key={b.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{b.full_name}</p>
                  <p className="text-xs text-slate-500">Reçue le {fmtDateTime(b.created_at)}</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold ring-1", tone(b.status))}>{BOOKING_STATUS[b.status]}</span>
              </div>
              <p className="text-sm font-semibold text-[#0C356A]">
                {b.room_type ?? "Chambre"} · {b.guests} pers. · du {day(b.check_in)} au {day(b.check_out)}
              </p>
              {b.message && <p className="text-sm text-slate-700">{b.message}</p>}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                  <Phone aria-hidden className="size-4" /> {b.phone}
                </a>
                {b.email && (
                  <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                    <Mail aria-hidden className="size-4" /> {b.email}
                  </a>
                )}
                <select
                  value={b.status}
                  onChange={(e) => setStatus("booking_requests", b.id, e.target.value)}
                  aria-label="Statut de la réservation"
                  className="ml-auto rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold"
                >
                  {Object.entries(BOOKING_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Empty() {
  return (
    <p className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
      <Inbox aria-hidden className="size-8 text-slate-300" />
      Aucune demande pour le moment.
    </p>
  );
}
