/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    fontFamily: {
      'roboto': ['Roboto', 'sans-serif'],
      'roboto-mono': ['Roboto Mono', 'monospace'],
      'roboto-condensed': ['Roboto Condensed', 'sans-serif'],
      'roboto-condensed-mono': ['Roboto Condensed Mono', 'monospace'],
    }
  },
  plugins: [],
}
