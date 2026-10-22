import { Plus } from "lucide-react";

/** Questions fréquentes en accordéon natif (<details>) : accessible et sans JavaScript. */
export function Faq({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <details key={item.q} className="site-faq site-glow-border group rounded-2xl border-l-4 border-vif bg-white shadow-sm ring-1 ring-slate-900/5 transition-shadow hover:shadow-lg open:shadow-xl" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-display text-lg font-bold text-avenida-blue-950 sm:p-6">
            <span className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-or text-sm font-extrabold text-avenida-blue-950">{i + 1}</span>
              {item.q}
            </span>
            <span className="site-faq-icon flex size-9 shrink-0 items-center justify-center rounded-full bg-vif text-white transition-transform duration-300">
              <Plus aria-hidden className="size-5" />
            </span>
          </summary>
          <p className="px-5 pb-6 leading-relaxed text-slate-600 sm:px-6">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
