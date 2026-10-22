import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Après une modification du contenu par le DG : le site public est régénéré immédiatement. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "directeur_general") return NextResponse.json({ error: "Réservé au Directeur général" }, { status: 403 });
  revalidateTag("cms");
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
