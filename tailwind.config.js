/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom palette based on prompt
        primary: {
           DEFAULT: '#059669', // emerald-600
        },
        warning: {
           DEFAULT: '#fef3c7', // amber-100
        },
        danger: {
           DEFAULT: '#ffe4e6', // rose-100
        }
      }
    },
  },
  plugins: [],
}
