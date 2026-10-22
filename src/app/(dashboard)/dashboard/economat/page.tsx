"use client";

import { AlertTriangle, Boxes, Loader2, PackagePlus, PiggyBank, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFCFA } from "@/lib/utils";

type Item = { id: string; sku: string | null; name: string; unit: string | null; current_quantity: number | null; minimum_stock_alert: number | null; average_cost_price: number | null; category: string | null; supplier: string | null; department: string };
type Movement = { id: string; item_id: string; movement: "achat" | "entree" | "sortie" | "perte" | "ajustement"; quantity: number; unit_cost: number; total_cost: number; reason: string | null; supplier: string | null; class_name: string | null; movement_date: string };
type Budget = { id: string; department: string; year: number; month: number | null; amount: number };

const DEPARTMENTS = [
  { key: "cuisine", label: "Cuisine pédagogique" },
  { key: "patisserie", label: "Pâtisserie" },
  { key: "restaurant", label: "Restaurant & bar" },
  { key: "hebergement", label: "Hébergement & lingerie" },
  { key: "hotel", label: "Hôtel (exploitation)" },
];
const MOVES = { achat: "Achat", entree: "Entrée (don, retour)", sortie: "Sortie / consommation", perte: "Perte / casse", ajustement: "Ajustement" } as const;
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

