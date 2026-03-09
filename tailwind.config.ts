import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        coral: "#f97316",
        lagoon: "#0f766e",
        gold: "#facc15",
        panel: "#fff8ed",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Manrope'", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 60px rgba(15, 23, 42, 0.14)",
      },
    },
  },
  plugins: [],
} satisfies Config;
