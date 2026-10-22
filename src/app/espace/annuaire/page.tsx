"use client";

import { Search, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PhoneLinks, type DirectoryEntry } from "@/components/annuaire/PhoneLinks";
import { createClient } from "@/lib/supabase/client";

/** Annuaire de l'établissement : administration et professeurs, avec leurs numéros (membres connectés). */
export default function AnnuairePage() {
  const [rows, setRows] = useState<DirectoryEntry[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    createClient()
      .from("staff_directory")
      .select("id, full_name, function_title, subjects, phones, position")
      .order("position")
      .then(({ data }) => setRows((data ?? []) as DirectoryEntry[]));
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => !t || `${r.full_name} ${r.function_title ?? ""} ${r.subjects ?? ""}`.toLowerCase().includes(t));
  }, [rows, q]);
  const admin = filtered.filter((r) => r.function_title);
  const profs = filtered.filter((r) => r.subjects).sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold tracking-widest text-vif uppercase">
          <UsersRound aria-hidden className="size-4" /> Annuaire
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-avenida-blue">Administration et professeurs</h1>
        <p className="mt-1 text-sm text-slate-600">Coordonnées réservées aux élèves, parents et personnel de l&apos;établissement. Merci de les utiliser avec discrétion.</p>
      </div>
      <label className="flex max-w-md items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200">
        <Search aria-hidden className="size-4 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, fonction ou matière" aria-label="Rechercher" className="w-full bg-transparent text-sm outline-none" />
      </label>
      {!rows ? (
        <div className="h-48 animate-pulse rounded-3xl bg-white" />
      ) : (
        <>
          <section>
            <h2 className="mb-3 font-display text-xl font-extrabold text-avenida-blue">Administration de l&apos;école</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {admin.map((r) => (
                <li key={r.id} className="flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
                  <p className="text-xs font-bold tracking-widest text-vif uppercase">{r.function_title}</p>
                  <p className="font-bold text-slate-900">{r.full_name}</p>
                  <PhoneLinks phones={r.phones} />
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 font-display text-xl font-extrabold text-avenida-blue">Professeurs et matières enseignées</h2>
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-3">Nom et prénoms</th>
                    <th className="p-3">Matière(s)</th>
                    <th className="p-3">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profs.map((r) => (
                    <tr key={r.id}>
                      <td className="p-3 font-bold text-slate-900">{r.full_name}</td>
                      <td className="p-3 text-slate-700">{r.subjects}</td>
                      <td className="p-3">
                        <PhoneLinks phones={r.phones} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
