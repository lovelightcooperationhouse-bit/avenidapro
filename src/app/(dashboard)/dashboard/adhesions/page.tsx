"use client";

import { CheckCircle2, ClipboardCheck, Download, Mail, Eye, FileText, IdCard, Loader2, Printer, Search, ShieldCheck, ThumbsDown, ThumbsUp, UserCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ArchiveButton } from "@/components/documents/ArchiveButton";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentViewer, downloadFile, type ViewableFile } from "@/components/documents/DocumentViewer";
import { EmailComposer } from "@/components/email/EmailComposer";
import { fees, formations } from "@/content/site";
import { useAuth } from "@/context/AuthContext";
import { issueCard } from "@/lib/cards";
import { pingNotifications } from "@/lib/notify";
import { KINDS, STATUS_LABEL, fieldGroups, type AppStatus, type MemberApplication, type Position, type UploadedDoc } from "@/lib/onboarding";
import { ROLE_CONFIG, type RoleType } from "@/lib/roles";
import { formatSize, signedUrl } from "@/lib/spaces";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Row = MemberApplication & { profiles: { email: string | null } | null };

const TABS: { key: string; label: string; statuses: AppStatus[] }[] = [
  { key: "traiter", label: "À examiner", statuses: ["soumise", "en_examen"] },
  { key: "decision", label: "Décision du DG", statuses: ["avis_favorable", "avis_defavorable"] },
  { key: "completer", label: "À compléter", statuses: ["a_completer", "brouillon"] },
  { key: "validees", label: "Validés", statuses: ["validee"] },
  { key: "refusees", label: "Refusés", statuses: ["refusee"] },
];

const kindLabel = (k: string) => KINDS.find((x) => x.value === k)?.label ?? k;

/** Chaque département ne traite que ses dossiers : école (élèves, parents), RH (personnel, professeurs, direction), hôtel (clients). */
const SCOPES: Record<string, { label: string; kinds: string[]; text: string }> = {
  ecole: { label: "Dossiers des élèves et parents", kinds: ["eleve", "parent"], text: "Profils des élèves et des parents : la pédagogie examine et donne son avis, le Directeur général valide." },
  rh: { label: "Recrutements et dossiers du personnel", kinds: ["professeur", "personnel", "direction"], text: "Candidatures et dossiers des professeurs, du personnel de l'hôtel et de l'école, de la direction : les RH examinent, le Directeur général valide." },
  hotel: { label: "Dossiers des clients de l'hôtel", kinds: ["client"], text: "Profils des clients de l'hôtel : l'hôtel examine, le Directeur général valide." },
};
const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";

/**
 * Dossiers des membres : le gestionnaire concerné (pédagogie, RH, hôtel) examine et donne son avis,
 * le Directeur général valide, attribue le rôle ; fiches, matricule et carte sont créés automatiquement.
 */
export default function AdhesionsPage() {
  return (
    <Suspense fallback={<Loader2 aria-label="Chargement" className="size-6 animate-spin" />}>
      <Adhesions />
    </Suspense>
  );
}

