"use client";

import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { DocumentToolbar } from "@/components/cards/DocumentToolbar";
import { SituationSheet } from "@/components/cards/SituationSheet";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Situation financière (écolage) de l'élève, ou de chaque enfant pour un parent : toujours à jour. */
export default function MaSituationPage() {
  const { user } = useAuth();
  const [kids, setKids] = useState<{ id: string; name: string }[] | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (user.role === "eleve" && user.studentId) {
        setKids([{ id: user.studentId, name: user.fullName }]);
        setActive(user.studentId);
        return;
      }
      const { data } = await createClient().from("parent_students").select("student_id, students(first_name, last_name)").eq("parent_id", user.id);
      const list = (data ?? []).map((r) => {
        const st = r.students as unknown as { first_name: string; last_name: string } | null;
        return { id: r.student_id as string, name: st ? `${st.first_name} ${st.last_name}` : "Élève" };
      });
      setKids(list);
      setActive(list[0]?.id ?? null);
    })();
  }, [user]);

  return (
    <div className="flex flex-col gap-5">
      <div className="mx-auto w-full max-w-[210mm]">
        <p className="flex items-center gap-2 text-sm font-bold tracking-widest text-vif uppercase">
          <Wallet aria-hidden className="size-4" /> Situation financière
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-avenida-blue">Écolage : paiements et reste à payer</h1>
        <p className="mt-1 text-sm text-slate-600">Mise à jour automatiquement à chaque paiement. Consultez, téléchargez ou imprimez la fiche.</p>
      </div>
      {kids && kids.length > 1 && (
        <div className="mx-auto flex w-full max-w-[210mm] flex-wrap gap-2">
          {kids.map((k) => (
            <button key={k.id} type="button" onClick={() => setActive(k.id)} className={cn("rounded-full px-4 py-2 text-sm font-bold", active === k.id ? "bg-vif text-white" : "bg-white text-avenida-blue ring-1 ring-slate-200")}>
              {k.name}
            </button>
          ))}
        </div>
      )}
      {kids && !kids.length && <p className="rounded-3xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-900/5">Aucun élève rattaché à votre compte.</p>}
      {active && (
        <div className="-mx-4 sm:mx-0">
          <DocumentToolbar elementId="avenida-fiche-situation" fileName={`Situation-financiere-${new Date().toISOString().slice(0, 10)}`} />
          <SituationSheet key={active} studentId={active} />
        </div>
      )}
    </div>
  );
}
