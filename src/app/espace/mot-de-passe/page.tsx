"use client";

import { CheckCircle2, KeyRound } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Choix d'un nouveau mot de passe (compte connecté ou lien « mot de passe oublié »). */
export default function PasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setMessage({ ok: false, text: "Le mot de passe doit comporter au moins 8 caractères." });
    if (password !== confirm) return setMessage({ ok: false, text: "Les deux mots de passe ne correspondent pas." });
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    setMessage(
      error
        ? { ok: false, text: "Impossible de modifier le mot de passe. Le lien a peut-être expiré : redemandez-en un depuis la page de connexion." }
        : { ok: true, text: "Mot de passe modifié avec succès." }
    );
    if (!error) {
      setPassword("");
      setConfirm("");
    }
  };

  const field = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-avenida-blue focus:ring-2 focus:ring-avenida-blue/15";

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-md flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
      <KeyRound aria-hidden className="size-10 text-avenida-red" />
      <h1 className="font-display text-2xl font-extrabold text-avenida-blue">Choisir un nouveau mot de passe</h1>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue">
        Nouveau mot de passe
        <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue">
        Confirmer le mot de passe
        <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
      </label>
      {message && (
        <p role="status" className={message.ok ? "flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800" : "rounded-xl bg-red-50 p-3 text-sm font-semibold text-avenida-red"}>
          {message.ok && <CheckCircle2 aria-hidden className="size-4" />}
          {message.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="h-12 rounded-full bg-avenida-red font-bold text-white hover:bg-avenida-red-700 disabled:opacity-60">
        {busy ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
