"use client";

import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileUp, GraduationCap, Loader2, Paperclip, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCFA, formations, intakes, requiredDocuments, type DocumentType } from "@/content/site";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Formation", icon: GraduationCap },
  { title: "Candidat", icon: UserRound },
  { title: "Parent / tuteur", icon: Users },
  { title: "Pièces", icon: Paperclip },
  { title: "Validation", icon: ShieldCheck },
] as const;

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

type Form = {
  program_code: string;
  specialty: string;
  intake: string;
  schedule: "jour" | "soir";
  boarding: boolean;
  first_name: string;
  last_name: string;
  gender: "" | "F" | "M";
  birth_date: string;
  birth_place: string;
  nationality: string;
  neighborhood: string;
  phone: string;
  email: string;
  last_class: string;
  last_diploma: string;
  previous_school: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_relation: string;
  guardian_profession: string;
  message: string;
};

const empty: Form = {
  program_code: "CAP",
  specialty: "",
  intake: intakes[0],
  schedule: "jour",
  boarding: false,
  first_name: "",
  last_name: "",
  gender: "",
  birth_date: "",
  birth_place: "",
  nationality: "Togolaise",
  neighborhood: "",
  phone: "",
  email: "",
  last_class: "",
  last_diploma: "",
  previous_school: "",
  guardian_name: "",
  guardian_phone: "",
  guardian_email: "",
  guardian_relation: "",
  guardian_profession: "",
  message: "",
};

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-avenida-blue focus:ring-2 focus:ring-avenida-blue/15 aria-[invalid=true]:border-vif";

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-bold text-avenida-blue-950">
      <span>
        {label}
        {required && <span className="text-vif"> *</span>}
      </span>
      {children}
      {hint && <span className="text-xs font-medium text-slate-500">{hint}</span>}
    </label>
  );
}

/**
 * Pré-inscription en ligne en 5 étapes. Le dossier et les pièces sont déposés directement
 * dans la base (dépôt public, lecture réservée à l'école et au candidat).
 * Le candidat peut créer son compte pour suivre son dossier et échanger avec l'école.
 */
