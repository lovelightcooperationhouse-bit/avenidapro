"use client";

import { CheckCircle2, Download, Eye, FileText, Inbox, Loader2, Mail, Phone, Search, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { submitToDG } from "@/lib/validations";
import { formations, fees } from "@/content/site";
import { ArchiveButton } from "@/components/documents/ArchiveButton";
import { DocumentViewer, downloadFile, type ViewableFile } from "@/components/documents/DocumentViewer";
import { EmailComposer } from "@/components/email/EmailComposer";
import { pingNotifications } from "@/lib/notify";
import { toPassportDataUrl } from "@/lib/pdf";
import Link from "next/link";
import { APPLICATION_STATUS, DOC_LABELS, fmtDateTime, type Application, type ApplicationDocument, type ApplicationStatus } from "@/lib/admissions";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFCFA } from "@/lib/utils";

/** Écolage annuel d'une filière : inscription + scolarité + fournitures. */
const totalFor = (code: string) => {
  const f = formations.find((x) => x.code === code);
  return f ? f.registration + f.tuition + (code === "CFA" ? fees.suppliesCfa : fees.suppliesDiploma) : 0;
};

/** Gestion des pré-inscriptions déposées sur le site : étude, décision et création du dossier élève. */
export default function AdmissionsDashboardPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [docs, setDocs] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | "toutes">("toutes");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [enrolled, setEnrolled] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: a }, { data: d }] = await Promise.all([
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
      supabase.from("application_documents").select("*").order("created_at"),
    ]);
    setApps((a ?? []) as Application[]);
    setDocs((d ?? []) as ApplicationDocument[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter(
      (a) =>
        (filter === "toutes" || a.status === filter) &&
        (!q || `${a.first_name} ${a.last_name} ${a.reference} ${a.phone} ${a.email} ${a.program_code} ${a.specialty}`.toLowerCase().includes(q))
    );
  }, [apps, filter, query]);

  const selected = apps.find((a) => a.id === selectedId) ?? null;
  useEffect(() => {
    setNotes(selected?.staff_notes ?? "");
  }, [selected]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { toutes: apps.length };
    apps.forEach((a) => (c[a.status] = (c[a.status] ?? 0) + 1));
    return c;
  }, [apps]);

  const update = async (patch: Partial<Application>, message: string) => {
    if (!selected || !user) return;
    setBusy(true);
    const decision = patch.status && ["acceptee", "refusee"].includes(patch.status) ? { decided_by: user.id, decided_at: new Date().toISOString() } : {};
    const { error } = await createClient().from("applications").update({ ...patch, ...decision }).eq("id", selected.id);
    setBusy(false);
    setFeedback(error ? "Mise à jour impossible." : message);
    load();
    // Décision : e-mail pré-rédigé au candidat et à son parent
    if (!error && patch.status && ["acceptee", "refusee", "pieces_manquantes"].includes(patch.status)) openMail(patch.status);
  };

  const [mail, setMail] = useState<{ subject: string; message: string } | null>(null);
  const openMail = (kind?: string) => {
    if (!selected) return;
    const hello = `Bonjour ${selected.first_name} ${selected.last_name},

`;
    const ref = selected.reference ? ` (référence ${selected.reference})` : "";
    const texts: Record<string, { subject: string; message: string }> = {
      acceptee: {
        subject: "Votre candidature est acceptée – Hôtel École Avenida",
        message: `${hello}Nous avons le plaisir de vous annoncer que votre candidature${ref} en ${selected.program_code} ${selected.specialty} est acceptée.

Pour finaliser votre inscription, présentez-vous au bureau des inscriptions avec les pièces originales et le règlement des frais d'inscription. Vous pouvez suivre votre dossier dans votre espace en ligne.

Bienvenue à l'Hôtel École Avenida !`,
      },
      refusee: {
        subject: "Votre candidature – Hôtel École Avenida",
        message: `${hello}Après étude de votre dossier${ref}, nous ne pouvons malheureusement pas donner une suite favorable à votre candidature pour cette rentrée.

Nous restons à votre disposition pour vous orienter vers une autre formation ou une prochaine rentrée.`,
      },
      pieces_manquantes: {
        subject: "Pièces manquantes à votre dossier – Hôtel École Avenida",
        message: `${hello}Votre dossier de pré-inscription${ref} est incomplet. Merci de nous transmettre les pièces suivantes :

- 

Vous pouvez les déposer dans votre espace en ligne ou les apporter au bureau des inscriptions.`,
      },
    };
    setMail(texts[kind ?? ""] ?? { subject: "Votre dossier de pré-inscription – Hôtel École Avenida", message: hello });
  };

  /**
   * Inscription définitive : la base crée l'élève dans sa filière et sa classe, le matricule,
   * l'écolage (frais de la filière), la carte scolaire, et rattache les comptes de l'élève et du tuteur.
   */
  const enroll = async () => {
    if (!selected) return;
    // Hors DG : l'inscription définitive est soumise au contrôle du Directeur général
    if (user?.role !== "directeur_general") {
      setBusy(true);
      const err = await submitToDG({
        kind: "inscription",
        title: `Inscription définitive de ${selected.last_name.toUpperCase()} ${selected.first_name}`,
        details: `${selected.program_code} · ${selected.specialty} · écolage ${formatFCFA(totalFor(selected.program_code))}`,
        payload: { app: selected.id },
        link: "/dashboard/admissions",
      });
      setBusy(false);
      return setFeedback(err ? "Soumission impossible : " + err.message : "Inscription soumise au Directeur général : il est alerté et vous serez prévenu dès sa validation.");
    }
    setBusy(true);
    const { data, error } = await createClient().rpc("enroll_application", { app: selected.id });
    setBusy(false);
    if (error) return setFeedback("Inscription impossible : " + error.message);
    const r = data as { student_id: string; matricule?: string; total?: number; student_account?: boolean; guardian_account?: boolean };
    setEnrolled(r.student_id);
    // Photo d'identité déposée avec la pré-inscription → fiche d'inscription et carte scolaire
    const photoDoc = docs.find((d) => d.application_id === selected.id && d.doc_type === "photo" && !/\.pdf$/i.test(d.file_name ?? ""));
    if (photoDoc) {
      const { data: file } = await createClient().storage.from("dossiers").download(photoDoc.file_path);
      if (file) await createClient().from("students").update({ photo_url: await toPassportDataUrl(file) }).eq("id", r.student_id);
    }
    pingNotifications();
    setFeedback(
      `Inscription définitive : matricule ${r.matricule}, écolage ${formatFCFA(r.total ?? 0)}, carte scolaire émise.` +
        (r.student_account ? " Compte de l'élève rattaché." : "") +
        (r.guardian_account ? " Compte du tuteur rattaché." : "") +
        " Envoyez maintenant la fiche d'inscription."
    );
    load();
  };

  const [viewing, setViewing] = useState<ViewableFile | null>(null);
  const asFile = (d: ApplicationDocument): ViewableFile => ({ bucket: "dossiers", path: d.file_path, name: d.file_name, label: DOC_LABELS[d.doc_type] ?? d.doc_type });

  const filters: (ApplicationStatus | "toutes")[] = ["toutes", "nouvelle", "en_etude", "pieces_manquantes", "acceptee", "refusee", "inscrite"];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#0C356A]">Pré-inscriptions en ligne</h1>
        <p className="mt-1 text-sm text-slate-600">Dossiers déposés sur le site public : étudiez, demandez des pièces, décidez et créez le dossier élève.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition-colors",
              filter === f ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200 hover:ring-[#0C356A]"
            )}
          >
            {f === "toutes" ? "Toutes" : APPLICATION_STATUS[f].label} ({counts[f] ?? 0})
          </button>
        ))}
        <label className="relative ml-auto w-full sm:w-72">
          <span className="sr-only">Rechercher</span>
          <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, référence, téléphone…" className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-[#0C356A]" />
        </label>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* Liste */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <p className="flex items-center gap-2 p-6 text-sm text-slate-500">
              <Loader2 aria-hidden className="size-4 animate-spin" /> Chargement…
            </p>
          ) : visible.length === 0 ? (
            <p className="flex flex-col items-center gap-2 p-10 text-center text-sm text-slate-500">
              <Inbox aria-hidden className="size-8 text-slate-300" />
              Aucune pré-inscription pour ce filtre.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visible.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(a.id);
                      setFeedback("");
                    }}
                    className={cn("flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-slate-50", selectedId === a.id && "bg-blue-50/60")}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-slate-900">
                        {a.last_name.toUpperCase()} {a.first_name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {a.reference} · {a.program_code} {a.specialty} · {fmtDateTime(a.created_at)}
                      </span>
                    </span>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1", APPLICATION_STATUS[a.status].tone)}>{APPLICATION_STATUS[a.status].label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Fiche */}
        {selected ? (
          <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Dossier {selected.reference}</p>
                <h2 className="text-xl font-black text-[#0C356A]">
                  {selected.last_name.toUpperCase()} {selected.first_name}
                </h2>
                <p className="text-sm font-semibold text-[#DC2626]">
                  {selected.program_code} · {selected.specialty} · rentrée du {selected.intake} · cours du {selected.schedule}
                  {selected.boarding ? " · interne" : ""}
                </p>
              </div>
              <span className={cn("rounded-full px-3 py-1.5 text-xs font-bold ring-1", APPLICATION_STATUS[selected.status].tone)}>{APPLICATION_STATUS[selected.status].label}</span>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-200">
                <Phone aria-hidden className="size-4" /> {selected.phone}
              </a>
              <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-200">
                <Mail aria-hidden className="size-4" /> {selected.email}
              </a>
            </div>

            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["Sexe", selected.gender === "F" ? "Féminin" : selected.gender === "M" ? "Masculin" : "—"],
                ["Naissance", [selected.birth_date && new Date(selected.birth_date).toLocaleDateString("fr-FR"), selected.birth_place].filter(Boolean).join(" à ") || "—"],
                ["Nationalité", selected.nationality ?? "—"],
                ["Quartier", selected.neighborhood ?? "—"],
                ["Dernière classe", selected.last_class ?? "—"],
                ["Dernier diplôme", selected.last_diploma ?? "—"],
                ["Établissement précédent", selected.previous_school ?? "—"],
                ["Parent / tuteur", selected.guardian_name ? `${selected.guardian_name} (${selected.guardian_relation ?? "—"})` : "—"],
                ["Téléphone parent", selected.guardian_phone ?? "—"],
                ["E-mail parent", selected.guardian_email ?? "—"],
                ["Profession parent", selected.guardian_profession ?? "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-bold text-slate-500">{k}</dt>
                  <dd className="font-semibold text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
            {selected.message && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">« {selected.message} »</p>}

            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-black text-[#0C356A]">
                <FileText aria-hidden className="size-4" /> Pièces jointes
              </h3>
              {docs.filter((d) => d.application_id === selected.id).length ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {docs
                    .filter((d) => d.application_id === selected.id)
                    .map((d) => (
                      <li key={d.id} className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                        <button type="button" onClick={() => setViewing(asFile(d))} className="min-w-0 flex-1 text-left">
                          <span className="block font-bold text-slate-800 hover:text-[#E30613]">{DOC_LABELS[d.doc_type] ?? d.doc_type}</span>
                          <span className="block truncate text-xs text-slate-500">{d.file_name}</span>
                        </button>
                        <button type="button" onClick={() => setViewing(asFile(d))} aria-label={`Voir ${d.file_name}`} title="Voir" className="rounded-full p-1.5 text-[#0C356A] hover:bg-slate-100 hover:text-[#E30613]">
                          <Eye aria-hidden className="size-4" />
                        </button>
                        <button type="button" onClick={() => downloadFile(asFile(d))} aria-label={`Télécharger ${d.file_name}`} title="Télécharger" className="rounded-full p-1.5 text-[#0C356A] hover:bg-slate-100 hover:text-[#E30613]">
                          <Download aria-hidden className="size-4" />
                        </button>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Aucune pièce déposée en ligne.</p>
              )}
              <div className="mt-3">
                <ArchiveButton
                  kind="preinscription"
                  title={`Pré-inscription ${selected.last_name.toUpperCase()} ${selected.first_name}`}
                  ownerName={`${selected.last_name.toUpperCase()} ${selected.first_name}`}
                  reference={selected.reference ?? undefined}
                  refType="application"
                  refId={selected.id}
                  files={docs.filter((d) => d.application_id === selected.id).map(asFile)}
                  data={{ ...selected }}
                />
              </div>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-bold text-[#0C356A]">
              Notes internes (non visibles par le candidat)
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="rounded-xl border border-slate-200 p-3 font-normal text-slate-800 outline-none focus:border-[#0C356A]" />
            </label>

            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => update({ staff_notes: notes || null }, "Notes enregistrées.")} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
                Enregistrer les notes
              </button>
              <button type="button" onClick={() => openMail()} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0C356A] px-4 py-2 text-sm font-bold text-white hover:bg-[#072042]">
                <Mail aria-hidden className="size-4" /> Écrire par e-mail
              </button>
              {selected.status !== "inscrite" && (<>
              <button type="button" disabled={busy} onClick={() => update({ status: "en_etude" }, "Dossier passé en étude.")} className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-900 hover:bg-amber-200">
                En étude
              </button>
              <button type="button" disabled={busy} onClick={() => update({ status: "pieces_manquantes" }, "Le candidat voit qu'il manque des pièces.")} className="rounded-xl bg-orange-100 px-4 py-2 text-sm font-bold text-orange-900 hover:bg-orange-200">
                Pièces manquantes
              </button>
              <button type="button" disabled={busy} onClick={() => update({ status: "acceptee" }, "Candidature acceptée.")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                Accepter
              </button>
              <button type="button" disabled={busy} onClick={() => update({ status: "refusee" }, "Candidature non retenue.")} className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-800 hover:bg-red-200">
                Ne pas retenir
              </button>
              </>)}
            </div>

            {selected.status === "acceptee" && (
              <button type="button" disabled={busy} onClick={enroll} className="flex items-center justify-center gap-2 rounded-xl bg-[#0C356A] px-4 py-3 text-sm font-bold text-white hover:bg-[#072042]">
                {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <UserPlus aria-hidden className="size-4" />}
                {user?.role === "directeur_general" ? "Valider l'inscription définitive" : "Soumettre l'inscription définitive au DG"} (écolage {formatFCFA(totalFor(selected.program_code))})
              </button>
            )}

            {(enrolled || selected.student_id) && (
              <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3">
                <Link href={`/impression/fiche/${enrolled ?? selected.student_id}`} target="_blank" className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-4 py-2 text-sm font-bold text-white">
                  <FileText aria-hidden className="size-4" /> Fiche d&apos;inscription : imprimer, télécharger, envoyer
                </Link>
                <Link href={`/dashboard/recherche?q=${encodeURIComponent(selected.last_name)}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200">
                  Dossier de l&apos;élève
                </Link>
              </div>
            )}

            {feedback && (
              <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                <CheckCircle2 aria-hidden className="size-4" /> {feedback}
              </p>
            )}
          </div>
        ) : (
          <div className="hidden items-center justify-center rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 xl:flex">
            Sélectionnez une pré-inscription pour afficher le dossier complet.
          </div>
        )}
      </div>
      {mail && selected && (
        <EmailComposer
          to={[selected.email, selected.guardian_email ?? ""]}
          subject={mail.subject}
          message={mail.message}
          contextType="application"
          contextId={selected.id}
          link="/espace"
          onClose={() => setMail(null)}
        />
      )}
      {viewing && <DocumentViewer file={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
