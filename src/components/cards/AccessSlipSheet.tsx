"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { siteConfig } from "@/content/site";
import { createClient } from "@/lib/supabase/client";
import { documentVerifyUrl } from "./ReportCardSheet";

export type AccessSlip = {
  id: string;
  number: string | null;
  token: string;
  student_id: string;
  kind: "permission" | "absence" | "retard";
  period_start: string | null;
  period_end: string | null;
  return_date: string;
  reason: string | null;
  decision_note: string | null;
  issued_by_name: string | null;
  issued_at: string;
  status: "valide" | "presente" | "annule";
  presented_at: string | null;
  presented_by_name: string | null;
};

export const SLIP_KIND: Record<AccessSlip["kind"], string> = { permission: "Permission accordée", absence: "Absence justifiée", retard: "Retard justifié" };
export const SLIP_STATUS: Record<AccessSlip["status"], { label: string; tone: string }> = {
  valide: { label: "Valide · à présenter", tone: "bg-emerald-100 text-emerald-800" },
  presente: { label: "Présenté en classe", tone: "bg-slate-200 text-slate-700" },
  annule: { label: "Annulé", tone: "bg-red-100 text-red-700" },
};

const day = (d: string | null) => (d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "—");
const short = (d: string | null) => (d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR") : "—");

type Student = { first_name: string; last_name: string; registration_number: string | null; class_name: string | null; program_code: string | null; photo_url: string | null; tutor_name: string | null; tutor_phone: string | null };

/** Billet d'admission en classe (format paysage, demi-A4) : à présenter au professeur avant de réintégrer la classe. */
export function AccessSlipSheet({ id }: { id: string }) {
  const [slip, setSlip] = useState<AccessSlip | null | undefined>(undefined);
  const [st, setSt] = useState<Student | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("class_access_slips")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(async ({ data }) => {
        setSlip((data as AccessSlip) ?? null);
        if (!data) return;
        QRCode.toDataURL(documentVerifyUrl("billet", data.token), { margin: 0, width: 220 }).then(setQr);
        const { data: s } = await supabase.from("students").select("first_name, last_name, registration_number, class_name, program_code, photo_url, tutor_name, tutor_phone").eq("id", data.student_id).maybeSingle();
        setSt(s as Student | null);
      });
  }, [id]);

  if (slip === undefined) return <div className="h-72 animate-pulse rounded-3xl bg-white" />;
  if (!slip) return <p className="rounded-2xl bg-amber-50 p-6 text-amber-900">Billet introuvable ou non accessible.</p>;
  const photo = st?.photo_url && !st.photo_url.includes("default") ? st.photo_url : null;
  const period = slip.period_start ? (slip.period_end && slip.period_end !== slip.period_start ? `du ${short(slip.period_start)} au ${short(slip.period_end)}` : `le ${short(slip.period_start)}`) : "";

  return (
    <article id="avenida-billet-admission" className="relative mx-auto w-full max-w-[210mm] bg-white p-[6mm] text-[11px] leading-snug text-slate-900 shadow-xl ring-1 ring-slate-200 print:shadow-none print:ring-0">
      {slip.status === "annule" && (
        <p aria-hidden className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -rotate-[18deg] text-[60px] font-black text-red-600/15">ANNULÉ</p>
      )}
      <div className="border-[3px] border-double border-[#1B1652] p-[5mm]">
        <header className="flex items-center gap-[4mm] border-b-[3px] border-[#E31B3A] pb-[3mm]">
          {/* eslint-disable-next-line @next/next/no-img-element -- document imprimable */}
          <img src="/logo-avenida.png" alt="" className="size-[17mm] object-contain" />
          <div className="flex-1">
            <p className="font-serif text-[15px] font-extrabold text-[#1B1652]">
              HÔTEL ÉCOLE <span className="text-[#E31B3A]">AVENIDA</span>
            </p>
            <p className="text-[9.5px] font-semibold text-slate-600 uppercase">Vie scolaire · Surveillance générale</p>
            <p className="text-[9px] text-slate-500">
              {siteConfig.address.postal} · {siteConfig.phones[0].display} · {siteConfig.address.city} – Togo
            </p>
          </div>
          <div className="rounded border-2 border-[#E31B3A] px-3 py-1.5 text-center">
            <p className="text-[8px] font-bold tracking-widest text-slate-500 uppercase">Billet n°</p>
            <p className="font-mono text-[14px] font-extrabold text-[#E31B3A]">{slip.number}</p>
          </div>
        </header>

        <h1 className="mt-[3mm] bg-[#1B1652] py-[2mm] text-center font-display text-[17px] font-extrabold tracking-[0.18em] text-white">BILLET D&apos;ADMISSION EN CLASSE</h1>
        <p className="mt-1 text-center text-[10px] font-semibold text-[#E31B3A] uppercase">{SLIP_KIND[slip.kind]} · à présenter au professeur avant d&apos;entrer en classe</p>

        <section className="mt-[3mm] flex gap-[4mm]">
          <div className="flex h-[30mm] w-[23mm] shrink-0 items-center justify-center overflow-hidden border-2 border-[#1B1652] bg-slate-50">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- photo d'identité
              <img src={photo} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-[8px] text-slate-400">PHOTO</span>
            )}
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-x-[5mm] gap-y-[1.5mm] text-[11px]">
            {[
              ["Nom et prénoms", st ? `${st.last_name.toUpperCase()} ${st.first_name}` : "…"],
              ["Matricule", st?.registration_number ?? "—"],
              ["Classe", st?.class_name ?? "—"],
              ["Filière", st?.program_code ?? "—"],
              ["Motif", SLIP_KIND[slip.kind]],
              ["Période concernée", period || "—"],
              ["Parent / tuteur", [st?.tutor_name, st?.tutor_phone].filter(Boolean).join(" · ") || "—"],
              ["Délivré le", new Date(slip.issued_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-dotted border-slate-300 pb-[1mm]">
                <dt className="text-[8.5px] font-bold tracking-wide text-slate-500 uppercase">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-[3mm] rounded border-2 border-emerald-600 bg-emerald-50 p-[3mm] text-center">
          <p className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase">Admis(e) à réintégrer la classe le</p>
          <p className="font-display text-[17px] font-extrabold text-emerald-900 capitalize">{day(slip.return_date)}</p>
        </div>

        {(slip.reason || slip.decision_note) && (
          <div className="mt-[3mm] grid gap-[2mm] text-[10.5px] sm:grid-cols-2">
            {slip.reason && (
              <p className="rounded bg-slate-50 p-[2mm]">
                <strong className="text-[#1B1652]">Justification vérifiée :</strong> {slip.reason}
              </p>
            )}
            {slip.decision_note && (
              <p className="rounded bg-slate-50 p-[2mm]">
                <strong className="text-[#1B1652]">Observation de l&apos;administration :</strong> {slip.decision_note}
              </p>
            )}
          </div>
        )}

        <div className="mt-[4mm] grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-[4mm] text-center text-[9.5px]">
          <div>
            <p className="font-bold">Le parent / tuteur</p>
            <div className="mt-[10mm] border-t border-slate-400 pt-1 text-[8.5px] text-slate-500">Vu et pris connaissance</div>
          </div>
          <div>
            <p className="font-bold">Le professeur</p>
            <div className="mt-[10mm] border-t border-slate-400 pt-1 text-[8.5px] text-slate-500">
              {slip.status === "presente" ? `Présenté le ${new Date(slip.presented_at!).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}` : "Visa à l'entrée en classe"}
            </div>
          </div>
          <div>
            <p className="font-bold">L&apos;administration</p>
            <p className="mt-[3mm] text-[9px] font-semibold text-[#1B1652]">{slip.issued_by_name ?? ""}</p>
            <div className="mt-[4mm] border-t border-slate-400 pt-1 text-[8.5px] text-slate-500">Accord et cachet</div>
          </div>
          <div className="flex flex-col items-center">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element -- QR code généré
              <img src={qr} alt="QR code de vérification" className="size-[20mm]" />
            ) : (
              <span className="size-[20mm] border border-dashed border-slate-300" />
            )}
            <span className="mt-0.5 text-[7.5px] text-slate-500">Vérification</span>
          </div>
        </div>
        <p className="mt-[3mm] border-t border-slate-200 pt-1 text-center text-[8.5px] text-slate-500">
          Règlement intérieur, article 5 : toute absence doit être justifiée ; l&apos;accès au cours peut être soumis à la présentation d&apos;une autorisation. Billet personnel, valable une fois.
        </p>
      </div>
    </article>
  );
}

/** Liste des billets d'un élève (espace, dossier). */
export function AccessSlipList({ studentId, linkBase }: { studentId: string; linkBase: string }) {
  const [rows, setRows] = useState<AccessSlip[] | null>(null);
  useEffect(() => {
    createClient()
      .from("class_access_slips")
      .select("*")
      .eq("student_id", studentId)
      .order("issued_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as AccessSlip[]));
  }, [studentId]);
  if (!rows) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-bold text-[#0C356A]">Billets d&apos;admission en classe</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun billet : ils sont délivrés après une permission accordée ou une absence justifiée.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 text-sm ring-1 ring-slate-200">
              <span className="font-mono text-xs font-bold text-[#E30613]">{r.number}</span>
              <span className="font-semibold">{SLIP_KIND[r.kind]}</span>
              <span className="text-slate-600">retour le {short(r.return_date)}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${SLIP_STATUS[r.status].tone}`}>{SLIP_STATUS[r.status].label}</span>
              <a href={`${linkBase}/${r.id}`} className="ml-auto rounded-full bg-[#0C356A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#E30613]">
                Voir · télécharger · imprimer
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
