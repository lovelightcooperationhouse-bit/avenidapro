"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { fees, formations, siteConfig } from "@/content/site";
import { createClient } from "@/lib/supabase/client";
import { formatFCFA } from "@/lib/utils";
import { verifyUrl } from "./IdCard";

type Student = Record<string, string | number | null | boolean | undefined> & {
  id: string;
  first_name: string;
  last_name: string;
};

const v = (x: unknown) => (x === null || x === undefined || x === "" ? "—" : String(x));
const d = (x: unknown) => (x ? new Date(String(x)).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—");

/**
 * Fiche d'inscription définitive (A4 imprimable), établie à partir du dossier validé par l'administration :
 * identité, scolarité, parents, frais et échéancier en 8 tranches, situation des paiements, signatures.
 */
export function EnrollmentSheet({ studentId }: { studentId: string }) {
  const [s, setS] = useState<Student | null | undefined>(undefined);
  const [paid, setPaid] = useState<{ receipt_number: string | null; amount: number | null; payment_date: string | null; created_at: string; designation: string | null }[]>([]);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("students").select("*").eq("id", studentId).maybeSingle();
      setS((data as Student) ?? null);
      if (data) {
        const keys = [data.id, data.registration_number, data.student_number].filter(Boolean);
        const [{ data: p }, { data: card }] = await Promise.all([
          supabase.from("fee_payments").select("receipt_number, amount, payment_date, created_at, designation").in("student_id", keys).order("created_at"),
          supabase.from("id_cards").select("token").eq("student_id", data.id).eq("revoked", false).maybeSingle(),
        ]);
        setPaid(p ?? []);
        if (card?.token) QRCode.toDataURL(verifyUrl(card.token), { margin: 0, width: 220 }).then(setQr);
      }
    })();
  }, [studentId]);

  if (s === undefined) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  if (!s) return <p className="rounded-2xl bg-amber-50 p-6 text-amber-900">Dossier introuvable ou non accessible.</p>;

  const f = formations.find((x) => x.code === s.program_code);
  const supplies = s.program_code === "CFA" ? fees.suppliesCfa : fees.suppliesDiploma;
  const total = Number(s.total_fee ?? (f ? f.registration + f.tuition + supplies : 0));
  const paidTotal = Number(s.paid_fee ?? paid.reduce((a, p) => a + (p.amount ?? 0), 0));
  const remaining = Number(s.remaining_fee ?? Math.max(0, total - paidTotal));
  const tuition = f?.tuition ?? Math.max(0, total - (f?.registration ?? 0) - supplies);
  const startYear = parseInt(String(s.academic_year ?? "").slice(0, 4), 10) || new Date().getFullYear();
  const schedule = Array.from({ length: 8 }, (_, i) => {
    const date = new Date(startYear, 9 + i, 5);
    const amount = Math.round(tuition / 8);
    const cumulative = (f?.registration ?? 0) + supplies + amount * (i + 1);
    return { n: i + 1, date, amount, settled: paidTotal >= cumulative };
  });
  const photo = typeof s.photo_url === "string" && !s.photo_url.includes("default.png") ? s.photo_url : null;

  return (
    <article id="avenida-official-student-enrollment" className="mx-auto w-full max-w-[210mm] bg-white p-8 text-[13px] text-slate-900 shadow-xl ring-1 ring-slate-200 print:p-0 print:shadow-none print:ring-0">
      <div className="flex items-start justify-between gap-6 border-b-4 border-[#0C356A] pb-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- document imprimable */}
          <img src="/logoavenida.jpg" alt="" className="size-16 object-contain" />
          <div>
            <p className="font-serif text-lg font-extrabold text-[#0C356A]">HÔTEL ÉCOLE <span className="text-[#E30613]">AVENIDA</span></p>
            <p className="text-[11px] text-slate-600">Centre de formation · Hôtellerie · Restauration · Tourisme</p>
            <p className="text-[11px] text-slate-600">
              {siteConfig.address.street}, {siteConfig.address.district} · {siteConfig.address.postal} {siteConfig.address.city} · {siteConfig.phones[0].display}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Année scolaire</p>
          <p className="font-bold">{v(s.academic_year)}</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR code généré */}
          {qr && <img src={qr} alt="QR code de vérification" className="mt-2 ml-auto size-16" />}
        </div>
      </div>

      <h1 className="mt-5 text-center font-display text-2xl font-extrabold tracking-wide text-[#0C356A] uppercase">Fiche d&apos;inscription définitive</h1>
      <p className="text-center text-xs text-slate-500">Matricule {v(s.registration_number)} · N° étudiant {v(s.student_number)}</p>

      <section className="mt-5 flex gap-5">
        <div className="h-36 w-28 shrink-0 overflow-hidden border-2 border-[#0C356A]/30 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element -- photo en data URL */}
          {photo ? <img src={photo} alt="Photo de l'élève" className="size-full object-cover" /> : <span className="flex size-full items-center justify-center text-xs text-slate-400">PHOTO</span>}
        </div>
        <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-1.5">
          {[
            ["Nom", String(s.last_name).toUpperCase()],
            ["Prénom(s)", s.first_name],
            ["Sexe", s.gender === "F" ? "Féminin" : s.gender === "M" ? "Masculin" : v(s.gender)],
            ["Né(e) le", `${d(s.birth_date)} à ${v(s.birth_place)}`],
            ["Nationalité", v(s.nationality)],
            ["Quartier", v(s.residence_neighborhood)],
            ["Téléphone", v(s.phone)],
            ["E-mail", v(s.email)],
            ["Régime", s.boarder_status === "interne" ? "Interne" : "Externe"],
            ["Groupe sanguin", v(s.blood_group)],
          ].map(([k, val]) => (
            <div key={k} className="flex gap-2 border-b border-dotted border-slate-300 py-0.5">
              <dt className="w-28 shrink-0 font-semibold text-slate-500">{k}</dt>
              <dd className="font-semibold">{val}</dd>
            </div>
          ))}
        </dl>
      </section>

      <h2 className="mt-6 bg-[#0C356A] px-3 py-1.5 text-xs font-bold tracking-widest text-white uppercase">Scolarité</h2>
      <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5">
        {[
          ["Diplôme préparé", `${v(s.program_code)}${f ? ` — ${f.name}` : ""}`],
          ["Classe", v(s.class_name)],
          ["Spécialité", v(s.specialty ?? String(s.class_name ?? "").split(" - ")[1])],
          ["Durée", f?.duration ?? "—"],
          ["Dernière classe / diplôme", `${v(s.last_class)} / ${v(s.last_diploma)}`],
          ["Établissement précédent", v(s.previous_school)],
        ].map(([k, val]) => (
          <div key={k} className="flex gap-2 border-b border-dotted border-slate-300 py-0.5">
            <dt className="w-40 shrink-0 font-semibold text-slate-500">{k}</dt>
            <dd className="font-semibold">{val}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-6 bg-[#0C356A] px-3 py-1.5 text-xs font-bold tracking-widest text-white uppercase">Parents / tuteur</h2>
      <table className="mt-2 w-full text-left">
        <thead className="text-[11px] text-slate-500 uppercase">
          <tr>
            <th className="py-1">Qualité</th>
            <th>Nom</th>
            <th>Téléphone</th>
            <th>Profession</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-semibold">
          {[
            ["Père", s.parent_father_name, s.parent_father_phone, s.parent_father_profession],
            ["Mère", s.parent_mother_name, s.parent_mother_phone, s.parent_mother_profession],
            [`Tuteur ${s.tutor_relation ? `(${s.tutor_relation})` : ""}`, s.tutor_name, [s.tutor_phone, s.guardian_email].filter(Boolean).join(" · "), s.tutor_profession],
            ["Contact d'urgence", s.emergency_contact_name, s.emergency_contact_phone, ""],
          ]
            .filter((r) => r[1])
            .map((r) => (
              <tr key={String(r[0])}>
                <td className="py-1.5">{String(r[0])}</td>
                <td>{v(r[1])}</td>
                <td>{v(r[2])}</td>
                <td>{v(r[3])}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <h2 className="mt-6 bg-[#E30613] px-3 py-1.5 text-xs font-bold tracking-widest text-white uppercase">Frais et échéancier</h2>
      <div className="mt-2 grid grid-cols-[1fr_1.4fr] gap-6">
        <dl className="flex flex-col gap-1">
          {[
            ["Inscription", formatFCFA(f?.registration ?? 0)],
            ["Fournitures", formatFCFA(supplies)],
            ["Scolarité annuelle", formatFCFA(tuition)],
            ["Total", formatFCFA(total)],
            ["Déjà payé", formatFCFA(paidTotal)],
            ["Reste à payer", formatFCFA(remaining)],
          ].map(([k, val], i) => (
            <div key={k} className={`flex justify-between border-b border-slate-200 py-1 ${i === 3 ? "font-extrabold" : ""} ${i === 5 ? "font-extrabold text-[#E30613]" : ""}`}>
              <dt>{k}</dt>
              <dd>{val}</dd>
            </div>
          ))}
          {s.boarder_status === "interne" && <p className="mt-1 text-[11px] text-slate-500">Internat : {formatFCFA(fees.boardingMonthly)} / mois + {fees.boardingDepositMonths} mois de caution (facturés à part).</p>}
        </dl>
        <table className="w-full text-left text-[12px]">
          <thead className="text-[10px] text-slate-500 uppercase">
            <tr>
              <th className="py-1">Tranche</th>
              <th>Échéance</th>
              <th className="text-right">Montant</th>
              <th className="text-right">État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {schedule.map((t) => (
              <tr key={t.n}>
                <td className="py-1 font-semibold">{t.n}</td>
                <td>{t.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td className="text-right">{formatFCFA(t.amount)}</td>
                <td className={`text-right font-bold ${t.settled ? "text-emerald-700" : t.date < new Date() ? "text-[#E30613]" : "text-slate-400"}`}>{t.settled ? "Réglée" : t.date < new Date() ? "En retard" : "À venir"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paid.length > 0 && (
        <>
          <h2 className="mt-6 bg-slate-700 px-3 py-1.5 text-xs font-bold tracking-widest text-white uppercase">Historique des paiements</h2>
          <table className="mt-2 w-full text-left text-[12px]">
            <tbody className="divide-y divide-slate-200">
              {paid.map((p, i) => (
                <tr key={i}>
                  <td className="py-1">{d(p.payment_date ?? p.created_at)}</td>
                  <td>Reçu {v(p.receipt_number)}</td>
                  <td>{v(p.designation)}</td>
                  <td className="text-right font-semibold">{formatFCFA(p.amount ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <p className="mt-6 text-[11px] text-slate-600">
        L&apos;élève et ses parents s&apos;engagent à respecter le règlement intérieur de l&apos;Hôtel École Avenida : port de la tenue officielle, ponctualité, assiduité et
        paiement des frais aux échéances. Devise : « {siteConfig.motto} ».
      </p>
      <div className="mt-8 grid grid-cols-3 gap-6 text-center text-[11px] font-semibold text-slate-600">
        {["L'élève", "Le parent / tuteur", "La Direction"].map((k) => (
          <div key={k}>
            <p>{k}</p>
            <div className="mt-12 border-t border-slate-400 pt-1">Signature</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-[10px] text-slate-400">Document établi le {d(new Date().toISOString())} · vérifiable par QR code · Hôtel École Avenida, Lomé</p>
    </article>
  );
}
