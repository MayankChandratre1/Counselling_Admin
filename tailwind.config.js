/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        highlight: {
          '0%': { backgroundColor: 'rgb(254 249 195)' },  // yellow-100
          '100%': { backgroundColor: 'transparent' },
        }
      },
      animation: {
        highlight: 'highlight 1s ease-out',
      }
    },
  },
  plugins: [],
}
