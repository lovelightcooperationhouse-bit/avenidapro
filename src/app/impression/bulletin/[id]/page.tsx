"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DocumentToolbar } from "@/components/cards/DocumentToolbar";
import { SendToFamily } from "@/components/cards/SendToFamily";
import { ReportCardSheet } from "@/components/cards/ReportCardSheet";
import { createClient } from "@/lib/supabase/client";

/** Bulletin de notes : aperçu, PDF, image, impression, archivage et envoi à la famille (personnel). */
export default function PrintReportCardPage() {
  const { id } = useParams<{ id: string }>();
  const [info, setInfo] = useState<{ student_id: string; student_name: string | null; student_matricule: string | null; bulletin_number: string | null; period: string | null; academic_year: string | null; published: boolean; signed_at: string | null } | null>(null);
  useEffect(() => {
    createClient()
      .from("report_cards")
      .select("student_id, student_name, student_matricule, bulletin_number, period, academic_year, published, signed_at")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setInfo(data));
  }, [id]);

  return (
    <div className="min-h-dvh bg-slate-100 p-4 sm:p-6 print:bg-white print:p-0">
      {info && (
        <DocumentToolbar
          elementId="avenida-official-report-card"
          fileName={`Bulletin-${info.bulletin_number ?? id}`}
          archive={{ kind: "bulletin", title: `Bulletin ${info.period ?? ""} · ${info.student_name ?? ""}`, ownerName: info.student_name ?? undefined, reference: info.student_matricule ?? undefined, refType: "report_card", refId: id }}
        />
      )}
      {info?.signed_at && <SendToFamily studentId={info.student_id} elementId="avenida-official-report-card" docType="bulletin" title={`Bulletin du ${info.period ?? ""} ${info.academic_year ?? ""}`.trim()} />}
      {info && !info.signed_at && <p className="mx-auto mb-4 max-w-[210mm] rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900 print:hidden">Bulletin provisoire : il pourra être envoyé après vérification, décision du conseil et signature du Directeur pédagogique.</p>}
      <ReportCardSheet id={id} />
    </div>
  );
}
