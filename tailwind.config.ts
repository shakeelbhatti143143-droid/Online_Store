import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080B11",
        surface: {
          50: "#1A2234",
          100: "#141A28",
          200: "#0F1420",
          300: "#0B0F19",
          DEFAULT: "#0D121D",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.07)",
          light: "rgba(255, 255, 255, 0.12)",
          highlight: "rgba(255, 255, 255, 0.2)",
        },
        gold: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        accent: {
          cyan: "#06B6D4",
          violet: "#8B5CF6",
          rose: "#F43F5E",
          emerald: "#10B981",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(245, 158, 11, 0.2)" },
          "100%": { boxShadow: "0 0 30px rgba(245, 158, 11, 0.6)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "luxury-gradient": "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
};
export default config;
