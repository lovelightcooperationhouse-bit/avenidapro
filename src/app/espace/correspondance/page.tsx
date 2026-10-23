"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AccessSlipList } from "@/components/cards/AccessSlipSheet";
import { AttendanceView } from "@/components/espace/AttendanceView";
import { PermissionForm } from "@/components/espace/PermissionForm";
import { RollCall } from "@/components/espace/RollCall";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Child = { id: string; first_name: string; last_name: string; class_name: string | null; registration_number: string | null };

/** Fiche de correspondance : présences, retards et permissions (élève, parent) ou appel du jour (professeur). */
export default function CorrespondancePage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [classes, setClasses] = useState<string[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    if (user.role === "parent") {
      supabase
        .from("parent_students")
        .select("students(id, first_name, last_name, class_name, registration_number)")
        .eq("parent_id", user.id)
        .then(({ data }) => {
          const list = (data ?? []).map((r) => r.students as unknown as Child).filter(Boolean);
          setChildren(list);
          setActive(list[0]?.id ?? null);
        });
    }
    if (user.role === "professeur") {
      supabase
        .from("teacher_assignments")
        .select("class_name")
        .eq("teacher_id", user.id)
        .then(({ data }) => setClasses([...new Set((data ?? []).map((d) => d.class_name))]));
    }
  }, [user]);

  // Recherche d'un enfant par nom, prénom ou matricule
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (children ?? []).filter((c) => !q || `${c.first_name} ${c.last_name} ${c.registration_number}`.toLowerCase().includes(q));
  }, [children, query]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-avenida-blue-950">Fiche de correspondance</h1>
        <p className="mt-1 text-slate-600">
          {user.role === "professeur"
            ? "Faites l'appel de vos classes : les familles sont prévenues immédiatement en cas d'absence ou de retard."
            : "Présences, absences, retards et permissions, mis à jour chaque jour par l'école."}
        </p>
      </div>

      {user.role === "professeur" && <RollCall classes={classes} recorderId={user.id} />}

      {user.role === "eleve" &&
        (user.studentId ? (
          <div className="flex flex-col gap-6">
            <AccessSlipList studentId={user.studentId} linkBase="/espace/billet" />
            <AttendanceView studentId={user.studentId} />
          </div>
        ) : <p className="rounded-3xl bg-amber-50 p-6 text-amber-900">Votre compte n&apos;est pas encore rattaché à votre dossier.</p>)}

      {user.role === "parent" &&
        (children === null ? (
          <div className="h-40 animate-pulse rounded-3xl bg-white" />
        ) : children.length === 0 ? (
          <p className="rounded-3xl bg-amber-50 p-6 text-amber-900">Aucun enfant n&apos;est rattaché à votre compte. Contactez le secrétariat.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <span className="sr-only">Rechercher un enfant</span>
                <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, prénom ou matricule" className="rounded-full border border-slate-200 bg-white py-2 pr-4 pl-9 text-sm" />
              </label>
              {shown.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActive(c.id)}
                  aria-pressed={active === c.id}
                  className={cn("rounded-full px-4 py-2 text-sm font-bold", active === c.id ? "bg-vif text-white" : "bg-white text-avenida-blue ring-1 ring-slate-200")}
                >
                  {c.first_name} {c.last_name} · {c.registration_number}
                </button>
              ))}
            </div>
            {active && (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <AccessSlipList key={`${active}-${refresh}`} studentId={active} linkBase="/espace/billet" />
                <AttendanceView studentId={active} refreshKey={refresh} />
                <PermissionForm studentId={active} parentId={user.id} onSent={() => setRefresh((r) => r + 1)} />
              </div>
            )}
          </>
        ))}
    </div>
  );
}
