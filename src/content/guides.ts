import type { RoleType } from "@/lib/roles";

/**
 * Guides d'utilisation de la plateforme Avenida : pour chaque membre (espace personnel)
 * et pour les responsables (espace de gestion).
 */

export type GuideStep = { title: string; text: string; href?: string; cta?: string };
export type Guide = { id: string; title: string; intro: string; steps: GuideStep[] };

/* ───────────────────────── Membres ───────────────────────── */

export const startGuide: Guide = {
  id: "demarrer",
  title: "Bien démarrer",
  intro: "Trois étapes pour activer votre espace.",
  steps: [
    { title: "Complétez votre profil", text: "Choisissez votre statut (élève, parent, professeur, personnel, client…), ajoutez une photo d'identité au format passeport et remplissez le formulaire : il s'adapte à votre statut.", href: "/espace/profil", cta: "Mon profil" },
    { title: "Joignez les pièces demandées", text: "La liste des pièces s'affiche automatiquement (acte de naissance, bulletins, CV, pièce d'identité…). Format PDF ou photo, 20 Mo maximum par fichier." },
    { title: "Envoyez votre dossier", text: "Le service concerné l'examine, puis le Directeur général valide et vous attribue votre rôle. Vous êtes prévenu(e) dans votre espace (cloche) et par e-mail ; votre espace s'ouvre alors entièrement." },
  ],
};

export const memberGuides: Partial<Record<RoleType, Guide>> = {
  eleve: {
    id: "eleve",
    title: "Guide de l'élève",
    intro: "Tout votre parcours à Avenida, au même endroit.",
    steps: [
      { title: "Mon espace", text: "Vos notes, absences, paiements et le solde restant, avec les alertes de paiement.", href: "/espace" },
      { title: "Espace École", text: "La salle de votre filière : annonces, cours, devoirs à rendre, programme, discussion de classe et cours en direct.", href: "/espace/ecole" },
      { title: "Correspondance", text: "Vos présences, retards, absences et permissions, mis à jour à chaque appel.", href: "/espace/correspondance" },
      { title: "Fiche d'inscription et carte scolaire", text: "Votre fiche définitive (imprimable) et votre carte avec QR code, toujours à jour.", href: "/espace/carte" },
      { title: "Mes documents", text: "Attestations, reçus, convocations envoyés par l'école ; vous pouvez aussi y déposer vos pièces.", href: "/espace/documents" },
    ],
  },
  parent: {
    id: "parent",
    title: "Guide du parent",
    intro: "Suivez la scolarité de vos enfants en toute transparence.",
    steps: [
      { title: "Rattacher vos enfants", text: "Indiquez leur matricule dans votre profil ; l'école valide le lien. Vous pouvez aussi rechercher un enfant par nom ou matricule.", href: "/espace/profil" },
      { title: "Suivi scolaire et paiements", text: "Notes, absences, paiements et reste à payer de chaque enfant.", href: "/espace" },
      { title: "Correspondance et permissions", text: "Vous êtes prévenu(e) de chaque absence ou retard. Demandez une permission avec justificatif : la réponse arrive dans votre espace.", href: "/espace/correspondance" },
      { title: "Échanger avec l'école", text: "Écrivez ou appelez les professeurs de vos enfants et l'administration depuis « Discussions ».", href: "/discussions" },
    ],
  },
  professeur: {
    id: "professeur",
    title: "Guide du professeur",
    intro: "Vos classes, vos cours et vos échanges.",
    steps: [
      { title: "Espace École", text: "Publiez annonces, cours, devoirs (avec date limite), programme ; corrigez et notez les devoirs rendus.", href: "/espace/ecole" },
      { title: "Cours en direct", text: "Dans la salle de la filière, onglet « Cours en direct » : vous seul pouvez démarrer la visio, les élèves la rejoignent.", href: "/espace/ecole" },
      { title: "Faire l'appel", text: "Présent, absent ou en retard : les familles sont prévenues automatiquement.", href: "/espace/correspondance" },
      { title: "Groupes de travail et réunions", text: "Créez un groupe avec vos collègues ou une classe, planifiez une réunion pédagogique.", href: "/reunions" },
    ],
  },
  personnel: {
    id: "personnel",
    title: "Guide du personnel",
    intro: "Votre service, vos consignes et votre carte de travail.",
    steps: [
      { title: "Espace Hôtel", text: "Consignes, plannings, documents et réunions de votre service (réception, restaurant, cuisine, étages…).", href: "/espace/hotel" },
      { title: "Carte de travail", text: "Votre carte avec matricule et QR code, à présenter sur demande.", href: "/espace/carte" },
      { title: "Mes documents", text: "Contrat, attestations, bulletins de paie envoyés par les RH.", href: "/espace/documents" },
    ],
  },
  client: {
    id: "client",
    title: "Guide du client de l'hôtel",
    intro: "Vos séjours à l'Hôtel Avenida.",
    steps: [
      { title: "Mes demandes de séjour", text: "Suivez vos demandes de réservation et faites-en de nouvelles.", href: "/espace" },
      { title: "Échanger avec la réception", text: "Posez vos questions depuis « Discussions ».", href: "/discussions" },
      { title: "Mes documents", text: "Factures et confirmations envoyées par l'hôtel.", href: "/espace/documents" },
    ],
  },
};

