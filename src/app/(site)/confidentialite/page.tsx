import type { Metadata } from "next";
import { getSiteImages } from "@/lib/site-images";
import { LegalDocument, type LegalSection } from "@/components/site/LegalDocument";
import { PageHeader } from "@/components/site/PageHeader";
import { Accent } from "@/components/site/SectionTitle";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment l'Hôtel École Avenida collecte, utilise, protège et conserve les données personnelles des élèves, parents, candidats, clients et personnels.",
};

const sections: LegalSection[] = [
  {
    id: "responsable",
    title: "Responsable du traitement",
    body: (
      <p>
        Les données sont traitées par l&apos;<strong>{siteConfig.name}</strong>, {siteConfig.address.street}, {siteConfig.address.district},{" "}
        {siteConfig.address.postal} {siteConfig.address.city} ({siteConfig.address.country}), joignable à {siteConfig.email}. La direction générale est
        responsable du traitement au sens de la loi togolaise n° 2019-014 du 29 octobre 2019 relative à la protection des données à caractère
        personnel.
      </p>
    ),
  },
  {
    id: "donnees",
    title: "Données collectées",
    body: (
      <>
        <p>Nous ne collectons que les données nécessaires à chaque service :</p>
        <ul>
          <li>
            <strong>Pré-inscription et inscription :</strong> identité de l&apos;élève (nom, prénoms, date et lieu de naissance, sexe, nationalité),
            coordonnées, parcours scolaire, filière choisie, coordonnées des parents ou tuteurs et pièces du dossier (acte de naissance, bulletins,
            photo d&apos;identité, etc.).
          </li>
          <li>
            <strong>Compte en ligne :</strong> adresse e-mail, nom, mot de passe (stocké chiffré, jamais lisible par l&apos;école) ou, en cas de
            connexion avec Google, le nom, l&apos;adresse e-mail et la photo de profil transmis par Google.
          </li>
          <li>
            <strong>Scolarité :</strong> classe, matricule, notes, présences, absences, retards, permissions et justificatifs, paiements des frais,
            carte scolaire (photo, matricule, QR code).
          </li>
          <li>
            <strong>Espaces École et Hôtel :</strong> publications, devoirs rendus, messages, notes vocales, images et documents partagés dans les
            salles de classe ou de service.
          </li>
          <li>
            <strong>Hôtel :</strong> demandes de réservation (nom, coordonnées, dates de séjour, nombre de personnes).
          </li>
          <li>
            <strong>Personnel :</strong> dossier administratif et RH (poste, contrat, CV, pièces justificatives), carte de travail.
          </li>
          <li>
            <strong>Données techniques :</strong> cookies de session indispensables à la connexion. Le site n&apos;utilise ni publicité, ni
            traceur publicitaire, ni outil de mesure d&apos;audience tiers.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "finalites",
    title: "Pourquoi nous les utilisons",
    body: (
      <ul>
        <li>étudier les candidatures, inscrire les élèves et gérer leur scolarité (cours, devoirs, examens, discipline) ;</li>
        <li>informer les parents du suivi de leur enfant : présences, absences, permissions, paiements et résultats ;</li>
        <li>gérer les frais de scolarité, les paiements et la comptabilité de l&apos;établissement ;</li>
        <li>émettre et vérifier les cartes scolaires et les cartes de travail ;</li>
        <li>traiter les réservations de l&apos;hôtel et les demandes de contact ;</li>
        <li>gérer le personnel et les recrutements ;</li>
        <li>assurer la sécurité du site et des comptes.</li>
      </ul>
    ),
  },
  {
    id: "base-legale",
    title: "Fondement",
    body: (
      <p>
        Ces traitements reposent sur l&apos;exécution du contrat de scolarité, de séjour ou de travail, sur les obligations légales de
        l&apos;établissement (scolaires, comptables, sociales), sur l&apos;intérêt légitime de l&apos;école à assurer le suivi et la sécurité des
        élèves et, lorsque la loi l&apos;exige, sur votre consentement (par exemple à l&apos;envoi du formulaire de pré-inscription).
      </p>
    ),
  },
  {
    id: "destinataires",
    title: "Qui peut y accéder",
    body: (
      <>
        <p>
          L&apos;accès est strictement limité selon le rôle de chacun : un élève ne voit que son dossier, un parent ne voit que celui de ses enfants,
          un professeur ne voit que ses classes, et chaque service administratif (pédagogie, comptabilité, ressources humaines, hôtel) n&apos;accède
          qu&apos;aux informations dont il a besoin. Les salles des Espaces École et Hôtel sont cloisonnées par filière et par service.
        </p>
        <p>Nous faisons appel à des prestataires techniques, tenus à la confidentialité, qui n&apos;utilisent pas vos données pour leur propre compte :</p>
        <ul>
          <li>
            <strong>Supabase</strong> : base de données, authentification et stockage sécurisé des documents ;
          </li>
          <li>
            <strong>Vercel</strong> : hébergement du site ;
          </li>
          <li>
            <strong>Google</strong> : connexion avec un compte Google (si vous la choisissez) et carte de localisation de la page Contact ;
          </li>
          <li>
            <strong>Resend</strong> et <strong>Africa&apos;s Talking</strong> : envoi des e-mails et SMS de notification aux familles ;
          </li>
          <li>
            <strong>Jitsi Meet</strong> : visioconférence des cours en direct.
          </li>
        </ul>
        <p>Vos données ne sont jamais vendues ni cédées à des fins commerciales.</p>
      </>
    ),
  },
  {
    id: "transferts",
    title: "Hébergement hors du Togo",
    body: (
      <p>
        Certains prestataires hébergent les données sur des serveurs situés hors du Togo (Europe ou États-Unis). Ces transferts sont encadrés par
        des garanties contractuelles de sécurité et de confidentialité, conformément à la réglementation togolaise.
      </p>
    ),
  },
  {
    id: "conservation",
    title: "Durée de conservation",
    body: (
      <ul>
        <li>candidature non retenue : 1 an après la décision ;</li>
        <li>dossier scolaire : pendant toute la scolarité, puis archivé pour la délivrance des attestations et diplômes ;</li>
        <li>pièces comptables : 10 ans ;</li>
        <li>messages et contenus des Espaces École et Hôtel : jusqu&apos;à la fin de l&apos;année scolaire suivante ;</li>
        <li>demandes de contact et de réservation : 3 ans après le dernier échange ;</li>
        <li>dossier du personnel : pendant le contrat, puis selon les durées légales.</li>
      </ul>
    ),
  },
  {
    id: "securite",
    title: "Sécurité",
    body: (
      <p>
        Les échanges sont chiffrés (HTTPS), les mots de passe ne sont jamais stockés en clair, les documents sont conservés dans des espaces de
        stockage privés et chaque accès est contrôlé par des règles de sécurité au niveau de la base de données. Les cartes scolaires comportent un
        QR code qui permet seulement de vérifier leur validité.
      </p>
    ),
  },
  {
    id: "mineurs",
    title: "Élèves mineurs",
    body: (
      <p>
        Lorsque l&apos;élève est mineur, la pré-inscription est faite par ou avec l&apos;accord de ses parents ou tuteurs, qui peuvent exercer ses
        droits en son nom et suivre son dossier depuis leur espace parent.
      </p>
    ),
  },
  {
    id: "droits",
    title: "Vos droits",
    body: (
      <>
        <p>
          Vous pouvez demander l&apos;accès à vos données, leur rectification, leur effacement lorsque la loi le permet, ou vous opposer à certains
          traitements. Une grande partie de vos informations est consultable et modifiable directement dans votre espace personnel.
        </p>
        <p>
          Pour toute demande, écrivez à <strong>{siteConfig.email}</strong> en précisant votre nom et votre qualité (élève, parent, candidat, client,
          membre du personnel). Nous répondons dans un délai d&apos;un mois. Vous pouvez aussi saisir l&apos;Instance de Protection des Données à
          Caractère Personnel (IPDCP) du Togo.
        </p>
      </>
    ),
  },
  {
    id: "modifications",
    title: "Modifications",
    body: <p>Cette politique peut évoluer. La date de mise à jour figure en haut de la page ; en cas de changement important, les utilisateurs en sont informés dans leur espace.</p>,
  },
];

export default async function ConfidentialitePage() {
  const { images } = await getSiteImages();
  return (
    <>
      <PageHeader
        eyebrow="Informations légales"
        title={
          <>
            Politique de <Accent inverted>confidentialité</Accent>
          </>
        }
        description="Les données des élèves, des familles, des clients et du personnel sont précieuses. Voici comment nous les protégeons."
        image={images.reception}
        breadcrumbs={[{ label: "Politique de confidentialité" }]}
      />
      <LegalDocument
        updated="22 octobre 2026"
        intro={
          <p>
            Cette politique explique quelles données personnelles l&apos;{siteConfig.name} collecte sur ce site et dans ses espaces en ligne (Espace
            École, Espace Hôtel, espaces élèves, parents, professeurs et personnel), pourquoi, avec qui elles sont partagées et quels sont vos droits.
          </p>
        }
        sections={sections}
        related={{ label: "Conditions d'utilisation", href: "/conditions-utilisation" }}
      />
    </>
  );
}
