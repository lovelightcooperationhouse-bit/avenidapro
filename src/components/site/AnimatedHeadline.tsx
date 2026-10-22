"use client";

import { useEffect, useRef, useState } from "react";

/** Titre dont les mots apparaissent un à un quand il entre à l'écran. */
export function AnimatedHeadline({ text, className, id }: { text: string; className?: string; id?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setRun((r) => r + 1), { threshold: 0.4 });
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return (
    <h2 ref={ref} id={id} className={className}>
      {text.split(" ").map((w, i) => (
        <span key={`${run}-${i}`} className={run ? "site-letter" : "inline-block opacity-0"} style={{ animationDelay: `${i * 110}ms` }}>
          {w}&nbsp;
        </span>
      ))}
    </h2>
  );
}
