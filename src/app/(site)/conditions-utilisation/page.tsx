import type { Metadata } from "next";
import { getSiteImages } from "@/lib/site-images";
import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/site/LegalDocument";
import { PageHeader } from "@/components/site/PageHeader";
import { Accent } from "@/components/site/SectionTitle";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Règles d'utilisation du site et des espaces en ligne de l'Hôtel École Avenida : comptes, Espace École, Espace Hôtel, pré-inscription et réservations.",
};

const sections: LegalSection[] = [
  {
    id: "objet",
    title: "Objet",
    body: (
      <p>
        Les présentes conditions encadrent l&apos;utilisation du site de l&apos;{siteConfig.name} et de ses services en ligne : présentation de
        l&apos;école et de l&apos;hôtel, pré-inscription, demandes de contact et de réservation, espaces personnels, Espace École, Espace Hôtel et
        outils de gestion. Utiliser le site ou se connecter à un espace vaut acceptation de ces conditions.
      </p>
    ),
  },
  {
    id: "comptes",
    title: "Comptes et connexion",
    body: (
      <>
        <p>
          Un compte peut être créé avec une adresse e-mail et un mot de passe, ou avec un compte Google. Le rôle du compte (élève, parent,
          professeur, personnel, direction…) est attribué uniquement par l&apos;administration de l&apos;école : un nouveau compte non reconnu
          dispose d&apos;un simple espace candidat.
        </p>
        <ul>
          <li>vous êtes responsable de la confidentialité de votre mot de passe et des actions faites depuis votre compte ;</li>
          <li>un compte est personnel : il ne doit pas être prêté ni partagé ;</li>
          <li>prévenez sans tarder l&apos;administration en cas de perte ou d&apos;usage frauduleux de vos identifiants.</li>
        </ul>
      </>
    ),
  },
  {
    id: "preinscription",
    title: "Pré-inscription",
    body: (
      <p>
        La pré-inscription en ligne est une demande : elle ne vaut pas admission. L&apos;inscription n&apos;est définitive qu&apos;après étude du
        dossier, décision de l&apos;école, remise des pièces originales et paiement des frais prévus. Les informations et documents fournis doivent
        être exacts ; toute fausse déclaration peut entraîner l&apos;annulation de l&apos;inscription.
      </p>
    ),
  },
  {
    id: "espaces",
    title: "Espace École et Espace Hôtel",
    body: (
      <>
        <p>
          Chaque salle est réservée aux membres de sa filière ou de son service. Les cours, programmes et documents qui y sont publiés sont destinés
          aux seuls membres et ne doivent pas être diffusés à l&apos;extérieur sans l&apos;accord de l&apos;école.
        </p>
        <p>Dans les discussions, devoirs et cours en direct, chacun s&apos;engage à :</p>
        <ul>
          <li>rester courtois et respecter le règlement intérieur de l&apos;établissement ;</li>
          <li>ne publier aucun contenu injurieux, discriminatoire, violent, obscène ou contraire à la loi ;</li>
          <li>ne pas enregistrer, filmer ni diffuser les cours en direct, les professeurs ou les autres élèves sans autorisation ;</li>
          <li>ne partager que des fichiers dont il a le droit de disposer et exempts de virus.</li>
        </ul>
        <p>
          Seuls les professeurs et responsables de salle peuvent lancer un cours en direct ou une réunion. L&apos;école peut retirer un contenu et
          suspendre un compte qui ne respecte pas ces règles, sans préjudice des sanctions prévues par le règlement intérieur.
        </p>
      </>
    ),
  },
  {
    id: "suivi",
    title: "Suivi scolaire, correspondance et cartes",
    body: (
      <p>
        Les présences, absences, permissions, paiements et résultats affichés dans les espaces sont fournis à titre d&apos;information pour le suivi
        de l&apos;élève ; en cas de désaccord, les registres de l&apos;administration font foi. Les demandes de permission doivent être accompagnées
        d&apos;un justificatif et ne sont valables qu&apos;après acceptation. La carte scolaire ou de travail reste la propriété de l&apos;école :
        elle est personnelle, doit être présentée sur demande et peut être mise à jour ou révoquée à tout moment.
      </p>
    ),
  },
  {
    id: "reservations",
    title: "Réservations de l'hôtel",
    body: (
      <p>
        Une demande de réservation envoyée en ligne n&apos;est confirmée qu&apos;après réponse de la réception. Les tarifs, disponibilités et
        conditions d&apos;annulation sont précisés lors de la confirmation. Les photos des chambres et du restaurant sont présentées à titre
        indicatif.
      </p>
    ),
  },
  {
    id: "propriete",
    title: "Propriété intellectuelle",
    body: (
      <p>
        Le nom, le logo, le motif et les uniformes Avenida, les textes, photos et supports de cours publiés sur le site appartiennent à l&apos;
        {siteConfig.name} ou à leurs auteurs. Toute reproduction ou réutilisation sans autorisation écrite est interdite.
      </p>
    ),
  },
  {
    id: "responsabilite",
    title: "Disponibilité et responsabilité",
    body: (
      <p>
        Nous faisons notre possible pour que le site reste accessible et exact, mais il peut être interrompu pour maintenance ou en cas de panne.
        L&apos;école ne saurait être tenue responsable d&apos;une indisponibilité temporaire, ni du contenu des sites externes vers lesquels le site
        renvoie.
      </p>
    ),
  },
  {
    id: "donnees",
    title: "Données personnelles",
    body: (
      <p>
        Le traitement de vos données est décrit dans notre{" "}
        <Link href="/confidentialite" className="font-semibold text-vif underline">
          politique de confidentialité
        </Link>
        .
      </p>
    ),
  },
  {
    id: "droit",
    title: "Droit applicable",
    body: (
      <p>
        Ces conditions sont soumises au droit togolais. En cas de litige, une solution amiable sera recherchée en priorité ; à défaut, les
        tribunaux de Lomé seront compétents. L&apos;école peut modifier ces conditions ; la version en vigueur est celle publiée sur cette page.
      </p>
    ),
  },
];

export default async function ConditionsPage() {
  const { images } = await getSiteImages();
  return (
    <>
      <PageHeader
        eyebrow="Informations légales"
        title={
          <>
            Conditions <Accent inverted>d&apos;utilisation</Accent>
          </>
        }
        description="Les règles qui permettent à chacun d'utiliser sereinement le site et les espaces en ligne de l'Hôtel École Avenida."
        image={images.building}
        breadcrumbs={[{ label: "Conditions d'utilisation" }]}
      />
      <LegalDocument
        updated="22 octobre 2026"
        intro={
          <p>
            Bienvenue sur le site de l&apos;{siteConfig.name}. Merci de lire attentivement ces conditions avant d&apos;utiliser nos services en
            ligne.
          </p>
        }
        sections={sections}
        related={{ label: "Politique de confidentialité", href: "/confidentialite" }}
      />
    </>
  );
}
