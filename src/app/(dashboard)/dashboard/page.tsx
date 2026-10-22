"use client";

import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { modulesFor } from "@/components/layout/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSchoolYear } from "@/context/SchoolYearContext";
import { ROLE_SCOPE } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFCFA } from "@/lib/utils";

type Stats = {
  students: number;
  preinscriptions: number;
  dossiers: number;
  permissions: number;
  absentsToday: number;
  expected: number;
  paid: number;
  cashedToday: number;
  bookings: number;
  employees: number;
  customers: number;
};

/** Accueil de la gestion : chiffres clés réels, tâches à traiter et accès aux modules du rôle. */
export default function DashboardHome() {
  const { user } = useAuth();
  const { selectedYearLabel } = useSchoolYear();
  const [s, setS] = useState<Stats | null>(null);
  const modules = useMemo(() => modulesFor(user?.role), [user?.role]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    type Filter = { eq?: Record<string, string>; in?: Record<string, string[]> };
    const count = async (table: string, f: Filter = {}) => {
      let q = supabase.from(table).select("id", { count: "exact", head: true });
      for (const [k, v] of Object.entries(f.eq ?? {})) q = q.eq(k, v);
      for (const [k, v] of Object.entries(f.in ?? {})) q = q.in(k, v);
      const { count: n } = await q;
      return n ?? 0;
    };
    (async () => {
      const [students, preinscriptions, dossiers, permissions, absentsToday, bookings, employees, customers, fin, pay] = await Promise.all([
        count("students", { eq: { status: "actif" } }),
        count("applications", { in: { status: ["nouvelle", "en_etude", "pieces_manquantes", "acceptee"] } }),
        count("member_applications", { in: { status: ["soumise", "en_examen", "avis_favorable", "avis_defavorable"] } }),
        count("permission_requests", { eq: { status: "en_attente" } }),
        count("student_attendance", { eq: { date: today }, in: { status: ["absent", "retard"] } }),
        count("booking_requests", { in: { status: ["nouvelle", "en_attente"] } }),
        count("employees"),
        count("hotel_customers"),
        supabase.from("students").select("total_fee, paid_fee").eq("status", "actif"),
        supabase.from("fee_payments").select("amount").gte("payment_date", today),
      ]);
      setS({
        students,
        preinscriptions,
        dossiers,
        permissions,
        absentsToday,
        bookings,
        employees,
        customers,
        expected: (fin.data ?? []).reduce((a, r) => a + Number(r.total_fee ?? 0), 0),
        paid: (fin.data ?? []).reduce((a, r) => a + Number(r.paid_fee ?? 0), 0),
        cashedToday: (pay.data ?? []).reduce((a, r) => a + Number(r.amount ?? 0), 0),
      });
    })();
  }, [user]);

  if (!user) return null;
  const r = user.role;
  const has = (href: string) => modules.some((m) => m.sections.some((sec) => sec.items.some((i) => i.href.split("?")[0] === href)));
  const hour = new Date().getHours();

  const kpis = [
    { show: has("/dashboard/eleves"), label: "Élèves inscrits", value: s?.students, href: "/dashboard/eleves", tone: "#0C356A" },
    { show: has("/dashboard/ecolage"), label: "Écolage encaissé", value: s ? formatFCFA(s.paid) : undefined, sub: s ? `sur ${formatFCFA(s.expected)}` : "", href: "/dashboard/ecolage", tone: "#047857" },
    { show: has("/dashboard/ecolage"), label: "Reste à encaisser", value: s ? formatFCFA(Math.max(0, s.expected - s.paid)) : undefined, href: "/dashboard/ecolage", tone: "#B8000F" },
    { show: has("/dashboard/ecolage"), label: "Encaissé aujourd'hui", value: s ? formatFCFA(s.cashedToday) : undefined, href: "/dashboard/ecolage", tone: "#047857" },
    { show: has("/dashboard/correspondance"), label: "Absences et retards du jour", value: s?.absentsToday, href: "/dashboard/correspondance", tone: "#0C356A" },
    { show: has("/dashboard/employees"), label: "Personnel", value: s?.employees, href: "/dashboard/employees", tone: "#0C356A" },
    { show: has("/dashboard/customers"), label: "Clients de l'hôtel", value: s?.customers, href: "/dashboard/customers", tone: "#0C356A" },
  ].filter((k) => k.show);

  const todo = [
    { show: has("/dashboard/admissions"), n: s?.preinscriptions, label: "pré-inscription(s) à traiter", href: "/dashboard/admissions" },
    { show: has("/dashboard/adhesions"), n: s?.dossiers, label: "dossier(s) de membre en attente", href: "/dashboard/adhesions" },
    { show: has("/dashboard/correspondance"), n: s?.permissions, label: "demande(s) de permission", href: "/dashboard/correspondance" },
    { show: has("/dashboard/demandes"), n: s?.bookings, label: "demande(s) de réservation", href: "/dashboard/demandes" },
  ].filter((t) => t.show);

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl bg-[#06152E] p-6 text-white sm:p-8">
        <div aria-hidden className="bg-avenida-pattern absolute inset-y-0 right-0 w-1/2 opacity-10 [mask-image:linear-gradient(270deg,black,transparent)]" />
        <p className="relative flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-white/60 uppercase">
          <CalendarDays aria-hidden className="size-4" />
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Année {selectedYearLabel}
        </p>
        <h1 className="relative mt-2 text-2xl font-black sm:text-3xl">
          {hour < 18 ? "Bonjour" : "Bonsoir"} {user.fullName.split(" ")[0]}
        </h1>
        <p className="relative mt-1 max-w-3xl text-sm text-white/75">
          <span className="font-bold text-[#FF6B73]">{user.roleLabel}</span> · {ROLE_SCOPE[r]}
        </p>
      </section>

      {kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href} className="group rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
              <span aria-hidden className="mb-3 block h-1 w-10 rounded-full" style={{ backgroundColor: k.tone }} />
              <p className="text-xs font-bold text-slate-500">{k.label}</p>
              <p className="mt-1 text-2xl font-black" style={{ color: k.tone }}>
                {k.value ?? "…"}
              </p>
              {k.sub && <p className="text-xs text-slate-500">{k.sub}</p>}
            </Link>
          ))}
        </div>
      )}

      {todo.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-black tracking-wide text-[#0C356A] uppercase">À traiter</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {todo.map((t) => (
              <li key={t.href + t.label}>
                <Link href={t.href} className={cn("flex items-center gap-3 rounded-xl p-3 ring-1 transition-colors", t.n ? "bg-amber-50 ring-amber-200 hover:bg-amber-100" : "bg-slate-50 ring-slate-200")}>
                  {t.n ? <AlertTriangle aria-hidden className="size-5 text-amber-600" /> : <CheckCircle2 aria-hidden className="size-5 text-emerald-600" />}
                  <span className="flex-1 text-sm">
                    <strong className="text-base">{t.n ?? "…"}</strong> {t.label}
                  </span>
                  <ArrowRight aria-hidden className="size-4 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-black tracking-wide text-[#0C356A] uppercase">Vos modules</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules
            .filter((m) => m.key !== "accueil")
            .map((m) => (
              <article key={m.key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <header className="flex items-center gap-3 border-b-2 border-[#E30613] bg-[#06152E] px-5 py-4 text-white">
                  <m.icon aria-hidden className="size-5" />
                  <h3 className="font-black">{m.label}</h3>
                </header>
                <ul className="divide-y divide-slate-100">
                  {m.sections
                    .flatMap((sec) => sec.items)
                    .map((i) => (
                      <li key={i.href + i.label}>
                        <Link href={i.href} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                          <i.icon aria-hidden className="size-4 shrink-0 text-[#0C356A]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-slate-800">{i.label}</span>
                            {i.hint && <span className="block truncate text-xs text-slate-500">{i.hint}</span>}
                          </span>
                          <ArrowRight aria-hidden className="size-4 text-slate-300" />
                        </Link>
                      </li>
                    ))}
                </ul>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}
