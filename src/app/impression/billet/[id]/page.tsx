"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessSlipSheet } from "@/components/cards/AccessSlipSheet";
import { DocumentToolbar } from "@/components/cards/DocumentToolbar";
import { SendToFamily } from "@/components/cards/SendToFamily";
import { createClient } from "@/lib/supabase/client";

/** Billet d'admission en classe (secrétariat) : aperçu, PDF, image, impression, archivage, envoi à la famille. */
export default function PrintAccessSlipPage() {
  const { id } = useParams<{ id: string }>();
  const [info, setInfo] = useState<{ number: string | null; student_id: string } | null>(null);
  useEffect(() => {
    createClient()
      .from("class_access_slips")
      .select("number, student_id")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setInfo(data));
  }, [id]);
  return (
    <div className="min-h-dvh bg-slate-100 p-4 sm:p-6 print:bg-white print:p-0">
      {info && (
        <>
          <DocumentToolbar elementId="avenida-billet-admission" fileName={`Billet-admission-${info.number ?? id}`} archive={{ kind: "permission", title: `Billet d'admission ${info.number ?? ""}`, reference: info.number ?? undefined, refType: "access_slip", refId: id }} />
          <SendToFamily studentId={info.student_id} elementId="avenida-billet-admission" docType="billet" title={`Billet d'admission en classe ${info.number ?? ""}`} />
        </>
      )}
      <AccessSlipSheet id={id} />
    </div>
  );
}
