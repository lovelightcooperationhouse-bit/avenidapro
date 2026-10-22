"use client";

import { ArrowRight, GraduationCap, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CandidateApplications } from "@/components/espace/CandidateApplications";
import { StudentFile } from "@/components/espace/StudentFile";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

type StudentRef = { id: string; first_name: string; last_name: string; class_name: string | null };

export default function EspacePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm font-bold tracking-widest text-vif uppercase">{user.roleLabel}</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-avenida-blue sm:text-4xl">Bonjour {user.fullName.split(" ")[0]} 👋</h1>
        <p className="mt-2 text-slate-600">{user.roleDescription}</p>
      </div>

      {user.home === "/dashboard" && (
        <Link href="/dashboard" className="flex items-center justify-between gap-4 rounded-3xl bg-avenida-blue p-6 text-white shadow-lg">
          <span className="flex items-center gap-3 font-bold">
            <LayoutDashboard aria-hidden className="size-6" />
            Ouvrir l&apos;espace de gestion
          </span>
          <ArrowRight aria-hidden className="size-5" />
        </Link>
      )}

      {user.role === "eleve" &&
        (user.studentId ? <StudentFile studentId={user.studentId} /> : <Pending text="Votre compte n'est pas encore rattaché à votre dossier d'élève. L'administration va le faire rapidement." />)}

      {user.role === "parent" && <ParentView />}
      {user.role === "professeur" && <TeacherView />}
      {user.role === "candidat" && <CandidateApplications />}
    </div>
  );
}

function Pending({ text }: { text: string }) {
  return <p className="rounded-3xl bg-amber-50 p-6 text-amber-900 ring-1 ring-amber-200">{text}</p>;
}

/** Parent : un onglet par enfant rattaché. */
function ParentView() {
  const { user } = useAuth();
  const [children, setChildren] = useState<StudentRef[] | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("parent_students")
      .select("student_id, students(id, first_name, last_name, class_name)")
      .eq("parent_id", user.id)
      .then(({ data }) => {
        const list = (data ?? []).map((r) => r.students as unknown as StudentRef).filter(Boolean);
        setChildren(list);
        setActive(list[0]?.id ?? null);
      });
  }, [user]);

  if (!children) return <div className="h-40 animate-pulse rounded-3xl bg-white" />;
  if (!children.length) return <Pending text="Aucun enfant n'est encore rattaché à votre compte. Contactez le secrétariat pour lier votre compte au dossier de votre enfant." />;

  return (
    <div className="flex flex-col gap-5">
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Mes enfants">
          {children.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active === c.id}
              onClick={() => setActive(c.id)}
              className={active === c.id ? "rounded-full bg-vif px-4 py-2 text-sm font-bold text-white" : "rounded-full bg-white px-4 py-2 text-sm font-bold text-avenida-blue ring-1 ring-slate-200"}
            >
              {c.first_name} {c.last_name}
            </button>
          ))}
        </div>
      )}
      {active && <StudentFile key={active} studentId={active} />}
    </div>
  );
}

/** Professeur : classes attribuées et élèves correspondants. */
function TeacherView() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<{ class_name: string; subject: string | null }[] | null>(null);
  const [students, setStudents] = useState<StudentRef[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("teacher_assignments").select("class_name, subject").eq("teacher_id", user.id);
      setClasses(data ?? []);
      const names = [...new Set((data ?? []).map((d) => d.class_name))];
      if (names.length) {
        const { data: s } = await supabase.from("students").select("id, first_name, last_name, class_name").in("class_name", names).order("last_name");
        setStudents(s ?? []);
      }
    })();
  }, [user]);

  if (!classes) return <div className="h-40 animate-pulse rounded-3xl bg-white" />;
  if (!classes.length) return <Pending text="Aucune classe ne vous est encore attribuée. La direction pédagogique va configurer vos classes." />;
  if (selected) {
    return (
      <div className="flex flex-col gap-4">
        <button type="button" onClick={() => setSelected(null)} className="w-fit text-sm font-bold text-vif hover:underline">
          ← Retour à mes classes
        </button>
        <StudentFile studentId={selected} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {classes.map((c) => (
        <section key={`${c.class_name}-${c.subject}`} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-avenida-blue">
            <GraduationCap aria-hidden className="size-5 text-vif" />
            {c.class_name}
          </h2>
          {c.subject && <p className="text-sm text-slate-500">{c.subject}</p>}
          <ul className="mt-3 divide-y divide-slate-100">
            {students
              .filter((s) => s.class_name === c.class_name)
              .map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => setSelected(s.id)} className="flex w-full items-center justify-between py-3 text-left hover:text-vif">
                    <span className="font-semibold">
                      {s.last_name} {s.first_name}
                    </span>
                    <ArrowRight aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Users aria-hidden className="size-3.5" />
            {students.filter((s) => s.class_name === c.class_name).length} élève(s)
          </p>
        </section>
      ))}
    </div>
  );
}

