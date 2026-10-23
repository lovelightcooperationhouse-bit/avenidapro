"use client";

import { Download, Printer } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { documentVerifyUrl } from "@/components/cards/ReportCardSheet";
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
  token: string | null;
  student_id: string | null;
  depositor_role: string | null;
  raw_data: { online?: boolean; provider_ref?: string; identifier?: string; paid_at?: string } | null;
};

type Trace = { id: string; receipt_number: string | null; amount: number; payment_method: string | null; created_at: string; depositor_name: string | null };

const dt = (x: string) => new Date(x).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Reçu de paiement d'écolage (format A5, en double exemplaire sur une page A4). */
export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<Row | null>(null);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("fee_payments")
      .select("receipt_number, amount, payment_method, designation, payment_date, created_at, depositor_name, depositor_phone, depositor_role, cashier_name, student_name, student_matricule, class_name, total_due, remaining_due, token, student_id, raw_data")
      .eq("id", id)
      .maybeSingle()
      .then(async ({ data }) => {
        setR(data as Row);
        // QR de vérification généré par le système (authenticité du reçu)
        if (data?.token) QRCode.toDataURL(documentVerifyUrl("recu", data.token), { margin: 0, width: 200 }).then(setQr);
        // Traces : les paiements de l'élève jusqu'à celui-ci (date et heure de chacun)
        if (data?.student_id) {
          const { data: t } = await supabase
            .from("fee_payments")
            .select("id, receipt_number, amount, payment_method, created_at, depositor_name")
            .eq("student_id", data.student_id)
            .in("status", ["validé", "valide", "confirmé"])
            .lte("created_at", data.created_at)
            .order("created_at", { ascending: false })
            .limit(6);
          setTraces(((t ?? []) as Trace[]).reverse());
        }
      });
  }, [id]);

  if (!r) return <p className="p-10 text-center">Chargement du reçu…</p>;
  const paidAt = r.raw_data?.paid_at ?? r.created_at;
  const total = Number(r.total_due ?? 0);
  const remaining = Number(r.remaining_due ?? 0);

  const copy = (label: string) => (
    <section className="flex h-[138mm] flex-col border-2 border-[#0C356A] p-[7mm] text-[12px]">
      <header className="flex items-center justify-between border-b-4 border-[#E30613] pb-2">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- rendu imprimable */}
          <img src="/logo-avenida.png" alt="" className="size-12 object-contain" />
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
          <p className="text-[10px] font-semibold text-slate-600">{dt(paidAt)}</p>
          <p className="text-[10px] text-slate-500">{label}</p>
        </div>
      </header>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 text-[11px]">
        {[
          ["Date et heure", dt(paidAt)],
          ["Élève", r.student_name],
          ["Matricule", r.student_matricule],
          ["Classe", r.class_name],
          ["Objet", r.designation],
          ["Mode de paiement", r.payment_method],
          ["Versé par", [r.depositor_name, r.depositor_role ? `(${r.depositor_role})` : null, r.depositor_phone].filter(Boolean).join(" ")],
          ["Réf. transaction", r.raw_data?.provider_ref ? `PayDunya ${r.raw_data.provider_ref}` : r.raw_data?.online ? r.raw_data.identifier : "Caisse de l'école"],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-2 border-b border-slate-200 py-[3px]">
            <dt className="w-28 shrink-0 font-semibold text-slate-600">{k}</dt>
            <dd className="min-w-0 font-bold break-words">{v || "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
        <div className="rounded bg-emerald-50 p-1.5">
          <p className="text-[9px] text-slate-600">Montant reçu</p>
          <p className="text-base font-black text-emerald-800">{formatFCFA(r.amount)}</p>
        </div>
        <div className="rounded bg-slate-50 p-1.5">
          <p className="text-[9px] text-slate-600">Écolage annuel</p>
          <p className="text-sm font-black">{formatFCFA(total)}</p>
        </div>
        <div className="rounded bg-slate-50 p-1.5">
          <p className="text-[9px] text-slate-600">Total payé à ce jour</p>
          <p className="text-sm font-black text-emerald-800">{formatFCFA(Math.max(0, total - remaining))}</p>
        </div>
        <div className="rounded bg-red-50 p-1.5">
          <p className="text-[9px] text-slate-600">{remaining <= 0 ? "Écolage soldé" : "Reste à payer"}</p>
          <p className="text-sm font-black text-[#B8000F]">{formatFCFA(remaining)}</p>
        </div>
      </div>
      {traces.length > 0 && (
        <table className="mt-2 w-full text-[9.5px]">
          <caption className="text-left text-[9px] font-bold tracking-wider text-slate-500 uppercase">Traces des paiements</caption>
          <tbody>
            {traces.map((t) => (
              <tr key={t.id} className={t.receipt_number === r.receipt_number ? "bg-amber-50 font-bold" : "border-b border-slate-100"}>
                <td className="py-[1px]">{dt(t.created_at)}</td>
                <td className="font-mono">{t.receipt_number}</td>
                <td>{t.payment_method}</td>
                <td className="truncate">{t.depositor_name}</td>
                <td className="text-right">{formatFCFA(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-auto flex items-end justify-between gap-3 pt-2 text-[10px]">
        <p>
          Caissier(ère) : <strong>{r.cashier_name}</strong>
          <br />
          <span className="text-slate-500">Vérifiez l&apos;authenticité en scannant le QR code.</span>
        </p>
        <p className="w-40 border-t border-slate-400 pt-1 text-center">Cachet et signature</p>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- QR code généré
          <img src={qr} alt="QR code de vérification du reçu" className="size-[22mm]" />
        ) : (
          <span className="size-[22mm] border border-dashed border-slate-300" />
        )}
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
