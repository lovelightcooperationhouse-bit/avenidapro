"use client";

import { ArrowLeft, CheckCircle2, ClipboardCheck, Eye, FileSpreadsheet, FileText, FolderOpen, IdCard as IdCardIcon, Loader2, Printer, Receipt, Save, Send, UserRound, Wallet } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { situationStatus } from "@/components/cards/SituationSheet";
import { IdCard } from "@/components/cards/IdCard";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentViewer, downloadFile, type ViewableFile } from "@/components/documents/DocumentViewer";
import { AttendanceView } from "@/components/espace/AttendanceView";
import { useAuth } from "@/context/AuthContext";
import { DOC_LABELS } from "@/lib/admissions";
import { CARD_REVIEW, issueCard, STUDENT_CARD_COLS, studentCardData, type CardRow, type StudentRow } from "@/lib/cards";
import { pingNotifications } from "@/lib/notify";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFCFA } from "@/lib/utils";

type Tab = "infos" | "paiements" | "documents" | "bulletins" | "carte" | "assiduite";
type Student = StudentRow & Record<string, unknown>;
type Card = CardRow & { review_status: string; review_note: string | null; reviewed_at: string | null };


const FIELDS: { k: string; label: string; type?: string; options?: string[] }[] = [
  { k: "last_name", label: "Nom" },
  { k: "first_name", label: "Prénom(s)" },
  { k: "gender", label: "Sexe", options: ["M", "F"] },
  { k: "birth_date", label: "Date de naissance", type: "date" },
  { k: "birth_place", label: "Lieu de naissance" },
  { k: "nationality", label: "Nationalité" },
  { k: "phone", label: "Téléphone" },
  { k: "email", label: "E-mail" },
  { k: "address", label: "Adresse" },
  { k: "residence_neighborhood", label: "Quartier" },
  { k: "city", label: "Ville" },
  { k: "class_name", label: "Classe" },
  { k: "specialty", label: "Spécialité" },
  { k: "boarder_status", label: "Régime", options: ["externe", "interne"] },
  { k: "tutor_name", label: "Tuteur / parent" },
  { k: "tutor_phone", label: "Téléphone du tuteur" },
  { k: "guardian_email", label: "E-mail du tuteur" },
  { k: "tutor_relation", label: "Lien avec l'élève" },
  { k: "emergency_contact_name", label: "Contact d'urgence" },
  { k: "emergency_contact_phone", label: "Téléphone d'urgence" },
  { k: "blood_group", label: "Groupe sanguin" },
  { k: "allergies", label: "Allergies" },
];

/** Dossier complet de l'élève : informations, paiements et situation, documents, bulletins, carte, assiduité. */
export default function DossierElevePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [s, setS] = useState<Student | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("infos");

  const load = useCallback(async () => {
    const { data } = await createClient().from("students").select("*").eq("id", id).maybeSingle();
    setS((data as Student) ?? null);
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  if (s === undefined) return <Loader2 aria-label="Chargement" className="size-6 animate-spin text-[#0C356A]" />;
  if (!s) return <p className="rounded-2xl bg-red-50 p-6 text-[#B8000F]">Élève introuvable.</p>;
  const status = situationStatus(s);
  const photo = s.photo_url && !String(s.photo_url).includes("default") ? String(s.photo_url) : null;

  const TABS: { k: Tab; label: string; icon: typeof UserRound }[] = [
    { k: "infos", label: "Informations", icon: UserRound },
    { k: "paiements", label: "Paiements et situation", icon: Wallet },
    { k: "documents", label: "Documents", icon: FolderOpen },
    { k: "bulletins", label: "Bulletins", icon: FileSpreadsheet },
    { k: "carte", label: "Carte scolaire", icon: IdCardIcon },
    { k: "assiduite", label: "Assiduité", icon: ClipboardCheck },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Link href="/dashboard/eleves" className="inline-flex items-center gap-1.5 self-start text-sm font-bold text-[#0C356A] hover:text-[#E30613]">
        <ArrowLeft aria-hidden className="size-4" /> Élèves par filière
      </Link>

      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo d'identité
          <img src={photo} alt="" className="h-24 w-[72px] rounded-lg object-cover ring-1 ring-slate-200" />
        ) : (
          <span className="flex h-24 w-[72px] items-center justify-center rounded-lg bg-slate-100 text-slate-400">
            <UserRound aria-hidden className="size-8" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-bold text-[#E30613]">{s.registration_number}</p>
          <h1 className="text-2xl font-black text-[#0C356A]">
            {String(s.last_name).toUpperCase()} {s.first_name}
          </h1>
          <p className="text-sm text-slate-600">
            {s.class_name} · {s.program_code} · {s.academic_year}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: status.bg, color: status.tone }}>
            {status.label}
          </span>
          <span className="text-sm text-slate-600">
            Payé {formatFCFA(Number(s.paid_fee ?? 0))} · reste <strong className="text-[#B8000F]">{formatFCFA(Number(s.remaining_fee ?? 0))}</strong>
          </span>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Rubriques du dossier">
        {TABS.map((t) => (
          <button key={t.k} type="button" onClick={() => setTab(t.k)} className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-1", tab === t.k ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200 hover:text-[#E30613]")}>
            <t.icon aria-hidden className="size-4" /> {t.label}
          </button>
        ))}
      </nav>

      {tab === "infos" && <Infos s={s} onSaved={load} />}
      {tab === "paiements" && <Paiements s={s} />}
      {tab === "documents" && user && <Documents s={s} viewerId={user.id} />}
      {tab === "bulletins" && <Bulletins studentId={s.id} />}
      {tab === "carte" && <Carte s={s} />}
      {tab === "assiduite" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <AttendanceView studentId={s.id} />
        </div>
      )}
    </div>
  );
}

