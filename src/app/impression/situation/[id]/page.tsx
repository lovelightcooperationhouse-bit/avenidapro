"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DocumentToolbar } from "@/components/cards/DocumentToolbar";
import { SendToFamily } from "@/components/cards/SendToFamily";
import { SituationSheet } from "@/components/cards/SituationSheet";
import { createClient } from "@/lib/supabase/client";

/** Fiche de situation financière : aperçu, PDF, impression, envoi à la famille, archivage. */
export default function PrintSituationPage() {
  const { id } = useParams<{ id: string }>();
  const [st, setSt] = useState<{ first_name: string; last_name: string; registration_number: string | null } | null>(null);
  useEffect(() => {
    createClient()
      .from("students")
      .select("first_name, last_name, registration_number")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setSt(data));
  }, [id]);
  const name = st ? `${st.last_name.toUpperCase()} ${st.first_name}` : "";
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-dvh bg-slate-100 p-4 sm:p-6 print:bg-white print:p-0">
      {st && (
        <>
          <DocumentToolbar
            elementId="avenida-fiche-situation"
            fileName={`Situation-financiere-${st.registration_number ?? st.last_name}-${stamp}`}
            archive={{ kind: "recu", title: `Fiche de situation financière ${name} (${stamp})`, ownerName: name, reference: st.registration_number ?? undefined, refType: "situation", refId: `${id}-${stamp}` }}
          />
          <SendToFamily studentId={id} elementId="avenida-fiche-situation" docType="situation" />
        </>
      )}
      <SituationSheet studentId={id} />
    </div>
  );
}
