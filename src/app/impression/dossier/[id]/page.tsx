"use client";

import { Printer } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { siteConfig } from "@/content/site";
import { KINDS, STATUS_LABEL, fieldGroups, type MemberApplication, type Position } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/client";

/**
 * Formulaire généré automatiquement à partir du profil complété par le membre :
 * toutes les informations et la liste des pièces, prêt à imprimer ou enregistrer en PDF.
 */
export default function PrintDossierPage() {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<(MemberApplication & { profiles: { email: string | null } | null }) | null>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("member_applications")
      .select("*, profiles!member_applications_profile_id_fkey(email)")
      .eq("id", id)
      .maybeSingle()
      .then(async ({ data }) => {
        setApp(data);
        if (data?.position_code) {
          const { data: p } = await supabase.from("positions").select("*").eq("code", data.position_code).maybeSingle();
          setPosition(p);
        }
      });
  }, [id]);

  if (!app) return <p className="p-10 text-center">Chargement du dossier…</p>;
  const kind = KINDS.find((k) => k.value === app.kind)?.label ?? app.kind;

  return (
    <div className="min-h-dvh bg-slate-100 p-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-end print:hidden">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white">
          <Printer aria-hidden className="size-4" /> Imprimer / PDF
        </button>
      </div>
      <article className="mx-auto max-w-[210mm] bg-white p-[12mm] text-[11px] text-slate-900 shadow print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b-4 border-[#E30613] pb-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- rendu imprimable */}
            <img src="/logo-avenida.png" alt="" className="size-14 object-contain" />
            <div>
              <p className="font-serif text-lg font-extrabold tracking-wider text-[#0C356A]">HÔTEL ÉCOLE AVENIDA</p>
              <p className="text-[10px] text-slate-600">
                {siteConfig.address.street}, {siteConfig.address.district} · {siteConfig.address.postal} {siteConfig.address.city}
              </p>
              <p className="text-[10px] text-slate-600">
                {siteConfig.phones[0].display} · {siteConfig.email}
              </p>
            </div>
          </div>
          {app.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- photo en data URL
            <img src={app.photo} alt="" className="h-[45mm] w-[35mm] border border-slate-300 object-cover" />
          ) : (
            <span className="flex h-[45mm] w-[35mm] items-center justify-center border border-dashed border-slate-400 text-[9px] text-slate-400">Photo 35 × 45</span>
          )}
        </header>

        <h1 className="mt-4 text-center text-base font-black tracking-wide text-[#0C356A] uppercase">Dossier de membre — {kind}</h1>
        <p className="text-center text-[10px] text-slate-600">
          Compte {app.profiles?.email} · {STATUS_LABEL[app.status].label}
          {app.submitted_at ? ` · envoyé le ${new Date(app.submitted_at).toLocaleDateString("fr-FR")}` : ""}
          {position ? ` · poste : ${position.label} (${position.service})` : ""}
        </p>

        {fieldGroups(app.kind, app.department).map((g) => (
          <section key={g.title} className="mt-4 break-inside-avoid">
            <h2 className="mb-1 bg-[#0C356A] px-2 py-1 text-[10px] font-bold tracking-widest text-white uppercase">{g.title}</h2>
            <table className="w-full border-collapse">
              <tbody>
                {g.fields.map((f) => {
                  const v = app.data[f.name];
                  const text = Array.isArray(v) ? v.join(", ") : f.options?.find((o) => o.value === v)?.label ?? String(v ?? "");
                  return (
                    <tr key={f.name} className="border-b border-slate-200">
                      <th className="w-[38%] py-1 pr-2 text-left font-semibold text-slate-600">{f.label}</th>
                      <td className="py-1 font-semibold">{text || "……………………………………"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}

        <section className="mt-4 break-inside-avoid">
          <h2 className="mb-1 bg-[#0C356A] px-2 py-1 text-[10px] font-bold tracking-widest text-white uppercase">Pièces jointes</h2>
          <ul className="list-disc pl-5">
            {app.documents.length ? app.documents.map((d) => <li key={d.path}>{d.label} — {d.name}</li>) : <li>Aucune pièce jointe</li>}
          </ul>
        </section>

        <section className="mt-6 grid grid-cols-3 gap-4 break-inside-avoid text-center text-[10px]">
          {["Le membre", "Avis du gestionnaire", "Décision du Directeur général"].map((s) => (
            <div key={s} className="h-24 border border-slate-300 p-2">
              <p className="font-bold">{s}</p>
            </div>
          ))}
        </section>
        <p className="mt-4 text-center text-[9px] text-slate-500">Document généré par la plateforme Avenida · {siteConfig.motto}</p>
      </article>
    </div>
  );
}
