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
        card: "var(--color-card)",
        highlight: "var(--color-highlight)",
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",
        accent: "var(--color-accent)",
        muted: "var(--color-muted)",
        frame: "var(--color-frame)",
        "label-target": "var(--label-color-target)",
        "label-amount": "var(--label-color-amount)",
        "label-apply": "var(--label-color-apply)",
        "label-note": "var(--label-color-note)",
        "label-caution": "var(--label-color-caution)",
        "label-contact": "var(--label-color-contact)",
      },
      fontSize: {
        base: ["1.25rem", "1.8"],
        lg: ["1.5rem", "1.8"],
        xl: ["1.875rem", "1.6"],
        "2xl": ["2.25rem", "1.5"],
      },
      boxShadow: {
        sticker: "4px 4px 0 0 var(--color-ink)",
        "sticker-sm": "3px 3px 0 0 var(--color-ink)",
      },
    },
  },
  plugins: [],
};
