import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
    "./src/content/**/*.{js,ts,jsx,tsx}",
    "./src/context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Official Avenida Palette: Bleu, Rouge, Blanc
        avenida: {
          // Couleurs principales pilotées par des variables CSS (modifiables dans « Site web → Couleurs »)
          blue: {
            DEFAULT: "rgb(var(--av-blue) / <alpha-value>)",
            50: "#F0F5FA",
            100: "#E1ECF6",
            200: "#C4DAEC",
            300: "#97C0E0",
            400: "#64A0D1",
            500: "#3D82C0",
            600: "#2B67A4",
            700: "#205185",
            800: "#1A436D",
            900: "rgb(var(--av-blue) / <alpha-value>)",
            950: "rgb(var(--av-blue-950) / <alpha-value>)",
          },
          red: {
            DEFAULT: "#DC2626",
            50: "#FEF2F2",
            100: "#FEE2E2",
            200: "#FECACA",
            300: "#FCA5A5",
            400: "#F87171",
            500: "#EF4444",
            600: "#DC2626",
            700: "#B91C1C",
            800: "#991B1B",
            900: "#7F1D1D",
            950: "#450A0A",
          },
          white: "#FFFFFF",
        },
        // Site public : rouge vif franc (texte et accents) et or des étoles de remise des diplômes
        vif: {
          DEFAULT: "rgb(var(--vif) / <alpha-value>)",
          fonce: "rgb(var(--vif-fonce) / <alpha-value>)",
          clair: "rgb(var(--vif-clair) / <alpha-value>)",
        },
        or: {
          DEFAULT: "rgb(var(--or) / <alpha-value>)",
          clair: "rgb(var(--or-clair) / <alpha-value>)",
        },
        nuit: "rgb(var(--nuit) / <alpha-value>)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "'Plus Jakarta Sans'",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif)",
          "'Cinzel'",
          "'Playfair Display'",
          "Georgia",
          "serif",
        ],
        elegant: ["'Playfair Display'", "Georgia", "serif"],
        display: [
          "var(--font-display)",
          "'Outfit'",
          "'Plus Jakarta Sans'",
          "sans-serif",
        ],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
