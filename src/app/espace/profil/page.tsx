"use client";

import { AlertCircle, CheckCircle2, FileUp, Loader2, Paperclip, Save, Send, Trash2, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PassportPhoto } from "@/components/espace/PassportPhoto";
import { useAuth } from "@/context/AuthContext";
import {
  KINDS,
  STATUS_LABEL,
  departmentFor,
  documentSpecs,
  fieldGroups,
  missingItems,
  needsPosition,
  type Department,
  type Field,
  type MemberApplication,
  type MemberKind,
  type Position,
  type UploadedDoc,
} from "@/lib/onboarding";
import { formatSize, signedUrl } from "@/lib/spaces";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const field = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-avenida-blue focus:ring-2 focus:ring-avenida-blue/15 disabled:bg-slate-50";
const EDITABLE = ["brouillon", "a_completer", "soumise"];

/**
 * Mon profil : tout membre complète son dossier (photo d'identité, statut, informations et pièces).
 * Le formulaire s'adapte au statut choisi ; l'administration examine le dossier et le DG attribue le rôle.
 */
export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [app, setApp] = useState<MemberApplication | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [kind, setKind] = useState<MemberKind | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [positionCode, setPositionCode] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const [{ data: a }, { data: p }, { data: prof }] = await Promise.all([
      supabase.from("member_applications").select("*").eq("profile_id", user.id).maybeSingle<MemberApplication>(),
      supabase.from("positions").select("*").order("sort"),
      supabase.from("profiles").select("first_name, last_name, phone, avatar_url").eq("id", user.id).maybeSingle(),
    ]);
    setPositions((p ?? []) as Position[]);
    if (a) {
      setApp(a);
      setKind(a.kind);
      setDepartment(a.department);
      setPositionCode(a.position_code);
      setData(a.data ?? {});
      setPhoto(a.photo);
      setDocs(a.documents ?? []);
    } else {
      setData({ first_name: prof?.first_name ?? "", last_name: prof?.last_name ?? "", phone: prof?.phone ?? "" });
      setPhoto(prof?.avatar_url?.startsWith("data:") ? prof.avatar_url : null);
      // Rôle déjà attribué par la direction : statut pré-sélectionné
      const r = user.role;
      setKind(r === "eleve" || r === "parent" || r === "professeur" || r === "client" ? r : r === "personnel" ? "personnel" : r === "candidat" ? null : "direction");
    }
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const editable = !app || EDITABLE.includes(app.status);
  const groups = useMemo(() => (kind ? fieldGroups(kind, department) : []), [kind, department]);
  const specs = useMemo(() => (kind ? documentSpecs(kind) : []), [kind]);
  const missing = kind ? missingItems(kind, department ?? departmentFor(kind), positionCode, data, docs, photo) : ["Statut"];

  const availablePositions = positions.filter((p) => {
    if (kind === "direction") return p.department === "direction" && p.default_role !== "personnel";
    if (kind === "professeur") return p.default_role === "professeur";
    if (kind === "personnel") return p.default_role === "personnel" && (!department || p.department === department || (department === "ecole" && p.department === "direction"));
    return false;
  });

  if (!user) return null;

  const set = (name: string, value: unknown) => setData((d) => ({ ...d, [name]: value }));

  const chooseKind = (k: MemberKind) => {
    setKind(k);
    setDepartment(departmentFor(k));
    setPositionCode(k === "professeur" ? "professeur" : null);
    setShowErrors(false);
  };

  const upload = async (key: string, label: string, file?: File) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return setMsg({ ok: false, text: "Fichier trop lourd (20 Mo au maximum)." });
    setUploading(key);
    const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-60);
    const path = `${user.id}/dossier/${key}-${Date.now()}-${safe}`;
    const { error } = await createClient().storage.from("documents").upload(path, file, { contentType: file.type || undefined });
    setUploading(null);
    if (error) return setMsg({ ok: false, text: "Envoi du fichier impossible. Réessayez." });
    setDocs((d) => [...d, { key, label, path, name: file.name, size: file.size, mime: file.type }]);
  };

  const removeDoc = async (doc: UploadedDoc) => {
    await createClient().storage.from("documents").remove([doc.path]);
    setDocs((d) => d.filter((x) => x.path !== doc.path));
  };

  const save = async (submit: boolean) => {
    if (!kind) return setMsg({ ok: false, text: "Choisissez votre statut." });
    setMsg(null);
    if (submit && missing.length) {
      setShowErrors(true);
      return setMsg({ ok: false, text: `Complétez d'abord : ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "…" : ""}` });
    }
    setBusy(true);
    const supabase = createClient();
    // Matricules des enfants : une liste propre
    const clean = { ...data };
    if (typeof clean.children === "string") clean.children = clean.children.split(/[\n,;]/).map((x) => x.trim().toUpperCase()).filter(Boolean);
    const row = {
      profile_id: user.id,
      kind,
      department: department ?? departmentFor(kind),
      position_code: needsPosition(kind) ? positionCode : null,
      data: clean,
      photo,
      documents: docs,
      status: submit ? "soumise" : app?.status === "soumise" ? "soumise" : "brouillon",
    };
    const { error } = await supabase.from("member_applications").upsert(row, { onConflict: "profile_id" });
    // Les informations de base alimentent aussi le profil du compte
    await supabase
      .from("profiles")
      .update({ first_name: String(data.first_name ?? "").trim() || null, last_name: String(data.last_name ?? "").trim() || null, phone: String(data.phone ?? "").trim() || null, avatar_url: photo, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: "Enregistrement impossible : " + error.message });
    setMsg({ ok: true, text: submit ? "Dossier envoyé ! L'administration l'examine et vous serez prévenu(e) dans votre espace." : "Brouillon enregistré." });
    refresh();
    load();
  };

  const openDoc = async (d: UploadedDoc) => {
    const url = await signedUrl(d.path, "documents");
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!loaded) return <Loader2 aria-label="Chargement" className="mx-auto size-8 animate-spin text-avenida-blue" />;

  const status = app ? STATUS_LABEL[app.status] : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold tracking-widest text-vif uppercase">
            <UserRound aria-hidden className="size-4" /> Mon profil
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-avenida-blue">Mon dossier de membre</h1>
          <p className="mt-1 text-sm text-slate-600">
            Compte : <strong>{user.email}</strong> · Rôle actuel : <strong className="text-vif">{user.roleLabel}</strong>
          </p>
        </div>
        {status && <span className={cn("rounded-full px-4 py-2 text-sm font-bold", status.tone)}>{status.label}</span>}
      </header>

      {app && (app.manager_note || app.dg_note) && (
        <div className="rounded-3xl bg-amber-50 p-5 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-bold">Message de l&apos;administration</p>
          <p className="mt-1 whitespace-pre-line">{app.dg_note ?? app.manager_note}</p>
        </div>
      )}
      {!app && (
        <p className="rounded-3xl bg-sky-50 p-5 text-sm text-sky-900 ring-1 ring-sky-200">
          Bienvenue ! Pour activer votre espace, ajoutez votre photo d&apos;identité, choisissez votre statut et complétez le formulaire. L&apos;administration
          vérifie votre dossier puis le Directeur général vous attribue votre rôle.
        </p>
      )}

      {/* 1. Statut */}
      <Card step={1} title="Votre statut à Avenida">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              disabled={!editable}
              aria-pressed={kind === k.value}
              onClick={() => chooseKind(k.value)}
              className={cn(
                "rounded-2xl border-2 p-4 text-left transition-colors disabled:cursor-not-allowed",
                kind === k.value ? "border-vif bg-red-50/60" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <span className="block font-bold text-avenida-blue">{k.label}</span>
              <span className="text-xs text-slate-600">{k.text}</span>
            </button>
          ))}
        </div>

        {kind === "personnel" && (
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Lieu de travail">
            {(["hotel", "ecole"] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={department === d}
                disabled={!editable}
                onClick={() => {
                  setDepartment(d);
                  setPositionCode(null);
                }}
                className={cn("rounded-full px-5 py-2 text-sm font-bold ring-2", department === d ? "bg-avenida-blue text-white ring-avenida-blue" : "text-avenida-blue ring-slate-200")}
              >
                Je travaille à {d === "hotel" ? "l'hôtel" : "l'école"}
              </button>
            ))}
          </div>
        )}

        {kind && needsPosition(kind) && (kind !== "personnel" || department) && (
          <label className="mt-4 flex max-w-md flex-col gap-1.5 text-sm font-bold text-avenida-blue">
            Poste occupé
            <select value={positionCode ?? ""} disabled={!editable} onChange={(e) => setPositionCode(e.target.value || null)} className={field}>
              <option value="">— Choisir —</option>
              {Object.entries(
                availablePositions.reduce<Record<string, Position[]>>((acc, p) => ((acc[p.service ?? "Autre"] ??= []).push(p), acc), {})
              ).map(([service, list]) => (
                <optgroup key={service} label={service}>
                  {list.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        )}
      </Card>

      {/* 2. Photo */}
      <Card step={2} title="Photo d'identité (format passeport)">
        {editable ? <PassportPhoto value={photo} onChange={setPhoto} /> : photo && <img src={photo} alt="Votre photo d'identité" className="h-[180px] w-[140px] rounded-lg object-cover ring-1 ring-slate-200" />}
      </Card>

      {/* 3. Formulaire */}
      {kind &&
        groups.map((g, gi) => (
          <Card key={g.title} step={3 + gi} title={g.title}>
            <div className="grid gap-4 sm:grid-cols-2">
              {g.fields.map((f) => (
                <FieldInput key={f.name} f={f} value={data[f.name]} onChange={(v) => set(f.name, v)} disabled={!editable} error={showErrors && !!f.required && isEmpty(data[f.name])} />
              ))}
            </div>
          </Card>
        ))}

      {/* 4. Pièces */}
      {kind && (
        <Card step={3 + groups.length} title="Pièces à joindre">
          <ul className="flex flex-col gap-3">
            {specs.map((s) => {
              const mine = docs.filter((d) => d.key === s.key);
              return (
                <li key={s.key} className={cn("flex flex-col gap-2 rounded-2xl border p-4", showErrors && s.required && !mine.length ? "border-red-300 bg-red-50/40" : "border-slate-200")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-800">
                      {s.label} {s.required ? <span className="text-vif">*</span> : <span className="text-xs font-semibold text-slate-500">(facultatif)</span>}
                      {s.hint && <span className="block text-xs font-normal text-slate-500">{s.hint}</span>}
                    </p>
                    {editable && (
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-avenida-blue-50 px-4 py-2 text-xs font-bold text-avenida-blue hover:bg-avenida-blue-100">
                        {uploading === s.key ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <FileUp aria-hidden className="size-4" />}
                        Ajouter (PDF ou photo)
                        <input type="file" accept="application/pdf,image/*" className="sr-only" onChange={(e) => upload(s.key, s.label, e.target.files?.[0])} />
                      </label>
                    )}
                  </div>
                  {mine.map((d) => (
                    <p key={d.path} className="flex items-center gap-2 text-sm">
                      <Paperclip aria-hidden className="size-4 text-slate-400" />
                      <button type="button" onClick={() => openDoc(d)} className="truncate font-semibold text-avenida-blue hover:underline">
                        {d.name}
                      </button>
                      <span className="text-xs text-slate-500">{formatSize(d.size)}</span>
                      {editable && (
                        <button type="button" onClick={() => removeDoc(d)} aria-label={`Retirer ${d.name}`} className="ml-auto text-slate-400 hover:text-vif">
                          <Trash2 aria-hidden className="size-4" />
                        </button>
                      )}
                    </p>
                  ))}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={cn("flex items-start gap-2 rounded-2xl p-4 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-vif")}>
          {msg.ok ? <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" /> : <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />}
          {msg.text}
        </p>
      )}

      {editable && kind && (
        <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-3 rounded-3xl bg-white/95 p-4 shadow-lg ring-1 ring-slate-900/5 backdrop-blur">
          <p className="mr-auto text-sm text-slate-600">{missing.length ? `${missing.length} élément(s) manquant(s)` : "Dossier complet ✔"}</p>
          <button type="button" disabled={busy} onClick={() => save(false)} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-avenida-blue ring-2 ring-avenida-blue/15 hover:bg-avenida-blue-50">
            <Save aria-hidden className="size-4" /> Enregistrer le brouillon
          </button>
          <button type="button" disabled={busy} onClick={() => save(true)} className="inline-flex items-center gap-2 rounded-full bg-vif px-6 py-3 text-sm font-bold text-white hover:bg-vif-fonce disabled:opacity-60">
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
            {app?.status === "soumise" ? "Mettre à jour mon dossier" : "Envoyer mon dossier"}
          </button>
        </div>
      )}
    </div>
  );
}

const isEmpty = (v: unknown) => v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "");

function Card({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <h2 className="mb-4 flex items-center gap-3 font-display text-lg font-extrabold text-avenida-blue">
        <span className="flex size-8 items-center justify-center rounded-full bg-vif text-sm text-white">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function FieldInput({ f, value, onChange, disabled, error }: { f: Field; value: unknown; onChange: (v: unknown) => void; disabled: boolean; error: boolean }) {
  const cls = cn(field, error && "border-red-400 ring-2 ring-red-100");
  const label = (
    <span>
      {f.label} {f.required && <span className="text-vif">*</span>}
    </span>
  );
  const wrap = cn("flex flex-col gap-1.5 text-sm font-bold text-avenida-blue", (f.wide || f.type === "textarea" || f.type === "children") && "sm:col-span-2");
  if (f.type === "select")
    return (
      <label className={wrap}>
        {label}
        <select value={String(value ?? "")} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={cls}>
          <option value="">— Choisir —</option>
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  if (f.type === "textarea")
    return (
      <label className={wrap}>
        {label}
        <textarea value={String(value ?? "")} disabled={disabled} rows={3} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} className={cls} />
      </label>
    );
  if (f.type === "children")
    return (
      <label className={wrap}>
        {label}
        <textarea
          value={Array.isArray(value) ? value.join("\n") : String(value ?? "")}
          disabled={disabled}
          rows={3}
          onChange={(e) => onChange(e.target.value.split(/\n|,|;/).map((x) => x.trim().toUpperCase()).filter(Boolean))}
          placeholder={f.placeholder}
          className={cls}
        />
        <span className="text-xs font-normal text-slate-500">Le matricule figure sur la carte scolaire ou la fiche d&apos;inscription de l&apos;enfant.</span>
      </label>
    );
  return (
    <label className={wrap}>
      {label}
      <input type={f.type ?? "text"} value={String(value ?? "")} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} className={cls} />
    </label>
  );
}
