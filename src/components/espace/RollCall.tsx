"use client";

import { CheckCircle2, Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ATTENDANCE, type AttendanceRow } from "./AttendanceView";
import { pingNotifications } from "@/lib/notify";

type Student = { id: string; first_name: string; last_name: string; class_name: string | null; registration_number: string | null };
type Mark = { status: AttendanceRow["status"]; note: string };

/**
 * Appel du jour par classe. Chaque absence ou retard enregistré prévient
 * automatiquement l'élève et ses parents (notification dans leur espace).
 */
export function RollCall({ classes, recorderId }: { classes: string[]; recorderId: string }) {
  const [cls, setCls] = useState(classes[0] ?? "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");

  // Les classes arrivent après le premier affichage : sélectionne la première disponible
  useEffect(() => {
    if (classes.length && !classes.includes(cls)) setCls(classes[0]);
  }, [classes, cls]);

  const load = useCallback(async () => {
    if (!cls) return;
    const supabase = createClient();
    const { data: s } = await supabase.from("students").select("id, first_name, last_name, class_name, registration_number").eq("class_name", cls).eq("status", "actif").order("last_name");
    const list = (s ?? []) as Student[];
    setStudents(list);
    const { data: a } = list.length ? await supabase.from("student_attendance").select("student_id, status, note").eq("date", date).in("student_id", list.map((x) => x.id)) : { data: [] };
    const m: Record<string, Mark> = {};
    list.forEach((x) => (m[x.id] = { status: "present", note: "" }));
    (a ?? []).forEach((r) => (m[r.student_id] = { status: r.status, note: r.note ?? "" }));
    setMarks(m);
    setSaved("");
  }, [cls, date]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    const rows = students.map((s) => ({ student_id: s.id, date, period: "journee", status: marks[s.id]?.status ?? "present", note: marks[s.id]?.note.trim() || null, recorded_by: recorderId }));
    const { error } = await createClient().from("student_attendance").upsert(rows, { onConflict: "student_id,date,period" });
    setBusy(false);
    if (!error) pingNotifications();
    const absents = rows.filter((r) => r.status === "absent" || r.status === "retard").length;
    setSaved(error ? "Enregistrement impossible : vérifiez que la classe vous est attribuée." : `Appel enregistré. ${absents ? `${absents} famille(s) prévenue(s).` : "Tous présents."}`);
  };

  if (!classes.length) return <p className="rounded-3xl bg-amber-50 p-6 text-amber-900 ring-1 ring-amber-200">Aucune classe ne vous est attribuée pour faire l&apos;appel.</p>;

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <div className="flex flex-wrap items-end gap-3">
        <h3 className="mr-auto font-display text-lg font-bold text-avenida-blue-950">Appel du jour</h3>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Classe
          <select value={cls} onChange={(e) => setCls(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {classes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Date
          <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </label>
      </div>
      {students.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun élève actif dans cette classe.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {students.map((s) => {
            const mark = marks[s.id] ?? { status: "present", note: "" };
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="min-w-[10rem] flex-1">
                  <span className="block font-bold text-slate-800">
                    {s.last_name.toUpperCase()} {s.first_name}
                  </span>
                  <span className="text-xs text-slate-500">{s.registration_number}</span>
                </span>
                <span className="flex gap-1" role="radiogroup" aria-label={`Présence de ${s.first_name}`}>
                  {(["present", "absent", "retard"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      role="radio"
                      aria-checked={mark.status === st}
                      onClick={() => setMarks((m) => ({ ...m, [s.id]: { ...mark, status: st } }))}
                      className={cn("rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-colors", mark.status === st ? cn(ATTENDANCE[st].tone, "ring-current") : "text-slate-500 ring-slate-200 hover:ring-slate-400")}
                    >
                      {ATTENDANCE[st].label}
                    </button>
                  ))}
                  {mark.status === "permission" && <span className={cn("rounded-full px-3 py-1.5 text-xs font-bold", ATTENDANCE.permission.tone)}>Permission</span>}
                </span>
                {mark.status !== "present" && (
                  <input
                    value={mark.note}
                    onChange={(e) => setMarks((m) => ({ ...m, [s.id]: { ...mark, note: e.target.value } }))}
                    placeholder="Motif / durée du retard"
                    aria-label={`Motif pour ${s.first_name}`}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm sm:w-56"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={busy || !students.length} className="inline-flex items-center gap-2 rounded-full bg-vif px-6 py-2.5 text-sm font-bold text-white hover:bg-vif-fonce disabled:opacity-50">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />}
          Enregistrer l&apos;appel
        </button>
        {saved && (
          <p role="status" className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
            <CheckCircle2 aria-hidden className="size-4" /> {saved}
          </p>
        )}
      </div>
    </section>
  );
}
