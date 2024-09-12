/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      spacing:{
        "128": "42rem",
        "120": "36rem"
      }
    },
  },
  plugins: [],
}

