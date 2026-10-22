"use client";

import { GraduationCap, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./ButtonLink";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";
import { Container } from "./Section";
import { SiteLogo } from "./SiteLogo";

/**
 * Header collant : translucide en haut de page, opaque avec une ombre
 * dès que l'on fait défiler. Menu horizontal dès 1024 px, burger en dessous.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Le gabarit racine (body en h-full) fait défiler <body> plutôt que la fenêtre : on écoute les deux.
    const onScroll = () => setScrolled(Math.max(window.scrollY, document.body.scrollTop) > 8);
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300",
        scrolled ? "border-slate-200 bg-white shadow-[0_8px_24px_-12px_rgb(12_53_106/0.25)]" : "border-transparent bg-white/85 backdrop-blur-md"
      )}
    >
      <Container className="flex h-[4.5rem] items-center justify-between gap-3 lg:h-20 xl:h-[5.5rem]">
        <SiteLogo />

        <DesktopNav />

        <div className="flex shrink-0 items-center gap-2">
          <ButtonLink
            href="/connexion"
            variant="outline"
            size="md"
            title="Espace de gestion (personnel)"
            className="hidden md:inline-flex lg:px-3 2xl:px-4"
          >
            <LayoutDashboard aria-hidden />
            <span className="lg:sr-only 2xl:not-sr-only">Espace de gestion</span>
          </ButtonLink>
          <ButtonLink href="/admissions" size="md" className="hidden sm:inline-flex xl:h-11 xl:px-5">
            <GraduationCap aria-hidden />
            S&apos;inscrire
          </ButtonLink>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
