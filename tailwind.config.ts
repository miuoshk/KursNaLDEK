import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#002A27",
        sidebar: "#051615",
        card: { DEFAULT: "#0a2322", hover: "#0d2b2a" },
        border: "#163b39",
        brand: {
          bg: "#002A27",
          "card-1": "#0a2322",
          "card-2": "#0d2b2a",
          accent: "#003932",
          "accent-2": "#274E34",
          sage: "#367368",
          gold: "#C9A84C",
        },
        success: "#4ADE80",
        error: "#F87171",
        warning: "#FBBF24",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "ui-serif", "Georgia", "serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "14px",
        btn: "8px",
        pill: "24px",
      },
      fontSize: {
        "heading-xl": ["28px", { lineHeight: "1.2", fontWeight: "400" }],
        "heading-lg": ["24px", { lineHeight: "1.25", fontWeight: "400" }],
        "heading-md": ["20px", { lineHeight: "1.3", fontWeight: "400" }],
        "heading-sm": ["18px", { lineHeight: "1.35", fontWeight: "400" }],
        "body-lg": ["17px", { lineHeight: "1.55", fontWeight: "400" }],
        "body-md": ["15px", { lineHeight: "1.55", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-xs": ["11px", { lineHeight: "1.45", fontWeight: "400" }],
      },
      keyframes: {
        "pulse-gold": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "slide-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-left": {
          "0%": { transform: "translateX(12px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-left": "slide-left 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
