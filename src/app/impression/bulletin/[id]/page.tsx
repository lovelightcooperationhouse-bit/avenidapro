"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DocumentToolbar } from "@/components/cards/DocumentToolbar";
import { ReportCardSheet } from "@/components/cards/ReportCardSheet";
import { createClient } from "@/lib/supabase/client";

/** Bulletin de notes : aperçu, PDF, impression et archivage (personnel). */
export default function PrintReportCardPage() {
  const { id } = useParams<{ id: string }>();
  const [info, setInfo] = useState<{ student_name: string | null; student_matricule: string | null; bulletin_number: string | null; period: string | null } | null>(null);
  useEffect(() => {
    createClient()
      .from("report_cards")
      .select("student_name, student_matricule, bulletin_number, period")
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
      <ReportCardSheet id={id} />
    </div>
  );
}
