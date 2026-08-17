/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens backed by CSS variables (see index.css).
        // Stored as "R G B" channels so Tailwind opacity modifiers (/70) work.
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        line: "rgb(var(--c-border) / <alpha-value>)",
        foreground: "rgb(var(--c-fg) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        charcoal: "rgb(var(--c-charcoal) / <alpha-value>)",
        pitch: {
          DEFAULT: "rgb(var(--c-pitch) / <alpha-value>)",
          strong: "rgb(var(--c-pitch-strong) / <alpha-value>)",
          soft: "rgb(var(--c-pitch-soft) / <alpha-value>)",
          fg: "rgb(var(--c-pitch-fg) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--c-accent) / <alpha-value>)",
          fg: "rgb(var(--c-accent-fg) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Archivo", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 12px 40px -12px rgb(var(--c-shadow) / 0.18)",
        lift: "0 26px 60px -18px rgb(var(--c-shadow) / 0.28)",
        glow: "0 0 0 1px rgb(var(--c-pitch) / 0.35), 0 18px 46px -14px rgb(var(--c-pitch) / 0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
      },
      backgroundImage: {
        "pitch-lines":
          "repeating-linear-gradient(0deg, transparent, transparent 46px, rgb(var(--c-pitch) / 0.05) 46px, rgb(var(--c-pitch) / 0.05) 47px)",
      },
    },
  },
  plugins: [],
};
