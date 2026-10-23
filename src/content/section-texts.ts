/**
 * Titres de section du site (sur-titre, titre, introduction) modifiables dans « Gestion globale du site › Textes des pages ».
 * Liste générée à partir des pages ; le texte entre [crochets] est mis en valeur.
 */
export type SectionText = { id: string; page: string; pageLabel: string; eyebrow: string; title: string; description: string };

export const SECTION_TEXTS: SectionText[] = [
  {
    "id": "about-title",
    "page": "accueil",
    "pageLabel": "Accueil",
    "eyebrow": "Qui sommes-nous",
    "title": "L'excellence, [notre passion]",
    "description": ""
  },
  {
    "id": "formations-title",
    "page": "accueil",
    "pageLabel": "Accueil",
    "eyebrow": "Au menu 2026-2027",
    "title": "Cinq diplômes pour [réussir]",
    "description": "Inscription dès 10 000 F, scolarité en 8 tranches, bourses sur étude de dossier. Choisissez votre niveau :"
  },
  {
    "id": "pedagogy-title",
    "page": "accueil",
    "pageLabel": "Accueil",
    "eyebrow": "Notre pédagogie",
    "title": "Apprendre dans un [vrai hôtel]",
    "description": ""
  },
  {
    "id": "steps-title",
    "page": "accueil",
    "pageLabel": "Accueil",
    "eyebrow": "Admission",
    "title": "Votre inscription en [4 étapes]",
    "description": "Tout se fait en ligne : vous suivez votre dossier et échangez avec l'école depuis votre espace personnel."
  },
  {
    "id": "graduates-title",
    "page": "accueil",
    "pageLabel": "Accueil",
    "eyebrow": "Nos diplômés",
    "title": "Ils sont devenus des [professionnels]",
    "description": "Chaque année, nos diplômés rejoignent hôtels, restaurants et agences de voyage, ou créent leur propre activité."
  },
  {
    "id": "hotel-title",
    "page": "accueil",
    "pageLabel": "Accueil",
    "eyebrow": "L'Hôtel Avenida",
    "title": "Séjournez, dînez, [soutenez] la formation",
    "description": "Chaque séjour et chaque repas permettent à nos élèves de se former au contact de vrais clients."
  },
  {
    "id": "faq-title",
    "page": "accueil",
    "pageLabel": "Accueil",
    "eyebrow": "Questions fréquentes",
    "title": "Vous avez des [questions] ?",
    "description": "Les réponses aux questions les plus posées par les familles. Une autre question ? Écrivez-nous."
  },
  {
    "id": "ecole-formations-title",
    "page": "ecole",
    "pageLabel": "L'École",
    "eyebrow": "Tableau des formations 2026-2027",
    "title": "Choisissez votre [diplôme]",
    "description": "Chaque niveau correspond à un niveau de recrutement et à une durée de formation. Les bourses sont attribuées sur étude de dossier."
  },
  {
    "id": "summary-title",
    "page": "ecole",
    "pageLabel": "L'École",
    "eyebrow": "En un coup d'œil",
    "title": "Niveaux, durées et frais",
    "description": ""
  },
  {
    "id": "specialties-title",
    "page": "ecole",
    "pageLabel": "L'École",
    "eyebrow": "Nos spécialités",
    "title": "Trois grands métiers, [huit spécialités]",
    "description": ""
  },
  {
    "id": "action-title",
    "page": "ecole",
    "pageLabel": "L'École",
    "eyebrow": "Nos élèves en action",
    "title": "Apprendre en [pratiquant]",
    "description": "Ateliers de cuisine et de pâtisserie, service en salle, hygiène : la formation se vit chaque jour dans nos cuisines et notre restaurant d'application."
  },
  {
    "id": "ecole-pedagogy-title",
    "page": "ecole",
    "pageLabel": "L'École",
    "eyebrow": "Notre pédagogie",
    "title": "Apprendre dans un [vrai hôtel]",
    "description": ""
  },
  {
    "id": "schedule-title",
    "page": "ecole",
    "pageLabel": "L'École",
    "eyebrow": "Horaires des cours",
    "title": "Cours du jour ou [cours du soir]",
    "description": "Choisissez la formule qui vous convient : en journée pour les élèves, en soirée pour celles et ceux qui travaillent déjà."
  },
  {
    "id": "admissions-steps-title",
    "page": "admissions",
    "pageLabel": "Admissions",
    "eyebrow": "Comment s'inscrire",
    "title": "Quatre étapes, [en ligne]",
    "description": ""
  },
  {
    "id": "intakes-title",
    "page": "admissions",
    "pageLabel": "Admissions",
    "eyebrow": "Calendrier",
    "title": "Trois rentrées dans l'année",
    "description": "Valables pour toutes les formations, du CFA au BTS."
  },
  {
    "id": "fees-title",
    "page": "admissions",
    "pageLabel": "Admissions",
    "eyebrow": "Frais de formation",
    "title": "Frais d'inscription et de scolarité",
    "description": "Montants en francs CFA, pour l'année scolaire 2026-2027."
  },
  {
    "id": "rooms-title",
    "page": "hotel",
    "pageLabel": "L'Hôtel",
    "eyebrow": "Nos chambres",
    "title": "Quatre catégories de [chambres]",
    "description": "De la chambre standard à la suite présidentielle, chaque chambre est préparée avec le soin enseigné à nos élèves. Tarifs sur demande."
  },
  {
    "id": "services-title",
    "page": "hotel",
    "pageLabel": "L'Hôtel",
    "eyebrow": "Restaurant & services",
    "title": "Le savoir-faire de nos [élèves] à votre table",
    "description": ""
  },
  {
    "id": "gallery-title",
    "page": "hotel",
    "pageLabel": "L'Hôtel",
    "eyebrow": "L'hôtel en images",
    "title": "Chambres, bar et [salle de conférence]",
    "description": "Des chambres rénovées, un bar-salon, une salle de réunion équipée : découvrez l'établissement tel qu'il est."
  },
  {
    "id": "story-title",
    "page": "a-propos",
    "pageLabel": "À propos",
    "eyebrow": "Notre établissement",
    "title": "Apprendre dans un [vrai hôtel]",
    "description": ""
  },
  {
    "id": "values-title",
    "page": "a-propos",
    "pageLabel": "À propos",
    "eyebrow": "Notre devise",
    "title": "",
    "description": ""
  },
  {
    "id": "identity-title",
    "page": "a-propos",
    "pageLabel": "À propos",
    "eyebrow": "Notre identité",
    "title": "Un uniforme, une [fierté]",
    "description": "Losanges bleus, liserés rouges, fleurs de lys, toques et couverts : le tissu Avenida habille nos élèves en cuisine, en salle et le jour de la remise des diplômes."
  },
  {
    "id": "team-title",
    "page": "a-propos",
    "pageLabel": "À propos",
    "eyebrow": "Notre équipe",
    "title": "L'administration et le [corps professoral]",
    "description": "Une équipe de direction et des professeurs issus du métier, qui accompagnent chaque apprenant de l'atelier au diplôme."
  }
];