export const commonGuides: Guide[] = [
  {
    id: "discussions",
    title: "Discussions, appels et groupes",
    intro: "Une messagerie comme WhatsApp, réservée à l'établissement.",
    steps: [
      { title: "Nouvelle discussion", text: "Bouton « + » : choisissez un contact. Vous ne voyez que les personnes avec qui vous avez le droit d'échanger (vos professeurs, l'administration, votre service…).", href: "/discussions" },
      { title: "Photos, vidéos, documents, vocaux", text: "Trombone pour joindre un fichier ; micro pour enregistrer un message vocal, puis flèche pour l'envoyer. Les coches bleues indiquent que le message est lu." },
      { title: "Appels audio et vidéo", text: "Icônes téléphone et caméra en haut de la discussion. Le correspondant reçoit une sonnerie sur la plateforme ; dans un groupe, l'appel ouvre une salle de visio commune." },
      { title: "Groupes de travail", text: "Icône « groupe » : nommez le groupe, choisissez les membres. L'administrateur du groupe peut en ajouter d'autres." },
    ],
  },
  {
    id: "reunions",
    title: "Réunions en visioconférence",
    intro: "Comme Zoom ou Google Meet, intégré à la plateforme.",
    steps: [
      { title: "Réunion immédiate", text: "« Réunion immédiate » ouvre la salle et copie le lien à partager.", href: "/reunions" },
      { title: "Planifier", text: "Titre, date, durée, participants ou groupe : chacun reçoit l'invitation dans son espace et par e-mail." },
      { title: "Pendant la réunion", text: "Micro, caméra, partage d'écran, discussion, lever la main. « Quitter » pour sortir." },
    ],
  },
  {
    id: "application",
    title: "Installer l'application",
    intro: "Avenida s'installe comme une application, sans passer par un magasin d'applications.",
    steps: [
      { title: "Android (Chrome)", text: "Ouvrez le site, touchez « Installer » dans le bandeau, ou menu ⋮ → « Installer l'application »." },
      { title: "iPhone et iPad (Safari)", text: "Touchez le bouton Partager (carré avec une flèche) → « Sur l'écran d'accueil » → « Ajouter »." },
      { title: "Ordinateur (Chrome, Edge)", text: "Icône d'installation à droite de la barre d'adresse, ou menu → « Installer Avenida »." },
    ],
  },
  {
    id: "securite",
    title: "Sécurité de votre compte",
    intro: "Quelques règles simples.",
    steps: [
      { title: "Mot de passe", text: "Au moins 8 caractères, à ne jamais partager. Changez-le depuis « Mot de passe ».", href: "/espace/mot-de-passe" },
      { title: "Connexion Google", text: "Vous pouvez vous connecter avec Google si votre adresse est la même que celle donnée à l'école." },
      { title: "Notifications", text: "La cloche affiche les alertes de l'administration, les absences, paiements, permissions et invitations.", href: "/espace/notifications" },
    ],
  },
];

