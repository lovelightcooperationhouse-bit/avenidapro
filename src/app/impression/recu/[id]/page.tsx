"use client";

import { Download, Printer } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { siteConfig } from "@/content/site";
import { elementToPdf } from "@/lib/pdf";
import { createClient } from "@/lib/supabase/client";
import { formatFCFA } from "@/lib/utils";

type Row = {
  receipt_number: string | null;
  amount: number;
  payment_method: string | null;
  designation: string | null;
  payment_date: string | null;
  created_at: string;
  depositor_name: string | null;
  depositor_phone: string | null;
  cashier_name: string | null;
  student_name: string | null;
  student_matricule: string | null;
  class_name: string | null;
  total_due: number | null;
  remaining_due: number | null;
};

/** Reçu de paiement d'écolage (format A5, en double exemplaire sur une page A4). */
export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<Row | null>(null);
  useEffect(() => {
    createClient()
      .from("fee_payments")
      .select("receipt_number, amount, payment_method, designation, payment_date, created_at, depositor_name, depositor_phone, cashier_name, student_name, student_matricule, class_name, total_due, remaining_due")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setR(data as Row));
  }, [id]);

  if (!r) return <p className="p-10 text-center">Chargement du reçu…</p>;
  const date = new Date(r.payment_date ?? r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const copy = (label: string) => (
    <section className="flex h-[138mm] flex-col border-2 border-[#0C356A] p-[7mm] text-[12px]">
      <header className="flex items-center justify-between border-b-4 border-[#E30613] pb-2">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- rendu imprimable */}
          <img src="/logoavenida.jpg" alt="" className="size-12 object-contain" />
          <div>
            <p className="font-serif text-base font-extrabold text-[#0C356A]">HÔTEL ÉCOLE AVENIDA</p>
            <p className="text-[10px] text-slate-600">
              {siteConfig.address.street} · {siteConfig.address.city} · {siteConfig.phones[0].display}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black tracking-wide text-[#E30613]">REÇU DE PAIEMENT</p>
          <p className="font-mono text-sm font-bold">{r.receipt_number}</p>
          <p className="text-[10px] text-slate-500">{label}</p>
        </div>
      </header>
      <table className="mt-3 w-full">
        <tbody>
          {[
            ["Date", date],
            ["Élève", r.student_name],
            ["Matricule", r.student_matricule],
            ["Classe", r.class_name],
            ["Objet", r.designation],
            ["Mode de paiement", r.payment_method],
            ["Versé par", [r.depositor_name, r.depositor_phone].filter(Boolean).join(" · ")],
          ].map(([k, v]) => (
            <tr key={k} className="border-b border-slate-200">
              <th className="w-40 py-1 text-left font-semibold text-slate-600">{k}</th>
              <td className="py-1 font-bold">{v || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded bg-emerald-50 p-2">
          <p className="text-[10px] text-slate-600">Montant reçu</p>
          <p className="text-lg font-black text-emerald-800">{formatFCFA(r.amount)}</p>
        </div>
        <div className="rounded bg-slate-50 p-2">
          <p className="text-[10px] text-slate-600">Écolage annuel</p>
          <p className="text-base font-black">{formatFCFA(r.total_due ?? 0)}</p>
        </div>
        <div className="rounded bg-red-50 p-2">
          <p className="text-[10px] text-slate-600">Reste à payer</p>
          <p className="text-base font-black text-[#B8000F]">{formatFCFA(r.remaining_due ?? 0)}</p>
        </div>
      </div>
      <div className="mt-auto flex justify-between pt-4 text-[10px]">
        <p>
          Caissier(ère) : <strong>{r.cashier_name}</strong>
        </p>
        <p className="w-40 border-t border-slate-400 pt-1 text-center">Cachet et signature</p>
      </div>
    </section>
  );

  return (
    <div className="min-h-dvh bg-slate-100 p-4 print:bg-white print:p-0">
      <div className="mx-auto mb-3 flex max-w-[210mm] justify-end gap-2 print:hidden">
        <button type="button" onClick={async () => (await elementToPdf(document.getElementById("recu")!)).save(`Recu-${r.receipt_number}.pdf`)} className="inline-flex items-center gap-2 rounded-full bg-[#0C356A] px-4 py-2 text-sm font-bold text-white">
          <Download aria-hidden className="size-4" /> PDF
        </button>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-4 py-2 text-sm font-bold text-white">
          <Printer aria-hidden className="size-4" /> Imprimer
        </button>
      </div>
      <div id="recu" className="mx-auto flex max-w-[210mm] flex-col gap-[6mm] bg-white p-[6mm]">
        {copy("Exemplaire famille")}
        {copy("Exemplaire école")}
      </div>
    </div>
  );
}
