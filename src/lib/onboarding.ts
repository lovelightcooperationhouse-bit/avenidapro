import { formations, intakes } from "@/content/site";

/**
 * Formulaire « Compléter mon profil » : selon le statut choisi par le membre, les informations
 * et les pièces demandées changent automatiquement. L'administration reçoit le dossier complet,
 * le gestionnaire concerné donne son avis et le Directeur général valide et attribue le rôle.
 */

export type MemberKind = "eleve" | "parent" | "professeur" | "personnel" | "direction" | "client";
export type Department = "direction" | "ecole" | "hotel";
export type AppStatus = "brouillon" | "soumise" | "en_examen" | "a_completer" | "avis_favorable" | "avis_defavorable" | "validee" | "refusee";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "date" | "tel" | "number" | "textarea" | "select" | "children";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  /** Occupe toute la largeur de la grille. */
  wide?: boolean;
};
export type FieldGroup = { title: string; fields: Field[] };
export type DocSpec = { key: string; label: string; required: boolean; hint?: string };

export type Position = { code: string; label: string; department: Department; service: string | null; default_role: string; sort: number };

export type MemberApplication = {
  id: string;
  profile_id: string;
  kind: MemberKind;
  department: Department | null;
  position_code: string | null;
  data: Record<string, unknown>;
  photo: string | null;
  documents: UploadedDoc[];
  status: AppStatus;
  manager_note: string | null;
  manager_at: string | null;
  dg_note: string | null;
  decided_at: string | null;
  assigned_role: string | null;
  student_id: string | null;
  employee_id: string | null;
  customer_id: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};
export type UploadedDoc = { key: string; label: string; path: string; name: string; size: number; mime: string };

export const KINDS: { value: MemberKind; label: string; text: string }[] = [
  { value: "eleve", label: "Élève / étudiant(e)", text: "Je suis inscrit(e) ou je m'inscris à l'école." },
  { value: "parent", label: "Parent ou tuteur d'élève", text: "Je suis la scolarité de mon enfant." },
  { value: "professeur", label: "Professeur / formateur", text: "J'enseigne à l'école Avenida." },
  { value: "personnel", label: "Personnel (hôtel ou école)", text: "Je travaille à l'hôtel ou à l'école." },
  { value: "direction", label: "Direction / gestionnaire", text: "Direction, comptabilité, RH, responsable d'hôtel." },
  { value: "client", label: "Client de l'hôtel", text: "Je séjourne ou je réserve à l'hôtel." },
];

export const STATUS_LABEL: Record<AppStatus, { label: string; tone: string }> = {
  brouillon: { label: "Brouillon", tone: "bg-slate-100 text-slate-700" },
  soumise: { label: "Envoyé, en attente d'examen", tone: "bg-sky-50 text-sky-800" },
  en_examen: { label: "En cours d'examen", tone: "bg-indigo-50 text-indigo-800" },
  a_completer: { label: "À compléter", tone: "bg-amber-50 text-amber-800" },
  avis_favorable: { label: "Avis favorable · décision du DG", tone: "bg-emerald-50 text-emerald-800" },
  avis_defavorable: { label: "Avis défavorable · décision du DG", tone: "bg-orange-50 text-orange-800" },
  validee: { label: "Validé", tone: "bg-emerald-100 text-emerald-900" },
  refusee: { label: "Refusé", tone: "bg-red-50 text-[#DC2626]" },
};

const opt = (...values: string[]) => values.map((v) => ({ value: v, label: v }));
const GENDER = [
  { value: "M", label: "Masculin" },
  { value: "F", label: "Féminin" },
];
const ID_TYPES = opt("Carte nationale d'identité", "Passeport", "Carte d'électeur", "Permis de conduire", "Carte consulaire");
const DEGREES = opt("Aucun", "CEPD", "BEPC", "CAP", "BEP", "BT", "BAC I", "BAC II", "BTS", "Licence", "Master", "Doctorat", "Autre");

const identity: FieldGroup = {
  title: "Identité",
  fields: [
    { name: "last_name", label: "Nom", required: true },
    { name: "first_name", label: "Prénom(s)", required: true },
    { name: "gender", label: "Sexe", type: "select", options: GENDER, required: true },
    { name: "birth_date", label: "Date de naissance", type: "date", required: true },
    { name: "birth_place", label: "Lieu de naissance", required: true },
    { name: "nationality", label: "Nationalité", required: true, placeholder: "Togolaise" },
  ],
};

const contact: FieldGroup = {
  title: "Coordonnées",
  fields: [
    { name: "phone", label: "Téléphone (WhatsApp de préférence)", type: "tel", required: true, placeholder: "+228 90 00 00 00" },
    { name: "phone_secondary", label: "Second téléphone", type: "tel" },
    { name: "city", label: "Ville", required: true, placeholder: "Lomé" },
    { name: "neighborhood", label: "Quartier", required: true },
    { name: "address", label: "Adresse précise", wide: true },
  ],
};

