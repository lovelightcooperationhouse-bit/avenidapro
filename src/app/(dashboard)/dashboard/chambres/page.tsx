"use client";

import { Eye, EyeOff, Loader2, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MediaPicker } from "@/components/cms/shared";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Room = {
  id?: string;
  room_number: string;
  name: string | null;
  room_type: string | null;
  description: string | null;
  price_per_night: number | null;
  capacity: number;
  floor: number | null;
  amenities: string[];
  images: { url: string; alt?: string }[];
  published: boolean;
  status: string | null;
  sort: number;
};

const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";
const label = "flex flex-col gap-1 text-xs font-bold text-slate-600";
const EMPTY: Room = { room_number: "", name: "", room_type: "", description: "", price_per_night: 0, capacity: 2, floor: 1, amenities: [], images: [], published: true, status: "disponible", sort: 100 };
const SUGGESTED = ["Climatisation", "Wi-Fi", "Télévision", "Réfrigérateur", "Salle d'eau privée", "Eau chaude", "Bureau", "Petit-déjeuner possible", "Parking"];

/**
 * Chambres affichées sur le site : référence, nom, photos, prix, capacité, équipements.
 * Toute chambre publiée ici apparaît aussitôt dans la réservation en ligne.
 */
export default function RoomsSitePage() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [edit, setEdit] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await createClient().from("rooms").select("id, room_number, name, room_type, description, price_per_night, capacity, floor, amenities, images, published, status, sort").order("sort").order("room_number");
    setRooms((data ?? []) as Room[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    if (!edit.room_number.trim()) return setMsg({ ok: false, text: "Indiquez la référence (numéro) de la chambre." });
    if (!edit.price_per_night || edit.price_per_night <= 0) return setMsg({ ok: false, text: "Indiquez le prix par nuit." });
    setBusy(true);
    const { id, ...row } = edit;
    const payload = { ...row, room_number: row.room_number.trim(), name: row.name?.trim() || null, room_type: row.room_type?.trim() || row.name?.trim() || null };
    const supabase = createClient();
    const { error } = id ? await supabase.from("rooms").update(payload).eq("id", id) : await supabase.from("rooms").insert(payload);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message.includes("room_number") ? "Cette référence existe déjà." : error.message });
    setMsg({ ok: true, text: `Chambre ${payload.room_number} enregistrée${payload.published ? " : visible tout de suite sur le site." : " (masquée sur le site)."}` });
    setEdit(null);
    load();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0C356A]">Chambres en ligne</h1>
          <p className="text-sm text-slate-600">
            Chaque chambre publiée apparaît sur le site avec ses photos, sa référence et son prix, et se réserve directement. Les dates déjà réservées sont bloquées
            automatiquement.{" "}
            <Link href="/hotel#reserver" target="_blank" className="font-bold text-[#E30613] underline">
              Voir sur le site
            </Link>
          </p>
        </div>
        <button type="button" onClick={() => setEdit({ ...EMPTY })} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white">
          <Plus aria-hidden className="size-4" /> Ajouter une chambre
        </button>
      </div>
      {msg && <p className={cn("rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#B8000F]")}>{msg.text}</p>}

      {edit && (
        <form onSubmit={save} className="grid gap-4 rounded-3xl border-2 border-[#0C356A]/20 bg-white p-5 lg:grid-cols-2">
          <p className="text-lg font-black text-[#0C356A] lg:col-span-2">{edit.id ? `Modifier la chambre ${edit.room_number}` : "Nouvelle chambre"}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>
              Référence (numéro) *
              <input value={edit.room_number} onChange={(e) => setEdit({ ...edit, room_number: e.target.value })} placeholder="101" className={input} />
            </label>
            <label className={label}>
              Prix par nuit (F CFA) *
              <input type="number" min={0} value={edit.price_per_night ?? 0} onChange={(e) => setEdit({ ...edit, price_per_night: Number(e.target.value) })} className={input} />
            </label>
            <label className={cn(label, "sm:col-span-2")}>
              Nom affiché
              <input value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Suite Junior Avenida" className={input} />
            </label>
            <label className={label}>
              Catégorie
              <input value={edit.room_type ?? ""} onChange={(e) => setEdit({ ...edit, room_type: e.target.value })} placeholder="Suite, Standard, Confort…" className={input} />
            </label>
            <label className={label}>
              Personnes (max.)
              <input type="number" min={1} max={10} value={edit.capacity} onChange={(e) => setEdit({ ...edit, capacity: Number(e.target.value) || 1 })} className={input} />
            </label>
            <label className={label}>
              Étage
              <input type="number" value={edit.floor ?? ""} onChange={(e) => setEdit({ ...edit, floor: e.target.value === "" ? null : Number(e.target.value) })} className={input} />
            </label>
            <label className={label}>
              Ordre d&apos;affichage
              <input type="number" value={edit.sort} onChange={(e) => setEdit({ ...edit, sort: Number(e.target.value) || 100 })} className={input} />
            </label>
            <label className={cn(label, "sm:col-span-2")}>
              Description
              <textarea rows={3} value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className={input} />
            </label>
            <div className={cn(label, "sm:col-span-2")}>
              Équipements
              <div className="flex flex-wrap gap-1.5">
                {[...new Set([...SUGGESTED, ...edit.amenities])].map((a) => {
                  const on = edit.amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setEdit({ ...edit, amenities: on ? edit.amenities.filter((x) => x !== a) : [...edit.amenities, a] })}
                      className={cn("rounded-full px-3 py-1 text-xs font-bold ring-1", on ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200")}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
              <input
                placeholder="Autre équipement puis Entrée"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const v = e.currentTarget.value.trim();
                  if (v && !edit.amenities.includes(v)) setEdit({ ...edit, amenities: [...edit.amenities, v] });
                  e.currentTarget.value = "";
                }}
                className={input}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className={label}>
              Photos de la chambre (la première est la photo principale)
              <MediaPicker multiple value={edit.images.map((m) => ({ url: m.url, alt: m.alt ?? "" }))} onChange={(m) => setEdit({ ...edit, images: m.map((x) => ({ url: x.url, alt: x.alt ?? "" })) })} folder="chambres" />
            </div>
            <label className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-bold">
              <input type="checkbox" checked={edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} className="size-5 accent-[#0C356A]" />
              Publiée sur le site (réservable en ligne)
            </label>
            <label className={label}>
              État
              <select value={edit.status ?? "disponible"} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className={input}>
                <option value="disponible">En service</option>
                <option value="occupée">Occupée (aujourd&apos;hui)</option>
                <option value="nettoyage">Nettoyage</option>
                <option value="maintenance">En maintenance (non réservable)</option>
              </select>
            </label>
            <div className="mt-auto flex gap-2">
              <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />} Enregistrer
              </button>
              <button type="button" onClick={() => setEdit(null)} className="rounded-full px-5 py-2.5 text-sm font-bold ring-1 ring-slate-200">
                Fermer
              </button>
            </div>
          </div>
        </form>
      )}

      {rooms === null ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((r) => (
            <li key={r.id} className={cn("flex flex-col overflow-hidden rounded-3xl border bg-white", r.published ? "border-slate-200" : "border-dashed border-slate-300 opacity-75")}>
              <div className="relative aspect-[16/10] bg-slate-100">
                {r.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element -- photo de chambre
                  <img src={r.images[0].url} alt="" className="size-full object-cover" />
                )}
                <span className="absolute top-2 left-2 rounded-full bg-[#06152E]/85 px-3 py-1 text-xs font-bold text-white">Réf. {r.room_number}</span>
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold">
                  {r.published ? <Eye aria-hidden className="size-3.5" /> : <EyeOff aria-hidden className="size-3.5" />} {r.published ? "Sur le site" : "Masquée"}
                </span>
                <span className="absolute right-2 bottom-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold">{r.images.length} photo(s)</span>
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <p className="font-bold text-slate-900">{r.name || r.room_type || `Chambre ${r.room_number}`}</p>
                <p className="text-sm text-slate-500">
                  {new Intl.NumberFormat("fr-FR").format(Number(r.price_per_night ?? 0))} F / nuit · {r.capacity} pers. · {r.status}
                </p>
                <button type="button" onClick={() => setEdit({ ...r, amenities: r.amenities ?? [], images: r.images ?? [] })} className="mt-auto self-start rounded-full bg-[#0C356A] px-4 py-1.5 text-xs font-bold text-white">
                  Modifier
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
