/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // High-contrast, senior-friendly palette (WCAG AA-oriented). Values are
      // CSS custom properties (defined in index.css) so the Settings page's
      // contrast toggle can swap the whole palette at runtime without every
      // component needing to know contrast mode exists.
      colors: {
        ink: "var(--color-ink)",
        paper: "var(--color-paper)",
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",
        accent: "var(--color-accent)",
      },
      fontSize: {
        base: ["1.25rem", "1.8"],
        lg: ["1.5rem", "1.8"],
        xl: ["1.875rem", "1.6"],
        "2xl": ["2.25rem", "1.5"],
      },
    },
  },
  plugins: [],
};
