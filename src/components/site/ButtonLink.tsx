import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  red: "bg-avenida-red text-white shadow-lg shadow-avenida-red/25 hover:bg-avenida-red-700",
  blue: "bg-avenida-blue text-white shadow-lg shadow-avenida-blue/20 hover:bg-avenida-blue-950",
  white: "bg-white text-avenida-blue hover:bg-avenida-blue-50",
  outline: "border-2 border-avenida-blue/15 bg-white text-avenida-blue hover:border-avenida-blue hover:bg-avenida-blue-50",
  ghost: "text-white underline-offset-8 hover:underline",
} as const;

const sizes = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
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
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-all duration-200 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
