"use client";

import { Download, Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const KEY = "avenida-installation-masquee";

/**
 * Samsung Internet installe l'application sous forme d'APK qu'il fabrique lui-même, ciblant une ancienne version
 * d'Android : Google Play Protect la bloque (« Appli non sécurisée bloquée »). Sur Android, l'installation se fait
 * donc depuis Google Chrome, dont l'application est signée par Google et acceptée sur toutes les versions.
 */
export const isSamsungInternet = () => typeof navigator !== "undefined" && /SamsungBrowser/i.test(navigator.userAgent);

/** Rouvre la page actuelle dans Google Chrome (Android). */
export function openInChrome() {
  const { host, pathname, search } = window.location;
  // Chrome absent : page de Chrome sur le Play Store
  const fallback = encodeURIComponent("https://play.google.com/store/apps/details?id=com.android.chrome");
  window.location.href = `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
}

/** Ouvre la fenêtre d'installation (Android, ordinateur) ; renvoie false si le navigateur ne la propose pas. */
export async function promptInstall() {
  if (isSamsungInternet()) {
    openInChrome();
    return true;
  }
  const e = (window as unknown as { __avenidaInstall?: InstallEvent }).__avenidaInstall;
  if (!e) return false;
  await e.prompt();
  return true;
}

/**
 * Application installable : enregistre le service worker et propose l'installation
 * (bouton natif sur Android / Chrome / Edge, mode d'emploi « Sur l'écran d'accueil » sur iPhone et iPad).
 */
export function PwaSupport() {
  const [mode, setMode] = useState<null | "natif" | "ios" | "samsung">(null);
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    let hidden = false;
    try {
      hidden = Number(localStorage.getItem(KEY) ?? 0) > Date.now();
    } catch {
      /* stockage indisponible */
    }
    if (standalone) return;

    // Samsung Internet : on propose d'installer depuis Chrome plutôt que l'APK bloqué par Play Protect
    if (isSamsungInternet()) {
      const t = !hidden ? window.setTimeout(() => setMode("samsung"), 3000) : undefined;
      const block = (e: Event) => e.preventDefault();
      window.addEventListener("beforeinstallprompt", block);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", block);
      };
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      (window as unknown as { __avenidaInstall?: InstallEvent }).__avenidaInstall = e as InstallEvent;
      window.dispatchEvent(new Event("avenida-installable"));
      setEvent(e as InstallEvent);
      if (!hidden) setMode("natif");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => setMode(null);
    window.addEventListener("appinstalled", onInstalled);

    // iPhone / iPad (Safari) : pas d'invite automatique, on explique la marche à suivre
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const timer = ios && !hidden ? window.setTimeout(() => setMode("ios"), 4000) : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setMode(null);
    try {
      localStorage.setItem(KEY, String(Date.now() + 7 * 86_400_000));
    } catch {
      /* stockage indisponible */
    }
  };

  if (!mode) return null;

  return (
    <div role="dialog" aria-label="Installer l'application" className="fixed inset-x-3 bottom-3 z-[90] mx-auto flex max-w-md items-start gap-3 rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-900/10" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- icône de l'application */}
      <img src="/icons/icon-192.png" alt="" className="size-12 rounded-xl ring-1 ring-slate-200" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold text-[#0C356A]">Installer l&apos;application Avenida</p>
        {mode === "samsung" ? (
          <>
            <p className="mt-0.5 text-slate-600">
              Pour une installation sûre, acceptée sur tous les téléphones Android, installez l&apos;application depuis <strong>Google Chrome</strong>.
              N&apos;utilisez pas l&apos;icône d&apos;installation de Samsung Internet : Google la bloque.
            </p>
            <button type="button" onClick={openInChrome} className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#E30613] px-4 py-2 font-bold text-white">
              <Download aria-hidden className="size-4" /> Ouvrir dans Chrome pour installer
            </button>
            <p className="mt-1.5 text-xs text-slate-500">Puis, dans Chrome, touchez les 3 points en haut à droite → « Installer l&apos;application ».</p>
          </>
        ) : mode === "natif" ? (
          <p className="mt-0.5 text-slate-600">Accès direct depuis l&apos;écran d&apos;accueil, en plein écran, avec les appels et discussions.</p>
        ) : (
          <p className="mt-0.5 text-slate-600">
            Touchez <Share aria-label="Partager" className="inline size-4 align-text-bottom text-sky-600" /> puis <strong>« Sur l&apos;écran d&apos;accueil »</strong>{" "}
            <SquarePlus aria-hidden className="inline size-4 align-text-bottom" />.
          </p>
        )}
        {mode === "natif" && event && (
          <button
            type="button"
            onClick={async () => {
              await event.prompt();
              setMode(null);
            }}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#E30613] px-4 py-2 font-bold text-white"
          >
            <Download aria-hidden className="size-4" /> Installer
          </button>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label="Plus tard" className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