const idDoc: FieldGroup = {
  title: "Pièce d'identité",
  fields: [
    { name: "id_type", label: "Type de pièce", type: "select", options: ID_TYPES, required: true },
    { name: "id_number", label: "Numéro de la pièce", required: true },
  ],
};

const emergency: FieldGroup = {
  title: "Personne à prévenir en cas d'urgence (au verso de la carte)",
  fields: [
    { name: "emergency_name", label: "Nom et prénom", required: true },
    { name: "emergency_phone", label: "Téléphone", type: "tel", required: true },
    { name: "emergency_relation", label: "Lien (conjoint, parent…)" },
  ],
};

const programOptions = formations.map((f) => ({ value: f.code, label: `${f.code} — ${f.name}` }));
const specialtyOptions = [...new Set(formations.flatMap((f) => f.specialties))].map((s) => ({ value: s, label: s }));

/** Champs du formulaire selon le statut (et le département pour le personnel). */
export function fieldGroups(kind: MemberKind, department?: Department | null): FieldGroup[] {
  switch (kind) {
    case "eleve":
      return [
        identity,
        contact,
        {
          title: "Formation",
          fields: [
            { name: "program_code", label: "Filière", type: "select", options: programOptions, required: true },
            { name: "specialty", label: "Spécialité", type: "select", options: specialtyOptions, required: true },
            { name: "year_level", label: "Année d'études", type: "select", options: opt("1re année", "2e année", "3e année"), required: true },
            { name: "intake", label: "Rentrée", type: "select", options: opt(...intakes) },
            { name: "schedule", label: "Cours", type: "select", options: opt("Cours du jour", "Cours du soir") },
            { name: "boarding", label: "Régime", type: "select", options: [{ value: "externe", label: "Externe" }, { value: "interne", label: "Interne (logé à l'école)" }] },
          ],
        },
        {
          title: "Parcours scolaire",
          fields: [
            { name: "previous_school", label: "Dernier établissement fréquenté", required: true },
            { name: "last_class", label: "Dernière classe suivie", required: true },
            { name: "last_diploma", label: "Dernier diplôme obtenu", type: "select", options: DEGREES, required: true },
            { name: "average_last_year", label: "Moyenne de la dernière année" },
          ],
        },
        {
          title: "Parents ou tuteur",
          fields: [
            { name: "father_name", label: "Nom du père" },
            { name: "father_phone", label: "Téléphone du père", type: "tel" },
            { name: "father_profession", label: "Profession du père" },
            { name: "mother_name", label: "Nom de la mère" },
            { name: "mother_phone", label: "Téléphone de la mère", type: "tel" },
            { name: "mother_profession", label: "Profession de la mère" },
            { name: "tutor_name", label: "Tuteur (si différent)" },
            { name: "tutor_phone", label: "Téléphone du tuteur", type: "tel" },
            { name: "tutor_relation", label: "Lien avec le tuteur" },
          ],
        },
        {
          title: "Santé",
          fields: [
            { name: "blood_group", label: "Groupe sanguin", type: "select", options: opt("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Je ne sais pas") },
            { name: "allergies", label: "Allergies" },
            { name: "medical_notes", label: "Traitement ou information médicale utile", type: "textarea", wide: true },
          ],
        },
        emergency,
      ];
    case "parent":
      return [
        identity,
        contact,
        idDoc,
        {
          title: "Mes enfants à l'école Avenida",
          fields: [
            { name: "relation", label: "Je suis", type: "select", options: opt("Père", "Mère", "Tuteur", "Tutrice", "Autre"), required: true },
            { name: "profession", label: "Profession" },
            { name: "employer", label: "Employeur" },
            { name: "children", label: "Matricule(s) de vos enfants (un par ligne)", type: "children", required: true, wide: true, placeholder: "CAP26-0001" },
            { name: "children_names", label: "Nom et classe des enfants (si le matricule est inconnu)", type: "textarea", wide: true },
          ],
        },
      ];
    case "professeur":
      return [
        identity,
        contact,
        idDoc,
        {
          title: "Enseignement",
          fields: [
            { name: "specialty", label: "Discipline / spécialité enseignée", required: true, placeholder: "Cuisine, service, hébergement, français…" },
            { name: "programs_taught", label: "Filières enseignées", placeholder: "CAP, BEP, BTS…" },
            { name: "highest_degree", label: "Diplôme le plus élevé", type: "select", options: DEGREES, required: true },
            { name: "experience_years", label: "Années d'expérience", type: "number", required: true },
            { name: "previous_employer", label: "Dernier employeur / établissement" },
            { name: "availability", label: "Disponibilité", type: "select", options: opt("Temps plein", "Temps partiel", "Vacataire", "Cours du soir") },
            { name: "cv_summary", label: "Résumé de votre parcours", type: "textarea", wide: true },
          ],
        },
        emergency,
      ];
    case "personnel":
      return [
        identity,
        contact,
        idDoc,
        {
          title: department === "ecole" ? "Poste à l'école" : "Poste à l'hôtel",
          fields: [
            { name: "highest_degree", label: "Diplôme le plus élevé", type: "select", options: DEGREES, required: true },
            { name: "experience_years", label: "Années d'expérience dans le métier", type: "number", required: true },
            { name: "previous_employer", label: "Dernier employeur" },
            { name: "languages", label: "Langues parlées", placeholder: "Français, anglais, éwé…" },
            { name: "availability", label: "Horaires possibles", type: "select", options: opt("Jour", "Nuit", "Jour et nuit", "Week-end") },
            { name: "cnss_number", label: "Numéro CNSS (si vous en avez un)" },
            { name: "cv_summary", label: "Résumé de votre expérience", type: "textarea", wide: true },
          ],
        },
        emergency,
      ];
    case "direction":
      return [
        identity,
        contact,
        idDoc,
        {
          title: "Fonction",
          fields: [
            { name: "highest_degree", label: "Diplôme le plus élevé", type: "select", options: DEGREES, required: true },
            { name: "experience_years", label: "Années d'expérience", type: "number", required: true },
            { name: "previous_employer", label: "Dernier employeur" },
            { name: "cnss_number", label: "Numéro CNSS" },
            { name: "cv_summary", label: "Résumé de votre parcours", type: "textarea", wide: true },
          ],
        },
        emergency,
      ];
    case "client":
      return [
        identity,
        {
          title: "Coordonnées",
          fields: [
            { name: "phone", label: "Téléphone", type: "tel", required: true },
            { name: "country", label: "Pays de résidence", required: true },
            { name: "city", label: "Ville", required: true },
            { name: "address", label: "Adresse", wide: true },
          ],
        },
        idDoc,
        {
          title: "Séjour",
          fields: [
            { name: "company", label: "Société / organisme (si séjour professionnel)" },
            { name: "stay_reason", label: "Motif du séjour", type: "select", options: opt("Tourisme", "Affaires", "Famille", "Événement", "Autre") },
            { name: "preferences", label: "Préférences (chambre, régime alimentaire…)", type: "textarea", wide: true },
          ],
        },
      ];
  }
}

