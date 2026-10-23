"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccessSlipSheet } from "@/components/cards/AccessSlipSheet";
import { DocumentToolbar } from "@/components/cards/DocumentToolbar";

/** Billet d'admission en classe dans l'espace de l'élève et du parent : consulter, télécharger, imprimer. */
export default function MyAccessSlipPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="flex flex-col gap-4">
      <Link href="/espace/correspondance" className="inline-flex items-center gap-1.5 self-start text-sm font-bold text-avenida-blue hover:text-vif print:hidden">
        <ArrowLeft aria-hidden className="size-4" /> Correspondance
      </Link>
      <div className="-mx-4 sm:mx-0">
        <DocumentToolbar elementId="avenida-billet-admission" fileName={`Billet-admission-${id.slice(0, 8)}`} />
        <AccessSlipSheet id={id} />
      </div>
    </div>
  );
}
