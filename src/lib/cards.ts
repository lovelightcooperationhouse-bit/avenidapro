import type { CardData } from "@/components/cards/IdCard";
import { createClient } from "@/lib/supabase/client";

export type StudentRow = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  registration_number: string | null;
  student_number: string | null;
  class_name: string | null;
  program_code: string | null;
  academic_year: string | null;
  status: string | null;
  total_fee: number | null;
  paid_fee: number | null;
  remaining_fee: number | null;
};

export type EmployeeRow = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  matricule: string | null;
  role_title: string | null;
  position: string | null;
  department: string | null;
  sector: string | null;
  status: string | null;
};

export type CardRow = { id: string; holder_type: "eleve" | "personnel"; student_id: string | null; employee_id: string | null; token: string; version: number; issued_at: string; valid_until: string | null; revoked: boolean };

/** Même règle que la base (student_payment_ok) : part attendue sur 8 tranches à partir d'octobre. */
export function paymentOk(s: Pick<StudentRow, "total_fee" | "paid_fee" | "remaining_fee" | "academic_year">) {
  const total = s.total_fee ?? 0;
  if ((s.remaining_fee ?? 0) <= 0 || total === 0) return true;
  const startYear = parseInt((s.academic_year ?? "").slice(0, 4), 10) || new Date().getFullYear();
  const start = new Date(startYear, 9, 1);
  const now = new Date();
  const months = Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth() + 1);
  return (s.paid_fee ?? 0) >= total * Math.min(1, months / 8);
}

export const studentCardData = (s: StudentRow, c: CardRow): CardData => ({
  type: "eleve",
  token: c.token,
  version: c.version,
  issuedAt: c.issued_at,
  validUntil: c.valid_until,
  name: `${s.first_name} ${s.last_name}`,
  photo: s.photo_url,
  matricule: s.registration_number ?? s.student_number ?? "—",
  line1: s.class_name ?? s.program_code ?? "Élève",
  line2: `Année scolaire ${s.academic_year ?? ""}`.trim(),
  paymentOk: paymentOk(s),
});

export const employeeCardData = (e: EmployeeRow, c: CardRow): CardData => ({
  type: "personnel",
  token: c.token,
  version: c.version,
  issuedAt: c.issued_at,
  validUntil: c.valid_until,
  name: `${e.first_name} ${e.last_name}`,
  photo: e.photo_url,
  matricule: e.matricule ?? "—",
  line1: e.role_title ?? e.position ?? "Personnel",
  line2: e.department ?? (e.sector === "hotel" ? "Hôtel Avenida" : e.sector === "ecole" ? "École Avenida" : "Avenida"),
});

/** Fin de l'année scolaire en cours (31 juillet) : validité par défaut des cartes élèves. */
export const schoolYearEnd = () => {
  const now = new Date();
  const year = now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-07-31`;
};

/**
 * Émet une carte ou la met à jour. `regenerate` change le QR code (l'ancienne carte devient invalide),
 * sinon seule la version augmente (informations actualisées).
 */
export async function issueCard(holder: { type: "eleve"; id: string } | { type: "personnel"; id: string }, issuedBy: string, regenerate = false) {
  const supabase = createClient();
  const col = holder.type === "eleve" ? "student_id" : "employee_id";
  const { data: existing } = await supabase.from("id_cards").select("*").eq(col, holder.id).maybeSingle<CardRow>();
  if (!existing) {
    return supabase.from("id_cards").insert({ holder_type: holder.type, [col]: holder.id, issued_by: issuedBy, valid_until: holder.type === "eleve" ? schoolYearEnd() : null });
  }
  return supabase
    .from("id_cards")
    .update({
      version: existing.version + 1,
      issued_at: new Date().toISOString(),
      issued_by: issuedBy,
      revoked: false,
      ...(regenerate ? { token: crypto.randomUUID().replace(/-/g, "") } : {}),
    })
    .eq("id", existing.id);
}
