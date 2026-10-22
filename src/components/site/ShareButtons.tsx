"use client";

import { Check, Link2, Mail, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NETWORKS = [
  { key: "facebook", label: "Facebook", color: "bg-[#1877F2]", url: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${u}`, path: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" },
  { key: "whatsapp", label: "WhatsApp", color: "bg-[#25D366]", url: (u: string, t: string) => `https://wa.me/?text=${t}%20${u}`, path: "M12.05 21.5a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.9.99 6.69 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.46 9.46Zm5.42-7.12c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49 2.48 1.07 3 .86 3.56.8.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" },
  { key: "x", label: "X (Twitter)", color: "bg-black", url: (u: string, t: string) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`, path: "M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.36 5.77L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43Z" },
  { key: "linkedin", label: "LinkedIn", color: "bg-[#0A66C2]", url: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" },
  { key: "telegram", label: "Telegram", color: "bg-[#229ED9]", url: (u: string, t: string) => `https://t.me/share/url?url=${u}&text=${t}`, path: "M21.94 4.3 18.7 19.6c-.24 1.08-.88 1.35-1.79.84l-4.94-3.64-2.38 2.29c-.26.26-.49.49-1 .49l.36-5.02 9.13-8.25c.4-.35-.09-.55-.62-.2L6.17 13.2l-4.86-1.52c-1.06-.33-1.08-1.06.22-1.57l18.98-7.32c.88-.32 1.65.21 1.43 1.51Z" },
];

/** Boutons de partage d'une publication sur les réseaux sociaux, par e-mail ou par lien. */
export function ShareButtons({ title, path, className }: { title: string; path: string; className?: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setUrl(window.location.origin + path);
    setCanShare(typeof navigator.share === "function");
  }, [path]);

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="mr-1 text-sm font-bold text-slate-600">Partager :</span>
      {NETWORKS.map((n) => (
        <a key={n.key} href={n.url(u, t)} target="_blank" rel="noopener noreferrer" aria-label={`Partager sur ${n.label}`} className={cn("flex size-10 items-center justify-center rounded-full text-white transition-transform hover:-translate-y-0.5", n.color)}>
          <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-4">
            <path d={n.path} />
          </svg>
        </a>
      ))}
      <a href={`mailto:?subject=${t}&body=${u}`} aria-label="Partager par e-mail" className="flex size-10 items-center justify-center rounded-full bg-slate-700 text-white hover:-translate-y-0.5">
        <Mail aria-hidden className="size-4" />
      </a>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
        aria-label="Copier le lien"
        className="flex h-10 items-center gap-1.5 rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-700 hover:bg-slate-200"
      >
        {copied ? <Check aria-hidden className="size-4 text-emerald-600" /> : <Link2 aria-hidden className="size-4" />}
        {copied ? "Lien copié" : "Copier le lien"}
      </button>
      {canShare && (
        <button type="button" onClick={() => navigator.share({ title, url }).catch(() => {})} aria-label="Autres applications" className="flex size-10 items-center justify-center rounded-full bg-vif text-white">
          <Share2 aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}
