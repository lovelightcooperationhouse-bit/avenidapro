import type { Metadata } from "next";
import { SchoolPayments } from "@/components/espace/SchoolPayments";
import { onlineMethods } from "@/lib/payments";

export const metadata: Metadata = { title: "Payer en ligne · Frais d'inscription et écolage", robots: { index: false, follow: false } };

/** Paiement en ligne des frais d'inscription et de l'écolage depuis l'espace de l'élève, du parent ou du candidat admis. */
export default function PaiementsPage() {
  return <SchoolPayments methods={onlineMethods()} />;
}
