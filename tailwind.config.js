/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
      },
      borderRadius: {
        lg: "var(--border-radius)",
      },
      boxShadow: {
        premium: "var(--box-shadow)",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-space-mono)", "ui-monospace", "monospace"],
      },
      minHeight: {
        dvh: "100dvh",
        screen: "calc(var(--vh, 1vh) * 100)",
      },
      padding: {
        safe: "env(safe-area-inset-bottom)",
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-x": "max(1rem, env(safe-area-inset-left))",
      },
      spacing: {
        "header": "3.75rem",
        "header-sm": "3.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
