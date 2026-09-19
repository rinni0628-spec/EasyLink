/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // High-contrast, senior-friendly palette (WCAG AA-oriented).
      colors: {
        ink: "#111111",
        paper: "#ffffff",
        primary: "#1a3fa9",
        "primary-dark": "#122c78",
        accent: "#b3261e",
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
