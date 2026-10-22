"use client";

import { CheckCircle2, FileText, Inbox, Loader2, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PERMISSION_STATUS, type PermissionRow } from "@/components/espace/AttendanceView";
import { ArchiveButton } from "@/components/documents/ArchiveButton";
import { DocumentViewer, type ViewableFile } from "@/components/documents/DocumentViewer";
import { RollCall } from "@/components/espace/RollCall";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { signedUrl } from "@/lib/spaces";
import { cn } from "@/lib/utils";
import { pingNotifications } from "@/lib/notify";

type Row = PermissionRow & { students: { first_name: string; last_name: string; class_name: string | null; registration_number: string | null } | null };

/** Fiche de correspondance côté administration : demandes de permission des parents et appel de toutes les classes. */
export default function CorrespondanceAdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"permissions" | "appel" | "registre">("registre");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [today, setToday] = useState({ absent: 0, retard: 0, permission: 0, present: 0 });

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: p }, { data: s }, { data: a }] = await Promise.all([
      supabase.from("permission_requests").select("*, students(first_name, last_name, class_name, registration_number)").order("created_at", { ascending: false }),
      supabase.from("students").select("class_name").eq("status", "actif"),
      supabase.from("student_attendance").select("status").eq("date", new Date().toISOString().slice(0, 10)),
    ]);
    setRows((p ?? []) as Row[]);
    setClasses([...new Set((s ?? []).map((x) => x.class_name).filter(Boolean) as string[])].sort());
    const c = { absent: 0, retard: 0, permission: 0, present: 0 };
    (a ?? []).forEach((r) => (c[r.status as keyof typeof c] += 1));
    setToday(c);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (row: Row, status: "acceptee" | "refusee") => {
    if (!user) return;
    await createClient()
      .from("permission_requests")
      .update({ status, response: responses[row.id]?.trim() || null, decided_by: user.id, decided_at: new Date().toISOString() })
      .eq("id", row.id);
    pingNotifications();
    load();
  };

  const [viewing, setViewing] = useState<ViewableFile | null>(null);
  const openJustif = (row: Row) => row.justificatif && setViewing({ bucket: "justificatifs", path: row.justificatif.path, name: row.justificatif.name, label: "Justificatif" });

  const pending = (rows ?? []).filter((r) => r.status === "en_attente").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#0C356A]">Fiche de correspondance</h1>
        <p className="mt-1 text-sm text-slate-600">Permissions demandées par les parents, appel des classes et situation du jour. Les familles sont notifiées à chaque décision.</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Présents aujourd'hui", today.present, "text-emerald-700"],
          ["Absents", today.absent, "text-[#DC2626]"],
          ["Retards", today.retard, "text-amber-700"],
          ["En permission", today.permission, "text-sky-700"],
        ].map(([label, n, tone]) => (
          <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-bold text-slate-500">{label}</dt>
            <dd className={cn("text-2xl font-black", tone as string)}>{n}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "permissions" as const, label: `Demandes de permission${pending ? ` (${pending})` : ""}` },
          { key: "appel" as const, label: "Appel des classes" },
          { key: "registre" as const, label: "Registre : absences, retards, permissions" },
        ].map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("rounded-xl px-4 py-2.5 text-sm font-bold ring-1", tab === t.key ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "appel" && user && <RollCall classes={classes} recorderId={user.id} />}
      {tab === "registre" && <Registre classes={classes} />}

      {tab === "permissions" &&
        (!rows ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 aria-hidden className="size-4 animate-spin" /> Chargement…
          </p>
        ) : rows.length === 0 ? (
          <p className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            <Inbox aria-hidden className="size-8 text-slate-300" /> Aucune demande de permission.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">
                      {r.students?.last_name?.toUpperCase()} {r.students?.first_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {r.students?.class_name} · {r.students?.registration_number}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold ring-1", PERMISSION_STATUS[r.status].tone)}>{PERMISSION_STATUS[r.status].label}</span>
                </div>
                <p className="text-sm font-semibold text-[#0C356A]">
                  Du {new Date(r.start_date).toLocaleDateString("fr-FR")} au {new Date(r.end_date).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-sm text-slate-700">{r.reason}</p>
                {r.justificatif && (
                  <button type="button" onClick={() => openJustif(r)} className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                    <FileText aria-hidden className="size-4" /> Justificatif : {r.justificatif.name}
                  </button>
                )}
                {r.justificatif && r.status !== "en_attente" && (
                  <ArchiveButton
                    kind="permission"
                    title={`Permission ${r.students?.last_name?.toUpperCase() ?? ""} ${r.students?.first_name ?? ""} du ${new Date(r.start_date).toLocaleDateString("fr-FR")}`}
                    ownerName={`${r.students?.last_name?.toUpperCase() ?? ""} ${r.students?.first_name ?? ""}`}
                    reference={r.students?.registration_number ?? undefined}
                    refType="permission_request"
                    refId={r.id}
                    files={[{ bucket: "justificatifs", path: r.justificatif.path, name: r.justificatif.name, label: "Justificatif" }]}
                    data={{ motif: r.reason, du: r.start_date, au: r.end_date, decision: r.status, reponse: r.response }}
                  />
                )}
                {r.status === "en_attente" ? (
                  <>
                    <input
                      value={responses[r.id] ?? ""}
                      onChange={(e) => setResponses((x) => ({ ...x, [r.id]: e.target.value }))}
                      placeholder="Réponse aux parents (facultatif)"
                      aria-label="Réponse aux parents"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => decide(r, "acceptee")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                        <CheckCircle2 aria-hidden className="size-4" /> Accorder
                      </button>
                      <button type="button" onClick={() => decide(r, "refusee")} className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-4 py-2 text-sm font-bold text-red-800 hover:bg-red-200">
                        <XCircle aria-hidden className="size-4" /> Refuser
                      </button>
                    </div>
                  </>
                ) : (
                  r.response && <p className="rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700">Réponse : {r.response}</p>
                )}
              </li>
            ))}
          </ul>
        ))}
      {viewing && <DocumentViewer file={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

type Entry = { id: string; date: string; status: string; note: string | null; student_id: string; students: { first_name: string; last_name: string; class_name: string | null; registration_number: string | null } | null };

/** Registre de correspondance : toutes les absences, retards et permissions, filtrables et imprimables. */
function Registre({ classes }: { classes: string[] }) {
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [cls, setCls] = useState("");
  const [kind, setKind] = useState("");
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setRows(null);
    let query = createClient()
      .from("student_attendance")
      .select("id, date, status, note, student_id, students(first_name, last_name, class_name, registration_number)")
      .neq("status", "present")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false });
    if (kind) query = query.eq("status", kind);
    query.then(({ data }) => setRows(((data ?? []) as unknown as Entry[]).filter((r) => !cls || r.students?.class_name === cls)));
  }, [cls, kind, from, to]);

  const label: Record<string, string> = { absent: "Absence", retard: "Retard", permission: "Permission" };
  const tone: Record<string, string> = { absent: "bg-red-100 text-[#B8000F]", retard: "bg-amber-100 text-amber-800", permission: "bg-sky-100 text-sky-800" };
  const count = (k: string) => (rows ?? []).filter((r) => r.status === k).length;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 print:border-0 print:p-0">
      <div className="flex flex-wrap items-end gap-2 print:hidden">
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Classe
          <select value={cls} onChange={(e) => setCls(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Toutes</option>
            {classes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Type
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Tous</option>
            <option value="absent">Absences</option>
            <option value="retard">Retards</option>
            <option value="permission">Permissions</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Du
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Au
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <button type="button" onClick={() => window.print()} className="ml-auto rounded-full bg-[#0C356A] px-4 py-2 text-sm font-bold text-white">
          Imprimer le registre
        </button>
      </div>
      <p className="text-sm font-semibold text-slate-700">
        {count("absent")} absence(s) · {count("retard")} retard(s) · {count("permission")} jour(s) de permission
      </p>
      {rows === null ? (
        <Loader2 aria-label="Chargement" className="size-5 animate-spin" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune absence, retard ou permission sur la période.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Matricule</th>
                <th className="px-3 py-2">Élève</th>
                <th className="px-3 py-2">Classe</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Motif / observation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{new Date(r.date).toLocaleDateString("fr-FR")}</td>
                  <td className="px-3 py-2 font-mono text-xs font-bold text-[#E30613]">{r.students?.registration_number}</td>
                  <td className="px-3 py-2 font-semibold">
                    {r.students?.last_name} {r.students?.first_name}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{r.students?.class_name}</td>
                  <td className="px-3 py-2">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", tone[r.status])}>{label[r.status] ?? r.status}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
