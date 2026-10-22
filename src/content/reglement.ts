/**
 * Règlement intérieur des apprenants (carnet de correspondance), transcrit du document officiel.
 * Les passages entre ** ** sont en gras. Changer `REGLEMENT_VERSION` demande une nouvelle signature à chaque famille.
 */
export const REGLEMENT_VERSION = "2026-2027";

export type ReglementBlock = string | { list: string[]; ordered?: boolean };
export type ReglementArticle = { title: string; blocks: ReglementBlock[] };
export type ReglementChapter = { title: string; articles: ReglementArticle[] };

export const reglementPreambule: ReglementBlock[] = [
  "L'Hôtel École AVENIDA abrite un centre pédagogique et un hôtel d'application. Il forme les apprenants aux métiers de l'hôtellerie, de la restauration et les prépare aux exigences de ces professions : ponctualité, rigueur, respect, hygiène, présentation soignée et sens du service.",
  "Le présent règlement fixe les règles de vie, de travail et de discipline applicables à tous les apprenants, à l'école comme lors des activités pratiques et des stages. Le carnet de correspondance est le moyen officiel de communication entre l'établissement, l'apprenant et sa famille. L'apprenant doit l'avoir avec lui chaque jour, le conserver en bon état et le présenter à toute demande d'un membre du personnel.",
];

