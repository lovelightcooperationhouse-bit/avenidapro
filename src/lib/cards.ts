import type { CardData } from "@/components/cards/IdCard";
import { createClient } from "@/lib/supabase/client";

/** Colonnes lues pour afficher une carte (élève / salarié). */
export const STUDENT_CARD_COLS =
  "id, first_name, last_name, photo_url, registration_number, student_number, class_name, program_code, academic_year, status, total_fee, paid_fee, remaining_fee, birth_date, birth_place, gender, residence_neighborhood, address, city, phone, tutor_name, tutor_phone, parent_father_name, parent_father_phone, parent_mother_name, parent_mother_phone";
export const EMPLOYEE_CARD_COLS = "id, first_name, last_name, photo_url, matricule, role_title, position, department, sector, status, phone, birth_date, gender, nationality, neighborhood, hire_date";

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
  birth_date?: string | null;
  birth_place?: string | null;
  gender?: string | null;
  residence_neighborhood?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  tutor_name?: string | null;
  tutor_phone?: string | null;
  parent_father_name?: string | null;
  parent_father_phone?: string | null;
  parent_mother_name?: string | null;
  parent_mother_phone?: string | null;
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
  phone?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  nationality?: string | null;
  neighborhood?: string | null;
  hire_date?: string | null;
};

export type CustomerRow = { id: string; first_name: string; last_name: string; full_name: string | null; phone: string | null; email: string | null; nationality: string | null; total_stays: number | null; total_spent: number | null; is_vip: boolean | null; loyalty_points: number | null };

export type CardRow = { id: string; holder_type: "eleve" | "personnel" | "client"; student_id: string | null; employee_id: string | null; customer_id?: string | null; card_number?: string | null; token: string; version: number; issued_at: string; valid_until: string | null; revoked: boolean; review_status?: string; review_note?: string | null };

/** Étapes de vérification d'une carte par son titulaire avant validation. */
export const CARD_REVIEW: Record<string, { label: string; tone: string }> = {
  brouillon: { label: "Brouillon", tone: "bg-slate-100 text-slate-700" },
  a_verifier: { label: "En vérification", tone: "bg-sky-100 text-sky-800" },
  approuvee: { label: "Approuvée par le titulaire", tone: "bg-emerald-100 text-emerald-800" },
  corrections: { label: "Corrections demandées", tone: "bg-amber-100 text-amber-800" },
  envoyee: { label: "Validée et envoyée", tone: "bg-emerald-600 text-white" },
};

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

const day = (d?: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "");
const sexe = (g?: string | null) => (g === "F" ? "Féminin" : g === "M" ? "Masculin" : (g ?? ""));

/** Tuteur affiché sur la carte : tuteur, sinon mère, sinon père. */
function guardian(s: StudentRow) {
  const name = s.tutor_name || s.parent_mother_name || s.parent_father_name;
  const phone = s.tutor_name ? s.tutor_phone : s.parent_mother_name ? s.parent_mother_phone : s.parent_father_phone;
  return { name: name ?? "", phone: phone ?? s.tutor_phone ?? "" };
}

export const studentCardData = (s: StudentRow, c: CardRow): CardData => ({
  type: "eleve",
  variant: "eleve",
  token: c.token,
  version: c.version,
  issuedAt: c.issued_at,
  validUntil: c.valid_until,
  name: `${s.first_name} ${s.last_name}`,
  photo: s.photo_url,
  matricule: s.registration_number ?? s.student_number ?? "—",
  line1: s.class_name ?? s.program_code ?? "Élève",
  line2: `Année scolaire ${s.academic_year ?? ""}`.trim(),
  details: [
    { label: "Né(e) le", value: [day(s.birth_date), s.birth_place ? `à ${s.birth_place}` : ""].filter(Boolean).join(" ") },
    { label: "Sexe", value: sexe(s.gender) },
    { label: "Tuteur", value: [guardian(s).name, guardian(s).phone].filter(Boolean).join(" · ") },
    { label: "Adresse", value: [s.address, s.residence_neighborhood, s.city].filter(Boolean).join(", ") },
  ],
  emergency: [guardian(s).name, guardian(s).phone].filter(Boolean).join(" · ") || null,
  cardNumber: c.card_number,
});

/** Niveau de fidélité selon les séjours (Or : 10 séjours ou client VIP, Argent : 4 séjours). */
export const loyaltyLevel = (c: Pick<CustomerRow, "total_stays" | "is_vip">) => ((c.total_stays ?? 0) >= 10 || c.is_vip ? "Or" : (c.total_stays ?? 0) >= 4 ? "Argent" : "Classique");

export const customerCardData = (cu: CustomerRow, c: CardRow): CardData => ({
  type: "client",
  variant: "client",
  token: c.token,
  version: c.version,
  issuedAt: c.issued_at,
  validUntil: c.valid_until,
  name: cu.full_name ?? `${cu.first_name} ${cu.last_name}`,
  photo: null,
  matricule: c.card_number ?? "—",
  line1: `Membre ${loyaltyLevel(cu)} · ${cu.loyalty_points ?? 0} points`,
  line2: "Hôtel Avenida · Lomé",
  details: [
    { label: "Téléphone", value: cu.phone ?? "" },
    { label: "Nationalité", value: cu.nationality ?? "" },
  ].filter((d) => d.value),
});

/** Modèle de carte d'un salarié : professeur, personnel de l'hôtel ou personnel de l'école / direction. */
export const employeeVariant = (e: Pick<EmployeeRow, "role_title" | "position" | "sector" | "department">) =>
  /professeur|formateur|enseignant|chef de travaux/i.test(`${e.role_title ?? ""} ${e.position ?? ""}`) ? "professeur" : e.sector === "hotel" ? "hotel" : "personnel";

export const employeeCardData = (e: EmployeeRow, c: CardRow): CardData => ({
  type: "personnel",
  variant: employeeVariant(e),
  token: c.token,
  version: c.version,
  issuedAt: c.issued_at,
  validUntil: c.valid_until,
  name: `${e.first_name} ${e.last_name}`,
  photo: e.photo_url,
  matricule: e.matricule ?? "—",
  line1: e.role_title ?? e.position ?? "Personnel",
  line2: e.department ?? (e.sector === "hotel" ? "Hôtel Avenida" : e.sector === "ecole" ? "École Avenida" : "Avenida"),
  details: [
    { label: "Né(e) le", value: day(e.birth_date) },
    { label: "Sexe", value: sexe(e.gender) },
    { label: "Téléphone", value: e.phone ?? "" },
    { label: "En poste depuis", value: day(e.hire_date) },
  ].filter((d) => d.value),
  cardNumber: c.card_number,
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
export async function issueCard(holder: { type: "eleve" | "personnel" | "client"; id: string }, issuedBy: string, regenerate = false) {
  const supabase = createClient();
  const col = holder.type === "eleve" ? "student_id" : holder.type === "client" ? "customer_id" : "employee_id";
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
