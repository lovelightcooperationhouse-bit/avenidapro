"use client";

import { CheckCircle2, Clock, ExternalLink, Loader2, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { pingNotifications } from "@/lib/notify";
import { ROLE_CONFIG } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { executeValidation, KIND_LABEL, type Validation } from "@/lib/validations";

const STATUS = {
  en_attente: { label: "En attente du DG", tone: "bg-amber-100 text-amber-800", icon: Clock },
  approuvee: { label: "Approuvée", tone: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  refusee: { label: "Refusée", tone: "bg-red-100 text-red-700", icon: XCircle },
};

/**
 * Contrôle du Directeur général : les actions finales soumises par l'équipe (inscriptions, envoi des bulletins,
 * validation des cartes…). Le DG approuve (l'action s'exécute) ou refuse ; le demandeur est alerté en retour.
 */
export default function ValidationsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Validation[] | null>(null);
  const [filter, setFilter] = useState<"en_attente" | "toutes">("en_attente");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const isDG = user?.role === "directeur_general";

  const load = useCallback(async () => {
    let q = createClient().from("dg_validations").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter === "en_attente") q = q.eq("status", "en_attente");
    const { data } = await q;
    setRows((data ?? []) as Validation[]);
  }, [filter]);
  useEffect(() => {
    load();
    // Alerte en temps réel : nouvelle demande ou décision
    const ch = createClient()
      .channel("dg-validations")
      .on("postgres_changes", { event: "*", schema: "public", table: "dg_validations" }, () => load())
      .subscribe();
    return () => {
      createClient().removeChannel(ch);
    };
  }, [load]);

  const decide = async (v: Validation, ok: boolean) => {
    setBusy(v.id);
    setMsg(null);
    try {
      const report = ok ? await executeValidation(v) : null;
      const note = [report, notes[v.id]?.trim()].filter(Boolean).join(" ") || null;
      const { error } = await createClient()
        .from("dg_validations")
        .update({ status: ok ? "approuvee" : "refusee", decision_note: note, decided_by: user?.id, decided_at: new Date().toISOString() })
        .eq("id", v.id);
      if (error) throw new Error(error.message);
      pingNotifications();
      setMsg({ ok: true, text: ok ? `Approuvé : ${report}` : "Demande refusée : le demandeur est prévenu." });
    } catch (e) {
      setMsg({ ok: false, text: `Exécution impossible : ${e instanceof Error ? e.message : "erreur"}. La demande reste en attente.` });
    }
    setBusy(null);
    load();
  };

  if (!user) return null;
  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#E30613] uppercase">
          <ShieldCheck aria-hidden className="size-4" /> Contrôle de la Direction générale
        </p>
        <h1 className="text-2xl font-black text-[#0C356A]">{isDG ? "Validations à traiter" : "Mes demandes au Directeur général"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isDG
            ? "Chaque action finale de l'équipe vous est soumise : vous êtes alerté instantanément. En approuvant, l'action s'exécute et le demandeur est prévenu ; en refusant, il reçoit votre motif."
            : "Les actions finales (inscription définitive, envoi des bulletins, validation des cartes…) sont contrôlées par le Directeur général. Vous êtes alerté dès sa décision."}
        </p>
      </header>
      <div className="flex gap-1 self-start rounded-xl bg-slate-100 p-1">
        {(["en_attente", "toutes"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={cn("rounded-lg px-4 py-2 text-sm font-bold", filter === f ? "bg-white text-[#0C356A] shadow-sm" : "text-slate-500")}>
            {f === "en_attente" ? "En attente" : "Historique"}
          </button>
        ))}
      </div>
      {msg && <p className={cn("rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#B8000F]")}>{msg.text}</p>}
      {!rows ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{filter === "en_attente" ? "Aucune demande en attente." : "Aucune demande."}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((v) => {
            const st = STATUS[v.status];
            return (
              <li key={v.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold tracking-wide text-[#E30613] uppercase">{KIND_LABEL[v.kind] ?? v.kind}</p>
                    <p className="font-bold text-slate-900">{v.title}</p>
                    {v.details && <p className="text-sm text-slate-600">{v.details}</p>}
                    <p className="mt-1 text-xs text-slate-500">
                      Soumis par {v.requester_name ?? "—"}
                      {v.requester_role ? ` (${ROLE_CONFIG[v.requester_role as keyof typeof ROLE_CONFIG]?.label ?? v.requester_role})` : ""} le{" "}
                      {new Date(v.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap", st.tone)}>
                    <st.icon aria-hidden className="size-3.5" /> {st.label}
                  </span>
                </div>
                {v.decision_note && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Décision : {v.decision_note}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  {v.link && (
                    <Link href={v.link} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[#0C356A] ring-1 ring-slate-200 hover:text-[#E30613]">
                      <ExternalLink aria-hidden className="size-3.5" /> Vérifier
                    </Link>
                  )}
                  {isDG && v.status === "en_attente" && (
                    <>
                      <input value={notes[v.id] ?? ""} onChange={(e) => setNotes({ ...notes, [v.id]: e.target.value })} placeholder="Commentaire (facultatif, obligatoire pour un refus motivé)" aria-label="Commentaire" className="min-w-56 flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm" />
                      <button type="button" disabled={busy === v.id} onClick={() => decide(v, true)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white disabled:opacity-60">
                        {busy === v.id ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <CheckCircle2 aria-hidden className="size-4" />} Approuver et exécuter
                      </button>
                      <button type="button" disabled={busy === v.id} onClick={() => decide(v, false)} className="rounded-full px-4 py-1.5 text-sm font-bold text-red-600 ring-1 ring-red-200">
                        Refuser
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
