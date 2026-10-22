"use client";

import { Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { siteConfig } from "@/content/site";
import { createClient } from "@/lib/supabase/client";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  registration_number: string | null;
  class_name: string | null;
  academic_year: string | null;
  parent_father_name: string | null;
  parent_father_phone: string | null;
  parent_mother_name: string | null;
  parent_mother_phone: string | null;
  tutor_name: string | null;
  tutor_phone: string | null;
};
type Att = { student_id: string; date: string; status: string; note: string | null };

/**
 * Carte de suivi de correspondance : identité de l'élève et contacts des parents au recto,
 * tableau des absences, retards et permissions (avec signatures) au verso, prérempli avec l'historique.
 */
function Sheet() {
  const params = useSearchParams();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [att, setAtt] = useState<Att[]>([]);

  useEffect(() => {
    const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
    if (!ids.length) return setStudents([]);
    const supabase = createClient();
    Promise.all([
      supabase
        .from("students")
        .select("id, first_name, last_name, photo_url, registration_number, class_name, academic_year, parent_father_name, parent_father_phone, parent_mother_name, parent_mother_phone, tutor_name, tutor_phone")
        .in("id", ids),
      supabase.from("student_attendance").select("student_id, date, status, note").in("student_id", ids).neq("status", "present").order("date"),
    ]).then(([{ data: s }, { data: a }]) => {
      setStudents((s ?? []) as Student[]);
      setAtt((a ?? []) as Att[]);
    });
  }, [params]);

  if (!students) return <p className="p-10 text-center">Préparation…</p>;

  const label: Record<string, string> = { absent: "Absence", retard: "Retard", permission: "Permission" };

  return (
    <div className="min-h-dvh bg-slate-100 p-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between print:hidden">
        <p className="font-bold text-slate-700">{students.length} carte(s) de correspondance · format A5 paysage, recto-verso</p>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white">
          <Printer aria-hidden className="size-4" /> Imprimer
        </button>
      </div>
      {students.map((s) => {
        const rows = att.filter((a) => a.student_id === s.id);
        const blank = Math.max(0, 14 - rows.length);
        return (
          <div key={s.id} className="mx-auto mb-6 grid max-w-[210mm] grid-cols-2 gap-[4mm] break-after-page bg-white p-[6mm] text-[10px] shadow print:shadow-none">
            {/* Recto */}
            <section className="flex flex-col gap-2 rounded-lg border-2 border-[#0C356A] p-3">
              <div className="flex items-center gap-2 border-b-2 border-[#E30613] pb-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- rendu imprimable */}
                <img src="/logoavenida.jpg" alt="" className="size-10 object-contain" />
                <div>
                  <p className="font-serif text-sm font-extrabold tracking-wider text-[#0C356A]">HÔTEL ÉCOLE AVENIDA</p>
                  <p className="text-[9px] font-bold tracking-widest text-[#E30613] uppercase">Carte de suivi de correspondance</p>
                </div>
              </div>
              <div className="flex gap-3">
                {s.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- photo en data URL
                  <img src={s.photo_url} alt="" className="h-[30mm] w-[23mm] border object-cover" />
                ) : (
                  <span className="h-[30mm] w-[23mm] border border-dashed" />
                )}
                <dl className="flex-1 space-y-1">
                  <div>
                    <dt className="text-slate-500">Nom et prénoms</dt>
                    <dd className="font-bold">
                      {s.last_name.toUpperCase()} {s.first_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Matricule</dt>
                    <dd className="font-bold text-[#E30613]">{s.registration_number}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Classe · année</dt>
                    <dd className="font-bold">
                      {s.class_name} · {s.academic_year}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="rounded bg-slate-50 p-2">
                <p className="font-bold text-[#0C356A]">Parents / tuteur</p>
                {[
                  [s.parent_father_name, s.parent_father_phone],
                  [s.parent_mother_name, s.parent_mother_phone],
                  [s.tutor_name, s.tutor_phone],
                ]
                  .filter(([n]) => n)
                  .map(([n, p]) => (
                    <p key={n}>
                      {n} · {p}
                    </p>
                  ))}
              </div>
              <p className="mt-auto text-[8px] leading-snug text-slate-600">
                Toute absence ou tout retard doit être justifié par les parents. Les demandes de permission se font dans l&apos;espace parent, justificatif à
                l&apos;appui. Carte à présenter à la surveillance sur demande. {siteConfig.phones[0].display}
              </p>
            </section>
            {/* Verso */}
            <section className="rounded-lg border-2 border-[#0C356A] p-3">
              <table className="w-full border-collapse text-[9px]">
                <thead>
                  <tr className="bg-[#0C356A] text-white">
                    <th className="border px-1 py-0.5">Date</th>
                    <th className="border px-1 py-0.5">Motif</th>
                    <th className="border px-1 py-0.5">Observation</th>
                    <th className="border px-1 py-0.5">Visa école</th>
                    <th className="border px-1 py-0.5">Visa parent</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.date + r.status}>
                      <td className="border px-1 py-0.5">{new Date(r.date).toLocaleDateString("fr-FR")}</td>
                      <td className="border px-1 py-0.5 font-bold">{label[r.status] ?? r.status}</td>
                      <td className="border px-1 py-0.5">{r.note}</td>
                      <td className="border" />
                      <td className="border" />
                    </tr>
                  ))}
                  {Array.from({ length: blank }).map((_, i) => (
                    <tr key={`b${i}`} className="h-[5mm]">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="border" />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        );
      })}
    </div>
  );
}

export default function PrintCorrespondancePage() {
  return (
    <Suspense fallback={<p className="p-10 text-center">Chargement…</p>}>
      <Sheet />
    </Suspense>
  );
}
