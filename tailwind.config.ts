import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Tahoma", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#07070f",
          900: "#0c0c18",
          800: "#12121f",
          700: "#1a1a2b",
          600: "#242438",
        },
        brand: {
          pink: "#e1306c",
          purple: "#833ab4",
          orange: "#fd1d1d",
          yellow: "#fcb045",
        },
      },
      boxShadow: {
        glow: "0 0 60px -12px rgba(225, 48, 108, 0.45)",
        card: "0 20px 60px -20px rgba(0, 0, 0, 0.7)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "fade-up": "fade-up 0.7s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
