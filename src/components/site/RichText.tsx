import { Fragment } from "react";
import { cn } from "@/lib/utils";

/** Rend les liens d'une ligne cliquables (le texte reste échappé par React). */
function linkify(line: string) {
  const parts = line.split(/(https?:\/\/[^\s)]+)/g);
  return parts.map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="font-semibold text-vif underline underline-offset-2 break-all">
        {p}
      </a>
    ) : (
      <Fragment key={i}>{p.split(/(\*\*[^*]+\*\*)/g).map((t, j) => (t.startsWith("**") && t.endsWith("**") ? <strong key={j}>{t.slice(2, -2)}</strong> : t))}</Fragment>
    )
  );
}

/**
 * Texte saisi dans l'administration : paragraphes séparés par une ligne vide,
 * « ## » pour un intertitre, « - » pour une liste, **gras** et liens automatiques.
 */
export function RichText({ text, className, inverted }: { text: string | null | undefined; className?: string; inverted?: boolean }) {
  if (!text) return null;
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className={cn("flex flex-col gap-4 leading-relaxed", inverted ? "text-white/85" : "text-slate-700", className)}>
      {blocks.map((b, i) => {
        const lines = b.split("\n").filter((l) => l.trim());
        if (!lines.length) return null;
        if (lines[0].startsWith("## "))
          return (
            <Fragment key={i}>
              <h3 className={cn("font-display text-xl font-extrabold", inverted ? "text-white" : "text-avenida-blue-950")}>{lines[0].slice(3)}</h3>
              {lines.length > 1 && <p>{lines.slice(1).map((l, j) => <Fragment key={j}>{j > 0 && <br />}{linkify(l)}</Fragment>)}</p>}
            </Fragment>
          );
        if (lines.every((l) => /^[-•]\s/.test(l)))
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{linkify(l.replace(/^[-•]\s/, ""))}</li>
              ))}
            </ul>
          );
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {linkify(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
