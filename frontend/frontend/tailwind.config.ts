import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["IBM Plex Mono", "Courier New", "monospace"],
        sans: ["IBM Plex Sans", "sans-serif"],
      },
      colors: {
        base: "#0a0d12",
        panel: "#0f1318",
        surface: "#141820",
        elevated: "#1a1f28",
        hover: "#1e2430",
        border: {
          DEFAULT: "#1e2635",
          mid: "#263040",
          hi: "#2e3a4a",
        },
        text: {
          primary: "#d4dbe8",
          secondary: "#7a8a9e",
          muted: "#4a5568",
          dim: "#2d3748",
        },
        accent: {
          red: "#e03c3c",
          amber: "#d4833a",
          green: "#2e7d52",
          blue: "#2a5fa5",
          teal: "#1e6b6b",
        },
        signal: {
          red: "#e05555",
          amber: "#d4a23a",
          green: "#3aaa6b",
          blue: "#4a8fd4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
