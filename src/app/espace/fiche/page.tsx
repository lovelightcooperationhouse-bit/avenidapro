"use client";

import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { EnrollmentSheet } from "@/components/cards/EnrollmentSheet";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Fiche d'inscription définitive de l'élève (ou des enfants du parent), imprimable. */
export default function MyEnrollmentPage() {
  const { user } = useAuth();
  const [ids, setIds] = useState<{ id: string; name: string }[] | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role === "eleve") {
      const list = user.studentId ? [{ id: user.studentId, name: user.fullName }] : [];
      setIds(list);
      setActive(list[0]?.id ?? null);
      return;
    }
    createClient()
      .from("parent_students")
      .select("students(id, first_name, last_name)")
      .eq("parent_id", user.id)
      .then(({ data }) => {
        const list = (data ?? [])
          .map((r) => r.students as unknown as { id: string; first_name: string; last_name: string })
          .filter(Boolean)
          .map((s) => ({ id: s.id, name: `${s.first_name} ${s.last_name}` }));
        setIds(list);
        setActive(list[0]?.id ?? null);
      });
  }, [user]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-avenida-blue-950">Fiche d&apos;inscription définitive</h1>
          <p className="mt-1 text-slate-600">Établie par l&apos;administration à partir du dossier validé. Imprimez-la ou enregistrez-la en PDF.</p>
        </div>
        {active && (
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-vif px-5 py-2.5 text-sm font-bold text-white hover:bg-vif-fonce">
            <Printer aria-hidden className="size-4" /> Imprimer / PDF
          </button>
        )}
      </div>
      {ids && ids.length > 1 && (
        <div className="flex flex-wrap gap-2 print:hidden">
          {ids.map((c) => (
            <button key={c.id} type="button" onClick={() => setActive(c.id)} className={cn("rounded-full px-4 py-2 text-sm font-bold", active === c.id ? "bg-vif text-white" : "bg-white text-avenida-blue ring-1 ring-slate-200")}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      {ids && ids.length === 0 && <p className="rounded-3xl bg-amber-50 p-6 text-amber-900">Aucun dossier d&apos;élève n&apos;est rattaché à votre compte.</p>}
      {active && <EnrollmentSheet key={active} studentId={active} />}
    </div>
  );
}
