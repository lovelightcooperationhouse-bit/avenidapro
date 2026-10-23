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
      { title: "Fiche d'inscription et carte scolaire", text: "Votre fiche définitive (imprimable) et votre carte avec QR code. Quand l'école vous l'envoie pour vérification, confirmez ou signalez une erreur.", href: "/espace/carte" },
      { title: "Bulletins", text: "Vos bulletins signés par le Directeur pédagogique, dès que l'école les envoie : consultez, téléchargez en PDF, imprimez.", href: "/espace/bulletins" },
      { title: "Situation financière", text: "Vos paiements avec date et heure, l'échéancier et le reste à payer, à jour à chaque paiement.", href: "/espace/situation" },
      { title: "Règlement intérieur", text: "Lisez-le, téléchargez-le et signez votre engagement en ligne.", href: "/espace/reglement" },
      { title: "Mes documents", text: "Attestations, reçus, convocations envoyés par l'école ; vous pouvez aussi y déposer vos pièces.", href: "/espace/documents" },
    ],
  },
  parent: {
    id: "parent",
    title: "Guide du parent",
    intro: "Suivez la scolarité de vos enfants en toute transparence.",
    steps: [
      { title: "Rattacher vos enfants", text: "Indiquez leur matricule dans votre profil ; l'école valide le lien. Vous pouvez aussi rechercher un enfant par nom ou matricule.", href: "/espace/profil" },
      { title: "Suivi scolaire et paiements", text: "Notes, absences, paiements et reste à payer de chaque enfant ; fiche de situation financière téléchargeable.", href: "/espace/situation" },
      { title: "Bulletins et carte", text: "Les bulletins signés et la carte scolaire de vos enfants, dès que l'école les envoie.", href: "/espace/bulletins" },
      { title: "Règlement intérieur", text: "Signez votre engagement de parent en ligne.", href: "/espace/reglement" },
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
    id: "validations-dg",
    roles: ["directeur_general", "directeur_pedagogique", "comptable", "ressources_humaines", "responsable_hotel", "gestionnaire_site", "personnel"],
    title: "Le contrôle du Directeur général",
    intro: "Chacun travaille dans son rôle ; toute action finale est soumise au DG, en toute transparence.",
    steps: [
      { title: "Votre espace de travail", text: "Vous ne voyez que les modules de votre rôle, attribué par le DG. Le DG voit tout : statistiques, finances, personnel, hôtel et école." },
      { title: "Soumettre une action finale", text: "Inscription définitive, envoi des bulletins, validation des cartes : le bouton devient « Soumettre au DG ». Le DG reçoit une alerte instantanée (espace, téléphone, e-mail).", href: "/dashboard/validations" },
      { title: "Décision du DG", text: "« Validations du DG » : le DG vérifie, puis « Approuver et exécuter » (l'action part aussitôt) ou « Refuser » avec un motif.", href: "/dashboard/validations", cta: "Validations" },
      { title: "Retour au demandeur", text: "Vous êtes alerté dès la décision, dans votre espace, sur votre téléphone (notifications activées) et par e-mail." },
      { title: "Alertes sur le téléphone", text: "Installez l'application puis touchez « Activer » dans le bandeau « Ne manquez rien » : les alertes arrivent même site fermé." },
    ],
  },
  {
    id: "dg-demarrage",
    roles: ["directeur_general"],
    title: "Premiers pas du Directeur général",
    intro: "Configurer la plateforme et répartir les responsabilités.",
    steps: [
      { title: "1. Créer les comptes des responsables", text: "« Comptes, rôles & postes » → « Créer un compte » : directeur pédagogique, comptable, RH, directeur de l'hôtel. Choisissez le poste, le rôle se remplit seul.", href: "/dashboard/users", cta: "Comptes et rôles" },
      { title: "2. Vérifier les postes", text: "Onglet « Postes » : ajoutez les postes propres à Avenida (ex. chef de rang) et le rôle donné par défaut.", href: "/dashboard/users" },
      { title: "3. Valider les dossiers", text: "Les nouveaux membres complètent leur profil ; le service concerné donne son avis ; vous validez dans « Dossiers des membres » (onglet « Décision du DG »).", href: "/dashboard/adhesions" },
      { title: "4. Personnaliser le site", text: "Module « Site web » (ou un gestionnaire du site désigné) : publications, menus, pages, sections, coordonnées, réseaux, couleurs et statistiques de visite.", href: "/dashboard/site?tab=statistiques" },
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
    intro: "Du formulaire public à la carte scolaire, sous le contrôle du Directeur général.",
    steps: [
      { title: "1. Étudier la pré-inscription", text: "« École → Pré-inscriptions » : consultez le dossier et les pièces (œil pour voir, flèche pour télécharger), demandez des compléments ou acceptez.", href: "/dashboard/admissions" },
      { title: "2. Inscription définitive", text: "Pédagogie : « Soumettre l'inscription définitive au DG ». Le DG est alerté immédiatement ; à son accord, la base crée l'élève dans sa filière, le matricule, l'écolage et la carte (en brouillon). Le DG peut inscrire directement." },
      { title: "3. Fiche d'inscription", text: "Bouton « Fiche d'inscription » : imprimer, PDF, envoi à l'élève et au tuteur quand vous le décidez.", href: "/dashboard/eleves" },
      { title: "4. Dossier de l'élève", text: "« Élèves par filière » → icône personne : informations modifiables (dont la personne à prévenir), paiements, documents, bulletins, carte, assiduité.", href: "/dashboard/eleves" },
      { title: "5. Carte scolaire", text: "« Cartes scolaires » → crayon « Modifier » pour corriger tous les éléments, « Envoyer pour vérification » à la famille, puis « Valider et envoyer » : soumis au DG, la carte n'arrive dans l'espace qu'après son accord. Rien n'est envoyé automatiquement.", href: "/dashboard/cartes" },
    ],
  },
  {
    id: "notes-bulletins",
    roles: ["directeur_general", "directeur_pedagogique"],
    title: "Notes et bulletins",
    intro: "Le modèle officiel : préparé, vérifié, signé, puis envoyé sur décision.",
    steps: [
      { title: "1. Matières et coefficients", text: "« Notes & bulletins » → onglet 1 : la maquette du bulletin (matières générales, technologiques, pratiques, coefficients, professeurs), commune ou propre à une filière.", href: "/dashboard/notes" },
      { title: "2. Saisie des notes", text: "Onglet 2 : classe, semestre, matière ; pour chaque élève la moyenne de classe et la note de composition (cases jaunes). Moyennes, produits, rangs, classement et appréciations se calculent automatiquement." },
      { title: "3. Vérifier", text: "Onglet 3 : ouvrez chaque « Bulletin A4 » (mention PROVISOIRE), contrôlez la situation d'écolage de l'élève, « Corriger » en cas de réclamation (toute la classe est recalculée)." },
      { title: "4. Conseil et signature", text: "Choisissez la décision du conseil, sélectionnez les bulletins puis « Valider et signer » (Directeur pédagogique). Toujours aucun envoi." },
      { title: "5. Envoi", text: "Sélectionnez les bulletins signés → « Soumettre l'envoi au DG » (ou « Envoyer » pour le DG) : espace de l'élève et du tuteur, avec ou sans e-mail. Le PDF peut aussi être envoyé à une adresse précise depuis le bulletin A4." },
      { title: "6. Résultats", text: "Onglet 4 : procès-verbal par classe ou par filière, téléchargeable, imprimable et archivable. Le QR code de chaque bulletin signé prouve son authenticité." },
    ],
  },
  {
    id: "annuaire",
    roles: ["directeur_general", "directeur_pedagogique", "ressources_humaines"],
    title: "Annuaire, rôles et règlement",
    intro: "L'équipe de l'établissement, les rôles proposés et les signatures du règlement.",
    steps: [
      { title: "Annuaire", text: "Ajoutez ou modifiez l'administration et les professeurs (fonction, matières, téléphones). Le site public affiche les noms sans les numéros ; les espaces affichent les numéros.", href: "/dashboard/annuaire" },
      { title: "Rôles proposés", text: "Un rôle est proposé selon le poste ; seul le DG le valide (et peut créer le compte avec une adresse e-mail)." },
      { title: "Règlement intérieur", text: "Envoyé à chaque élève inscrit et à ses parents ; suivez qui a signé son engagement en ligne." },
    ],
  },
  {
    id: "archives",
    roles: ["directeur_general", "directeur_pedagogique", "comptable", "ressources_humaines", "responsable_hotel"],
    title: "Vérifier et archiver les dossiers",
    intro: "Chaque pièce reçue se consulte, se télécharge, puis s'archive une fois vérifiée.",
    steps: [
      { title: "Consulter", text: "Dans les pré-inscriptions, dossiers des membres et permissions, l'icône œil ouvre un aperçu (photo ou PDF) ; la flèche télécharge le document." },
      { title: "Archiver", text: "« Vérifier et archiver » copie toutes les pièces dans les archives avec les informations du dossier. Même bouton pour les demandes traitées, les fiches d'inscription, les cartes et les bulletins." },
      { title: "Retrouver", text: "« Accueil → Archives » : recherche par nom, matricule ou référence, filtre par type et par année, aperçu et téléchargement de chaque fichier.", href: "/dashboard/archives" },
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
    id: "site-web",
    roles: ["directeur_general", "gestionnaire_site"],
    title: "Gérer le site web",
    intro: "Module « Site web » : tout le contenu et l'apparence du site public, sans toucher au code.",
    steps: [
      { title: "Vue d'ensemble", text: "Visites du jour, de la période et depuis le lancement, pages les plus consultées, tableau par jour, appareils utilisés.", href: "/dashboard/site?tab=statistiques" },
      { title: "Publications", text: "Articles, annonces, événements, albums photo et vidéos, avec boutons de partage sur les réseaux ; possibilité de prévenir les membres.", href: "/dashboard/site?tab=publications" },
      { title: "Menus et pages", text: "Ajoutez, renommez, réordonnez ou masquez menus et sous-menus ; créez des pages et ajoutez des sections (texte, image, vidéo, galerie, bouton).", href: "/dashboard/site?tab=menus" },
      { title: "Accueil", text: "Masquez ou réaffichez les sections de l'accueil ; modifiez le diaporama et le bandeau d'annonce.", href: "/dashboard/site?tab=accueil" },
      { title: "Coordonnées, réseaux et couleurs", text: "Téléphones, e-mail, adresse, localisation, numéro WhatsApp, liens TikTok, Facebook… et couleurs du site, avec aperçu avant publication.", href: "/dashboard/site?tab=coordonnees" },
      { title: "Lettre d'information", text: "Liste des abonnés, export Excel.", href: "/dashboard/site?tab=abonnes" },
      { title: "Attribuer le rôle", text: "Le DG crée le compte avec le poste « Gestionnaire du site web / communication » : cette personne n'a accès qu'au module Site web, aux discussions et aux réunions.", href: "/dashboard/users" },
    ],
  },
  {
    id: "finances",
    roles: ["directeur_general", "comptable"],
    title: "Finances et économat",
    intro: "Chaque mouvement est enregistré, synchronisé et signalé au Directeur général.",
    steps: [
      { title: "Encaisser l'écolage", text: "« Écolage » : « Encaisser » sur la ligne de l'élève (espèces, T-Money, Flooz, virement…). Le reste à payer se recalcule, le reçu avec QR code s'imprime, la fiche de situation se met à jour et le DG est alerté.", href: "/dashboard/ecolage" },
      { title: "Fiche de situation", text: "Icône tableau sur la ligne de l'élève : paiements avec date et heure, échéancier, reste à payer ; PDF, image, impression, envoi à la famille.", href: "/dashboard/ecolage" },
      { title: "Dépenses et recettes", text: "« Finances & dépenses » : enregistrez chaque décaissement ou recette avec sa pièce. Le DG reçoit une alerte instantanée ; les totaux et la trésorerie sont réservés au DG.", href: "/dashboard/finances" },
      { title: "Économat", text: "Achats, entrées, sorties, stock et budget par département.", href: "/dashboard/economat" },
      { title: "Statistiques (DG)", text: "Seul le DG voit les totaux d'entrées et de sorties, les rapports financiers et le pilotage.", href: "/dashboard/pilotage" },
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
