import { siteConfig, type SocialNetwork } from "@/content/site";
import { cn } from "@/lib/utils";

/** Logos des réseaux (lucide-react ne fournit pas les logos de marques). */
const icons: Record<SocialNetwork, { label: string; path: string }> = {
  facebook: {
    label: "Facebook",
    path: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z",
  },
  instagram: {
    label: "Instagram",
    path: "M12 2.2c3.2 0 3.58 0 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.2 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85C2.42 3.92 3.94 2.37 7.15 2.27 8.42 2.2 8.8 2.2 12 2.2Zm0 4.86a4.94 4.94 0 1 0 0 9.88 4.94 4.94 0 0 0 0-9.88Zm0 8.15a3.21 3.21 0 1 1 0-6.42 3.21 3.21 0 0 1 0 6.42Zm5.14-9.5a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Z",
  },
  tiktok: {
    label: "TikTok",
    path: "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.4-2.47V9.67a5.73 5.73 0 0 0-.8-.06 5.69 5.69 0 0 0-5.69 5.7A5.69 5.69 0 0 0 9.86 21a5.69 5.69 0 0 0 5.69-5.69V9.01a7.34 7.34 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.25-1.48Z",
  },
  youtube: {
    label: "YouTube",
    path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z",
  },
  linkedin: {
    label: "LinkedIn",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z",
  },
  whatsapp: {
    label: "WhatsApp",
    path: "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35ZM12.05 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.9.99 6.69 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.46 9.46Zm8.05-17.5A11.32 11.32 0 0 0 12.05.67C5.78.67.68 5.77.67 12.04c0 2 .52 3.96 1.52 5.69L.57 23.33l5.73-1.5a11.33 11.33 0 0 0 5.74 1.47h.01c6.26 0 11.36-5.1 11.37-11.37 0-3.04-1.18-5.89-3.32-8.04Z",
  },
};

/** Icônes des réseaux sociaux renseignés dans siteConfig.socials (les autres sont masqués). */
export function SocialLinks({ className, itemClassName, size = "md" }: { className?: string; itemClassName?: string; size?: "sm" | "md" }) {
  const entries = (Object.keys(icons) as SocialNetwork[]).filter((k) => siteConfig.socials[k]);
  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {entries.map((k) => (
        <li key={k}>
          <a
            href={siteConfig.socials[k]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${icons[k].label} de l'Hôtel École Avenida (nouvel onglet)`}
            className={cn(
              "flex items-center justify-center rounded-full transition-all duration-300 hover:-translate-y-0.5",
              size === "sm" ? "size-8" : "size-11",
              itemClassName
            )}
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={size === "sm" ? "size-3.5" : "size-[1.15rem]"}>
              <path d={icons[k].path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
