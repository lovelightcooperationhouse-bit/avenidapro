"use client";

import { CalendarCheck, CalendarX, Clock, FileCheck2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signedUrl } from "@/lib/spaces";
import { cn } from "@/lib/utils";

export type AttendanceRow = { id: string; date: string; status: "present" | "absent" | "retard" | "permission"; note: string | null };
export type PermissionRow = {
  id: string;
  student_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  justificatif: { path: string; name: string } | null;
  status: "en_attente" | "acceptee" | "refusee";
  response: string | null;
  created_at: string;
};

export const ATTENDANCE: Record<AttendanceRow["status"], { label: string; tone: string; dot: string }> = {
  present: { label: "Présent", tone: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  absent: { label: "Absent", tone: "bg-red-50 text-vif", dot: "bg-vif" },
  retard: { label: "Retard", tone: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  permission: { label: "Permission", tone: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
};

export const PERMISSION_STATUS = {
  en_attente: { label: "En attente", tone: "bg-amber-50 text-amber-800 ring-amber-200" },
  acceptee: { label: "Accordée", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  refusee: { label: "Refusée", tone: "bg-red-50 text-vif ring-red-200" },
} as const;

const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });

/** Fiche de correspondance d'un élève : calendrier du mois, bilan et historique, permissions. */
export function AttendanceView({ studentId, refreshKey = 0 }: { studentId: string; refreshKey?: number }) {
  const [rows, setRows] = useState<AttendanceRow[] | null>(null);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("student_attendance").select("id, date, status, note").eq("student_id", studentId).order("date", { ascending: false }).limit(400),
      supabase.from("permission_requests").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
    ]).then(([a, p]) => {
      setRows((a.data ?? []) as AttendanceRow[]);
      setPermissions((p.data ?? []) as PermissionRow[]);
    });
  }, [studentId, refreshKey]);

  const monthRows = useMemo(() => (rows ?? []).filter((r) => r.date.startsWith(month)), [rows, month]);
  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, retard: 0, permission: 0 };
    monthRows.forEach((r) => (c[r.status] += 1));
    return c;
  }, [monthRows]);

  if (!rows) return <div className="h-40 animate-pulse rounded-3xl bg-white" />;

  // Calendrier du mois sélectionné
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const days = new Date(y, m, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const byDate = Object.fromEntries(monthRows.map((r) => [r.date, r]));

  const openJustif = async (p: PermissionRow) => {
    if (!p.justificatif) return;
    const url = await signedUrl(p.justificatif.path, "justificatifs");
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-bold text-avenida-blue-950">Fiche de correspondance</h3>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            Mois
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm" />
          </label>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["present", CalendarCheck],
              ["absent", CalendarX],
              ["retard", Clock],
              ["permission", FileCheck2],
            ] as const
          ).map(([k, Icon]) => (
            <div key={k} className={cn("rounded-2xl p-4", ATTENDANCE[k].tone)}>
              <dt className="flex items-center gap-1.5 text-xs font-bold uppercase">
                <Icon aria-hidden className="size-4" />
                {ATTENDANCE[k].label}s
              </dt>
              <dd className="mt-1 font-display text-2xl font-extrabold">{counts[k]}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-xs" role="grid" aria-label="Calendrier de présence">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <span key={i} className="font-bold text-slate-400">
              {d}
            </span>
          ))}
          {Array.from({ length: offset }).map((_, i) => (
            <span key={`o${i}`} />
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const date = `${month}-${String(i + 1).padStart(2, "0")}`;
            const r = byDate[date];
            return (
              <span
                key={date}
                title={r ? `${ATTENDANCE[r.status].label}${r.note ? ` : ${r.note}` : ""}` : undefined}
                className={cn("flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold", r ? ATTENDANCE[r.status].tone : "bg-slate-50 text-slate-400")}
              >
                {i + 1}
                {r && <span className={cn("mt-0.5 size-1.5 rounded-full", ATTENDANCE[r.status].dot)} />}
              </span>
            );
          })}
        </div>
        {monthRows.filter((r) => r.status !== "present").length > 0 && (
          <ul className="mt-5 divide-y divide-slate-100">
            {monthRows
              .filter((r) => r.status !== "present")
              .map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-semibold text-slate-800">{fmt(r.date)}</span>
                  <span className="flex-1 truncate text-slate-500">{r.note}</span>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", ATTENDANCE[r.status].tone)}>{ATTENDANCE[r.status].label}</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <h3 className="font-display text-lg font-bold text-avenida-blue-950">Demandes de permission</h3>
        {permissions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucune demande de permission.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {permissions.map((p) => (
              <li key={p.id} className="flex flex-col gap-1.5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">
                    Du {fmt(p.start_date)} au {fmt(p.end_date)}
                  </span>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold ring-1", PERMISSION_STATUS[p.status].tone)}>{PERMISSION_STATUS[p.status].label}</span>
                </div>
                <p className="text-sm text-slate-600">{p.reason}</p>
                {p.response && <p className="rounded-xl bg-slate-50 p-2.5 text-sm text-slate-700">Réponse de l&apos;école : {p.response}</p>}
                {p.justificatif && (
                  <button type="button" onClick={() => openJustif(p)} className="w-fit text-xs font-bold text-vif hover:underline">
                    Voir le justificatif ({p.justificatif.name})
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
