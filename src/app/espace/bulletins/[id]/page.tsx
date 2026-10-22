"use client";

import { useParams } from "next/navigation";
import { DocumentToolbar } from "@/components/cards/DocumentToolbar";
import { ReportCardSheet } from "@/components/cards/ReportCardSheet";

/** Bulletin dans l'espace de l'élève ou du parent : aperçu, PDF, impression. */
export default function MonBulletinPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="-mx-4 sm:mx-0">
      <DocumentToolbar elementId="avenida-official-report-card" fileName={`Bulletin-Avenida-${id.slice(0, 8)}`} />
      <ReportCardSheet id={id} />
    </div>
  );
}
