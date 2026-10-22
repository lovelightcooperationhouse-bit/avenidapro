"use client";

import { Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { IdCard, type CardData } from "@/components/cards/IdCard";
import { customerCardData, employeeCardData, studentCardData, type CardRow, type CustomerRow, type EmployeeRow, type StudentRow } from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";

/** Planche d'impression des cartes (recto / verso), réservée au personnel. */
function PrintSheet() {
  const params = useSearchParams();
  const [cards, setCards] = useState<CardData[] | null>(null);
  const raw = params.get("type");
  const type = raw === "personnel" || raw === "client" ? raw : "eleve";

  useEffect(() => {
    const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
    if (!ids.length) return setCards([]);
    const supabase = createClient();
    (async () => {
      const col = type === "eleve" ? "student_id" : type === "client" ? "customer_id" : "employee_id";
      const { data: c } = await supabase.from("id_cards").select("*").in(col, ids).eq("revoked", false);
      if (type === "eleve") {
        const { data: s } = await supabase.from("students").select("id, first_name, last_name, photo_url, registration_number, student_number, class_name, program_code, academic_year, status, total_fee, paid_fee, remaining_fee").in("id", ids);
        setCards((c ?? []).map((card: CardRow) => studentCardData((s ?? []).find((x) => x.id === card.student_id) as StudentRow, card)).filter((x) => x.name));
      } else if (type === "client") {
        const { data: cu } = await supabase.from("hotel_customers").select("id, first_name, last_name, full_name, phone, email, nationality, total_stays, total_spent, is_vip, loyalty_points").in("id", ids);
        setCards((c ?? []).map((card: CardRow) => customerCardData((cu ?? []).find((x) => x.id === card.customer_id) as CustomerRow, card)).filter((x) => x.name));
      } else {
        const { data: e } = await supabase.from("employees").select("id, first_name, last_name, photo_url, matricule, role_title, position, department, sector, status").in("id", ids);
        setCards((c ?? []).map((card: CardRow) => employeeCardData((e ?? []).find((x) => x.id === card.employee_id) as EmployeeRow, card)).filter((x) => x.name));
      }
    })();
  }, [params, type]);

  if (!cards) return <p className="p-10 text-center">Préparation des cartes…</p>;

  return (
    <div className="min-h-dvh bg-white p-6 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="font-bold text-slate-700">
          {cards.length} carte(s) · imprimez en couleur, recto-verso, à 100 % (format carte 85,6 × 54 mm)
        </p>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white">
          <Printer aria-hidden className="size-4" /> Imprimer
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 print:grid-cols-2 print:gap-[4mm]">
        {cards.map((c) => (
          <div key={c.token} className="break-inside-avoid print:[&_.id-card]:w-[85.6mm] print:[&_.id-card]:max-w-none">
            <IdCard data={c} className="sm:flex-col print:flex-row print:gap-[2mm]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PrintCardsPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center">Chargement…</p>}>
      <PrintSheet />
    </Suspense>
  );
}
