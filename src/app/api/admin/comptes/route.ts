import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ROLE_CONFIG } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

/**
 * Création d'un compte par le Directeur général (gestionnaires, personnel…) avec un rôle attribué d'office.
 * Avec SUPABASE_SERVICE_ROLE_KEY : compte créé immédiatement, mot de passe provisoire renvoyé une seule fois.
 * Sans la clé : invitation enregistrée — le rôle est appliqué dès que la personne crée son compte avec cette adresse.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "directeur_general") return NextResponse.json({ error: "Réservé au Directeur général" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { email?: string; first_name?: string; last_name?: string; role?: string; phone?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const role = body.role ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
  if (!(role in ROLE_CONFIG)) return NextResponse.json({ error: "Rôle inconnu" }, { status: 400 });
  const first = body.first_name?.trim() || null;
  const last = body.last_name?.trim() || null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    const { error } = await supabase.from("user_invitations").insert({ email, first_name: first, last_name: last, role_code: role, status: "pending" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ mode: "invitation", message: `Invitation enregistrée : ${email} obtiendra le rôle dès la création de son compte (ou connexion Google).` });
  }

  const admin = createAdmin(url, serviceKey, { auth: { persistSession: false } });
  const password = tempPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: first, last_name: last },
  });
  if (error || !data.user) return NextResponse.json({ error: error?.message.includes("already") ? "Un compte existe déjà avec cette adresse : modifiez son rôle dans la liste." : (error?.message ?? "Création impossible") }, { status: 400 });

  await admin.from("profiles").update({ role, first_name: first, last_name: last, phone: body.phone?.trim() || null, is_active: true, updated_at: new Date().toISOString() }).eq("id", data.user.id);
  await admin.from("notifications").insert({ profile_id: data.user.id, kind: "info", title: "Bienvenue sur la plateforme Avenida", body: "Complétez votre profil (photo d'identité et informations) puis changez votre mot de passe.", link: "/espace/profil" });
  return NextResponse.json({ mode: "compte", email, password, message: "Compte créé. Transmettez ces identifiants à la personne : elle devra changer son mot de passe." });
}

/** Mot de passe provisoire lisible (sans caractères ambigus). */
function tempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return "Av-" + Array.from(bytes, (b) => chars[b % chars.length]).join("") + "!";
}
