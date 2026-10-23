"use client";

import { Camera, Loader2, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { IdCard } from "@/components/cards/IdCard";
import { useAuth } from "@/context/AuthContext";
import {
  customerCardData,
  EMPLOYEE_CARD_COLS,
  employeeCardData,
  issueCard,
  schoolYearEnd,
  STUDENT_CARD_COLS,
  studentCardData,
  type CardRow,
  type CustomerRow,
  type EmployeeRow,
  type StudentRow,
} from "@/lib/cards";
import { toPassportDataUrl } from "@/lib/pdf";
import { createClient } from "@/lib/supabase/client";

type Kind = "eleve" | "personnel" | "client";
type Field = { k: string; label: string; type?: "date" | "select"; options?: [string, string][] };

const SEX: [string, string][] = [
  ["M", "Masculin"],
  ["F", "Féminin"],
];

/** Éléments qui composent chaque carte, par catégorie de titulaire. */
const CONFIG: Record<Kind, { table: string; cols: string; photo: boolean; fields: Field[] }> = {
  eleve: {
    table: "students",
    cols: STUDENT_CARD_COLS,
    photo: true,
    fields: [
      { k: "last_name", label: "Nom" },
      { k: "first_name", label: "Prénom(s)" },
      { k: "registration_number", label: "Matricule" },
      { k: "class_name", label: "Classe" },
      { k: "academic_year", label: "Année scolaire" },
      { k: "birth_date", label: "Date de naissance", type: "date" },
      { k: "birth_place", label: "Lieu de naissance" },
      { k: "gender", label: "Sexe", type: "select", options: SEX },
      { k: "address", label: "Adresse" },
      { k: "residence_neighborhood", label: "Quartier" },
      { k: "city", label: "Ville" },
      { k: "tutor_name", label: "Tuteur / parent" },
      { k: "tutor_phone", label: "Téléphone du tuteur" },
      { k: "emergency_contact_name", label: "Personne à prévenir" },
      { k: "emergency_contact_phone", label: "Téléphone de la personne à prévenir" },
    ],
  },
  personnel: {
    table: "employees",
    cols: EMPLOYEE_CARD_COLS,
    photo: true,
    fields: [
      { k: "last_name", label: "Nom" },
      { k: "first_name", label: "Prénom(s)" },
      { k: "matricule", label: "Matricule" },
      { k: "role_title", label: "Fonction (sur la carte)" },
      { k: "department", label: "Service / département" },
      { k: "sector", label: "Établissement", type: "select", options: [["ecole", "École"], ["hotel", "Hôtel"], ["direction", "Direction"]] },
      { k: "birth_date", label: "Date de naissance", type: "date" },
      { k: "gender", label: "Sexe", type: "select", options: SEX },
      { k: "phone", label: "Téléphone" },
      { k: "hire_date", label: "En poste depuis", type: "date" },
    ],
  },
  client: {
    table: "hotel_customers",
    cols: "id, first_name, last_name, full_name, phone, email, nationality, total_stays, total_spent, is_vip, loyalty_points",
    photo: false,
    fields: [
      { k: "last_name", label: "Nom" },
      { k: "first_name", label: "Prénom(s)" },
      { k: "phone", label: "Téléphone" },
      { k: "nationality", label: "Nationalité" },
      { k: "loyalty_points", label: "Points fidélité" },
    ],
  },
};

/**
 * Modifier une carte avant de l'émettre ou de l'imprimer : toutes les informations qui la composent
 * (identité, photo, classe ou fonction, naissance, adresse, tuteur, validité) avec aperçu en direct.
 * Les corrections sont enregistrées dans le dossier de la personne et la carte passe à la version suivante.
 */
export function CardEditor({ kind, holderId, onClose, onSaved }: { kind: Kind; holderId: string; onClose: () => void; onSaved: (msg: string) => void }) {
  const { user } = useAuth();
  const cfg = CONFIG[kind];
  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [card, setCard] = useState<CardRow | null>(null);
  const [validUntil, setValidUntil] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const col = kind === "eleve" ? "student_id" : kind === "client" ? "customer_id" : "employee_id";
    Promise.all([supabase.from(cfg.table).select(cfg.cols).eq("id", holderId).maybeSingle(), supabase.from("id_cards").select("*").eq(col, holderId).maybeSingle<CardRow>()]).then(([{ data: r }, { data: c }]) => {
      setRow((r as unknown as Record<string, unknown>) ?? {});
      setCard(c);
      setValidUntil(c?.valid_until ?? (kind === "eleve" ? schoolYearEnd() : ""));
    });
  }, [cfg, holderId, kind]);

  const preview = useMemo(() => {
    if (!row) return null;
    const c: CardRow = card ?? { id: "", holder_type: kind, student_id: null, employee_id: null, token: "apercu", version: 1, issued_at: new Date().toISOString(), valid_until: null, revoked: false, card_number: null };
    const cc = { ...c, valid_until: validUntil || null };
    if (kind === "eleve") return studentCardData(row as unknown as StudentRow, cc);
    if (kind === "client") return customerCardData({ ...(row as unknown as CustomerRow), full_name: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() }, cc);
    return employeeCardData(row as unknown as EmployeeRow, cc);
  }, [row, card, validUntil, kind]);

  const set = (k: string, v: unknown) => setRow((r) => ({ ...r, [k]: v }));

  const pickPhoto = async (f: File | undefined) => {
    if (!f) return;
    try {
      set("photo_url", await toPassportDataUrl(f));
    } catch {
      setError("Image illisible : choisissez une photo JPG ou PNG.");
    }
  };

  const save = async () => {
    if (!row || !user) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const patch: Record<string, unknown> = {};
    for (const f of cfg.fields) {
      const v = row[f.k];
      patch[f.k] = v === "" || v === undefined ? null : f.k === "last_name" && typeof v === "string" ? v.trim().toUpperCase() : typeof v === "string" ? v.trim() : v;
    }
    if (cfg.photo) patch.photo_url = row.photo_url ?? null;
    if (kind === "client") patch.full_name = `${patch.first_name ?? ""} ${patch.last_name ?? ""}`.trim();
    const { error: e1 } = await supabase.from(cfg.table).update(patch).eq("id", holderId);
    if (e1) {
      setBusy(false);
      return setError("Enregistrement impossible : " + e1.message);
    }
    const res = await issueCard({ type: kind, id: holderId }, user.id);
    if (!res.error) {
      const col = kind === "eleve" ? "student_id" : kind === "client" ? "customer_id" : "employee_id";
      await supabase.from("id_cards").update({ valid_until: validUntil || null }).eq(col, holderId);
    }
    setBusy(false);
    if (res.error) return setError(res.error.message);
    onSaved(card ? "Carte corrigée : nouvelle version enregistrée. Envoyez-la pour vérification ou imprimez-la." : "Carte émise avec ces informations.");
  };

  const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0C356A]";
  return (
    <div role="dialog" aria-modal="true" aria-label="Modifier la carte" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:items-center sm:p-6" onClick={onClose}>
      <div className="relative w-full max-w-5xl rounded-3xl bg-slate-50 p-5 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 rounded-full p-2 hover:bg-white">
          <X aria-hidden className="size-5" />
        </button>
        <h2 className="text-xl font-black text-[#0C356A]">Modifier la carte</h2>
        <p className="mb-4 text-sm text-slate-600">Tous les éléments de la carte : corrigez puis enregistrez. Le dossier de la personne est mis à jour en même temps.</p>
        {!row || !preview ? (
          <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_26rem]">
            <div className="flex flex-col gap-3">
              {cfg.photo && (
                <label className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200 hover:text-[#E30613]">
                  <Camera aria-hidden className="size-4" /> Changer la photo d&apos;identité
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                </label>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {cfg.fields.map((f) => (
                  <label key={f.k} className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                    {f.label}
                    {f.type === "select" ? (
                      <select value={String(row[f.k] ?? "")} onChange={(e) => set(f.k, e.target.value)} className={input}>
                        <option value="">—</option>
                        {f.options!.map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input type={f.type ?? "text"} value={String(row[f.k] ?? "").slice(0, f.type === "date" ? 10 : undefined)} onChange={(e) => set(f.k, e.target.value)} className={input} />
                    )}
                  </label>
                ))}
                <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                  Carte valable jusqu&apos;au
                  <input type="date" value={validUntil.slice(0, 10)} onChange={(e) => setValidUntil(e.target.value)} className={input} />
                </label>
              </div>
              {error && <p className="text-sm font-semibold text-[#B8000F]">{error}</p>}
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />} {card ? "Enregistrer la carte corrigée" : "Émettre la carte"}
                </button>
                <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                  Annuler
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Aperçu en direct</p>
              <IdCard data={preview} className="sm:flex-col" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
