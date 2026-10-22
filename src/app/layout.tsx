import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { IncomingCall } from "@/components/chat/IncomingCall";
import { PwaSupport } from "@/components/pwa/PwaSupport";
import { PushPrompt } from "@/components/pwa/PushToggle";

export const metadata: Metadata = {
  title: "Avenida Management — Plateforme Intégrée Hôtel École Avenida",
  description:
    "Logiciel SaaS de gestion intégrée pour l'Hôtel École Avenida : administration scolaire, gestion des élèves, carnet numérique, scolarité, gestion hôtelière et RH.",
  applicationName: "Avenida",
  // Installation comme application sur iPhone / iPad
  appleWebApp: { capable: true, title: "Avenida", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32" }, { url: "/icons/icon-192.png", sizes: "192x192" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0C356A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased bg-slate-50 text-slate-900 selection:bg-[#0C356A] selection:text-white">
        <AuthProvider>
          {children}
          <IncomingCall />
          <PwaSupport />
          <PushPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
