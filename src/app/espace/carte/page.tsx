"use client";

import { AlertTriangle, CheckCircle2, IdCard as IdCardIcon, Loader2, Printer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { IdCard, type CardData } from "@/components/cards/IdCard";
import { useAuth } from "@/context/AuthContext";
import { employeeCardData, studentCardData, type CardRow, type EmployeeRow, type StudentRow, STUDENT_CARD_COLS, EMPLOYEE_CARD_COLS } from "@/lib/cards";
import { pingNotifications } from "@/lib/notify";
import { createClient } from "@/lib/supabase/client";

const STUDENT_COLS = STUDENT_CARD_COLS;

type Review = { id: string; status: string; note: string | null };
type Entry = { data: CardData; review: Review };
const review = (c: CardRow): Review => {
  const r = c as CardRow & { id: string; review_status?: string; review_note?: string | null };
  return { id: r.id, status: r.review_status ?? "envoyee", note: r.review_note ?? null };
};

/** Carte scolaire (élève, parents) ou carte de travail (personnel, professeurs), à jour en temps réel. */
export default function MyCardPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Entry[] | null>(null);

  const load = useCallback(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      const result: Entry[] = [];
      const studentIds: string[] = [];
      if (user.role === "eleve" && user.studentId) studentIds.push(user.studentId);
      if (user.role === "parent") {
        const { data } = await supabase.from("parent_students").select("student_id").eq("parent_id", user.id);
        studentIds.push(...(data ?? []).map((d) => d.student_id));
      }
      if (studentIds.length) {
        const [{ data: c }, { data: s }] = await Promise.all([supabase.from("id_cards").select("*").in("student_id", studentIds).eq("revoked", false), supabase.from("students").select(STUDENT_COLS).in("id", studentIds)]);
        (c ?? []).forEach((card: CardRow) => {
          const st = (s ?? []).find((x) => x.id === card.student_id) as StudentRow | undefined;
          if (st) result.push({ data: studentCardData(st, card), review: review(card) });
        });
      }
      if (!["eleve", "parent", "candidat"].includes(user.role)) {
        const { data: me } = await supabase.from("profiles").select("employee_id").eq("id", user.id).maybeSingle();
        if (me?.employee_id) {
          const [{ data: card }, { data: emp }] = await Promise.all([
            supabase.from("id_cards").select("*").eq("employee_id", me.employee_id).eq("revoked", false).maybeSingle<CardRow>(),
            supabase.from("employees").select(EMPLOYEE_CARD_COLS).eq("id", me.employee_id).maybeSingle<EmployeeRow>(),
          ]);
          if (card && emp) result.push({ data: employeeCardData(emp, card), review: review(card) });
        }
      }
      setCards(result);
    })();
  }, [user]);
  useEffect(load, [load]);

  if (!user) return null;
  const student = user.role === "eleve" || user.role === "parent";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-avenida-blue-950">{student ? "Carte scolaire" : "Carte de travail"}</h1>
          <p className="mt-1 max-w-2xl text-slate-600">
            Le QR code renvoie vers la situation à jour : validité, scolarité{student ? ", présence du jour et assiduité" : " et poste occupé"}. Présentez-la à l&apos;entrée.
          </p>
        </div>
        {cards && cards.length > 0 && (
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-vif px-5 py-2.5 text-sm font-bold text-white hover:bg-vif-fonce">
            <Printer aria-hidden className="size-4" /> Imprimer
          </button>
        )}
      </div>
      {!cards ? (
        <div className="h-56 animate-pulse rounded-3xl bg-white" />
      ) : cards.length === 0 ? (
        <p className="flex items-center gap-3 rounded-3xl bg-amber-50 p-6 text-amber-900 ring-1 ring-amber-200">
          <IdCardIcon aria-hidden className="size-6 shrink-0" />
          {student
            ? "La carte n'a pas encore été émise. Elle est créée par l'administration une fois l'inscription définitive validée : vous serez prévenu·e par notification."
            : "Votre carte de travail n'a pas encore été émise, ou votre compte n'est pas encore lié à votre fiche du personnel. Contactez les ressources humaines."}
        </p>
      ) : (
        <ul className="flex flex-col gap-8">
          {cards.map((c) => (
            <li key={c.data.token} className="flex flex-col gap-4">
              {c.review.status === "brouillon" ? (
                <p className="rounded-3xl bg-amber-50 p-6 text-amber-900 ring-1 ring-amber-200">Votre carte est en préparation par l&apos;administration. Vous serez invité·e à la vérifier avant sa validation.</p>
              ) : (
                <>
                  {c.review.status !== "envoyee" && <ReviewPanel review={c.review} onDone={load} />}
                  <IdCard data={c.data} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Vérification de la carte par son titulaire (ou ses parents) avant validation par l'administration. */
function ReviewPanel({ review, onDone }: { review: Review; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const answer = async (ok: boolean) => {
    if (!ok && !note.trim()) return setError("Indiquez l'erreur à corriger.");
    setBusy(true);
    const { error: e } = await createClient().rpc("answer_card_review", { card: review.id, ok, note: note.trim() || null });
    setBusy(false);
    if (e) return setError(e.message);
    pingNotifications();
    onDone();
  };

  if (review.status === "approuvee")
    return (
      <p className="flex items-center gap-2 rounded-3xl bg-emerald-50 p-5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 print:hidden">
        <CheckCircle2 aria-hidden className="size-5 shrink-0" /> Merci, vous avez confirmé les informations. L&apos;administration va valider la carte définitive.
      </p>
    );
  if (review.status === "corrections")
    return (
      <p className="flex items-center gap-2 rounded-3xl bg-amber-50 p-5 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 print:hidden">
        <AlertTriangle aria-hidden className="size-5 shrink-0" /> Correction signalée{review.note ? ` : « ${review.note} »` : ""}. L&apos;administration corrige la carte et vous la renverra.
      </p>
    );
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-sky-50 p-5 ring-1 ring-sky-200 print:hidden">
      <p className="font-bold text-avenida-blue">Vérifiez votre carte avant sa validation</p>
      <p className="text-sm text-slate-700">Contrôlez le nom, la date et le lieu de naissance, le sexe, l&apos;adresse, le tuteur et la photo (recto et verso).</p>
      {review.note && <p className="rounded-xl bg-white p-3 text-sm text-slate-700">Message de l&apos;administration : « {review.note} »</p>}
      {reporting && (
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Ex. : la date de naissance est le 12/03/2009, pas le 21/03/2009" aria-label="Erreur à corriger" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
      )}
      {error && <p className="text-sm font-semibold text-vif">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {!reporting ? (
          <>
            <button type="button" disabled={busy} onClick={() => answer(true)} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <CheckCircle2 aria-hidden className="size-4" />} Les informations sont exactes
            </button>
            <button type="button" onClick={() => setReporting(true)} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-vif ring-1 ring-slate-200">
              <AlertTriangle aria-hidden className="size-4" /> Signaler une erreur
            </button>
          </>
        ) : (
          <>
            <button type="button" disabled={busy} onClick={() => answer(false)} className="inline-flex items-center gap-2 rounded-full bg-vif px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {busy && <Loader2 aria-hidden className="size-4 animate-spin" />} Envoyer la correction
            </button>
            <button type="button" onClick={() => setReporting(false)} className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
              Annuler
            </button>
          </>
        )}
      </div>
    </section>
  );
}
