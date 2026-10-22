"use client";

import { Printer } from "lucide-react";
import { useParams } from "next/navigation";
import { EnrollmentSheet } from "@/components/cards/EnrollmentSheet";

/** Fiche d'inscription imprimable (personnel). */
export default function PrintEnrollmentPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-dvh bg-slate-100 p-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-end print:hidden">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white">
          <Printer aria-hidden className="size-4" /> Imprimer / PDF
        </button>
      </div>
      <EnrollmentSheet studentId={id} />
    </div>
  );
}
