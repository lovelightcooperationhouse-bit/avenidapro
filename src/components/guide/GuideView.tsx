"use client";

import { ArrowRight, ChevronDown, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { promptInstall, isSamsungInternet } from "@/components/pwa/PwaSupport";
import type { Guide } from "@/content/guides";
import { cn } from "@/lib/utils";

/** Guide dépliable : étapes numérotées avec lien direct vers la page concernée. */
export function GuideCard({ guide, open: initial = false }: { guide: Guide; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-5 text-left">
        <span>
          <span className="block font-display text-lg font-extrabold text-avenida-blue">{guide.title}</span>
          <span className="text-sm text-slate-600">{guide.intro}</span>
        </span>
        <ChevronDown aria-hidden className={cn("size-5 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ol className="flex flex-col gap-3 border-t border-slate-100 p-5">
          {guide.steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-vif text-xs font-bold text-white">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800">{s.title}</p>
                <p className="text-sm leading-relaxed text-slate-600">{s.text}</p>
                {s.href && (
                  <Link href={s.href} className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-vif hover:underline">
                    {s.cta ?? "Ouvrir"} <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Bouton « Installer l'application » (si le navigateur le permet). */
export function InstallButton() {
  const [can, setCan] = useState(false);
  useEffect(() => {
    // Samsung Internet : installation proposée via Chrome (voir PwaSupport)
    const check = () => setCan(isSamsungInternet() || !!(window as unknown as { __avenidaInstall?: unknown }).__avenidaInstall);
    check();
    window.addEventListener("avenida-installable", check);
    return () => window.removeEventListener("avenida-installable", check);
  }, []);
  if (!can) return null;
  return (
    <button type="button" onClick={() => promptInstall()} className="inline-flex items-center gap-2 rounded-full bg-vif px-5 py-2.5 text-sm font-bold text-white hover:bg-vif-fonce">
      <Download aria-hidden className="size-4" /> {isSamsungInternet() ? "Installer l'application (via Chrome)" : "Installer l'application"}
    </button>
  );
}
