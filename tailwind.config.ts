import type { Config } from "tailwindcss";

export default {
  presets: [require("catppuccin-neu/tailwind/preset.cjs")],
  content: ["./index.html", "./src/client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      /* Point animate-pulse at its own keyframes: Tailwind's default emits
         unlayered `@keyframes pulse`, which would clobber the package's pulse
         (the .live-dot halo ping). */
      keyframes: {
        "tw-pulse": {
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        pulse: "tw-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
