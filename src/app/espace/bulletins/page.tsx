"use client";

import { FileSpreadsheet, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = { id: string; student_name: string | null; period: string | null; academic_year: string | null; general_average: number | null; rank_display: string | null; mention: string | null };

/** Bulletins publiés de l'élève (ou des enfants du parent). */
export default function MesBulletinsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    createClient()
      .from("report_cards")
      .select("id, student_name, period, academic_year, general_average, rank_display, mention")
      .eq("published", true)
      .order("academic_year", { ascending: false })
      .order("term", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold tracking-widest text-vif uppercase">
          <FileSpreadsheet aria-hidden className="size-4" /> Bulletins
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-avenida-blue">Bulletins de notes</h1>
        <p className="mt-1 text-sm text-slate-600">Consultez, téléchargez et imprimez les bulletins publiés par l&apos;école. Chaque bulletin porte un QR code de vérification.</p>
      </div>
      {rows === null ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
      ) : rows.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-900/5">Aucun bulletin publié pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/espace/bulletins/${r.id}`} className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 hover:ring-vif">
                <span className="flex size-14 flex-col items-center justify-center rounded-2xl bg-avenida-blue text-white">
                  <span className="text-lg leading-none font-black">{Number(r.general_average).toFixed(1)}</span>
                  <span className="text-[9px]">/20</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-avenida-blue-950">
                    {r.period} · {r.academic_year}
                  </span>
                  <span className="text-sm text-slate-600">
                    {r.student_name} · rang {r.rank_display} · {r.mention}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
