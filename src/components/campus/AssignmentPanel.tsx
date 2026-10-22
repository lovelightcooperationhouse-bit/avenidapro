"use client";

import { CheckCircle2, Loader2, Paperclip, Send } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo, uploadToSpace, type Person, type SpacePost, type Submission } from "@/lib/spaces";
import { AttachmentView } from "./AttachmentView";

/**
 * Sous un devoir : l'élève dépose sa copie (texte + fichiers) ;
 * le responsable voit toutes les copies et saisit note / appréciation.
 */
export function AssignmentPanel({
  post,
  submissions,
  people,
  isResponsable,
  userId,
  onChanged,
}: {
  post: SpacePost;
  submissions: Submission[];
  people: Record<string, Person>;
  isResponsable: boolean;
  userId: string;
  onChanged: () => void;
}) {
  const mine = submissions.find((s) => s.student_id === userId);
  const [body, setBody] = useState(mine?.body ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    setBusy(true);
    setMessage("");
    try {
      const attachments = [...(mine?.attachments ?? [])];
      for (const f of files) attachments.push(await uploadToSpace(post.space_id, `devoirs/${post.id}`, f, f.name));
      const supabase = createClient();
      const { error } = mine
        ? await supabase.from("assignment_submissions").update({ body: body.trim() || null, attachments, submitted_at: new Date().toISOString() }).eq("id", mine.id)
        : await supabase.from("assignment_submissions").insert({ post_id: post.id, student_id: userId, body: body.trim() || null, attachments });
      if (error) throw error;
      setFiles([]);
      setMessage("Copie déposée.");
      onChanged();
    } catch {
      setMessage("Dépôt impossible, réessayez.");
    } finally {
      setBusy(false);
    }
  };

  if (isResponsable) {
    const expected = Object.values(people).filter((p) => p.role === "eleve").length;
    return (
      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-bold text-avenida-blue-950">
          Copies reçues : {submissions.length}
          {expected ? ` / ${expected}` : ""}
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {submissions.map((s) => (
            <GradeRow key={s.id} submission={s} name={people[s.student_id]?.full_name ?? "Élève"} onSaved={onChanged} />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
      {mine && (
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
          <CheckCircle2 aria-hidden className="size-4" />
          Copie déposée {timeAgo(mine.submitted_at)}
          {mine.grade !== null && <span className="ml-auto rounded-full bg-avenida-blue px-3 py-1 text-white">Note : {mine.grade}/20</span>}
        </p>
      )}
      {mine?.feedback && <p className="mb-3 rounded-xl bg-white p-3 text-sm text-slate-700">Appréciation du professeur : « {mine.feedback} »</p>}
      {mine?.attachments.length ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {mine.attachments.map((a) => (
            <AttachmentView key={a.path} file={a} compact />
          ))}
        </div>
      ) : null}
      {mine?.grade === null || !mine ? (
        <div className="flex flex-col gap-3">
          <label htmlFor={`copie-${post.id}`} className="text-sm font-bold text-avenida-blue-950">
            {mine ? "Modifier ma copie" : "Rendre mon devoir"}
          </label>
          <textarea id={`copie-${post.id}`} value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-avenida-blue" placeholder="Votre réponse…" />
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-avenida-blue ring-1 ring-slate-200 hover:ring-vif has-[:focus-visible]:ring-2">
              <Paperclip aria-hidden className="size-4" />
              {files.length ? `${files.length} fichier(s)` : "Joindre (photo, PDF…)"}
              <input type="file" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
            </label>
            <button type="button" disabled={busy || (!body.trim() && !files.length)} onClick={submit} className="ml-auto inline-flex items-center gap-2 rounded-full bg-vif px-5 py-2 text-sm font-bold text-white hover:bg-vif-fonce disabled:opacity-50">
              {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
              Déposer
            </button>
          </div>
          {message && <p className="text-sm font-semibold text-avenida-blue">{message}</p>}
        </div>
      ) : null}
    </div>
  );
}

function GradeRow({ submission, name, onSaved }: { submission: Submission; name: string; onSaved: () => void }) {
  const [grade, setGrade] = useState(submission.grade?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saved, setSaved] = useState(false);

  const save = async () => {
    const g = grade === "" ? null : Math.max(0, Math.min(20, Number(grade.replace(",", "."))));
    const { error } = await createClient().from("assignment_submissions").update({ grade: g, feedback: feedback.trim() || null }).eq("id", submission.id);
    if (!error) {
      setSaved(true);
      onSaved();
    }
  };

  return (
    <li className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-sm font-bold text-slate-800">
        {name} <span className="font-normal text-slate-500">· {timeAgo(submission.submitted_at)}</span>
      </p>
      {submission.body && <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">{submission.body}</p>}
      {submission.attachments.length > 0 && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {submission.attachments.map((a) => (
            <AttachmentView key={a.path} file={a} compact />
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-sm font-bold text-avenida-blue-950">
          Note
          <input value={grade} onChange={(e) => setGrade(e.target.value)} inputMode="decimal" className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" placeholder="/20" />
        </label>
        <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Appréciation" aria-label={`Appréciation pour ${name}`} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
        <button type="button" onClick={save} className="rounded-lg bg-avenida-blue px-3 py-1.5 text-sm font-bold text-white hover:bg-avenida-blue-950">
          {saved ? "Enregistré ✓" : "Enregistrer"}
        </button>
      </div>
    </li>
  );
}