/** Pièces à joindre selon le statut. */
export function documentSpecs(kind: MemberKind): DocSpec[] {
  switch (kind) {
    case "eleve":
      return [
        { key: "acte_naissance", label: "Acte de naissance", required: true },
        { key: "bulletins", label: "Derniers bulletins ou relevés de notes", required: true },
        { key: "diplome", label: "Dernier diplôme obtenu", required: false },
        { key: "certificat_medical", label: "Certificat médical", required: true },
      ];
    case "parent":
      return [{ key: "piece_identite", label: "Pièce d'identité", required: true }];
    case "professeur":
      return [
        { key: "cv", label: "CV", required: true },
        { key: "diplomes", label: "Diplômes et attestations", required: true },
        { key: "piece_identite", label: "Pièce d'identité", required: true },
        { key: "casier", label: "Extrait de casier judiciaire", required: false, hint: "Moins de 3 mois" },
      ];
    case "personnel":
      return [
        { key: "cv", label: "CV", required: true },
        { key: "piece_identite", label: "Pièce d'identité", required: true },
        { key: "diplomes", label: "Diplômes et certificats de travail", required: false },
        { key: "certificat_medical", label: "Certificat médical d'aptitude", required: true, hint: "Obligatoire pour la cuisine et le service" },
        { key: "casier", label: "Extrait de casier judiciaire", required: false },
      ];
    case "direction":
      return [
        { key: "cv", label: "CV", required: true },
        { key: "piece_identite", label: "Pièce d'identité", required: true },
        { key: "diplomes", label: "Diplômes", required: true },
      ];
    case "client":
      return [{ key: "piece_identite", label: "Pièce d'identité ou passeport", required: true }];
  }
}

/** Le statut demande-t-il un département et un poste ? */
export const needsPosition = (kind: MemberKind) => kind === "personnel" || kind === "direction" || kind === "professeur";

export const departmentFor = (kind: MemberKind): Department | null =>
  kind === "eleve" || kind === "parent" || kind === "professeur" ? "ecole" : kind === "direction" ? "direction" : kind === "client" ? "hotel" : null;

/** Champs obligatoires manquants (formulaire + pièces + photo). */
export function missingItems(kind: MemberKind, department: Department | null, positionCode: string | null, data: Record<string, unknown>, docs: UploadedDoc[], photo: string | null) {
  const missing: string[] = [];
  if (!photo) missing.push("Photo d'identité");
  if (needsPosition(kind) && !positionCode) missing.push("Poste occupé");
  if (kind === "personnel" && !department) missing.push("Lieu de travail (hôtel ou école)");
  for (const g of fieldGroups(kind, department))
    for (const f of g.fields) {
      const v = data[f.name];
      if (f.required && (v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === ""))) missing.push(f.label);
    }
  for (const d of documentSpecs(kind)) if (d.required && !docs.some((x) => x.key === d.key)) missing.push(d.label);
  return missing;
}

/** Photo au format passeport : 35 × 45 mm, rendue en 413 × 531 px (300 dpi), JPEG. */
export const PASSPORT = { width: 413, height: 531, ratio: 35 / 45 };
