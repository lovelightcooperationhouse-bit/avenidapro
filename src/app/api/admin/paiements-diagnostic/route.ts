import { NextResponse } from "next/server";
import { paydunyaDiagnostic } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";

/** Diagnostic des clés de paiement, réservé au Directeur général (aucune valeur de clé n'est renvoyée). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "directeur_general") return NextResponse.json({ error: "Réservé au Directeur général" }, { status: 403 });
  return NextResponse.json(await paydunyaDiagnostic());
}
