"use client";

import { BookOpenCheck, GraduationCap, Loader2, Plus, Save, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formations } from "@/content/site";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFCFA } from "@/lib/utils";

type Program = { id: string; code: string; name: string; duration_years: number | null; min_entry_level: string | null; annual_tuition: number | null; registration_fee: number | null; supplies_fee: number | null };

const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0C356A]";

/** Filières (diplômes) et leurs classes : frais appliqués à l'inscription, effectifs, matières du bulletin. */
export default function ProgramsPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [classes, setClasses] = useState<Map<string, Map<string, number>>>(new Map());
  const [msg, setMsg] = useState("");
  const canEdit = user?.role === "directeur_general" || user?.role === "directeur_pedagogique";

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("programs").select("id, code, name, duration_years, min_entry_level, annual_tuition, registration_fee, supplies_fee").order("code"),
      supabase.from("students").select("program_code, class_name").eq("status", "actif"),
    ]);
    setPrograms((p ?? []) as Program[]);
    const map = new Map<string, Map<string, number>>();
    (s ?? []).forEach((r) => {
      const code = r.program_code ?? "—";
      const m = map.get(code) ?? new Map<string, number>();
      m.set(r.class_name ?? "Sans classe", (m.get(r.class_name ?? "Sans classe") ?? 0) + 1);
      map.set(code, m);
    });
    setClasses(map);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const code = window.prompt("Code de la nouvelle filière (ex. BTS, CAP) :")?.trim().toUpperCase();
    if (!code) return;
    const name = window.prompt("Intitulé complet :", code)?.trim();
    if (!name) return;
    const { error } = await createClient().from("programs").insert({ code, name, duration_years: 2, annual_tuition: 0, registration_fee: 0, supplies_fee: 0 });
    setMsg(error ? error.message : `Filière ${code} ajoutée : complétez ses frais.`);
    load();
  };

  if (!programs) return <Loader2 aria-label="Chargement" className="size-6 animate-spin" />;
  const total = [...classes.values()].reduce((a, m) => a + [...m.values()].reduce((x, y) => x + y, 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
            <GraduationCap aria-hidden className="size-6 text-[#E30613]" /> Filières et classes
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {programs.length} filière(s) · {total} élève(s) actif(s). Les frais ci-dessous sont appliqués automatiquement à chaque inscription définitive.
          </p>
        </div>
        {canEdit && (
          <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-4 py-2 text-sm font-bold text-white">
            <Plus aria-hidden className="size-4" /> Nouvelle filière
          </button>
        )}
      </header>
      {msg && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{msg}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {programs.map((p) => (
          <ProgramCard key={p.id} p={p} classes={classes.get(p.code)} canEdit={canEdit} onSaved={(t) => (setMsg(t), load())} />
        ))}
      </div>
    </div>
  );
}

function ProgramCard({ p, classes, canEdit, onSaved }: { p: Program; classes?: Map<string, number>; canEdit: boolean; onSaved: (msg: string) => void }) {
  const [v, setV] = useState({ name: p.name, duration_years: String(p.duration_years ?? ""), min_entry_level: p.min_entry_level ?? "", registration_fee: String(p.registration_fee ?? 0), annual_tuition: String(p.annual_tuition ?? 0), supplies_fee: String(p.supplies_fee ?? 0) });
  const [busy, setBusy] = useState(false);
  const specialties = formations.find((f) => f.code === p.code)?.specialties ?? [];
  const total = Number(v.registration_fee) + Number(v.annual_tuition) + Number(v.supplies_fee);

  const save = async () => {
    setBusy(true);
    const { error } = await createClient()
      .from("programs")
      .update({ name: v.name.trim(), duration_years: Number(v.duration_years) || null, min_entry_level: v.min_entry_level.trim() || null, registration_fee: Number(v.registration_fee) || 0, annual_tuition: Number(v.annual_tuition) || 0, supplies_fee: Number(v.supplies_fee) || 0 })
      .eq("id", p.id);
    setBusy(false);
    onSaved(error ? error.message : `${p.code} : frais enregistrés (appliqués aux prochaines inscriptions).`);
  };

  const field = (k: keyof typeof v, label: string, type = "text") => (
    <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
      {label}
      <input type={type} value={v[k]} disabled={!canEdit} onChange={(e) => setV({ ...v, [k]: e.target.value })} className={cn(input, !canEdit && "bg-slate-50")} />
    </label>
  );

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-[#0C356A] px-3 py-1.5 font-mono text-sm font-black text-white">{p.code}</span>
        <p className="font-bold text-slate-800">{p.name}</p>
      </div>
      {specialties.length > 0 && <p className="text-xs text-slate-500">Spécialités : {specialties.join(", ")}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        {field("name", "Intitulé")}
        {field("duration_years", "Durée (années)", "number")}
        {field("min_entry_level", "Niveau d'entrée")}
        {field("registration_fee", "Inscription (F CFA)", "number")}
        {field("annual_tuition", "Écolage annuel (F CFA)", "number")}
        {field("supplies_fee", "Fournitures (F CFA)", "number")}
      </div>
      <p className="text-sm font-bold text-[#0C356A]">Total à l&apos;inscription : {formatFCFA(total)}</p>
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase">
          <Users aria-hidden className="size-4" /> Classes
        </p>
        {classes && classes.size ? (
          <ul className="flex flex-wrap gap-2">
            {[...classes.entries()].sort().map(([c, n]) => (
              <li key={c}>
                <Link href="/dashboard/eleves" className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:text-[#E30613]">
                  {c} <span className="rounded-full bg-white px-1.5 text-[#0C356A]">{n}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Aucun élève inscrit dans cette filière.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#0C356A] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />} Enregistrer
          </button>
        )}
        <Link href="/dashboard/notes" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200 hover:text-[#E30613]">
          <BookOpenCheck aria-hidden className="size-4" /> Matières et coefficients du bulletin
        </Link>
      </div>
    </article>
  );
}
