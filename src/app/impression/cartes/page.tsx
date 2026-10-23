"use client";

import { Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DocumentToolbar } from "@/components/cards/DocumentToolbar";
import { SendToFamily } from "@/components/cards/SendToFamily";
import { IdCard, type CardData } from "@/components/cards/IdCard";
import { customerCardData, employeeCardData, studentCardData, type CardRow, type CustomerRow, type EmployeeRow, type StudentRow, STUDENT_CARD_COLS, EMPLOYEE_CARD_COLS } from "@/lib/cards";
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
        const { data: s } = await supabase.from("students").select(STUDENT_CARD_COLS).in("id", ids);
        setCards((c ?? []).map((card: CardRow) => studentCardData((s ?? []).find((x) => x.id === card.student_id) as StudentRow, card)).filter((x) => x.name));
      } else if (type === "client") {
        const { data: cu } = await supabase.from("hotel_customers").select("id, first_name, last_name, full_name, phone, email, nationality, total_stays, total_spent, is_vip, loyalty_points, photo_url").in("id", ids);
        setCards((c ?? []).map((card: CardRow) => customerCardData((cu ?? []).find((x) => x.id === card.customer_id) as CustomerRow, card)).filter((x) => x.name));
      } else {
        const { data: e } = await supabase.from("employees").select(EMPLOYEE_CARD_COLS).in("id", ids);
        setCards((c ?? []).map((card: CardRow) => employeeCardData((e ?? []).find((x) => x.id === card.employee_id) as EmployeeRow, card)).filter((x) => x.name));
      }
    })();
  }, [params, type]);

  if (!cards) return <p className="p-10 text-center">Préparation des cartes…</p>;

  return (
    <div className="min-h-dvh bg-white p-6 print:p-0">
      {cards.length > 0 && (
        <DocumentToolbar
          elementId="planche-cartes"
          fileName={`Cartes-${type}-${new Date().toISOString().slice(0, 10)}`}
          archive={{
            kind: "carte",
            title: cards.length === 1 ? `Carte ${cards[0].name}` : `Planche de ${cards.length} cartes (${type === "eleve" ? "élèves" : type === "client" ? "clients" : "personnel"})`,
            ownerName: cards.length === 1 ? cards[0].name : undefined,
            reference: cards.length === 1 ? cards[0].matricule : undefined,
            refType: "card_sheet",
            refId: cards.map((c) => c.token).sort().join("-").slice(0, 120),
          }}
        />
      )}
      {type === "eleve" && cards.length === 1 && params.get("ids") && !params.get("ids")!.includes(",") && <SendToFamily studentId={params.get("ids")!} elementId="planche-cartes" docType="carte" />}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="font-bold text-slate-700">
          {cards.length} carte(s) · imprimez en couleur, recto-verso, à 100 % (format carte 9 × 5,5 cm)
        </p>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white">
          <Printer aria-hidden className="size-4" /> Imprimer
        </button>
      </div>
      <div id="planche-cartes" className="grid grid-cols-1 gap-6 bg-white md:grid-cols-2 print:grid-cols-2 print:gap-[4mm]">
        {cards.map((c) => (
          <div key={c.token} className="break-inside-avoid print:[&_.id-card]:w-[90mm] print:[&_.id-card]:max-w-none">
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
