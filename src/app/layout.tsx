import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { IncomingCall } from "@/components/chat/IncomingCall";
import { BackButton } from "@/components/pwa/BackButton";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { PwaSupport } from "@/components/pwa/PwaSupport";
import { PushPrompt } from "@/components/pwa/PushToggle";
import { SEO_KEYWORDS, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Hôtel École Avenida — Hôtel Avenida et École Avenida à Lomé (Togo)",
  description:
    "Site officiel de l'Hôtel École Avenida à Lomé (Togo) : l'École Avenida, école hôtelière (CFA, CAP, BEP, BT, BTS), et l'Hôtel Avenida, chambres et réservation en ligne.",
  keywords: SEO_KEYWORDS,
  authors: [{ name: "Hôtel École Avenida" }],
  creator: "Hôtel École Avenida",
  publisher: "Hôtel École Avenida",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Hôtel École Avenida",
    url: SITE_URL,
    images: [{ url: "/site/reel/facade-ecole.webp", width: 1600, height: 900, alt: "Hôtel École Avenida, Lomé" }],
  },
  twitter: { card: "summary_large_image" },
  // Codes de validation Google Search Console et Bing Webmaster Tools (variables Vercel)
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } } : {}),
  },
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
          <OfflineBanner />
          <BackButton />
          <PushPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
