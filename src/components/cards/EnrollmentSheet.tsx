"use client";

import QRCode from "qrcode";
import { useEffect, useState, type ReactNode } from "react";
import { fees, formations, requiredDocuments, siteConfig } from "@/content/site";
import { createClient } from "@/lib/supabase/client";
import { formatFCFA } from "@/lib/utils";
import { situationStatus } from "./SituationSheet";
import { verifyUrl } from "./IdCard";

type Student = Record<string, string | number | null | boolean | undefined> & {
  id: string;
  first_name: string;
  last_name: string;
};

const DOC_NAMES: Record<string, string> = Object.fromEntries(requiredDocuments.map((d) => [d.key, d.label]));
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
  const [qr, setQr] = useState<string | null>(null);
  const [docs, setDocs] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("students").select("*").eq("id", studentId).maybeSingle();
      setS((data as Student) ?? null);
      if (data) {
        const { data: card } = await supabase.from("id_cards").select("token").eq("student_id", data.id).eq("revoked", false).maybeSingle();
        // Pièces fournies : pré-inscription en ligne, sinon dossier de membre
        if (data.application_id) {
          const { data: ad } = await supabase.from("application_documents").select("doc_type, file_name").eq("application_id", data.application_id);
          setDocs((ad ?? []).map((x) => DOC_NAMES[x.doc_type] ?? x.doc_type));
        } else if (Array.isArray(data.uploaded_documents)) {
          setDocs((data.uploaded_documents as { label?: string; name?: string }[]).map((x) => x.label ?? x.name ?? "Pièce"));
        }
        if (card?.token) QRCode.toDataURL(verifyUrl(card.token), { margin: 0, width: 220 }).then(setQr);
      }
    })();
  }, [studentId]);

  if (s === undefined) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  if (!s) return <p className="rounded-2xl bg-amber-50 p-6 text-amber-900">Dossier introuvable ou non accessible.</p>;

  const f = formations.find((x) => x.code === s.program_code);
  const supplies = s.program_code === "CFA" ? fees.suppliesCfa : fees.suppliesDiploma;
  const total = Number(s.total_fee ?? (f ? f.registration + f.tuition + supplies : 0));
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
            <img src="/logo-avenida.png" alt="" className="size-[18mm] object-contain" />
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

        <Title n={4}>Santé et personne à prévenir</Title>
        <dl className="mt-[2mm] grid grid-cols-2 gap-x-[5mm]">
          <Row k="Groupe sanguin" val={v(s.blood_group)} />
          <Row k="Allergies" val={v(s.allergies)} />
          <Row k="Informations médicales" val={v(s.medical_notes)} wide />
          <Row k="En cas d'urgence" val={[s.emergency_contact_name, s.emergency_contact_phone].filter(Boolean).join(" · ") || "—"} wide />
        </dl>

        <Title n={5}>Pièces fournies au dossier</Title>
        {docs.length === 0 ? (
          <p className="mt-[2mm] text-slate-500">Aucune pièce enregistrée en ligne (pièces déposées au bureau des inscriptions).</p>
        ) : (
          <ul className="mt-[2mm] grid grid-cols-2 gap-x-[5mm] gap-y-[2px]">
            {docs.map((dname, i) => (
              <li key={i} className="flex items-center gap-1.5 border-b border-dotted border-slate-300 py-[2px]">
                <span className="text-emerald-700">✔</span> {dname}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-[3mm] flex items-center gap-[3mm] text-[9.5px] text-slate-600">
          <p className="flex-1">
            Écolage annuel : <strong>{formatFCFA(total)}</strong>. Le détail des paiements et du reste à payer figure sur la <strong>fiche de situation financière</strong>, mise à jour à chaque paiement.
          </p>
          {(() => {
            const st = situationStatus({ total_fee: s.total_fee, paid_fee: s.paid_fee, remaining_fee: s.remaining_fee, academic_year: s.academic_year });
            return (
              <p className="shrink-0 rounded border-2 px-2 py-1 text-center leading-tight" style={{ borderColor: st.tone, background: st.bg, color: st.tone }}>
                <span className="block text-[10px] font-extrabold">{st.paid ? "✔ Écolage en règle" : "⚠ Écolage non soldé"}</span>
                <span className="block text-[8px] font-semibold">{st.detail}</span>
              </p>
            );
          })()}
        </div>

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
