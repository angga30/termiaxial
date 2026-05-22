/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg0: "#0a0a0f",
        bg1: "#12121a",
        bg2: "#1a1a25",
        cyan: "#00f0ff",
        pink: "#ff006e",
        purple: "#8338ec",
        ok: "#00ff88",
        warn: "#ffbe0b",
        err: "#ff4040",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
        sans: ['"Space Grotesk"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
