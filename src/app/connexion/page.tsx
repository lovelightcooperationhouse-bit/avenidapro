"use client";

import { AlertCircle, ArrowLeft, ArrowRight, Briefcase, CheckCircle2, Eye, EyeOff, GraduationCap, KeyRound, Loader2, LogIn, UserPlus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SiteLogo } from "@/components/site/SiteLogo";
import { useAuth } from "@/context/AuthContext";
import { images, siteConfig } from "@/content/site";
import { cn } from "@/lib/utils";

type Mode = "login" | "register" | "reset";

const GOOGLE_ERRORS: Record<string, string> = {
  annule: "Connexion Google annulée.",
  google: "La connexion avec Google a échoué. Réessayez ou utilisez votre e-mail.",
  compte: "Ce compte est désactivé. Contactez l'administration.",
};

/** Logo officiel « G » de Google (couleurs imposées par Google). */
function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-avenida-blue focus:ring-2 focus:ring-avenida-blue/15";

const audiences = [
  { icon: GraduationCap, title: "Élèves", text: "Notes, absences, paiements" },
  { icon: Users, title: "Parents", text: "Suivi de vos enfants" },
  { icon: Briefcase, title: "Professeurs & personnel", text: "Classes et gestion" },
];

function ConnexionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, register, loginWithGoogle, requestPasswordReset, logout, user } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(() => GOOGLE_ERRORS[params.get("erreur") ?? ""] ?? "");
  const [googleBusy, setGoogleBusy] = useState(false);
  const [success, setSuccess] = useState("");

  const after = params.get("suite");
  const go = (home: string) => router.push(after && after.startsWith(home) ? after : home);

  const google = async () => {
    setError("");
    setGoogleBusy(true);
    const res = await loginWithGoogle(after);
    if (!res.success) {
      setGoogleBusy(false);
      setError(res.message ?? GOOGLE_ERRORS.google);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setSuccess("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email.trim()) return setError("Saisissez votre adresse e-mail.");
    setBusy(true);
    try {
      if (mode === "login") {
        if (!password) return setError("Saisissez votre mot de passe.");
        const res = await login(email, password);
        if (res.success) go(res.home ?? "/espace");
        else setError(res.message ?? "Connexion impossible.");
      } else if (mode === "register") {
        if (!firstName.trim() || !lastName.trim()) return setError("Indiquez votre prénom et votre nom.");
        if (password.length < 8) return setError("Le mot de passe doit comporter au moins 8 caractères.");
        if (password !== confirm) return setError("Les deux mots de passe ne correspondent pas.");
        const res = await register({ email, password, firstName, lastName });
        if (!res.success) setError(res.message ?? "Création du compte impossible.");
        else if (res.message) setSuccess(res.message);
        else router.push("/espace");
      } else {
        const res = await requestPasswordReset(email);
        if (res.success) setSuccess(res.message);
        else setError(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      {user && (
        <div className="flex flex-col gap-3 rounded-2xl bg-emerald-50 p-4 text-sm ring-1 ring-emerald-200">
          <p className="flex items-center gap-2 font-bold text-emerald-900">
            <CheckCircle2 aria-hidden className="size-4" />
            Connecté·e : {user.fullName} ({user.roleLabel})
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => router.push(user.home)} className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800">
              Ouvrir mon espace
            </button>
            <button type="button" onClick={() => logout()} className="rounded-full px-4 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100">
              Changer de compte
            </button>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-display text-3xl font-extrabold text-avenida-blue-950">
          {mode === "login" ? "Connexion" : mode === "register" ? "Créer mon compte" : "Mot de passe oublié"}
        </h1>
        <p className="mt-1 text-slate-600">
          {mode === "login"
            ? "Accédez à votre espace personnel ou à l'espace de gestion."
            : mode === "register"
              ? "Utilisez l'adresse e-mail communiquée à l'école : votre espace (élève, parent, professeur…) sera activé automatiquement."
              : "Recevez par e-mail un lien pour choisir un nouveau mot de passe."}
        </p>
      </div>

      {mode !== "reset" && (
        <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Connexion ou création de compte">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={cn("flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all", mode === m ? "bg-white text-vif shadow-sm" : "text-slate-500 hover:text-avenida-blue")}
            >
              {m === "login" ? <LogIn aria-hidden className="size-4" /> : <UserPlus aria-hidden className="size-4" />}
              {m === "login" ? "Se connecter" : "Créer un compte"}
            </button>
          ))}
        </div>
      )}

      {mode !== "reset" && (
        <>
          <button
            type="button"
            onClick={google}
            disabled={googleBusy}
            className="flex h-14 items-center justify-center gap-3 rounded-full border-2 border-slate-200 bg-white font-bold text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70"
          >
            {googleBusy ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <GoogleLogo />}
            {mode === "login" ? "Continuer avec Google" : "S'inscrire avec Google"}
          </button>
          <p className="flex items-center gap-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
            <span aria-hidden className="h-px flex-1 bg-slate-200" />
            ou avec votre e-mail
            <span aria-hidden className="h-px flex-1 bg-slate-200" />
          </p>
        </>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
              Prénom
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" className={field} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
              Nom
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" className={field} />
            </label>
          </div>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
          Adresse e-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="vous@exemple.com" className={field} />
        </label>
        {mode !== "reset" && (
          <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
            <span className="flex items-center justify-between">
              Mot de passe
              {mode === "login" && (
                <button type="button" onClick={() => switchMode("reset")} className="text-xs font-bold text-vif hover:underline">
                  Mot de passe oublié ?
                </button>
              )}
            </span>
            <span className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={cn(field, "pr-12")}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-avenida-blue"
              >
                {show ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
              </button>
            </span>
          </label>
        )}
        {mode === "register" && (
          <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
            Confirmer le mot de passe
            <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={field} />
          </label>
        )}

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-semibold text-vif">
            <AlertCircle aria-hidden className="size-4 shrink-0" />
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            <CheckCircle2 aria-hidden className="size-4 shrink-0" />
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="site-shine relative mt-1 flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-vif font-bold text-white shadow-lg shadow-vif/30 transition-colors hover:bg-vif-fonce disabled:opacity-70"
        >
          {busy ? <Loader2 aria-hidden className="size-5 animate-spin" /> : mode === "reset" ? <KeyRound aria-hidden className="size-5" /> : null}
          {mode === "login" ? "Se connecter" : mode === "register" ? "Créer mon compte" : "Recevoir le lien"}
          {!busy && mode !== "reset" && <ArrowRight aria-hidden className="size-5" />}
        </button>
        {mode === "reset" && (
          <button type="button" onClick={() => switchMode("login")} className="flex items-center justify-center gap-1.5 text-sm font-bold text-avenida-blue hover:underline">
            <ArrowLeft aria-hidden className="size-4" />
            Retour à la connexion
          </button>
        )}
      </form>

      <p className="text-center text-sm text-slate-600">
        Pas encore élève ?{" "}
        <Link href="/preinscription" className="font-bold text-vif hover:underline">
          Pré-inscription en ligne
        </Link>
      </p>
      <p className="text-center text-xs leading-relaxed text-slate-500">
        En vous connectant, vous acceptez nos{" "}
        <Link href="/conditions-utilisation" className="font-semibold underline hover:text-vif">
          conditions d&apos;utilisation
        </Link>{" "}
        et notre{" "}
        <Link href="/confidentialite" className="font-semibold underline hover:text-vif">
          politique de confidentialité
        </Link>
        .
      </p>
    </div>
  );
}

/** Portail de connexion unique : élèves, parents, professeurs, candidats et personnel. */
export default function ConnexionPage() {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1.05fr_1fr]">
      {/* Visuel */}
      <aside className="relative isolate hidden overflow-hidden bg-nuit text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image src={images.waiter.src} alt="" fill priority sizes="50vw" className="site-zoom-pan -z-20 object-cover object-[72%_30%] opacity-60" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,rgb(6_21_46/0.2)_0%,rgb(6_21_46/0.75)_55%,#06152E_100%)]" />
        <div aria-hidden className="bg-avenida-pattern absolute inset-y-0 left-0 -z-10 w-32 opacity-25 [mask-image:linear-gradient(90deg,black,transparent)]" />
        <SiteLogo inverted />
        <div className="flex flex-col gap-6">
          <p className="font-elegant text-5xl leading-tight font-bold italic">{siteConfig.signature}</p>
          <p className="max-w-md text-lg text-white/80">Un espace en ligne pour chacun : élèves, parents, professeurs et équipes de l&apos;Hôtel École Avenida.</p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {audiences.map((a) => (
              <li key={a.title} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <a.icon aria-hidden className="size-6 text-vif-clair" />
                <p className="mt-2 font-bold">{a.title}</p>
                <p className="text-xs text-white/70">{a.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Formulaire */}
      <main className="flex flex-col">
        <div className="flex items-center justify-between p-5 sm:p-8">
          <div className="lg:hidden">
            <SiteLogo />
          </div>
          <Link href="/" className="ml-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-avenida-blue hover:bg-avenida-blue-50">
            <ArrowLeft aria-hidden className="size-4" />
            Retour au site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <Suspense fallback={<Loader2 aria-label="Chargement" className="size-8 animate-spin text-avenida-blue" />}>
            <ConnexionForm />
          </Suspense>
        </div>
        <span aria-hidden className="flex h-1.5">
          <span className="flex-1 bg-avenida-blue" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-vif" />
        </span>
      </main>
    </div>
  );
}
