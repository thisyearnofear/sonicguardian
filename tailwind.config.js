/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
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
        },
    },
    plugins: [require("tailwindcss-animate")],
};
