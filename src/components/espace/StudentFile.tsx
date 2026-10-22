"use client";

import { AlertTriangle, BookOpen, CalendarX, Clock, Receipt, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatFCFA } from "@/lib/utils";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  registration_number: string | null;
  student_number: string | null;
  class_name: string | null;
  program_code: string | null;
  specialty: string | null;
  academic_year: string | null;
  total_fee: number | null;
  paid_fee: number | null;
  remaining_fee: number | null;
  boarder_status: string | null;
};

type Grade = { id: string; subject: string | null; score: number | null; evaluation_type: string | null; date: string | null; appreciation: string | null };
type Ticket = { id: string; date?: string | null; start_date?: string | null; reason: string | null; is_justified?: boolean | null };
type Payment = { id: string; receipt_number: string | null; amount: number | null; designation: string | null; payment_date: string | null; created_at: string };

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—");

/**
 * Dossier scolaire d'un élève : identité, scolarité, notes, absences, retards et paiements.
 * Les données sont filtrées par la base (RLS) : chacun ne reçoit que ce qu'il a le droit de voir.
 */
export function StudentFile({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [absences, setAbsences] = useState<Ticket[]>([]);
  const [lates, setLates] = useState<Ticket[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: s } = await supabase.from("students").select("*").eq("id", studentId).maybeSingle<Student>();
      setStudent(s);
      if (s) {
        // Les tables de suivi référencent l'élève par identifiant ou par matricule
        const keys = [s.id, s.registration_number, s.student_number].filter(Boolean) as string[];
        const [g, a, l, p] = await Promise.all([
          supabase.from("grades").select("id, subject, score, evaluation_type, date, appreciation").in("student_id", keys).order("date", { ascending: false }).limit(20),
          supabase.from("student_absences").select("id, start_date, reason, is_justified").in("student_id", keys).order("start_date", { ascending: false }).limit(10),
          supabase.from("student_lates").select("id, date, reason").in("student_id", keys).order("date", { ascending: false }).limit(10),
          supabase.from("fee_payments").select("id, receipt_number, amount, designation, payment_date, created_at").in("student_id", keys).order("created_at", { ascending: false }).limit(10),
        ]);
        setGrades(g.data ?? []);
        setAbsences(a.data ?? []);
        setLates(l.data ?? []);
        setPayments(p.data ?? []);
      }
      setLoading(false);
    })();
  }, [studentId]);

  if (loading) return <div className="h-40 animate-pulse rounded-3xl bg-white" />;
  if (!student) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-amber-50 p-5 text-sm text-amber-800">
        <AlertTriangle aria-hidden className="size-4" />
        Dossier introuvable ou non accessible. Contactez l&apos;administration.
      </p>
    );
  }

  const total = student.total_fee ?? 0;
  const paid = student.paid_fee ?? 0;
  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const scored = grades.filter((g) => g.score !== null);
  const average = scored.length ? scored.reduce((sum, g) => sum + (g.score ?? 0), 0) / scored.length : null;

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5">
        <div className="bg-[image:linear-gradient(120deg,#072042,#0C356A_60%,#B91C1C)] p-6 text-white sm:p-8">
          <p className="text-xs font-bold tracking-widest text-red-200 uppercase">{student.academic_year ?? "Année en cours"}</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
            {student.first_name} {student.last_name}
          </h2>
          <p className="mt-1 text-white/80">
            {student.class_name ?? student.program_code} {student.specialty ? `· ${student.specialty}` : ""} · Matricule {student.registration_number ?? student.student_number ?? "—"}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
          {[
            { icon: BookOpen, label: "Moyenne récente", value: average !== null ? `${average.toFixed(2)} / 20` : "—" },
            { icon: CalendarX, label: "Absences", value: String(absences.length) },
            { icon: Clock, label: "Retards", value: String(lates.length) },
            { icon: Wallet, label: "Reste à payer", value: formatFCFA(student.remaining_fee ?? Math.max(0, total - paid)) },
          ].map((k) => (
            <div key={k.label} className="flex flex-col gap-1 bg-white p-5">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <k.icon aria-hidden className="size-4 text-avenida-red" />
                {k.label}
              </dt>
              <dd className="font-display text-xl font-extrabold text-avenida-blue">{k.value}</dd>
            </div>
          ))}
        </dl>
        {total > 0 && (
          <div className="p-5">
            <div className="mb-2 flex justify-between text-xs font-semibold text-slate-600">
              <span>Scolarité payée : {formatFCFA(paid)}</span>
              <span>{progress} % de {formatFCFA(total)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[image:linear-gradient(90deg,#0C356A,#DC2626)]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Dernières notes" icon={BookOpen} empty="Aucune note publiée pour le moment.">
          {grades.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-slate-800">{g.subject ?? "Matière"}</p>
                <p className="text-xs text-slate-500">
                  {g.evaluation_type ?? "Évaluation"} · {fmtDate(g.date)}
                  {g.appreciation ? ` · ${g.appreciation}` : ""}
                </p>
              </div>
              <span className="font-display text-lg font-extrabold text-avenida-blue">{g.score ?? "—"}/20</span>
            </li>
          ))}
        </Card>

        <Card title="Paiements et reçus" icon={Receipt} empty="Aucun paiement enregistré.">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-slate-800">{p.designation ?? "Versement scolarité"}</p>
                <p className="text-xs text-slate-500">
                  Reçu {p.receipt_number ?? "—"} · {fmtDate(p.payment_date ?? p.created_at)}
                </p>
              </div>
              <span className="font-bold text-emerald-700">{formatFCFA(p.amount ?? 0)}</span>
            </li>
          ))}
        </Card>

        <Card title="Absences" icon={CalendarX} empty="Aucune absence enregistrée.">
          {absences.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-slate-800">{fmtDate(a.start_date)}</p>
                <p className="text-xs text-slate-500">{a.reason ?? "Motif non précisé"}</p>
              </div>
              <span className={a.is_justified ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-avenida-red"}>
                {a.is_justified ? "Justifiée" : "Non justifiée"}
              </span>
            </li>
          ))}
        </Card>

        <Card title="Retards" icon={Clock} empty="Aucun retard enregistré.">
          {lates.map((l) => (
            <li key={l.id} className="py-3">
              <p className="font-semibold text-slate-800">{fmtDate(l.date)}</p>
              <p className="text-xs text-slate-500">{l.reason ?? "Motif non précisé"}</p>
            </li>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, empty, children }: { title: string; icon: typeof BookOpen; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-avenida-blue">
        <Icon aria-hidden className="size-5 text-avenida-red" />
        {title}
      </h3>
      {children.length ? <ul className="mt-2 divide-y divide-slate-100">{children}</ul> : <p className="mt-4 text-sm text-slate-500">{empty}</p>}
    </section>
  );
}
