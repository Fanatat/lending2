import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "var(--bg-void)",
        panel: "var(--bg-panel)",
        fg: {
          primary: "var(--fg-primary)",
          muted: "var(--fg-muted)",
        },
        accent: "var(--accent)",
        line: "var(--line)",
        matrix: {
          bg: "var(--matrix-bg)",
          fg: "var(--matrix-fg)",
        },
      },
      fontFamily: {
        mono: [
          "var(--font-jetbrains-mono)",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
