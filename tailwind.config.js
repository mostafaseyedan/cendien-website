/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Ensure this path is correct relative to your project root
    "./src/**/*.{js,ts,jsx,tsx}", // Scans all JS/JSX files in src
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // From your new design
      },
    },
  },
  plugins: [],
}
