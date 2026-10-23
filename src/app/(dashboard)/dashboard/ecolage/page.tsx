"use client";

import { Banknote, CheckCircle2, ChevronDown, FileSpreadsheet, Loader2, Pencil, Printer, Receipt, Search, Wallet, XCircle } from "lucide-react";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { fees, formations } from "@/content/site";
import { useAuth } from "@/context/AuthContext";
import { paymentOk } from "@/lib/cards";
import { pingNotifications } from "@/lib/notify";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFCFA } from "@/lib/utils";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  registration_number: string | null;
  program_code: string | null;
  class_name: string | null;
  academic_year: string | null;
  total_fee: number | null;
  paid_fee: number | null;
  remaining_fee: number | null;
  status: string | null;
  tutor_name: string | null;
  tutor_phone: string | null;
};
type Payment = { id: string; receipt_number: string | null; amount: number; payment_method: string | null; designation: string | null; payment_date: string | null; created_at: string; depositor_name: string | null; remaining_due: number | null; student_id: string };
type Status = "solde" | "a_jour" | "retard" | "sans";

const STATUS: Record<Status, { label: string; tone: string }> = {
  solde: { label: "Soldé", tone: "bg-emerald-100 text-emerald-800" },
  a_jour: { label: "À jour", tone: "bg-sky-100 text-sky-800" },
  retard: { label: "En retard", tone: "bg-red-100 text-[#B8000F]" },
  sans: { label: "Écolage à définir", tone: "bg-amber-100 text-amber-800" },
};
const METHODS = ["Espèces", "T-Money", "Flooz (Moov Money)", "Virement bancaire", "Chèque"];
const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0C356A]";

const statusOf = (s: Student): Status =>
  !s.total_fee ? "sans" : (s.remaining_fee ?? 0) <= 0 ? "solde" : paymentOk({ total_fee: s.total_fee, paid_fee: s.paid_fee, remaining_fee: s.remaining_fee, academic_year: s.academic_year }) ? "a_jour" : "retard";

/** Écolage annuel par défaut de la filière (inscription + scolarité + fournitures). */
const defaultTotal = (code: string | null) => {
  const f = formations.find((x) => x.code === code);
  return f ? f.registration + f.tuition + (code === "CFA" ? fees.suppliesCfa : fees.suppliesDiploma) : 0;
};

/**
 * Écolage (trésorerie de l'école) : base des élèves par filière, acomptes encaissés, reste à payer.
 * Chaque paiement est déduit automatiquement par la base et visible partout sur le matricule de l'élève.
 */
