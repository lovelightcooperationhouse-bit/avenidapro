import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isStaffRole } from "@/lib/roles";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xlugccxuittetcayjsxc.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_HwIkJ3XqvKdiuXx8T3J_fg_2fhtfSu7";

/**
 * Verrou serveur des espaces privés :
 * - /dashboard : réservé au personnel (direction, pédagogie, comptabilité, RH, hôtel, personnel) ;
 * - /espace : tout utilisateur connecté (élève, parent, professeur, candidat… et personnel).
 * Rafraîchit aussi la session Supabase (cookies) à chaque requête.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = path === "/connexion" ? `?suite=${encodeURIComponent(pathname)}` : "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user) {
    // Le lien « mot de passe oublié » arrive ici avec un code à échanger côté navigateur
    if (pathname === "/espace/mot-de-passe") return response;
    return redirectTo("/connexion");
  }

  if (pathname.startsWith("/dashboard")) {
    const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).maybeSingle();
    if (!profile || profile.is_active === false) return redirectTo("/connexion");
    if (!isStaffRole(profile.role)) return redirectTo("/espace");
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/espace/:path*"],
};
