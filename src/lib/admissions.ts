/** Statuts d'une pré-inscription : libellé, couleur et étape dans le parcours. */
export const APPLICATION_STATUS = {
  nouvelle: { label: "Reçue", tone: "bg-sky-50 text-sky-700 ring-sky-200", step: 1 },
  en_etude: { label: "En cours d'étude", tone: "bg-amber-50 text-amber-800 ring-amber-200", step: 2 },
  pieces_manquantes: { label: "Pièces manquantes", tone: "bg-orange-50 text-orange-800 ring-orange-200", step: 2 },
  acceptee: { label: "Acceptée", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200", step: 3 },
  refusee: { label: "Non retenue", tone: "bg-red-50 text-red-700 ring-red-200", step: 3 },
  inscrite: { label: "Inscrite", tone: "bg-avenida-blue-50 text-avenida-blue ring-avenida-blue-200", step: 4 },
} as const;

export type ApplicationStatus = keyof typeof APPLICATION_STATUS;

export const DOC_LABELS: Record<string, string> = {
  acte_naissance: "Acte de naissance",
  bulletins: "Bulletins / relevés",
  photo: "Photo d'identité",
  certificat_medical: "Certificat médical",
  diplome: "Diplôme",
  autre: "Autre pièce",
};

export type Application = {
  id: string;
  reference: string | null;
  created_at: string;
  status: ApplicationStatus;
  program_code: string;
  specialty: string;
  intake: string;
  schedule: "jour" | "soir";
  boarding: boolean;
  first_name: string;
  last_name: string;
  gender: string | null;
  birth_date: string | null;
  birth_place: string | null;
  nationality: string | null;
  neighborhood: string | null;
  phone: string;
  email: string;
  last_class: string | null;
  last_diploma: string | null;
  previous_school: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  student_id: string | null;
  member_application_id?: string | null;
  guardian_relation: string | null;
  guardian_profession: string | null;
  message: string | null;
  staff_notes: string | null;
  decided_at: string | null;
};

export type ApplicationDocument = { id: string; application_id: string; doc_type: string; file_path: string; file_name: string; file_size: number | null; created_at: string };

export const fmtDateTime = (d: string) => new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
