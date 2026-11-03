/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0C162A",
        cardBg: "#16253F",
        cardBorder: "#243452",
        accentGreen: "#26D28B",
        accentCyan: "#42BEE2",
        accentYellow: "#FFBE4B",
        accentDanger: "#FF646E",
        textMain: "#F5F8FC",
        textMuted: "#8E9EBA",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
