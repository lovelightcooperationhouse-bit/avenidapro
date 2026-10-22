"use client";

import { IdCard as IdCardIcon, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { IdCard, type CardData } from "@/components/cards/IdCard";
import { useAuth } from "@/context/AuthContext";
import { employeeCardData, studentCardData, type CardRow, type EmployeeRow, type StudentRow } from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";

const STUDENT_COLS = "id, first_name, last_name, photo_url, registration_number, student_number, class_name, program_code, academic_year, status, total_fee, paid_fee, remaining_fee";

/** Carte scolaire (élève, parents) ou carte de travail (personnel, professeurs), à jour en temps réel. */
export default function MyCardPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<CardData[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      const result: CardData[] = [];
      const studentIds: string[] = [];
      if (user.role === "eleve" && user.studentId) studentIds.push(user.studentId);
      if (user.role === "parent") {
        const { data } = await supabase.from("parent_students").select("student_id").eq("parent_id", user.id);
        studentIds.push(...(data ?? []).map((d) => d.student_id));
      }
      if (studentIds.length) {
        const [{ data: c }, { data: s }] = await Promise.all([supabase.from("id_cards").select("*").in("student_id", studentIds).eq("revoked", false), supabase.from("students").select(STUDENT_COLS).in("id", studentIds)]);
        (c ?? []).forEach((card: CardRow) => {
          const st = (s ?? []).find((x) => x.id === card.student_id) as StudentRow | undefined;
          if (st) result.push(studentCardData(st, card));
        });
      }
      if (!["eleve", "parent", "candidat"].includes(user.role)) {
        const { data: me } = await supabase.from("profiles").select("employee_id").eq("id", user.id).maybeSingle();
        if (me?.employee_id) {
          const [{ data: card }, { data: emp }] = await Promise.all([
            supabase.from("id_cards").select("*").eq("employee_id", me.employee_id).eq("revoked", false).maybeSingle<CardRow>(),
            supabase.from("employees").select("id, first_name, last_name, photo_url, matricule, role_title, position, department, sector, status").eq("id", me.employee_id).maybeSingle<EmployeeRow>(),
          ]);
          if (card && emp) result.push(employeeCardData(emp, card));
        }
      }
      setCards(result);
    })();
  }, [user]);

  if (!user) return null;
  const student = user.role === "eleve" || user.role === "parent";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-avenida-blue-950">{student ? "Carte scolaire" : "Carte de travail"}</h1>
          <p className="mt-1 max-w-2xl text-slate-600">
            Le QR code renvoie vers la situation à jour : validité, scolarité{student ? ", présence du jour et assiduité" : " et poste occupé"}. Présentez-la à l&apos;entrée.
          </p>
        </div>
        {cards && cards.length > 0 && (
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-vif px-5 py-2.5 text-sm font-bold text-white hover:bg-vif-fonce">
            <Printer aria-hidden className="size-4" /> Imprimer
          </button>
        )}
      </div>
      {!cards ? (
        <div className="h-56 animate-pulse rounded-3xl bg-white" />
      ) : cards.length === 0 ? (
        <p className="flex items-center gap-3 rounded-3xl bg-amber-50 p-6 text-amber-900 ring-1 ring-amber-200">
          <IdCardIcon aria-hidden className="size-6 shrink-0" />
          {student
            ? "La carte n'a pas encore été émise. Elle est créée par l'administration une fois l'inscription définitive validée : vous serez prévenu·e par notification."
            : "Votre carte de travail n'a pas encore été émise, ou votre compte n'est pas encore lié à votre fiche du personnel. Contactez les ressources humaines."}
        </p>
      ) : (
        <ul className="flex flex-col gap-8">
          {cards.map((c) => (
            <li key={c.token}>
              <IdCard data={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
