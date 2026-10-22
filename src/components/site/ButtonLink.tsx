import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  red: "relative overflow-hidden bg-vif text-white shadow-lg shadow-vif/30 hover:bg-vif-fonce hover:shadow-xl hover:shadow-vif/40",
  blue: "bg-avenida-blue text-white shadow-lg shadow-avenida-blue/25 hover:bg-avenida-blue-950",
  white: "bg-white text-avenida-blue-950 shadow-lg shadow-black/10 hover:bg-avenida-blue-50",
  gold: "bg-or text-avenida-blue-950 shadow-lg shadow-or/30 hover:bg-or-clair",
  outline: "border-2 border-avenida-blue/15 bg-white text-avenida-blue hover:border-avenida-blue hover:bg-avenida-blue-50",
  glass: "border border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white hover:text-avenida-blue-950",
  ghost: "text-white underline-offset-8 hover:underline",
} as const;

const sizes = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
  xl: "h-14 px-8 text-base",
} as const;

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

/** Lien présenté comme un bouton (CTA du site public). */
export function ButtonLink({ variant = "red", size = "lg", className, ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
