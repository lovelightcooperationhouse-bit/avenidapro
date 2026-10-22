"use client";

import { ArrowUp, Bot, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { faq, formations, fees, requiredDocuments, siteConfig, whatsappUrl } from "@/content/site";
import { cn, formatFCFA } from "@/lib/utils";

type Msg = { from: "bot" | "me"; text: string; links?: { label: string; href: string }[] };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Réponses de l'assistant : mots-clés → réponse issue du contenu officiel du site. */
const INTENTS: { keys: string[]; answer: () => Msg }[] = [
  {
    keys: ["inscri", "preinscri", "dossier", "candidat"],
    answer: () => ({ from: "bot", text: "La pré-inscription se fait en ligne en 5 minutes : formulaire, puis pièces à joindre. L'école vous recontacte ensuite.", links: [{ label: "Pré-inscription en ligne", href: "/preinscription" }] }),
  },
  {
    keys: ["piece", "document", "fournir", "papier"],
    answer: () => ({ from: "bot", text: "Pièces à fournir : " + requiredDocuments.map((d) => d.label.toLowerCase()).join(", ") + ".", links: [{ label: "Détail des pièces", href: "/admissions#dossier" }] }),
  },
  {
    keys: ["prix", "frais", "cout", "combien", "tarif", "scolarite", "payer", "paiement", "tranche"],
    answer: () => ({
      from: "bot",
      text:
        "Frais annuels : " +
        formations.map((f) => `${f.code} ${formatFCFA(f.registration + f.tuition + (f.code === "CFA" ? fees.suppliesCfa : fees.suppliesDiploma))}`).join(" · ") +
        ". Paiement en 8 tranches mensuelles ou 3 trimestrielles.",
      links: [{ label: "Frais et paiement", href: "/admissions#tarifs" }],
    }),
  },
  {
    keys: ["formation", "filiere", "cap", "bep", "bts", "cfa", "diplome", "cuisine", "patisserie", "reception"],
    answer: () => ({ from: "bot", text: "Formations : " + formations.map((f) => `${f.code} (${f.duration})`).join(", ") + " en cuisine, pâtisserie, restaurant, réception et hébergement.", links: [{ label: "Nos formations", href: "/ecole#formations" }] }),
  },
  {
    keys: ["chambre", "reserv", "hotel", "sejour", "nuit"],
    answer: () => ({ from: "bot", text: "Pour séjourner à l'Hôtel Avenida, envoyez une demande de réservation : la réception vous répond rapidement.", links: [{ label: "Réserver une chambre", href: "/hotel#reserver" }] }),
  },
  {
    keys: ["adresse", "ou", "trouver", "situe", "localis", "plan"],
    answer: () => ({ from: "bot", text: `Nous sommes au ${siteConfig.address.street}, ${siteConfig.address.district}, ${siteConfig.address.city}.`, links: [{ label: "Itinéraire", href: siteConfig.mapsUrl }] }),
  },
  {
    keys: ["horaire", "heure", "ouvert", "bureau"],
    answer: () => ({ from: "bot", text: `Le bureau vous reçoit ${siteConfig.officeHours.toLowerCase()}. Téléphone : ${siteConfig.phones[0].display}.` }),
  },
  {
    keys: ["compte", "connexion", "espace", "mot de passe", "connecter"],
    answer: () => ({ from: "bot", text: "Élèves, parents, professeurs et personnel se connectent à leur espace, avec leur e-mail ou leur compte Google.", links: [{ label: "Mon espace", href: "/connexion" }] }),
  },
];

function reply(question: string): Msg {
  const q = norm(question);
  const fromFaq = faq.find((f) => norm(f.q).split(/\W+/).filter((w) => w.length > 4).some((w) => q.includes(w)));
  const intent = INTENTS.find((i) => i.keys.some((k) => q.includes(k)));
  if (intent) return intent.answer();
  if (fromFaq) return { from: "bot", text: fromFaq.a };
  return {
    from: "bot",
    text: "Je n'ai pas trouvé de réponse précise. Un conseiller peut vous répondre directement sur WhatsApp ou par téléphone.",
    links: [
      { label: "Écrire sur WhatsApp", href: whatsappUrl(siteConfig.whatsapp, `Bonjour, j'ai une question : ${question}`) },
      { label: "Formulaire de contact", href: "/contact" },
    ],
  };
}

const SUGGESTIONS = ["Comment s'inscrire ?", "Combien coûte la scolarité ?", "Quelles formations ?", "Existe-t-il des cours du soir ?", "Réserver une chambre", "Où êtes-vous ?"];

/** Boutons flottants : assistant, WhatsApp (petite icône) et retour en haut. */
export function SupportDock() {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(false);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: "Bonjour 👋 Je suis l'assistant Avenida. Posez votre question ou choisissez un sujet." }]);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs.length, open]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { from: "me", text: q.trim() }, reply(q)]);
    setText("");
  };

  return (
    <div className="fixed right-3 bottom-3 z-40 flex flex-col items-end gap-2.5 sm:right-5 sm:bottom-5" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      {open && (
        <div role="dialog" aria-label="Assistant Avenida" className="site-pop flex h-[min(32rem,75dvh)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
          <header className="flex items-center gap-3 bg-avenida-blue-950 px-4 py-3 text-white">
            <span className="flex size-9 items-center justify-center rounded-full bg-or text-avenida-blue-950">
              <Bot aria-hidden className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold">Assistant Avenida</span>
              <span className="block text-[11px] text-white/70">Réponses immédiates · conseiller sur WhatsApp</span>
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer l'assistant" className="rounded-full p-1.5 hover:bg-white/10">
              <X aria-hidden className="size-5" />
            </button>
          </header>
          <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
            {msgs.map((m, i) => (
              <div key={i} className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.from === "me" ? "ml-auto rounded-br-sm bg-avenida-blue text-white" : "rounded-bl-sm bg-white text-slate-800 shadow-sm")}>
                {m.text}
                {m.links && (
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {m.links.map((l) => (
                      <Link key={l.href} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} className="rounded-full bg-vif px-3 py-1 text-xs font-bold text-white hover:bg-vif-fonce">
                        {l.label}
                      </Link>
                    ))}
                  </span>
                )}
              </div>
            ))}
            {msgs.length <= 2 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((q) => (
                  <button key={q} type="button" onClick={() => ask(q)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-avenida-blue ring-1 ring-avenida-blue/20 hover:bg-avenida-blue-50">
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={end} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(text);
            }}
            className="flex gap-2 border-t border-slate-100 p-2"
          >
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre question…" aria-label="Votre question" className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-avenida-blue/20" />
            <button type="submit" aria-label="Envoyer" className="flex size-10 items-center justify-center rounded-full bg-vif text-white">
              <Send aria-hidden className="size-4" />
            </button>
          </form>
        </div>
      )}

      {top && (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Revenir en haut de la page" className="site-pop flex size-11 items-center justify-center rounded-full bg-white text-avenida-blue shadow-lg ring-1 ring-slate-900/10 hover:bg-avenida-blue-50">
          <ArrowUp aria-hidden className="size-5" />
        </button>
      )}
      <a
        href={whatsappUrl(siteConfig.whatsapp, "Bonjour, je souhaite des informations sur l'Hôtel École Avenida.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Nous écrire sur WhatsApp (nouvel onglet)"
        title="WhatsApp"
        className="site-bob flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-white"
      >
        <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-6">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35ZM12.05 21.5a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.9.99 6.69 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.46 9.46Zm8.05-17.5A11.32 11.32 0 0 0 12.05.67C5.78.67.68 5.77.67 12.04c0 2 .52 3.96 1.52 5.69L.57 23.33l5.73-1.5a11.33 11.33 0 0 0 5.74 1.47c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.89-3.32-8.04Z" />
        </svg>
      </a>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}
        aria-expanded={open}
        className="flex size-14 items-center justify-center rounded-full bg-avenida-blue-950 text-white shadow-xl ring-4 ring-or/60 transition-transform hover:scale-105"
      >
        {open ? <X aria-hidden className="size-6" /> : <Bot aria-hidden className="site-wiggle size-7" />}
      </button>
    </div>
  );
}
