"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { contactTopics, siteConfig, whatsappUrl } from "@/content/site";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-avenida-blue focus:ring-2 focus:ring-avenida-blue/15";

/**
 * Formulaire de contact. En attendant un envoi côté serveur, le message est
 * transmis par WhatsApp ou par e-mail (application du visiteur).
 */
export function ContactForm() {
  const [topic, setTopic] = useState<string>(contactTopics[0].value);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const compose = () => `Objet : ${topic}\nNom : ${name}\nTéléphone : ${phone}\n\n${message}`;

  const send = (channel: "whatsapp" | "email") => {
    if (!name.trim() || !message.trim()) {
      setError("Merci d'indiquer votre nom et votre message.");
      return;
    }
    setError("");
    if (channel === "whatsapp") {
      window.open(whatsappUrl(siteConfig.whatsapp, compose()), "_blank", "noopener,noreferrer");
    } else {
      window.location.href = `mailto:${siteConfig.email}?subject=${encodeURIComponent(`[Site] ${topic}`)}&body=${encodeURIComponent(compose())}`;
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send("whatsapp");
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <fieldset>
        <legend className="mb-3 text-sm font-bold text-avenida-blue">Votre demande concerne</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {contactTopics.map((t) => (
            <label
              key={t.value}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center text-xs font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-avenida-blue",
                topic === t.value ? "border-avenida-red bg-red-50 text-avenida-red" : "border-slate-200 text-slate-600 hover:border-avenida-blue/40"
              )}
            >
              <input type="radio" name="topic" value={t.value} checked={topic === t.value} onChange={() => setTopic(t.value)} className="sr-only" />
              <t.icon aria-hidden className="size-5" />
              {t.value}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue">
          Nom et prénom *
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue">
          Téléphone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="+228 …" className={fieldClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue">
        Message *
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} required className={cn(fieldClass, "resize-y")} />
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-avenida-red">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 font-bold text-white transition-colors hover:bg-[#1da851]">
          <MessageCircle aria-hidden className="size-4" />
          Envoyer par WhatsApp
        </button>
        <button
          type="button"
          onClick={() => send("email")}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-avenida-blue px-6 font-bold text-white transition-colors hover:bg-avenida-blue-950"
        >
          <Mail aria-hidden className="size-4" />
          Envoyer par e-mail
        </button>
      </div>
    </form>
  );
}
