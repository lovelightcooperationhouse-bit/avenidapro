"use client";

import { CheckCircle2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

/** Profil personnel : nom, prénom et téléphone (le rôle est géré par la direction). */
export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    createClient()
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => data && setForm({ first_name: data.first_name ?? "", last_name: data.last_name ?? "", phone: data.phone ?? "" }));
  }, [user]);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await createClient()
      .from("profiles")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaved(error ? "Erreur : modifications non enregistrées." : "Profil mis à jour.");
    if (!error) refresh();
  };

  const field = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-avenida-blue focus:ring-2 focus:ring-avenida-blue/15";

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-xl flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
      <UserRound aria-hidden className="size-10 text-vif" />
      <h1 className="font-display text-2xl font-extrabold text-avenida-blue">Mon profil</h1>
      <p className="text-sm text-slate-600">
        Compte : <strong>{user.email}</strong> · Rôle : <strong className="text-vif">{user.roleLabel}</strong>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue">
          Prénom
          <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} autoComplete="given-name" className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue">
          Nom
          <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} autoComplete="family-name" className={field} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue">
        Téléphone
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" autoComplete="tel" placeholder="+228 …" className={field} />
      </label>
      {saved && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 aria-hidden className="size-4" />
          {saved}
        </p>
      )}
      <button type="submit" className="h-12 rounded-full bg-vif font-bold text-white hover:bg-vif-fonce">
        Enregistrer
      </button>
    </form>
  );
}