function Infos({ s, onSaved }: { s: Student; onSaved: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState<Record<string, string>>(() => Object.fromEntries(FIELDS.map((f) => [f.k, String(s[f.k] ?? "")])));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async (updateCard: boolean) => {
    setBusy(true);
    const patch = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : k === "last_name" ? v.trim().toUpperCase() : v.trim()]));
    const { error } = await createClient().from("students").update(patch).eq("id", s.id);
    if (!error && updateCard && user) await issueCard({ type: "eleve", id: s.id }, user.id);
    setBusy(false);
    setMsg(error ? "Enregistrement impossible : " + error.message : updateCard ? "Informations enregistrées et carte mise à jour (nouvelle version). Envoyez-la pour vérification dans l'onglet « Carte scolaire »." : "Informations enregistrées.");
    if (!error) onSaved();
  };

  const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0C356A]";
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-600">Corrigez ici toute erreur : la fiche d&apos;inscription, la fiche de situation et la carte reprennent ces informations.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((f) => (
          <label key={f.k} className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            {f.label}
            {f.options ? (
              <select value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} className={input}>
                <option value="">—</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o === "M" ? "Masculin" : o === "F" ? "Féminin" : o}
                  </option>
                ))}
              </select>
            ) : (
              <input type={f.type ?? "text"} value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} className={input} />
            )}
          </label>
        ))}
      </div>
      {msg && <p className="text-sm font-semibold text-emerald-700">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => save(false)} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#0C356A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#E30613] disabled:opacity-60">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />} Enregistrer
        </button>
        <button type="button" onClick={() => save(true)} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          <IdCardIcon aria-hidden className="size-4" /> Enregistrer et mettre à jour la carte
        </button>
        <Link href={`/impression/fiche/${s.id}`} target="_blank" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200 hover:text-[#E30613]">
          <FileText aria-hidden className="size-4" /> Fiche d&apos;inscription
        </Link>
      </div>
    </section>
  );
}

type Pay = { id: string; receipt_number: string | null; amount: number; payment_date: string | null; created_at: string; designation: string | null; payment_method: string | null };

