"use client";

import QRCode from "qrcode";
import { useEffect, useState, type ReactNode } from "react";
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

function Row({ k, val, wide }: { k: string; val: ReactNode; wide?: boolean }) {
  return (
    <div className={`flex gap-2 border-b border-dotted border-slate-300 py-[3px] ${wide ? "col-span-2" : ""}`}>
      <dt className="w-[34mm] shrink-0 text-slate-500">{k}</dt>
      <dd className="font-semibold text-slate-900">{val}</dd>
    </div>
  );
}

function Title({ n, children, red }: { n: number; children: ReactNode; red?: boolean }) {
  return (
    <h2 className={`mt-[4mm] flex items-center gap-2 px-2 py-[3px] text-[10px] font-bold tracking-[0.18em] text-white uppercase ${red ? "bg-[#E30613]" : "bg-[#0C356A]"}`}>
      <span className="flex size-4 items-center justify-center rounded-full bg-white text-[9px] text-[#0C356A]">{n}</span>
      {children}
    </h2>
  );
}

/**
 * Fiche d'inscription définitive : document officiel A4 sur une page, généré automatiquement à partir du dossier
 * validé par l'administration (identité et photo, formation, parents, écolage et échéancier, paiements, signatures, QR).
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
  const parents = (
    [
      ["Père", s.parent_father_name, s.parent_father_phone, s.parent_father_profession],
      ["Mère", s.parent_mother_name, s.parent_mother_phone, s.parent_mother_profession],
      [`Tuteur${s.tutor_relation ? ` (${s.tutor_relation})` : ""}`, s.tutor_name, [s.tutor_phone, s.guardian_email].filter(Boolean).join(" · "), s.tutor_profession],
      ["Urgence", s.emergency_contact_name, s.emergency_contact_phone, ""],
    ] as unknown[][]
  ).filter((r) => r[1]);

  return (
    <article
      id="avenida-official-student-enrollment"
      className="mx-auto w-full max-w-[210mm] bg-white p-[6mm] text-[11px] leading-snug text-slate-900 shadow-xl ring-1 ring-slate-200 sm:p-[8mm] print:p-0 print:shadow-none print:ring-0"
    >
      <div className="flex min-h-[265mm] flex-col border-[3px] border-double border-[#0C356A] p-[5mm] sm:p-[6mm]">
        {/* En-tête officiel */}
        <header className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 border-b-[3px] border-[#E30613] pb-[3mm]">
          <div className="text-[9px] leading-tight text-slate-600">
            <p className="font-bold tracking-wider text-slate-800 uppercase">République Togolaise</p>
            <p className="italic">Travail – Liberté – Patrie</p>
            <p className="mt-1.5">Enseignement technique et formation professionnelle</p>
          </div>
          <div className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- document imprimable */}
            <img src="/logoavenida.jpg" alt="" className="size-[18mm] object-contain" />
            <p className="mt-1 font-serif text-[15px] font-extrabold tracking-wider text-[#0C356A]">
              HÔTEL ÉCOLE <span className="text-[#E30613]">AVENIDA</span>
            </p>
            <p className="text-[9px] font-semibold tracking-widest text-slate-500 uppercase">{siteConfig.motto}</p>
          </div>
          <div className="text-right text-[9px] leading-tight text-slate-600">
            <p>{siteConfig.address.street}</p>
            <p>{siteConfig.address.district}</p>
            <p>
              {siteConfig.address.postal} {siteConfig.address.city} – {siteConfig.address.country}
            </p>
            <p>{siteConfig.phones.map((p) => p.display).join(" · ")}</p>
            <p>{siteConfig.email}</p>
          </div>
        </header>

        <div className="mt-[3mm] flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-[19px] font-extrabold tracking-wide text-[#0C356A] uppercase">Fiche d&apos;inscription définitive</h1>
            <p className="text-[10px] text-slate-600">
              Année scolaire <strong>{v(s.academic_year)}</strong> · Établie le {d(new Date().toISOString())}
            </p>
          </div>
          <div className="rounded border-2 border-[#E30613] px-3 py-1 text-center">
            <p className="text-[8px] font-bold tracking-widest text-slate-500 uppercase">Matricule</p>
            <p className="font-mono text-[16px] font-extrabold text-[#E30613]">{v(s.registration_number)}</p>
          </div>
        </div>

        <Title n={1}>Identité de l&apos;élève</Title>
        <section className="mt-[2mm] flex gap-[4mm]">
          <div className="flex h-[45mm] w-[35mm] shrink-0 items-center justify-center overflow-hidden border-2 border-[#0C356A] bg-slate-50">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- photo d'identité en data URL
              <img src={photo} alt="Photo de l'élève" className="size-full object-cover" />
            ) : (
              <span className="px-2 text-center text-[9px] text-slate-400">PHOTO D&apos;IDENTITÉ 35 × 45 mm</span>
            )}
          </div>
          <dl className="grid flex-1 grid-cols-2 content-start gap-x-[5mm]">
            <Row k="Nom" val={String(s.last_name).toUpperCase()} />
            <Row k="Prénom(s)" val={s.first_name} />
            <Row k="Sexe" val={s.gender === "F" ? "Féminin" : s.gender === "M" ? "Masculin" : v(s.gender)} />
            <Row k="Nationalité" val={v(s.nationality)} />
            <Row k="Né(e) le" val={`${d(s.birth_date)} à ${v(s.birth_place)}`} wide />
            <Row k="Téléphone" val={v(s.phone)} />
            <Row k="Groupe sanguin" val={v(s.blood_group)} />
            <Row k="E-mail" val={v(s.email)} wide />
            <Row k="Adresse / quartier" val={[s.address, s.residence_neighborhood, s.city].filter(Boolean).join(", ") || "—"} wide />
            <Row k="N° étudiant" val={v(s.student_number)} />
            <Row k="Régime" val={s.boarder_status === "interne" ? "Interne" : "Externe"} />
          </dl>
        </section>

        <Title n={2}>Formation et parcours</Title>
        <dl className="mt-[2mm] grid grid-cols-2 gap-x-[5mm]">
          <Row k="Diplôme préparé" val={`${v(s.program_code)}${f ? ` — ${f.name}` : ""}`} wide />
          <Row k="Classe" val={v(s.class_name)} />
          <Row k="Spécialité" val={v(s.specialty ?? String(s.class_name ?? "").split(" - ")[1])} />
          <Row k="Niveau / durée" val={`${v(s.year_level)} · ${f?.duration ?? "—"}`} />
          <Row k="Dernière classe" val={`${v(s.last_class)} (${v(s.last_diploma)})`} />
          <Row k="Établissement précédent" val={v(s.previous_school)} wide />
        </dl>

        <Title n={3}>Parents, tuteur et contact d&apos;urgence</Title>
        <table className="mt-[2mm] w-full text-left">
          <thead className="text-[9px] text-slate-500 uppercase">
            <tr className="border-b border-slate-300">
              <th className="py-[2px]">Qualité</th>
              <th>Nom et prénoms</th>
              <th>Téléphone / e-mail</th>
              <th>Profession</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-semibold">
            {parents.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-[3px] text-slate-400">Non renseigné</td>
              </tr>
            ) : (
              parents.map((r) => (
                <tr key={String(r[0])}>
                  <td className="py-[3px] text-slate-500">{String(r[0])}</td>
                  <td>{v(r[1])}</td>
                  <td>{v(r[2])}</td>
                  <td>{v(r[3])}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Title n={4} red>
          Écolage et échéancier
        </Title>
        <div className="mt-[2mm] grid grid-cols-[1fr_1.35fr] gap-[5mm]">
          <dl className="flex flex-col">
            {[
              ["Inscription", formatFCFA(f?.registration ?? 0)],
              ["Fournitures", formatFCFA(supplies)],
              ["Scolarité annuelle", formatFCFA(tuition)],
              ["Écolage total", formatFCFA(total)],
              ["Déjà payé", formatFCFA(paidTotal)],
              ["Reste à payer", formatFCFA(remaining)],
            ].map(([k, val], i) => (
              <div key={k} className={`flex justify-between border-b border-slate-200 py-[3px] ${i === 3 ? "font-extrabold" : ""} ${i === 4 ? "font-bold text-emerald-700" : ""} ${i === 5 ? "font-extrabold text-[#E30613]" : ""}`}>
                <dt>{k}</dt>
                <dd>{val}</dd>
              </div>
            ))}
            {s.boarder_status === "interne" && (
              <p className="mt-1 text-[9px] text-slate-500">
                Internat : {formatFCFA(fees.boardingMonthly)} / mois + {fees.boardingDepositMonths} mois de caution.
              </p>
            )}
          </dl>
          <table className="w-full text-left text-[10px]">
            <thead className="text-[8.5px] text-slate-500 uppercase">
              <tr className="border-b border-slate-300">
                <th className="py-[2px]">Tranche</th>
                <th>Échéance</th>
                <th className="text-right">Montant</th>
                <th className="text-right">État</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.map((t) => (
                <tr key={t.n}>
                  <td className="py-[2px] font-semibold">{t.n}</td>
                  <td>{t.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className="text-right">{formatFCFA(t.amount)}</td>
                  <td className={`text-right font-bold ${t.settled ? "text-emerald-700" : t.date < new Date() ? "text-[#E30613]" : "text-slate-400"}`}>
                    {t.settled ? "Réglée" : t.date < new Date() ? "En retard" : "À venir"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paid.length > 0 && (
          <>
            <Title n={5}>Paiements enregistrés</Title>
            <table className="mt-[2mm] w-full text-left text-[10px]">
              <tbody className="divide-y divide-slate-100">
                {paid.slice(-6).map((p, i) => (
                  <tr key={i}>
                    <td className="py-[2px]">{d(p.payment_date ?? p.created_at)}</td>
                    <td className="font-mono">{v(p.receipt_number)}</td>
                    <td>{v(p.designation)}</td>
                    <td className="text-right font-semibold">{formatFCFA(p.amount ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p className="mt-[4mm] rounded bg-slate-50 p-2 text-[9.5px] text-slate-700">
          L&apos;élève et ses parents ou tuteur certifient l&apos;exactitude des informations ci-dessus et s&apos;engagent à respecter le règlement intérieur de l&apos;Hôtel École Avenida : port de
          la tenue officielle, ponctualité, assiduité et paiement de l&apos;écolage aux échéances.
        </p>
        <div className="mt-auto grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-[5mm] pt-[6mm] text-center text-[10px] font-semibold text-slate-600">
          {["L'élève", "Le parent / tuteur", "La Direction"].map((k) => (
            <div key={k}>
              <p>{k}</p>
              <div className="mt-[14mm] border-t border-slate-400 pt-1 text-[9px] font-normal">Signature{k === "La Direction" ? " et cachet" : ""}</div>
            </div>
          ))}
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
        <p className="mt-[3mm] border-t border-slate-200 pt-1 text-center text-[8.5px] text-slate-400">
          Document généré automatiquement par la plateforme Avenida · www.hotelecoleavenida.net · {siteConfig.motto}
        </p>
      </div>
    </article>
  );
}
