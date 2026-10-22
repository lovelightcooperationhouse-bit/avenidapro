"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { fees, formations, siteConfig } from "@/content/site";
import { paymentOk } from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";
import { formatFCFA } from "@/lib/utils";
import { documentVerifyUrl } from "./ReportCardSheet";

type Student = Record<string, string | number | null | boolean | undefined> & { id: string; first_name: string; last_name: string };
type Payment = { id: string; receipt_number: string | null; amount: number; payment_method: string | null; designation: string | null; payment_date: string | null; created_at: string; depositor_name: string | null; cashier_name: string | null };

const dt = (x: string) => new Date(x).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const d = (x: Date) => x.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

/** Statut de l'élève vis-à-vis de l'écolage. */
export function situationStatus(s: { total_fee?: unknown; paid_fee?: unknown; remaining_fee?: unknown; academic_year?: unknown }) {
  const total = Number(s.total_fee ?? 0);
  const remaining = Number(s.remaining_fee ?? 0);
  if (total > 0 && remaining <= 0) return { label: "Soldé", tone: "#047857", bg: "#ECFDF5" };
  if (paymentOk({ total_fee: total, paid_fee: Number(s.paid_fee ?? 0), remaining_fee: remaining, academic_year: String(s.academic_year ?? "") }))
    return { label: "En règle", tone: "#0C356A", bg: "#EFF6FF" };
  return { label: "En retard de paiement", tone: "#B8000F", bg: "#FEF2F2" };
}

/**
 * Fiche de situation financière (écolage) : document A4 distinct de la fiche d'inscription,
 * généré en temps réel à partir des paiements enregistrés (chaque paiement est déduit automatiquement).
 */