function Adhesions() {
  const { user } = useAuth();
  const scope = SCOPES[useSearchParams().get("scope") ?? ""];
  const isDG = user?.role === "directeur_general";
  const [rows, setRows] = useState<Row[] | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tab, setTab] = useState(isDG ? "decision" : "traiter");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data }, { data: p }] = await Promise.all([
      supabase.from("member_applications").select("*, profiles!member_applications_profile_id_fkey(email)").order("submitted_at", { ascending: false, nullsFirst: false }),
      supabase.from("positions").select("*").order("sort"),
    ]);
    setRows((data ?? []) as Row[]);
    setPositions((p ?? []) as Position[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, (rows ?? []).filter((r) => t.statuses.includes(r.status) && (!scope || scope.kinds.includes(r.kind))).length])), [rows, scope]);
  const list = useMemo(() => {
    const t = TABS.find((x) => x.key === tab)!;
    const s = q.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        t.statuses.includes(r.status) &&
        (!scope || scope.kinds.includes(r.kind)) &&
        (!kind || r.kind === kind) &&
        (!s || `${r.data.first_name ?? ""} ${r.data.last_name ?? ""} ${r.profiles?.email ?? ""} ${r.data.phone ?? ""}`.toLowerCase().includes(s))
    );
  }, [rows, tab, kind, q, scope]);
  const selected = (rows ?? []).find((r) => r.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
          <ClipboardCheck aria-hidden className="size-6 text-[#E30613]" /> {scope?.label ?? "Dossiers des membres"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {scope?.text ??
            "Profils complétés par les élèves, parents, professeurs, personnels et clients. Le gestionnaire concerné donne son avis ; le Directeur général valide et attribue le rôle. Fiche, matricule et carte sont alors créés automatiquement."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn("rounded-full px-4 py-2 text-sm font-bold ring-1", tab === t.key ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-400")}
          >
            {t.label} <span className="ml-1 opacity-70">{counts[t.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <span className="relative flex-1">
              <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail, téléphone" aria-label="Rechercher" className={cn(input, "pl-9")} />
            </span>
            <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Statut demandé" className="rounded-xl border border-slate-200 bg-white px-2 text-sm">
              <option value="">Tous</option>
              {KINDS.filter((k) => !scope || scope.kinds.includes(k.value)).map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          {rows === null ? (
            <Loader2 aria-label="Chargement" className="size-6 animate-spin text-[#0C356A]" />
          ) : list.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Aucun dossier ici.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {list.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={cn("flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left", selectedId === r.id ? "border-[#E30613] ring-2 ring-red-100" : "border-slate-200 hover:border-slate-300")}
                  >
                    {r.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- photo en data URL
                      <img src={r.photo} alt="" className="h-14 w-11 shrink-0 rounded object-cover" />
                    ) : (
                      <span className="h-14 w-11 shrink-0 rounded bg-slate-100" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-slate-800">
                        {String(r.data.last_name ?? "").toUpperCase()} {String(r.data.first_name ?? "")}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {kindLabel(r.kind)}
                        {r.position_code ? ` · ${positions.find((p) => p.code === r.position_code)?.label ?? ""}` : ""}
                      </span>
                      <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_LABEL[r.status].tone)}>{STATUS_LABEL[r.status].label}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected ? (
          <Detail key={selected.id} app={selected} positions={positions} isDG={isDG} onChange={load} />
        ) : (
          <div className="hidden items-center justify-center rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 xl:flex">
            Sélectionnez un dossier pour l&apos;examiner.
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ app, positions, isDG, onChange }: { app: Row; positions: Position[]; isDG: boolean; onChange: () => void }) {
  const { user } = useAuth();
  const position = positions.find((p) => p.code === app.position_code);
  const defaultRole = position?.default_role ?? (app.kind === "eleve" ? "eleve" : app.kind === "parent" ? "parent" : app.kind === "professeur" ? "professeur" : app.kind === "client" ? "client" : "personnel");
  const [note, setNote] = useState("");
  const [role, setRole] = useState(app.assigned_role ?? defaultRole);
  const program = String(app.data.program_code ?? "");
  const f = formations.find((x) => x.code === program);
  const [className, setClassName] = useState(`${program} ${String(app.data.year_level ?? "1re année").replace(" année", "")} ${String(app.data.specialty ?? "")}`.trim());
  const [contract, setContract] = useState({ contract_type: "CDD", base_salary: "", hire_date: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tab, setTab] = useState<"dossier" | "documents">("dossier");
  const [mail, setMail] = useState<{ subject: string; message: string } | null>(null);
  const name = `${String(app.data.first_name ?? "")} ${String(app.data.last_name ?? "")}`.trim();
  const openMail = (kind?: string, extra = "") => {
    const hello = `Bonjour ${name},

`;
    const t: Record<string, { subject: string; message: string }> = {
      a_completer: { subject: "Votre dossier Avenida est à compléter", message: `${hello}Votre dossier de membre doit être complété :

${extra || "- "}

Connectez-vous à votre espace, rubrique « Mon profil », pour ajouter les informations ou pièces demandées.` },
      validee: { subject: "Votre dossier Avenida est validé", message: `${hello}Votre dossier est validé et votre espace est activé.${extra ? `

${extra}` : ""}

Bienvenue à l'Hôtel École Avenida !` },
      refusee: { subject: "Votre demande Avenida", message: `${hello}Après examen, votre demande n'a pas été retenue.${extra ? `

${extra}` : ""}

Nous restons à votre disposition pour toute information.` },
    };
    setMail(t[kind ?? ""] ?? { subject: "Votre dossier – Hôtel École Avenida", message: hello });
  };

  const decided = app.status === "validee" || app.status === "refusee";
  const total = f ? f.registration + f.tuition + (program === "CFA" ? fees.suppliesCfa : fees.suppliesDiploma) : 0;
  const academicYear = (() => {
    const d = new Date();
    const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
    return `${y}-${y + 1}`;
  })();

  const review = async (decision: string) => {
    setBusy(true);
    setMsg(null);
    const { error } = await createClient().rpc("review_member_application", { app: app.id, decision, note });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    pingNotifications();
    setMsg({ ok: true, text: decision === "a_completer" ? "Le membre est invité à compléter son dossier." : decision === "en_examen" ? "Dossier marqué « en examen »." : "Avis transmis au Directeur général." });
    if (decision === "a_completer") openMail("a_completer", note);
    onChange();
  };

  const decide = async (decision: "validee" | "refusee" | "a_completer") => {
    if (decision === "validee" && !window.confirm(`Valider le dossier et attribuer le rôle « ${ROLE_CONFIG[role as RoleType]?.label ?? role} » ?`)) return;
    setBusy(true);
    setMsg(null);
    const extra =
      app.kind === "eleve"
        ? { class_name: className, academic_year: academicYear, total_fee: total, registration_fee: f?.registration ?? 0 }
        : { contract_type: contract.contract_type, base_salary: Number(contract.base_salary) || 0, hire_date: contract.hire_date };
    const { data, error } = await createClient().rpc("decide_member_application", { app: app.id, decision, new_role: role, note, extra });
    if (error) {
      setBusy(false);
      return setMsg({ ok: false, text: error.message });
    }
    const res = data as { student_id?: string; employee_id?: string; matricule?: string; children_linked?: number };
    // Carte scolaire ou de travail émise automatiquement
    if (decision === "validee" && user) {
      if (res.student_id) await issueCard({ type: "eleve", id: res.student_id }, user.id);
      if (res.employee_id) await issueCard({ type: "personnel", id: res.employee_id }, user.id);
    }
    setBusy(false);
    pingNotifications();
    openMail(decision, decision === "validee" && res.matricule ? `Votre matricule : ${res.matricule}. ${note}`.trim() : note);
    setMsg({
      ok: true,
      text:
        decision === "validee"
          ? `Dossier validé, rôle attribué${res.matricule ? `, matricule ${res.matricule}` : ""}${res.student_id || res.employee_id ? ", carte émise" : ""}.`
          : decision === "refusee"
            ? "Dossier refusé ; le membre est prévenu."
            : "Le membre est invité à compléter son dossier.",
    });
    onChange();
  };

  const [viewing, setViewing] = useState<ViewableFile | null>(null);
  const asFile = (d: UploadedDoc): ViewableFile => ({ bucket: "documents", path: d.path, name: d.name, label: d.label });
  const openDoc = (d: UploadedDoc, download = false) => (download ? downloadFile(asFile(d)) : setViewing(asFile(d)));

  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6">
      <header className="flex flex-wrap items-start gap-5">
        {app.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo en data URL
          <img src={app.photo} alt="Photo d'identité" className="h-[135px] w-[105px] rounded-lg object-cover ring-1 ring-slate-200" />
        ) : (
          <span className="flex h-[135px] w-[105px] items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">Sans photo</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-widest text-[#E30613] uppercase">{kindLabel(app.kind)}</p>
          <h2 className="text-2xl font-black text-[#0C356A]">
            {String(app.data.last_name ?? "").toUpperCase()} {String(app.data.first_name ?? "")}
          </h2>
          <p className="text-sm text-slate-600">
            {app.profiles?.email} · {String(app.data.phone ?? "")}
          </p>
          {position && (
            <p className="mt-1 text-sm font-semibold text-slate-700">
              Poste : {position.label} · {position.service} ({position.department === "hotel" ? "Hôtel" : position.department === "ecole" ? "École" : "Direction"})
            </p>
          )}
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-3 py-1 text-xs font-bold", STATUS_LABEL[app.status].tone)}>{STATUS_LABEL[app.status].label}</span>
            {app.submitted_at && <span className="text-xs text-slate-500">Envoyé le {new Date(app.submitted_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>}
          </p>
        </div>
        <button type="button" onClick={() => openMail()} className="inline-flex items-center gap-2 rounded-full bg-[#0C356A] px-4 py-2 text-sm font-bold text-white">
          <Mail aria-hidden className="size-4" /> E-mail
        </button>
        <Link href={`/impression/dossier/${app.id}`} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-[#0C356A] hover:bg-slate-50">
          <Printer aria-hidden className="size-4" /> Formulaire complet
        </Link>
      </header>

      {(app.manager_note || app.dg_note) && (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          {app.manager_note && (
            <p>
              <strong>Avis du gestionnaire :</strong> {app.manager_note}
            </p>
          )}
          {app.dg_note && (
            <p>
              <strong>Note du DG :</strong> {app.dg_note}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-100">
        {(["dossier", "documents"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn("border-b-2 px-3 py-2 text-sm font-bold", tab === t ? "border-[#E30613] text-[#E30613]" : "border-transparent text-slate-500")}>
            {t === "dossier" ? "Informations et pièces" : "Classeur du membre"}
          </button>
        ))}
      </div>

      {tab === "dossier" ? (
        <>
          {fieldGroups(app.kind, app.department).map((g) => (
            <section key={g.title}>
              <h3 className="mb-2 text-xs font-bold tracking-widest text-slate-500 uppercase">{g.title}</h3>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {g.fields.map((fd) => {
                  const v = app.data[fd.name];
                  const text = Array.isArray(v) ? v.join(", ") : fd.options?.find((o) => o.value === v)?.label ?? String(v ?? "");
                  return (
                    <div key={fd.name} className={cn(fd.wide && "sm:col-span-2")}>
                      <dt className="text-xs text-slate-500">{fd.label}</dt>
                      <dd className={cn("font-semibold", text ? "text-slate-800" : "text-slate-300")}>{text || "—"}</dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
          <section>
            <h3 className="mb-2 text-xs font-bold tracking-widest text-slate-500 uppercase">Pièces jointes ({app.documents.length})</h3>
            <ul className="flex flex-col gap-2">
              {app.documents.map((d) => (
                <li key={d.path} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <FileText aria-hidden className="size-4 text-slate-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-800">{d.label}</span>
                    <span className="text-xs text-slate-500">
                      {d.name} · {formatSize(d.size)}
                    </span>
                  </span>
                  <button type="button" onClick={() => openDoc(d)} aria-label={`Voir ${d.label}`} className="rounded-full p-2 text-[#0C356A] hover:bg-white">
                    <Eye aria-hidden className="size-4" />
                  </button>
                  <button type="button" onClick={() => openDoc(d, true)} aria-label={`Télécharger ${d.label}`} className="rounded-full p-2 text-[#0C356A] hover:bg-white">
                    <Download aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <ArchiveButton
                kind="dossier_membre"
                title={`Dossier de membre ${String(app.data.last_name ?? "").toUpperCase()} ${String(app.data.first_name ?? "")}`}
                ownerName={name}
                refType="member_application"
                refId={app.id}
                files={app.documents.map(asFile)}
                data={{ statut: app.kind, poste: position?.label, ...app.data }}
              />
            </div>
          </section>
        </>
      ) : (
        user && <DocumentList profileId={app.profile_id} viewerId={user.id} mode="admin" />
      )}

      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={cn("flex items-center gap-2 rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#DC2626]")}>
          {msg.ok ? <CheckCircle2 aria-hidden className="size-4" /> : <XCircle aria-hidden className="size-4" />} {msg.text}
        </p>
      )}

      {app.status === "validee" ? (
        <div className="flex flex-wrap gap-2 rounded-2xl bg-emerald-50 p-4">
          <p className="w-full text-sm font-bold text-emerald-900">
            Rôle attribué : {ROLE_CONFIG[app.assigned_role as RoleType]?.label ?? app.assigned_role}
          </p>
          {app.student_id && (
            <>
              <Link href={`/impression/fiche/${app.student_id}`} target="_blank" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-emerald-200">
                <FileText aria-hidden className="size-4" /> Fiche d&apos;inscription
              </Link>
              <Link href={`/impression/cartes?type=eleve&ids=${app.student_id}`} target="_blank" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-emerald-200">
                <IdCard aria-hidden className="size-4" /> Carte scolaire
              </Link>
              <Link href={`/impression/correspondance?ids=${app.student_id}`} target="_blank" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-emerald-200">
                <ClipboardCheck aria-hidden className="size-4" /> Carte de correspondance
              </Link>
            </>
          )}
          {app.employee_id && (
            <Link href={`/impression/cartes?type=personnel&ids=${app.employee_id}`} target="_blank" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-emerald-200">
              <IdCard aria-hidden className="size-4" /> Carte de travail
            </Link>
          )}
        </div>
      ) : (
        !decided && (
          <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4">
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
              {isDG ? "Note de décision (envoyée au membre si refus ou compléments)" : "Votre avis / message"}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={input} placeholder="Ex. Merci d'ajouter votre dernier bulletin." />
            </label>

            {!isDG ? (
              <div className="flex flex-wrap gap-2">
                {app.status === "soumise" && (
                  <button type="button" disabled={busy} onClick={() => review("en_examen")} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200">
                    Marquer « en examen »
                  </button>
                )}
                <button type="button" disabled={busy} onClick={() => review("a_completer")} className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-900">
                  Demander des compléments
                </button>
                <button type="button" disabled={busy} onClick={() => review("avis_defavorable")} className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-900">
                  <ThumbsDown aria-hidden className="size-4" /> Avis défavorable
                </button>
                <button type="button" disabled={busy} onClick={() => review("avis_favorable")} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
                  <ThumbsUp aria-hidden className="size-4" /> Avis favorable → DG
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                    Rôle attribué
                    <select value={role} onChange={(e) => setRole(e.target.value)} className={input}>
                      {(Object.keys(ROLE_CONFIG) as RoleType[]).filter((r) => r !== "candidat").map((r) => (
                        <option key={r} value={r}>
                          {ROLE_CONFIG[r].label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {app.kind === "eleve" && (
                    <>
                      <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                        Classe
                        <input value={className} onChange={(e) => setClassName(e.target.value)} className={input} />
                      </label>
                      <p className="text-xs text-slate-600 sm:col-span-2">
                        Année {academicYear} · frais annuels {total.toLocaleString("fr-FR")} F (inscription, scolarité, fournitures) · matricule attribué automatiquement par filière.
                      </p>
                    </>
                  )}
                  {["professeur", "personnel", "direction"].includes(app.kind) && (
                    <>
                      <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                        Contrat
                        <select value={contract.contract_type} onChange={(e) => setContract({ ...contract, contract_type: e.target.value })} className={input}>
                          {["CDI", "CDD", "Stage", "Vacation", "Prestation"].map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                        Salaire de base (F CFA)
                        <input type="number" value={contract.base_salary} onChange={(e) => setContract({ ...contract, base_salary: e.target.value })} className={input} />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                        Date d&apos;embauche
                        <input type="date" value={contract.hire_date} onChange={(e) => setContract({ ...contract, hire_date: e.target.value })} className={input} />
                      </label>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => decide("a_completer")} className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-900">
                    Demander des compléments
                  </button>
                  <button type="button" disabled={busy} onClick={() => decide("refusee")} className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-[#DC2626]">
                    <XCircle aria-hidden className="size-4" /> Refuser
                  </button>
                  <button type="button" disabled={busy} onClick={() => decide("validee")} className="inline-flex items-center gap-2 rounded-full bg-[#0C356A] px-5 py-2 text-sm font-bold text-white">
                    {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <UserCheck aria-hidden className="size-4" />}
                    Valider et attribuer le rôle
                  </button>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ShieldCheck aria-hidden className="size-3.5" /> La validation crée la fiche (élève, salarié ou client), le matricule et la carte, et prévient le membre.
                </p>
              </>
            )}
          </div>
        )
      )}
      {mail && app.profiles?.email && (
        <EmailComposer to={[app.profiles.email]} subject={mail.subject} message={mail.message} contextType="member_application" contextId={app.id} link="/espace" onClose={() => setMail(null)} />
      )}
      {viewing && <DocumentViewer file={viewing} onClose={() => setViewing(null)} />}
    </article>
  );
}