/** Économat par département : stock, achats, consommations et suivi budgétaire mensuel / annuel. */
export default function EconomatPage() {
  const { user } = useAuth();
  const [dept, setDept] = useState("cuisine");
  const [year, setYear] = useState(new Date().getFullYear());
  const [items, setItems] = useState<Item[]>([]);
  const [moves, setMoves] = useState<Movement[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stock" | "mouvements" | "budget">("stock");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: i }, { data: m }, { data: b }] = await Promise.all([
      supabase.from("products").select("id, sku, name, unit, current_quantity, minimum_stock_alert, average_cost_price, category, supplier, department").eq("department", dept).order("name"),
      supabase.from("inventory_movements").select("*").eq("department", dept).gte("movement_date", `${year}-01-01`).lte("movement_date", `${year}-12-31`).order("movement_date", { ascending: false }),
      supabase.from("department_budgets").select("*").eq("department", dept).eq("year", year),
    ]);
    setItems((i ?? []) as Item[]);
    setMoves((m ?? []) as Movement[]);
    setBudgets((b ?? []) as Budget[]);
    setLoading(false);
  }, [dept, year]);

  useEffect(() => {
    load();
  }, [load]);

  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? "Article";
  const thisMonth = new Date().getMonth();
  const purchases = moves.filter((m) => m.movement === "achat");
  const consumption = moves.filter((m) => m.movement === "sortie" || m.movement === "perte");
  const sum = (list: Movement[]) => list.reduce((a, m) => a + (m.total_cost || m.quantity * (items.find((i) => i.id === m.item_id)?.average_cost_price ?? 0)), 0);
  const annualBudget = budgets.find((b) => b.month === null)?.amount ?? budgets.filter((b) => b.month !== null).reduce((a, b) => a + b.amount, 0);
  const monthBudget = (m: number) => budgets.find((b) => b.month === m + 1)?.amount ?? (annualBudget ? Math.round(annualBudget / 12) : 0);

  const chart = useMemo(
    () =>
      MONTHS.map((label, m) => ({
        mois: label,
        Achats: sum(purchases.filter((x) => new Date(x.movement_date).getMonth() === m)),
        Consommation: sum(consumption.filter((x) => new Date(x.movement_date).getMonth() === m)),
        Budget: monthBudget(m),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moves, budgets, items]
  );

  const stockValue = items.reduce((a, i) => a + (i.current_quantity ?? 0) * (i.average_cost_price ?? 0), 0);
  const lowStock = items.filter((i) => (i.minimum_stock_alert ?? 0) > 0 && (i.current_quantity ?? 0) <= (i.minimum_stock_alert ?? 0));
  const spentYear = sum(purchases);
  const spentMonth = sum(purchases.filter((x) => new Date(x.movement_date).getMonth() === thisMonth));
  const topConsumed = useMemo(() => {
    const map = new Map<string, number>();
    consumption.forEach((m) => map.set(m.item_id, (map.get(m.item_id) ?? 0) + (m.total_cost || 0)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moves]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0C356A]">Économat & suivi budgétaire</h1>
          <p className="mt-1 text-sm text-slate-600">Achats, entrées, sorties et restes par département, avec suivi du budget mensuel et annuel.</p>
        </div>
        <div className="flex gap-2">
          <select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Département" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold">
            {DEPARTMENTS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Année" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold">
            {[0, 1, 2].map((k) => {
              const y = new Date().getFullYear() - k;
              return <option key={y}>{y}</option>;
            })}
          </select>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { icon: Boxes, label: "Valeur du stock", value: formatFCFA(stockValue), tone: "text-[#0C356A]" },
          { icon: TrendingUp, label: "Achats du mois", value: formatFCFA(spentMonth), tone: "text-[#0C356A]" },
          { icon: Wallet, label: `Achats ${year}`, value: formatFCFA(spentYear), tone: "text-[#0C356A]" },
          { icon: PiggyBank, label: "Budget annuel restant", value: annualBudget ? formatFCFA(annualBudget - spentYear) : "Non défini", tone: annualBudget && spentYear > annualBudget ? "text-[#DC2626]" : "text-emerald-700" },
          { icon: AlertTriangle, label: "Articles en alerte", value: String(lowStock.length), tone: lowStock.length ? "text-[#DC2626]" : "text-emerald-700" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <dt className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <k.icon aria-hidden className="size-4" /> {k.label}
            </dt>
            <dd className={cn("mt-1 text-xl font-black", k.tone)}>{k.value}</dd>
          </div>
        ))}
      </dl>

      {annualBudget > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex justify-between text-xs font-bold text-slate-600">
            <span>Consommation du budget {year}</span>
            <span>
              {Math.round((spentYear / annualBudget) * 100)} % de {formatFCFA(annualBudget)}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className={cn("h-full rounded-full", spentYear > annualBudget ? "bg-[#DC2626]" : "bg-[image:linear-gradient(90deg,#0C356A,#DC2626)]")} style={{ width: `${Math.min(100, (spentYear / annualBudget) * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-black text-[#0C356A]">Achats, consommation et budget par mois ({year})</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 12 }} width={44} />
              <Tooltip formatter={(v) => formatFCFA(Number(v))} />
              <Legend />
              <Bar dataKey="Achats" fill="#0C356A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Consommation" fill="#DC2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { key: "stock" as const, label: `Stock (${items.length})` },
          { key: "mouvements" as const, label: `Mouvements ${year} (${moves.length})` },
          { key: "budget" as const, label: "Budget" },
        ].map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("rounded-xl px-4 py-2.5 text-sm font-bold ring-1", tab === t.key ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200")}>
            {t.label}
          </button>
        ))}
      </div>
      {msg && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{msg}</p>}

      {loading ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin text-slate-400" />
      ) : tab === "stock" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Article</th>
                  <th className="p-3 text-right">En stock</th>
                  <th className="p-3 text-right">Seuil</th>
                  <th className="p-3 text-right">Prix moyen</th>
                  <th className="p-3 text-right">Valeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((i) => {
                  const low = (i.minimum_stock_alert ?? 0) > 0 && (i.current_quantity ?? 0) <= (i.minimum_stock_alert ?? 0);
                  return (
                    <tr key={i.id} className={low ? "bg-red-50/50" : ""}>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{i.name}</p>
                        <p className="text-xs text-slate-500">{[i.category, i.supplier].filter(Boolean).join(" · ")}</p>
                      </td>
                      <td className={cn("p-3 text-right font-bold", low ? "text-[#DC2626]" : "text-slate-800")}>
                        {i.current_quantity ?? 0} {i.unit}
                      </td>
                      <td className="p-3 text-right text-slate-500">{i.minimum_stock_alert ?? "—"}</td>
                      <td className="p-3 text-right">{formatFCFA(i.average_cost_price ?? 0)}</td>
                      <td className="p-3 text-right font-semibold">{formatFCFA((i.current_quantity ?? 0) * (i.average_cost_price ?? 0))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {items.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Aucun article dans ce département. Ajoutez-en un à droite.</p>}
          </div>
          <div className="flex flex-col gap-4">
            <MovementForm items={items} dept={dept} userId={user?.id} onDone={(m) => { setMsg(m); load(); }} />
            <NewItemForm dept={dept} onDone={(m) => { setMsg(m); load(); }} />
            {topConsumed.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-black text-[#0C356A]">
                  <TrendingDown aria-hidden className="size-4" /> Plus consommés ({year})
                </p>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {topConsumed.map(([id, v]) => (
                    <li key={id} className="flex justify-between">
                      <span>{itemName(id)}</span>
                      <span className="font-bold">{formatFCFA(v)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : tab === "mouvements" ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Article</th>
                <th className="p-3">Mouvement</th>
                <th className="p-3 text-right">Quantité</th>
                <th className="p-3 text-right">Montant</th>
                <th className="p-3">Motif / classe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {moves.map((m) => (
                <tr key={m.id}>
                  <td className="p-3 whitespace-nowrap">{new Date(m.movement_date).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3 font-semibold">{itemName(m.item_id)}</td>
                  <td className="p-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", m.movement === "achat" || m.movement === "entree" ? "bg-blue-50 text-[#0C356A]" : "bg-red-50 text-red-700")}>{MOVES[m.movement]}</span>
                  </td>
                  <td className="p-3 text-right">{m.quantity}</td>
                  <td className="p-3 text-right font-semibold">{m.total_cost ? formatFCFA(m.total_cost) : "—"}</td>
                  <td className="p-3 text-slate-600">{[m.reason, m.class_name, m.supplier].filter(Boolean).join(" · ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {moves.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Aucun mouvement enregistré en {year}.</p>}
        </div>
      ) : (
        <BudgetForm dept={dept} year={year} budgets={budgets} onDone={(m) => { setMsg(m); load(); }} />
      )}
    </div>
  );
}

const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

function MovementForm({ items, dept, userId, onDone }: { items: Item[]; dept: string; userId?: string; onDone: (m: string) => void }) {
  const [f, setF] = useState({ item_id: "", movement: "achat", quantity: "", unit_cost: "", supplier: "", reason: "", class_name: "", movement_date: new Date().toISOString().slice(0, 10) });
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(f.quantity.replace(",", "."));
    if (!f.item_id || !(qty > 0)) return setErr("Choisissez un article et une quantité.");
    const item = items.find((i) => i.id === f.item_id);
    if ((f.movement === "sortie" || f.movement === "perte") && item && qty > (item.current_quantity ?? 0)) return setErr(`Stock insuffisant (${item.current_quantity ?? 0} ${item.unit ?? ""}).`);
    const cost = f.movement === "achat" ? Number(f.unit_cost) || 0 : item?.average_cost_price ?? 0;
    const { error } = await createClient()
      .from("inventory_movements")
      .insert({ item_id: f.item_id, department: dept, movement: f.movement, quantity: qty, unit_cost: cost, supplier: f.supplier || null, reason: f.reason || null, class_name: f.class_name || null, movement_date: f.movement_date, recorded_by: userId });
    if (error) return setErr("Enregistrement impossible.");
    setErr("");
    setF({ ...f, quantity: "", unit_cost: "", reason: "", class_name: "" });
    onDone("Mouvement enregistré, stock mis à jour.");
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="flex items-center gap-1.5 text-sm font-black text-[#0C356A]">
        <Plus aria-hidden className="size-4" /> Nouveau mouvement
      </p>
      <select value={f.item_id} onChange={(e) => setF({ ...f, item_id: e.target.value })} aria-label="Article" className={input}>
        <option value="">— Article —</option>
        {items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name} ({i.current_quantity ?? 0} {i.unit})
          </option>
        ))}
      </select>
      <select value={f.movement} onChange={(e) => setF({ ...f, movement: e.target.value })} aria-label="Type de mouvement" className={input}>
        {Object.entries(MOVES).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} inputMode="decimal" placeholder="Quantité" aria-label="Quantité" className={input} />
        {f.movement === "achat" ? (
          <input value={f.unit_cost} onChange={(e) => setF({ ...f, unit_cost: e.target.value })} inputMode="numeric" placeholder="Prix unitaire (F)" aria-label="Prix unitaire" className={input} />
        ) : (
          <input type="date" value={f.movement_date} onChange={(e) => setF({ ...f, movement_date: e.target.value })} aria-label="Date" className={input} />
        )}
      </div>
      {f.movement === "achat" ? (
        <input value={f.supplier} onChange={(e) => setF({ ...f, supplier: e.target.value })} placeholder="Fournisseur" aria-label="Fournisseur" className={input} />
      ) : (
        <input value={f.class_name} onChange={(e) => setF({ ...f, class_name: e.target.value })} placeholder="Classe / atelier (ex. CAP1 - Cuisine)" aria-label="Classe" className={input} />
      )}
      <input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Motif (TP, événement, casse…)" aria-label="Motif" className={input} />
      {err && <p className="text-xs font-semibold text-[#DC2626]">{err}</p>}
      <button type="submit" className="rounded-lg bg-[#DC2626] py-2 text-sm font-bold text-white hover:bg-[#B91C1C]">
        Enregistrer
      </button>
    </form>
  );
}

function NewItemForm({ dept, onDone }: { dept: string; onDone: (m: string) => void }) {
  const [f, setF] = useState({ name: "", unit: "kg", category: "", minimum_stock_alert: "" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    const { error } = await createClient()
      .from("products")
      .insert({ name: f.name.trim(), unit: f.unit, category: f.category || null, minimum_stock_alert: Number(f.minimum_stock_alert) || 0, current_quantity: 0, average_cost_price: 0, department: dept, sku: `${dept.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}` });
    if (!error) {
      setF({ name: "", unit: "kg", category: "", minimum_stock_alert: "" });
      onDone("Article ajouté.");
    }
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="flex items-center gap-1.5 text-sm font-black text-[#0C356A]">
        <PackagePlus aria-hidden className="size-4" /> Nouvel article
      </p>
      <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nom (ex. Farine T55)" aria-label="Nom de l'article" className={input} />
      <div className="grid grid-cols-3 gap-2">
        <select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} aria-label="Unité" className={input}>
          {["kg", "g", "L", "pièce", "boîte", "sac", "carton", "bouteille", "paquet"].map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
        <input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Catégorie" aria-label="Catégorie" className={input} />
        <input value={f.minimum_stock_alert} onChange={(e) => setF({ ...f, minimum_stock_alert: e.target.value })} inputMode="decimal" placeholder="Seuil" aria-label="Seuil d'alerte" className={input} />
      </div>
      <button type="submit" className="rounded-lg bg-[#0C356A] py-2 text-sm font-bold text-white hover:bg-[#072042]">
        Ajouter
      </button>
    </form>
  );
}

function BudgetForm({ dept, year, budgets, onDone }: { dept: string; year: number; budgets: Budget[]; onDone: (m: string) => void }) {
  const [annual, setAnnual] = useState(String(budgets.find((b) => b.month === null)?.amount ?? ""));
  const [monthly, setMonthly] = useState<Record<number, string>>(() => Object.fromEntries(budgets.filter((b) => b.month).map((b) => [b.month as number, String(b.amount)])));
  useEffect(() => {
    setAnnual(String(budgets.find((b) => b.month === null)?.amount ?? ""));
    setMonthly(Object.fromEntries(budgets.filter((b) => b.month).map((b) => [b.month as number, String(b.amount)])));
  }, [budgets]);

  const save = async () => {
    const supabase = createClient();
    // Budget annuel : une ligne sans mois ; budgets mensuels facultatifs
    await supabase.from("department_budgets").delete().eq("department", dept).eq("year", year);
    const rows = [
      ...(Number(annual) > 0 ? [{ department: dept, year, month: null, amount: Number(annual) }] : []),
      ...Object.entries(monthly)
        .filter(([, v]) => Number(v) > 0)
        .map(([m, v]) => ({ department: dept, year, month: Number(m), amount: Number(v) })),
    ];
    if (rows.length) await supabase.from("department_budgets").insert(rows);
    onDone("Budget enregistré.");
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <label className="flex max-w-xs flex-col gap-1.5 text-sm font-bold text-[#0C356A]">
        Budget annuel {year} (F CFA)
        <input value={annual} onChange={(e) => setAnnual(e.target.value)} inputMode="numeric" className={input} />
      </label>
      <p className="text-sm font-bold text-[#0C356A]">Budgets mensuels (facultatif : sinon budget annuel ÷ 12)</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {MONTHS.map((m, i) => (
          <label key={m} className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            {m}
            <input value={monthly[i + 1] ?? ""} onChange={(e) => setMonthly((x) => ({ ...x, [i + 1]: e.target.value }))} inputMode="numeric" className={input} />
          </label>
        ))}
      </div>
      <button type="button" onClick={save} className="w-fit rounded-lg bg-[#DC2626] px-5 py-2 text-sm font-bold text-white">
        Enregistrer le budget
      </button>
    </div>
  );
}
