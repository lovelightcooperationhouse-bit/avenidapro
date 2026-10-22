import { Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bandeau défilant (métiers, valeurs…). Immobile si « réduire les animations ». */
export function Marquee({ words, className }: { words: readonly string[]; className?: string }) {
  const loop = [...words, ...words];
  return (
    <div className={cn("overflow-hidden bg-vif py-4 text-white [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]", className)}>
      <p className="sr-only">{words.join(", ")}</p>
      <ul aria-hidden className="site-marquee flex w-max items-center gap-8 hover:[animation-play-state:paused]">
        {loop.map((w, i) => (
          <li key={i} className="flex items-center gap-8 font-display text-2xl font-extrabold tracking-wide uppercase sm:text-3xl">
            {w}
            <Sparkle className="size-5 fill-white text-white" />
          </li>
        ))}
      </ul>
    </div>
  );
}
