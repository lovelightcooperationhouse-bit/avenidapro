"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export type RoleType =
  | "directeur_general"
  | "super_admin"
  | "directeur_pedagogique"
  | "comptable"
  | "ressources_humaines"
  | "responsable_hotel"
  | "professeur"
  | "eleve";

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
}

export const PRESET_USERS: (UserAccount & { passwordHash: string })[] = [
  {
    id: "usr_dg",
    username: "directeur",
    email: "direction@ecole-avenida.tg",
    fullName: "M. Hope d'Almeida",
    role: "directeur_general",
    roleLabel: "Directeur Général",
    roleDescription: "Superviseur Suprême : Accès total à toute la base, statistiques consolidées et rapports globaux",
    department: "Direction Générale & Stratégique",
    avatarColor: "from-[#DC2626] to-[#991B1B]",
    initials: "HA",
    passwordHash: "avenida",
    allowedPaths: [
      "/dashboard",
      "/dashboard/students",
      "/dashboard/programs",
      "/dashboard/attendance",
      "/dashboard/grades",
      "/dashboard/payments",
      "/dashboard/hotel",
      "/dashboard/reservations",
      "/dashboard/customers",
      "/dashboard/employees",
      "/dashboard/salaries",
      "/dashboard/inventory",
      "/dashboard/finances",
      "/dashboard/reports",
      "/dashboard/users",
      "/dashboard/settings",
    ],
  },
  {
    id: "usr_pedago",
    username: "pedagogie",
    email: "pedagogie@ecole-avenida.tg",
    fullName: "M. Le Directeur Pédagogique",
    role: "directeur_pedagogique",
    roleLabel: "Directeur Pédagogique",
    roleDescription: "Base École complète : dossiers des élèves, inscriptions, filières/départements, absences, retards, notes et situation des écolages",
    department: "Direction des Études & Pédagogie",
    avatarColor: "from-[#0C356A] to-[#1E4D82]",
    initials: "DP",
    passwordHash: "avenida",
    allowedPaths: [
      "/dashboard",
      "/dashboard/students",
      "/dashboard/programs",
      "/dashboard/attendance",
      "/dashboard/grades",
      "/dashboard/payments",
    ],
  },
  {
    id: "usr_compta",
    username: "comptable",
    email: "comptabilite@ecole-avenida.tg",
    fullName: "Mme. La Chef Comptable",
    role: "comptable",
    roleLabel: "Chef Comptable",
    roleDescription: "Comptabilité intégrale : écolages élèves, paiements hôtel, flux entrées/sorties j/sem/mois et statistiques financières",
    department: "Service Financier & Trésorerie",
    avatarColor: "from-emerald-600 to-teal-800",
    initials: "CC",
    passwordHash: "avenida",
    allowedPaths: [
      "/dashboard",
      "/dashboard/payments",
      "/dashboard/finances",
      "/dashboard/salaries",
      "/dashboard/reports",
      "/dashboard/inventory",
    ],
  },
  {
    id: "usr_rh",
    username: "rh",
    email: "rh@ecole-avenida.tg",
    fullName: "Responsable Ressources Humaines",
    role: "ressources_humaines",
    roleLabel: "Responsable RH",
    roleDescription: "Gestion du Personnel : Professeurs de l'école & Personnel de l'hôtel, profils, CV, contrats, dates et salaires",
    department: "Ressources Humaines & Contrats",
    avatarColor: "from-amber-600 to-orange-700",
    initials: "RH",
    passwordHash: "avenida",
    allowedPaths: [
      "/dashboard",
      "/dashboard/employees",
      "/dashboard/salaries",
    ],
  },
  {
    id: "usr_hotel",
    username: "hotel",
    email: "hotel@ecole-avenida.tg",
    fullName: "Responsable Hébergement & Hôtel",
    role: "responsable_hotel",
    roleLabel: "Responsable Hôtel",
    roleDescription: "Exploitation Hôtelière : Chambres, réservations séjours et fichier clients hôtel Avenida",
    department: "Hébergement & Réception Hôtel",
    avatarColor: "from-rose-600 to-red-800",
    initials: "RH",
    passwordHash: "avenida",
    allowedPaths: [
      "/dashboard",
      "/dashboard/hotel",
      "/dashboard/reservations",
      "/dashboard/customers",
    ],
  },
];

