"use client";

import {
  ArrowDown,
  ArrowUp,
  CornerDownRight,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CmsMenuItem } from "@/lib/cms-types";
import { ICONS } from "@/lib/icons";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { input, publishSite } from "./shared";

type Item = CmsMenuItem & { _new?: boolean; _dirty?: boolean };

/** Menus et sous-menus du site : ajouter, renommer, réordonner, masquer, choisir l'icône. */
export function MenuEditor() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from("site_menu")
      .select("*")
      .order("position");
    setItems((data ?? []) as Item[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (!items)
    return <Loader2 aria-label="Chargement" className="size-6 animate-spin" />;

  const top = items
    .filter((i) => !i.parent_id)
    .sort((a, b) => a.position - b.position);
  const kids = (id: string) =>
    items
      .filter((i) => i.parent_id === id)
      .sort((a, b) => a.position - b.position);
  const patch = (id: string, p: Partial<Item>) =>
    setItems(
      items.map((i) => (i.id === id ? { ...i, ...p, _dirty: true } : i)),
    );

  const move = (it: Item, dir: -1 | 1) => {
    const siblings = (it.parent_id ? kids(it.parent_id) : top).map((s) => s.id);
    const idx = siblings.indexOf(it.id);
    const j = idx + dir;
    if (j < 0 || j >= siblings.length) return;
    [siblings[idx], siblings[j]] = [siblings[j], siblings[idx]];
    setItems(
      items.map((i) =>
        siblings.includes(i.id)
          ? { ...i, position: siblings.indexOf(i.id), _dirty: true }
          : i,
      ),
    );
  };

  const add = (parent: string | null) => {
    const siblings = parent ? kids(parent) : top;
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        parent_id: parent,
        label: parent ? "Nouveau sous-menu" : "Nouveau menu",
        href: "/",
        description: "",
        icon: parent ? "Sparkles" : null,
        position: siblings.length,
        visible: true,
        _new: true,
        _dirty: true,
      },
    ]);
  };

  const remove = async (it: Item) => {
    if (
      !window.confirm(
        `Supprimer « ${it.label} »${it.parent_id ? "" : " et ses sous-menus"} ?`,
      )
    )
      return;
    if (!it._new)
      await createClient().from("site_menu").delete().eq("id", it.id);
    setItems(items.filter((i) => i.id !== it.id && i.parent_id !== it.id));
    await publishSite();
  };

  const save = async () => {
    setBusy(true);
    setMsg("");
    const dirty = items.filter((i) => i._dirty);
    // Les menus principaux d'abord (les sous-menus y font référence)
    const ordered = [
      ...dirty.filter((i) => !i.parent_id),
      ...dirty.filter((i) => i.parent_id),
    ];
    const supabase = createClient();
    for (const { _new, _dirty, ...row } of ordered) {
      void _new;
      void _dirty;
      const { error } = await supabase.from("site_menu").upsert(row);
      if (error) {
        setBusy(false);
        return setMsg("Erreur : " + error.message);
      }
    }
    await publishSite();
    setBusy(false);
    setMsg(
      `Menu enregistré (${ordered.length} modification(s)). Il est en ligne.`,
    );
    load();
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-600">
        Liens internes : <code>/ecole</code>, <code>/actualites</code>,{" "}
        <code>/pages/mon-adresse</code> (pages créées dans l&apos;onglet « Pages
        et sections »), ancres <code>/hotel#chambres</code>, ou adresse complète
        d&apos;un autre site.
      </p>
      {top.map((t) => (
        <div key={t.id} className="flex flex-col gap-2">
          <Row it={t} depth={0} patch={patch} move={move} remove={remove} />
          {kids(t.id).map((k) => (
            <Row
              key={k.id}
              it={k}
              depth={1}
              patch={patch}
              move={move}
              remove={remove}
            />
          ))}
          <button
            type="button"
            onClick={() => add(t.id)}
            className="ml-8 inline-flex items-center gap-1.5 self-start text-xs font-bold text-[#0C356A] hover:underline"
          >
            <Plus aria-hidden className="size-3.5" /> Ajouter un sous-menu à «{" "}
            {t.label} »
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => add(null)}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200"
        >
          <Plus aria-hidden className="size-4" /> Ajouter un menu
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden className="size-4" />
          )}{" "}
          Enregistrer le menu
        </button>
        {msg && (
          <p className="self-center text-sm font-semibold text-emerald-700">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  it,
  depth,
  patch,
  move,
  remove,
}: {
  it: Item;
  depth: number;
  patch: (id: string, p: Partial<Item>) => void;
  move: (it: Item, dir: -1 | 1) => void;
  remove: (it: Item) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-3",
        depth ? "ml-8 border-slate-200" : "border-slate-300",
        !it.visible && "opacity-60",
      )}
    >
      {depth > 0 && (
        <CornerDownRight aria-hidden className="size-4 text-slate-400" />
      )}
      <input
        value={it.label}
        onChange={(e) => patch(it.id, { label: e.target.value })}
        aria-label="Libellé"
        className={cn(input, "w-44 font-bold")}
      />
      <input
        value={it.href}
        onChange={(e) => patch(it.id, { href: e.target.value })}
        aria-label="Lien"
        placeholder="/page ou https://…"
        className={cn(input, "w-52")}
      />
      {depth > 0 && (
        <>
          <input
            value={it.description ?? ""}
            onChange={(e) => patch(it.id, { description: e.target.value })}
            aria-label="Description"
            placeholder="Description courte"
            className={cn(input, "min-w-40 flex-1")}
          />
          <select
            value={it.icon ?? "Sparkles"}
            onChange={(e) => patch(it.id, { icon: e.target.value })}
            aria-label="Icône"
            className={cn(input, "w-36")}
          >
            {Object.keys(ICONS).map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </>
      )}
      <span className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => move(it, -1)}
          aria-label="Monter"
          className="rounded-full p-1.5 hover:bg-slate-100"
        >
          <ArrowUp aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => move(it, 1)}
          aria-label="Descendre"
          className="rounded-full p-1.5 hover:bg-slate-100"
        >
          <ArrowDown aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => patch(it.id, { visible: !it.visible })}
          aria-label={it.visible ? "Masquer" : "Afficher"}
          className="rounded-full p-1.5 hover:bg-slate-100"
        >
          {it.visible ? (
            <Eye aria-hidden className="size-4" />
          ) : (
            <EyeOff aria-hidden className="size-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => remove(it)}
          aria-label="Supprimer"
          className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-[#DC2626]"
        >
          <Trash2 aria-hidden className="size-4" />
        </button>
      </span>
    </div>
  );
}
