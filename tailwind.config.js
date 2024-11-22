/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "custom-pink": "#f5426c",
        "custom-mint": "#42f5a1",
      },
    },
    fontFamily: {
      roboto: ["Roboto", "sans-serif"],
      "roboto-mono": ["Roboto Mono", "monospace"],
      "roboto-condensed": ["Roboto Condensed", "sans-serif"],
      "roboto-condensed-mono": ["Roboto Condensed Mono", "monospace"],
    },
  },
  plugins: [require("tailwindcss-motion")],
  darkMode: 'class',
};