function Paiements({ s }: { s: Student }) {
  const [rows, setRows] = useState<Pay[] | null>(null);
  useEffect(() => {
    createClient()
      .from("fee_payments")
      .select("id, receipt_number, amount, payment_date, created_at, designation, payment_method")
      .in("student_id", [s.id, s.registration_number, s.student_number].filter(Boolean) as string[])
      .order("payment_date", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as Pay[]));
  }, [s]);
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Écolage annuel", formatFCFA(Number(s.total_fee ?? 0)), "text-[#0C356A]"],
          ["Total payé", formatFCFA(Number(s.paid_fee ?? 0)), "text-emerald-700"],
          ["Reste à payer", formatFCFA(Number(s.remaining_fee ?? 0)), "text-[#B8000F]"],
        ].map(([l, v, t]) => (
          <div key={l} className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-500">{l}</p>
            <p className={cn("text-xl font-black", t)}>{v}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/impression/situation/${s.id}`} target="_blank" className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white">
          <Wallet aria-hidden className="size-4" /> Fiche de situation financière
        </Link>
        <Link href="/dashboard/ecolage" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200 hover:text-[#E30613]">
          Encaisser un paiement (Écolage)
        </Link>
      </div>
      <h3 className="text-sm font-black text-[#0C356A]">Reçus</h3>
      {rows === null ? (
        <Loader2 aria-label="Chargement" className="size-5 animate-spin" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun paiement enregistré.</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-2">
              <Receipt aria-hidden className="size-4 text-slate-400" />
              <span className="font-mono text-xs">{p.receipt_number}</span>
              <span>{new Date(p.payment_date ?? p.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
              <span className="font-bold text-emerald-700">{formatFCFA(Number(p.amount))}</span>
              <span className="text-slate-500">
                {p.designation} · {p.payment_method}
              </span>
              <Link href={`/impression/recu/${p.id}`} target="_blank" className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-[#0C356A] hover:text-[#E30613]">
                <Printer aria-hidden className="size-3.5" /> Reçu
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Documents({ s, viewerId }: { s: Student; viewerId: string }) {
  const [appDocs, setAppDocs] = useState<ViewableFile[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; label: string }[]>([]);
  const [archives, setArchives] = useState<{ id: string; title: string; files: { path: string; name: string; label?: string }[] }[]>([]);
  const [viewing, setViewing] = useState<ViewableFile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      if (s.application_id) {
        const { data } = await supabase.from("application_documents").select("doc_type, file_path, file_name").eq("application_id", String(s.application_id));
        setAppDocs((data ?? []).map((d) => ({ bucket: "dossiers", path: d.file_path, name: d.file_name, label: DOC_LABELS[d.doc_type] ?? d.doc_type })));
      }
      const [{ data: me }, { data: parents }, { data: arch }] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name").eq("student_id", s.id),
        supabase.from("parent_students").select("parent_id, profiles!parent_students_parent_id_fkey(first_name, last_name)").eq("student_id", s.id),
        supabase.from("archives").select("id, title, files").or(`reference.eq.${s.registration_number},owner_name.ilike.%${String(s.last_name)}%`).order("created_at", { ascending: false }),
      ]);
      setProfiles([
        ...(me ?? []).map((p) => ({ id: p.id, label: `Élève · ${p.first_name ?? ""} ${p.last_name ?? ""}` })),
        ...(parents ?? []).map((p) => {
          const pr = p.profiles as unknown as { first_name: string | null; last_name: string | null } | null;
          return { id: p.parent_id as string, label: `Parent · ${pr?.first_name ?? ""} ${pr?.last_name ?? ""}` };
        }),
      ]);
      setArchives((arch ?? []) as typeof archives);
    })();
  }, [s]);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-black text-[#0C356A]">Pièces de la pré-inscription</h3>
        {appDocs.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune pièce en ligne.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {appDocs.map((d) => (
              <li key={d.path} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <FileText aria-hidden className="size-4 text-slate-400" />
                <span className="min-w-0 flex-1 truncate">
                  <strong>{d.label}</strong> · {d.name}
                </span>
                <button type="button" onClick={() => setViewing(d)} aria-label="Voir" className="rounded-full p-1.5 text-[#0C356A] hover:text-[#E30613]">
                  <Eye aria-hidden className="size-4" />
                </button>
                <button type="button" onClick={() => downloadFile(d)} aria-label="Télécharger" className="rounded-full p-1.5 text-[#0C356A] hover:text-[#E30613]">
                  <Receipt aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {profiles.map((p) => (
        <section key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-black text-[#0C356A]">Classeur en ligne · {p.label}</h3>
          <DocumentList profileId={p.id} viewerId={viewerId} mode="admin" />
        </section>
      ))}
      {profiles.length === 0 && <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Aucun compte en ligne rattaché à cet élève ou à ses parents : les documents ne peuvent pas encore être envoyés dans leur espace.</p>}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-black text-[#0C356A]">Archives ({archives.length})</h3>
        {archives.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune archive pour cet élève.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {archives.map((a) => (
              <li key={a.id} className="rounded-xl bg-slate-50 p-3">
                <p className="font-bold text-slate-800">{a.title}</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {a.files.map((f) => (
                    <li key={f.path}>
                      <button type="button" onClick={() => setViewing({ bucket: "archives", path: f.path, name: f.name, label: f.label })} className="text-xs font-bold text-[#0C356A] hover:text-[#E30613]">
                        {f.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
      {viewing && <DocumentViewer file={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function Bulletins({ studentId }: { studentId: string }) {
  const [rows, setRows] = useState<{ id: string; period: string | null; academic_year: string | null; general_average: number | null; rank_display: string | null; published: boolean }[] | null>(null);
  useEffect(() => {
    createClient()
      .from("report_cards")
      .select("id, period, academic_year, general_average, rank_display, published")
      .eq("student_id", studentId)
      .order("term")
      .then(({ data }) => setRows(data ?? []));
  }, [studentId]);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      {rows === null ? (
        <Loader2 aria-label="Chargement" className="size-5 animate-spin" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun bulletin. Saisissez les notes dans « Notes & bulletins ».</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-2">
              <span className="font-bold text-slate-800">
                {r.period} · {r.academic_year}
              </span>
              <span className="font-black text-[#0C356A]">{Number(r.general_average).toFixed(2)}/20</span>
              <span className="text-slate-500">rang {r.rank_display}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", r.published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>{r.published ? "Publié" : "À vérifier"}</span>
              <Link href={`/impression/bulletin/${r.id}`} target="_blank" className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-[#0C356A] hover:text-[#E30613]">
                <Printer aria-hidden className="size-3.5" /> Voir
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Carte({ s }: { s: Student }) {
  const { user } = useAuth();
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: c }, { data: st }] = await Promise.all([supabase.from("id_cards").select("*").eq("student_id", s.id).maybeSingle(), supabase.from("students").select(STUDENT_CARD_COLS).eq("id", s.id).maybeSingle()]);
    setCard((c as Card) ?? null);
    setStudent(st as StudentRow | null);
  }, [s.id]);
  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    setInfo(error ? error.message : ok);
    pingNotifications();
    load();
  };

  if (card === undefined) return <Loader2 aria-label="Chargement" className="size-6 animate-spin" />;
  if (!card || !student)
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-3 text-sm text-slate-600">Aucune carte émise pour cet élève.</p>
        <button type="button" onClick={async () => user && (await issueCard({ type: "eleve", id: s.id }, user.id), load())} className="rounded-full bg-[#0C356A] px-5 py-2.5 text-sm font-bold text-white">
          Émettre la carte
        </button>
      </section>
    );
  const r = CARD_REVIEW[card.review_status] ?? CARD_REVIEW.brouillon;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn("rounded-full px-3 py-1 text-sm font-bold", r.tone)}>{r.label}</span>
        {card.review_note && <span className="text-sm text-slate-600">Message : « {card.review_note} »</span>}
      </div>
      <IdCard data={studentCardData(student, card)} />
      <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-bold text-[#0C356A]">Vérification par l&apos;élève et sa famille</p>
        <p className="text-xs text-slate-600">
          Envoyez la carte pour vérification : l&apos;élève et ses parents la contrôlent dans leur espace et confirment, ou signalent une erreur. Corrigez si besoin dans
          « Informations », puis validez : la carte arrive dans leur espace et par e-mail.
        </p>
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message joint (facultatif)" aria-label="Message joint" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => run(() => createClient().rpc("request_card_review", { card: card.id, message }), "Carte envoyée pour vérification : la famille est prévenue.")} className="inline-flex items-center gap-2 rounded-full bg-[#0C356A] px-4 py-2 text-sm font-bold text-white hover:bg-[#E30613]">
            <Send aria-hidden className="size-4" /> Envoyer pour vérification
          </button>
          <button type="button" disabled={busy} onClick={() => run(() => createClient().rpc("validate_card", { card: card.id }), "Carte validée et envoyée dans l'espace de l'élève et de ses parents.")} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-4 py-2 text-sm font-bold text-white">
            <CheckCircle2 aria-hidden className="size-4" /> Valider et envoyer
          </button>
          <Link href={`/impression/cartes?type=eleve&ids=${s.id}`} target="_blank" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200 hover:text-[#E30613]">
            <Printer aria-hidden className="size-4" /> Imprimer / PDF
          </Link>
        </div>
        {info && <p className="text-sm font-semibold text-emerald-700">{info}</p>}
      </div>
    </section>
  );
}