export function SituationSheet({ studentId }: { studentId: string }) {
  const [s, setS] = useState<Student | null | undefined>(undefined);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [qr, setQr] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("students").select("*").eq("id", studentId).maybeSingle();
      setS((data as Student) ?? null);
      if (!data) return;
      const keys = [data.id, data.registration_number, data.student_number].filter(Boolean);
      const { data: p } = await supabase
        .from("fee_payments")
        .select("id, receipt_number, amount, payment_method, designation, payment_date, created_at, depositor_name, cashier_name")
        .in("student_id", keys)
        .in("status", ["validé", "valide", "confirmé"])
        .order("payment_date", { ascending: true });
      setPayments((p ?? []) as Payment[]);
      if (data.situation_token) QRCode.toDataURL(documentVerifyUrl("situation", String(data.situation_token)), { margin: 0, width: 220 }).then(setQr);
    })();
  }, [studentId]);

  if (s === undefined) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  if (!s) return <p className="rounded-2xl bg-amber-50 p-6 text-amber-900">Dossier introuvable ou non accessible.</p>;

  const f = formations.find((x) => x.code === s.program_code);
  const supplies = s.program_code === "CFA" ? fees.suppliesCfa : fees.suppliesDiploma;
  const total = Number(s.total_fee ?? 0);
  const paid = Number(s.paid_fee ?? payments.reduce((a, p) => a + Number(p.amount), 0));
  const remaining = Number(s.remaining_fee ?? Math.max(0, total - paid));
  const registration = (f?.registration ?? 0) + supplies;
  const tuition = Math.max(0, total - registration);
  const startYear = parseInt(String(s.academic_year ?? "").slice(0, 4), 10) || now.getFullYear();
  // Échéancier : inscription + fournitures à l'inscription, puis la scolarité en 8 tranches mensuelles
  const schedule = [
    { label: "Inscription et fournitures", date: new Date(startYear, 9, 1), amount: Math.min(registration, total) },
    ...Array.from({ length: 8 }, (_, i) => ({ label: `Tranche ${i + 1}`, date: new Date(startYear, 9 + i, 5), amount: Math.round(tuition / 8) })),
  ];
  let cumul = 0;
  const lines = schedule.map((t) => {
    cumul += t.amount;
    return { ...t, cumul, settled: paid >= cumul, late: paid < cumul && t.date < now };
  });
  let running = total;
  const history = payments.map((p) => {
    running = Math.max(0, running - Number(p.amount));
    return { ...p, after: running };
  });
  const status = situationStatus({ total_fee: s.total_fee, paid_fee: s.paid_fee, remaining_fee: s.remaining_fee, academic_year: s.academic_year });
  const photo = typeof s.photo_url === "string" && !s.photo_url.includes("default") ? s.photo_url : null;
  const tutor = [s.tutor_name || s.parent_mother_name || s.parent_father_name, s.tutor_phone || s.parent_mother_phone || s.parent_father_phone].filter(Boolean).join(" · ");

  return (
    <article id="avenida-fiche-situation" className="mx-auto w-full max-w-[210mm] bg-white p-[6mm] text-[11px] leading-snug text-slate-900 shadow-xl ring-1 ring-slate-200 sm:p-[8mm] print:p-0 print:shadow-none print:ring-0">
      <div className="flex min-h-[265mm] flex-col border-[3px] border-double border-[#0C356A] p-[5mm] sm:p-[6mm]">
        <header className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 border-b-[3px] border-[#E30613] pb-[3mm]">
          <div className="text-[9px] leading-tight text-slate-600">
            <p className="font-bold tracking-wider text-slate-800 uppercase">République Togolaise</p>
            <p className="italic">Travail – Liberté – Patrie</p>
            <p className="mt-1.5">Service de la comptabilité</p>
          </div>
          <div className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- document imprimable */}
            <img src="/logoavenida.jpg" alt="" className="size-[16mm] object-contain" />
            <p className="mt-1 font-serif text-[15px] font-extrabold tracking-wider text-[#0C356A]">
              HÔTEL ÉCOLE <span className="text-[#E30613]">AVENIDA</span>
            </p>
            <p className="text-[9px] font-semibold tracking-widest text-slate-500 uppercase">{siteConfig.motto}</p>
          </div>
          <div className="text-right text-[9px] leading-tight text-slate-600">
            <p>{siteConfig.address.street}</p>
            <p>
              {siteConfig.address.postal} {siteConfig.address.city}
            </p>
            <p>{siteConfig.phones[0].display}</p>
            <p>{siteConfig.email}</p>
          </div>
        </header>

        <div className="mt-[3mm] flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-[18px] font-extrabold tracking-wide text-[#0C356A] uppercase">Fiche de situation financière</h1>
            <p className="text-[10px] text-slate-600">
              Écolage · Année scolaire <strong>{String(s.academic_year ?? "")}</strong> · situation arrêtée au <strong>{dt(now.toISOString())}</strong>
            </p>
          </div>
          <div className="rounded border-2 px-3 py-1 text-center" style={{ borderColor: status.tone, background: status.bg }}>
            <p className="text-[8px] font-bold tracking-widest text-slate-500 uppercase">Statut</p>
            <p className="text-[13px] font-extrabold" style={{ color: status.tone }}>
              {status.label}
            </p>
          </div>
        </div>

        <section className="mt-[3mm] flex gap-[4mm] rounded border border-slate-300 p-[3mm]">
          <div className="flex h-[28mm] w-[22mm] shrink-0 items-center justify-center overflow-hidden border-2 border-[#0C356A] bg-slate-50">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- photo d'identité en data URL
              <img src={photo} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-[8px] text-slate-400">PHOTO</span>
            )}
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-x-[5mm] gap-y-[2px] text-[10.5px]">
            {[
              ["Élève", `${String(s.last_name).toUpperCase()} ${s.first_name}`],
              ["Matricule", s.registration_number],
              ["Classe", s.class_name],
              ["Filière", `${s.program_code ?? ""}${f ? ` — ${f.name}` : ""}`],
              ["Régime", s.boarder_status === "interne" ? "Interne" : "Externe"],
              ["Parent / tuteur", tutor || "—"],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex gap-2 border-b border-dotted border-slate-300">
                <dt className="w-[26mm] shrink-0 text-slate-500">{k}</dt>
                <dd className="font-semibold">{String(v ?? "—")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-[4mm] grid grid-cols-3 gap-[3mm] text-center">
          <div className="rounded border border-slate-300 p-2">
            <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">Écolage annuel</p>
            <p className="text-[16px] font-extrabold text-[#0C356A]">{formatFCFA(total)}</p>
          </div>
          <div className="rounded border border-emerald-300 bg-emerald-50 p-2">
            <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">Total payé</p>
            <p className="text-[16px] font-extrabold text-emerald-700">{formatFCFA(paid)}</p>
          </div>
          <div className="rounded border border-red-300 bg-red-50 p-2">
            <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">Reste à payer</p>
            <p className="text-[16px] font-extrabold text-[#E30613]">{formatFCFA(remaining)}</p>
          </div>
        </div>

        <h2 className="mt-[4mm] bg-[#0C356A] px-2 py-[3px] text-[10px] font-bold tracking-[0.18em] text-white uppercase">Échéancier de l&apos;année</h2>
        <table className="w-full text-left text-[10px]">
          <thead className="text-[8.5px] text-slate-500 uppercase">
            <tr className="border-b border-slate-300">
              <th className="py-[2px]">Échéance</th>
              <th>Date</th>
              <th className="text-right">Montant</th>
              <th className="text-right">Cumul dû</th>
              <th className="text-right">État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((t) => (
              <tr key={t.label}>
                <td className="py-[2px] font-semibold">{t.label}</td>
                <td>{d(t.date)}</td>
                <td className="text-right">{formatFCFA(t.amount)}</td>
                <td className="text-right">{formatFCFA(t.cumul)}</td>
                <td className={`text-right font-bold ${t.settled ? "text-emerald-700" : t.late ? "text-[#E30613]" : "text-slate-400"}`}>{t.settled ? "Réglée" : t.late ? "En retard" : "À venir"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-[4mm] bg-[#E30613] px-2 py-[3px] text-[10px] font-bold tracking-[0.18em] text-white uppercase">Historique des paiements ({history.length})</h2>
        {history.length === 0 ? (
          <p className="py-2 text-slate-500">Aucun paiement enregistré à ce jour.</p>
        ) : (
          <table className="w-full text-left text-[10px]">
            <thead className="text-[8.5px] text-slate-500 uppercase">
              <tr className="border-b border-slate-300">
                <th className="py-[2px]">Date et heure</th>
                <th>Reçu</th>
                <th>Objet</th>
                <th>Mode</th>
                <th className="text-right">Montant</th>
                <th className="text-right">Reste après</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((p) => (
                <tr key={p.id}>
                  <td className="py-[2px]">{dt(p.payment_date ?? p.created_at)}</td>
                  <td className="font-mono">{p.receipt_number}</td>
                  <td>{p.designation}</td>
                  <td>{p.payment_method}</td>
                  <td className="text-right font-bold text-emerald-700">{formatFCFA(Number(p.amount))}</td>
                  <td className="text-right font-semibold">{formatFCFA(p.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="mt-[4mm] rounded bg-slate-50 p-2 text-[9.5px] text-slate-700">
          La présente fiche atteste la situation de l&apos;élève vis-à-vis de l&apos;écolage à la date indiquée. Elle est mise à jour automatiquement à chaque paiement
          enregistré par la caisse de l&apos;établissement.
        </p>
        <div className="mt-auto grid grid-cols-[1fr_1fr_auto] items-end gap-[5mm] pt-[6mm] text-center text-[10px] font-semibold text-slate-600">
          <div>
            <p>Le parent / tuteur</p>
            <div className="mt-[12mm] border-t border-slate-400 pt-1 text-[9px] font-normal">Signature</div>
          </div>
          <div>
            <p>La Comptabilité</p>
            <div className="mt-[12mm] border-t border-slate-400 pt-1 text-[9px] font-normal">Signature et cachet</div>
          </div>
          <div className="flex flex-col items-center">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element -- QR code généré
              <img src={qr} alt="QR code de vérification" className="size-[20mm]" />
            ) : (
              <span className="size-[20mm] border border-dashed border-slate-300" />
            )}
            <span className="mt-0.5 text-[8px] font-normal">Vérification</span>
          </div>
        </div>
        <p className="mt-[3mm] border-t border-slate-200 pt-1 text-center text-[8.5px] text-slate-400">Document généré par la plateforme Avenida · situation vérifiable en temps réel par QR code</p>
      </div>
    </article>
  );
}
