
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public_react/index.html", // Path to your React app's main HTML file
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
