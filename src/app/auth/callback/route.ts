import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleConfig } from "@/lib/roles";

/**
 * Retour de Google (OAuth Supabase) : échange le code contre une session (cookies),
 * puis envoie l'utilisateur vers son espace, ou vers la page demandée (`suite`) s'il y a droit.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const suite = searchParams.get("suite");
  const fail = (reason: string) => NextResponse.redirect(`${origin}/connexion?erreur=${reason}`);

  if (!code) return fail(searchParams.get("error") === "access_denied" ? "annule" : "google");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return fail("google");

  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", data.user.id).maybeSingle();
  if (!profile || profile.is_active === false) {
    await supabase.auth.signOut();
    return fail("compte");
  }

  const home = roleConfig(profile.role).home;
  const safe = suite && suite.startsWith("/") && !suite.startsWith("//") && suite.startsWith(home) ? suite : home;
  return NextResponse.redirect(`${origin}${safe}`);
}