/* ───────────────────────── Gestion ───────────────────────── */

export const adminWorkflows: (Guide & { roles: RoleType[] })[] = [
  {
    id: "dg-demarrage",
    roles: ["directeur_general"],
    title: "Premiers pas du Directeur général",
    intro: "Configurer la plateforme et répartir les responsabilités.",
    steps: [
      { title: "1. Créer les comptes des responsables", text: "« Comptes, rôles & postes » → « Créer un compte » : directeur pédagogique, comptable, RH, directeur de l'hôtel. Choisissez le poste, le rôle se remplit seul.", href: "/dashboard/users", cta: "Comptes et rôles" },
      { title: "2. Vérifier les postes", text: "Onglet « Postes » : ajoutez les postes propres à Avenida (ex. chef de rang) et le rôle donné par défaut.", href: "/dashboard/users" },
      { title: "3. Valider les dossiers", text: "Les nouveaux membres complètent leur profil ; le service concerné donne son avis ; vous validez dans « Dossiers des membres » (onglet « Décision du DG »).", href: "/dashboard/adhesions" },
      { title: "4. Personnaliser le site", text: "« Site web : contenu » : diaporama, bandeau d'annonce, menus, pages, sections, actualités et réseaux sociaux.", href: "/dashboard/site" },
      { title: "5. Activer e-mails et SMS", text: "Ajoutez les clés Resend et Twilio dans Vercel pour que les alertes partent aussi par e-mail et SMS." },
      { title: "6. Piloter", text: "« Pilotage & rapports » : chiffres du jour, de la semaine, du mois, exportables et imprimables.", href: "/dashboard/pilotage" },
    ],
  },
  {
    id: "dossiers",
    roles: ["directeur_general", "directeur_pedagogique", "ressources_humaines", "responsable_hotel", "comptable"],
    title: "Traiter un dossier de membre",
    intro: "Chaque demande est suivie jusqu'à la décision.",
    steps: [
      { title: "Recevoir", text: "Un dossier envoyé apparaît dans « À examiner » et vous êtes notifié(e). Pédagogie : élèves, parents, professeurs · RH : personnel, direction, professeurs · Hôtel : personnel de l'hôtel, clients.", href: "/dashboard/adhesions" },
      { title: "Examiner", text: "Photo, informations, pièces (voir / télécharger), formulaire complet imprimable." },
      { title: "Donner l'avis", text: "« Demander des compléments » renvoie le dossier au membre avec votre message. « Avis favorable / défavorable » le transmet au DG." },
      { title: "Décision du DG", text: "Le DG valide : rôle attribué, fiche élève / salarié / client créée, matricule et carte générés, membre prévenu. Il peut aussi refuser ou demander des compléments." },
      { title: "Envoyer des documents", text: "Onglet « Classeur du membre » : envoyez fiche, attestation, reçu, contrat… Le membre le reçoit dans « Mes documents »." },
    ],
  },
  {
    id: "inscriptions",
    roles: ["directeur_general", "directeur_pedagogique"],
    title: "Pré-inscriptions, inscriptions et cartes",
    intro: "Du formulaire public à la carte scolaire.",
    steps: [
      { title: "Pré-inscriptions du site", text: "« École → Pré-inscriptions » : étudiez le dossier et les pièces, acceptez, puis « Valider l'inscription définitive ». La base crée l'élève dans sa filière et sa classe, le matricule, l'écolage de la filière, la carte scolaire, et rattache les comptes de l'élève et du tuteur.", href: "/dashboard/admissions" },
      { title: "Fiche d'inscription A4", text: "Bouton « Fiche d'inscription » : imprimer, télécharger en PDF, ou envoyer par e-mail à l'élève et au tuteur ; elle arrive aussi dans « Mes documents » de leurs espaces.", href: "/dashboard/eleves" },
      { title: "Élèves par filière", text: "Tous les inscrits classés par filière et par classe, avec écolage, absences et carte en temps réel.", href: "/dashboard/eleves" },
      { title: "Cartes", text: "« Cartes & badges » : émettre, mettre à jour, régénérer le QR, révoquer, imprimer par lot. Cartes de correspondance depuis le dossier de l'élève.", href: "/dashboard/cartes" },
    ],
  },
  {
    id: "correspondance",
    roles: ["directeur_general", "directeur_pedagogique"],
    title: "Correspondance et permissions",
    intro: "Présences, retards, absences et demandes des parents.",
    steps: [
      { title: "Appel", text: "Les professeurs font l'appel ; vous pouvez le faire pour toutes les classes. Les familles sont prévenues.", href: "/dashboard/correspondance" },
      { title: "Permissions", text: "Consultez le justificatif, acceptez ou refusez avec un message ; la réponse arrive chez le parent." },
    ],
  },
  {
    id: "alertes",
    roles: ["directeur_general", "directeur_pedagogique", "comptable", "ressources_humaines", "responsable_hotel"],
    title: "Alertes et annonces",
    intro: "Prévenir les bonnes personnes, sur le bon canal.",
    steps: [
      { title: "Alerte ciblée", text: "Un rôle, une filière, une classe ou une personne ; espace + e-mail + SMS au choix. Seul le DG écrit à tout l'établissement.", href: "/dashboard/alertes" },
      { title: "Publication sur le site", text: "Le DG publie articles, annonces, photos et vidéos, partageables sur les réseaux ; il peut prévenir les membres en même temps.", href: "/dashboard/site" },
    ],
  },
  {
    id: "finances",
    roles: ["directeur_general", "comptable"],
    title: "Finances et économat",
    intro: "Encaissements, dépenses, stock et budgets.",
    steps: [
      { title: "Écolage", text: "« Écolage & finances → Écolage » : chaque élève inscrit y figure avec l'écolage de sa filière. « Encaisser » enregistre un acompte (espèces, T-Money, Flooz, virement…) : le reste à payer est recalculé automatiquement sur le matricule, le reçu s'imprime et la famille est prévenue.", href: "/dashboard/ecolage" },
      { title: "Bourses et remises", text: "Crayon sur la ligne de l'élève : modifiez l'écolage annuel, le reste se recalcule.", href: "/dashboard/ecolage" },
      { title: "Économat", text: "Achats, entrées, sorties, stock restant et budget mensuel / annuel par département.", href: "/dashboard/economat" },
    ],
  },
  {
    id: "rh",
    roles: ["directeur_general", "ressources_humaines"],
    title: "Ressources humaines",
    intro: "Dossiers du personnel et cartes de travail.",
    steps: [
      { title: "Personnel", text: "Fiches, contrats, salaires ; dossiers RH avec CV et pièces.", href: "/dashboard/employees" },
      { title: "Cartes de travail", text: "Émises à la validation du dossier, mises à jour dans « Cartes & badges ».", href: "/dashboard/cartes" },
    ],
  },
  {
    id: "hotel",
    roles: ["directeur_general", "responsable_hotel"],
    title: "Hôtel",
    intro: "Réservations, chambres, clients et équipes.",
    steps: [
      { title: "Demandes du site", text: "Réservations et contacts reçus en ligne, à traiter et suivre.", href: "/dashboard/demandes" },
      { title: "Espace Hôtel", text: "Une salle par service : consignes, plannings, documents, réunions.", href: "/espace/hotel" },
    ],
  },
];