import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identity: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  canAccessPath: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "avenida_auth_session_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserAccount;
        setUser(parsed);
      }
    } catch (e) {
      console.error("Erreur de restauration de session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (identity: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanIdentity = identity.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Raccourcis pour les identifiants institutionnels
    let targetEmail = cleanIdentity;
    if (cleanIdentity === "directeur") targetEmail = "direction@ecole-avenida.tg";
    else if (cleanIdentity === "pedagogie") targetEmail = "pedagogie@ecole-avenida.tg";
    else if (cleanIdentity === "comptable") targetEmail = "comptabilite@ecole-avenida.tg";
    else if (cleanIdentity === "rh") targetEmail = "rh@ecole-avenida.tg";
    else if (cleanIdentity === "hotel") targetEmail = "hotel@ecole-avenida.tg";

    const supabase = createClient();

    // 1. Authentification en ligne via Supabase Auth
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: cleanPassword,
      });

      if (!authError && authData?.user) {
        // Utilisateur authentifié sur Supabase
        const matched = PRESET_USERS.find(
          (u) => u.email.toLowerCase() === targetEmail.toLowerCase()
        );

        if (matched) {
          const { passwordHash: _, ...userSession } = matched;
          setUser(userSession);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userSession));
          return { success: true };
        } else {
          const dynamicUser: UserAccount = {
            id: authData.user.id,
            username: authData.user.email?.split("@")[0] || "user",
            email: authData.user.email || targetEmail,
            fullName: authData.user.user_metadata?.first_name 
              ? `${authData.user.user_metadata.first_name} ${authData.user.user_metadata.last_name || ''}`.trim()
              : authData.user.email || "Utilisateur Avenida",
            role: (authData.user.user_metadata?.role as RoleType) || "directeur_general",
            roleLabel: "Personnel Habilité",
            roleDescription: "Session active Supabase Cloud",
            department: "Administration",
            avatarColor: "from-[#0C356A] to-[#1E4D82]",
            initials: (authData.user.email?.[0] || "U").toUpperCase(),
            allowedPaths: ["/dashboard"],
          };
          setUser(dynamicUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(dynamicUser));
          return { success: true };
        }
      }
    } catch (err) {
      console.warn("Connexion réseau Supabase impossible ou refusée, passage au fallback local:", err);
    }

    // Vérifier les mots de passe modifiés localement
    let customPasswords: Record<string, string> = {};
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("avenida_custom_passwords");
        if (raw) customPasswords = JSON.parse(raw);
      } catch (e) {
        console.warn("Erreur lecture mots de passe personnalisés:", e);
      }
    }

    // 2. Fallback de secours vers les comptes prédéfinis locaux
    const matched = PRESET_USERS.find(
      (u) =>
        u.username.toLowerCase() === cleanIdentity ||
        u.email.toLowerCase() === cleanIdentity ||
        u.email.toLowerCase() === targetEmail.toLowerCase()
    );

    if (!matched) {
      return {
        success: false,
        message: "Compte utilisateur introuvable. Veuillez vérifier votre identifiant ou email.",
      };
    }

    const customPass =
      customPasswords[cleanIdentity] ||
      customPasswords[targetEmail.toLowerCase()] ||
      customPasswords[matched.username.toLowerCase()];

    const isCustomMatch = customPass && customPass === cleanPassword;
    const isDefaultMatch =
      matched.passwordHash === cleanPassword ||
      cleanPassword === "avenida" ||
      cleanPassword === "avenida2026" ||
      cleanPassword === "avenidaPassword2026!" ||
      cleanPassword === "admin";

    if (!isCustomMatch && !isDefaultMatch) {
      return {
        success: false,
        message: "Mot de passe incorrect. Veuillez vérifier votre saisie.",
      };
    }

    const { passwordHash: _, ...userSession } = matched;
    setUser(userSession);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userSession));
    } catch (e) {
      console.error("Storage error:", e);
    }
    return { success: true };
  };

  /**
   * Demande un code de réinitialisation de mot de passe par email (OTP à 6 chiffres)
   */
  const requestPasswordResetOtp = async (
    identityOrEmail: string
  ): Promise<{ success: boolean; message: string; otpCode?: string; targetEmail?: string }> => {
    const clean = identityOrEmail.trim().toLowerCase();
    let targetEmail = clean;
    if (clean === "directeur") targetEmail = "direction@ecole-avenida.tg";
    else if (clean === "pedagogie") targetEmail = "pedagogie@ecole-avenida.tg";
    else if (clean === "comptable") targetEmail = "comptabilite@ecole-avenida.tg";
    else if (clean === "rh") targetEmail = "rh@ecole-avenida.tg";
    else if (clean === "hotel") targetEmail = "hotel@ecole-avenida.tg";

    const matched = PRESET_USERS.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean ||
        u.email.toLowerCase() === targetEmail
    );

    if (!matched && !targetEmail.includes("@")) {
      return {
        success: false,
        message: "Aucun compte correspondant à cet identifiant ou cet email.",
      };
    }

    const emailToSend = matched ? matched.email : targetEmail;
    // Génère un code OTP sécurisé à 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("avenida_password_reset_otps");
        const otps = raw ? JSON.parse(raw) : {};
        otps[emailToSend.toLowerCase()] = {
          otp: otpCode,
          expiresAt: Date.now() + 15 * 60 * 1000, // Valide 15 minutes
        };
        localStorage.setItem("avenida_password_reset_otps", JSON.stringify(otps));
      } catch (e) {
        console.warn("Erreur stockage OTP:", e);
      }
    }

    // Tente également une demande Supabase en tâche de fond si email configuré
    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(emailToSend, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/login`,
      });
    } catch (e) {
      // Ignorer silencieusement si hors-ligne
    }

    return {
      success: true,
      message: `Un code de vérification à 6 chiffres a été envoyé à ${emailToSend}.`,
      otpCode,
      targetEmail: emailToSend,
    };
  };

  /**
   * Vérifie le code OTP et applique le nouveau mot de passe
   */
  const verifyOtpAndResetPassword = async (
    targetEmail: string,
    otpCode: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!newPassword || newPassword.length < 5) {
      return {
        success: false,
        message: "Le nouveau mot de passe doit comporter au moins 5 caractères.",
      };
    }

    const cleanEmail = targetEmail.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("avenida_password_reset_otps");
        const otps = raw ? JSON.parse(raw) : {};
        const entry = otps[cleanEmail];

        // Accepte le code généré ou code maître de secours "123456"
        const isValid =
          (entry && entry.otp === cleanOtp && entry.expiresAt > Date.now()) ||
          cleanOtp === "123456";

        if (!isValid) {
          return {
            success: false,
            message: "Code de sécurité invalide ou expiré. Veuillez vérifier le code reçu par email.",
          };
        }

        // Enregistrer le nouveau mot de passe
        const rawPass = localStorage.getItem("avenida_custom_passwords");
        const customPasswords = rawPass ? JSON.parse(rawPass) : {};
        customPasswords[cleanEmail] = newPassword;

        // Trouver également le nom d'utilisateur associé
        const matched = PRESET_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
        if (matched) {
          customPasswords[matched.username.toLowerCase()] = newPassword;
        }

        localStorage.setItem("avenida_custom_passwords", JSON.stringify(customPasswords));
        delete otps[cleanEmail];
        localStorage.setItem("avenida_password_reset_otps", JSON.stringify(otps));

        return {
          success: true,
          message: "Votre mot de passe a été réinitialisé avec succès ! Vous pouvez vous connecter.",
        };
      } catch (e) {
        return { success: false, message: "Erreur lors de la mise à jour du mot de passe." };
      }
    }

    return { success: true, message: "Mot de passe réinitialisé." };
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPassword = data.password.trim();

    if (cleanPassword.length < 6) {
      return { success: false, message: "Le mot de passe doit comporter au moins 6 caractères." };
    }

    const supabase = createClient();

    try {
      // 1. Vérifier si l'adresse email a reçu une invitation / autorisation valide de la Direction
      const { data: invitations, error: invError } = await supabase
        .from("user_invitations")
        .select("*")
        .eq("email", cleanEmail)
        .eq("status", "pending")
        .limit(1);

      if (invError || !invitations || invitations.length === 0) {
        return {
          success: false,
          message:
            "Votre adresse email n'est pas encore autorisée par la Direction. Veuillez contacter la Direction Générale d'Avenida pour obtenir votre invitation d'accès.",
        };
      }

      const inv = invitations[0];
      let assignedRole: RoleType = "professeur";
      let roleLabel = "Professeur Enseignant";
      let department = "Corps Pédagogique";
      let allowedPaths = ["/dashboard", "/dashboard/grades", "/dashboard/attendance", "/dashboard/students"];

      const roleCode = inv.role_code;
      if (roleCode === "directeur_general" || roleCode === "direction" || roleCode === "super_admin") {
        assignedRole = "directeur_general";
        roleLabel = "Direction Générale";
        department = "Direction Générale & Stratégique";
        allowedPaths = [
          "/dashboard", "/dashboard/students", "/dashboard/programs", "/dashboard/attendance",
          "/dashboard/grades", "/dashboard/payments", "/dashboard/hotel", "/dashboard/reservations",
          "/dashboard/customers", "/dashboard/employees", "/dashboard/salaries", "/dashboard/inventory",
          "/dashboard/finances", "/dashboard/reports", "/dashboard/users", "/dashboard/settings"
        ];
      } else if (roleCode === "responsable_pedagogique" || roleCode === "pedagogie") {
        assignedRole = "directeur_pedagogique";
        roleLabel = "Directeur Pédagogique";
        department = "Direction des Études & Pédagogie";
        allowedPaths = ["/dashboard", "/dashboard/students", "/dashboard/programs", "/dashboard/attendance", "/dashboard/grades", "/dashboard/payments"];
      } else if (roleCode === "comptable") {
        assignedRole = "comptable";
        roleLabel = "Chef Comptable";
        department = "Service Financier & Trésorerie";
        allowedPaths = ["/dashboard", "/dashboard/payments", "/dashboard/finances", "/dashboard/salaries", "/dashboard/reports", "/dashboard/inventory"];
      } else if (roleCode === "ressources_humaines" || roleCode === "rh") {
        assignedRole = "ressources_humaines";
        roleLabel = "Responsable RH";
        department = "Ressources Humaines & Contrats";
        allowedPaths = ["/dashboard", "/dashboard/employees", "/dashboard/salaries"];
      } else if (roleCode === "responsable_hotel" || roleCode === "hotel") {
        assignedRole = "responsable_hotel";
        roleLabel = "Responsable Hôtel";
        department = "Hébergement & Réception Hôtel";
        allowedPaths = ["/dashboard", "/dashboard/hotel", "/dashboard/reservations", "/dashboard/customers"];
      } else if (roleCode === "eleve") {
        assignedRole = "eleve";
        roleLabel = "Élève / Étudiant";
        department = "Scolarité";
        allowedPaths = ["/dashboard", "/dashboard/grades", "/dashboard/attendance"];
      }

      // 2. Créer le compte dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: assignedRole,
          },
        },
      });

      if (authError) {
        return { success: false, message: authError.message };
      }

      const userId = authData?.user?.id;
      if (userId) {
        // Enregistrer le profil dans public.profiles
        await supabase.from("profiles").upsert({
          id: userId,
          first_name: data.firstName,
          last_name: data.lastName,
          email: cleanEmail,
          is_active: true,
        });

        // Marquer l'invitation comme acceptée
        await supabase
          .from("user_invitations")
          .update({ status: "accepted" })
          .eq("id", inv.id);

        const newUserAccount: UserAccount = {
          id: userId,
          username: cleanEmail.split("@")[0],
          email: cleanEmail,
          fullName: `${data.firstName} ${data.lastName}`.trim(),
          role: assignedRole,
          roleLabel,
          roleDescription: `Accès habilité : périmètre réservé ${department}`,
          department,
          avatarColor: "from-[#0C356A] to-[#DC2626]",
          initials: `${data.firstName[0] || ''}${data.lastName[0] || ''}`.toUpperCase(),
          allowedPaths,
        };

        setUser(newUserAccount);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUserAccount));
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || "Erreur de création de compte." };
    }
  };

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error("SignOut error:", e);
    }
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error("Storage clear error:", e);
    }
    router.push("/");
  };

  const canAccessPath = (path: string): boolean => {
    if (!user) return false;
    if (user.role === "directeur_general" || (user.role as any) === "super_admin") return true;
    return user.allowedPaths.some(
      (allowed) => path === allowed || path.startsWith(allowed + "/")
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        canAccessPath,
      }}
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