export default function EcolagePage() {
  const { user } = useAuth();
  const canCash = user?.role === "comptable" || user?.role === "directeur_general";
  const [students, setStudents] = useState<Student[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [program, setProgram] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [q, setQ] = useState("");
  const [cashFor, setCashFor] = useState<Student | null>(null);
  const [editFor, setEditFor] = useState<Student | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from("students").select("id, first_name, last_name, registration_number, program_code, class_name, academic_year, total_fee, paid_fee, remaining_fee, status, tutor_name, tutor_phone").neq("status", "archive").order("program_code").order("last_name"),
      supabase.from("fee_payments").select("id, receipt_number, amount, payment_method, designation, payment_date, created_at, depositor_name, remaining_due, student_id").order("created_at", { ascending: false }),
    ]);
    setStudents((s ?? []) as Student[]);
    setPayments((p ?? []) as Payment[]);
  }, []);

  useEffect(() => {
    load();
    // Paiements en ligne des familles et encaissements à la caisse : tableau à jour en temps réel
    const supabase = createClient();
    const channel = supabase
      .channel("ecolage-caisse")
      .on("postgres_changes", { event: "*", schema: "public", table: "fee_payments" }, () => load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "students" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (students ?? []).filter(
      (s) => (!program || s.program_code === program) && (!status || statusOf(s) === status) && (!t || `${s.first_name} ${s.last_name} ${s.registration_number} ${s.class_name}`.toLowerCase().includes(t))
    );
  }, [students, program, status, q]);

  const byProgram = useMemo(() => {
    const m = new Map<string, { total: number; paid: number; count: number }>();
    (students ?? []).forEach((s) => {
      const k = s.program_code ?? "—";
      const o = m.get(k) ?? { total: 0, paid: 0, count: 0 };
      o.total += Number(s.total_fee ?? 0);
      o.paid += Number(s.paid_fee ?? 0);
      o.count += 1;
      m.set(k, o);
    });
    return [...m.entries()];
  }, [students]);

  const totals = byProgram.reduce((a, [, o]) => ({ total: a.total + o.total, paid: a.paid + o.paid }), { total: 0, paid: 0 });
  const today = new Date().toISOString().slice(0, 10);
  const cashedToday = payments.filter((p) => (p.payment_date ?? p.created_at).slice(0, 10) === today).reduce((a, p) => a + Number(p.amount), 0);
  const late = (students ?? []).filter((s) => statusOf(s) === "retard").length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
            <Wallet aria-hidden className="size-6 text-[#E30613]" /> Écolage
          </h1>
          <p className="mt-1 text-sm text-slate-600">Frais de scolarité par filière : encaissez les acomptes, le reste à payer se calcule automatiquement sur le matricule de l&apos;élève.</p>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {(
          [
            // Totaux d'entrées : réservés au Directeur général
            ...(user?.role === "directeur_general"
              ? [
                  ["Écolage attendu", formatFCFA(totals.total), "text-[#0C356A]"],
                  ["Encaissé", formatFCFA(totals.paid), "text-emerald-700"],
                  ["Reste à encaisser", formatFCFA(Math.max(0, totals.total - totals.paid)), "text-[#B8000F]"],
                  ["Encaissé aujourd'hui", formatFCFA(cashedToday), "text-[#0C356A]"],
                ]
              : []),
            ["Élèves en retard", String(late), "text-[#B8000F]"],
          ] as string[][]
        ).map(([l, v, tone]) => (
          <div key={l} className="rounded-2xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-bold text-slate-500">{l}</dt>
            <dd className={cn("mt-1 text-xl font-black", tone)}>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {byProgram.map(([code, o]) => {
          const pct = o.total ? Math.round((o.paid / o.total) * 100) : 0;
          return (
            <button key={code} type="button" onClick={() => setProgram(program === code ? "" : code)} className={cn("rounded-2xl border bg-white p-4 text-left", program === code ? "border-[#E30613] ring-2 ring-red-100" : "border-slate-200 hover:border-slate-300")}>
              <p className="flex justify-between text-sm font-black text-[#0C356A]">
                {code} <span className="font-semibold text-slate-500">{o.count} élève(s)</span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {pct} %{user?.role === "directeur_general" ? ` · ${formatFCFA(o.paid)} / ${formatFCFA(o.total)}` : ""}
              </p>
            </button>
          );
        })}
      </div>

      {msg && (
        <p role="status" className={cn("flex items-center gap-2 rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#B8000F]")}>
          {msg.ok ? <CheckCircle2 aria-hidden className="size-4" /> : <XCircle aria-hidden className="size-4" />} {msg.text}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
          <span className="relative min-w-[14rem] flex-1">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Matricule, nom, classe" aria-label="Rechercher" className={cn(input, "pl-9")} />
          </span>
          <select value={program} onChange={(e) => setProgram(e.target.value)} aria-label="Filière" className="rounded-xl border border-slate-200 px-3 text-sm">
            <option value="">Toutes les filières</option>
            {formations.map((f) => (
              <option key={f.code} value={f.code}>
                {f.code}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status | "")} aria-label="Situation" className="rounded-xl border border-slate-200 px-3 text-sm">
            <option value="">Toutes les situations</option>
            {(Object.keys(STATUS) as Status[]).map((k) => (
              <option key={k} value={k}>
                {STATUS[k].label}
              </option>
            ))}
          </select>
        </div>

        {students === null ? (
          <Loader2 aria-label="Chargement" className="m-6 size-6 animate-spin text-[#0C356A]" />
        ) : list.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Aucun élève. Les élèves apparaissent ici dès leur inscription définitive (pré-inscription validée).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                  <th className="px-3 py-2">Matricule</th>
                  <th className="px-3 py-2">Élève</th>
                  <th className="px-3 py-2">Classe</th>
                  <th className="px-3 py-2 text-right">Écolage</th>
                  <th className="px-3 py-2 text-right">Payé</th>
                  <th className="px-3 py-2 text-right">Reste</th>
                  <th className="px-3 py-2">Situation</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const st = statusOf(s);
                  const mine = payments.filter((p) => p.student_id === s.id);
                  const pct = s.total_fee ? Math.min(100, Math.round((Number(s.paid_fee ?? 0) / Number(s.total_fee)) * 100)) : 0;
                  return (
                    <Fragment key={s.id}>
                      <tr className="border-t border-slate-100">
                        <td className="px-3 py-2 font-mono text-xs font-bold text-[#E30613]">{s.registration_number}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">
                          {s.last_name} {s.first_name}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{s.class_name}</td>
                        <td className="px-3 py-2 text-right">{formatFCFA(Number(s.total_fee ?? 0))}</td>
                        <td className="px-3 py-2 text-right text-emerald-700">
                          {formatFCFA(Number(s.paid_fee ?? 0))}
                          <div className="mt-1 ml-auto h-1 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-[#B8000F]">{formatFCFA(Number(s.remaining_fee ?? 0))}</td>
                        <td className="px-3 py-2">
                          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", STATUS[st].tone)}>{STATUS[st].label}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="flex justify-end gap-1">
                            {canCash && st !== "sans" && st !== "solde" && (
                              <button type="button" onClick={() => setCashFor(s)} className="inline-flex items-center gap-1.5 rounded-full bg-[#E30613] px-3 py-1.5 text-xs font-bold text-white">
                                <Banknote aria-hidden className="size-3.5" /> Encaisser
                              </button>
                            )}
                            {canCash && (
                              <button type="button" onClick={() => setEditFor(s)} aria-label="Définir l'écolage" title="Définir l'écolage (bourse, remise…)" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100">
                                <Pencil aria-hidden className="size-4" />
                              </button>
                            )}
                            <Link href={`/impression/situation/${s.id}`} target="_blank" title="Fiche de situation financière" aria-label="Fiche de situation financière" className="rounded-full p-1.5 text-[#0C356A] hover:bg-slate-100">
                              <FileSpreadsheet aria-hidden className="size-4" />
                            </Link>
                            <button type="button" onClick={() => setOpen(open === s.id ? null : s.id)} aria-label="Historique des paiements" className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs font-bold text-[#0C356A] hover:bg-slate-100">
                              {mine.length} <ChevronDown aria-hidden className={cn("size-4 transition-transform", open === s.id && "rotate-180")} />
                            </button>
                          </span>
                        </td>
                      </tr>
                      {open === s.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={8} className="px-6 py-3">
                            {mine.length === 0 ? (
                              <p className="text-sm text-slate-500">Aucun paiement enregistré.</p>
                            ) : (
                              <ul className="flex flex-col gap-1.5 text-sm">
                                {mine.map((p) => (
                                  <li key={p.id} className="flex flex-wrap items-center gap-3">
                                    <Receipt aria-hidden className="size-4 text-slate-400" />
                                    <span className="font-mono text-xs">{p.receipt_number}</span>
                                    <span>{new Date(p.payment_date ?? p.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
                                    <span className="font-bold text-emerald-700">{formatFCFA(Number(p.amount))}</span>
                                    <span className="text-slate-500">
                                      {p.designation} · {p.payment_method}
                                      {p.depositor_name ? ` · versé par ${p.depositor_name}` : ""}
                                    </span>
                                    <Link href={`/impression/recu/${p.id}`} target="_blank" className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-[#0C356A] hover:underline">
                                      <Printer aria-hidden className="size-3.5" /> Reçu
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {cashFor && (
        <CashDialog
          student={cashFor}
          count={payments.filter((p) => p.student_id === cashFor.id).length}
          cashier={user?.fullName ?? ""}
          onClose={() => setCashFor(null)}
          onDone={(text, id) => {
            setCashFor(null);
            setMsg({ ok: true, text });
            pingNotifications();
            load();
            if (id) window.open(`/impression/recu/${id}`, "_blank");
          }}
        />
      )}
      {editFor && (
        <TotalDialog
          student={editFor}
          onClose={() => setEditFor(null)}
          onDone={(text) => {
            setEditFor(null);
            setMsg({ ok: true, text });
            load();
          }}
        />
      )}
    </div>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" role="dialog" aria-label={title} onClick={onClose}>
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black text-[#0C356A]">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function CashDialog({ student, count, cashier, onClose, onDone }: { student: Student; count: number; cashier: string; onClose: () => void; onDone: (text: string, id?: string) => void }) {
  const tranche = Math.min(Number(student.remaining_fee ?? 0), Math.ceil(Number(student.total_fee ?? 0) / 8 / 500) * 500);
  const [form, setForm] = useState({
    amount: String(tranche || student.remaining_fee || ""),
    method: METHODS[0],
    designation: count === 0 ? "Inscription et 1re tranche" : `Tranche ${count + 1}`,
    depositor: student.tutor_name ?? "",
    phone: student.tutor_phone ?? "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const amount = Number(form.amount);
  const after = Math.max(0, Number(student.remaining_fee ?? 0) - (amount || 0));

  const save = async () => {
    if (!amount || amount <= 0) return setError("Montant invalide.");
    if (amount > Number(student.remaining_fee ?? 0)) return setError(`Le montant dépasse le reste à payer (${formatFCFA(Number(student.remaining_fee ?? 0))}).`);
    setBusy(true);
    const { data, error: err } = await createClient()
      .from("fee_payments")
      .insert({
        student_id: student.id,
        amount,
        payment_method: form.method,
        designation: form.designation,
        depositor_name: form.depositor || null,
        depositor_phone: form.phone || null,
        payment_date: new Date(form.date).toISOString(),
        cashier_name: cashier,
        site: "Caisse école",
        status: "validé",
      })
      .select("id, receipt_number")
      .single();
    setBusy(false);
    if (err) return setError(err.message);
    onDone(`Paiement de ${formatFCFA(amount)} enregistré (reçu ${data.receipt_number}). Reste à payer : ${formatFCFA(after)}. La famille est prévenue.`, data.id);
  };

  return (
    <Dialog title={`Encaisser · ${student.last_name} ${student.first_name}`} onClose={onClose}>
      <p className="rounded-xl bg-slate-50 p-3 text-sm">
        <span className="font-mono font-bold text-[#E30613]">{student.registration_number}</span> · {student.class_name}
        <br />
        Écolage {formatFCFA(Number(student.total_fee ?? 0))} · payé {formatFCFA(Number(student.paid_fee ?? 0))} · <strong>reste {formatFCFA(Number(student.remaining_fee ?? 0))}</strong>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Montant versé (F CFA)
          <input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={cn(input, "text-lg font-black")} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Mode de paiement
          <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={input}>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Objet
          <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Date
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Versé par
          <input value={form.depositor} onChange={(e) => setForm({ ...form, depositor: e.target.value })} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Téléphone
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
        </label>
      </div>
      <p className="text-sm">
        Reste après ce paiement : <strong className="text-[#B8000F]">{formatFCFA(after)}</strong>
      </p>
      {error && <p className="text-sm font-semibold text-[#B8000F]">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Banknote aria-hidden className="size-4" />} Enregistrer et imprimer le reçu
        </button>
        <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-bold text-slate-600">
          Annuler
        </button>
      </div>
    </Dialog>
  );
}

function TotalDialog({ student, onClose, onDone }: { student: Student; onClose: () => void; onDone: (text: string) => void }) {
  const suggested = defaultTotal(student.program_code);
  const [total, setTotal] = useState(String(student.total_fee || suggested));
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    await createClient().from("students").update({ total_fee: Number(total) || 0 }).eq("id", student.id);
    setBusy(false);
    onDone(`Écolage de ${student.first_name} ${student.last_name} fixé à ${formatFCFA(Number(total) || 0)}.`);
  };
  return (
    <Dialog title={`Écolage · ${student.last_name} ${student.first_name}`} onClose={onClose}>
      <p className="text-sm text-slate-600">
        Montant annuel par défaut pour {student.program_code} : <strong>{formatFCFA(suggested)}</strong> (inscription + scolarité + fournitures). Modifiez-le en cas de bourse ou de remise ; le reste
        à payer est recalculé.
      </p>
      <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} aria-label="Écolage annuel" className={cn(input, "text-lg font-black")} />
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="rounded-full bg-[#0C356A] px-6 py-2.5 text-sm font-bold text-white">
          Enregistrer
        </button>
        <button type="button" onClick={() => setTotal(String(suggested))} className="rounded-full px-4 py-2 text-sm font-bold text-[#0C356A]">
          Montant de la filière
        </button>
      </div>
    </Dialog>
  );
}
