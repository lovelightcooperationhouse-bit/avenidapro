import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Avenida Management — Plateforme Intégrée Hôtel École Avenida",
  description:
    "Logiciel SaaS de gestion intégrée pour l'Hôtel École Avenida : administration scolaire, gestion des élèves, carnet numérique, scolarité, gestion hôtelière et RH.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full font-sans antialiased bg-slate-50 text-slate-900 selection:bg-[#0C356A] selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
