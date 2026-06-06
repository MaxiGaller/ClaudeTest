import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tiefes Mitternachtsblau für Hintergründe/Flächen.
        ink: {
          950: "#060b16",
          900: "#0a1322",
          850: "#0d1828",
          800: "#101f34",
          700: "#172a45",
          600: "#1f3a5f",
        },
        // Primär: Blautöne.
        brand: {
          50: "#eff8ff",
          100: "#dbeefe",
          200: "#bae2fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
        // Akzent: Grün-/Türkistöne.
        accent: {
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(56,189,248,0.10), 0 18px 50px -20px rgba(16,185,129,0.35)",
        card: "0 20px 45px -25px rgba(2,8,23,0.9)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
        "accent-gradient": "linear-gradient(135deg, #34d399 0%, #14b8a6 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
