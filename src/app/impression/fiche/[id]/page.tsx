"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DocumentToolbar } from "@/components/cards/DocumentToolbar";
import { EnrollmentSheet } from "@/components/cards/EnrollmentSheet";
import { SendToFamily } from "@/components/cards/SendToFamily";
import { createClient } from "@/lib/supabase/client";

/** Fiche d'inscription A4 : aperçu, PDF, image, impression, archivage et envoi à l'élève et au tuteur. */
export default function PrintEnrollmentPage() {
  const { id } = useParams<{ id: string }>();
  const [ref, setRef] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .from("students")
      .select("registration_number, last_name, first_name")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => data && setRef(data.registration_number ?? `${data.last_name} ${data.first_name}`));
  }, [id]);

  return (
    <div className="min-h-dvh bg-slate-100 p-4 sm:p-6 print:bg-white print:p-0">
      {ref && (
        <>
          <DocumentToolbar
            elementId="avenida-official-student-enrollment"
            fileName={`Fiche-inscription-${ref}`}
            archive={{ kind: "fiche", title: `Fiche d'inscription ${ref}`, reference: ref, refType: "student_sheet", refId: id }}
          />
          <SendToFamily studentId={id} elementId="avenida-official-student-enrollment" docType="fiche" />
        </>
      )}
      <EnrollmentSheet studentId={id} />
    </div>
  );
}
