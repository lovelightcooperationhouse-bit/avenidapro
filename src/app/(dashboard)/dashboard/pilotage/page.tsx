"use client";

import { BedDouble, CalendarX, ClipboardList, Download, FileCheck2, GraduationCap, Loader2, Printer, ShoppingCart, TrendingDown, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFCFA } from "@/lib/utils";

type Period = "jour" | "semaine" | "mois" | "annee";

const PERIODS: Record<Period, string> = { jour: "Aujourd'hui", semaine: "7 derniers jours", mois: "30 derniers jours", annee: "12 derniers mois" };

function range(p: Period) {
  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (p === "semaine") start.setDate(start.getDate() - 6);
  if (p === "mois") start.setDate(start.getDate() - 29);
  if (p === "annee") start.setMonth(start.getMonth() - 11, 1);
  return { start, end };
}

type Data = {
  payments: { amount: number | null; created_at: string; payment_date: string | null }[];
  expenses: { amount: number | null; expense_date: string | null; created_at: string }[];
  reservations: { total_price: number | null; deposit_paid: number | null; created_at: string; status: string | null }[];
  attendance: { status: string; date: string }[];
  applications: { status: string; created_at: string }[];
  bookings: { status: string; created_at: string }[];
  contacts: { status: string; created_at: string }[];
  permissions: { status: string; created_at: string }[];
  purchases: { total_cost: number; movement_date: string; movement: string }[];
  students: { status: string | null; remaining_fee: number | null; class_name: string | null }[];
  employees: { status: string | null; sector: string | null }[];
  rooms: { status: string | null }[];
};

