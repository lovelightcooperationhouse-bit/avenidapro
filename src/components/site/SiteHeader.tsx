"use client";

import { ClipboardList, UserRound } from "lucide-react";
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
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300",
        scrolled ? "border-slate-200 bg-white shadow-[0_10px_30px_-15px_rgb(6_21_46/0.35)]" : "border-transparent bg-white/90 backdrop-blur-md"
      )}
    >
      <Container className="flex h-[4.5rem] items-center justify-between gap-3 lg:h-20 lg:px-4 xl:h-[5.5rem] xl:px-8">
        <SiteLogo compact />

        <DesktopNav />

        <div className="flex shrink-0 items-center gap-2">
          <ButtonLink href="/connexion" variant="outline" size="md" title="Mon espace (élèves, parents, professeurs, personnel)" aria-label="Mon espace" className="hidden px-3 md:inline-flex lg:hidden 2xl:inline-flex">
            <UserRound aria-hidden />
            Mon espace
          </ButtonLink>
          <ButtonLink href="/preinscription" size="md" className="h-10 px-3 text-xs sm:px-4 sm:text-sm xl:h-11 xl:px-5">
            <ClipboardList aria-hidden />
            Pré-inscription
          </ButtonLink>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