export function PreinscriptionForm() {
  const params = useSearchParams();
  const { user, register } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(empty);
  const [files, setFiles] = useState<Partial<Record<DocumentType, File>>>({});
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ reference: string | null; account: string | null } | null>(null);

  // Formation pré-sélectionnée depuis un lien (?formation=BTS) et e-mail du compte connecté
  useEffect(() => {
    const code = params.get("formation")?.toUpperCase();
    if (code && formations.some((f) => f.code === code)) setForm((f) => ({ ...f, program_code: code, specialty: "" }));
  }, [params]);
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, email: f.email || user.email }));
  }, [user]);

  const formation = useMemo(() => formations.find((f) => f.code === form.program_code) ?? formations[0], [form.program_code]);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const validate = (s: number): string[] => {
    const e: string[] = [];
    if (s === 0 && !form.specialty) e.push("Choisissez une spécialité.");
    if (s === 1) {
      if (!form.first_name.trim()) e.push("Indiquez le prénom.");
      if (!form.last_name.trim()) e.push("Indiquez le nom.");
      if (form.phone.replace(/\D/g, "").length < 8) e.push("Indiquez un numéro de téléphone valide.");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.push("Indiquez une adresse e-mail valide.");
    }
    if (s === 2 && form.guardian_phone && form.guardian_phone.replace(/\D/g, "").length < 8) e.push("Le téléphone du parent semble incomplet.");
    if (s === 2 && form.guardian_email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.guardian_email.trim())) e.push("L'e-mail du parent semble incorrect.");
    if (s === 3) {
      Object.values(files).forEach((f) => {
        if (f && f.size > MAX_SIZE) e.push(`« ${f.name} » dépasse 10 Mo.`);
      });
    }
    if (s === 4) {
      if (!consent) e.push("Cochez la case pour confirmer l'exactitude des informations.");
      if (!user && password && password.length < 8) e.push("Le mot de passe doit comporter au moins 8 caractères.");
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (!e.length) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      document.getElementById("preinscription")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const submit = async () => {
    const all = [0, 1, 2, 3, 4].flatMap(validate);
    setErrors(all);
    if (all.length || honeypot) return;
    setSending(true);
    const supabase = createClient();
    const id = crypto.randomUUID();
    const clean = (v: string) => v.trim() || null;

    const { error } = await supabase.from("applications").insert({
      id,
      program_code: form.program_code,
      specialty: form.specialty,
      intake: form.intake,
      schedule: form.schedule,
      boarding: form.boarding,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      gender: form.gender || null,
      birth_date: form.birth_date || null,
      birth_place: clean(form.birth_place),
      nationality: clean(form.nationality),
      neighborhood: clean(form.neighborhood),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      last_class: clean(form.last_class),
      last_diploma: clean(form.last_diploma),
      previous_school: clean(form.previous_school),
      guardian_name: clean(form.guardian_name),
      guardian_phone: clean(form.guardian_phone),
      guardian_email: clean(form.guardian_email.toLowerCase()),
      guardian_relation: clean(form.guardian_relation),
      guardian_profession: clean(form.guardian_profession),
      message: clean(form.message),
    });
    if (error) {
      setSending(false);
      setErrors(["L'envoi a échoué. Vérifiez votre connexion et réessayez, ou contactez-nous par téléphone."]);
      return;
    }

    // Pièces jointes : stockage privé + fiche
    const failed: string[] = [];
    for (const [type, file] of Object.entries(files) as [DocumentType, File][]) {
      const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
      const path = `preinscriptions/${id}/${type}-${Date.now()}-${safe}`;
      const up = await supabase.storage.from("dossiers").upload(path, file, { contentType: file.type });
      const row = up.error
        ? up
        : await supabase.from("application_documents").insert({ application_id: id, doc_type: type, file_path: path, file_name: file.name, file_size: file.size });
      if (row.error) failed.push(file.name);
    }

    // Compte candidat pour suivre le dossier
    let account: string | null = null;
    if (!user && password) {
      const res = await register({ email: form.email, password, firstName: form.first_name, lastName: form.last_name });
      account = res.success ? res.message ?? "Votre compte est créé : retrouvez votre dossier dans « Mon espace »." : res.message ?? null;
    }

    const { data: reference } = await supabase.rpc("application_reference", { app: id });
    setSending(false);
    if (failed.length) setErrors([`Dossier enregistré, mais ces pièces n'ont pas pu être envoyées : ${failed.join(", ")}. Vous pourrez les déposer au bureau.`]);
    setDone({ reference: (reference as string | null) ?? null, account });
  };

  if (done) {
    return (
      <div className="site-rise flex flex-col items-center gap-5 rounded-[2rem] bg-white p-8 text-center shadow-2xl ring-1 ring-slate-900/5 sm:p-14">
        <span className="flex size-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 aria-hidden className="size-11" />
        </span>
        <h2 className="font-display text-3xl font-extrabold text-avenida-blue-950">Pré-inscription envoyée !</h2>
        {done.reference && (
          <p className="rounded-2xl bg-avenida-blue-50 px-6 py-3 text-avenida-blue">
            Référence de votre dossier : <strong className="font-display text-xl text-vif">{done.reference}</strong>
          </p>
        )}
        <p className="max-w-xl text-slate-600">
          L&apos;école étudie votre dossier et vous contacte au <strong>{form.phone}</strong>. Pensez à apporter les pièces originales et le paquet
          de rames au bureau, du lundi au vendredi de 9 h à 14 h.
        </p>
        {done.account && <p className="max-w-xl rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{done.account}</p>}
        {errors.map((e) => (
          <p key={e} className="max-w-xl rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            {e}
          </p>
        ))}
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={user || password ? "/espace" : "/connexion"} className="inline-flex h-12 items-center gap-2 rounded-full bg-vif px-6 font-bold text-white hover:bg-vif-fonce">
            Suivre mon dossier
            <ArrowRight aria-hidden className="size-4" />
          </Link>
          <Link href="/" className="inline-flex h-12 items-center rounded-full border-2 border-avenida-blue/15 px-6 font-bold text-avenida-blue hover:bg-avenida-blue-50">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div id="preinscription" className="scroll-mt-28 overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-900/5">
      {/* Progression */}
      <ol className="grid grid-cols-5 border-b border-slate-100 bg-slate-50">
        {STEPS.map((s, i) => (
          <li key={s.title} aria-current={i === step ? "step" : undefined} className="relative flex flex-col items-center gap-1.5 px-1 py-4 text-center">
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-full transition-all duration-300",
                i < step ? "bg-emerald-500 text-white" : i === step ? "bg-vif text-white shadow-lg shadow-vif/30" : "bg-white text-slate-400 ring-1 ring-slate-200"
              )}
            >
              {i < step ? <Check aria-hidden className="size-5" /> : <s.icon aria-hidden className="size-5" />}
            </span>
            <span className={cn("hidden text-xs font-bold sm:block", i === step ? "text-vif" : "text-slate-500")}>{s.title}</span>
            <span aria-hidden className={cn("absolute bottom-0 left-0 h-1 w-full", i <= step ? "bg-vif" : "bg-transparent")} />
          </li>
        ))}
      </ol>

      <form
        className="flex flex-col gap-6 p-6 sm:p-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (step < STEPS.length - 1) next();
          else submit();
        }}
        noValidate
      >
        <h2 className="font-display text-2xl font-extrabold text-avenida-blue-950">
          <span className="text-vif">Étape {step + 1}/5</span> · {STEPS[step].title}
        </h2>

        {/* Champ piège anti-robots (invisible pour les humains) */}
        <input type="text" name="site_web" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

        {step === 0 && (
          <div className="flex flex-col gap-6">
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-avenida-blue-950">
                Diplôme préparé <span className="text-vif">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {formations.map((f) => (
                  <label
                    key={f.code}
                    className={cn(
                      "flex cursor-pointer flex-col rounded-2xl border-2 p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-avenida-blue",
                      form.program_code === f.code ? "border-vif bg-red-50" : "border-slate-200 hover:border-avenida-blue/40"
                    )}
                  >
                    <input type="radio" name="program" value={f.code} checked={form.program_code === f.code} onChange={() => setForm((x) => ({ ...x, program_code: f.code, specialty: "" }))} className="sr-only" />
                    <span className={cn("font-display text-2xl font-extrabold", form.program_code === f.code ? "text-vif" : "text-avenida-blue-950")}>{f.code}</span>
                    <span className="text-xs text-slate-500">{f.duration} · {f.level}</span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {formation.name} · inscription <strong>{formatCFA(formation.registration)}</strong> · scolarité <strong>{formatCFA(formation.tuition)}</strong> par an
              </p>
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-sm font-bold text-avenida-blue-950">
                Spécialité <span className="text-vif">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {formation.specialties.map((s) => (
                  <label
                    key={s}
                    className={cn(
                      "cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-avenida-blue",
                      form.specialty === s ? "border-vif bg-vif text-white" : "border-slate-200 text-avenida-blue hover:border-avenida-blue/40"
                    )}
                  >
                    <input type="radio" name="specialty" value={s} checked={form.specialty === s} onChange={() => set("specialty", s)} className="sr-only" />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Rentrée souhaitée" required>
                <select value={form.intake} onChange={(e) => set("intake", e.target.value)} className={field}>
                  {intakes.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Horaires" required>
                <select value={form.schedule} onChange={(e) => set("schedule", e.target.value as Form["schedule"])} className={field}>
                  <option value="jour">Cours du jour (7 h 30 – 14 h 30)</option>
                  <option value="soir">Cours du soir (18 h 30 – 21 h 30)</option>
                </select>
              </Field>
              <Field label="Internat">
                <select value={form.boarding ? "oui" : "non"} onChange={(e) => set("boarding", e.target.value === "oui")} className={field}>
                  <option value="non">Externe</option>
                  <option value="oui">Interne (30 000 F / mois)</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Prénom(s)" required>
              <input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} autoComplete="given-name" className={field} />
            </Field>
            <Field label="Nom" required>
              <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} autoComplete="family-name" className={field} />
            </Field>
            <Field label="Sexe">
              <select value={form.gender} onChange={(e) => set("gender", e.target.value as Form["gender"])} className={field}>
                <option value="">—</option>
                <option value="F">Féminin</option>
                <option value="M">Masculin</option>
              </select>
            </Field>
            <Field label="Date de naissance">
              <input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} className={field} />
            </Field>
            <Field label="Lieu de naissance">
              <input value={form.birth_place} onChange={(e) => set("birth_place", e.target.value)} className={field} />
            </Field>
            <Field label="Nationalité">
              <input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} className={field} />
            </Field>
            <Field label="Téléphone" required>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="+228 90 00 00 00" className={field} />
            </Field>
            <Field label="E-mail" required hint="Il servira à suivre votre dossier en ligne.">
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" readOnly={!!user} className={field} />
            </Field>
            <Field label="Quartier de résidence">
              <input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Tokoin, Bè, Agoè…" className={field} />
            </Field>
            <Field label="Dernière classe suivie">
              <input value={form.last_class} onChange={(e) => set("last_class", e.target.value)} placeholder="3ᵉ, Terminale…" className={field} />
            </Field>
            <Field label="Dernier diplôme obtenu">
              <input value={form.last_diploma} onChange={(e) => set("last_diploma", e.target.value)} placeholder="BEPC, BAC, BT…" className={field} />
            </Field>
            <Field label="Établissement précédent">
              <input value={form.previous_school} onChange={(e) => set("previous_school", e.target.value)} className={field} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <p className="text-sm text-slate-600 sm:col-span-2">
              Pour les candidats mineurs, ces informations sont indispensables : le parent recevra son propre compte pour suivre la scolarité.
            </p>
            <Field label="Nom et prénom du parent ou tuteur">
              <input value={form.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} className={field} />
            </Field>
            <Field label="Lien avec le candidat">
              <select value={form.guardian_relation} onChange={(e) => set("guardian_relation", e.target.value)} className={field}>
                <option value="">—</option>
                <option>Père</option>
                <option>Mère</option>
                <option>Tuteur / Tutrice</option>
                <option>Autre</option>
              </select>
            </Field>
            <Field label="Téléphone du parent">
              <input type="tel" value={form.guardian_phone} onChange={(e) => set("guardian_phone", e.target.value)} placeholder="+228 …" className={field} />
            </Field>
            <Field label="E-mail du parent (pour recevoir la fiche d'inscription)">
              <input type="email" value={form.guardian_email} onChange={(e) => set("guardian_email", e.target.value)} autoComplete="off" placeholder="parent@exemple.com" className={field} />
            </Field>
            <Field label="Profession">
              <input value={form.guardian_profession} onChange={(e) => set("guardian_profession", e.target.value)} className={field} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Message ou précision (facultatif)">
                <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={3} maxLength={2000} className={cn(field, "resize-y")} />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Joignez vos pièces maintenant (PDF ou photo, 10 Mo maximum) ou apportez-les au bureau. Les originaux vous seront demandés à l&apos;inscription définitive.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {requiredDocuments.map((d) => {
                const file = d.upload ? files[d.key as DocumentType] : undefined;
                return (
                  <li key={d.key} className={cn("flex flex-col gap-3 rounded-2xl border-2 p-4", file ? "border-emerald-300 bg-emerald-50/50" : "border-dashed border-slate-200")}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-avenida-blue-950">{d.label}</p>
                        <p className="text-xs font-semibold text-vif">{d.count}</p>
                      </div>
                      {file && <CheckCircle2 aria-hidden className="size-5 shrink-0 text-emerald-600" />}
                    </div>
                    {d.upload ? (
                      file ? (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm">
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setFiles(({ [d.key as DocumentType]: _, ...rest }) => rest)}
                            aria-label={`Retirer ${file.name}`}
                            className="text-slate-400 hover:text-vif"
                          >
                            <Trash2 aria-hidden className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-avenida-blue-50 px-3 py-2.5 text-sm font-bold text-avenida-blue transition-colors hover:bg-avenida-blue-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-avenida-blue">
                          <FileUp aria-hidden className="size-4" />
                          Choisir un fichier
                          <input
                            type="file"
                            accept={ACCEPT}
                            className="sr-only"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setFiles((x) => ({ ...x, [d.key]: f }));
                            }}
                          />
                        </label>
                      )
                    ) : (
                      <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">À remettre au bureau lors de l&apos;inscription.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6">
            <dl className="grid gap-3 rounded-2xl bg-slate-50 p-5 text-sm sm:grid-cols-2">
              {[
                ["Formation", `${form.program_code} · ${form.specialty}`],
                ["Rentrée", `${form.intake} · cours du ${form.schedule}${form.boarding ? " · interne" : ""}`],
                ["Candidat", `${form.first_name} ${form.last_name}`],
                ["Contact", `${form.phone} · ${form.email}`],
                ["Parent / tuteur", form.guardian_name ? `${form.guardian_name} (${form.guardian_phone || "—"})` : "Non renseigné"],
                ["Pièces jointes", `${Object.keys(files).length} fichier(s)`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-bold tracking-wide text-slate-500 uppercase">{k}</dt>
                  <dd className="font-semibold text-avenida-blue-950">{v}</dd>
                </div>
              ))}
            </dl>

            {!user && (
              <div className="rounded-2xl border-2 border-avenida-blue/10 p-5">
                <p className="font-bold text-avenida-blue-950">Créer mon compte pour suivre mon dossier (recommandé)</p>
                <p className="mt-1 text-sm text-slate-600">
                  Avec l&apos;e-mail <strong>{form.email}</strong> : suivi de la décision, ajout de pièces et messagerie avec l&apos;école.
                </p>
                <div className="mt-4 max-w-sm">
                  <Field label="Choisissez un mot de passe" hint="8 caractères minimum. Laissez vide pour ne pas créer de compte.">
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={field} />
                  </Field>
                </div>
              </div>
            )}

            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 accent-[#E30613]" />
              <span>
                Je certifie l&apos;exactitude des informations et j&apos;accepte que l&apos;Hôtel École Avenida les utilise pour traiter ma candidature, selon la{" "}
                <Link href="/confidentialite" target="_blank" className="font-semibold text-vif underline">
                  politique de confidentialité
                </Link>{" "}
                et les{" "}
                <Link href="/conditions-utilisation" target="_blank" className="font-semibold text-vif underline">
                  conditions d&apos;utilisation
                </Link>
                .
              </span>
            </label>
          </div>
        )}

        {errors.length > 0 && (
          <ul role="alert" className="flex flex-col gap-1 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-vif">
            {errors.map((e) => (
              <li key={e}>• {e}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={() => {
              setErrors([]);
              setStep((s) => Math.max(0, s - 1));
            }}
            disabled={step === 0}
            className="inline-flex h-12 items-center gap-2 rounded-full px-5 font-bold text-avenida-blue hover:bg-avenida-blue-50 disabled:invisible"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Précédent
          </button>
          <button
            type="submit"
            disabled={sending}
            className="site-shine relative inline-flex h-14 items-center gap-2 overflow-hidden rounded-full bg-vif px-8 font-bold text-white shadow-lg shadow-vif/30 transition-colors hover:bg-vif-fonce disabled:opacity-70"
          >
            {sending ? <Loader2 aria-hidden className="size-5 animate-spin" /> : null}
            {step < STEPS.length - 1 ? "Continuer" : sending ? "Envoi en cours…" : "Envoyer ma pré-inscription"}
            {!sending && <ArrowRight aria-hidden className="size-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
