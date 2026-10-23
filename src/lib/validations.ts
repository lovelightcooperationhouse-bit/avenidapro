import { pingNotifications } from "@/lib/notify";
import { toPassportDataUrl } from "@/lib/pdf";
import { createClient } from "@/lib/supabase/client";

/** Actions finales soumises au contrôle du Directeur général. */
export type ValidationKind = "inscription" | "bulletins_envoi" | "cartes_validation" | "autre";

export const KIND_LABEL: Record<string, string> = {
  inscription: "Inscription définitive",
  bulletins_envoi: "Envoi de bulletins",
  cartes_validation: "Validation de cartes",
  autre: "Autre demande",
};

export type Validation = {
  id: string;
  kind: ValidationKind;
  title: string;
  details: string | null;
  payload: Record<string, unknown>;
  link: string | null;
  requester_name: string | null;
  requester_role: string | null;
  status: "en_attente" | "approuvee" | "refusee";
  decision_note: string | null;
  decided_at: string | null;
  created_at: string;
};

/** Soumet une action au DG : il est alerté immédiatement (espace, téléphone, e-mail). */
export async function submitToDG(v: { kind: ValidationKind; title: string; details?: string; payload?: Record<string, unknown>; link?: string }) {
  const { data: u } = await createClient().auth.getUser();
  const { error } = await createClient()
    .from("dg_validations")
    .insert({ kind: v.kind, title: v.title, details: v.details ?? null, payload: v.payload ?? {}, link: v.link ?? null, requested_by: u.user?.id });
  if (!error) pingNotifications();
  return error;
}

/** Exécute l'action approuvée par le DG ; renvoie le compte rendu (affiché au demandeur). */
export async function executeValidation(v: Validation): Promise<string> {
  const supabase = createClient();
  const p = v.payload;
  switch (v.kind) {
    case "inscription": {
      const { data, error } = await supabase.rpc("enroll_application", { app: String(p.app) });
      if (error) throw new Error(error.message);
      const r = data as { student_id: string; matricule?: string; already?: boolean };
      // Photo déposée avec la pré-inscription → fiche et carte
      const { data: doc } = await supabase.from("application_documents").select("file_path, file_name").eq("application_id", String(p.app)).eq("doc_type", "photo").limit(1).maybeSingle();
      if (doc && !/\.pdf$/i.test(doc.file_name ?? "")) {
        const { data: file } = await supabase.storage.from("dossiers").download(doc.file_path);
        if (file) await supabase.from("students").update({ photo_url: await toPassportDataUrl(file) }).eq("id", r.student_id);
      }
      return r.already ? "Élève déjà inscrit." : `Inscription définitive effectuée : matricule ${r.matricule}.`;
    }
    case "bulletins_envoi": {
      const { data, error } = await supabase.rpc("send_report_cards", { ids: p.ids as string[], by_email: !!p.by_email });
      if (error) throw new Error(error.message);
      return `${data} bulletin(s) envoyé(s) dans l'espace de l'élève et du tuteur${p.by_email ? ", avec un e-mail" : ""}.`;
    }
    case "cartes_validation": {
      for (const card of (p.cards as string[]) ?? []) {
        const { error } = await supabase.rpc("validate_card", { card });
        if (error) throw new Error(error.message);
      }
      return `${((p.cards as string[]) ?? []).length} carte(s) validée(s) et envoyée(s) au titulaire.`;
    }
    default:
      return "Demande approuvée.";
  }
}
