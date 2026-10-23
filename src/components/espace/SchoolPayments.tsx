"use client";

import { CheckCircle2, Clock, CreditCard, GraduationCap, Loader2, Receipt, Smartphone, Wallet, XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { feeParts, feeSchedule } from "@/components/cards/SituationSheet";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Method = "carte" | "yas" | "moov";
type Online = { identifier: string; date: string; amount: number; designation: string; method: Method; status: "en_cours" | "reussi" | "echoue"; receipt?: string | null };
type StudentDue = { id: string; name: string; matricule: string | null; class: string | null; year: string | null; program: string | null; total: number; paid: number; remaining: number; fees?: { registration?: number; supplies?: number }; online: Online[] };
type ApplicationDue = { id: string; reference: string | null; name: string; program: string; specialty: string | null; fees: { registration?: number; supplies?: number }; paid: number; online: Online[] };
type Mine = { students: StudentDue[]; applications: ApplicationDue[] };

const F = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ")} F CFA`;
const dt = (s: string) => new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const METHOD_LABEL: Record<Method, string> = { carte: "Carte bancaire", yas: "Mixx by Yas", moov: "Moov Money" };
const METHODS: { k: Method; label: string; className: string; icon: typeof Smartphone }[] = [
  { k: "yas", label: "Mixx by Yas (T-Money)", className: "bg-[#FFCC00] text-slate-900", icon: Smartphone },
  { k: "moov", label: "Moov Money", className: "bg-[#0066B3] text-white", icon: Smartphone },
  { k: "carte", label: "Carte bancaire", className: "bg-avenida-blue text-white", icon: CreditCard },
];

/** Paiement en ligne des frais d'inscription et de l'écolage (PayDunya), avec l'historique des paiements en ligne. */
export function SchoolPayments({ methods }: { methods: Record<Method, boolean> }) {
  const [mine, setMine] = useState<Mine | null | undefined>(undefined);
  const [notice, setNotice] = useState<{ tone: "ok" | "wait" | "ko"; text: string; receipt?: string } | null>(null);

  const load = useCallback(() => {
    createClient()
      .rpc("my_school_payments")
      .then(({ data }) => setMine((data as Mine) ?? null));
  }, []);

  useEffect(() => {
    load();
    const q = new URLSearchParams(window.location.search);
    const state = q.get("paiement");
    const receipt = q.get("recu") ?? undefined;
    if (state === "ok") setNotice({ tone: "ok", text: "Paiement confirmé : merci ! Votre reçu officiel est disponible et votre situation financière est à jour.", receipt });
    else if (state === "en_cours") setNotice({ tone: "wait", text: "Paiement en cours de confirmation par l'opérateur. Cette page se met à jour automatiquement." });
    else if (state === "echec") setNotice({ tone: "ko", text: "Le paiement n'a pas abouti. Vous pouvez réessayer ou régler à la caisse de l'école." });
    else if (state === "annule") setNotice({ tone: "ko", text: "Paiement interrompu : aucun montant n'a été prélevé." });
    // Mise à jour en temps réel dès qu'un paiement arrive (en ligne ou à la caisse), quel que soit le payeur
    const supabase = createClient();
    const channel = supabase
      .channel("mes-paiements-ecolage")
      .on("postgres_changes", { event: "*", schema: "public", table: "school_payments" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "fee_payments" }, () => load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "students" }, () => load())
      .subscribe();
    // Paiement mobile parfois confirmé avec quelques secondes de retard
    const t = state === "en_cours" ? window.setInterval(load, 8000) : 0;
    return () => {
      if (t) window.clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [load]);

  const anyOnline = methods.carte || methods.yas || methods.moov;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold tracking-widest text-vif uppercase">
          <Wallet aria-hidden className="size-4" /> Paiement en ligne
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-avenida-blue">Frais d&apos;inscription et écolage</h1>
        <p className="mt-1 text-sm text-slate-600">
          Payez par Mixx by Yas (T-Money), Moov Money ou carte bancaire. Le reçu officiel est créé dès la confirmation du paiement, et le reste à payer est mis à jour partout.
        </p>
      </div>

      {notice && (
        <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-sm font-semibold", notice.tone === "ok" ? "bg-emerald-50 text-emerald-800" : notice.tone === "wait" ? "bg-amber-50 text-amber-900" : "bg-rose-50 text-rose-800")}>
          <span>{notice.text}</span>
          {notice.receipt && (
            <Link href={`/impression/recu/${notice.receipt}`} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-white">
              <Receipt aria-hidden className="size-4" /> Voir mon reçu
            </Link>
          )}
        </div>
      )}

      {!anyOnline && <p className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">Le paiement en ligne sera bientôt disponible : en attendant, réglez à la caisse de l&apos;école.</p>}

      {mine === undefined && <Loader2 aria-label="Chargement" className="size-8 animate-spin text-avenida-blue" />}
      {mine === null && <p className="rounded-2xl bg-amber-50 p-6 text-amber-900">Impossible de charger vos dossiers.</p>}
      {mine && !mine.students.length && !mine.applications.length && (
        <p className="rounded-3xl bg-white p-6 text-sm text-slate-600 ring-1 ring-slate-900/5">
          Aucun dossier à régler pour le moment. Les frais d&apos;inscription se paient en ligne dès que votre pré-inscription est acceptée ; l&apos;écolage, une fois l&apos;élève inscrit et rattaché à votre compte.
        </p>
      )}

      {mine?.students.map((s) => <StudentCard key={s.id} s={s} methods={methods} />)}
      {mine?.applications.map((a) => <ApplicationCard key={a.id} a={a} methods={methods} />)}
    </div>
  );
}

/** Démarre le paiement et ouvre la page de paiement PayDunya. */
function usePay() {
  const [busy, setBusy] = useState<Method | "">("");
  const [error, setError] = useState("");
  const pay = async (method: Method, body: Record<string, unknown>) => {
    setBusy(method);
    setError("");
    const res = await fetch("/api/ecolage/payer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, method }) }).catch(() => null);
    const j = res ? ((await res.json().catch(() => ({}))) as { url?: string; error?: string }) : { error: "Connexion impossible." };
    if (j.url) return void (window.location.href = j.url);
    setBusy("");
    setError(j.error ?? "Paiement impossible.");
  };
  return { busy, error, pay };
}

function MethodButtons({ methods, busy, disabled, onPay }: { methods: Record<Method, boolean>; busy: Method | ""; disabled: boolean; onPay: (m: Method) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {METHODS.filter((m) => methods[m.k]).map((m) => (
        <button key={m.k} type="button" disabled={disabled || !!busy} onClick={() => onPay(m.k)} className={cn("inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold disabled:opacity-50", m.className)}>
          {busy === m.k ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <m.icon aria-hidden className="size-4" />} {m.label}
        </button>
      ))}
    </div>
  );
}

function History({ items }: { items: Online[] }) {
  if (!items.length) return null;
  return (
    <div className="border-t border-slate-100 pt-4">
      <h3 className="text-sm font-bold text-avenida-blue-950">Paiements en ligne</h3>
      <ul className="mt-2 divide-y divide-slate-100">
        {items.map((p) => (
          <li key={p.identifier} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span>
              <strong>{F(p.amount)}</strong> · {p.designation}
              <span className="block text-xs text-slate-500">
                {dt(p.date)} · {METHOD_LABEL[p.method]}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold", p.status === "reussi" ? "bg-emerald-100 text-emerald-800" : p.status === "echoue" ? "bg-slate-200 text-slate-600" : "bg-amber-100 text-amber-900")}>
                {p.status === "reussi" ? <CheckCircle2 aria-hidden className="size-3.5" /> : p.status === "echoue" ? <XCircle aria-hidden className="size-3.5" /> : <Clock aria-hidden className="size-3.5" />}
                {p.status === "reussi" ? "Payé" : p.status === "echoue" ? "Non abouti" : "En attente"}
              </span>
              {p.receipt && (
                <Link href={`/impression/recu/${p.receipt}`} className="rounded-full px-3 py-1 text-xs font-bold text-avenida-blue ring-1 ring-avenida-blue/30">
                  Reçu
                </Link>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Option = { key: string; label: string; hint?: string; amount: number; designation: string };

/** Formules de paiement proposées par l'école, rubrique par rubrique, puis le montant libre. */
function paymentOptions(s: StudentDue) {
  const parts = feeParts({ program_code: s.program, total_fee: s.total, paid_fee: s.paid }, { registration: s.fees?.registration, supplies: s.fees?.supplies });
  const [reg, sup, tui] = parts.rubrics;
  const options: Option[] = [];
  if (reg.remaining > 0) options.push({ key: "inscription", label: "Frais d'inscription", amount: reg.remaining, designation: "Frais d'inscription" });
  if (sup.remaining > 0)
    options.push({
      key: "fournitures",
      label: "Frais de fournitures",
      hint: reg.remaining > 0 ? `avec le reste des frais d'inscription (${F(reg.remaining)})` : undefined,
      amount: reg.remaining + sup.remaining,
      designation: reg.remaining > 0 ? "Frais d'inscription et de fournitures" : "Frais de fournitures",
    });
  if (tui.remaining > 0 && tui.amount > 0) {
    const before = reg.remaining + sup.remaining;
    const hint = before > 0 ? `avec les frais d'inscription et de fournitures restants (${F(before)})` : undefined;
    // Mensualités (8) et trimestres (3) : prochaine part de la scolarité non encore réglée
    const plan = (count: number, name: string) => {
      const part = Math.ceil(tui.amount / count);
      const k = Math.min(count, Math.floor(tui.paid / part) + 1);
      return { k, amount: Math.min(tui.remaining, k * part - tui.paid) + before, name };
    };
    const m = plan(8, "mensualité");
    const t = plan(3, "trimestre");
    options.push({ key: "mensuel", label: `Mensualité ${m.k}/8`, hint: hint ?? "paiement en 8 tranches mensuelles", amount: m.amount, designation: `Scolarité · mensualité ${m.k}/8` });
    options.push({ key: "trimestriel", label: `Trimestre ${t.k}/3`, hint: hint ?? "paiement en 3 tranches trimestrielles", amount: t.amount, designation: `Scolarité · trimestre ${t.k}/3` });
    options.push({ key: "annuel", label: "Scolarité de toute l'année", hint, amount: tui.remaining + before, designation: "Scolarité · année complète" });
  }
  // Retard sur l'échéancier : montant pour se remettre à jour
  const lines = feeSchedule({ program_code: s.program, total_fee: s.total, paid_fee: s.paid, academic_year: s.year });
  const dueNow = lines.filter((l) => l.date <= new Date()).reduce((a, l) => Math.max(a, l.cumul), 0);
  const late = Math.min(s.remaining, dueNow - s.paid);
  if (late > 0 && !options.some((o) => o.amount === late)) options.unshift({ key: "retard", label: "Me remettre à jour", hint: "montant en retard sur l'échéancier", amount: late, designation: "Rattrapage de l'échéancier" });
  if (!options.some((o) => o.amount === s.remaining)) options.push({ key: "tout", label: "Tout solder", hint: "reste total de l'année", amount: s.remaining, designation: "Solde de l'écolage" });
  return { parts, options, late: late > 0 };
}

function StudentCard({ s, methods }: { s: StudentDue; methods: Record<Method, boolean> }) {
  const { busy, error, pay } = usePay();
  const { parts, options, late } = paymentOptions(s);
  const [picked, setPicked] = useState(options[0]?.key ?? "autre");
  const [custom, setCustom] = useState("");
  // Après un paiement, les formules changent : on revient sur la première si celle choisie a disparu
  const choice = picked === "autre" || options.some((o) => o.key === picked) ? picked : (options[0]?.key ?? "autre");
  const setChoice = setPicked;
  const selected = options.find((o) => o.key === choice);
  const amount = selected ? selected.amount : Math.floor(Number(custom) || 0);
  const designation = selected ? selected.designation : "Écolage · montant libre";
  const valid = amount >= 500 && amount <= s.remaining;

  return (
    <section className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
            Écolage {s.year ?? ""} · {s.matricule ?? "—"}
          </p>
          <h2 className="mt-1 flex items-center gap-2 font-display text-xl font-extrabold text-avenida-blue-950">
            <GraduationCap aria-hidden className="size-5 text-vif" /> {s.name}
          </h2>
          <p className="text-sm text-slate-600">{s.class ?? ""}</p>
        </div>
        <span className={cn("rounded-full px-3 py-1.5 text-xs font-bold", s.remaining <= 0 ? "bg-emerald-100 text-emerald-800" : late ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-900")}>
          {s.remaining <= 0 ? "En règle · écolage soldé" : late ? "En retard sur l'échéancier" : "Non soldé"}
        </span>
      </header>

      {/* Rubriques : chaque paiement est imputé sur l'inscription, puis les fournitures, puis la scolarité */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="text-left text-[11px] tracking-wide text-slate-500 uppercase">
              <th className="py-2">Rubrique</th>
              <th className="py-2 text-right">Montant</th>
              <th className="py-2 text-right">Payé</th>
              <th className="py-2 text-right">Reste</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parts.rubrics.map((r) => (
              <tr key={r.key}>
                <td className="py-2 font-semibold text-avenida-blue-950">
                  {r.label}
                  {r.amount > 0 && r.remaining <= 0 && <CheckCircle2 aria-label="réglé" className="ml-1.5 inline size-4 text-emerald-600" />}
                </td>
                <td className="py-2 text-right">{F(r.amount)}</td>
                <td className="py-2 text-right text-emerald-700">{F(r.paid)}</td>
                <td className={cn("py-2 text-right font-bold", r.remaining > 0 ? "text-vif" : "text-emerald-700")}>{F(r.remaining)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-extrabold">
              <td className="py-2 pl-1">Total de l&apos;année</td>
              <td className="py-2 text-right">{F(s.total)}</td>
              <td className="py-2 text-right text-emerald-700">{F(s.paid)}</td>
              <td className={cn("py-2 pr-1 text-right", s.remaining > 0 ? "text-vif" : "text-emerald-700")}>{F(s.remaining)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {s.remaining <= 0 ? (
        <p className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Écolage entièrement payé : l&apos;élève est en règle et sa carte scolaire est valide.
          <Link href="/espace/carte" className="rounded-full bg-emerald-700 px-4 py-2 text-white">
            Voir la carte scolaire
          </Link>
        </p>
      ) : (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-bold text-avenida-blue-950">Que voulez-vous payer ?</legend>
            {options.map((o) => (
              <label key={o.key} className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-2xl p-3 ring-1", choice === o.key ? "bg-avenida-blue-50 ring-avenida-blue" : "ring-slate-200")}>
                <span className="flex items-center gap-2 text-sm">
                  <input type="radio" name={`m-${s.id}`} checked={choice === o.key} onChange={() => setChoice(o.key)} />
                  <span>
                    <span className="font-semibold">{o.label}</span>
                    {o.hint && <span className="block text-xs text-slate-500">{o.hint}</span>}
                  </span>
                </span>
                <strong className="shrink-0 text-sm">{F(o.amount)}</strong>
              </label>
            ))}
            <label className={cn("flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-2xl p-3 ring-1", choice === "autre" ? "bg-avenida-blue-50 ring-avenida-blue" : "ring-slate-200")}>
              <span className="flex items-center gap-2 text-sm">
                <input type="radio" name={`m-${s.id}`} checked={choice === "autre"} onChange={() => setChoice("autre")} />
                <span>
                  <span className="font-semibold">Autre montant</span>
                  <span className="block text-xs text-slate-500">le montant que vous décidez de payer (500 F minimum)</span>
                </span>
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={500}
                max={s.remaining}
                step={500}
                value={custom}
                onFocus={() => setChoice("autre")}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Ex. 25 000"
                className="w-36 rounded-xl border border-slate-200 px-3 py-1.5 text-right text-sm"
                aria-label="Montant libre en francs CFA"
              />
            </label>
            {choice === "autre" && custom && !valid && <p className="text-xs font-semibold text-vif">Entre 500 F et {F(s.remaining)}.</p>}
          </fieldset>
          <p className="text-xs text-slate-500">L&apos;élève comme ses parents ou tuteurs peuvent payer : le nom de la personne qui paie, la date et l&apos;heure figurent sur le reçu.</p>
          <MethodButtons methods={methods} busy={busy} disabled={!valid} onPay={(m) => pay(m, { student_id: s.id, amount, designation })} />
          {error && (
            <p role="alert" className="text-sm font-semibold text-vif">
              {error}
            </p>
          )}
        </>
      )}
      <Link href="/espace/situation" className="self-start text-sm font-bold text-avenida-blue underline-offset-4 hover:underline">
        Fiche de situation financière et historique complet →
      </Link>
      <History items={s.online} />
    </section>
  );
}

function ApplicationCard({ a, methods }: { a: ApplicationDue; methods: Record<Method, boolean> }) {
  const { busy, error, pay } = usePay();
  const reg = Number(a.fees.registration ?? 0);
  const sup = Number(a.fees.supplies ?? 0);
  const [option, setOption] = useState<"inscription" | "inscription_fournitures">("inscription");
  const due = Math.max(0, (option === "inscription" ? reg : reg + sup) - a.paid);
  const regPaid = a.paid >= reg;

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <header>
        <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Dossier {a.reference ?? "—"} · accepté</p>
        <h2 className="mt-1 font-display text-xl font-extrabold text-avenida-blue-950">
          Frais d&apos;inscription · {a.program}
          {a.specialty ? ` ${a.specialty}` : ""}
        </h2>
        <p className="text-sm text-slate-600">
          {a.name} : réglez vos frais en ligne, puis présentez-vous au bureau des inscriptions avec vos pièces originales. Le paiement est repris automatiquement sur votre fiche d&apos;élève.
        </p>
      </header>
      <fieldset className="flex flex-col gap-2">
        {!regPaid && (
          <label className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-2xl p-3 ring-1", option === "inscription" ? "bg-avenida-blue-50 ring-avenida-blue" : "ring-slate-200")}>
            <span className="flex items-center gap-2 text-sm">
              <input type="radio" name={`a-${a.id}`} checked={option === "inscription"} onChange={() => setOption("inscription")} />
              Frais d&apos;inscription
            </span>
            <strong className="text-sm">{F(Math.max(0, reg - a.paid))}</strong>
          </label>
        )}
        <label className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-2xl p-3 ring-1", option === "inscription_fournitures" || regPaid ? "bg-avenida-blue-50 ring-avenida-blue" : "ring-slate-200")}>
          <span className="flex items-center gap-2 text-sm">
            <input type="radio" name={`a-${a.id}`} checked={option === "inscription_fournitures" || regPaid} onChange={() => setOption("inscription_fournitures")} />
            {regPaid ? "Fournitures" : "Inscription et fournitures"}
          </span>
          <strong className="text-sm">{F(Math.max(0, reg + sup - a.paid))}</strong>
        </label>
      </fieldset>
      {(regPaid ? reg + sup - a.paid : due) > 0 ? (
        <MethodButtons methods={methods} busy={busy} disabled={false} onPay={(m) => pay(m, { application_id: a.id, option: regPaid ? "inscription_fournitures" : option })} />
      ) : (
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Frais d&apos;inscription et fournitures payés.</p>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-vif">
          {error}
        </p>
      )}
      <History items={a.online} />
    </section>
  );
}
