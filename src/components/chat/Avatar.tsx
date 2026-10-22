import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["bg-[#0C356A]", "bg-[#E30613]", "bg-emerald-600", "bg-amber-600", "bg-violet-600", "bg-sky-600", "bg-rose-600", "bg-teal-600"];

/** Photo de profil ronde, ou initiales colorées ; pastille verte si la personne est en ligne. */
export function Avatar({ name, src, group, online, size = "md" }: { name: string; src?: string | null; group?: boolean; online?: boolean; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "size-9 text-xs" : size === "lg" ? "size-20 text-2xl" : "size-12 text-sm";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const color = COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  return (
    <span className={cn("relative inline-flex shrink-0", dim)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- photo de profil (data URL ou stockage)
        <img src={src} alt="" className="size-full rounded-full object-cover" />
      ) : (
        <span className={cn("flex size-full items-center justify-center rounded-full font-bold text-white", color)}>{group ? <Users aria-hidden className="size-1/2" /> : initials || "?"}</span>
      )}
      {online && <span aria-label="En ligne" className="absolute right-0 bottom-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />}
    </span>
  );
}
