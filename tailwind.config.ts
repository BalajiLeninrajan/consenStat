import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        crust: "var(--crust)",
        mantle: "var(--mantle)",
        base: "var(--base)",
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
        },
        overlay: {
          0: "var(--overlay-0)",
          1: "var(--overlay-1)",
          2: "var(--overlay-2)",
        },
        subtext: {
          0: "var(--subtext-0)",
          1: "var(--subtext-1)",
        },
        text: "var(--text)",
        mauve: "var(--mauve)",
        pink: "var(--pink)",
        red: "var(--red)",
        peach: "var(--peach)",
        yellow: "var(--yellow)",
        green: "var(--green)",
        teal: "var(--teal)",
        blue: "var(--blue)",
      },
      fontFamily: {
        sans: ["var(--sans)"],
        mono: ["var(--mono)"],
      },
    },
  },
  plugins: [],
} satisfies Config;
