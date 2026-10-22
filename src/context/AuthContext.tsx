"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { allowedDashboardPaths } from "@/components/layout/navigation";
import { roleConfig, type RoleType } from "@/lib/roles";

export type { RoleType };

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: RoleType;
  roleLabel: string;
  roleDescription: string;
  department: string;
  avatarColor: string;
  initials: string;
  allowedPaths: string[];
  /** Page d'accueil du compte : espace de gestion ou espace personnel. */
  home: "/dashboard" | "/espace";
  studentId: string | null;
}

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identity: string, password: string) => Promise<{ success: boolean; message?: string; home?: string }>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<{ success: boolean; message?: string }>;
  /** Redirige vers Google ; le retour passe par /auth/callback. */
  loginWithGoogle: (suite?: string | null) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  canAccessPath: (path: string) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Raccourcis d'identifiants pour les comptes de la direction. */
const IDENTITY_SHORTCUTS: Record<string, string> = {
  directeur: "direction@ecole-avenida.tg",
  pedagogie: "pedagogie@ecole-avenida.tg",
  comptable: "comptabilite@ecole-avenida.tg",
  rh: "rh@ecole-avenida.tg",
  hotel: "hotel@ecole-avenida.tg",
};

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  student_id: string | null;
  is_active: boolean | null;
};

function toAccount(profile: ProfileRow, fallbackEmail: string): UserAccount {
  const cfg = roleConfig(profile.role);
  const email = profile.email || fallbackEmail;
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || email;
  const initials =
    ((profile.first_name?.[0] ?? "") + (profile.last_name?.[0] ?? "")).toUpperCase() || email[0]?.toUpperCase() || "A";
  return {
    id: profile.id,
    username: email.split("@")[0],
    email,
    fullName,
    role: profile.role as RoleType,
    roleLabel: cfg.label,
    roleDescription: cfg.description,
    department: cfg.department,
    avatarColor: cfg.avatarColor,
    initials,
    allowedPaths: cfg.allowedPaths,
    home: cfg.home,
    studentId: profile.student_id,
  };
}

/**
 * Session et rôle de l'utilisateur.
 * La session vient uniquement de Supabase Auth (cookies) et le rôle de la table profiles,
 * protégée par RLS : rien n'est décidé ni stocké côté navigateur.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadProfile = useCallback(async (): Promise<UserAccount | null> => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, role, student_id, is_active")
      .eq("id", authUser.id)
      .maybeSingle<ProfileRow>();
    if (!profile || profile.is_active === false) return null;
    return toAccount(profile, authUser.email ?? "");
  }, []);

  const refresh = useCallback(async () => {
    try {
      setUser(await loadProfile());
    } finally {
      setIsLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    // Nettoie l'ancienne session locale (versions précédentes, non sécurisées)
    try {
      localStorage.removeItem("avenida_auth_session_user");
      localStorage.removeItem("avenida_custom_passwords");
      localStorage.removeItem("avenida_password_reset_otps");
    } catch {
      /* stockage indisponible */
    }
    refresh();
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setUser(null);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const login: AuthContextType["login"] = async (identity, password) => {
    const clean = identity.trim().toLowerCase();
    const email = IDENTITY_SHORTCUTS[clean] ?? clean;
    if (!email.includes("@")) {
      return { success: false, message: "Saisissez votre adresse e-mail." };
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: password.trim() });
    if (error) {
      return {
        success: false,
        message: error.message.includes("Email not confirmed")
          ? "Adresse e-mail non confirmée : ouvrez le lien reçu par e-mail."
          : "E-mail ou mot de passe incorrect.",
      };
    }
    const account = await loadProfile();
    if (!account) {
      await supabase.auth.signOut();
      return { success: false, message: "Ce compte est désactivé ou n'a pas encore de profil. Contactez l'administration." };
    }
    setUser(account);
    return { success: true, home: account.home };
  };

  const register: AuthContextType["register"] = async ({ email, password, firstName, lastName }) => {
    if (password.trim().length < 8) {
      return { success: false, message: "Le mot de passe doit comporter au moins 8 caractères." };
    }
    const supabase = createClient();
    // Le rôle est attribué côté base (invitation de la direction, sinon « candidat »)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      options: {
        data: { first_name: firstName.trim(), last_name: lastName.trim() },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/espace` : undefined,
      },
    });
    if (error) return { success: false, message: error.message };
    if (!data.session) {
      return { success: true, message: "Compte créé. Confirmez votre adresse en ouvrant le lien reçu par e-mail, puis connectez-vous." };
    }
    await refresh();
    return { success: true };
  };

  const loginWithGoogle: AuthContextType["loginWithGoogle"] = async (suite) => {
    const callback = new URL("/auth/callback", window.location.origin);
    if (suite) callback.searchParams.set("suite", suite);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString(), queryParams: { prompt: "select_account" } },
    });
    return error ? { success: false, message: "Connexion Google indisponible pour le moment. Réessayez plus tard." } : { success: true };
  };

  const requestPasswordReset: AuthContextType["requestPasswordReset"] = async (email) => {
    const supabase = createClient();
    const target = IDENTITY_SHORTCUTS[email.trim().toLowerCase()] ?? email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/espace/mot-de-passe`,
    });
    return error
      ? { success: false, message: "Impossible d'envoyer l'e-mail pour le moment. Réessayez plus tard." }
      : { success: true, message: `Si un compte existe pour ${target}, un lien de réinitialisation vient d'y être envoyé.` };
  };

  const logout = async () => {
    await createClient().auth.signOut();
    setUser(null);
    router.push("/connexion");
    router.refresh();
  };

  const canAccessPath = (path: string): boolean => {
    if (!user) return false;
    if (user.role === "directeur_general") return path.startsWith("/dashboard");
    // Pages autorisées = pages du menu de son rôle ; « /dashboard » n'ouvre que l'accueil
    const allowed = new Set([...allowedDashboardPaths(user.role), ...user.allowedPaths]);
    return [...allowed].some((a) => path === a || (a !== "/dashboard" && path.startsWith(a + "/")));
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, loginWithGoogle, logout, requestPasswordReset, canAccessPath, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  }
  return context;
}
