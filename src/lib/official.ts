import type { CardSettings } from "@/lib/cms-types";

/**
 * Signature officielle des dossiers de l'école (cartes scolaires, fiches d'inscription, bulletins, billets, règlement) :
 * tampon de l'école et signature du Directeur pédagogique, apposés automatiquement.
 * Le nom, la signature et le tampon se remplacent dans « Gestion globale du site → Modèle des cartes ».
 */
export type OfficialSignatory = { title: string; name: string; signature: string; stamp: string };

export const OFFICIAL_SIGNATORY: OfficialSignatory = {
  title: "Le Directeur pédagogique",
  name: "Kodjo Messan DOGLO",
  signature: "/officiel/signature-dp.png",
  stamp: "/officiel/tampon-ecole.png",
};

export const officialSignatory = (cs?: CardSettings): OfficialSignatory => ({
  title: OFFICIAL_SIGNATORY.title,
  name: cs?.signatoryName?.trim() || OFFICIAL_SIGNATORY.name,
  signature: cs?.signatureImage || OFFICIAL_SIGNATORY.signature,
  stamp: cs?.stampImage || OFFICIAL_SIGNATORY.stamp,
});