export const reglementChapitres: ReglementChapter[] = [
  {
    title: "Chapitre I — Admission et engagement",
    articles: [
      {
        title: "Article 1 — Conditions d'admission",
        blocks: [
          "L'admission à l'Hôtel École AVENIDA est soumise aux conditions fixées par l'établissement. Selon la filière, le candidat est appelé à :",
          {
            list: [
              "Participer à un test de recrutement ;",
              "Fournir un certificat médical établi par un professionnel de santé habilité ;",
              "Justifier de l'âge et du niveau scolaire requis pour la formation choisie ;",
              "Fournir les pièces administratives demandées.",
            ],
          },
        ],
      },
      {
        title: "Article 2 — Engagement de l'apprenant et de sa famille",
        blocks: [
          "L'inscription vaut engagement à respecter le présent règlement. L'apprenant et son parent ou tuteur sont invités à en prendre connaissance et à signer la déclaration d'adhésion figurant à la fin du carnet.",
        ],
      },
    ],
  },
  {
    title: "Chapitre II — Organisation de la formation",
    articles: [
      {
        title: "Article 3 — Cours et activités pratiques",
        blocks: [
          "La formation comprend des enseignements théoriques et pratiques, organisés selon l'emploi du temps communiqué par l'établissement. Les activités peuvent concerner notamment :",
          { list: ["La réception et les étages ;", "Lingerie et buanderie ;", "Le restaurant et le bar ;", "La cuisine et la pâtisserie ;", "La boucherie et la charcuterie ;", "Les formations modulaires."] },
          "Les apprenants doivent se présenter aux cours, travaux pratiques, évaluations, stages et autres activités obligatoires.",
        ],
      },
    ],
  },
  {
    title: "Chapitre III — De l'assiduité, de la ponctualité et des absences",
    articles: [
      {
        title: "Article 4 — Horaires et ponctualité",
        blocks: [
          "Les horaires sont fixés par l'établissement et communiqués aux apprenants. Sauf indication contraire, les apprenants doivent être présents à **7 h précises** pour les tâches de préparation et de propreté. Les cours théoriques commencent à **7 h 30** ; les travaux pratiques suivent les horaires prévus par le service concerné.",
          "Les cours d'éducation physique sont obligatoires sauf sur présentation d'une dispense délivrée par un médecin certifié.",
          {
            list: [
              "La ponctualité est une obligation fondamentale à l'Hôtel École AVENIDA.",
              "Tout étudiant ou stagiaire doit se présenter à l'établissement à l'heure fixée par l'administration et être prêt à commencer les cours ou les travaux pratiques à l'heure prévue.",
              "Les retards doivent être signalés et justifiés auprès du responsable compétent.",
              "L'accès au cours après le début de celui-ci peut être soumis à la présentation d'une autorisation.",
            ],
          },
          "Retards injustifiés et répétés peuvent entraîner des sanctions disciplinaires.",
        ],
      },
      {
        title: "Article 5 — Absences et autorisations de sortie",
        blocks: [
          "Toute absence doit être signalée et justifiée par le parent ou le tuteur dans les meilleurs délais. Une absence ne dispense pas l'apprenant de se renseigner sur les cours, devoirs ou travaux à rattraper.",
          {
            list: [
              "La présence à tous les cours théoriques, travaux pratiques, évaluations, séances de mise en situation professionnelle et autres activités pédagogiques obligatoires est exigée.",
              "Aucun étudiant ou stagiaire ne peut décider de s'absenter ou de quitter une activité pédagogique sans autorisation.",
              "Toute absence prévisible doit faire l'objet d'une demande d'autorisation auprès du Directeur pédagogique ou du Surveillant général.",
            ],
          },
          "En cas d'urgence ou de maladie, l'administration doit être informée dans les meilleurs délais.",
          "Toute autorisation accordée est consignée dans les documents de suivi prévus à cet effet.",
          "Les absences doivent être justifiées au moyen des pièces appropriées lorsque celles-ci sont requises.",
          "Aucun apprenant ne peut quitter l'établissement pendant les heures de formation sans autorisation préalable du Surveillant général ou de la Direction pédagogique. Toute sortie autorisée doit être inscrite ou justifiée selon la procédure de l'établissement.",
          "Les absences répétées ou prolongées peuvent compromettre la progression et la validation de la formation. Elles sont examinées par la Direction, qui tient compte des justificatifs et des règles applicables.",
        ],
      },
    ],
  },
  {
    title: "Chapitre IV — Évaluation",
    articles: [
      {
        title: "Article 6 — Évaluations et contrôles des connaissances",
        blocks: [
          "La participation à toutes les évaluations et à tous les contrôles de connaissances organisés par l'Hôtel École AVENIDA est **obligatoire pour tous les apprenants**, aussi bien en enseignement théorique qu'en formation pratique.",
          "Ces évaluations et contrôles permettent d'apprécier le niveau d'acquisition des connaissances et des compétences professionnelles de chaque apprenant, de suivre sa progression et de déterminer son aptitude à poursuivre sa formation.",
          "À ce titre :",
          {
            list: [
              "Les apprenants de première année doivent satisfaire aux exigences pédagogiques et aux évaluations prévues pour être autorisés à passer en deuxième année.",
              "Les apprenants de deuxième année doivent satisfaire aux exigences de formation et de contrôle des connaissances requises pour être présentés aux examens officiels.",
            ],
          },
          "Tout apprenant absent à une évaluation ou à un contrôle est tenu de justifier son absence auprès de l'administration. Toute absence non justifiée est considérée comme un manquement aux obligations pédagogiques.",
          "**Toute évaluation ou tout contrôle non effectué pourra faire l'objet d'une épreuve de rattrapage, moyennant le paiement de cinq mille (5 000) francs CFA par matière**, selon les modalités fixées par l'administration.",
          "Le rattrapage est organisé conformément au calendrier et aux conditions arrêtés par la Direction pédagogique. Le paiement des frais de rattrapage ne dispense pas l'apprenant de l'obligation de se présenter à l'épreuve.",
          "Le refus de participer aux évaluations, les absences répétées et le non-respect des dispositions du présent article peuvent entraîner des mesures disciplinaires et des conséquences pédagogiques, conformément au règlement intérieur et aux règles applicables à la formation.",
          "Chaque apprenant est tenu de prendre toutes les dispositions nécessaires pour être présent à l'ensemble des évaluations et contrôles programmés.",
        ],
      },
    ],
  },
  {
    title: "Chapitre V — Présentation, tenue et hygiène",
    articles: [
      {
        title: "Article 7 — Uniforme et tenue professionnelle",
        blocks: [
          "Le port de l'uniforme prévu par l'établissement est obligatoire. L'uniforme doit être propre, complet, correctement porté et adapté à l'activité. Pour les travaux pratiques et les stages, l'apprenant doit porter la tenue professionnelle et les équipements exigés par le service.",
          "Une tenue négligée, incomplète ou inadaptée peut entraîner un rappel à l'ordre et, si nécessaire, l'interdiction temporaire de participer à l'activité concernée jusqu'à régularisation.",
          "Les tenues doivent être portées depuis la maison pour éviter de dévier du trajet (maison-école et école-maison).",
        ],
      },
      {
        title: "Article 8 — Cheveux, pilosité et présentation personnelle",
        blocks: [
          "La coiffure constitue un élément important de la présentation professionnelle dans les métiers de l'hôtellerie et de la restauration.",
          "À ce titre, les règles suivantes sont obligatoires :",
          {
            ordered: true,
            list: [
              "Les coiffures extravagantes, excessivement fantaisistes ou incompatibles avec une présentation professionnelle soignée sont interdites.",
              "Les cheveux excessivement longs, lorsqu'ils ne sont pas correctement entretenus, attachés ou maintenus, sont interdits pendant les activités de formation.",
              "Les colorations fantaisistes ou les couleurs de cheveux jugées incompatibles avec les exigences de présentation professionnelle de l'établissement sont interdites.",
              "Le port des dreadlocks est interdit conformément aux règles de présentation retenues par l'établissement.",
              "Toute coiffure empêchant le port correct de la toque, de la charlotte, du filet ou d'un autre équipement professionnel est interdite.",
              "Les cheveux doivent être propres, correctement entretenus et adaptés aux exigences d'hygiène et de sécurité de chaque activité.",
              "Les barbes et barbichettes sont strictement interdites.",
            ],
          },
          "Pendant les travaux pratiques de cuisine, de pâtisserie et toute activité nécessitant une protection des cheveux, les étudiants et stagiaires doivent obligatoirement les attacher et les couvrir conformément aux consignes professionnelles.",
          "**Tout manquement aux dispositions du présent article peut donner lieu à une observation dans le carnet de correspondance et, en cas de récidive, à une sanction disciplinaire.**",
        ],
      },
      {
        title: "Article 9 — Bijoux et accessoires",
        blocks: [
          "Pour des raisons d'hygiène, de sécurité et de présentation professionnelle, le port des bijoux est interdit pendant les cours pratiques et les activités professionnelles.",
          "Sont notamment concernés :",
          {
            list: [
              "Les chaînes et colliers ;",
              "Les bagues ;",
              "Les bracelets ;",
              "Les boucles d'oreilles ;",
              "Les bijoux portés au nez, aux lèvres, aux sourcils ou à d'autres parties visibles du corps ;",
              "Les montres et autres accessoires incompatibles avec les exigences de sécurité et d'hygiène des activités concernées.",
            ],
          },
          "Cette interdiction s'applique particulièrement aux cuisines, aux ateliers de pâtisserie, aux bars et aux restaurants d'application.",
          "Tout étudiant ou stagiaire doit se conformer aux consignes relatives aux accessoires et aux équipements de protection.",
          "La Direction peut demander le retrait de tout accessoire jugé incompatible avec l'uniforme, l'hygiène, la sécurité ou l'image professionnelle attendue.",
        ],
      },
      {
        title: "Article 10 — Hygiène personnelle et propreté",
        blocks: [
          "Chaque étudiant ou stagiaire doit observer une hygiène corporelle irréprochable.",
          "Il est notamment exigé :",
          {
            list: [
              "Une propreté corporelle quotidienne ;",
              "Des vêtements et une tenue professionnelle propres ;",
              "Des ongles courts et propres ;",
              "Des cheveux propres et bien entretenus ;",
              "Une haleine correcte ;",
              "L'absence de parfum excessif susceptible de gêner les clients ou les collègues ;",
              "Le respect strict des règles d'hygiène alimentaire.",
            ],
          },
          "Les faux ongles et les vernis incompatibles avec les exigences d'hygiène alimentaire sont interdits pendant les activités concernées.",
        ],
      },
      {
        title: "Article 11 — Chaussures et équipements professionnels",
        blocks: [
          "Le port de chaussures adaptées à la formation est obligatoire.",
          "Les chaussures doivent être propres, en bon état et conformes aux exigences de sécurité de l'activité concernée.",
          { list: ["En cuisine et dans les ateliers pratiques, les étudiants doivent porter les chaussures de sécurité ou les chaussures professionnelles prescrites.", "Jeans bleu (sans design)."] },
          "Le port des équipements de protection et d'hygiène exigés par les enseignants est obligatoire.",
        ],
      },
    ],
  },
  {
    title: "Chapitre VI — Règles de conduite et de sécurité",
    articles: [
      {
        title: "Article 12 — Respect de la hiérarchie",
        blocks: [
          "Tout étudiant doit respect et considération :",
          {
            list: [
              "À la Direction générale ;",
              "À la Direction pédagogique ;",
              "Aux enseignants et formateurs ;",
              "Au personnel administratif ;",
              "Au personnel technique et d'entretien ;",
              "Aux maîtres de stage ;",
              "À ses camarades et à toute personne intervenant dans l'établissement.",
            ],
          },
          "Le respect de la hiérarchie constitue une exigence fondamentale de la formation professionnelle.",
        ],
      },
      {
        title: "Article 13 — Comportement en classe",
        blocks: [
          "En salle de classe, chaque étudiant doit :",
          {
            list: [
              "Être attentif et participer activement aux enseignements ;",
              "Respecter les consignes des enseignants ;",
              "Éviter les bavardages intempestifs ;",
              "Ne pas perturber le déroulement des cours ;",
              "Préserver le matériel pédagogique ;",
              "Demander la parole avant d'intervenir lorsque cela est nécessaire ;",
              "Respecter les opinions et le travail des autres.",
            ],
          },
          "Tout comportement empêchant le bon déroulement d'un cours est passible de sanctions.",
        ],
      },
      {
        title: "Article 14 — Insultes, violences et comportements irrespectueux",
        blocks: [
          "Sont formellement interdits :",
          {
            list: [
              "Les insultes et propos injurieux ;",
              "Les menaces ;",
              "Les bagarres et violences physiques ;",
              "Le harcèlement moral ou sexuel ;",
              "Les humiliations et intimidations ;",
              "Les actes de discrimination ;",
              "Les propos diffamatoires ;",
              "Les comportements portant atteinte à la dignité d'un étudiant ou d'un membre du personnel.",
            ],
          },
          "Tout acte de violence ou de harcèlement doit être signalé à l'administration afin que les mesures appropriées soient prises.",
        ],
      },
      {
        title: "Article 15 — Fraude et falsification",
        blocks: [
          "La fraude aux évaluations, la tricherie, le plagiat, la falsification des notes, la modification non autorisée des documents administratifs et toute tentative de tromper l'administration sont interdits.",
          "Tout étudiant reconnu coupable de fraude s'expose aux sanctions prévues par le présent règlement, sans préjudice des mesures applicables à l'évaluation concernée.",
        ],
      },
      {
        title: "Article 16 — Usage des téléphones portables",
        blocks: [
          "L'utilisation du téléphone portable est interdite pendant les cours, les évaluations et les travaux pratiques, sauf autorisation expresse de l'enseignant pour un usage pédagogique.",
          "Les téléphones doivent être mis en mode silencieux et rangés pendant les activités concernées.",
          "Toute utilisation abusive ou perturbatrice peut entraîner la confiscation temporaire de l'appareil selon les procédures établies par l'administration, avec restitution à l'étudiant ou à son parent ou tuteur légal, selon le cas.",
        ],
      },
      {
        title: "Article 17 — Interdiction de fumer et de consommer des substances interdites",
        blocks: [
          "Il est interdit de fumer dans les espaces où cela est prohibé par la réglementation applicable et par les règles de l'établissement.",
          "L'introduction, la détention, la consommation ou la distribution de substances illicites dans l'enceinte de l'établissement sont strictement interdites.",
          "La consommation d'alcool ou de toute substance altérant la vigilance pendant les activités de formation est interdite.",
          "Tout étudiant se présentant dans un état incompatible avec la sécurité et le bon déroulement de la formation peut être écarté temporairement de l'activité concernée et faire l'objet d'une procédure disciplinaire.",
        ],
      },
      {
        title: "Article 18 — Respect des locaux et du matériel",
        blocks: [
          "Chaque étudiant est responsable du bon usage des locaux, équipements, mobiliers et matériels mis à sa disposition.",
          "Il est interdit :",
          {
            list: [
              "De dégrader volontairement les locaux ;",
              "D'inscrire des messages sur les murs, tables, portes ou équipements ;",
              "De détériorer le mobilier ;",
              "De manipuler sans autorisation les installations électriques ou techniques ;",
              "De déplacer du matériel sans autorisation ;",
              "D'emporter du matériel appartenant à l'établissement ;",
              "De gaspiller volontairement les produits et consommables.",
            ],
          },
          "Toute dégradation doit être immédiatement signalée à l'administration.",
        ],
      },
      {
        title: "Article 19 — Obligations pendant les travaux pratiques",
        blocks: [
          "Les travaux pratiques constituent une partie essentielle de la formation à l'Hôtel École AVENIDA.",
          "Chaque étudiant est tenu :",
          {
            list: [
              "De se présenter à l'heure ;",
              "De porter la tenue professionnelle exigée ;",
              "De respecter les consignes de l'enseignant ;",
              "De préparer et de ranger correctement son poste ;",
              "De respecter les règles d'hygiène et de sécurité ;",
              "De travailler avec sérieux et méthode ;",
              "De respecter ses camarades et de favoriser le travail en équipe.",
            ],
          },
          "Le refus injustifié de participer à un travail pratique peut entraîner une sanction.",
          "Il est notamment obligatoire :",
          {
            list: [
              "De nettoyer son poste de travail avant et après chaque activité ;",
              "De ranger les ustensiles après utilisation ;",
              "De respecter les règles de conservation des denrées ;",
              "D'éviter le gaspillage des matières premières ;",
              "De signaler toute panne, casse ou anomalie ;",
              "De respecter les consignes relatives à la prévention des accidents.",
            ],
          },
          "Aucun étudiant ne peut utiliser un équipement dangereux sans autorisation ni encadrement approprié.",
        ],
      },
      {
        title: "Article 20 — Responsabilité en cas de dégradation",
        blocks: [
          "Toute dégradation volontaire ou résultant d'une négligence grave peut entraîner une sanction disciplinaire.",
          "Après examen des circonstances, l'administration détermine les mesures appropriées et, lorsque cela est justifié, les modalités de réparation du préjudice dans le respect des règles applicables.",
        ],
      },
      {
        title: "Article 21 — Accès, tabac, alcool et substances interdites",
        blocks: [
          "L'accès aux locaux pédagogiques doit se faire par les entrées prévues à cet effet. Les zones réservées au personnel ou à la clientèle ne sont accessibles que sur autorisation.",
          "Il est interdit :",
          {
            list: [
              "De fumer dans l'établissement et à proximité immédiate de ses locaux ;",
              "D'introduire, de consommer ou de distribuer de l'alcool, des stupéfiants ou toute substance illicite ;",
              "D'accéder à l'établissement ou d'y rester en état d'ébriété ou sous l'emprise d'une substance ;",
              "D'apporter tout objet dangereux ou susceptible de porter atteinte à la sécurité d'autrui.",
            ],
          },
        ],
      },
      {
        title: "Article 22 — Téléphones portables et objets personnels",
        blocks: [
          "L'utilisation du téléphone portable est interdite pendant les cours, les évaluations et les travaux pratiques, sauf autorisation expresse d'un formateur pour un usage pédagogique. Le téléphone doit être éteint ou rangé selon les consignes données.",
          "Chaque apprenant demeure responsable de ses effets personnels. L'établissement ne peut être tenu responsable de la perte ou du vol d'un objet non remis à un responsable.",
        ],
      },
      {
        title: "Article 23 — Manifestations et propagande",
        blocks: [
          "Aucune manifestation, réunion ou activité collective ne peut être organisée dans l'établissement sans l'autorisation préalable de la Direction.",
          "La propagande politique ou religieuse et les actes d'hostilité entre apprenants sont interdits dans le cadre scolaire.",
        ],
      },
    ],
  },
  {
    title: "Chapitre VII — Le carnet de correspondance",
    articles: [
      {
        title: "Article 25 — Fonction du carnet de correspondance",
        blocks: [
          "Le carnet de correspondance est un document officiel de liaison entre l'Hôtel École AVENIDA, l'étudiant et ses parents ou tuteurs légaux.",
          "Il constitue également un outil de suivi de la discipline, de l'assiduité, du comportement et du travail de l'étudiant.",
        ],
      },
      {
        title: "Article 26 — Port obligatoire du carnet",
        blocks: [
          "Chaque étudiant doit disposer de son carnet de correspondance et le présenter chaque fois qu'un membre habilité de l'administration ou du corps enseignant le demande.",
          "Le carnet doit être conservé en bon état, propre et lisible.",
          "La perte, la détérioration volontaire, la falsification ou l'utilisation abusive du carnet sont interdites.",
        ],
      },
      {
        title: "Article 27 — Communication avec les parents ou tuteurs",
        blocks: [
          "Les observations relatives aux retards, absences, comportements, résultats et manquements disciplinaires peuvent être consignées dans le carnet de correspondance.",
          "Les parents ou tuteurs légaux des étudiants sont invités à consulter régulièrement le carnet et à signer les observations qui leur sont destinées.",
          "Ils sont tenus de collaborer avec l'administration pour accompagner leur enfant dans le respect du règlement et l'amélioration de ses résultats.",
          "Pour chaque étudiant, les modalités de communication avec les parents ou les personnes de référence respectent les règles applicables et les dispositions arrêtées par l'établissement.",
        ],
      },
      {
        title: "Article 28 — Falsification du carnet",
        blocks: [
          "Toute modification non autorisée d'une observation, d'une signature, d'une note ou de toute autre mention inscrite dans le carnet est considérée comme une faute disciplinaire.",
          "L'administration se réserve le droit de vérifier l'authenticité des informations consignées.",
        ],
      },
    ],
  },
  {
    title: "Chapitre VIII — Des droits et des obligations des étudiants",
    articles: [
      {
        title: "Article 29 — Droits des étudiants",
        blocks: [
          "Tout étudiant a droit :",
          {
            list: [
              "À une formation dispensée dans des conditions appropriées ;",
              "Au respect de sa dignité ;",
              "À un traitement équitable ;",
              "À des explications sur les règles et les sanctions qui le concernent ;",
              "À la possibilité de présenter ses observations lorsqu'un fait lui est reproché ;",
              "À un environnement d'apprentissage aussi sûr que possible.",
            ],
          },
        ],
      },
      {
        title: "Article 30 — Obligations des étudiants",
        blocks: [
          "Tout étudiant est tenu :",
          {
            list: [
              "De respecter le présent règlement ;",
              "De travailler avec assiduité ;",
              "De respecter les horaires ;",
              "D'adopter une tenue et une présentation conformes aux exigences de l'établissement ;",
              "De respecter les enseignants, l'administration et ses camarades ;",
              "De protéger les locaux et les équipements ;",
              "De respecter les règles d'hygiène et de sécurité ;",
              "De contribuer au maintien d'un climat favorable à l'apprentissage.",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Chapitre IX — Des fautes et des sanctions disciplinaires",
    articles: [
      {
        title: "Article 31 — Principe général",
        blocks: [
          "Tout manquement au présent règlement peut entraîner une mesure éducative ou une sanction disciplinaire proportionnée à la gravité des faits, à leur répétition et aux circonstances.",
          "Les sanctions sont décidées par l'autorité compétente de l'établissement, après examen des faits et prise en compte des explications de l'étudiant.",
        ],
      },
      {
        title: "Article 32 — Échelle des sanctions",
        blocks: [
          "Selon la nature et la gravité du manquement, les mesures suivantes peuvent être appliquées :",
          {
            ordered: true,
            list: [
              "**Rappel à l'ordre :** pour les manquements mineurs et ponctuels.",
              "**Avertissement verbal :** pour signaler un comportement inapproprié et exiger sa correction.",
              "**Observation écrite dans le carnet de correspondance :** pour assurer le suivi du comportement et, le cas échéant, informer les parents ou tuteurs légaux.",
              "**Avertissement écrit :** pour les manquements répétés ou les fautes nécessitant une mesure formelle.",
              "**Blâme :** pour les fautes plus sérieuses ou la répétition de manquements déjà sanctionnés.",
              "**Convocation de l'étudiant et, le cas échéant, de ses parents ou tuteurs légaux :** pour examiner la situation et rechercher des mesures correctives.",
              "**Exclusion temporaire :** pour les fautes graves ou les manquements répétés, dans les conditions fixées par l'établissement et la réglementation applicable.",
              "**Exclusion définitive :** pour les fautes d'une gravité exceptionnelle ou lorsque les conditions prévues par les textes applicables et les procédures disciplinaires de l'établissement sont réunies.",
            ],
          },
          "Les sanctions ne sont pas nécessairement appliquées dans cet ordre. La gravité des faits peut justifier une sanction plus importante dès le premier manquement, sous réserve du respect des procédures applicables.",
        ],
      },
      {
        title: "Article 33 — Fautes graves",
        blocks: [
          "Peuvent notamment être considérés comme des fautes graves :",
          {
            list: [
              "Les actes de violence physique ;",
              "Les menaces sérieuses ;",
              "Le harcèlement ;",
              "Le vol ;",
              "La fraude organisée ;",
              "La falsification de documents officiels ;",
              "La détention ou la distribution de substances illicites ;",
              "La dégradation volontaire importante du matériel ;",
              "Le refus persistant de respecter les consignes de sécurité ;",
              "Tout acte portant gravement atteinte à la sécurité des personnes ou à la réputation de l'établissement.",
            ],
          },
        ],
      },
      {
        title: "Article 34 — Conseil de discipline",
        blocks: [
          {
            list: [
              "Lorsque la gravité des faits le nécessite, la Direction peut réunir un conseil de discipline composé de représentants de la Direction, de formateurs et, selon les besoins, d'un représentant du personnel. L'apprenant concerné est informé des faits qui lui sont reprochés et peut présenter ses explications. La famille peut être convoquée.",
              "La décision est communiquée à l'apprenant et à son parent ou tuteur par le moyen jugé approprié, notamment le carnet de correspondance.",
            ],
          },
          "La qualification d'une faute et la sanction correspondante relèvent de l'autorité compétente, dans le respect des droits de l'étudiant et des textes applicables.",
        ],
      },
      {
        title: "Article 35 — Application des sanctions",
        blocks: [
          "Aucune sanction disciplinaire ne doit être prononcée de manière arbitraire.",
          "L'étudiant concerné doit pouvoir présenter ses explications. La sanction retenue doit être proportionnée aux faits et consignée dans les documents appropriés lorsque cela est nécessaire.",
          "Les sanctions applicables aux étudiants donnent lieu à l'information des parents ou tuteurs légaux selon les modalités prévues par l'établissement.",
        ],
      },
    ],
  },
  {
    title: "Chapitre X — Stages et activités en entreprise",
    articles: [
      {
        title: "Article 36 — Obligations durant les stages",
        blocks: [
          "Pendant les stages, l'apprenant représente l'Hôtel École AVENIDA. Il doit respecter le présent règlement, les consignes de l'établissement d'accueil, les règles de sécurité et les horaires fixés.",
          "Tout incident, difficulté, absence ou changement de situation pendant le stage doit être signalé rapidement au responsable de stage et à l'établissement. Le jour de repos hebdomadaire est organisé selon les nécessités du stage et les règles applicables.",
        ],
      },
    ],
  },
  {
    title: "Chapitre XI — Santé et urgences",
    articles: [
      {
        title: "Article 37 — Santé et soins",
        blocks: [
          "L'apprenant ou son parent/tuteur doit informer l'établissement de toute situation de santé nécessitant une attention particulière. En cas de maladie ou d'urgence, l'établissement contacte la famille et prend les mesures nécessaires dans l'intérêt de l'apprenant.",
          "Les consultations, traitements, médicaments et frais médicaux restent à la charge de l'apprenant ou de sa famille, sauf disposition contraire. Toute sortie pour un rendez-vous médical pendant les cours doit être autorisée selon la procédure prévue. Au retour, un justificatif peut être demandé.",
        ],
      },
    ],
  },
  {
    title: "Chapitre XII — Dispositions finales",
    articles: [
      {
        title: "Article 38 — Application du règlement",
        blocks: [
          "Le présent règlement s'applique à tous les apprenants de l'Hôtel École AVENIDA, dans les locaux de l'établissement, lors des activités organisées par l'école et pendant les stages, sous réserve des règles propres aux structures d'accueil.",
          "La Direction peut préciser les modalités d'application du règlement et les consignes particulières liées à la sécurité, à l'hygiène, aux cours pratiques ou aux stages. Ces consignes doivent être portées à la connaissance des apprenants.",
        ],
      },
    ],
  },
];

export const reglementSignataire = { title: "Directeur pédagogique", name: "DOGLO Kodjo Messan" };
