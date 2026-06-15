/** @type {import('tailwindcss').Config} */
export default {
  content: [  
    "./index.html",  
    "./src/**/*.{js,ts,jsx,tsx}",  
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF4E25",
        secondary: "#101E3C",
        background: "#F8F9FB",
        textBgLight: "rgba(255, 78, 37, 0.12)",
        textBgSoft: "#FAF9F6",
        "brand-orange": "#FF4E25",
        "brand-navy": "#101E3C",
        "brand-blue": "#1E2E4F",
        "brand-cream": "#FAF9F6",
        "jl-bg": "#F8F9FB",
        "jl-surface": "#FFFFFF",
        "jl-muted": "#F1F3F6",
        "jl-border": "#E8EAEF",
        "jl-accent": "#FF4E25",
        "jl-text": "#111827",
        "jl-text-secondary": "#6B7280",
        "jl-text-muted": "#9CA3AF",
      },
      fontFamily: {
        primary: ["Syne", "serif"], // Add "Roboto" as your primary font
        secondary: ["Outfit", "serif"],   // Add "Lobster" as a secondary font
      },
      keyframes: {
        slideDown: {
          from: { transform: "translateY(-100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        slideDown: "slideDown 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
