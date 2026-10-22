"use client";

import { ArrowRight, CheckCircle2, ListChecks, Loader2, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { contactTopics, siteConfig, whatsappUrl, type ContactTopic } from "@/content/site";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-avenida-blue focus:ring-2 focus:ring-avenida-blue/15";

/**
 * Formulaire de contact adapté à chaque demande : le sujet choisi affiche les informations
 * utiles à préciser. La demande est enregistrée pour l'administration (espace de gestion),
 * avec un envoi WhatsApp possible en parallèle.
 */
export function ContactForm() {
  const params = useSearchParams();
  const [topic, setTopic] = useState<ContactTopic>("inscription");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const t = params.get("sujet") as ContactTopic | null;
    if (t && contactTopics.some((c) => c.value === t)) setTopic(t);
  }, [params]);

  const current = contactTopics.find((t) => t.value === topic)!;
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const compose = () => `Objet : ${current.label}\nNom : ${form.full_name}\nTéléphone : ${form.phone}\n\n${form.message}`;

  const validate = () => {
    if (form.full_name.trim().length < 2) return "Indiquez votre nom.";
    if (!form.phone.trim() && !form.email.trim()) return "Indiquez un téléphone ou un e-mail pour vous répondre.";
    if (form.message.trim().length < 2) return "Écrivez votre message.";
    return "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    const err = validate();
    setError(err);
    if (err) return;
    setSending(true);
    const { error: dbError } = await createClient()
      .from("contact_requests")
      .insert({ topic, full_name: form.full_name.trim(), phone: form.phone.trim() || null, email: form.email.trim() || null, message: form.message.trim() });
    setSending(false);
    if (dbError) return setError("L'envoi a échoué. Réessayez ou écrivez-nous par WhatsApp.");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 aria-hidden className="size-16 text-emerald-500" />
        <p className="font-display text-2xl font-extrabold text-avenida-blue-950">Message envoyé !</p>
        <p className="max-w-md text-slate-600">Merci {form.full_name.split(" ")[0]}. Notre équipe vous répond au plus vite, {siteConfig.officeHours.toLowerCase()}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      <input type="text" name="site_web" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <fieldset>
        <legend className="mb-3 text-sm font-bold text-avenida-blue-950">Votre demande concerne</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {contactTopics.map((t) => (
            <label
              key={t.value}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center text-xs font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-avenida-blue",
                topic === t.value ? "border-vif bg-red-50 text-vif" : "border-slate-200 text-slate-600 hover:border-avenida-blue/40"
              )}
            >
              <input type="radio" name="topic" value={t.value} checked={topic === t.value} onChange={() => setTopic(t.value)} className="sr-only" />
              <t.icon aria-hidden className="size-5" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Aide propre à chaque demande */}
      <div className="flex flex-col gap-3 rounded-2xl bg-avenida-blue-50 p-5 text-sm">
        <p className="font-semibold text-avenida-blue-950">{current.hint}</p>
        {current.checklist.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold tracking-widest text-vif uppercase">
              <ListChecks aria-hidden className="size-4" />
              À préciser dans votre message
            </p>
            <ul className="grid gap-1 sm:grid-cols-2">
              {current.checklist.map((c) => (
                <li key={c} className="text-slate-700">
                  • {c}
                </li>
              ))}
            </ul>
          </div>
        )}
        {current.cta && (
          <Link href={current.cta.href} className="inline-flex w-fit items-center gap-1.5 font-bold text-vif hover:underline">
            {current.cta.label}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
          Nom et prénom <span className="sr-only">(obligatoire)</span>
          <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} autoComplete="name" required className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
          Téléphone
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} type="tel" autoComplete="tel" placeholder="+228 …" className={field} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
        E-mail
        <input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" autoComplete="email" className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
        Message
        <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={5} maxLength={3000} required className={cn(field, "resize-y")} />
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-vif">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={sending} className="site-shine relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full bg-vif px-6 font-bold text-white shadow-lg shadow-vif/30 transition-colors hover:bg-vif-fonce disabled:opacity-70">
          {sending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
          Envoyer
        </button>
        <a
          href={whatsappUrl(siteConfig.whatsapp, compose())}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 font-bold text-white transition-colors hover:bg-[#1da851]"
        >
          <MessageCircle aria-hidden className="size-4" />
          Par WhatsApp
          <span className="sr-only">(nouvel onglet)</span>
        </a>
      </div>
    </form>
  );
}
