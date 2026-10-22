import { Plus } from "lucide-react";

/** Questions fréquentes en accordéon natif (<details>) : accessible et sans JavaScript. */
export function Faq({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <details key={item.q} className="site-faq group rounded-2xl border border-slate-200 bg-white open:border-avenida-blue" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-display text-lg font-bold text-avenida-blue-950 transition-colors hover:text-vif sm:p-6">
            {item.q}
            <span className="site-faq-icon flex size-9 shrink-0 items-center justify-center rounded-full bg-avenida-blue text-white transition-transform duration-300">
              <Plus aria-hidden className="size-5" />
            </span>
          </summary>
          <p className="px-5 pb-6 leading-relaxed text-slate-700 sm:px-6">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
