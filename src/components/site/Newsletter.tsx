"use client";

import { BellRing, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Container } from "./Section";

const TOPICS = ["Rentrées et inscriptions", "Actualités de l'école", "Offres de l'hôtel", "Événements"];

/** Lettre d'information : les visiteurs laissent leur e-mail pour recevoir annonces et nouveautés. */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [topics, setTopics] = useState<string[]>([TOPICS[0], TOPICS[1]]);
  const [state, setState] = useState<"idle" | "busy" | "ok" | "deja" | "erreur">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setState("erreur");
    setState("busy");
    const { error } = await createClient()
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase(), full_name: name.trim() || null, interests: topics });
    setState(!error ? "ok" : error.code === "23505" ? "deja" : "erreur");
  };

  return (
    <section aria-labelledby="newsletter-title" className="relative isolate overflow-hidden bg-avenida-blue-950 text-white">
      <div aria-hidden className="site-gradient-pan absolute inset-0 -z-10 bg-[linear-gradient(120deg,#06152E,#0C356A,#06152E,#3a0610)] opacity-90" />
      <div aria-hidden className="bg-avenida-pattern absolute inset-0 -z-10 opacity-[0.06]" />
      <Container className="grid items-center gap-8 py-14 lg:grid-cols-[1fr_1.2fr] lg:py-16">
        <div className="flex flex-col gap-3">
          <span className="site-bob flex size-14 items-center justify-center rounded-2xl bg-or text-avenida-blue-950 shadow-lg">
            <BellRing aria-hidden className="size-7" />
          </span>
          <h2 id="newsletter-title" className="font-display text-3xl font-extrabold sm:text-4xl">
            Restez informé(e)
          </h2>
          <p className="max-w-md text-white/80">Rentrées, inscriptions, actualités de l&apos;école et offres de l&apos;hôtel : recevez nos annonces par e-mail. Désinscription possible à tout moment.</p>
        </div>

        {state === "ok" || state === "deja" ? (
          <p role="status" className="site-pop flex items-center gap-3 rounded-3xl bg-white/10 p-6 text-lg font-bold ring-1 ring-white/20">
            <CheckCircle2 aria-hidden className="size-7 shrink-0 text-or" />
            {state === "ok" ? "Merci ! Vous êtes inscrit(e) à notre lettre d'information." : "Cette adresse est déjà inscrite. Merci de votre fidélité !"}
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3 rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur sm:p-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom (facultatif)" aria-label="Prénom" autoComplete="given-name" className="h-12 rounded-full bg-white px-5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-or/50" />
              <span className="relative">
                <Mail aria-hidden className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse e-mail"
                  aria-label="Adresse e-mail"
                  autoComplete="email"
                  className="h-12 w-full rounded-full bg-white pr-5 pl-11 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-or/50"
                />
              </span>
            </div>
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">Sujets</legend>
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={topics.includes(t)}
                  onClick={() => setTopics(topics.includes(t) ? topics.filter((x) => x !== t) : [...topics, t])}
                  className={cn("rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition-colors", topics.includes(t) ? "bg-or text-avenida-blue-950 ring-or" : "text-white/80 ring-white/30 hover:ring-white")}
                >
                  {t}
                </button>
              ))}
            </fieldset>
            {state === "erreur" && <p className="text-sm font-semibold text-or-clair">Adresse e-mail invalide ou envoi impossible. Réessayez.</p>}
            <button type="submit" disabled={state === "busy"} className="site-shine relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-vif px-6 font-bold text-white hover:bg-vif-fonce disabled:opacity-70 sm:self-start">
              {state === "busy" ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <BellRing aria-hidden className="size-5" />}
              Je m&apos;abonne
            </button>
          </form>
        )}
      </Container>
    </section>
  );
}