/** Tableau de pilotage du Directeur Général : rapports journalier, hebdomadaire, mensuel et annuel de toute la structure. */
export default function PilotagePage() {
  const [period, setPeriod] = useState<Period>("semaine");
  const [d, setD] = useState<Data | null>(null);

  const load = useCallback(async () => {
    setD(null);
    const { start } = range(period);
    const iso = start.toISOString();
    const day = iso.slice(0, 10);
    const s = createClient();
    const [payments, expenses, reservations, attendance, applications, bookings, contacts, permissions, purchases, students, employees, rooms] = await Promise.all([
      s.from("fee_payments").select("amount, created_at, payment_date").gte("created_at", iso),
      s.from("expenses").select("amount, expense_date, created_at").gte("created_at", iso),
      s.from("reservations").select("total_price, deposit_paid, created_at, status").gte("created_at", iso),
      s.from("student_attendance").select("status, date").gte("date", day),
      s.from("applications").select("status, created_at").gte("created_at", iso),
      s.from("booking_requests").select("status, created_at").gte("created_at", iso),
      s.from("contact_requests").select("status, created_at").gte("created_at", iso),
      s.from("permission_requests").select("status, created_at").gte("created_at", iso),
      s.from("inventory_movements").select("total_cost, movement_date, movement").gte("movement_date", day),
      s.from("students").select("status, remaining_fee, class_name").eq("is_archived", false),
      s.from("employees").select("status, sector"),
      s.from("rooms").select("status"),
    ]);
    setD({
      payments: payments.data ?? [],
      expenses: expenses.data ?? [],
      reservations: reservations.data ?? [],
      attendance: attendance.data ?? [],
      applications: applications.data ?? [],
      bookings: bookings.data ?? [],
      contacts: contacts.data ?? [],
      permissions: permissions.data ?? [],
      purchases: purchases.data ?? [],
      students: students.data ?? [],
      employees: employees.data ?? [],
      rooms: rooms.data ?? [],
    });
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const k = useMemo(() => {
    if (!d) return null;
    const sum = <T,>(l: T[], f: (x: T) => number | null) => l.reduce((a, x) => a + (f(x) ?? 0), 0);
    const school = sum(d.payments, (p) => p.amount);
    const hotel = sum(d.reservations, (r) => r.deposit_paid ?? r.total_price);
    const expenses = sum(d.expenses, (e) => e.amount);
    const purchases = sum(d.purchases.filter((p) => p.movement === "achat"), (p) => p.total_cost);
    const marked = d.attendance.length;
    const present = d.attendance.filter((a) => a.status === "present").length;
    const occupied = d.rooms.filter((r) => (r.status ?? "").toLowerCase().includes("occup")).length;
    return {
      school,
      hotel,
      income: school + hotel,
      expenses,
      purchases,
      net: school + hotel - expenses - purchases,
      absences: d.attendance.filter((a) => a.status === "absent").length,
      lates: d.attendance.filter((a) => a.status === "retard").length,
      presenceRate: marked ? Math.round((present / marked) * 100) : null,
      newApps: d.applications.length,
      enrolled: d.applications.filter((a) => a.status === "inscrite").length,
      pendingApps: d.applications.filter((a) => ["nouvelle", "en_etude", "pieces_manquantes"].includes(a.status)).length,
      bookings: d.bookings.length,
      contacts: d.contacts.length,
      pendingPermissions: d.permissions.filter((p) => p.status === "en_attente").length,
      activeStudents: d.students.filter((s) => s.status === "actif").length,
      debtors: d.students.filter((s) => (s.remaining_fee ?? 0) > 0).length,
      outstanding: sum(d.students, (s) => s.remaining_fee),
      staff: d.employees.length,
      occupancy: d.rooms.length ? Math.round((occupied / d.rooms.length) * 100) : null,
    };
  }, [d]);

  const series = useMemo(() => {
    if (!d) return [];
    const { start, end } = range(period);
    const byMonth = period === "annee";
    const buckets: { label: string; key: string; Encaissements: number; Dépenses: number }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const key = byMonth ? cur.toISOString().slice(0, 7) : cur.toISOString().slice(0, 10);
      buckets.push({ key, label: byMonth ? cur.toLocaleDateString("fr-FR", { month: "short" }) : cur.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), Encaissements: 0, Dépenses: 0 });
      if (byMonth) cur.setMonth(cur.getMonth() + 1);
      else cur.setDate(cur.getDate() + 1);
    }
    const add = (date: string, field: "Encaissements" | "Dépenses", v: number) => {
      const b = buckets.find((x) => date.startsWith(x.key));
      if (b) b[field] += v;
    };
    d.payments.forEach((p) => add(p.payment_date ?? p.created_at, "Encaissements", p.amount ?? 0));
    d.reservations.forEach((r) => add(r.created_at, "Encaissements", r.deposit_paid ?? r.total_price ?? 0));
    d.expenses.forEach((e) => add(e.expense_date ?? e.created_at, "Dépenses", e.amount ?? 0));
    d.purchases.filter((p) => p.movement === "achat").forEach((p) => add(p.movement_date, "Dépenses", p.total_cost));
    return buckets;
  }, [d, period]);

  const exportCsv = () => {
    if (!k) return;
    const rows = [
      ["Indicateur", "Valeur"],
      ["Période", PERIODS[period]],
      ["Encaissements école (F)", k.school],
      ["Encaissements hôtel (F)", k.hotel],
      ["Dépenses (F)", k.expenses],
      ["Achats économat (F)", k.purchases],
      ["Solde (F)", k.net],
      ["Élèves actifs", k.activeStudents],
      ["Élèves avec reste à payer", k.debtors],
      ["Reste à recouvrer (F)", k.outstanding],
      ["Taux de présence (%)", k.presenceRate ?? ""],
      ["Absences", k.absences],
      ["Retards", k.lates],
      ["Permissions en attente", k.pendingPermissions],
      ["Pré-inscriptions reçues", k.newApps],
      ["Inscriptions finalisées", k.enrolled],
      ["Demandes de réservation", k.bookings],
      ["Messages de contact", k.contacts],
      ["Taux d'occupation hôtel (%)", k.occupancy ?? ""],
      ["Personnel", k.staff],
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-avenida-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Kpi = ({ icon: Icon, label, value, sub, tone = "text-[#0C356A]" }: { icon: typeof Users; label: string; value: string; sub?: string; tone?: string }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 print:break-inside-avoid">
      <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
        <Icon aria-hidden className="size-4" /> {label}
      </p>
      <p className={cn("mt-1 text-2xl font-black", tone)}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );

  return (
    <div id="avenida-pilotage" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0C356A]">Pilotage — Direction Générale</h1>
          <p className="mt-1 text-sm text-slate-600">Vue consolidée de l&apos;école et de l&apos;hôtel : finances, admissions, assiduité, hébergement et économat.</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {(Object.keys(PERIODS) as Period[]).map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)} className={cn("rounded-xl px-3.5 py-2 text-sm font-bold ring-1", period === p ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200")}>
              {PERIODS[p]}
            </button>
          ))}
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-bold text-slate-700">
            <Download aria-hidden className="size-4" /> CSV
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl bg-[#DC2626] px-3.5 py-2 text-sm font-bold text-white">
            <Printer aria-hidden className="size-4" /> Rapport
          </button>
        </div>
      </div>
      <p className="hidden text-sm font-bold print:block">
        Rapport « {PERIODS[period]} » édité le {new Date().toLocaleString("fr-FR")}
      </p>

      {!k ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin text-slate-400" />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-black tracking-widest text-slate-500 uppercase">Finances</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Kpi icon={TrendingUp} label="Encaissements école" value={formatFCFA(k.school)} />
              <Kpi icon={BedDouble} label="Encaissements hôtel" value={formatFCFA(k.hotel)} />
              <Kpi icon={TrendingDown} label="Dépenses" value={formatFCFA(k.expenses)} tone="text-[#DC2626]" />
              <Kpi icon={ShoppingCart} label="Achats économat" value={formatFCFA(k.purchases)} tone="text-[#DC2626]" />
              <Kpi icon={TrendingUp} label="Solde de la période" value={formatFCFA(k.net)} tone={k.net >= 0 ? "text-emerald-700" : "text-[#DC2626]"} />
            </div>
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 print:break-inside-avoid">
            <p className="mb-3 text-sm font-black text-[#0C356A]">Encaissements et dépenses — {PERIODS[period]}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 11 }} width={44} />
                  <Tooltip formatter={(v) => formatFCFA(Number(v))} />
                  <Area type="monotone" dataKey="Encaissements" stroke="#0C356A" fill="#0C356A" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="Dépenses" stroke="#DC2626" fill="#DC2626" fillOpacity={0.12} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-black tracking-widest text-slate-500 uppercase">École</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Kpi icon={GraduationCap} label="Élèves actifs" value={String(k.activeStudents)} />
              <Kpi icon={TrendingDown} label="Reste à recouvrer" value={formatFCFA(k.outstanding)} sub={`${k.debtors} élève(s) concerné(s)`} tone="text-[#DC2626]" />
              <Kpi icon={Users} label="Taux de présence" value={k.presenceRate === null ? "—" : `${k.presenceRate} %`} sub={`${k.absences} absence(s) · ${k.lates} retard(s)`} />
              <Kpi icon={FileCheck2} label="Permissions en attente" value={String(k.pendingPermissions)} tone={k.pendingPermissions ? "text-amber-700" : "text-emerald-700"} />
              <Kpi icon={ClipboardList} label="Pré-inscriptions" value={String(k.newApps)} sub={`${k.enrolled} inscrite(s) · ${k.pendingApps} à traiter`} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-black tracking-widest text-slate-500 uppercase">Hôtel & relation client</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi icon={BedDouble} label="Taux d'occupation (actuel)" value={k.occupancy === null ? "—" : `${k.occupancy} %`} />
              <Kpi icon={CalendarX} label="Demandes de réservation" value={String(k.bookings)} />
              <Kpi icon={ClipboardList} label="Messages de contact" value={String(k.contacts)} />
              <Kpi icon={Users} label="Personnel" value={String(k.staff)} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
